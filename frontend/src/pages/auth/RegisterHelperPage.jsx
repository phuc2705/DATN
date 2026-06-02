import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerHelperApi, verifyOtpApi, resendOtpApi } from '../../api/auth.api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import OtpInput from '../../components/common/OtpInput';

export default function RegisterHelperPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const SERVICES = [
    { id: 1, label: 'Dọn dẹp nhà cửa', icon: '🧹' },
    { id: 2, label: 'Giặt ủi',          icon: '👕' },
    { id: 3, label: 'Nấu ăn',           icon: '🍳' },
    { id: 4, label: 'Chăm sóc trẻ em',  icon: '👶' },
    { id: 5, label: 'Chăm sóc người già',icon: '👴' },
    { id: 6, label: 'Vệ sinh công nghiệp',icon:'🏢' },
  ];

  const [form, setForm] = useState({
    email: '', password: '', fullName: '', phone: '',
    dateOfBirth: '', gender: 'female', idCardNumber: '',
    address: '', bio: '',
  });
  const [selectedServices, setSelectedServices] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // OTP step state
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [savedPassword, setSavedPassword] = useState('');
  const [resending, setResending] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const toggleService = (id) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedServices.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 công việc bạn có thể làm');
      return;
    }
    setLoading(true);
    try {
      const res = await registerHelperApi({ ...form, serviceIds: selectedServices, avatarFile });
      const data = res.data.data || {};
      setRegisteredEmail(data.email || form.email);
      setSavedPassword(form.password);
      if (data.skipOtp) {
        await login(data.email || form.email, form.password);
        navigate('/');
        toast.success('[TEST] Tài khoản kích hoạt ngay, không cần OTP!');
      } else {
        setOtpStep(true);
        toast.success('Mã OTP đã được gửi đến email của bạn!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otpValue) => {
    const code = otpValue ?? otp;
    if (code.length < 6) return;
    setLoading(true);
    try {
      await verifyOtpApi({ email: registeredEmail, otp: code });
      await login(registeredEmail, savedPassword);
      toast.success('Xác minh thành công! Hồ sơ của bạn đang chờ Admin xét duyệt (1–2 ngày làm việc).');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mã OTP không đúng');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendOtpApi({ email: registeredEmail });
      toast.success('Đã gửi lại mã OTP!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi lại');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-green-500 via-green-600 to-teal-600 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full" />

        <div className="relative">
          <span className="text-2xl font-extrabold text-white tracking-tight">
            Clean<span className="text-green-200">Connect</span>
          </span>
        </div>

        <div className="relative">
          <h2 className="text-2xl font-extrabold text-white leading-tight mb-4">
            Trở thành người<br />giúp việc chuyên nghiệp
          </h2>
          <p className="text-green-100 text-sm leading-relaxed mb-6">
            Nhận việc linh hoạt theo giờ, tự quản lý lịch làm việc và tăng thu nhập của bạn.
          </p>
          <div className="bg-white/10 rounded-2xl p-4 space-y-2">
            {[
              '💰  Thu nhập linh hoạt, nhận tiền đúng hạn',
              '📅  Tự chọn lịch làm việc phù hợp',
              '🛡️  Được bảo vệ bởi chính sách CleanConnect',
            ].map((item) => (
              <p key={item} className="text-green-100 text-sm">{item}</p>
            ))}
          </div>
          <div className="mt-6 bg-white/10 rounded-xl p-4">
            <p className="text-white text-xs font-semibold mb-1">Lưu ý khi đăng ký</p>
            <p className="text-green-100 text-xs leading-relaxed">
              Tài khoản sẽ được đội ngũ CleanConnect xét duyệt trong vòng 1–2 ngày làm việc sau khi xác minh email.
            </p>
          </div>
        </div>

        <p className="relative text-green-200 text-xs">©CleanConnect - ĐATN của Nguyễn Trọng Phúc.</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-start justify-center p-6 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-lg py-6">
          {/* Back to home */}
          <div className="mb-4">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-500 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Về trang chủ
            </Link>
          </div>

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Clean<span className="text-green-500">Connect</span>
            </span>
          </div>

          {otpStep ? (
            /* OTP verification card */
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">📧</div>
                <h1 className="text-2xl font-bold text-gray-900">Xác minh email</h1>
                <p className="text-gray-500 text-sm mt-2">
                  Mã OTP 6 chữ số đã được gửi đến<br />
                  <span className="font-semibold text-gray-800">{registeredEmail}</span>
                </p>
              </div>

              <div className="space-y-6">
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  onComplete={handleVerifyOtp}
                  disabled={loading}
                />

                <button
                  onClick={() => handleVerifyOtp()}
                  disabled={loading || otp.length < 6}
                  className="w-full py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Đang xác minh...
                    </span>
                  ) : 'Xác minh'}
                </button>
              </div>

              <div className="mt-4 text-center text-sm text-gray-500">
                Không nhận được mã?{' '}
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-green-600 font-semibold hover:text-green-700 disabled:opacity-50"
                >
                  {resending ? 'Đang gửi...' : 'Gửi lại'}
                </button>
              </div>

              <div className="mt-3 text-center">
                <button
                  onClick={() => setOtpStep(false)}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  ← Quay lại đăng ký
                </button>
              </div>
            </div>
          ) : (
            /* Registration form card */
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Đăng ký người giúp việc</h1>
                <p className="text-gray-500 text-sm mt-1">Điền đầy đủ thông tin để tạo hồ sơ của bạn</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Upload ảnh đại diện */}
                <div>
                  <label className="label">Ảnh đại diện</label>
                  <div className="flex items-center gap-4">
                    {/* Preview */}
                    <div className="w-20 h-20 rounded-2xl border-2 border-gray-200 overflow-hidden flex-shrink-0 bg-gray-50 flex items-center justify-center">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    {/* Nút chọn file */}
                    <div className="flex-1">
                      <label
                        htmlFor="avatar-upload"
                        className="inline-flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 transition-colors text-sm text-gray-600 hover:text-green-700 font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        {avatarFile ? 'Đổi ảnh khác' : 'Chọn ảnh từ máy'}
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <p className="text-xs text-gray-400 mt-1.5">
                        {avatarFile ? avatarFile.name : 'JPG, PNG, WEBP — tối đa 5MB. Nếu bỏ qua sẽ dùng ảnh mặc định.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Họ tên */}
                <div>
                  <label className="label">Họ và tên <span className="text-red-400">*</span></label>
                  <input
                    type="text" required
                    value={form.fullName}
                    onChange={set('fullName')}
                    placeholder="Nguyễn Thị B"
                    className="input-field"
                    autoComplete="name"
                  />
                </div>

                {/* Email + SĐT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Email <span className="text-red-400">*</span></label>
                    <input
                      type="email" required
                      value={form.email}
                      onChange={set('email')}
                      placeholder="email@example.com"
                      className="input-field"
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label className="label">Số điện thoại <span className="text-red-400">*</span></label>
                    <input
                      type="tel" required
                      value={form.phone}
                      onChange={set('phone')}
                      placeholder="0901234567"
                      className="input-field"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                {/* Mật khẩu */}
                <div>
                  <label className="label">Mật khẩu <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={form.password}
                      onChange={set('password')}
                      placeholder="Tối thiểu 6 ký tự"
                      className="input-field pr-11"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                          d={showPassword
                            ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          }
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Ngày sinh + Giới tính */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Ngày sinh <span className="text-red-400">*</span></label>
                    <input
                      type="date" required
                      value={form.dateOfBirth}
                      onChange={set('dateOfBirth')}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Giới tính <span className="text-red-400">*</span></label>
                    <select
                      value={form.gender}
                      onChange={set('gender')}
                      className="input-field"
                    >
                      <option value="female">Nữ</option>
                      <option value="male">Nam</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                </div>

                {/* CCCD */}
                <div>
                  <label className="label">Số CCCD / CMND <span className="text-red-400">*</span></label>
                  <input
                    type="text" required
                    value={form.idCardNumber}
                    onChange={set('idCardNumber')}
                    placeholder="012345678901"
                    className="input-field"
                  />
                </div>

                {/* Địa chỉ */}
                <div>
                  <label className="label">Địa chỉ <span className="text-red-400">*</span></label>
                  <input
                    type="text" required
                    value={form.address}
                    onChange={set('address')}
                    placeholder="123 Đường ABC, Quận 1, TP.HCM"
                    className="input-field"
                  />
                </div>

                {/* Công việc có thể làm */}
                <div>
                  <label className="label">Công việc có thể làm <span className="text-red-400">*</span></label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SERVICES.map(s => (
                      <label
                        key={s.id}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all select-none text-sm font-medium ${
                          selectedServices.includes(s.id)
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={selectedServices.includes(s.id)}
                          onChange={() => toggleService(s.id)}
                        />
                        <span className="text-base">{s.icon}</span>
                        <span>{s.label}</span>
                        {selectedServices.includes(s.id) && (
                          <span className="ml-auto text-green-500">✓</span>
                        )}
                      </label>
                    ))}
                  </div>
                  {selectedServices.length === 0 && (
                    <p className="text-xs text-red-400 mt-1">Chọn ít nhất 1 dịch vụ</p>
                  )}
                </div>

                {/* Mô tả kinh nghiệm */}
                <div>
                  <label className="label">Mô tả kinh nghiệm bản thân</label>
                  <textarea
                    rows={3}
                    value={form.bio}
                    onChange={set('bio')}
                    placeholder="Ví dụ: Tôi có 3 năm kinh nghiệm dọn dẹp nhà cửa, từng làm việc cho các hộ gia đình tại TP.HCM..."
                    className="input-field resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Đang gửi hồ sơ...
                    </span>
                  ) : 'Gửi hồ sơ đăng ký'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
                Là khách hàng?{' '}
                <Link to="/register/customer" className="text-orange-500 font-semibold hover:text-orange-600">
                  Đăng ký tại đây
                </Link>
                {' · '}
                <Link to="/login" className="text-orange-500 font-semibold hover:text-orange-600">
                  Đăng nhập
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
