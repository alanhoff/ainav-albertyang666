'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Check, 
  X, 
  ExternalLink, 
  Tag, 
  Mail, 
  Calendar, 
  CircleDollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Layers
} from 'lucide-react';
import PromptDialog from '@/components/PromptDialog';

interface Submission {
  id: string;
  name: string;
  url: string;
  category: string;
  description: string;
  pricing: string | null;
  tags: string | null;
  submitter_email: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  review_note: string | null;
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [promptDialog, setPromptDialog] = useState<{ show: boolean; submissionId: string } | null>(null);
  const [approveDialog, setApproveDialog] = useState<{ show: boolean; submissionId: string; submitterEmail: string | null } | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/submissions?status=${filter}`);
      if (!res.ok) throw new Error('Failed to fetch submissions');
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch {
      setMessage({ type: 'error', text: '获取提交列表失败' });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleAction = async (id: string, action: 'approve' | 'reject', note?: string, sendEmail?: boolean) => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, note, sendEmail }),
      });

      if (!res.ok) throw new Error('Action failed');

      setMessage({
        type: 'success',
        text: action === 'approve'
          ? '已批准并发布。工具当前使用提交时的原始描述，如需多语言翻译请到「服务管理」页面编辑。'
          : '已拒绝提交',
      });
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setMessage({ type: 'error', text: '操作失败' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = (id: string) => {
    setPromptDialog({ show: true, submissionId: id });
  };

  const handleApprove = (submission: Submission) => {
    setApproveDialog({ show: true, submissionId: submission.id, submitterEmail: submission.submitter_email });
  };

  const handleApproveConfirm = (sendEmail: boolean) => {
    if (approveDialog) {
      handleAction(approveDialog.submissionId, 'approve', undefined, sendEmail);
      setApproveDialog(null);
    }
  };

  const handleRejectConfirm = (note: string) => {
    if (promptDialog) {
      handleAction(promptDialog.submissionId, 'reject', note || undefined);
      setPromptDialog(null);
    }
  };

  const filterTabs = [
    { key: 'pending', label: '待审核' },
    { key: 'approved', label: '已批准' },
    { key: 'rejected', label: '已拒绝' },
    { key: 'all', label: '全部' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            提交审核
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            审核用户提交的新 AI 服务
          </p>
        </div>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`flex items-center p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto hover:bg-black/5 dark:hover:bg-white/10 p-1 rounded-full"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* 筛选标签 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-2 inline-flex overflow-x-auto border border-gray-100 dark:border-gray-700/50">
        <div className="flex p-1 gap-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 提交列表 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">加载提交记录中...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-16 text-center border border-gray-100 dark:border-gray-700/50">
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-gray-300 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">暂无提交记录</h3>
          <p className="text-gray-500 dark:text-gray-400">当前筛选条件下没有找到相关记录</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                       {submission.name}
                       <a
                          href={submission.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="访问链接"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                    </h3>
                    <StatusBadge status={submission.status} />
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800/50">
                    {submission.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-2">
                       <Layers className="w-4 h-4 text-gray-400" />
                       <span className="font-medium text-gray-700 dark:text-gray-300">分类:</span> {submission.category}
                    </div>
                    {submission.pricing && (
                      <div className="flex items-center gap-2">
                        <CircleDollarSign className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">定价:</span> 
                        <PricingBadge pricing={submission.pricing} />
                      </div>
                    )}
                    {submission.submitter_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">提交者:</span> {submission.submitter_email}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">提交时间:</span> {new Date(submission.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  
                  {submission.tags && (
                    <div className="flex items-center gap-2 mb-4">
                       <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                       <div className="flex flex-wrap gap-1">
                         {submission.tags.split(',').map(tag => (
                           <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
                             {tag.trim()}
                           </span>
                         ))}
                       </div>
                    </div>
                  )}

                  {submission.review_note && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/30 rounded-xl text-sm text-yellow-800 dark:text-yellow-200">
                      <span className="font-semibold flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4" />
                        审核备注
                      </span>
                      {submission.review_note}
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                {submission.status === 'pending' && (
                  <div className="flex md:flex-col gap-3 pt-4 md:pt-0 md:pl-6 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700/50">
                    <button
                      onClick={() => handleApprove(submission)}
                      disabled={actionLoading === submission.id}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-sm transition-all disabled:opacity-50 text-sm font-medium md:w-32"
                    >
                      {actionLoading === submission.id ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          批准
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(submission.id)}
                      disabled={actionLoading === submission.id}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-200 dark:border-gray-600 rounded-xl transition-all disabled:opacity-50 text-sm font-medium md:w-32"
                    >
                      <X className="w-4 h-4" />
                      拒绝
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 批准确认弹窗 */}
      {approveDialog?.show && (
        <ApproveDialog
          submitterEmail={approveDialog.submitterEmail}
          onConfirm={handleApproveConfirm}
          onCancel={() => setApproveDialog(null)}
        />
      )}

      {/* 输入对话框 */}
      {promptDialog?.show && (
        <PromptDialog
          title="拒绝提交"
          message="请输入拒绝原因（可选）："
          placeholder="请说明拒绝的原因..."
          onConfirm={handleRejectConfirm}
          onCancel={() => setPromptDialog(null)}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900',
    approved: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900',
    rejected: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900',
  };

  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    pending: Clock,
    approved: CheckCircle2,
    rejected: XCircle,
  };

  const labels: Record<string, string> = {
    pending: '待审核',
    approved: '已批准',
    rejected: '已拒绝',
  };

  const Icon = icons[status] || AlertCircle;

  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${styles[status] || 'bg-gray-100'}`}>
      <Icon className="w-3.5 h-3.5" />
      {labels[status] || status}
    </span>
  );
}

function PricingBadge({ pricing }: { pricing: string }) {
  const styles: Record<string, string> = {
    free: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900',
    freemium: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900',
    paid: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-900',
  };

  const labels: Record<string, string> = {
    free: '免费',
    freemium: '部分免费',
    paid: '付费',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${styles[pricing] || 'bg-gray-100'}`}>
      {labels[pricing] || pricing}
    </span>
  );
}

function ApproveDialog({
  submitterEmail,
  onConfirm,
  onCancel,
}: {
  submitterEmail: string | null;
  onConfirm: (sendEmail: boolean) => void;
  onCancel: () => void;
}) {
  const [sendEmail, setSendEmail] = useState(!!submitterEmail);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="font-semibold text-gray-900 dark:text-white">确认批准</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            批准后工具将立即上线，同时触发 AI 多语言翻译。
          </p>
          {/* 发邮件开关 */}
          <label className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
            submitterEmail
              ? 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/40'
              : 'border-gray-100 dark:border-gray-700 opacity-50 cursor-not-allowed'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  发送批准通知邮件
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {submitterEmail ?? '提交者未留邮箱'}
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={sendEmail}
              disabled={!submitterEmail}
              onChange={e => setSendEmail(e.target.checked)}
              className="w-4 h-4 rounded accent-green-600 shrink-0"
            />
          </label>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => onConfirm(sendEmail)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
          >
            <Check className="w-4 h-4" />
            确认批准
          </button>
        </div>
      </div>
    </div>
  );
}