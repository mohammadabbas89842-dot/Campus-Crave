-- ========================================================================
-- CampusBite - Smart College Canteen Management System
-- Supabase Migration: 001_initial_schema.sql
-- ========================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================================================
-- 1. TABLES
-- ========================================================================

-- 1.1 PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'staff', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.2 CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.3 FOOD ITEMS
CREATE TABLE IF NOT EXISTS public.food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  is_vegetarian BOOLEAN NOT NULL DEFAULT TRUE,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  preparation_time_minutes INTEGER NOT NULL DEFAULT 10 CHECK (preparation_time_minutes >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.4 PICKUP SLOTS (Queue reduction & time-slot booking)
CREATE TABLE IF NOT EXISTS public.pickup_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.5 ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pickup_slot_id UUID NOT NULL REFERENCES public.pickup_slots(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  special_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.6 ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  food_item_id UUID NOT NULL REFERENCES public.food_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0)
);

-- 1.7 PAYMENTS (Razorpay & Campus methods)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
  transaction_id TEXT,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.8 REVIEWS & FEEDBACK
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  food_item_id UUID NOT NULL REFERENCES public.food_items(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================================
-- 2. HELPER FUNCTIONS & TRIGGERS
-- ========================================================================

-- Helper function to fetch current authenticated user's role without RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 'anon';
  END IF;
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN COALESCE(v_role, 'student');
END;
$$;

-- Trigger: Automatically create student profile upon signup in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'student', -- Enforce student role default; never allow self-assigned staff/admin
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Update updated_at on record change
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_food_items_updated_at ON public.food_items;
CREATE TRIGGER trg_food_items_updated_at
  BEFORE UPDATE ON public.food_items
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- ========================================================================
-- 3. CONCURRENCY-SAFE ATOMIC ORDER CREATION (RPC)
-- ========================================================================

CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_pickup_slot_id UUID,
  p_items JSONB, -- Array of objects: [{"food_item_id": "uuid", "quantity": 2}]
  p_special_instructions TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT 0,
  p_payment_method TEXT DEFAULT 'upi',
  p_transaction_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
  v_slot_capacity INT;
  v_current_bookings INT;
  v_order_id UUID;
  v_order_num TEXT;
  v_subtotal NUMERIC := 0;
  v_total NUMERIC := 0;
  v_item JSONB;
  v_item_id UUID;
  v_qty INT;
  v_unit_price NUMERIC;
  v_is_available BOOLEAN;
  v_item_subtotal NUMERIC;
  v_result JSONB;
BEGIN
  -- Authenticated user validation
  v_student_id := auth.uid();
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to place an order.';
  END IF;

  -- 1. Row-level lock on the pickup slot to prevent overselling
  SELECT capacity INTO v_slot_capacity
  FROM public.pickup_slots
  WHERE id = p_pickup_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The selected pickup slot does not exist.';
  END IF;

  -- Count existing active (non-cancelled) bookings for this slot
  SELECT COUNT(*) INTO v_current_bookings
  FROM public.orders
  WHERE pickup_slot_id = p_pickup_slot_id
    AND status != 'cancelled';

  IF v_current_bookings >= v_slot_capacity THEN
    RAISE EXCEPTION 'Selected pickup slot is at maximum capacity. Please pick another slot.';
  END IF;

  -- 2. Validate items and compute server-verified subtotal
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty. Please select at least one item.';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_id := (v_item->>'food_item_id')::UUID;
    v_qty := (v_item->>'quantity')::INT;

    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Quantity for item % must be greater than zero.', v_item_id;
    END IF;

    SELECT price, is_available INTO v_unit_price, v_is_available
    FROM public.food_items
    WHERE id = v_item_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Food item % was not found in the canteen menu.', v_item_id;
    END IF;

    IF NOT v_is_available THEN
      RAISE EXCEPTION 'Food item % is currently sold out.', v_item_id;
    END IF;

    v_item_subtotal := v_unit_price * v_qty;
    v_subtotal := v_subtotal + v_item_subtotal;
  END LOOP;

  v_total := GREATEST(0, v_subtotal - COALESCE(p_discount_amount, 0));

  -- 3. Generate unique human-readable order number
  v_order_num := 'CB-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');

  -- 4. Insert into orders table
  INSERT INTO public.orders (
    order_number,
    student_id,
    pickup_slot_id,
    status,
    payment_status,
    subtotal,
    discount_amount,
    total_amount,
    special_instructions,
    created_at,
    updated_at
  )
  VALUES (
    v_order_num,
    v_student_id,
    p_pickup_slot_id,
    'confirmed',
    CASE WHEN p_payment_method = 'canteen_cash' THEN 'unpaid' ELSE 'paid' END,
    v_subtotal,
    COALESCE(p_discount_amount, 0),
    v_total,
    p_special_instructions,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_order_id;

  -- 5. Insert order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_id := (v_item->>'food_item_id')::UUID;
    v_qty := (v_item->>'quantity')::INT;

    SELECT price INTO v_unit_price FROM public.food_items WHERE id = v_item_id;
    v_item_subtotal := v_unit_price * v_qty;

    INSERT INTO public.order_items (
      order_id,
      food_item_id,
      quantity,
      unit_price,
      subtotal
    )
    VALUES (
      v_order_id,
      v_item_id,
      v_qty,
      v_unit_price,
      v_item_subtotal
    );
  END LOOP;

  -- 6. Insert initial payment record
  INSERT INTO public.payments (
    order_id,
    payment_method,
    payment_status,
    transaction_id,
    amount,
    created_at
  )
  VALUES (
    v_order_id,
    p_payment_method,
    CASE WHEN p_payment_method = 'canteen_cash' THEN 'pending' ELSE 'paid' END,
    COALESCE(p_transaction_id, 'TXN_' || v_order_num),
    v_total,
    NOW()
  );

  -- 7. Return created order JSON
  SELECT jsonb_build_object(
    'id', o.id,
    'order_number', o.order_number,
    'status', o.status,
    'payment_status', o.payment_status,
    'subtotal', o.subtotal,
    'discount_amount', o.discount_amount,
    'total_amount', o.total_amount,
    'created_at', o.created_at
  ) INTO v_result
  FROM public.orders o
  WHERE o.id = v_order_id;

  RETURN v_result;
END;
$$;

-- ========================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 4.1 PROFILES POLICIES
CREATE POLICY "Users can read own profile; staff can read all" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.get_current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Users can update own details" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid()) OR public.get_current_user_role() = 'admin')
  );

