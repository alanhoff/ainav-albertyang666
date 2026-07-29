import SearchBar from '@/components/SearchBar';
import AIServiceCard from '@/components/AIServiceCard';
import CategoryCard from '@/components/CategoryCard';
import { getAllAIServices, getAllCategories, getFeaturedAIServices, getAIServicesByCategory } from '@/lib/data';
import { getDictionary, Locale, locales } from '@/lib/i18n';
import { generateSEO, generateWebsiteSchema, generateOrganizationSchema } from '@/lib/seo';
import { getAllRatings } from '@/lib/supabase';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Rocket, Wrench, Folder, Star } from 'lucide-react';
import Link from 'next/link';

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  // 验证语言参数，无效语言返回404
  if (!locales.includes(lang as Locale)) {
    notFound();
  }
  const dictionary = getDictionary(lang as Locale);

  // 按语言定制首页 TDK
  const titleMap: Record<Locale, string> = {
    zh: 'AI工具导航大全 - 精选好用的AI软件合集',
    en: 'Best AI Tools Directory - Curated AI Software Collection',
    ja: 'AIツールナビ - 厳選AIソフトウェア一覧',
    ko: 'AI 도구 모음 - 엄선된 AI 소프트웨어 컬렉션',
    fr: 'Annuaire des Meilleurs Outils IA - Collection IA Sélectionnée',
  };
  const descMap: Record<Locale, string> = {
    zh: 'ainav.space 收录各类优质AI工具，覆盖AI写作、AI绘图、AI视频、AI编程等场景，免费与付费工具分类整理，帮你快速找到合适的AI生产力工具。',
    en: 'ainav.space collects top AI tools covering writing, image, video, coding and more. Free and paid tools organized by category to help you find the right AI productivity tool.',
    ja: 'ainav.spaceはAIライティング、画像生成、動画、コーディングなど多様なAIツールを厳選して収録。無料・有料ツールをカテゴリ別に整理。',
    ko: 'ainav.space는 AI 작성, 이미지, 동영상, 코딩 등 다양한 AI 도구를 수록합니다.',
    fr: "ainav.space recense les meilleurs outils IA couvrant l'écriture, l'image, la vidéo, le code et plus encore.",
  };

  return generateSEO({
    locale: lang as Locale,
    title: titleMap[lang as Locale],
    description: descMap[lang as Locale],
    url: `/${lang}`,
  });
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  // 验证语言参数，无效语言返回404
  if (!locales.includes(langParam as Locale)) {
    notFound();
  }
  const lang = langParam as Locale;
  const dictionary = getDictionary(lang);
  const categories = getAllCategories(lang);
  const [featuredServices, allServices, ratingsMap] = await Promise.all([
    getFeaturedAIServices(lang),
    getAllAIServices(lang),
    getAllRatings(),
  ]);

  const categoryCounts = await Promise.all(
    categories.map(async (category) => ({
      ...category,
      count: (await getAIServicesByCategory(category.id, lang)).length,
    }))
  );

  // 生成 JSON-LD 结构化数据
  const websiteSchema = generateWebsiteSchema(lang);
  const organizationSchema = generateOrganizationSchema();

  return (
    <>
      {/* JSON-LD 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <div className="min-h-screen relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-400/20 dark:bg-blue-900/20 blur-[100px] rounded-full -z-10 pointer-events-none" />
      <div className="absolute top-[20%] right-0 w-[800px] h-[600px] bg-purple-400/20 dark:bg-purple-900/20 blur-[100px] rounded-full -z-10 pointer-events-none" />

      <div className="container mx-auto px-4 py-16 md:py-24">
        {/* Hero Section */}
        <section className="text-center mb-20 relative z-10">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 backdrop-blur-sm">
            <Rocket className="w-4 h-4" />
            <span className="text-sm font-semibold tracking-wide uppercase">
              {dictionary.hero.subtitle.split(' ')[0]}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-200 dark:to-white mb-6 leading-tight tracking-tight">
            {dictionary.hero.title}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            {dictionary.hero.subtitle}
          </p>
          <SearchBar
            locale={lang}
            placeholder={dictionary.search.placeholder}
            buttonText={dictionary.search.button}
          />
        </section>

        {/* Stats Section with Glassmorphism */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24 max-w-4xl mx-auto">
          {[
            { value: allServices.length, label: dictionary.stats.tools, icon: Wrench, color: 'text-blue-500', href: `/${lang}/tools`, isAnchor: false },
            { value: categories.length, label: dictionary.stats.categories, icon: Folder, color: 'text-purple-500', href: '#categories', isAnchor: true },
            { value: featuredServices.length, label: dictionary.stats.featured, icon: Star, color: 'text-yellow-500', href: '#featured', isAnchor: true },
          ].map((stat, idx) => {
            const content = (
              <>
                <div className={`mb-4 inline-flex p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 group-hover:scale-110 transition-transform duration-300 ${stat.color}`}>
                  <stat.icon className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-gray-500 dark:text-gray-400 font-medium">{stat.label}</div>
              </>
            );

            const className = "bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 text-center border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer block";

            return stat.isAnchor ? (
              <a key={idx} href={stat.href} className={className}>
                {content}
              </a>
            ) : (
              <Link key={idx} href={stat.href} className={className}>
                {content}
              </Link>
            );
          })}
        </section>

        <section id="categories" className="mb-24 scroll-mt-20">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white relative inline-block">
              {dictionary.sections.browseCategories}
              <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-blue-600 rounded-full"></span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {categoryCounts.map((category) => (
              <CategoryCard key={category.id} category={category} count={category.count} locale={lang} />
            ))}
          </div>
        </section>

        <section id="featured" className="mb-12 scroll-mt-20">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white relative inline-block">
              {dictionary.sections.featured}
              <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-purple-600 rounded-full"></span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredServices.map((service) => (
              <AIServiceCard 
                key={service.id} 
                service={service} 
                locale={lang} 
                rating={ratingsMap.get(service.id) || null}
            />
            ))}
          </div>
        </section>
      </div>
    </div>
    </>
  );
}