import { useEffect, useState } from 'react';
import { getAdminFeedbacksApi, updateFeedbackApi } from '../../api/feedback.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { MessageSquare, Bug, AlertCircle, CreditCard, Lightbulb, HelpCircle, RefreshCw, ChevronDown, X } from 'lucide-react';

// ── Design tokens (Linear dark) ───────────────────────────────────────────────
const CATEGORY_META = {
  bug:                { label: 'Lỗi ứng dụng',           Icon: Bug,          badge: 'bg-red-500/10    text-red-400    border-red-500/20' },
  complaint_helper:   { label: 'Khiếu nại helper',       Icon: AlertCircle,  badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  complaint_customer: { label: 'Khiếu nại khách hàng',   Icon: AlertCircle,  badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  payment_issue:      { label: 'Vấn đề thanh toán',      Icon: CreditCard,   badge: 'bg-blue-500/10   text-blue-400   border-blue-500/20' },
  suggestion:         { label: 'Góp ý cải thiện',        Icon: Lightbulb,    badge: 'bg-green-500/10  text-green-400  border-green-500/20' },
  other:              { label: 'Khác',                   Icon: HelpCircle,   badge: 'bg-[#e5e7eb]     text-gray-500  border-gray-200' },
};

const STATUS_META = {
  open:        { label: 'Mở',          badge: 'bg-yellow-400/10 text-yellow-300 border-yellow-400/20' },
  in_progress: { label: 'Đang xử lý', badge: 'bg-violet-400/10 text-violet-300 border-violet-400/20' },
  resolved:    { label: 'Đã giải quyết', badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  closed:      { label: 'Đóng',        badge: 'bg-[#e5e7eb] text-gray-400 border-gray-200' },
};

const STATUS_TABS = [
  { value: '',           label: 'Tất cả' },
  { value: 'open',       label: 'Mới' },
  { value: 'in_progress',label: 'Đang xử lý' },
  { value: 'resolved',   label: 'Đã giải quyết' },
  { value: 'closed',     label: 'Đóng' },
];

function CategoryBadge({ category }) {
  const m = CATEGORY_META[category] || CATEGORY_META.other;
  const { Icon } = m;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border font-medium ${m.badge}`}>
      <Icon className="w-3 h-3" />
      {m.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.open;
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-md border font-medium ${m.badge}`}>
      {m.label}
    </span>
  );
}

function FeedbackDetailModal({ feedback, onClose, onUpdated }) {
  const [status, setStatus]     = useState(feedback.status);
  const [adminNote, setAdminNote] = useState(feedback.adminNote || '');
  const [saving, setSaving]     = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateFeedbackApi(feedback.feedbackId, { status, adminNote });
      toast.success('Đã cập nhật phản hồi');
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-lg bg-white border border-gray-200 rounded-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-gray-900 font-semibold" style={{ letterSpacing: '-0.3px' }}>
              Chi tiết phản hồi #{feedback.feedbackId}
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">{feedback.userName} · {feedback.userEmail}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Category + status */}
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryBadge category={feedback.category} />
            <StatusBadge status={feedback.status} />
            {feedback.bookingId && (
              <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                Đơn #{feedback.bookingId}
              </span>
            )}
          </div>

          {/* Subject + description */}
          <div>
            <p className="text-gray-900 font-medium text-sm">{feedback.subject}</p>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed whitespace-pre-wrap">{feedback.description}</p>
          </div>

          <p className="text-[10px] text-gray-400">
            Gửi lúc {new Date(feedback.createdAt).toLocaleString('vi-VN')}
          </p>

          <div className="h-px bg-[#e5e7eb]" />

          {/* Admin actions */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Trạng thái</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-gray-100 border border-gray-200 text-gray-700 text-sm rounded-md px-3 py-2 focus:outline-none focus:border-[#5e6ad2]"
              >
                {Object.entries(STATUS_META).map(([v, m]) => (
                  <option key={v} value={v}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Ghi chú admin (sẽ hiển thị cho user)</label>
              <textarea
                rows={3}
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder="Phản hồi của bạn với người dùng..."
                className="w-full bg-gray-100 border border-gray-200 text-gray-700 text-sm rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:border-[#5e6ad2] resize-none"
              />
            </div>
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#5e6ad2] hover:bg-[#828fff] disabled:opacity-60 text-white h-9 rounded-md text-sm font-medium transition-colors"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
          <button onClick={onClose}
            className="px-4 h-9 border border-gray-200 text-gray-500 hover:text-gray-700 rounded-md text-sm transition-colors">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminFeedbacksPage() {
  const [feedbacks,   setFeedbacks]   = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [statusFilter,setStatusFilter]= useState('');
  const [catFilter,   setCatFilter]   = useState('');
  const [page,        setPage]        = useState(1);
  const [detail,      setDetail]      = useState(null);

  const PER_PAGE = 15;

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const { data } = await getAdminFeedbacksApi({
        status: statusFilter || undefined,
        category: catFilter || undefined,
        page,
        limit: PER_PAGE,
      });
      setFeedbacks(data.data?.feedbacks || []);
      setTotal(data.data?.total || 0);
    } catch {
      toast.error('Không thể tải danh sách phản hồi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeedbacks(); }, [statusFilter, catFilter, page]);
  useEffect(() => { setPage(1); }, [statusFilter, catFilter]);

  const openCount = feedbacks.filter(f => f.status === 'open').length;

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1.5">Admin</p>
          <h1 className="text-2xl font-semibold text-gray-900" style={{ letterSpacing: '-0.6px' }}>
            Phản hồi & Báo cáo
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} phản hồi{openCount > 0 && <span className="text-yellow-400 ml-1">· {openCount} mới chưa xử lý</span>}
          </p>
        </div>
        <button
          onClick={fetchFeedbacks}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-md hover:bg-gray-100 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg mb-5 overflow-hidden">
        {/* Status tabs */}
        <div className="flex items-center gap-0.5 px-4 pt-1 overflow-x-auto border-b border-gray-200">
          {STATUS_TABS.map(({ value, label }) => {
            const active = statusFilter === value;
            return (
              <button key={value} onClick={() => setStatusFilter(value)}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all -mb-px ${
                  active ? 'border-[#5e6ad2] text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Category filter */}
        <div className="px-4 py-3 flex items-center gap-3">
          <label className="text-xs text-gray-400 whitespace-nowrap">Danh mục:</label>
          <select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            className="bg-gray-100 border border-gray-200 text-gray-700 text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-[#5e6ad2]"
          >
            <option value="">Tất cả</option>
            {Object.entries(CATEGORY_META).map(([v, m]) => (
              <option key={v} value={v}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner /></div>
        ) : feedbacks.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <MessageSquare className="w-10 h-10 text-gray-300" />
            <p className="text-gray-400 text-sm">Không có phản hồi nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* Header */}
            <div className="hidden md:grid grid-cols-[1fr_1.5fr_1fr_auto_auto] gap-4 px-6 py-3 text-[10px] font-medium text-gray-400 uppercase tracking-widest">
              <span>Người gửi</span>
              <span>Nội dung</span>
              <span>Danh mục</span>
              <span>Trạng thái</span>
              <span></span>
            </div>

            {feedbacks.map(fb => (
              <div key={fb.feedbackId}
                className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr_auto_auto] gap-4 items-center px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setDetail(fb)}
              >
                <div>
                  <p className="text-sm font-medium text-gray-700 truncate">{fb.userName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fb.userEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 truncate">{fb.subject}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{fb.description}</p>
                </div>
                <CategoryBadge category={fb.category} />
                <StatusBadge status={fb.status} />
                <span className="text-xs text-gray-400 whitespace-nowrap hidden md:block">
                  {new Date(fb.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > PER_PAGE && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-xs text-gray-400">
            {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} / {total}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-xs border border-gray-200 text-gray-500 rounded-md disabled:opacity-40 hover:bg-gray-100 transition-colors">
              Trước
            </button>
            <button onClick={() => setPage(p => p + 1)} disabled={page * PER_PAGE >= total}
              className="px-3 py-1.5 text-xs border border-gray-200 text-gray-500 rounded-md disabled:opacity-40 hover:bg-gray-100 transition-colors">
              Sau
            </button>
          </div>
        </div>
      )}

      {detail && (
        <FeedbackDetailModal
          feedback={detail}
          onClose={() => setDetail(null)}
          onUpdated={fetchFeedbacks}
        />
      )}
    </div>
  );
}
