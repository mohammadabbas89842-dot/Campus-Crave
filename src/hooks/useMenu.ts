import { useState, useEffect, useCallback } from 'react';
import { FoodItem } from '../types';
import { menuService, MenuFilterOptions, SupabaseCategory } from '../services/menuService';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

export const useMenu = (initialFilters?: MenuFilterOptions) => {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<SupabaseCategory[]>([]);
  const [filters, setFilters] = useState<MenuFilterOptions>(initialFilters || {});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenu = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedItems, fetchedCats] = await Promise.all([
        menuService.getMenuItems(filters),
        menuService.getCategories(),
      ]);
      setItems(fetchedItems);
      setCategories(fetchedCats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch menu');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMenu();

    // Subscribe to real-time changes on food_items table
    if (isSupabaseConfigured()) {
      const sb = getSupabase();
      if (sb) {
        const channel = sb
          .channel('public:food_items')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'food_items' },
            () => {
              fetchMenu();
            }
          )
          .subscribe();

        return () => {
          sb.removeChannel(channel);
        };
      }
    }
  }, [fetchMenu]);

  const toggleAvailability = async (id: string, isAvailable: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isAvailable } : item))
    );
    await menuService.toggleAvailability(id, isAvailable);
  };

  const addItem = async (newItem: Partial<FoodItem>, categoryId?: string) => {
    const created = await menuService.createMenuItem(newItem, categoryId);
    setItems((prev) => [created, ...prev]);
    return created;
  };

  const deleteItem = async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    await menuService.deleteMenuItem(id);
  };

  return {
    items,
    categories,
    filters,
    setFilters,
    isLoading,
    error,
    refreshMenu: fetchMenu,
    toggleAvailability,
    addItem,
    deleteItem,
  };
};
