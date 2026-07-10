import type { Metadata } from 'next';
import { Suspense } from 'react';
import BookmarksPageClient from '@/components/BookmarksPageClient';
import { generateSEO } from '@/lib/seo';
import { getDictionary, Locale, locales } from '@/lib/i18n';
import { getAllAIServices } from '@/lib/data';

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = getDictionary(lang);

  return generateSEO({
    locale: lang,
    title: `${dictionary.nav.bookmarks || 'My Bookmarks'} - ${dictionary.siteName}`,
    description: dictionary.siteDescription,
    url: `/${lang}/bookmarks`,
  });
}

export default async function BookmarksPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const allServices = await getAllAIServices(lang);
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-16">加载中...</div>}>
      <BookmarksPageClient locale={lang} allServices={allServices} />
    </Suspense>
  );
}
