import { useEffect, useState } from 'react';
import { getAdminUsersApi, verifyHelperApi, toggleUserStatusApi, deleteUserApi } from '../../api/admin.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Avatar from '../../components/common/Avatar';
import { formatDate, formatPrice } from '../../utils/format';
import { useDebounce } from '../../hooks/useDebounce';
import toast from 'react-hot-toast';

function isNew(createdAt) {
  return createdAt && (Date.now() - new Date(createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
}

export default function AdminHelpersPage() {
  const [helpers, setHelpers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState(''); // '' | 'true' | 'false'
  const [statusFilter, setStatusFilter] = useState('');

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
