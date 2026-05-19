import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateProfileApi, changePasswordApi, toggleAvailabilityApi } from '../../api/user.api';
import { getMeApi } from '../../api/auth.api';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'info',     label: 'Thông tin cá nhân', icon: '👤' },
  { key: 'password', label: 'Đổi mật khẩu',       icon: '🔒' },
];

function InputField({ label, name, value, onChange, type = 'text', placeholder, required }) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input
        type={type} name={name} value={value || ''} onChange={onChange}
        placeholder={placeholder} required={required}
        className="input-field"
      />
    </div>
  );
}

export default function UserProfilePage() {
  const { user, setUser } = useAuth();
  const [tab, setTab] = useState('info');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fullName: '', phone: '', address: '', district: '', city: '',
    preferredPayment: 'cash', bio: '',
  });

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  useEffect(() => {
    if (!user) return;
    setForm({
      fullName:         user.fullName || '',
      phone:            user.phone || '',
      address:          user.address || '',
      district:         user.district || '',
      city:             user.city || '',
      preferredPayment: user.preferredPayment || 'cash',
      bio:              user.bio || '',
    });
  }, [user]);

  const set = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const setPw = (e) => setPwForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) return toast.error('Vui lòng nhập họ tên');
    setSaving(true);
    try {
      await updateProfileApi(form);
      // Cập nhật lại user trong context
      const { data } = await getMeApi();
      setUser(data.data);
      toast.success('Cập nhật thông tin thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật thông tin');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return toast.error('Mật khẩu xác nhận không khớp');
    }
    if (pwForm.newPassword.length < 6) {
      return toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
    }
    setSaving(true);
    try {
      await changePasswordApi({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Đổi mật khẩu thành công!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể đổi mật khẩu');
    } finally { setSaving(false); }
  };

  const handleToggleAvailability = async () => {
    try {
      const { data } = await toggleAvailabilityApi(!user.isAvailable);
      setUser(prev => ({ ...prev, isAvailable: data.data.isAvailable }));
      toast.success(data.message);
    } catch (err) {
      toast.error('Không thể thay đổi trạng thái');
    }
  };

  if (!user) return null;

  const initials = user.fullName?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || '?';

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Hồ sơ cá nhân</h1>

      {/* Profile header card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-2xl font-bold text-white shadow-md overflow-hidden">
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                : initials}
            </div>
            <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${user.isAvailable !== false ? 'bg-green-500' : 'bg-gray-400'}`} />
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{user.fullName}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 font-medium capitalize">
                {user.userType === 'customer' ? '🛍️ Khách hàng' : user.userType === 'helper' ? '🧹 Người giúp việc' : '⚙️ Admin'}
              </span>
              {user.userType === 'helper' && (
                <button onClick={handleToggleAvailability}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${
                    user.isAvailable !== false
                      ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {user.isAvailable !== false ? '● Đang nhận việc' : '○ Tạm nghỉ'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === t.key ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:block">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Thông tin */}
      {tab === 'info' && (
        <form onSubmit={handleSaveInfo} className="space-y-5 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-sm">📋</span>
              Thông tin cơ bản
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <InputField label="Họ và tên" name="fullName" value={form.fullName} onChange={set} placeholder="Nguyễn Văn A" required />
              <InputField label="Số điện thoại" name="phone" value={form.phone} onChange={set} type="tel" placeholder="0912345678" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">📍</span>
              Địa chỉ
            </h3>
            <div className="space-y-4">
              <InputField label="Địa chỉ" name="address" value={form.address} onChange={set} placeholder="123 Đường ABC" />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Quận/Huyện" name="district" value={form.district} onChange={set} placeholder="Quận 1" />
                <InputField label="Thành phố" name="city" value={form.city} onChange={set} placeholder="TP.HCM" />
              </div>
            </div>
          </div>

          {user.userType === 'customer' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-sm">💳</span>
                Thanh toán ưa thích
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { key: 'cash', icon: '💵', label: 'Tiền mặt' },
                  { key: 'bank_transfer', icon: '🏧', label: 'Chuyển khoản' },
                  { key: 'vnpay', icon: '🏦', label: 'VNPay' },
                ].map(({ key, icon, label }) => (
                  <button key={key} type="button" onClick={() => setForm(p => ({ ...p, preferredPayment: key }))}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                      form.preferredPayment === key ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <span className="text-xl">{icon}</span>
                    <span className={`text-xs font-medium ${form.preferredPayment === key ? 'text-orange-700' : 'text-gray-600'}`}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {user.userType === 'helper' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm">✏️</span>
                Giới thiệu bản thân
              </h3>
              <div>
                <label className="label">Bio (giới thiệu ngắn)</label>
                <textarea name="bio" rows={3} value={form.bio || ''} onChange={set}
                  placeholder="Hãy chia sẻ kinh nghiệm và điểm mạnh của bạn..."
                  className="input-field resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{(form.bio || '').length}/200 ký tự</p>
              </div>
            </div>
          )}

          <button type="submit" disabled={saving}
            className="w-full btn-primary py-3.5 text-base disabled:opacity-50">
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Đang lưu...
              </span>
            ) : '💾 Lưu thông tin'}
          </button>
        </form>
      )}

      {/* Tab: Đổi mật khẩu */}
      {tab === 'password' && (
        <form onSubmit={handleChangePassword} className="animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span className="w-7 h-7 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-sm">🔒</span>
              Thay đổi mật khẩu
            </h3>

            {[
              { name: 'currentPassword', label: 'Mật khẩu hiện tại', key: 'current' },
              { name: 'newPassword',     label: 'Mật khẩu mới',      key: 'new'     },
              { name: 'confirmPassword', label: 'Xác nhận mật khẩu mới', key: 'confirm' },
            ].map(({ name, label, key }) => (
              <div key={name}>
                <label className="label">{label}</label>
                <div className="relative">
                  <input
                    type={showPw[key] ? 'text' : 'password'}
                    name={name}
                    value={pwForm[name]}
                    onChange={setPw}
                    placeholder="••••••••"
                    required
                    className="input-field pr-12"
                  />
                  <button type="button"
                    onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPw[key] ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            ))}

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-600">
              💡 Mật khẩu phải có ít nhất 6 ký tự. Nên dùng kết hợp chữ và số.
            </div>

            <button type="submit" disabled={saving}
              className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50">
              {saving ? 'Đang đổi...' : '🔑 Đổi mật khẩu'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
