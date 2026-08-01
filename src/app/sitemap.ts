import { getAllCategories, getAllAIServices } from '@/lib/data';
import { locales } from '@/lib/i18n';
import { TOOLS_PAGE_SIZE } from '@/lib/constants';

// 使用 tags 缓存，revalidateTag('tools') 时自动更新 sitemap
export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const baseUrl = 'https://ainav.space';
  const categories = getAllCategories();
  const services = await getAllAIServices('zh');

  // 为路径生成各语言 alternates（hreflang）
  const langAlternates = (subPath: string) => ({
    languages: Object.fromEntries(
      locales.map((l) => [l, `${baseUrl}/${l}${subPath}`])
    ),
  });

  // 分类页面
  const categoryUrls = locales.flatMap((locale) =>
    categories.map((category) => ({
      url: `${baseUrl}/${locale}/category/${category.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      alternates: langAlternates(`/category/${category.id}`),
    }))
  );

  // 服务详情页面
  const serviceUrls = locales.flatMap((locale) =>
    services.map((service) => ({
      url: `${baseUrl}/${locale}/service/${service.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
      alternates: langAlternates(`/service/${service.id}`),
    }))
  );

  // 主要页面
  const localePages = locales.flatMap((locale) => [
    {
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
      alternates: langAlternates(''),
    },
    {
      url: `${baseUrl}/${locale}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
      alternates: langAlternates('/search'),
    },
    {
      url: `${baseUrl}/${locale}/submit`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
      alternates: langAlternates('/submit'),
    },
    {
      url: `${baseUrl}/${locale}/tools`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.85,
      alternates: langAlternates('/tools'),
    },
  ]);

  // 工具目录分页页面（路径式分页 /tools/page/{n}）
  const totalToolsPages = Math.ceil(services.length / TOOLS_PAGE_SIZE);
  const toolsPageUrls = locales.flatMap((locale) =>
    Array.from({ length: totalToolsPages - 1 }, (_, index) => {
      const page = index + 2;
      return {
        url: `${baseUrl}/${locale}/tools/page/${page}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.7,
        alternates: langAlternates(`/tools/page/${page}`),
      };
    })
  );

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    ...localePages,
    ...toolsPageUrls,
    ...categoryUrls,
    ...serviceUrls,
  ];
}
