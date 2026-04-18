import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerCustomerApi } from '../../api/auth.api';
import toast from 'react-hot-toast';

export default function RegisterCustomerPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '', password: '', fullName: '', phone: '', address: '', city: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerCustomerApi(form);
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Đăng ký Khách hàng</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Họ và tên', field: 'fullName', type: 'text', placeholder: 'Nguyễn Văn A' },
            { label: 'Email', field: 'email', type: 'email', placeholder: 'email@example.com' },
            { label: 'Mật khẩu', field: 'password', type: 'password', placeholder: 'Tối thiểu 6 ký tự' },
            { label: 'Số điện thoại', field: 'phone', type: 'tel', placeholder: '0901234567' },
            { label: 'Địa chỉ', field: 'address', type: 'text', placeholder: '123 Đường ABC, Phường XYZ' },
            { label: 'Thành phố', field: 'city', type: 'text', placeholder: 'Hồ Chí Minh' },
          ].map(({ label, field, type, placeholder }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type} required
                value={form[field]}
                onChange={set(field)}
                placeholder={placeholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          ))}
          <button
            type="submit" disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Là người giúp việc?{' '}
          <Link to="/register/helper" className="text-primary-600 hover:underline">Đăng ký tại đây</Link>
          {' · '}
          <Link to="/login" className="text-primary-600 hover:underline">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
