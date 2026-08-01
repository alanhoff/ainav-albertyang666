'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, 
  ExternalLink, 
  Filter, 
  Bot, 
  Star, 
  Info,
  Zap, 
  Coins,
  Languages,
  Sparkles,
  X,
  Save
} from 'lucide-react';
import type { AIService } from '@/types';

const LOCALES = ['zh', 'en', 'ja', 'ko', 'fr'] as const;
type Locale = typeof LOCALES[number];
const LOCALE_LABELS: Record<Locale, string> = { zh: '中文', en: 'English', ja: '日本語', ko: '한국어', fr: 'Français' };

interface TranslationForm {
  name: string;
  description: string;
  tags: string; // 逗号分隔
}

interface EditState {
  serviceId: string;
  locale: Locale;
  form: TranslationForm;
  saving: boolean;
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<AIService[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'not_featured'>('all');
  const [contentFilter, setContentFilter] = useState<'all' | 'generated' | 'missing'>('all');
  const [loading, setLoading] = useState(true);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [contentIds, setContentIds] = useState<Set<string>>(new Set());
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [batchState, setBatchState] = useState<{ done: number; total: number; failed: number } | null>(null);
  const batchStopRef = useRef(false);

  const fetchContentIds = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/tool-content');
      if (res.ok) {
        const data = await res.json();
        setContentIds(new Set((data.items || []).map((i: { service_id: string }) => i.service_id)));
      }
    } catch {
      // 非关键信息，失败忽略
    }
  }, []);

  const generateContent = async (serviceId: string) => {
    const hasContent = contentIds.has(serviceId);
    if (hasContent && !confirm('该工具已有 AI 生成内容，重新生成将覆盖旧内容，继续？')) return;
    setGeneratingId(serviceId);
    try {
      const res = await fetch('/api/admin/tool-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: serviceId, force: hasContent }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setContentIds(prev => new Set(prev).add(serviceId));
        setSaveMsg(`✅ ${serviceId} 详情内容生成成功（5 语言）`);
      } else {
        setSaveMsg(`❌ 生成失败：${data.error || data.message || '未知错误'}`);
      }
    } catch {
      setSaveMsg('❌ 生成失败，请重试');
    } finally {
      setGeneratingId(null);
    }
  };

  // 批量生成：仅处理还没有内容的工具，串行调用避免 API 限流
  const batchGenerate = async (pending: AIService[]) => {
    if (pending.length === 0) {
      setSaveMsg('✅ 当前列表中的工具都已生成内容');
      return;
    }
    if (!confirm(`将为 ${pending.length} 个工具生成详情内容（已生成的自动跳过），继续？`)) return;

    batchStopRef.current = false;
    let done = 0;
    let failed = 0;
    setBatchState({ done: 0, total: pending.length, failed: 0 });

    for (const service of pending) {
      if (batchStopRef.current) break;
      try {
        const res = await fetch('/api/admin/tool-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: service.id }),
        });
        const data = await res.json();
        if (res.ok && (data.success || data.skipped)) {
          setContentIds(prev => new Set(prev).add(service.id));
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
      done++;
      setBatchState({ done, total: pending.length, failed });
    }

    const stopped = batchStopRef.current;
    setBatchState(null);
    setSaveMsg(
      `${failed === 0 ? '✅' : '⚠️'} 批量生成${stopped ? '已停止' : '完成'}：成功 ${done - failed}/${pending.length}${failed > 0 ? `，失败 ${failed}` : ''}`
    );
  };

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/services');
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);

  const toggleFeatured = async (service: AIService) => {
    setTogglingFeaturedId(service.id);
    try {
      const res = await fetch('/api/admin/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: service.id, featured: !service.featured }),
      });
      if (res.ok) {
        // 乐观更新，避免重新拉取全量列表
        setServices(prev => prev.map(s => s.id === service.id ? { ...s, featured: !service.featured } : s));
        setSaveMsg(`✅ ${service.name || service.id} 已${service.featured ? '取消' : '设为'}精选`);
      } else {
        const data = await res.json();
        setSaveMsg(`❌ 操作失败：${data.error || '未知错误'}（仅支持数据库中的工具）`);
      }
    } catch {
      setSaveMsg('❌ 操作失败，请重试');
    } finally {
      setTogglingFeaturedId(null);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchContentIds();
  }, [fetchServices, fetchContentIds]);

  const openEdit = (service: AIService, locale: Locale) => {
    setEditState({
      serviceId: service.id,
      locale,
      form: {
        name: service.name || '',
        description: service.description || '',
        tags: (service.tags || []).join(', '),
      },
      saving: false,
    });
    setSaveMsg(null);
  };

  const saveTranslation = async () => {
    if (!editState) return;
    setEditState(prev => prev ? { ...prev, saving: true } : null);
    try {
      const res = await fetch('/api/admin/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editState.serviceId,
          locale: editState.locale,
          name: editState.form.name,
          description: editState.form.description,
          tags: editState.form.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        setSaveMsg('保存成功！页面缓存已刷新。');
        await fetchServices();
      } else {
        const data = await res.json();
        setSaveMsg(`保存失败：${data.error || '未知错误'}（JSON 工具不支持 DB 写入，仅限审核上线的工具）`);
      }
    } catch {
      setSaveMsg('保存失败，请重试');
    } finally {
      setEditState(prev => prev ? { ...prev, saving: false } : null);
    }
  };

  // 获取所有分类
  const categories = [...new Set(services.map((s) => s.category))];

  // 筛选服务
  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
    const effectiveStatus = (service as AIService & { status?: string }).status || 'active';
    const matchesStatus = statusFilter === 'all'
      || (statusFilter === 'active' ? effectiveStatus === 'active' : effectiveStatus !== 'active');
    const matchesFeatured = featuredFilter === 'all'
      || (featuredFilter === 'featured' ? service.featured : !service.featured);
    const matchesContent = contentFilter === 'all'
      || (contentFilter === 'generated' ? contentIds.has(service.id) : !contentIds.has(service.id));
    return matchesSearch && matchesCategory && matchesStatus && matchesFeatured && matchesContent;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500">加载服务中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Bot className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            服务管理
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            共 {services.length} 个服务
          </p>
        </div>
        {/* 批量 AI 生成（作用于当前筛选结果中未生成的工具） */}
        {batchState ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span>
                {batchState.done}/{batchState.total}
                {batchState.failed > 0 && <span className="text-red-500 ml-1">（失败 {batchState.failed}）</span>}
              </span>
            </div>
            <button
              onClick={() => { batchStopRef.current = true; }}
              className="inline-flex items-center px-3 py-2 text-sm rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 transition-colors"
            >
              停止
            </button>
          </div>
        ) : (
          <button
            onClick={() => batchGenerate(filteredServices.filter(s => !contentIds.has(s.id)))}
            disabled={loading || generatingId !== null}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 transition-colors disabled:opacity-50"
            title="为当前筛选结果中未生成内容的工具批量生成详情内容"
          >
            <Sparkles className="w-4 h-4" />
            批量生成（{filteredServices.filter(s => !contentIds.has(s.id)).length}）
          </button>
        )}
      </div>

      {/* 筛选栏 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-2 flex flex-col sm:flex-row gap-2 border border-gray-100 dark:border-gray-700/50">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索服务 ID 或名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border-none text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-0"
          />
        </div>
        <div className="h-px w-full sm:h-10 sm:w-px bg-gray-100 dark:bg-gray-700" />
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-transparent border-none text-gray-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:ring-0"
            style={{ backgroundImage: 'none' }}
          >
            <option value="all">所有分类</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
        <div className="h-px w-full sm:h-10 sm:w-px bg-gray-100 dark:bg-gray-700" />
        {/* 状态筛选 */}
        <div className="relative min-w-[140px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'disabled')}
            className="w-full pl-4 pr-8 py-2.5 bg-transparent border-none text-gray-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:ring-0"
            style={{ backgroundImage: 'none' }}
          >
            <option value="all">所有状态</option>
            <option value="active">✅ 已启用</option>
            <option value="disabled">🚫 已禁用</option>
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
        <div className="h-px w-full sm:h-10 sm:w-px bg-gray-100 dark:bg-gray-700" />
        {/* 精选筛选 */}
        <div className="relative min-w-[140px]">
          <select
            value={featuredFilter}
            onChange={(e) => setFeaturedFilter(e.target.value as 'all' | 'featured' | 'not_featured')}
            className="w-full pl-4 pr-8 py-2.5 bg-transparent border-none text-gray-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:ring-0"
            style={{ backgroundImage: 'none' }}
          >
            <option value="all">所有精选状态</option>
            <option value="featured">⭐ 已精选</option>
            <option value="not_featured">未精选</option>
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
        <div className="h-px w-full sm:h-10 sm:w-px bg-gray-100 dark:bg-gray-700" />
        {/* AI 详情内容筛选 */}
        <div className="relative min-w-[160px]">
          <select
            value={contentFilter}
            onChange={(e) => setContentFilter(e.target.value as 'all' | 'generated' | 'missing')}
            className="w-full pl-4 pr-8 py-2.5 bg-transparent border-none text-gray-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:ring-0"
            style={{ backgroundImage: 'none' }}
          >
            <option value="all">所有详情内容</option>
            <option value="generated">✨ 已生成详情</option>
            <option value="missing">⚠️ 未生成详情</option>
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      {/* 生成结果提示 */}
      {saveMsg && !editState && (
        <div className={`rounded-2xl px-4 py-3 text-sm border ${saveMsg.includes('✅') || saveMsg.includes('成功') ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'}`}>
          {saveMsg}
        </div>
      )}

      {/* 服务列表 - 桌面端表格 */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">服务</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">分类</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">定价</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">特色</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">语言</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {filteredServices.map((service) => (
                <tr key={service.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 font-bold text-sm bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                        {service.id.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate max-w-[180px]">
                          {service.name || service.id}
                        </p>
                        <a
                          href={service.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-[180px] flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {service.url.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">
                      {service.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <PricingBadge pricing={service.pricing || 'free'} />
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleFeatured(service)}
                      disabled={togglingFeaturedId !== null}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${service.featured
                        ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900 hover:bg-yellow-100'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 hover:text-yellow-500 hover:border-yellow-200 hover:bg-yellow-50'}`}
                      title={service.featured ? '点击取消精选' : '点击设为精选（首页展示）'}
                    >
                      {togglingFeaturedId === service.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Star className={`w-3.5 h-3.5 ${service.featured ? 'fill-current' : ''}`} />
                      )}
                      {service.featured ? 'Featured' : '设为精选'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {(service.language || []).map((lang) => (
                        <span
                          key={lang}
                          className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md border border-gray-200 dark:border-gray-700"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* AI 生成详情内容 */}
                      <button
                        onClick={() => generateContent(service.id)}
                        disabled={generatingId !== null || batchState !== null}
                        className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors disabled:opacity-50 ${contentIds.has(service.id) ? 'text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30'}`}
                        title={contentIds.has(service.id) ? '已生成详情内容，点击重新生成' : 'AI 生成详情内容（使用场景/快速开始）'}
                      >
                        {generatingId === service.id ? (
                          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </button>
                      {/* 编辑翻译下拉 */}
                      <div className="relative group/menu">
                        <button
                          className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                          title="编辑多语言翻译"
                        >
                          <Languages className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 z-10 hidden group-hover/menu:block min-w-[120px]">
                          {LOCALES.map(locale => (
                            <button
                              key={locale}
                              onClick={() => openEdit(service, locale)}
                              className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{locale}</span>
                              {LOCALE_LABELS[locale]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const currentStatus = (service as AIService & { status?: string }).status;
                            const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
                            const res = await fetch('/api/admin/services', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: service.id, status: newStatus }),
                            });
                            if (res.ok) {
                              await fetchServices();
                            } else {
                              console.error('Failed to toggle status');
                            }
                          } catch (err) {
                            console.error('Toggle status error', err);
                          }
                        }}
                        className={`inline-flex items-center justify-center px-3 py-2 text-sm rounded-lg transition-colors border ${((service as AIService & { status?: string }).status === 'active') ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'}`}
                        title={(service as AIService & { status?: string }).status === 'active' ? '禁用工具' : '启用工具'}
                      >
                        {(service as AIService & { status?: string }).status === 'active' ? '禁用' : '启用'}
                      </button>

                      <a
                        href={service.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="访问网站"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredServices.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
             <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
             <p>没有找到与搜索条件匹配的服务</p>
          </div>
        )}
      </div>

      {/* 服务列表 - 移动端卡片 */}
      <div className="lg:hidden grid gap-4">
        {filteredServices.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700/50">
            <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p>没有找到匹配的服务</p>
          </div>
        ) : (
          filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 border border-gray-100 dark:border-gray-700/50"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                   <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 font-bold text-sm flex-shrink-0">
                      {service.id.substring(0, 2).toUpperCase()}
                   </div>
                   <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {service.name || service.id}
                      </p>
                      <a
                        href={service.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                         访问
                      </a>
                   </div>
                </div>
                <div className="flex gap-1">
                  {LOCALES.map(locale => (
                    <button
                      key={locale}
                      onClick={() => openEdit(service, locale)}
                      className="text-[10px] font-mono px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors"
                      title={`编辑${LOCALE_LABELS[locale]}翻译`}
                    >
                      {locale}
                    </button>
                  ))}
                  <button
                    onClick={() => toggleFeatured(service)}
                    disabled={togglingFeaturedId !== null}
                    className="ml-1 flex-shrink-0 disabled:opacity-50"
                    title={service.featured ? '点击取消精选' : '点击设为精选'}
                  >
                    {togglingFeaturedId === service.id ? (
                      <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Star className={`w-5 h-5 transition-colors ${service.featured ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'}`} />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">
                  {service.category}
                </span>
                <PricingBadge pricing={service.pricing || 'free'} />
              </div>
              
              <div className="flex flex-wrap gap-1 mb-3">
                 {(service.language || []).map((lang) => (
                  <span
                    key={lang}
                    className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded border border-gray-200 dark:border-gray-700"
                  >
                    {lang}
                  </span>
                ))}
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => generateContent(service.id)}
                  disabled={generatingId !== null || batchState !== null}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors border disabled:opacity-50 ${contentIds.has(service.id) ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'}`}
                  title={contentIds.has(service.id) ? '已生成，点击重新生成' : 'AI 生成详情内容'}
                >
                  {generatingId === service.id ? (
                    <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  AI
                </button>
                <button
                  onClick={async () => {
                    try {
                      const currentStatus = (service as AIService & { status?: string }).status;
                      const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
                      const res = await fetch('/api/admin/services', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: service.id, status: newStatus }),
                      });
                      if (res.ok) {
                        await fetchServices();
                      }
                    } catch (err) {
                      console.error('Toggle status error', err);
                    }
                  }}
                  className={`flex-1 inline-flex items-center justify-center px-3 py-2 text-sm rounded-lg transition-colors border ${((service as AIService & { status?: string }).status === 'active') ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'}`}
                >
                  {(service as AIService & { status?: string }).status === 'active' ? '禁用' : '启用'}
                </button>
                <a
                  href={service.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 提示 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 flex gap-4">
        <Info className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-semibold mb-1">多语言翻译说明</p>
          <p className="opacity-90">
            通过审核上线的工具可点击 <Languages className="w-3.5 h-3.5 inline" /> 图标按语言编辑翻译。
            JSON 文件中的存量工具需直接修改对应的 <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded font-mono text-xs">locales/services.*.ts</code> 文件。
          </p>
        </div>
      </div>

      {/* 翻译编辑弹窗 */}
      {editState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Languages className="w-5 h-5 text-purple-600" />
                编辑翻译 —
                <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{editState.locale}</span>
                {LOCALE_LABELS[editState.locale]}
              </h2>
              <button
                onClick={() => setEditState(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                工具 ID：<code className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{editState.serviceId}</code>
                <span className="ml-2 text-amber-600 dark:text-amber-400">仅支持写入数据库中的工具</span>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">名称</label>
                <input
                  type="text"
                  value={editState.form.name}
                  onChange={e => setEditState(prev => prev ? { ...prev, form: { ...prev.form, name: e.target.value } } : null)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">描述</label>
                <textarea
                  rows={3}
                  value={editState.form.description}
                  onChange={e => setEditState(prev => prev ? { ...prev, form: { ...prev.form, description: e.target.value } } : null)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标签（逗号分隔）</label>
                <input
                  type="text"
                  value={editState.form.tags}
                  onChange={e => setEditState(prev => prev ? { ...prev, form: { ...prev.form, tags: e.target.value } } : null)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="标签1, 标签2, 标签3"
                />
              </div>
              {saveMsg && (
                <p className={`text-sm rounded-lg px-3 py-2 ${saveMsg.includes('成功') ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {saveMsg}
                </p>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setEditState(null)}
                className="flex-1 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveTranslation}
                disabled={editState.saving}
                className="flex-1 px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {editState.saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                保存并刷新缓存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PricingBadge({ pricing }: { pricing: string }) {
  const styles: Record<string, string> = {
    free: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900',
    freemium: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900',
    paid: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-900',
  };
  
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    free: Zap,
    freemium: Coins,
    paid: Star
  };

  const labels: Record<string, string> = {
    free: '免费',
    freemium: '免费增值',
    paid: '付费',
  };

  const Icon = icons[pricing] || Zap;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border ${styles[pricing] || 'bg-gray-100'}`}>
      <Icon className="w-3 h-3" />
      {labels[pricing] || pricing}
    </span>
  );
}
