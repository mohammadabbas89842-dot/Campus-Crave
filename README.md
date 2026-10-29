# CampusBite — Smart College Canteen Management System

CampusBite is a modern, responsive digital canteen management platform designed to eliminate peak-hour canteen queues, streamline kitchen dispatch, and provide seamless online food ordering for college campuses.

---

## 🚀 Key Features

- **Queue Reduction via Pickup Slots:** Students select 30-minute pickup slots with strict capacity limits to prevent overcrowding at collection counters.
- **Role-Based Workflows:**
  - **Student:** Browse categorized menu (veg/non-veg filter, search, price sorting), real-time cart, coupon discounts, instant Razorpay simulation or live payment, digital receipt with QR code, and star reviews.
  - **Canteen Staff (KDS):** Live Kitchen Display System with incoming orders, preparation status toggle (`preparing` ➔ `ready` ➔ `completed`), countdown timers, and audible audio chimes.
  - **Administrator:** Live sales analytics, dish volume metrics, revenue reports, menu item management (add, edit, sold-out toggle), pickup slot capacity configuration, and coupon creation.
- **Supabase Backend Integration:**
  - Real-time PostgreSQL database with 8 core tables: `profiles`, `categories`, `food_items`, `pickup_slots`, `orders`, `order_items`, `payments`, `reviews`.
  - Concurrency-safe atomic order placement via PostgreSQL RPC function `create_order_atomic` using row-level locking (`SELECT ... FOR UPDATE`).
  - Row Level Security (RLS) policies protecting data access based on student, staff, and admin roles.
  - Supabase Realtime subscriptions for instantaneous kitchen dispatch and status sync.
  - Supabase Storage support for dish photos in bucket `food-images`.
  - Supabase Auth for student registration, login, and password resets.
  - 1-Click Sandbox / Demo fallback mode when Supabase credentials are not configured, ensuring zero UI breakage.

---

## 🛠️ Supabase Setup Guide

### 1. Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and sign in or create an account.
2. Click **New project**, choose an organization, assign a project name (e.g. `campus-canteen`), and set a secure database password.
3. Select the closest geographical region for lowest latency and click **Create new project**.

### 2. Apply Database Migration
1. In your Supabase project dashboard, navigate to **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open the file `supabase/migrations/001_initial_schema.sql` (or `supabase/schema.sql`) from this repository.
4. Copy and paste the entire script into the SQL editor and click **Run**.
5. This script automatically:
   - Enables UUID and crypto extensions.
   - Creates all 8 tables with proper foreign keys and constraints.
   - Creates the `get_current_user_role()` helper function without RLS recursion.
   - Creates the `on_auth_user_created` trigger that assigns new signups the `'student'` role.
   - Defines the concurrency-safe `create_order_atomic()` RPC function.
   - Enforces granular Row Level Security (RLS) policies.
   - Enables Realtime publication on `orders`, `food_items`, and `pickup_slots`.
   - Seeds initial dishes, categories, and pickup slots.

### 3. Configure Storage Bucket for Dish Images
1. In your Supabase dashboard, click on **Storage** in the left navigation.
2. Click **New bucket** and name it `food-images`.
3. Check the **Public bucket** toggle so dish photos can be served to students.
4. Under bucket policies, allow `SELECT` for public, and `INSERT/UPDATE/DELETE` for authenticated users.

### 4. Connect Frontend to Supabase

You can connect in either of two ways:

#### Option A: In-App UI Configuration (Easiest)
1. Open the CampusBite web application.
2. Click the **"Connect Supabase"** button in the top navigation bar or the Admin Dashboard.
3. Paste your **Project URL** (`https://<project-id>.supabase.co`) and **Anon Public Key**.
4. Click **"Test & Save Connection"**. The app will immediately verify connection and switch to live database mode!

#### Option B: Environment Variables
Create a `.env` file in the project root:
```bash
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
```

---

## 💳 Razorpay Payments Integration

CampusBite integrates Razorpay payments:
- **Sandbox / Test Mode:** When no Razorpay credentials are provided, CampusBite operates in an interactive Sandbox Mode that simulates UPI apps (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit cards, and NetBanking, complete with server verification.
- **Live Razorpay Mode:** Provide your Razorpay API Key ID and Secret in `.env`:
  ```bash
  VITE_RAZORPAY_KEY_ID="rzp_test_YOUR_KEY_ID"
  RAZORPAY_KEY_SECRET="YOUR_KEY_SECRET"
  ```

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```
