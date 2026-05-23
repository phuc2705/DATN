import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerCustomerApi, verifyOtpApi, resendOtpApi } from '../../api/auth.api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function RegisterCustomerPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: '', password: '', fullName: '', phone: '', address: '', city: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // OTP step state
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [savedPassword, setSavedPassword] = useState('');
  const [resending, setResending] = useState(false);
  const [fallbackOtp, setFallbackOtp] = useState('');

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await registerCustomerApi(form);
      const data = res.data.data || {};
      setRegisteredEmail(data.email || form.email);
      setSavedPassword(form.password);
      setOtpStep(true);
      const fb = data.otp || data.devOtp;
      if (fb) {
        setFallbackOtp(fb);
        setOtp(fb);
      } else {
        toast.success('Mã OTP đã được gửi đến email của bạn!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOtpApi({ email: registeredEmail, otp });
      await login(registeredEmail, savedPassword);
      toast.success('Xác minh thành công! Chào mừng bạn đến với CleanConnect!');
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
      const res = await resendOtpApi({ email: registeredEmail });
      const data = res.data.data || {};
      const fb = data.otp;
      if (fb) {
        setFallbackOtp(fb);
        setOtp(fb);
      } else {
        setFallbackOtp('');
        toast.success('Đã gửi lại mã OTP!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi lại');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full" />

        <div className="relative">
          <img src="/logo.png" alt="CleanConnect" className="h-10 w-auto brightness-0 invert" />
        </div>

        <div className="relative">
          <h2 className="text-2xl font-extrabold text-white leading-tight mb-4">
            Đặt lịch dịch vụ<br />chỉ trong vài phút
          </h2>
          <p className="text-orange-100 text-sm leading-relaxed mb-6">
            Tạo tài khoản để bắt đầu đặt lịch giúp việc gia đình với người được xác minh.
          </p>
          <div className="bg-white/10 rounded-2xl p-4 space-y-2">
            {[
              '🏠  Đặt lịch nhanh, người làm đến tận nhà',
              '🔒  Giao dịch an toàn, giá minh bạch',
              '📱  Theo dõi đơn hàng realtime',
            ].map((item) => (
              <p key={item} className="text-orange-100 text-sm">{item}</p>
            ))}
          </div>
        </div>

        <p className="relative text-orange-200 text-xs">©CleanConnect - ĐATN của Nguyễn Trọng Phúc.</p>
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
            <img src="/logo.png" alt="CleanConnect" className="h-9 w-auto mx-auto" />
          </div>

          {otpStep ? (
            /* OTP verification card */
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">📧</div>
                <h1 className="text-2xl font-bold text-gray-900">Xác minh email</h1>
                {fallbackOtp ? (
                  <div className="mt-3 bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <p className="text-xs text-orange-600 font-medium mb-2">⚠️ Email không gửi được — mã OTP của bạn là:</p>
                    <p className="text-3xl font-bold tracking-[0.3em] text-orange-600 font-mono">{fallbackOtp}</p>
                    <p className="text-xs text-orange-500 mt-1">Mã đã được điền sẵn vào ô bên dưới</p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm mt-2">
                    Mã OTP 6 chữ số đã được gửi đến<br />
                    <span className="font-semibold text-gray-800">{registeredEmail}</span>
                  </p>
                )}
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="label">Mã OTP <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Nhập 6 chữ số"
                    className="input-field text-center text-2xl tracking-widest font-bold"
                    autoComplete="one-time-code"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full py-3 text-sm font-semibold rounded-xl btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
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
              </form>

              <div className="mt-4 text-center text-sm text-gray-500">
                Không nhận được mã?{' '}
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-orange-500 font-semibold hover:text-orange-600 disabled:opacity-50"
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
                <h1 className="text-2xl font-bold text-gray-900">Tạo tài khoản</h1>
                <p className="text-gray-500 text-sm mt-1">Đăng ký để đặt dịch vụ giúp việc ngay hôm nay</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Row 1: Họ tên */}
                <div>
                  <label className="label">Họ và tên <span className="text-red-400">*</span></label>
                  <input
                    type="text" required
                    value={form.fullName}
                    onChange={set('fullName')}
                    placeholder="Nguyễn Văn A"
                    className="input-field"
                    autoComplete="name"
                  />
                </div>

                {/* Row 2: Email + SĐT */}
                <div className="grid grid-cols-2 gap-3">
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

                {/* Row 3: Mật khẩu */}
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

                {/* Row 4: Địa chỉ + Thành phố */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Địa chỉ <span className="text-red-400">*</span></label>
                    <input
                      type="text" required
                      value={form.address}
                      onChange={set('address')}
                      placeholder="123 Đường ABC"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Thành phố <span className="text-red-400">*</span></label>
                    <input
                      type="text" required
                      value={form.city}
                      onChange={set('city')}
                      placeholder="Hồ Chí Minh"
                      className="input-field"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Đang tạo tài khoản...
                    </span>
                  ) : 'Tạo tài khoản'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
                Đã có tài khoản?{' '}
                <Link to="/login" className="text-orange-500 font-semibold hover:text-orange-600">
                  Đăng nhập
                </Link>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-4">
            Bạn là người giúp việc?{' '}
            <Link to="/register/helper" className="text-orange-500 hover:underline">
              Đăng ký tại đây
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
