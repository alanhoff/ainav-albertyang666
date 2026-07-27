import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/admin',
          '/api/admin/',
          '/auth/',
          '/api/auth/',
          '/*?*',   // 禁止带参数的重复内容页
        ],
      },
    ],
    sitemap: 'https://ainav.space/sitemap.xml',
  };
}
