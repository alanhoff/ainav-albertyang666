"use client";

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import AIServiceCard from '@/components/AIServiceCard';
import { getDictionary, Locale } from '@/lib/i18n';
import type { AIService, Category } from '@/types';

type RatingData = { average_score: number; review_count: number };
type SortOption = 'default' | 'rating' | 'reviewCount' | 'nameAsc' | 'nameDesc';
type PricingFilter = 'all' | 'free' | 'freemium' | 'paid';
type FeaturedFilter = 'all' | 'featured' | 'not_featured';

interface ToolsExplorerProps {
  locale: Locale;
  services: AIService[];
  categories: Category[];
  ratings: Record<string, RatingData>;
  currentCategory: string;
  currentPricing: PricingFilter;
  currentFeatured: FeaturedFilter;
  currentSort: SortOption;
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export default function ToolsExplorer({ locale, services, categories, ratings, currentCategory, currentPricing, currentFeatured, currentSort, currentPage, totalPages, totalCount }: ToolsExplorerProps) {
  const dictionary = getDictionary(locale);
  const router = useRouter();
  const searchParams = useSearchParams();
  const basePath = `/${locale}/tools`;

  const buildQueryString = (overrides: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    Object.entries(overrides).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === 'all' || value === 'default') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    params.delete('page');
    return params.toString();
  };

  const buildPageHref = (page: number) => {
    const query = buildQueryString({});
    const path = page > 1 ? `${basePath}/page/${page}` : basePath;
    return `${path}${query ? `?${query}` : ''}`;
  };

  const buildFilterHref = (overrides: Record<string, string | number | undefined>) => {
    const query = buildQueryString(overrides);
    return `${basePath}${query ? `?${query}` : ''}`;
  };

  const filteredAndSorted = useMemo(() => services, [services]);
  const visibleCount = services.length;

  const selectedCategoryName = categories.find((cat) => cat.id === currentCategory)?.name || currentCategory;
  const activeFilters = [
    currentCategory !== 'all' ? selectedCategoryName : null,
    currentPricing !== 'all'
      ? (currentPricing === 'free' ? dictionary.pricing.free : currentPricing === 'freemium' ? dictionary.pricing.freemium : dictionary.pricing.paid)
      : null,
    currentFeatured !== 'all'
      ? (currentFeatured === 'featured' ? dictionary.search.filters.featuredOnly : dictionary.search.filters.allFeatured)
      : null,
    currentSort !== 'default'
      ? (currentSort === 'rating'
          ? dictionary.search.filters.rating
          : currentSort === 'reviewCount'
            ? dictionary.search.filters.reviewCount
            : currentSort === 'nameAsc'
              ? dictionary.search.filters.nameAsc
              : dictionary.search.filters.nameDesc)
      : null,
  ].filter(Boolean) as string[];

  const [siblingCount, setSiblingCount] = useState(1);
  useEffect(() => {
    const updateSiblingCount = () => {
      const width = window.innerWidth;
      if (width < 640) setSiblingCount(1);
      else if (width < 1024) setSiblingCount(2);
      else setSiblingCount(3);
    };
    updateSiblingCount();
    window.addEventListener('resize', updateSiblingCount);
    return () => window.removeEventListener('resize', updateSiblingCount);
  }, []);

  const paginationItems = useMemo(() => {
    const maxVisibleItems = 2 + siblingCount * 2;
    if (totalPages <= maxVisibleItems) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const items: Array<number | 'ellipsis'> = [1];
    const start = Math.max(2, currentPage - siblingCount);
    const end = Math.min(totalPages - 1, currentPage + siblingCount);

    if (start > 2) {
      items.push('ellipsis');
    }
    for (let page = start; page <= end; page += 1) {
      items.push(page);
    }
    if (end < totalPages - 1) {
      items.push('ellipsis');
    }
    items.push(totalPages);
    return items;
  }, [currentPage, totalPages, siblingCount]);

  const selectClass =
    'w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white';
  const labelClass =
    'block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';

  return (
    <>
      <div className="mb-8 rounded-2xl border border-gray-200/80 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/70 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <SlidersHorizontal className="h-4 w-4" />
              <span>{dictionary.search.filters.panelTitle}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {visibleCount > 0 ? `Showing ${visibleCount} of ${totalCount} tools` : 'No tools match the current filters'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeFilters.length > 0 ? (
              <>
                {activeFilters.map((filter) => (
                  <span key={filter} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                    {filter}
                  </span>
                ))}
                <Link href={buildFilterHref({ category: 'all', pricing: 'all', sort: 'default' })} className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                  <X className="h-3.5 w-3.5" />
                  {dictionary.search.filters.clear}
                </Link>
              </>
            ) : (
              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {dictionary.search.filters.allTools}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelClass}>{dictionary.search.filters.category}</label>
            <select
              value={currentCategory}
              onChange={(e) => {
                router.push(buildFilterHref({ category: e.target.value }));
              }}
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

          <div>
            <label className={labelClass}>{dictionary.search.filters.pricing}</label>
            <select
              value={currentPricing}
              onChange={(e) => {
                router.push(buildFilterHref({ pricing: e.target.value }));
              }}
              className={selectClass}
            >
              <option value="all">{dictionary.search.filters.allPricing}</option>
              <option value="free">{dictionary.pricing.free}</option>
              <option value="freemium">{dictionary.pricing.freemium}</option>
              <option value="paid">{dictionary.pricing.paid}</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>{dictionary.search.filters.featured}</label>
            <select
              value={currentFeatured}
              onChange={(e) => {
                router.push(buildFilterHref({ featured: e.target.value }));
              }}
              className={selectClass}
            >
              <option value="all">{dictionary.search.filters.allFeatured}</option>
              <option value="featured">{dictionary.search.filters.featuredOnly}</option>
              <option value="not_featured">{dictionary.search.filters.notFeatured}</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>{dictionary.search.filters.sortBy}</label>
            <select
              value={currentSort}
              onChange={(e) => {
                router.push(buildFilterHref({ sort: e.target.value }));
              }}
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
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {filteredAndSorted.map((service) => (
          <AIServiceCard
            key={service.id}
            service={service}
            locale={locale}
            rating={ratings[service.id] || null}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {currentPage > 1 ? (
              <Link href={buildPageHref(currentPage - 1)} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                <ChevronLeft className="h-4 w-4" />
                {dictionary.reviews?.pagination?.previous || 'Previous'}
              </Link>
            ) : null}
            {paginationItems.map((page, index) => {
              if (page === 'ellipsis') {
                return (
                  <span key={`ellipsis-${index}`} className="px-2 py-2 text-sm text-gray-500 dark:text-gray-400">
                    …
                  </span>
                );
              }

              const isActive = page === currentPage;
              return (
                <Link
                  key={page}
                  href={buildPageHref(page)}
                  className={`min-w-10 rounded-lg border px-3 py-2 text-center text-sm font-medium transition-colors ${isActive ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'}`}
                >
                  {page}
                </Link>
              );
            })}
            {currentPage < totalPages ? (
              <Link href={buildPageHref(currentPage + 1)} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                {dictionary.reviews?.pagination?.next || 'Next'}
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </p>
        </div>
      )}

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
