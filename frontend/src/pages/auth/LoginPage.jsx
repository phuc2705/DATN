import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft, Eye, EyeOff, Loader2, ShieldCheck, CreditCard, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import SEO from '../../components/common/SEO';

// Map Firebase error code → thông báo tiếng Việt
const FIREBASE_ERROR_MSG = {
  'auth/popup-blocked':           'Popup bị chặn. Vui lòng cho phép popup trong trình duyệt rồi thử lại.',
  'auth/popup-closed-by-user':    null, // user tự đóng → im lặng
  'auth/cancelled-popup-request': null,
  'auth/unauthorized-domain':     'Domain chưa được phép. Vui lòng liên hệ quản trị viên.',
  'auth/network-request-failed':  'Lỗi mạng. Kiểm tra kết nối internet và thử lại.',
  'auth/too-many-requests':       'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.',
  'auth/user-disabled':           'Tài khoản đã bị vô hiệu hóa.',
  'auth/account-exists-with-different-credential': 'Email này đã được đăng ký bằng phương thức khác.',
};

export default function LoginPage() {
  const { login, loginWithFirebase } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Hiển thị thông báo từ redirect (ví dụ: sau khi đăng ký helper)
  useEffect(() => {
    if (location.state?.message) {
      toast.success(location.state.message, { duration: 6000 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Vui lòng nhập email';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Email không hợp lệ';
    if (!form.password) e.password = 'Vui lòng nhập mật khẩu';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success('Đăng nhập thành công!');
      if (user.userType === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user.userType === 'helper') {
        navigate('/helper/jobs', { replace: true });
      } else {
        const params = new URLSearchParams(location.search);
        const redirectTo = params.get('redirect') || '/';
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('không tồn tại')) {
        setErrors({ email: 'Email không tồn tại trong hệ thống' });
      } else if (msg.toLowerCase().includes('mật khẩu') || msg.toLowerCase().includes('password')) {
        setErrors({ password: 'Mật khẩu không đúng' });
      } else {
        toast.error(msg || 'Email hoặc mật khẩu không đúng');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setSocialLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      const user = await loginWithFirebase(idToken);
      toast.success('Đăng nhập thành công!');
      if (user.userType === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user.userType === 'helper') {
        navigate('/helper/jobs', { replace: true });
      } else {
        const params = new URLSearchParams(location.search);
        const redirectTo = params.get('redirect') || '/';
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      const msg = FIREBASE_ERROR_MSG[err.code];
      if (msg === null) return; // im lặng khi user tự huỷ
      toast.error(msg || err.response?.data?.message || 'Đăng nhập Google thất bại, vui lòng thử lại.');
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <SEO title="Đăng nhập" canonical="/login" noindex />
      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 right-8 w-32 h-32 bg-white/10 rounded-full" />

        {/* Logo text */}
        <div className="relative">
          <span className="text-2xl font-extrabold text-white tracking-tight">
            Clean<span className="text-orange-200">Connect</span>
          </span>
        </div>

        <div className="relative">
          <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">
            Giúp việc gia đình<br />theo giờ, tiện lợi
          </h2>
          <p className="text-orange-100 text-base leading-relaxed mb-8">
            Kết nối khách hàng với người giúp việc được xác minh trên khắp Việt Nam.
          </p>
          <div className="space-y-3">
            {[
              { Icon: ShieldCheck, text: 'Người giúp việc được xác minh CCCD' },
              { Icon: CreditCard,  text: 'Thanh toán minh bạch, không phí ẩn' },
              { Icon: Star,        text: 'Đánh giá 2 chiều, uy tín rõ ràng' },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-orange-200 flex-shrink-0" />
                <span className="text-orange-100 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <p className="text-orange-200 text-xs">©CleanConnect - ĐATN của Nguyễn Trọng Phúc.</p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="mb-4">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-500 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Về trang chủ
            </Link>
          </div>

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Clean<span className="text-orange-500">Connect</span>
            </span>
            <p className="text-xs text-gray-400 mt-1">Dịch vụ giúp việc theo giờ</p>
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-gray-900">Chào mừng trở lại</h1>
              <p className="text-gray-500 text-sm mt-1">Đăng nhập vào tài khoản CleanConnect của bạn</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="login-email" className="label">Email</label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors((p) => ({ ...p, email: '' })); }}
                  className={`input-field ${errors.email ? 'border-red-400 focus:border-red-400' : ''}`}
                  placeholder="email@example.com"
                  autoComplete="email"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-password" className="label mb-0">Mật khẩu</label>
                  <Link to="/forgot-password" className="text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors">
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors((p) => ({ ...p, password: '' })); }}
                    className={`input-field pr-11 ${errors.password ? 'border-red-400 focus:border-red-400' : ''}`}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin h-4 w-4" />
                    Đang đăng nhập...
                  </span>
                ) : 'Đăng nhập'}
              </button>
            </form>

            {/* Social login */}
            <div className="mt-5">
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-gray-200" />
                <span className="mx-3 text-xs text-gray-400 whitespace-nowrap">Hoặc đăng nhập với</span>
                <div className="flex-grow border-t border-gray-200" />
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => handleSocialLogin(googleProvider)}
                  disabled={socialLoading || loading}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {socialLoading ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  {socialLoading ? 'Đang kết nối...' : 'Đăng nhập với Google'}
                </button>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-gray-100 text-center text-sm text-gray-500">
              Chưa có tài khoản?{' '}
              <Link to="/register/customer" className="text-orange-500 font-semibold hover:text-orange-600">
                Đăng ký ngay
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
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
