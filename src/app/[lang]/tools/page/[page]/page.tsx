import ToolsExplorer from '@/components/ToolsExplorer';
import { getAllAIServices, getAllCategories } from '@/lib/data';
import { getDictionary, Locale, locales } from '@/lib/i18n';
import { generateSEO, generateItemListSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { getAllRatings } from '@/lib/supabase';
import { TOOLS_PAGE_SIZE } from '@/lib/constants';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

const PAGE_SIZE = TOOLS_PAGE_SIZE;

type SortOption = 'default' | 'rating' | 'reviewCount' | 'nameAsc' | 'nameDesc';
type PricingFilter = 'all' | 'free' | 'freemium' | 'paid';

export const revalidate = 3600;

export function generateStaticParams() {
  const params: { lang: Locale; page: string }[] = [];
  locales.forEach((lang) => {
    for (let page = 2; page <= 10; page += 1) {
      params.push({ lang, page: String(page) });
    }
  });
  return params;
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ lang: Locale; page: string }>; searchParams?: Promise<{ category?: string; pricing?: string; sort?: string }> }): Promise<Metadata> {
  const { lang, page } = await params;
  const query = await searchParams;
  const dictionary = getDictionary(lang);
  const pageNumber = Number(page) || 1;

  const searchParamsEntries = new URLSearchParams();
  if (query?.category && query.category !== 'all') {
    searchParamsEntries.set('category', query.category);
  }
  if (query?.pricing && query.pricing !== 'all') {
    searchParamsEntries.set('pricing', query.pricing);
  }
  if (query?.sort && query.sort !== 'default') {
    searchParamsEntries.set('sort', query.sort);
  }
  const queryString = searchParamsEntries.toString();

  return generateSEO({
    locale: lang,
    title: `${dictionary.stats.tools} - Page ${pageNumber} - ${dictionary.siteName}`,
    description: dictionary.siteDescription,
    url: `/${lang}/tools/page/${pageNumber}${queryString ? `?${queryString}` : ''}`,
  });
}

export default async function ToolsPageByNumber({ params, searchParams }: { params: Promise<{ lang: Locale; page: string }>; searchParams?: Promise<{ category?: string; pricing?: string; sort?: string }> }) {
  const { lang, page } = await params;
  const query = await searchParams;
  const dictionary = getDictionary(lang);
  const [allServices, ratingsMap] = await Promise.all([
    getAllAIServices(lang),
    getAllRatings(),
  ]);
  const categories = getAllCategories(lang);
  const ratings = ratingsMap as Record<string, { average_score: number; review_count: number }>;

  const selectedCategory = query?.category || 'all';
  const selectedPricing = (query?.pricing === 'free' || query?.pricing === 'freemium' || query?.pricing === 'paid' ? query.pricing : 'all') as PricingFilter;
  const selectedSort = (query?.sort === 'rating' || query?.sort === 'reviewCount' || query?.sort === 'nameAsc' || query?.sort === 'nameDesc' ? query.sort : 'default') as SortOption;

  let filteredServices = [...allServices];
  if (selectedCategory !== 'all') {
    filteredServices = filteredServices.filter((service) => service.category === selectedCategory);
  }
  if (selectedPricing !== 'all') {
    filteredServices = filteredServices.filter((service) => service.pricing === selectedPricing);
  }

  if (selectedSort !== 'default') {
    filteredServices = [...filteredServices].sort((a, b) => {
      const ratingA = ratings[a.id]?.average_score || 0;
      const ratingB = ratings[b.id]?.average_score || 0;
      const reviewA = ratings[a.id]?.review_count || 0;
      const reviewB = ratings[b.id]?.review_count || 0;

      switch (selectedSort) {
        case 'rating':
          return ratingB - ratingA;
        case 'reviewCount':
          return reviewB - reviewA;
        case 'nameAsc':
          return a.name.localeCompare(b.name);
        case 'nameDesc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });
  }

  const totalCount = filteredServices.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const requestedPage = Number(page || '1');
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, totalPages) : 1;

  if (requestedPage > totalPages || requestedPage < 1) {
    notFound();
  }

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageServices = filteredServices.slice(startIndex, startIndex + PAGE_SIZE);

  const baseUrl = 'https://ainav.space';
  const itemListSchema = generateItemListSchema(
    allServices.map((s, i) => ({
      name: s.name,
      url: `${baseUrl}/${lang}/service/${s.id}`,
      position: i + 1,
    }))
  );
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: dictionary.siteName, url: `${baseUrl}/${lang}` },
    { name: dictionary.stats.tools, url: `${baseUrl}/${lang}/tools` },
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/${lang}`}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{dictionary.common?.back || 'Back'}</span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {dictionary.stats.tools}
            {currentPage > 1 ? <span className="text-gray-400 dark:text-gray-500"> · {currentPage}</span> : null}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {dictionary.category.count(allServices.length)}
          </p>
        </div>

        {/* Filters + Tools Grid */}
        <ToolsExplorer
          locale={lang}
          services={pageServices}
          categories={categories}
          ratings={ratings}
          currentCategory={selectedCategory}
          currentPricing={selectedPricing}
          currentSort={selectedSort}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
        />
      </div>
    </div>
  );
}
