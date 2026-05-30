import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerCustomerApi, verifyOtpApi, resendOtpApi } from '../../api/auth.api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import OtpInput from '../../components/common/OtpInput';
import { Eye, EyeOff } from 'lucide-react';

const PHONE_RE = /^(0[35789])[0-9]{8}$/;

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-red-500 text-xs mt-1">{msg}</p>;
}

export default function RegisterCustomerPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: '', password: '', fullName: '', phone: '', address: '', city: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [savedPassword, setSavedPassword] = useState('');
  const [resending, setResending] = useState(false);

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Vui lòng nhập họ và tên';
    if (!form.email.trim()) e.email = 'Vui lòng nhập email';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Email không hợp lệ';
    if (!form.phone.trim()) e.phone = 'Vui lòng nhập số điện thoại';
    else if (!PHONE_RE.test(form.phone)) e.phone = 'Số điện thoại không đúng (VD: 0901234567)';
    if (!form.password) e.password = 'Vui lòng nhập mật khẩu';
    else if (form.password.length < 6) e.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    if (!form.address.trim()) e.address = 'Vui lòng nhập địa chỉ';
    if (!form.city.trim()) e.city = 'Vui lòng nhập thành phố';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await registerCustomerApi(form);
      const data = res.data.data || {};
      setRegisteredEmail(data.email || form.email);
      setSavedPassword(form.password);
      setOtpStep(true);
      toast.success('Mã OTP đã được gửi đến email của bạn!');
    } catch (err) {
      const msg = err.response?.data?.message || '';
      // Gán lỗi về đúng trường nếu server trả về thông tin cụ thể
      if (msg.toLowerCase().includes('email')) {
        setErrors({ email: msg });
      } else if (msg.toLowerCase().includes('điện thoại') || msg.toLowerCase().includes('phone')) {
        setErrors({ phone: 'Số điện thoại không đúng hoặc đã được dùng' });
      } else {
        toast.error(msg || 'Đăng ký thất bại, vui lòng kiểm tra lại thông tin');
      }
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
      await resendOtpApi({ email: registeredEmail });
      toast.success('Đã gửi lại mã OTP!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi lại');
    } finally {
      setResending(false);
    }
  };

  const inputClass = (field) =>
    `input-field ${errors[field] ? 'border-red-400 focus:border-red-400' : ''}`;

  return (
    <div className="min-h-screen flex">
      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full" />

        {/* Logo text */}
        <div className="relative">
          <span className="text-2xl font-extrabold text-white tracking-tight">
            Clean<span className="text-orange-200">Connect</span>
          </span>
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
              Clean<span className="text-orange-500">Connect</span>
            </span>
          </div>

          {otpStep ? (
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
                <OtpInput value={otp} onChange={setOtp} onComplete={handleVerifyOtp} disabled={loading} />

                <button
                  onClick={() => handleVerifyOtp()}
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
              </div>

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
                <button onClick={() => setOtpStep(false)} className="text-sm text-gray-400 hover:text-gray-600">
                  ← Quay lại đăng ký
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Tạo tài khoản</h1>
                <p className="text-gray-500 text-sm mt-1">Đăng ký để đặt dịch vụ giúp việc ngay hôm nay</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Họ tên */}
                <div>
                  <label className="label">Họ và tên <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={set('fullName')}
                    placeholder="Nguyễn Văn A"
                    className={inputClass('fullName')}
                    autoComplete="name"
                  />
                  <FieldError msg={errors.fullName} />
                </div>

                {/* Email + SĐT */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Email <span className="text-red-400">*</span></label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={set('email')}
                      placeholder="email@example.com"
                      className={inputClass('email')}
                      autoComplete="email"
                    />
                    <FieldError msg={errors.email} />
                  </div>
                  <div>
                    <label className="label">Số điện thoại <span className="text-red-400">*</span></label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={set('phone')}
                      placeholder="0901234567"
                      className={inputClass('phone')}
                      autoComplete="tel"
                      maxLength={10}
                    />
                    <FieldError msg={errors.phone} />
                  </div>
                </div>

                {/* Mật khẩu */}
                <div>
                  <label className="label">Mật khẩu <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={set('password')}
                      placeholder="Tối thiểu 6 ký tự"
                      className={`${inputClass('password')} pr-11`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <FieldError msg={errors.password} />
                </div>

                {/* Địa chỉ + Thành phố */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Địa chỉ <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={set('address')}
                      placeholder="123 Đường ABC"
                      className={inputClass('address')}
                    />
                    <FieldError msg={errors.address} />
                  </div>
                  <div>
                    <label className="label">Thành phố <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={set('city')}
                      placeholder="Hà Nội"
                      className={inputClass('city')}
                    />
                    <FieldError msg={errors.city} />
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
