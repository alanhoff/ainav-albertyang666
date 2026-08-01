'use client';

import { useEffect } from 'react';

// [lang] 段的错误边界：渲染出错时优雅降级
export default function LangError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl mb-4" role="img" aria-label="error">⚠️</p>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Something went wrong / 页面出错了
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        An unexpected error occurred. Please try again. / 发生了意外错误，请重试。
      </p>
      <button
        onClick={reset}
        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
      >
        Retry / 重试
      </button>
    </div>
  );
}
