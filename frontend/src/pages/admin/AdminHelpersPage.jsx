import { useEffect, useState } from 'react';
import {
  getAdminUsersApi,
  verifyHelperApi,
  toggleUserStatusApi,
  deleteUserApi,
  getHelperDetailApi,
} from '../../api/admin.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Avatar from '../../components/common/Avatar';
import { formatDate } from '../../utils/format';
import { useDebounce } from '../../hooks/useDebounce';
import toast from 'react-hot-toast';
import { Search, X, RefreshCw, Star } from 'lucide-react';

// Tabs lọc trạng thái helpers
const TABS = [
  { key: '',      label: 'Tất cả' },
  { key: 'false', label: 'Chờ duyệt', verified: 'false' },
  { key: 'true',  label: 'Đã xác minh', verified: 'true' },
  { key: 'lock',  label: 'Đã khóa', active: 'false' },
];

// Hiển thị sao đánh giá
function Stars({ rating }) {
  const r = Math.round(Number(rating) || 0);
  return (
    <span className="flex gap-px">
      {[1,2,3,4,5].map((s) => (
        <Star
          key={s}
          className={`w-3 h-3 ${s <= r ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
    </span>
  );
}

// Các màu badge trạng thái booking trong modal detail
const BOOKING_STATUS_COLORS = {
  completed:   'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20',
  confirmed:   'bg-blue-400/10 text-blue-300 border border-blue-400/20',
  pending:     'bg-yellow-400/10 text-yellow-300 border border-yellow-400/20',
  in_progress: 'bg-[#5e6ad2]/10 text-[#828fff] border border-[#5e6ad2]/20',
  cancelled:   'bg-red-400/10 text-red-400 border border-red-400/20',
};
const BOOKING_STATUS_LABELS = {
  completed: 'Hoàn thành', confirmed: 'Đã xác nhận', pending: 'Chờ xác nhận',
  in_progress: 'Đang làm', cancelled: 'Đã hủy',
};

// Modal xem chi tiết hồ sơ helper
function HelperDetailModal({ helperId, onClose, onVerify, onToggle }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHelperDetailApi(helperId)
      .then(({ data }) => setDetail(data.data))
      .catch(() => toast.error('Không thể tải hồ sơ'))
      .finally(() => setLoading(false));
  }, [helperId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Header modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">Hồ sơ người giúp việc</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : !detail ? (
          <div className="p-8 text-center text-gray-400">Không tìm thấy dữ liệu</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Profile header */}
            <div className="flex items-start gap-5">
              <Avatar name={detail.full_name} avatarUrl={detail.avatar_url} size="xl" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold text-gray-900">{detail.full_name}</h3>
                  {detail.is_verified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded">
                      ✓ Đã xác minh
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-yellow-400/10 text-yellow-300 border border-yellow-400/20 px-2 py-0.5 rounded">
                      Chờ duyệt
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${detail.is_active ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 'bg-red-400/10 text-red-400 border border-red-400/20'}`}>
                    {detail.is_active ? '● Hoạt động' : '● Đã khóa'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{detail.email} · {detail.phone || 'Chưa cập nhật'}</p>
                <div className="flex items-center gap-3 mt-2 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Stars rating={detail.rating_average} />
                    <span className="font-semibold text-gray-800">{Number(detail.rating_average || 0).toFixed(1)}</span>
                    <span className="text-gray-400">({detail.total_reviews} đánh giá)</span>
                  </span>
                  {detail.hourly_rate && (
                    <span className="text-[#828fff] font-semibold text-xs">
                      {Number(detail.hourly_rate).toLocaleString('vi-VN')}đ/h
                    </span>
                  )}
                </div>
                {detail.bio && <p className="text-sm text-gray-400 mt-2 italic">"{detail.bio}"</p>}
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Đơn hoàn thành', value: detail.completed_bookings ?? 0, color: 'text-emerald-400' },
                { label: 'Đơn đã hủy', value: detail.cancelled_bookings ?? 0, color: 'text-red-400' },
                { label: 'Tổng thu nhập', value: `${Number(detail.total_earned || 0).toLocaleString('vi-VN')}đ`, color: 'text-[#828fff]' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-100 rounded-lg p-3 text-center">
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Thông tin cá nhân */}
            <div>
              <h4 className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-3">Thông tin cá nhân</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'CMND/CCCD', value: detail.id_card_number || '—' },
                  { label: 'Ngày sinh', value: detail.date_of_birth ? new Date(detail.date_of_birth).toLocaleDateString('vi-VN') : '—' },
                  { label: 'Giới tính', value: detail.gender === 'male' ? 'Nam' : detail.gender === 'female' ? 'Nữ' : '—' },
                  { label: 'Ngày tham gia', value: formatDate(detail.joined_at) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">{label}</p>
                    <p className="text-sm font-semibold text-gray-700 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {/* Ảnh CCCD 2 mặt — hiển thị khi có */}
              {(detail.id_card_front_url || detail.id_card_back_url) && (
                <div className="mt-4">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mb-2">Ảnh CCCD / CMND</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Mặt trước', url: detail.id_card_front_url },
                      { label: 'Mặt sau',   url: detail.id_card_back_url  },
                    ].map(({ label, url }) => (
                      <div key={label}>
                        <p className="text-[10px] text-gray-400 mb-1">{label}</p>
                        {url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={url}
                              alt={label}
                              className="w-full h-28 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity cursor-zoom-in"
                            />
                          </a>
                        ) : (
                          <div className="w-full h-28 rounded-lg border border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400">
                            Chưa có ảnh
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dịch vụ cung cấp */}
            {detail.services?.length > 0 && (
              <div>
                <h4 className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-3">Dịch vụ cung cấp</h4>
                <div className="flex flex-wrap gap-2">
                  {detail.services.map((s) => (
                    <span key={s.service_id} className="flex items-center gap-1.5 bg-[#5e6ad2]/10 text-[#828fff] border border-[#5e6ad2]/20 text-xs px-3 py-1.5 rounded-md">
                      {s.service_name}
                      {s.custom_price && <span className="text-[#828fff]/70">· {Number(s.custom_price).toLocaleString('vi-VN')}đ/h</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Đơn hàng gần đây */}
            {detail.recentBookings?.length > 0 && (
              <div>
                <h4 className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-3">Đơn hàng gần đây</h4>
                <div className="space-y-2">
                  {detail.recentBookings.map((b) => (
                    <div key={b.booking_id} className="flex items-center justify-between bg-gray-100 rounded-md px-4 py-3 text-sm">
                      <div>
                        <span className="font-semibold text-gray-700">{b.service_name}</span>
                        <span className="text-gray-400 ml-2 text-xs">· {b.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-xs">{new Date(b.booking_date).toLocaleDateString('vi-VN')}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${BOOKING_STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-500'}`}>
                          {BOOKING_STATUS_LABELS[b.status] || b.status}
                        </span>
                        <span className="text-[#828fff] font-semibold text-xs">{Number(b.total_price).toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Đánh giá gần đây */}
            {detail.recentReviews?.length > 0 && (
              <div>
                <h4 className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-3">Đánh giá gần đây</h4>
                <div className="space-y-3">
                  {detail.recentReviews.map((r, i) => (
                    <div key={i} className="bg-gray-100 rounded-md px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-700">{r.customer_name}</span>
                        <div className="flex items-center gap-2">
                          <Stars rating={r.rating} />
                          <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                      {r.comment && <p className="text-sm text-gray-500 italic">"{r.comment}"</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hành động */}
            <div className="flex gap-3 pt-2 border-t border-gray-200">
              {!detail.is_verified && (
                <button
                  onClick={() => { onVerify(detail.helper_id); onClose(); }}
                  className="flex-1 py-2.5 rounded-md bg-[#5e6ad2] hover:bg-[#828fff] text-white text-sm font-semibold transition-colors"
                >
                  Xác minh tài khoản
                </button>
              )}
              <button
                onClick={() => { onToggle(detail.user_id, detail.is_active); onClose(); }}
                className={`flex-1 py-2.5 rounded-md text-sm font-semibold border transition-colors ${
                  detail.is_active
                    ? 'border-red-400/20 text-red-400 hover:bg-red-400/10'
                    : 'border-emerald-400/20 text-emerald-400 hover:bg-emerald-400/10'
                }`}
              >
                {detail.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-md border border-gray-200 text-gray-500 text-sm hover:bg-gray-100 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Kiểm tra helper mới đăng ký trong 7 ngày
function isNew(createdAt) {
  return createdAt && (Date.now() - new Date(createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
}

export default function AdminHelpersPage() {
  const [helpers, setHelpers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(''); // '', 'false' (chờ duyệt), 'true' (đã xác minh), 'lock'
  const [selectedHelperId, setSelectedHelperId] = useState(null);

  const debouncedSearch = useDebounce(search, 400);

  // Tải danh sách helper với các filter tương ứng tab
  const refresh = () => {
    setLoading(true);
    const params = { userType: 'helper' };
    if (debouncedSearch) params.search = debouncedSearch;
    if (activeTab === 'false') params.isVerified = 'false';
    if (activeTab === 'true') params.isVerified = 'true';
    if (activeTab === 'lock') params.isActive = 'false';

    getAdminUsersApi(params)
      .then(({ data }) => setHelpers(data.data?.users || []))
      .catch(() => toast.error('Không thể tải danh sách'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [debouncedSearch, activeTab]);

  const handleVerify = async (helperId) => {
    try {
      await verifyHelperApi(helperId);
      toast.success('Đã xác minh tài khoản!');
      refresh();
    } catch {
      toast.error('Lỗi xác minh');
    }
  };

  const handleToggle = async (userId, isActive) => {
    try {
      await toggleUserStatusApi(userId, !isActive);
      toast.success(isActive ? 'Đã khóa tài khoản' : 'Đã kích hoạt');
      refresh();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (userId, fullName) => {
    if (!window.confirm(`Xóa tài khoản "${fullName}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await deleteUserApi(userId);
      toast.success('Đã xóa tài khoản');
      refresh();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const pendingCount = helpers.filter((h) => !h.isVerified && h.isActive).length;

  return (
    <div className="animate-fadeIn">
      {/* Modal chi tiết */}
      {selectedHelperId && (
        <HelperDetailModal
          helperId={selectedHelperId}
          onClose={() => setSelectedHelperId(null)}
          onVerify={handleVerify}
          onToggle={handleToggle}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý người giúp việc</h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
            {helpers.length} người giúp việc
            {pendingCount > 0 && (
              <span className="inline-flex items-center bg-yellow-400/10 text-yellow-300 border border-yellow-400/20 text-xs font-bold px-2 py-0.5 rounded">
                {pendingCount} chờ duyệt
              </span>
            )}
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Tabs lọc */}
      <div className="flex items-center gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.key === 'false' && pendingCount > 0 && (
              <span className="ml-1.5 bg-yellow-400/20 text-yellow-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, email, số điện thoại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-100 border border-gray-200 text-gray-700 placeholder-gray-400 rounded-md text-sm focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 transition-all"
              autoComplete="off"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {search && (
            <span className="flex items-center gap-1 self-center bg-[#5e6ad2]/10 text-[#828fff] border border-[#5e6ad2]/20 text-xs px-2.5 py-1 rounded">
              Tìm: "{search}"
              <button onClick={() => setSearch('')} className="ml-0.5 hover:text-gray-900">×</button>
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : helpers.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-700 font-medium">Không tìm thấy người giúp việc nào</p>
          <p className="text-gray-400 text-sm mt-1">Thử thay đổi tab hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  {['Người giúp việc', 'Mức giá', 'Đánh giá', 'Ngày đăng ký', 'Xác minh', 'Trạng thái', 'Hành động'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-[10px] font-medium text-gray-400 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {helpers.map((h) => (
                  <tr
                    key={h.userId}
                    className={`hover:bg-gray-50 transition-colors ${!h.isVerified && h.isActive ? 'bg-yellow-400/5' : ''}`}
                  >
                    {/* Avatar + tên */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={h.fullName} avatarUrl={h.avatarUrl} size="md" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{h.fullName}</p>
                            {isNew(h.createdAt) && (
                              <span className="bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 text-[10px] font-bold px-1.5 py-0.5 rounded">Mới</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{h.email}</p>
                          {h.phone && <p className="text-xs text-gray-400">{h.phone}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Giá */}
                    <td className="px-5 py-4 text-[#828fff] font-semibold text-xs whitespace-nowrap">
                      {h.hourlyRate ? `${Number(h.hourlyRate).toLocaleString('vi-VN')}đ/h` : '—'}
                    </td>

                    {/* Rating */}
                    <td className="px-5 py-4">
                      {h.ratingAverage ? (
                        <div className="flex items-center gap-1.5">
                          <Stars rating={h.ratingAverage} />
                          <span className="text-xs font-semibold text-gray-700">{Number(h.ratingAverage).toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    {/* Ngày đăng ký */}
                    <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">{formatDate(h.createdAt)}</td>

                    {/* Xác minh */}
                    <td className="px-5 py-4">
                      {h.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded">
                          ✓ Đã xác minh
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-yellow-400/10 text-yellow-300 border border-yellow-400/20 px-2 py-0.5 rounded">
                          Chờ duyệt
                        </span>
                      )}
                    </td>

                    {/* Trạng thái */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${h.isActive ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 'bg-red-400/10 text-red-400 border border-red-400/20'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {h.isActive ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedHelperId(h.helperId)}
                          className="text-xs px-3 py-1.5 rounded-md border border-[#5e6ad2]/20 text-[#828fff] hover:bg-[#5e6ad2]/10 font-semibold transition-colors"
                        >
                          Xem hồ sơ
                        </button>
                        {!h.isVerified && (
                          <button
                            onClick={() => handleVerify(h.helperId)}
                            className="text-xs px-3 py-1.5 rounded-md border border-emerald-400/20 text-emerald-400 hover:bg-emerald-400/10 font-semibold transition-colors"
                          >
                            Duyệt
                          </button>
                        )}
                        <button
                          onClick={() => handleToggle(h.userId, h.isActive)}
                          className={`text-xs px-3 py-1.5 rounded-md border font-semibold transition-colors ${
                            h.isActive
                              ? 'border-red-400/20 text-red-400 hover:bg-red-400/10'
                              : 'border-emerald-400/20 text-emerald-400 hover:bg-emerald-400/10'
                          }`}
                        >
                          {h.isActive ? 'Khóa' : 'Mở khóa'}
                        </button>
                        <button
                          onClick={() => handleDelete(h.userId, h.fullName)}
                          className="text-xs px-3 py-1.5 rounded-md border font-semibold text-red-500 border-red-500/20 hover:bg-red-500/10 transition-colors"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {helpers.map((h) => (
              <div
                key={h.userId}
                className={`px-4 py-4 ${!h.isVerified && h.isActive ? 'bg-yellow-400/5' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={h.fullName} avatarUrl={h.avatarUrl} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-gray-900 text-sm truncate">{h.fullName}</p>
                        {isNew(h.createdAt) && <span className="bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0">Mới</span>}
                      </div>
                      <p className="text-xs text-gray-400">{h.phone} {h.hourlyRate ? `· ${Number(h.hourlyRate).toLocaleString('vi-VN')}đ/h` : ''}</p>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${h.isVerified ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 'bg-yellow-400/10 text-yellow-300 border border-yellow-400/20'}`}>
                          {h.isVerified ? 'Đã xác minh' : 'Chờ duyệt'}
                        </span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${h.isActive ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 'bg-red-400/10 text-red-400 border border-red-400/20'}`}>
                          {h.isActive ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setSelectedHelperId(h.helperId)}
                      className="text-xs px-2 py-1 rounded-md border border-[#5e6ad2]/20 text-[#828fff] font-semibold"
                    >
                      Xem
                    </button>
                    {!h.isVerified && (
                      <button
                        onClick={() => handleVerify(h.helperId)}
                        className="text-xs px-2 py-1 rounded-md border border-emerald-400/20 text-emerald-400 font-semibold"
                      >
                        Duyệt
                      </button>
                    )}
                    <button
                      onClick={() => handleToggle(h.userId, h.isActive)}
                      className={`text-xs px-2 py-1 rounded-md border font-semibold ${
                        h.isActive ? 'border-red-400/20 text-red-400' : 'border-emerald-400/20 text-emerald-400'
                      }`}
                    >
                      {h.isActive ? 'Khóa' : 'Mở'}
                    </button>
                    <button
                      onClick={() => handleDelete(h.userId, h.fullName)}
                      className="text-xs px-2 py-1 rounded-md border border-red-500/20 text-red-500 font-semibold"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
