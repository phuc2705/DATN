import { useEffect, useState } from 'react';
import { getAdminUsersApi, toggleUserStatusApi } from '../../api/admin.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Avatar from '../../components/common/Avatar';
import { formatDate } from '../../utils/format';
import { useDebounce } from '../../hooks/useDebounce';
import toast from 'react-hot-toast';

const TYPE_COLOR = {
  customer: 'bg-blue-50 text-blue-700',
  helper:   'bg-green-50 text-green-700',
  admin:    'bg-purple-50 text-purple-700',
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
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="text-gray-500 text-sm mt-1">
            {users.length} người dùng
            {newCount > 0 && (
              <span className="ml-2 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                +{newCount} mới trong 7 ngày
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters — auto-apply */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search box */}
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm theo tên, email, số điện thoại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
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

          {/* Type filter */}
          <select
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 focus:bg-white min-w-[160px]"
          >
            <option value="">Tất cả loại</option>
            <option value="customer">Khách hàng</option>
            <option value="helper">Người giúp việc</option>
          </select>

          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 focus:bg-white min-w-[150px]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Đã khóa</option>
          </select>

          {/* Reset */}
          {(search || userType || status) && (
            <button
              onClick={() => { setSearch(''); setUserType(''); setStatus(''); }}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 whitespace-nowrap"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {(search || userType || status) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {search && (
              <span className="flex items-center gap-1 bg-orange-50 text-orange-700 text-xs px-2.5 py-1 rounded-full">
                Tìm: "{search}"
                <button onClick={() => setSearch('')} className="hover:text-orange-900">×</button>
              </span>
            )}
            {userType && (
              <span className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full">
                {TYPE_LABEL[userType]}
                <button onClick={() => setUserType('')} className="hover:text-blue-900">×</button>
              </span>
            )}
            {status && (
              <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">
                {status === 'true' ? 'Đang hoạt động' : 'Đã khóa'}
                <button onClick={() => setStatus('')} className="hover:text-gray-900">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-600 font-medium">Không tìm thấy người dùng nào</p>
          <p className="text-gray-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Người dùng', 'Loại tài khoản', 'Ngày đăng ký', 'Trạng thái', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.userId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.fullName} avatarUrl={u.avatarUrl} size="md" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{u.fullName}</p>
                            {isNew(u.createdAt) && (
                              <span className="bg-green-100 text-green-700 text-xs font-bold px-1.5 py-0.5 rounded-full">Mới</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{u.email}</p>
                          {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge ${TYPE_COLOR[u.userType] || 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABEL[u.userType] || u.userType}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-4">
                      <span className={`badge ${u.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {u.isActive ? '● Hoạt động' : '● Đã khóa'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {u.userType !== 'admin' && (
                        <button
                          onClick={() => handleToggle(u.userId, u.isActive)}
                          className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all ${
                            u.isActive
                              ? 'border-red-200 text-red-500 hover:bg-red-50'
                              : 'border-green-200 text-green-600 hover:bg-green-50'
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
          <div className="md:hidden divide-y divide-gray-50">
            {users.map((u) => (
              <div key={u.userId} className="px-4 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={u.fullName} avatarUrl={u.avatarUrl} size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-gray-900 text-sm truncate">{u.fullName}</p>
                      {isNew(u.createdAt) && <span className="bg-green-100 text-green-700 text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">Mới</span>}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge text-xs ${TYPE_COLOR[u.userType] || 'bg-gray-100 text-gray-600'}`}>{TYPE_LABEL[u.userType]}</span>
                      <span className={`badge text-xs ${u.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{u.isActive ? 'Hoạt động' : 'Đã khóa'}</span>
                    </div>
                  </div>
                </div>
                {u.userType !== 'admin' && (
                  <button
                    onClick={() => handleToggle(u.userId, u.isActive)}
                    className={`text-xs px-3 py-1.5 rounded-xl border font-semibold flex-shrink-0 ${u.isActive ? 'border-red-200 text-red-500' : 'border-green-200 text-green-600'}`}
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
