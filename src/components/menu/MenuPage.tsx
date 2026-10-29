import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Star,
  Timer,
  Plus,
  Minus,
  Heart,
  Flame,
  CheckCircle2,
  X,
  Info,
  ChefHat,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FoodCategory, FoodItem } from '../../types';

const CATEGORIES: ('All' | FoodCategory)[] = [
  'All',
  'Breakfast',
  'Snacks',
  'Meals',
  'Beverages',
  'Desserts',
];

export const MenuPage: React.FC = () => {
  const {
    menuItems,
    cart,
    addToCart,
    updateCartQuantity,
    favorites,
    toggleFavorite,
    setIsCartDrawerOpen,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<'All' | FoodCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'rating' | 'prep_time'>('recommended');
  const [selectedDetailItem, setSelectedDetailItem] = useState<FoodItem | null>(null);
  const [detailItemNote, setDetailItemNote] = useState('');

  // Cart item lookup map for quantity display
  const cartItemMap = useMemo(() => {
    const map = new Map<string, number>();
    cart.forEach((entry) => map.set(entry.item.id, entry.quantity));
    return map;
  }, [cart]);

  // Filtered and sorted menu items
  const filteredItems = useMemo(() => {
    let result = [...menuItems];

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter((item) => item.category === selectedCategory);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }

    // Veg only filter
    if (vegOnly) {
      result = result.filter((item) => item.isVeg);
    }

    // Availability filter
    if (availableOnly) {
      result = result.filter((item) => item.isAvailable);
    }

    // Sorting
    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'prep_time':
        result.sort((a, b) => a.prepTimeMinutes - b.prepTimeMinutes);
        break;
      case 'recommended':
      default:
        // Prioritize Chef specials and highest rated
        result.sort((a, b) => (b.isChefSpecial ? 1 : 0) - (a.isChefSpecial ? 1 : 0) || b.rating - a.rating);
        break;
    }

    return result;
  }, [menuItems, selectedCategory, searchQuery, vegOnly, availableOnly, sortBy]);

  const handleOpenDetail = (item: FoodItem) => {
    setSelectedDetailItem(item);
    setDetailItemNote('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Campus Canteen Menu
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Browse fresh, hygienic meals prepared in real-time. Order ahead to skip long counter lines.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search samosa, maggi, thali..."
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Categories & Filter Bar */}
      <div className="space-y-4">
        {/* Category Pills (Functional Filter Tabs) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Secondary Filters Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Veg Only Toggle */}
            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 select-none">
              <input
                type="checkbox"
                checked={vegOnly}
                onChange={(e) => setVegOnly(e.target.checked)}
                className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
              />
              <div className="w-3.5 h-3.5 border border-emerald-600 flex items-center justify-center p-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              </div>
              <span className="font-medium text-stone-700">Pure Veg Only</span>
            </label>

            {/* In Stock Only Toggle */}
            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 select-none">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
              />
              <span className="font-medium text-stone-700">Available / In Stock</span>
            </label>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-stone-500 text-xs flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
            >
              <option value="recommended">Chef's Recommended</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="prep_time">Fastest Prep Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Menu Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
          <Info className="w-10 h-10 text-stone-400 mx-auto" />
          <h3 className="font-bold text-stone-800 text-base">No dishes match your filters</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Try resetting your search query or enabling all availability options.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setVegOnly(false);
              setAvailableOnly(false);
            }}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const currentQty = cartItemMap.get(item.id) || 0;
            const isFav = favorites.includes(item.id);

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden group ${
                  item.isAvailable
                    ? 'border-stone-200 hover:border-stone-300 hover:shadow-md'
                    : 'border-stone-200 bg-stone-50/70 opacity-80'
                }`}
              >
                {/* Image Section */}
                <div
                  onClick={() => handleOpenDetail(item)}
                  className="relative aspect-[4/3] bg-stone-100 overflow-hidden cursor-pointer"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />

                  {/* Veg Indicator */}
                  {item.isVeg && (
                    <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-sm p-1 rounded shadow-sm">
                      <div className="w-3.5 h-3.5 border border-emerald-600 flex items-center justify-center p-0.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-600" />
                      </div>
                    </div>
                  )}

                  {/* Favorite Toggle Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item.id);
                    }}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all"
                    title={isFav ? 'Remove from favorites' : 'Save to favorites'}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isFav ? 'fill-red-500 text-red-500' : 'text-stone-400 hover:text-stone-600'
                      }`}
                    />
                  </button>

                  {/* Prep Time & Calories Overlay */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-semibold text-white">
                    <div className="bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded flex items-center gap-1">
                      <Timer className="w-3 h-3 text-amber-400" />
                      <span>{item.prepTimeMinutes} mins</span>
                    </div>

                    {item.calories && (
                      <div className="bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-400" />
                        <span>{item.calories} kcal</span>
                      </div>
                    )}
                  </div>

                  {/* Sold Out Overlay Banner */}
                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[1px] flex items-center justify-center">
                      <span className="bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded shadow-md">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                      <span className="uppercase font-semibold tracking-wider text-[11px] text-amber-700">
                        {item.category}
                      </span>
                      <div className="flex items-center gap-1 text-amber-600 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{item.rating}</span>
                        <span className="text-stone-400 font-normal">({item.reviewCount})</span>
                      </div>
                    </div>

                    <h3
                      onClick={() => handleOpenDetail(item)}
                      className="font-bold text-stone-900 text-base group-hover:text-amber-700 transition-colors cursor-pointer"
                    >
                      {item.name}
                    </h3>

                    <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Price & Action Row */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-extrabold text-stone-900 tabular-nums">
                        ₹{item.price}
                      </div>
                      <div className="text-[10px] text-stone-400">incl. all taxes</div>
                    </div>

                    {item.isAvailable ? (
                      currentQty > 0 ? (
                        <div className="flex items-center bg-amber-50 border border-amber-300 rounded-xl p-0.5">
                          <button
                            onClick={() => updateCartQuantity(item.id, currentQty - 1)}
                            className="w-7 h-7 flex items-center justify-center text-amber-800 hover:bg-amber-200/60 rounded-lg transition-colors font-bold"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-amber-900 tabular-nums">
                            {currentQty}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.id, currentQty + 1)}
                            className="w-7 h-7 flex items-center justify-center text-amber-800 hover:bg-amber-200/60 rounded-lg transition-colors font-bold"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item, 1)}
                          className="px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-xl transition-all flex items-center gap-1 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-stone-400 font-medium italic">
                        Unavailable
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dish Detail Modal */}
      {selectedDetailItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150">
            <div className="relative aspect-video bg-stone-100">
              <img
                src={selectedDetailItem.imageUrl}
                alt={selectedDetailItem.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => setSelectedDetailItem(null)}
                className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              {selectedDetailItem.isChefSpecial && (
                <div className="absolute top-3 left-3 bg-amber-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow flex items-center gap-1">
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>Chef's Daily Special</span>
                </div>
              )}
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs uppercase font-semibold text-amber-700">
                      {selectedDetailItem.category}
                    </span>
                    <span className="text-stone-300">·</span>
                    <div className="flex items-center gap-1 text-amber-600 font-bold text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{selectedDetailItem.rating}</span>
                      <span className="text-stone-400 font-normal">({selectedDetailItem.reviewCount} ratings)</span>
                    </div>
                  </div>
                  <h2 className="text-xl font-extrabold text-stone-900">
                    {selectedDetailItem.name}
                  </h2>
                </div>
                <div className="text-2xl font-extrabold text-stone-900 tabular-nums">
                  ₹{selectedDetailItem.price}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {selectedDetailItem.description}
              </p>

              {/* Prep time & metrics */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-xs">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-amber-600" />
                  <div>
                    <div className="text-stone-400 text-[10px]">Preparation Time</div>
                    <div className="font-bold text-stone-800">{selectedDetailItem.prepTimeMinutes} minutes</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-600" />
                  <div>
                    <div className="text-stone-400 text-[10px]">Nutritional Energy</div>
                    <div className="font-bold text-stone-800">{selectedDetailItem.calories || 280} kcal</div>
                  </div>
                </div>
              </div>

              {/* Ingredients Transparency */}
              {selectedDetailItem.ingredients && selectedDetailItem.ingredients.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-stone-700">Fresh Ingredients:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDetailItem.ingredients.map((ing, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md border border-stone-200/70"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Note Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">
                  Customization or allergy instructions (Optional):
                </label>
                <input
                  type="text"
                  value={detailItemNote}
                  onChange={(e) => setDetailItemNote(e.target.value)}
                  placeholder="e.g. Less spicy, no extra butter, extra green chutney"
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedDetailItem(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={!selectedDetailItem.isAvailable}
                  onClick={() => {
                    addToCart(selectedDetailItem, 1, detailItemNote.trim() || undefined);
                    setSelectedDetailItem(null);
                    setIsCartDrawerOpen(true);
                  }}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Order · ₹{selectedDetailItem.price}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
