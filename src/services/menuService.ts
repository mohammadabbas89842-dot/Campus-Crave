import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { FoodCategory, FoodItem } from '../types';
import { INITIAL_FOOD_ITEMS } from '../data/initialData';

export interface MenuFilterOptions {
  category?: string;
  isVegOnly?: boolean;
  searchQuery?: string;
  sortBy?: 'popular' | 'price_low' | 'price_high' | 'prep_time';
}

export interface SupabaseCategory {
  id: string;
  name: string;
  description: string;
}

export const menuService = {
  /**
   * Fetch all categories
   */
  async getCategories(): Promise<SupabaseCategory[]> {
    if (!isSupabaseConfigured()) {
      return [
        { id: '11111111-1111-1111-1111-111111111101', name: 'Breakfast', description: 'Morning breakfast specials' },
        { id: '11111111-1111-1111-1111-111111111102', name: 'Snacks', description: 'Crispy snacks & quick bites' },
        { id: '11111111-1111-1111-1111-111111111103', name: 'Meals', description: 'Wholesome hearty lunch thalis' },
        { id: '11111111-1111-1111-1111-111111111104', name: 'Beverages', description: 'Chilled coffees and masala chai' },
        { id: '11111111-1111-1111-1111-111111111105', name: 'Desserts', description: 'Sweet treats & desserts' },
      ];
    }

    const sb = getSupabase();
    if (!sb) return [];

    try {
      const { data, error } = await sb.from('categories').select('*').order('name');
      if (error) {
        console.warn('[menuService] Error fetching categories:', error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('[menuService] Unexpected category fetch error:', err);
      return [];
    }
  },

  /**
   * Fetch menu items with joined category information and filters
   */
  async getMenuItems(filters?: MenuFilterOptions): Promise<FoodItem[]> {
    if (!isSupabaseConfigured()) {
      return this.applyLocalFilters(INITIAL_FOOD_ITEMS, filters);
    }

    const sb = getSupabase();
    if (!sb) {
      return this.applyLocalFilters(INITIAL_FOOD_ITEMS, filters);
    }

    try {
      let query = sb
        .from('food_items')
        .select(`
          id,
          name,
          description,
          price,
          image_url,
          is_vegetarian,
          is_available,
          preparation_time_minutes,
          category_id,
          categories (
            id,
            name
          )
        `);

      if (filters?.isVegOnly) {
        query = query.eq('is_vegetarian', true);
      }

      if (filters?.category && filters.category !== 'All') {
        // match category name or id
        query = query.filter('categories.name', 'eq', filters.category);
      }

      if (filters?.sortBy === 'price_low') {
        query = query.order('price', { ascending: true });
      } else if (filters?.sortBy === 'price_high') {
        query = query.order('price', { ascending: false });
      } else if (filters?.sortBy === 'prep_time') {
        query = query.order('preparation_time_minutes', { ascending: true });
      } else {
        query = query.order('name', { ascending: true });
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        if (error) console.warn('[menuService] Query fallback:', error.message);
        return this.applyLocalFilters(INITIAL_FOOD_ITEMS, filters);
      }

      let items: FoodItem[] = data.map((row: any) => {
        const catName = row.categories?.name || 'Snacks';
        return {
          id: row.id,
          name: row.name,
          description: row.description || '',
          category: (catName as FoodCategory) || 'Snacks',
          price: Number(row.price),
          imageUrl: row.image_url || '/src/assets/images/dish_masala_maggi_1793265995300.jpg',
          isVeg: Boolean(row.is_vegetarian),
          isAvailable: Boolean(row.is_available),
          prepTimeMinutes: Number(row.preparation_time_minutes) || 8,
          rating: 4.8,
          reviewCount: 120,
        };
      });

      if (filters?.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        items = items.filter(
          (i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
        );
      }

      return items;
    } catch (err) {
      console.warn('[menuService] Exception caught, falling back to local dataset:', err);
      return this.applyLocalFilters(INITIAL_FOOD_ITEMS, filters);
    }
  },

  applyLocalFilters(items: FoodItem[], filters?: MenuFilterOptions): FoodItem[] {
    let result = [...items];

    if (filters?.category && filters.category !== 'All') {
      result = result.filter((i) => i.category.toLowerCase() === filters.category!.toLowerCase());
    }

    if (filters?.isVegOnly) {
      result = result.filter((i) => i.isVeg);
    }

    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
      );
    }

    if (filters?.sortBy === 'price_low') {
      result.sort((a, b) => a.price - b.price);
    } else if (filters?.sortBy === 'price_high') {
      result.sort((a, b) => b.price - a.price);
    } else if (filters?.sortBy === 'prep_time') {
      result.sort((a, b) => a.prepTimeMinutes - b.prepTimeMinutes);
    }

    return result;
  },

  /**
   * Toggle food item availability in Supabase
   */
  async toggleAvailability(id: string, isAvailable: boolean): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;
    const sb = getSupabase();
    if (!sb) return true;

    try {
      const { error } = await sb
        .from('food_items')
        .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.warn('[menuService] Error updating availability:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[menuService] Error:', err);
      return false;
    }
  },

  /**
   * Add a new food item to Supabase
   */
  async createMenuItem(item: Partial<FoodItem>, categoryId?: string): Promise<FoodItem> {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        // Resolve or create category ID if not provided
        let catId = categoryId;
        if (!catId && item.category) {
          const { data: catData } = await sb
            .from('categories')
            .select('id')
            .eq('name', item.category)
            .maybeSingle();

          if (catData) {
            catId = catData.id;
          }
        }

        const insertPayload: any = {
          name: item.name,
          description: item.description || '',
          price: item.price || 0,
          image_url: item.imageUrl || '',
          is_vegetarian: item.isVeg ?? true,
          is_available: item.isAvailable ?? true,
          preparation_time_minutes: item.prepTimeMinutes || 10,
        };

        if (catId) {
          insertPayload.category_id = catId;
        }

        const { data, error } = await sb.from('food_items').insert(insertPayload).select().single();

        if (!error && data) {
          return {
            id: data.id,
            name: data.name,
            description: data.description,
            category: item.category || 'Snacks',
            price: Number(data.price),
            imageUrl: data.image_url,
            isVeg: data.is_vegetarian,
            isAvailable: data.is_available,
            prepTimeMinutes: data.preparation_time_minutes,
            rating: 5.0,
            reviewCount: 1,
          };
        }
      } catch (err) {
        console.warn('[menuService] Remote insert failed, using fallback item:', err);
      }
    }

    // Fallback item
    return {
      id: item.id || `food_${Date.now()}`,
      name: item.name || 'New Item',
      description: item.description || '',
      category: item.category || 'Snacks',
      price: item.price || 50,
      imageUrl: item.imageUrl || '/src/assets/images/dish_masala_maggi_1793265995300.jpg',
      isVeg: item.isVeg ?? true,
      isAvailable: item.isAvailable ?? true,
      prepTimeMinutes: item.prepTimeMinutes || 8,
      rating: 5.0,
      reviewCount: 1,
    };
  },

  /**
   * Delete a food item
   */
  async deleteMenuItem(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;
    const sb = getSupabase();
    if (!sb) return true;

    try {
      const { error } = await sb.from('food_items').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Upload food image to Supabase Storage bucket 'food-images'
   */
  async uploadFoodImage(file: File): Promise<{ url: string | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { url: null, error: new Error('Supabase is not configured') };
    }

    const sb = getSupabase();
    if (!sb) return { url: null, error: new Error('Client unavailable') };

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `dishes/${fileName}`;

      const { error: uploadError } = await sb.storage
        .from('food-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        return { url: null, error: uploadError };
      }

      const { data } = sb.storage.from('food-images').getPublicUrl(filePath);
      return { url: data.publicUrl, error: null };
    } catch (err) {
      return { url: null, error: err instanceof Error ? err : new Error('Upload failed') };
    }
  },
};
