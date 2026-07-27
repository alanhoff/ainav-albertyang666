'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Languages, X, Save, AlertCircle, CheckCircle, Loader2, Zap, Plus } from 'lucide-react';

const LANGS = ['zh', 'en', 'ja', 'ko', 'fr'] as const;
type Locale = typeof LANGS[number];

const LOCALE_LABELS: Record<Locale, string> = {
  zh: '中文', en: 'English', ja: '日本語', ko: '한국어', fr: 'Français',
};

type TranslationItem = { name?: string; description?: string; tags?: string[] };
type TranslationMap = Partial<Record<Locale, TranslationItem>>;

interface ServiceRow {
  id: string;
  url?: string;
  category?: string;
  status?: string;
  translations: TranslationMap;
  updated_at?: string;
}

function isMissing(t?: TranslationItem) {
  return !t?.name?.trim() || !t?.description?.trim();
}

function missingCount(translations: TranslationMap) {
  return LANGS.filter(l => isMissing(translations?.[l])).length;
}

// ── Edit modal ────────────────────────────────────────────────
interface EditModalProps {
  service: ServiceRow;
  locale: Locale;
  onClose: () => void;
  onSaved: () => void;
}

function EditModal({ service, locale, onClose, onSaved }: EditModalProps) {
  const t = service.translations?.[locale] || {};
  const [name, setName] = useState(t.name || '');
  const [description, setDescription] = useState(t.description || '');
  const [tagsStr, setTagsStr] = useState((t.tags || []).join(', '));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/translations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: service.id,
          locale,
          name,
          description,
          tags: tagsStr.split(',').map((s: string) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'ok', text: '保存成功！' });
        onSaved();
      } else {
        setMsg({ type: 'err', text: data.error || '保存失败' });
      }
    } catch {
      setMsg({ type: 'err', text: '网络错误，请重试' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Languages className="w-5 h-5 text-purple-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              编辑翻译 —{' '}
              <span className="text-purple-600">{LOCALE_LABELS[locale]}</span>
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <p className="text-xs text-gray-400 font-mono truncate">{service.id}</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">工具名称</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="请输入工具名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">描述</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
              placeholder="请输入工具描述"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              标签{' '}
              <span className="text-gray-400 font-normal">（逗号分隔）</span>
            </label>
            <input
              value={tagsStr}
              onChange={e => setTagsStr(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="AI, 写作, 效率"
            />
          </div>
          {msg && (
            <div className={`flex items-center gap-2 text-sm ${msg.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
              {msg.type === 'ok' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {msg.text}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────
type FilterType = 'all' | 'missing' | 'done';

export default function TranslationManagementPage() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [retranslating, setRetranslating] = useState<Record<string, boolean>>({});
  const [retranslateMsg, setRetranslateMsg] = useState<Record<string, string>>({});
  const [editTarget, setEditTarget] = useState<{ service: ServiceRow; locale: Locale } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/translations');
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function retranslate(id: string, mode: 'missing' | 'all' | 'locale', locale?: Locale) {
    const key = mode === 'locale' ? `${id}:${locale}` : `${id}:${mode}`;
    setRetranslating(prev => ({ ...prev, [key]: true }));
    setRetranslateMsg(prev => ({ ...prev, [key]: '' }));
    try {
      const res = await fetch('/api/admin/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, mode, locale }),
      });
      const data = await res.json();
      if (res.ok) {
        const updated: Locale[] = data.updatedLocales || [];
        setRetranslateMsg(prev => ({
          ...prev,
          [key]: updated.length > 0 ? `✓ 已更新：${updated.join(', ')}` : '无需更新',
        }));
        await fetchData();
      } else {
        setRetranslateMsg(prev => ({ ...prev, [key]: `✗ ${data.error || '翻译失败'}` }));
      }
    } catch {
      setRetranslateMsg(prev => ({ ...prev, [key]: '✗ 网络错误' }));
    } finally {
      setRetranslating(prev => ({ ...prev, [key]: false }));
    }
  }

  const filtered = services.filter(s => {
    const matchSearch = search.trim() === '' || s.id.toLowerCase().includes(search.toLowerCase());
    const cnt = missingCount(s.translations);
    if (filter === 'missing') return matchSearch && cnt > 0;
    if (filter === 'done') return matchSearch && cnt === 0;
    return matchSearch;
  });

  const totalMissing = services.filter(s => missingCount(s.translations) > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Languages className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            翻译管理
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            共 {services.length} 个工具
            {totalMissing > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-3.5 h-3.5" />
                {totalMissing} 个工具有缺失翻译
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-2 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索工具 ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border-none text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-0 text-sm"
          />
        </div>
        <div className="flex gap-1 p-1">
          {(['all', 'missing', 'done'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors font-medium ${
                filter === f
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {f === 'all' ? '全部' : f === 'missing' ? '有缺失' : '已完成'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 flex flex-col items-center justify-center py-20 text-gray-400">
          <Languages className="w-12 h-12 mb-4 opacity-30" />
          <p>暂无数据</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(service => {
            const missingLangs = LANGS.filter(l => isMissing(service.translations?.[l]));
            const allDone = missingLangs.length === 0;
            const missingKey = `${service.id}:missing`;
            const allKey = `${service.id}:all`;

            return (
              <div key={service.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                {/* Tool header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3.5 bg-gray-50/80 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700/50">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm shrink-0">
                      {service.id.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{service.id}</p>
                      <p className="text-xs text-gray-400">{service.category || '—'}</p>
                    </div>
                    {allDone ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-medium border border-green-200 dark:border-green-900">
                        <CheckCircle className="w-3 h-3" /> 全部已翻译
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-medium border border-amber-200 dark:border-amber-900">
                        <AlertCircle className="w-3 h-3" /> 缺失 {missingLangs.length} 语言
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {!allDone && (
                      <button
                        onClick={() => retranslate(service.id, 'missing')}
                        disabled={!!retranslating[missingKey]}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors"
                      >
                        {retranslating[missingKey] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                        补全缺失翻译
                      </button>
                    )}
                    <button
                      onClick={() => retranslate(service.id, 'all')}
                      disabled={!!retranslating[allKey]}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900 rounded-lg hover:bg-purple-100 disabled:opacity-50 transition-colors"
                    >
                      {retranslating[allKey] ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      全部重翻译
                    </button>
                    {(retranslateMsg[missingKey] || retranslateMsg[allKey]) && (
                      <span className={`text-xs ${(retranslateMsg[missingKey] || retranslateMsg[allKey]).startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
                        {retranslateMsg[missingKey] || retranslateMsg[allKey]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Per-language rows */}
                <div className="divide-y divide-gray-50 dark:divide-gray-700/30">
                  {LANGS.map(lang => {
                    const t = service.translations?.[lang];
                    const langMissing = isMissing(t);
                    const langKey = `${service.id}:${lang}`;

                    return (
                      <div key={lang} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                          <span className={`shrink-0 inline-flex items-center justify-center w-10 text-xs font-bold py-0.5 rounded mt-0.5 sm:mt-0 ${
                            langMissing
                              ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                              : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                          }`}>
                            {lang}
                          </span>
                          <div className="flex-1 min-w-0">
                            {langMissing ? (
                              <span className="text-sm text-gray-400 italic">— 尚未翻译 —</span>
                            ) : (
                              <>
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t?.name}</p>
                                <p className="text-xs text-gray-400 truncate">{t?.description}</p>
                                {t?.tags && t.tags.length > 0 && (
                                  <div className="flex gap-1 mt-0.5 flex-wrap">
                                    {t.tags.map((tag, i) => (
                                      <span key={i} className="inline-block px-1.5 py-0.5 text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => retranslate(service.id, 'locale', lang)}
                            disabled={!!retranslating[langKey]}
                            title="使用 DeepSeek AI 重新翻译此语言"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-900 rounded-lg hover:bg-purple-100 disabled:opacity-50 transition-colors"
                          >
                            {retranslating[langKey] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                            AI 重翻
                          </button>
                          <button
                            onClick={() => setEditTarget({ service, locale: lang })}
                            title="手动编辑此语言翻译"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            手动编辑
                          </button>
                          {retranslateMsg[langKey] && (
                            <span className={`text-xs ${retranslateMsg[langKey].startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
                              {retranslateMsg[langKey]}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit modal */}
      {editTarget && (
        <EditModal
          service={editTarget.service}
          locale={editTarget.locale}
          onClose={() => setEditTarget(null)}
          onSaved={async () => { await fetchData(); setEditTarget(null); }}
        />
      )}
    </div>
  );
}
