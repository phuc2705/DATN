import { useEffect, useState } from 'react';
import { getAdminUsersApi, toggleUserStatusApi, deleteUserApi } from '../../api/admin.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Avatar from '../../components/common/Avatar';
import { formatDate } from '../../utils/format';
import { useDebounce } from '../../hooks/useDebounce';
import toast from 'react-hot-toast';
import { Search, X, RefreshCw, Users } from 'lucide-react';

// Kiểm tra user có đăng ký trong 7 ngày gần đây không
function isNew(createdAt) {
  return createdAt && (Date.now() - new Date(createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
}

const TYPE_COLOR = {
  customer: 'bg-blue-400/10 text-blue-300 border border-blue-400/20',
  helper:   'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20',
  admin:    'bg-[#5e6ad2]/10 text-[#828fff] border border-[#5e6ad2]/20',
};
const TYPE_LABEL = { customer: 'Khách hàng', helper: 'Người giúp việc', admin: 'Quản trị' };

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userType, setUserType] = useState('customer');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const debouncedSearch = useDebounce(search, 400);

  // Tải danh sách người dùng với params lọc
  const refresh = () => {
    setLoading(true);
    const params = { page, limit: PAGE_SIZE };
    if (debouncedSearch) params.search = debouncedSearch;
    if (userType) params.userType = userType;
    if (status !== '') params.isActive = status;

    getAdminUsersApi(params)
      .then(({ data }) => {
        setUsers(data.data?.users || []);
        setTotal(data.data?.total || 0);
      })
      .catch(() => toast.error('Không thể tải danh sách'))
      .finally(() => setLoading(false));
  };

  // Reset trang khi filter thay đổi
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, userType, status]);

  useEffect(() => {
    refresh();
  }, [debouncedSearch, userType, status, page]);

  const handleToggle = async (userId, isActive) => {
    try {
      await toggleUserStatusApi(userId, !isActive);
      toast.success(isActive ? 'Đã khóa tài khoản' : 'Đã kích hoạt tài khoản');
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

  const clearFilters = () => {
    setSearch('');
    setUserType('customer');
    setStatus('');
    setPage(1);
  };

  const hasFilters = search || userType !== 'customer' || status;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const newCount = users.filter((u) => isNew(u.createdAt)).length;

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="text-gray-500 text-sm mt-1">
            {total} người dùng
            {newCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 text-xs font-bold px-2 py-0.5 rounded">
                +{newCount} mới trong 7 ngày
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

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
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

          {/* Type filter */}
          <select
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            className="bg-gray-100 border border-gray-200 text-gray-700 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 min-w-[160px]"
          >
            <option value="">Tất cả loại</option>
            <option value="customer">Khách hàng</option>
            <option value="helper">Người giúp việc</option>
          </select>

          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-gray-100 border border-gray-200 text-gray-700 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 min-w-[160px]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Đã khóa</option>
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-md text-sm whitespace-nowrap transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {search && (
              <span className="flex items-center gap-1 bg-[#5e6ad2]/10 text-[#828fff] border border-[#5e6ad2]/20 text-xs px-2.5 py-1 rounded">
                Tìm: "{search}"
                <button onClick={() => setSearch('')} className="ml-0.5 hover:text-gray-900">×</button>
              </span>
            )}
            {userType && userType !== 'customer' && (
              <span className="flex items-center gap-1 bg-blue-400/10 text-blue-300 border border-blue-400/20 text-xs px-2.5 py-1 rounded">
                {TYPE_LABEL[userType]}
                <button onClick={() => setUserType('customer')} className="ml-0.5 hover:text-gray-900">×</button>
              </span>
            )}
            {status && (
              <span className="flex items-center gap-1 bg-gray-100 text-gray-500 border border-gray-200 text-xs px-2.5 py-1 rounded">
                {status === 'true' ? 'Đang hoạt động' : 'Đã khóa'}
                <button onClick={() => setStatus('')} className="ml-0.5 hover:text-gray-900">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-700 font-medium">Không tìm thấy người dùng nào</p>
          <p className="text-gray-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    {['Người dùng', 'Loại tài khoản', 'Số điện thoại', 'Ngày đăng ký', 'Trạng thái', ''].map((h) => (
                      <th key={h} className="text-left px-5 py-3.5 text-[10px] font-medium text-gray-400 uppercase tracking-widest whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u.userId} className="hover:bg-gray-50 transition-colors">
                      {/* Avatar + tên + email */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.fullName} avatarUrl={u.avatarUrl} size="md" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">{u.fullName}</p>
                              {isNew(u.createdAt) && (
                                <span className="bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  Mới
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Loại tài khoản */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${TYPE_COLOR[u.userType] || 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                          {TYPE_LABEL[u.userType] || u.userType}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-4 text-gray-500 text-xs">{u.phone || '—'}</td>

                      {/* Ngày đăng ký */}
                      <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">{formatDate(u.createdAt)}</td>

                      {/* Trạng thái */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${u.isActive ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 'bg-red-400/10 text-red-400 border border-red-400/20'}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        {u.userType !== 'admin' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggle(u.userId, u.isActive)}
                              className={`text-xs px-3 py-1.5 rounded-md border font-semibold transition-colors ${
                                u.isActive
                                  ? 'text-red-400 border-red-400/20 hover:bg-red-400/10'
                                  : 'text-emerald-400 border-emerald-400/20 hover:bg-emerald-400/10'
                              }`}
                            >
                              {u.isActive ? 'Khóa' : 'Mở khóa'}
                            </button>
                            <button
                              onClick={() => handleDelete(u.userId, u.fullName)}
                              className="text-xs px-3 py-1.5 rounded-md border font-semibold text-red-500 border-red-500/20 hover:bg-red-500/10 transition-colors"
                            >
                              Xóa
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {users.map((u) => (
                <div key={u.userId} className="px-4 py-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={u.fullName} avatarUrl={u.avatarUrl} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm truncate">{u.fullName}</p>
                        {isNew(u.createdAt) && (
                          <span className="bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0">Mới</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${TYPE_COLOR[u.userType] || 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                          {TYPE_LABEL[u.userType]}
                        </span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${u.isActive ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 'bg-red-400/10 text-red-400 border border-red-400/20'}`}>
                          {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {u.userType !== 'admin' && (
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleToggle(u.userId, u.isActive)}
                        className={`text-xs px-2.5 py-1.5 rounded-md border font-semibold transition-colors ${
                          u.isActive
                            ? 'text-red-400 border-red-400/20 hover:bg-red-400/10'
                            : 'text-emerald-400 border-emerald-400/20 hover:bg-emerald-400/10'
                        }`}
                      >
                        {u.isActive ? 'Khóa' : 'Mở'}
                      </button>
                      <button
                        onClick={() => handleDelete(u.userId, u.fullName)}
                        className="text-xs px-2.5 py-1.5 rounded-md border font-semibold text-red-500 border-red-500/20 hover:bg-red-500/10 transition-colors"
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-400">
                Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} trong {total} người dùng
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Trước
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Tính số trang hiển thị xung quanh trang hiện tại
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                  const pageNum = start + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-9 h-9 rounded-md text-sm font-medium transition-colors ${
                        pageNum === page
                          ? 'bg-[#5e6ad2] text-white'
                          : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