-- 4.2 CATEGORIES POLICIES
CREATE POLICY "Public read categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Staff & admin manage categories" ON public.categories
  FOR ALL USING (public.get_current_user_role() IN ('staff', 'admin'));

-- 4.3 FOOD ITEMS POLICIES
CREATE POLICY "Public read food items" ON public.food_items
  FOR SELECT USING (true);

CREATE POLICY "Staff & admin manage food items" ON public.food_items
  FOR ALL USING (public.get_current_user_role() IN ('staff', 'admin'));

-- 4.4 PICKUP SLOTS POLICIES
CREATE POLICY "Public read pickup slots" ON public.pickup_slots
  FOR SELECT USING (true);

CREATE POLICY "Staff & admin manage pickup slots" ON public.pickup_slots
  FOR ALL USING (public.get_current_user_role() IN ('staff', 'admin'));

-- 4.5 ORDERS POLICIES
CREATE POLICY "Students read own orders; staff read all" ON public.orders
  FOR SELECT USING (auth.uid() = student_id OR public.get_current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Students insert orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = student_id OR public.get_current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Staff update order status; students cancel pending" ON public.orders
  FOR UPDATE USING (
    public.get_current_user_role() IN ('staff', 'admin')
    OR (auth.uid() = student_id AND status IN ('pending', 'confirmed'))
  );

-- 4.6 ORDER ITEMS POLICIES
CREATE POLICY "Read order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.student_id = auth.uid() OR public.get_current_user_role() IN ('staff', 'admin'))
    )
  );

CREATE POLICY "Insert order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.student_id = auth.uid() OR public.get_current_user_role() IN ('staff', 'admin'))
    )
  );

-- 4.7 PAYMENTS POLICIES
CREATE POLICY "Read payment records" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payments.order_id
        AND (o.student_id = auth.uid() OR public.get_current_user_role() IN ('staff', 'admin'))
    )
  );

CREATE POLICY "Insert payment records" ON public.payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payments.order_id
        AND (o.student_id = auth.uid() OR public.get_current_user_role() IN ('staff', 'admin'))
    )
  );

-- 4.8 REVIEWS POLICIES
CREATE POLICY "Public read reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Students insert reviews for completed items" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- ========================================================================
-- 5. REALTIME PUBLICATION
-- ========================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.food_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pickup_slots;

-- ========================================================================
-- 6. SEED DATA (CATEGORIES, FOOD ITEMS, PICKUP SLOTS)
-- ========================================================================

-- Insert Categories
INSERT INTO public.categories (id, name, description) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Breakfast', 'Morning energy bowls, south Indian, parathas, and light bites'),
  ('11111111-1111-1111-1111-111111111102', 'Snacks', 'Quick bite samosas, burgers, rolls, and fries'),
  ('11111111-1111-1111-1111-111111111103', 'Meals', 'Hearty wholesome Indian lunch thalis, combo meals, and rice plates'),
  ('11111111-1111-1111-1111-111111111104', 'Beverages', 'Cold coffee, fresh lime sodas, juices, and hot masala tea'),
  ('11111111-1111-1111-1111-111111111105', 'Desserts', 'Traditional sweets, gulab jamuns, ice creams, and brownies')
