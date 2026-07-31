"use client";

import { useMemo, useState } from 'react';
import AIServiceCard from '@/components/AIServiceCard';
import { getDictionary, Locale } from '@/lib/i18n';
import type { AIService, Category } from '@/types';

type RatingData = { average_score: number; review_count: number };
type SortOption = 'default' | 'rating' | 'reviewCount' | 'nameAsc' | 'nameDesc';
type PricingFilter = 'all' | 'free' | 'freemium' | 'paid';

interface ToolsExplorerProps {
  locale: Locale;
  services: AIService[];
  categories: Category[];
  ratings: Record<string, RatingData>;
}

export default function ToolsExplorer({ locale, services, categories, ratings }: ToolsExplorerProps) {
  const dictionary = getDictionary(locale);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPricing, setSelectedPricing] = useState<PricingFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');

  const filteredAndSorted = useMemo(() => {
    let results = services;

    if (selectedCategory !== 'all') {
      results = results.filter((s) => s.category === selectedCategory);
    }
    if (selectedPricing !== 'all') {
      results = results.filter((s) => s.pricing === selectedPricing);
    }

    if (sortBy !== 'default') {
      results = [...results].sort((a, b) => {
        const ra = ratings[a.id];
        const rb = ratings[b.id];
        switch (sortBy) {
          case 'rating':
            return (rb?.average_score || 0) - (ra?.average_score || 0);
          case 'reviewCount':
            return (rb?.review_count || 0) - (ra?.review_count || 0);
          case 'nameAsc':
            return a.name.localeCompare(b.name);
          case 'nameDesc':
            return b.name.localeCompare(a.name);
          default:
            return 0;
        }
      });
    }

    return results;
  }, [services, selectedCategory, selectedPricing, sortBy, ratings]);

  const selectClass =
    'w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white';
  const labelClass =
    'block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';

  return (
    <>
      {/* Filters and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
        <div className="flex-1">
          <label className={labelClass}>{dictionary.search.filters.category}</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={selectClass}
          >
            <option value="all">{dictionary.search.filters.allCategories}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className={labelClass}>{dictionary.search.filters.pricing}</label>
          <select
            value={selectedPricing}
            onChange={(e) => setSelectedPricing(e.target.value as PricingFilter)}
            className={selectClass}
          >
            <option value="all">{dictionary.search.filters.allPricing}</option>
            <option value="free">{dictionary.pricing.free}</option>
            <option value="freemium">{dictionary.pricing.freemium}</option>
            <option value="paid">{dictionary.pricing.paid}</option>
          </select>
        </div>

        <div className="flex-1">
          <label className={labelClass}>{dictionary.search.filters.sortBy}</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className={selectClass}
          >
            <option value="default">{dictionary.search.filters.defaultSort}</option>
            <option value="rating">{dictionary.search.filters.rating}</option>
            <option value="reviewCount">{dictionary.search.filters.reviewCount}</option>
            <option value="nameAsc">{dictionary.search.filters.nameAsc}</option>
            <option value="nameDesc">{dictionary.search.filters.nameDesc}</option>
          </select>
        </div>
      </div>

      {/* Result count */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {dictionary.category.count(filteredAndSorted.length)}
      </p>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSorted.map((service) => (
          <AIServiceCard
            key={service.id}
            service={service}
            locale={locale}
            rating={ratings[service.id] || null}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSorted.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {dictionary.category.empty}
          </p>
        </div>
      )}
    </>
  );
}
