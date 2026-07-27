import { notFound } from 'next/navigation';
import AIServiceCard from '@/components/AIServiceCard';
import { getAllCategories, getCategoryById, getAIServicesByCategory } from '@/lib/data';
import { generateSEO, generateBreadcrumbSchema, generateItemListSchema } from '@/lib/seo';
import { getAllRatings } from '@/lib/supabase';
import type { Metadata } from 'next';
import { getDictionary, Locale, locales } from '@/lib/i18n';

interface CategoryPageProps {
  params: Promise<{ lang: Locale; id: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { lang, id } = await params;
  const category = getCategoryById(id, lang);

  if (!category) {
    return {};
  }

  // 分类页 TDK 模板：{\u5206类名}推荐_免费{\u5206类名}大全
  const titleTemplates: Record<Locale, string> = {
    zh: `${category.name}推荐_免费${category.name}工具大全`,
    en: `Best ${category.name} Tools - Free ${category.name} Software`,
    ja: `${category.name}おすすめ_無料${category.name}ツール一覧`,
    ko: `${category.name} 추천_무료 ${category.name} 도구 모음`,
    fr: `Meilleurs Outils ${category.name} - Logiciels ${category.name} Gratuits`,
  };
  const descTemplates: Record<Locale, string> = {
    zh: `精选多款优质${category.name}，${category.description}。涵盖免费版、付费订阅版，一键直达官方入口使用。`,
    en: `Discover the best ${category.name} tools. ${category.description}. Free and paid options, direct links to official sites.`,
    ja: `厳選された${category.name}ツールをご紹介。${category.description}。無料・有料プランあり。`,
    ko: `엄선된 ${category.name} 도구 모음. ${category.description}. 무료 및 유료 옵션 제공.`,
    fr: `Découvrez les meilleurs outils ${category.name}. ${category.description}. Options gratuites et payantes.`,
  };

  return generateSEO({
    title: titleTemplates[lang],
    description: descTemplates[lang],
    url: `/${lang}/category/${id}`,
    locale: lang,
  });
}

export function generateStaticParams() {
  const categories = getAllCategories('zh');
  return locales.flatMap((lang) =>
    categories.map((category) => ({
      lang,
      id: category.id,
    }))
  );
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { lang, id } = await params;
  const dictionary = getDictionary(lang);
  const category = getCategoryById(id, lang);

  if (!category) {
    notFound();
  }

  const [services, ratingsMap] = await Promise.all([
    getAIServicesByCategory(id, lang),
    getAllRatings(),
  ]);

  // Schema.org: ItemList + BreadcrumbList
  const baseUrl = 'https://ainav.space';
  const itemListSchema = generateItemListSchema(
    services.map((s, i) => ({
      name: s.name,
      url: `${baseUrl}/${lang}/service/${s.id}`,
      position: i + 1,
    }))
  );
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: dictionary.siteName, url: `${baseUrl}/${lang}` },
    { name: category.name, url: `${baseUrl}/${lang}/category/${id}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    <div className="min-h-screen relative">
      {/* Background Gradient */}
      <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-blue-100 dark:bg-blue-900/10 blur-[100px] rounded-full -z-10 pointer-events-none" />
      
      <div className="container mx-auto px-4 py-16">
        <div className="mb-16 relative">
           <div className="flex flex-col md:flex-row items-center md:items-start md:gap-8 text-center md:text-left">
            <div className="text-8xl mb-6 md:mb-0 p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
              {category.icon}
            </div>
            <div className="flex-1 pt-4">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                {category.name}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-4 max-w-2xl leading-relaxed">
                {category.description}
              </p>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium text-sm">
                {dictionary.category.count(services.length)}
              </div>
            </div>
          </div>
        </div>

        {/* 分类导语 */}
        {dictionary.categoryIntros?.[id] && (
          <div className="mb-10 p-5 bg-blue-50/60 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
            <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
              {dictionary.categoryIntros[id]}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <AIServiceCard 
              key={service.id} 
              service={service} 
              locale={lang} 
              rating={ratingsMap.get(service.id) || null}
            />
          ))}
        </div>

        {services.length === 0 && (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {dictionary.category.empty}
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