ON CONFLICT (name) DO NOTHING;

-- Insert Food Items
INSERT INTO public.food_items (id, name, description, category_id, price, image_url, is_vegetarian, is_available, preparation_time_minutes) VALUES
  ('22222222-2222-2222-2222-222222222201', 'Samosa (2 pcs)', 'Crispy golden pastry triangles stuffed with spiced potatoes and green peas, served with sweet tamarind and spicy mint chutneys.', '11111111-1111-1111-1111-111111111102', 15.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80', true, true, 5),
  ('22222222-2222-2222-2222-222222222202', 'Grilled Veg Sandwich', 'Crispy toasted jumbo bread slices stuffed with cucumber, tomato, capsicum, mint chutney, and seasoned cheese blend.', '11111111-1111-1111-1111-111111111101', 40.00, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80', true, true, 8),
  ('22222222-2222-2222-2222-222222222203', 'Masala Maggi', 'Steaming hot 2-minute noodles tossed with butter, sweet corn, diced carrots, green peas, and double magic tastemaker masala.', '11111111-1111-1111-1111-111111111102', 40.00, '/src/assets/images/dish_masala_maggi_1793265995300.jpg', true, true, 7),
  ('22222222-2222-2222-2222-222222222204', 'Veg Supreme Burger', 'Crispy herb potato patty in a soft sesame bun with melted cheese slice, lettuce, caramelized onion, and tangy mayo dressing.', '11111111-1111-1111-1111-111111111102', 50.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', true, true, 10),
  ('22222222-2222-2222-2222-222222222205', 'Chole Kulche', 'Authentic Amritsari spicy tangy chickpea curry cooked with roasted cumin and pomegranate seeds, served with 2 soft baked kulchas and pickled onions.', '11111111-1111-1111-1111-111111111103', 60.00, '/src/assets/images/dish_chole_kulche_1793265996163.jpg', true, true, 10),
  ('22222222-2222-2222-2222-222222222206', 'Executive Veg Thali', 'Complete wholesome meal featuring Shahi Paneer, Homestyle Yellow Dal Tadka, Seasonal Sabzi, 3 Phulkas with Ghee, Jeera Rice, Salad, and Gulab Jamun.', '11111111-1111-1111-1111-111111111103', 90.00, '/src/assets/images/dish_deluxe_thali_1793265996080.jpg', true, true, 12),
  ('22222222-2222-2222-2222-222222222207', 'Chilled Cold Coffee', 'Brewed robust espresso blended with creamy chilled milk, cocoa fudge, and vanilla foam in a frosted glass.', '11111111-1111-1111-1111-111111111104', 50.00, '/src/assets/images/dish_cold_coffee_1793265996575.jpg', true, true, 5),
  ('22222222-2222-2222-2222-222222222208', 'Special Masala Chai', 'Freshly brewed aromatic campus tea simmered with crushed ginger, green cardamom, cloves, and whole milk.', '11111111-1111-1111-1111-111111111104', 10.00, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80', true, true, 3),
  ('22222222-2222-2222-2222-222222222209', 'Paneer Butter Roll', 'Flaky whole wheat paratha wrapped around grilled cottage cheese cubes in rich makhani gravy with bell peppers and sliced onions.', '11111111-1111-1111-1111-111111111102', 70.00, 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80', true, true, 9),
  ('22222222-2222-2222-2222-222222222210', 'Hot Gulab Jamun (2 Pcs)', 'Soft melt-in-mouth milk solids dumplings dipped in warm saffron, cardamom, and rose water syrup.', '11111111-1111-1111-1111-111111111105', 35.00, 'https://images.unsplash.com/photo-1605197586548-9f2257850239?auto=format&fit=crop&w=600&q=80', true, true, 2)
ON CONFLICT (id) DO UPDATE SET
  price = EXCLUDED.price,
  is_available = EXCLUDED.is_available;

-- Insert Pickup Slots
INSERT INTO public.pickup_slots (id, start_time, end_time, capacity) VALUES
  ('33333333-3333-3333-3333-333333333301', NOW() + INTERVAL '10 minutes', NOW() + INTERVAL '40 minutes', 30),
  ('33333333-3333-3333-3333-333333333302', NOW() + INTERVAL '40 minutes', NOW() + INTERVAL '70 minutes', 35),
  ('33333333-3333-3333-3333-333333333303', NOW() + INTERVAL '70 minutes', NOW() + INTERVAL '100 minutes', 35),
  ('33333333-3333-3333-3333-333333333304', NOW() + INTERVAL '100 minutes', NOW() + INTERVAL '130 minutes', 40),
  ('33333333-3333-3333-3333-333333333305', NOW() + INTERVAL '130 minutes', NOW() + INTERVAL '160 minutes', 30)
ON CONFLICT (id) DO NOTHING;
