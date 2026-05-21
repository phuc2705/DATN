import { useEffect, useState } from 'react';
import { getAdminUsersApi, toggleUserStatusApi } from '../../api/admin.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Avatar from '../../components/common/Avatar';
import { formatDate } from '../../utils/format';
import { useDebounce } from '../../hooks/useDebounce';
import toast from 'react-hot-toast';

const TYPE_COLOR = {
  customer: 'bg-blue-400/10 text-blue-300 border border-blue-400/20',
  helper:   'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20',
  admin:    'bg-[#5e6ad2]/10 text-[#828fff] border border-[#5e6ad2]/20',
};
const TYPE_LABEL = { customer: 'Khách hàng', helper: 'Người giúp việc', admin: 'Quản trị' };

function isNew(createdAt) {
  return createdAt && (Date.now() - new Date(createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userType, setUserType] = useState('');
  const [status, setStatus] = useState('');

  const debouncedSearch = useDebounce(search, 400);

  const refresh = (s = debouncedSearch, t = userType, st = status) => {
    setLoading(true);
    const params = {};
    if (s) params.search = s;
    if (t) params.userType = t;
    if (st !== '') params.isActive = st;
    getAdminUsersApi(params)
      .then(({ data }) => setUsers(data.data?.users || []))
      .catch(() => toast.error('Không thể tải danh sách'))
      .finally(() => setLoading(false));
  };

  // Tự động tìm kiếm khi debounced search thay đổi
  useEffect(() => { refresh(debouncedSearch, userType, status); }, [debouncedSearch, userType, status]);

  const handleToggle = async (userId, isActive) => {
    try {
      await toggleUserStatusApi(userId, !isActive);
      toast.success(isActive ? 'Đã khóa tài khoản' : 'Đã kích hoạt tài khoản');
      refresh();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const newCount = users.filter((u) => isNew(u.createdAt)).length;

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#f7f8f8]">Quản lý người dùng</h1>
          <p className="text-[#8a8f98] text-sm mt-1">
            {users.length} người dùng
            {newCount > 0 && (
              <span className="ml-2 bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 text-xs font-bold px-2 py-0.5 rounded">
                +{newCount} mới trong 7 ngày
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#0f1117] rounded-lg p-4 border border-[#1e2028] mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search box */}
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#62666d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm theo tên, email, số điện thoại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-[#0a0b0f] border border-[#23252a] text-[#d0d6e0] placeholder-[#62666d] rounded-md text-sm focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 transition-all"
              autoComplete="off"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#62666d] hover:text-[#d0d6e0] transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Type filter */}
          <select
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            className="bg-[#0a0b0f] border border-[#23252a] text-[#d0d6e0] rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 min-w-[160px]"
          >
            <option value="">Tất cả loại</option>
            <option value="customer">Khách hàng</option>
            <option value="helper">Người giúp việc</option>
          </select>

          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-[#0a0b0f] border border-[#23252a] text-[#d0d6e0] rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/25 min-w-[150px]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Đã khóa</option>
          </select>

          {/* Reset */}
          {(search || userType || status) && (
            <button
              onClick={() => { setSearch(''); setUserType(''); setStatus(''); }}
              className="px-4 py-2.5 bg-[#1e2028] hover:bg-[#272932] text-[#d0d6e0] border border-[#23252a] rounded-md text-sm whitespace-nowrap transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {(search || userType || status) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {search && (
              <span className="flex items-center gap-1 bg-[#5e6ad2]/10 text-[#828fff] border border-[#5e6ad2]/20 text-xs px-2.5 py-1 rounded">
                Tìm: "{search}"
                <button onClick={() => setSearch('')} className="hover:text-[#f7f8f8] ml-0.5">×</button>
              </span>
            )}
            {userType && (
              <span className="flex items-center gap-1 bg-blue-400/10 text-blue-300 border border-blue-400/20 text-xs px-2.5 py-1 rounded">
                {TYPE_LABEL[userType]}
                <button onClick={() => setUserType('')} className="hover:text-[#f7f8f8] ml-0.5">×</button>
              </span>
            )}
            {status && (
              <span className="flex items-center gap-1 bg-[#1e2028] text-[#8a8f98] border border-[#23252a] text-xs px-2.5 py-1 rounded">
                {status === 'true' ? 'Đang hoạt động' : 'Đã khóa'}
                <button onClick={() => setStatus('')} className="hover:text-[#f7f8f8] ml-0.5">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : users.length === 0 ? (
        <div className="bg-[#0f1117] rounded-lg p-12 text-center border border-[#1e2028]">
          <div className="w-12 h-12 bg-[#1e2028] rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-[#62666d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-[#d0d6e0] font-medium">Không tìm thấy người dùng nào</p>
          <p className="text-[#62666d] text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div className="bg-[#0f1117] rounded-lg border border-[#1e2028] overflow-hidden">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0a0b0f] border-b border-[#1e2028]">
                  {['Người dùng', 'Loại tài khoản', 'Ngày đăng ký', 'Trạng thái', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-[10px] font-medium text-[#62666d] uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2028]">
                {users.map((u) => (
                  <tr key={u.userId} className="hover:bg-[#131418] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.fullName} avatarUrl={u.avatarUrl} size="md" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-[#f7f8f8]">{u.fullName}</p>
                            {isNew(u.createdAt) && (
                              <span className="bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 text-xs font-bold px-1.5 py-0.5 rounded">Mới</span>
                            )}
                          </div>
                          <p className="text-xs text-[#62666d]">{u.email}</p>
                          {u.phone && <p className="text-xs text-[#62666d]">{u.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge ${TYPE_COLOR[u.userType] || 'bg-[#1e2028] text-[#8a8f98] border border-[#23252a]'}`}>
                        {TYPE_LABEL[u.userType] || u.userType}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#8a8f98] text-xs">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-4">
                      <span className={`badge ${u.isActive ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 'bg-red-400/10 text-red-400 border border-red-400/20'}`}>
                        {u.isActive ? '● Hoạt động' : '● Đã khóa'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {u.userType !== 'admin' && (
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
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-[#1e2028]">
            {users.map((u) => (
              <div key={u.userId} className="px-4 py-4 flex items-center justify-between gap-3 hover:bg-[#131418] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={u.fullName} avatarUrl={u.avatarUrl} size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-[#f7f8f8] text-sm truncate">{u.fullName}</p>
                      {isNew(u.createdAt) && (
                        <span className="bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0">Mới</span>
                      )}
                    </div>
                    <p className="text-xs text-[#62666d] truncate">{u.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge text-xs ${TYPE_COLOR[u.userType] || 'bg-[#1e2028] text-[#8a8f98] border border-[#23252a]'}`}>{TYPE_LABEL[u.userType]}</span>
                      <span className={`badge text-xs ${u.isActive ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 'bg-red-400/10 text-red-400 border border-red-400/20'}`}>{u.isActive ? 'Hoạt động' : 'Đã khóa'}</span>
                    </div>
                  </div>
                </div>
                {u.userType !== 'admin' && (
                  <button
                    onClick={() => handleToggle(u.userId, u.isActive)}
                    className={`text-xs px-3 py-1.5 rounded-md border font-semibold flex-shrink-0 transition-colors ${
                      u.isActive
                        ? 'text-red-400 border-red-400/20 hover:bg-red-400/10'
                        : 'text-emerald-400 border-emerald-400/20 hover:bg-emerald-400/10'
                    }`}
                  >
                    {u.isActive ? 'Khóa' : 'Mở'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
