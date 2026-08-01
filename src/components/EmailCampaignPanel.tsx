'use client';

import { useState, useEffect } from 'react';
import { Send, Mail, CheckCircle, XCircle, Users } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

export default function EmailCampaignPanel() {
  const toast = useToast();
  const [emails, setEmails] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    stats?: { total: number; successful: number; failed: number };
  } | null>(null);

  // Load subscriber count on mount
  useEffect(() => {
    fetchSubscriberCount();
    
    // Check if emails are passed via URL params
    const params = new URLSearchParams(window.location.search);
    const emailsParam = params.get('emails');
    if (emailsParam) {
      setEmails(emailsParam.replace(/,/g, '\n'));
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const fetchSubscriberCount = async () => {
    try {
      const response = await fetch('/api/admin/subscribers');
      const data = await response.json();
      if (data.success) {
        setSubscriberCount(data.count);
      }
    } catch (error) {
      console.error('Failed to fetch subscriber count:', error);
    }
  };

  const loadAllSubscribers = async () => {
    setLoadingSubscribers(true);
    try {
      const response = await fetch('/api/admin/subscribers');
      const data = await response.json();
      if (data.success) {
        const subscriberEmails = data.subscribers.map((s: { email: string }) => s.email).join('\n');
        setEmails(subscriberEmails);
      }
    } catch (error) {
      console.error('Failed to load subscribers:', error);
      toast.error('加载订阅者失败');
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const handleSendRecommendations = async () => {
    const emailList = emails
      .split(/[,\n]/)
      .map(e => e.trim())
      .filter(e => e && e.includes('@'));

    if (emailList.length === 0) {
      setResult({
        success: false,
        message: '请输入有效的邮箱地址',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/send-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails: emailList }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          stats: data.stats,
        });
        setEmails(''); // 清空输入框
      } else {
        setResult({
          success: false,
          message: data.error || '发送失败',
        });
      }
    } catch {
      setResult({
        success: false,
        message: '网络错误，请重试',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Mail className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              工具推荐邮件
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              向用户发送精选工具推荐
            </p>
          </div>
        </div>

        {/* Quick Load Subscribers Button */}
        <button
          onClick={loadAllSubscribers}
          disabled={loadingSubscribers || subscriberCount === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          <Users className="w-4 h-4" />
          {loadingSubscribers ? '加载中...' : `加载全部订阅者 (${subscriberCount})`}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            收件人邮箱（每行一个或用逗号分隔）
          </label>
          <textarea
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            将自动发送包含当前精选工具的推荐邮件
          </p>
        </div>

        <button
          onClick={handleSendRecommendations}
          disabled={loading || !emails.trim()}
          className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <Send className="w-5 h-5" />
          {loading ? '发送中...' : '发送推荐邮件'}
        </button>

        {result && (
          <div
            className={`flex items-start gap-3 p-4 rounded-lg ${
              result.success
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}
          >
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p
                className={`font-medium ${
                  result.success
                    ? 'text-green-800 dark:text-green-300'
                    : 'text-red-800 dark:text-red-300'
                }`}
              >
                {result.message}
              </p>
              {result.stats && (
                <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                  <p>总数: {result.stats.total}</p>
                  <p>成功: {result.stats.successful}</p>
                  {result.stats.failed > 0 && <p>失败: {result.stats.failed}</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
          💡 使用提示
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• 邮件将包含当前首页的精选工具</li>
          <li>• 支持批量发送，每行一个邮箱地址</li>
          <li>• 邮件使用精美的HTML模板设计</li>
          <li>• 建议先发送测试邮件确认效果</li>
        </ul>
      </div>
    </div>
  );
}
