import { useState } from 'react';
import { createFeedbackApi } from '../../api/feedback.api';
import toast from 'react-hot-toast';
import { X, MessageSquare, Bug, AlertCircle, CreditCard, Lightbulb, HelpCircle, CheckCircle } from 'lucide-react';

const CATEGORIES = [
  { value: 'bug',                label: 'Lỗi ứng dụng',                Icon: Bug,           color: 'text-red-500',    bg: 'bg-red-50 border-red-200',    activeBg: 'bg-red-100 border-red-400' },
  { value: 'complaint_helper',   label: 'Khiếu nại về người giúp việc', Icon: AlertCircle,    color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200', activeBg: 'bg-orange-100 border-orange-400' },
  { value: 'complaint_customer', label: 'Khiếu nại về khách hàng',      Icon: AlertCircle,    color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200', activeBg: 'bg-orange-100 border-orange-400' },
  { value: 'payment_issue',      label: 'Vấn đề thanh toán',            Icon: CreditCard,     color: 'text-blue-500',   bg: 'bg-blue-50 border-blue-200',    activeBg: 'bg-blue-100 border-blue-400' },
  { value: 'suggestion',         label: 'Góp ý cải thiện',              Icon: Lightbulb,      color: 'text-green-500',  bg: 'bg-green-50 border-green-200',  activeBg: 'bg-green-100 border-green-400' },
  { value: 'other',              label: 'Khác',                          Icon: HelpCircle,     color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200',    activeBg: 'bg-gray-100 border-gray-400' },
];

// userType: 'customer' | 'helper' — ẩn category không phù hợp
export default function FeedbackModal({ onClose, userType = 'customer', bookingId = null }) {
  const [step, setStep]   = useState('form'); // 'form' | 'done'
  const [form, setForm]   = useState({ category: '', subject: '', description: '' });
  const [saving, setSaving] = useState(false);

  const availableCategories = CATEGORIES.filter(c => {
    if (c.value === 'complaint_customer') return false; // không dùng tính năng này
    if (c.value === 'complaint_helper'   && userType !== 'customer') return false;
    return true;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) { toast.error('Vui lòng chọn danh mục'); return; }
    setSaving(true);
    try {
      await createFeedbackApi({ ...form, bookingId: bookingId || undefined });
      setStep('done');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi phản hồi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-orange-500" />
            <h2 className="font-bold text-gray-900">Phản hồi & Báo cáo</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'done' ? (
          <div className="flex flex-col items-center justify-center gap-4 p-10">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 text-lg">Cảm ơn bạn!</p>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                Phản hồi của bạn đã được ghi nhận.<br />
                Chúng tôi sẽ xem xét và phản hồi sớm nhất có thể.
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-sm transition-colors"
            >
              Đóng
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto flex-1 p-5 space-y-5">

              {/* Category picker */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2.5">Loại phản hồi</p>
                <div className="grid grid-cols-2 gap-2">
                  {availableCategories.map(({ value, label, Icon, color, bg, activeBg }) => {
                    const active = form.category === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, category: value }))}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${active ? activeBg : bg} hover:opacity-90`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
                        <span className={`text-xs font-medium ${active ? 'text-gray-900' : 'text-gray-600'}`}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tiêu đề</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Mô tả ngắn gọn vấn đề..."
                  maxLength={200}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-orange-400 focus:outline-none transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả chi tiết</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Hãy mô tả chi tiết vấn đề bạn gặp phải hoặc góp ý của bạn..."
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-orange-400 focus:outline-none resize-none transition-colors"
                />
              </div>

              {bookingId && (
                <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                  Phản hồi này sẽ được gắn với đơn hàng <span className="font-mono font-semibold">#{bookingId}</span>
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white h-11 rounded-xl font-medium text-sm transition-colors"
              >
                {saving ? 'Đang gửi...' : 'Gửi phản hồi'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 h-11 rounded-xl font-medium text-sm transition-colors"
              >
                Hủy
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
