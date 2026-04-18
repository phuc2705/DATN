import { useEffect, useState } from 'react';
import { getAdminUsersApi, toggleUserStatusApi } from '../../api/admin.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';

const USER_TYPE_LABEL = { customer: 'Khách hàng', helper: 'Người giúp việc', admin: 'Admin' };

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ userType: '', search: '' });

  const refresh = () => {
    setLoading(true);
    getAdminUsersApi(filter)
      .then(({ data }) => setUsers(data.data?.users || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const handleToggle = async (userId, isActive) => {
    try {
      await toggleUserStatusApi(userId, !isActive);
      toast.success(isActive ? 'Đã khóa tài khoản' : 'Đã kích hoạt tài khoản');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản lý người dùng</h1>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Tìm theo tên, email..."
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={filter.userType}
          onChange={(e) => setFilter({ ...filter, userType: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Tất cả</option>
          <option value="customer">Khách hàng</option>
          <option value="helper">Người giúp việc</option>
        </select>
        <button onClick={refresh} className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-600">
          Lọc
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Họ tên', 'Email', 'Loại', 'Ngày tạo', 'Trạng thái', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.userId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.fullName}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{USER_TYPE_LABEL[u.userType]}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(u.userId, u.isActive)}
                      className={`text-xs px-3 py-1 rounded-lg border ${u.isActive ? 'border-red-300 text-red-500 hover:bg-red-50' : 'border-green-300 text-green-600 hover:bg-green-50'}`}
                    >
                      {u.isActive ? 'Khóa' : 'Mở khóa'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p className="text-center text-gray-400 py-8">Không có kết quả.</p>}
        </div>
      )}
    </div>
  );
}
