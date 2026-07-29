import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, Home, ArrowRight, Bot, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: '404 - Page Not Found | AI Nav · ainav.space',
  description:
    'The page you were looking for could not be found. Browse our curated AI tools directory to discover the best AI software.',
  robots: {
    index: false,
    follow: true,
  },
};

const POPULAR_CATEGORIES = [
  { id: 'chat', label: 'AI Chat', icon: '💬' },
  { id: 'image', label: 'AI Image', icon: '🎨' },
  { id: 'writing', label: 'AI Writing', icon: '✍️' },
  { id: 'coding', label: 'AI Coding', icon: '💻' },
];

const LOCALE_LINKS = [
  { locale: 'zh', label: '中文首页', flag: '🇨🇳' },
  { locale: 'en', label: 'English', flag: '🇺🇸' },
  { locale: 'ja', label: '日本語', flag: '🇯🇵' },
  { locale: 'ko', label: '한국어', flag: '🇰🇷' },
  { locale: 'fr', label: 'Français', flag: '🇫🇷' },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Minimal header */}
      <header className="w-full border-b border-gray-200/50 dark:border-gray-800/50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl">
        <nav className="container mx-auto px-4 h-16 flex items-center">
          <Link href="/zh" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
              AI Nav
            </span>
          </Link>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-400/10 dark:bg-blue-900/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-purple-400/10 dark:bg-purple-900/20 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-2xl w-full text-center">
          {/* 404 badge */}
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold tracking-wide uppercase">404 Error</span>
          </div>

          {/* Large 404 */}
          <div className="text-[120px] sm:text-[160px] font-black leading-none tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900 select-none mb-2">
            404
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Oops! Page not found
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-md mx-auto leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Try heading back to our AI tools directory.
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link
              href="/zh"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-gray-200/50 dark:shadow-none"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
            <Link
              href="/zh/search"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Search className="w-4 h-4" />
              Search AI Tools
            </Link>
          </div>

          {/* Popular categories */}
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
              Popular Categories
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {POPULAR_CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/zh/category/${cat.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm transition-all"
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                  <ArrowRight className="w-3 h-3 opacity-40" />
                </Link>
              ))}
            </div>
          </div>

          {/* Language switcher */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
              Choose your language
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {LOCALE_LINKS.map(({ locale, label, flag }) => (
                <Link
                  key={locale}
                  href={`/${locale}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span>{flag}</span>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-6 text-center">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          © 2026{' '}
          <Link href="/zh" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            ainav.space
          </Link>
          {' '}· Curated AI Tools Directory
        </p>
      </footer>
    </div>
  );
}
