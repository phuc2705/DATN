import { useEffect, useState } from 'react';
import { getAdminUsersApi, verifyHelperApi, toggleUserStatusApi, deleteUserApi, getHelperDetailApi } from '../../api/admin.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Avatar from '../../components/common/Avatar';
import { formatDate, formatPrice } from '../../utils/format';
import { useDebounce } from '../../hooks/useDebounce';
import toast from 'react-hot-toast';

function Stars({ rating }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <span key={s} className={s <= rating ? 'text-yellow-400' : 'text-gray-200'} style={{ fontSize: 14 }}>★</span>
      ))}
    </span>
  );
}

const STATUS_COLORS = {
  completed: 'bg-green-50 text-green-700',
  confirmed: 'bg-blue-50 text-blue-700',
  pending: 'bg-yellow-50 text-yellow-700',
  in_progress: 'bg-orange-50 text-orange-700',
  cancelled: 'bg-red-50 text-red-600',
};
const STATUS_LABELS = {
  completed: 'Hoàn thành', confirmed: 'Đã xác nhận', pending: 'Chờ xác nhận',
  in_progress: 'Đang làm', cancelled: 'Đã hủy',
};

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">Hồ sơ người giúp việc</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
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
                    <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      Đã xác minh
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">Chờ duyệt</span>
                  )}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${detail.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {detail.is_active ? '● Hoạt động' : '● Đã khóa'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{detail.email} · {detail.phone || 'Chưa cập nhật'}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Stars rating={Math.round(detail.rating_average || 0)} />
                    <span className="font-semibold text-gray-800">{Number(detail.rating_average || 0).toFixed(1)}</span>
                    <span className="text-gray-400">({detail.total_reviews} đánh giá)</span>
                  </span>
                  <span className="text-orange-600 font-semibold">{detail.hourly_rate ? `${Number(detail.hourly_rate).toLocaleString()}đ/h` : '—'}</span>
                </div>
                {detail.bio && <p className="text-sm text-gray-500 mt-2 italic">"{detail.bio}"</p>}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Đơn hoàn thành', value: detail.completed_bookings, color: 'text-green-600' },
                { label: 'Đơn đã hủy', value: detail.cancelled_bookings, color: 'text-red-500' },
                { label: 'Tổng thu nhập', value: `${Number(detail.total_earned || 0).toLocaleString()}đ`, color: 'text-orange-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Personal info */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Thông tin cá nhân</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'CMND/CCCD', value: detail.id_card_number || '—' },
                  { label: 'Ngày sinh', value: detail.date_of_birth ? new Date(detail.date_of_birth).toLocaleDateString('vi-VN') : '—' },
                  { label: 'Giới tính', value: detail.gender === 'male' ? 'Nam' : detail.gender === 'female' ? 'Nữ' : '—' },
                  { label: 'Ngày tham gia', value: formatDate(detail.joined_at) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="font-medium text-gray-700">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Services */}
            {detail.services?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Dịch vụ cung cấp</h4>
                <div className="flex flex-wrap gap-2">
                  {detail.services.map((s) => (
                    <span key={s.service_id} className="flex items-center gap-1.5 bg-orange-50 text-orange-700 text-sm px-3 py-1.5 rounded-full">
                      {s.service_name}
                      {s.custom_price && <span className="text-xs text-orange-500">· {Number(s.custom_price).toLocaleString()}đ/h</span>}
                      {s.experience_level && <span className="text-xs text-orange-400">· {s.experience_level}</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recent bookings */}
            {detail.recentBookings?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Đơn hàng gần đây</h4>
                <div className="space-y-2">
                  {detail.recentBookings.map((b) => (
                    <div key={b.booking_id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">{b.service_name}</span>
                        <span className="text-gray-400 ml-2">· {b.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">{new Date(b.booking_date).toLocaleDateString('vi-VN')}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS[b.status] || b.status}
                        </span>
                        <span className="text-orange-600 font-semibold">{Number(b.total_price).toLocaleString()}đ</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent reviews */}
            {detail.recentReviews?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Đánh giá gần đây</h4>
                <div className="space-y-3">
                  {detail.recentReviews.map((r, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{r.customer_name}</span>
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

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              {!detail.is_verified && (
                <button
                  onClick={() => { onVerify(detail.helper_id); onClose(); }}
                  className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors"
                >
                  Xác minh tài khoản
                </button>
              )}
              <button
                onClick={() => { onToggle(detail.user_id, detail.is_active); onClose(); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors border ${
                  detail.is_active
                    ? 'border-red-200 text-red-500 hover:bg-red-50'
                    : 'border-green-200 text-green-600 hover:bg-green-50'
                }`}
              >
                {detail.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
              </button>
              <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors">
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function isNew(createdAt) {
  return createdAt && (Date.now() - new Date(createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
}

export default function AdminHelpersPage() {
  const [helpers, setHelpers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState(''); // '' | 'true' | 'false'
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedHelperId, setSelectedHelperId] = useState(null);

  const debouncedSearch = useDebounce(search, 400);

  const refresh = () => {
    setLoading(true);
    const params = { userType: 'helper' };
    if (debouncedSearch) params.search = debouncedSearch;
    if (verifiedFilter !== '') params.isVerified = verifiedFilter;
    if (statusFilter !== '') params.isActive = statusFilter;
    getAdminUsersApi(params)
      .then(({ data }) => setHelpers(data.data?.users || []))
      .catch(() => toast.error('Không thể tải danh sách'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [debouncedSearch, verifiedFilter, statusFilter]);

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

  const pendingCount = helpers.filter((h) => !h.isVerified).length;
  const newCount = helpers.filter((h) => isNew(h.createdAt)).length;

  return (
    <div className="animate-fadeIn">
      {selectedHelperId && (
        <HelperDetailModal
          helperId={selectedHelperId}
          onClose={() => setSelectedHelperId(null)}
          onVerify={handleVerify}
          onToggle={handleToggle}
        />
      )}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý người giúp việc</h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
            {helpers.length} người giúp việc
            {pendingCount > 0 && (
              <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingCount} chờ duyệt
              </span>
            )}
            {newCount > 0 && (
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                +{newCount} mới
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm theo tên, email, số điện thoại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 focus:bg-white transition-all"
              autoComplete="off"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Verification filter */}
          <select
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 min-w-[170px]"
          >
            <option value="">Tất cả xác minh</option>
            <option value="false">Chờ xét duyệt</option>
            <option value="true">Đã xác minh</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 min-w-[150px]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Đã khóa</option>
          </select>

          {(search || verifiedFilter || statusFilter) && (
            <button
              onClick={() => { setSearch(''); setVerifiedFilter(''); setStatusFilter(''); }}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 whitespace-nowrap"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Active chips */}
        {(search || verifiedFilter || statusFilter) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {search && (
              <span className="flex items-center gap-1 bg-orange-50 text-orange-700 text-xs px-2.5 py-1 rounded-full">
                Tìm: "{search}" <button onClick={() => setSearch('')}>×</button>
              </span>
            )}
            {verifiedFilter && (
              <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 text-xs px-2.5 py-1 rounded-full">
                {verifiedFilter === 'false' ? 'Chờ duyệt' : 'Đã xác minh'} <button onClick={() => setVerifiedFilter('')}>×</button>
              </span>
            )}
            {statusFilter && (
              <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">
                {statusFilter === 'true' ? 'Đang hoạt động' : 'Đã khóa'} <button onClick={() => setStatusFilter('')}>×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : helpers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="text-4xl mb-3">🧹</div>
          <p className="text-gray-600 font-medium">Không tìm thấy người giúp việc nào</p>
          <p className="text-gray-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Người giúp việc', 'Liên hệ', 'Mức giá', 'Ngày đăng ký', 'Xác minh', 'Trạng thái', 'Hành động'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {helpers.map((h) => (
                  <tr key={h.userId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={h.fullName} avatarUrl={h.avatarUrl} size="md" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{h.fullName}</p>
                            {isNew(h.createdAt) && (
                              <span className="bg-green-100 text-green-700 text-xs font-bold px-1.5 py-0.5 rounded-full">Mới</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{h.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-xs">{h.phone || '—'}</td>
                    <td className="px-5 py-4 text-orange-600 font-semibold text-xs whitespace-nowrap">
                      {h.hourlyRate ? `${Number(h.hourlyRate).toLocaleString()}đ/h` : '—'}
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">{formatDate(h.createdAt)}</td>
                    <td className="px-5 py-4">
                      {h.isVerified ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Đã xác minh
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-yellow-600 text-xs font-semibold">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          Chờ duyệt
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge text-xs ${h.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {h.isActive ? '● Hoạt động' : '● Đã khóa'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedHelperId(h.helperId)}
                          className="text-xs px-3 py-1.5 rounded-xl border border-blue-200 text-blue-600 hover:bg-blue-50 font-semibold transition-all"
                        >
                          Xem
                        </button>
                        {!h.isVerified && (
                          <button
                            onClick={() => handleVerify(h.helperId)}
                            className="text-xs px-3 py-1.5 rounded-xl border border-green-200 text-green-600 hover:bg-green-50 font-semibold transition-all"
                          >
                            Xác minh
                          </button>
                        )}
                        <button
                          onClick={() => handleToggle(h.userId, h.isActive)}
                          className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all ${
                            h.isActive
                              ? 'border-red-200 text-red-500 hover:bg-red-50'
                              : 'border-green-200 text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {h.isActive ? 'Khóa' : 'Mở khóa'}
                        </button>
                        <button
                          onClick={() => handleDelete(h.userId, h.fullName)}
                          className="text-xs px-3 py-1.5 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 font-semibold transition-all"
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

          {/* Mobile */}
          <div className="md:hidden divide-y divide-gray-50">
            {helpers.map((h) => (
              <div key={h.userId} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={h.fullName} avatarUrl={h.avatarUrl} size="md" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-gray-900 text-sm">{h.fullName}</p>
                        {isNew(h.createdAt) && <span className="bg-green-100 text-green-700 text-xs font-bold px-1.5 py-0.5 rounded-full">Mới</span>}
                      </div>
                      <p className="text-xs text-gray-400">{h.phone} · {h.hourlyRate ? `${Number(h.hourlyRate).toLocaleString()}đ/h` : ''}</p>
                      <div className="flex gap-2 mt-1">
                        <span className={`badge text-xs ${h.isVerified ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                          {h.isVerified ? 'Đã xác minh' : 'Chờ duyệt'}
                        </span>
                        <span className={`badge text-xs ${h.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          {h.isActive ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button onClick={() => setSelectedHelperId(h.helperId)} className="text-xs px-2 py-1 rounded-lg border border-blue-200 text-blue-600 font-semibold">Xem</button>
                    {!h.isVerified && (
                      <button onClick={() => handleVerify(h.helperId)} className="text-xs px-2 py-1 rounded-lg border border-green-200 text-green-600 font-semibold">Xác minh</button>
                    )}
                    <button
                      onClick={() => handleToggle(h.userId, h.isActive)}
                      className={`text-xs px-2 py-1 rounded-lg border font-semibold ${h.isActive ? 'border-red-200 text-red-500' : 'border-green-200 text-green-600'}`}
                    >
                      {h.isActive ? 'Khóa' : 'Mở'}
                    </button>
                    <button
                      onClick={() => handleDelete(h.userId, h.fullName)}
                      className="text-xs px-2 py-1 rounded-lg border border-red-300 text-red-600 font-semibold"
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
