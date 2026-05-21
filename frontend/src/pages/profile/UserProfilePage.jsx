import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateProfileApi, changePasswordApi, toggleAvailabilityApi } from '../../api/user.api';
import { getMeApi } from '../../api/auth.api';
import toast from 'react-hot-toast';
import {
  User, Lock, ShoppingBag, Sparkles, Settings,
  ClipboardList, MapPin, CreditCard, Pencil,
  Wallet, Building2, Save, KeyRound,
  Eye, EyeOff, Lightbulb, Loader2, CheckCircle,
} from 'lucide-react';

const TABS = [
  { key: 'info',     label: 'Thông tin cá nhân', Icon: User },
  { key: 'password', label: 'Đổi mật khẩu',      Icon: Lock },
];

function FormField({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({ name, value, onChange, type = 'text', placeholder, required }) {
  return (
    <input
      type={type}
      name={name}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full bg-white border border-gray-200 rounded-lg h-11 px-4 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none transition-colors"
    />
  );
}

const PAYMENT_OPTIONS = [
  { key: 'cash',          Icon: Wallet,    label: 'Tiền mặt'     },
  { key: 'bank_transfer', Icon: Building2, label: 'Chuyển khoản' },
  { key: 'vnpay',         Icon: CreditCard, label: 'VNPay'       },
];

export default function UserProfilePage() {
  const { user, setUser } = useAuth();
  const [tab,    setTab]    = useState('info');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fullName: '', phone: '', address: '', district: '', city: '',
    preferredPayment: 'cash', bio: '',
  });

  const [pwForm,  setPwForm]  = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw,  setShowPw]  = useState({ current: false, new: false, confirm: false });

  useEffect(() => {
    if (!user) return;
    setForm({
      fullName:         user.fullName        || '',
      phone:            user.phone           || '',
      address:          user.address         || '',
      district:         user.district        || '',
      city:             user.city            || '',
      preferredPayment: user.preferredPayment || 'cash',
      bio:              user.bio             || '',
    });
  }, [user]);

  const set   = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const setPw = (e) => setPwForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) return toast.error('Vui lòng nhập họ tên');
    setSaving(true);
    try {
      await updateProfileApi(form);
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
    } catch {
      toast.error('Không thể thay đổi trạng thái');
    }
  };

  if (!user) return null;

  const initials = user.fullName?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || '?';

  const userTypeMeta = {
    customer: { Icon: ShoppingBag, label: 'Khách hàng',     color: 'bg-blue-50 text-blue-700 border border-blue-100'     },
    helper:   { Icon: Sparkles,    label: 'Người giúp việc', color: 'bg-orange-50 text-orange-700 border border-orange-100' },
    admin:    { Icon: Settings,    label: 'Admin',           color: 'bg-gray-50 text-gray-700 border border-gray-200'     },
  };
  const typeMeta = userTypeMeta[user.userType] || userTypeMeta.customer;
  const TypeIcon = typeMeta.Icon;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý thông tin và bảo mật tài khoản</p>
        </div>

        {/* Avatar / identity card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-2xl font-bold text-orange-600 overflow-hidden">
                {user.avatarUrl
                  ? <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                  : initials}
              </div>
              {/* Online dot */}
              <span className={`absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-white ${
                user.isAvailable !== false ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate">{user.fullName}</h2>
              <p className="text-sm text-gray-500 truncate mt-0.5">{user.email}</p>

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {/* Role badge */}
                <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${typeMeta.color}`}>
                  <TypeIcon className="w-3 h-3" />
                  {typeMeta.label}
                </span>

                {/* Availability toggle (helper only) */}
                {user.userType === 'helper' && (
                  <button
                    onClick={handleToggleAvailability}
                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${
                      user.isAvailable !== false
                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${user.isAvailable !== false ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {user.isAvailable !== false ? 'Đang nhận việc' : 'Tạm nghỉ'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-200">
          {TABS.map((t) => {
            const TabIcon = t.Icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-all ${
                  tab === t.key
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span className="hidden sm:block">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab: Thông tin cá nhân */}
        {tab === 'info' && (
          <form onSubmit={handleSaveInfo} className="space-y-5">

            {/* Basic info section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Thông tin cơ bản</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField label="Họ và tên" required>
                  <TextInput name="fullName" value={form.fullName} onChange={set} placeholder="Nguyễn Văn A" required />
                </FormField>
                <FormField label="Số điện thoại">
                  <TextInput name="phone" value={form.phone} onChange={set} type="tel" placeholder="0912345678" />
                </FormField>
              </div>
            </div>

            {/* Address section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Địa chỉ</h3>
              </div>

              <div className="space-y-4">
                <FormField label="Địa chỉ">
                  <TextInput name="address" value={form.address} onChange={set} placeholder="123 Đường ABC" />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Quận / Huyện">
                    <TextInput name="district" value={form.district} onChange={set} placeholder="Quận 1" />
                  </FormField>
                  <FormField label="Thành phố">
                    <TextInput name="city" value={form.city} onChange={set} placeholder="TP.HCM" />
                  </FormField>
                </div>
              </div>
            </div>

            {/* Payment preference (customer only) */}
            {user.userType === 'customer' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Thanh toán ưa thích</h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {PAYMENT_OPTIONS.map(({ key, Icon: PayIcon, label }) => {
                    const isActive = form.preferredPayment === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, preferredPayment: key }))}
                        className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all ${
                          isActive
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-100 hover:border-gray-200 bg-white'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isActive ? 'bg-orange-100' : 'bg-gray-100'
                        }`}>
                          <PayIcon className={`w-5 h-5 ${isActive ? 'text-orange-600' : 'text-gray-500'}`} />
                        </div>
                        <span className={`text-xs font-medium ${isActive ? 'text-orange-700' : 'text-gray-600'}`}>
                          {label}
                        </span>
                        {isActive && (
                          <span className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bio (helper only) */}
            {user.userType === 'helper' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Pencil className="w-4 h-4 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Giới thiệu bản thân</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Bio <span className="text-gray-400 font-normal">(giới thiệu ngắn)</span>
                  </label>
                  <textarea
                    name="bio"
                    rows={3}
                    value={form.bio || ''}
                    onChange={set}
                    placeholder="Hãy chia sẻ kinh nghiệm và điểm mạnh của bạn..."
                    maxLength={200}
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none resize-none transition-colors"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{(form.bio || '').length}/200</p>
                </div>
              </div>
            )}

            {/* Save button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white h-12 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Lưu thông tin
                </>
              )}
            </button>
          </form>
        )}

        {/* Tab: Đổi mật khẩu */}
        {tab === 'password' && (
          <form onSubmit={handleChangePassword}>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <Lock className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="font-semibold text-gray-900">Thay đổi mật khẩu</h3>
              </div>

              {[
                { name: 'currentPassword', label: 'Mật khẩu hiện tại',      key: 'current' },
                { name: 'newPassword',     label: 'Mật khẩu mới',           key: 'new'     },
                { name: 'confirmPassword', label: 'Xác nhận mật khẩu mới',  key: 'confirm' },
              ].map(({ name, label, key }) => (
                <FormField key={name} label={label} required>
                  <div className="relative">
                    <input
                      type={showPw[key] ? 'text' : 'password'}
                      name={name}
                      value={pwForm[name]}
                      onChange={setPw}
                      placeholder="••••••••"
                      required
                      className="w-full bg-white border border-gray-200 rounded-lg h-11 px-4 pr-12 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 transition-colors"
                    >
                      {showPw[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FormField>
              ))}

              <div className="flex items-start gap-3 p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
                <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-600">
                  Mật khẩu phải có ít nhất 6 ký tự. Nên dùng kết hợp chữ hoa, chữ thường và số.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white h-12 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang đổi...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Đổi mật khẩu
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
