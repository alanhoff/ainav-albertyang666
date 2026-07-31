import ToolsExplorer from '@/components/ToolsExplorer';
import { getAllAIServices, getAllCategories } from '@/lib/data';
import { getDictionary, Locale, locales } from '@/lib/i18n';
import { generateSEO, generateItemListSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { getAllRatings } from '@/lib/supabase';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = getDictionary(lang);

  return generateSEO({
    locale: lang,
    title: `${dictionary.stats.tools} - ${dictionary.siteName}`,
    description: dictionary.siteDescription,
    url: `/${lang}/tools`,
  });
}

export default async function AllToolsPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const dictionary = getDictionary(lang);
  const [allServices, ratingsMap] = await Promise.all([
    getAllAIServices(lang),
    getAllRatings(),
  ]);
  const categories = getAllCategories(lang);
  // Map -> 可序列化的普通对象，传给客户端组件
  const ratings = Object.fromEntries(ratingsMap);

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
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {dictionary.category.count(allServices.length)}
          </p>
        </div>

        {/* Filters + Tools Grid */}
        <ToolsExplorer
          locale={lang}
          services={allServices}
          categories={categories}
          ratings={ratings}
        />
      </div>
    </div>
  );
}
