import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPasswordApi, resetPasswordApi } from '../../api/auth.api';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail, KeyRound, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react';
import OtpInput from '../../components/common/OtpInput';

// 3 bước: nhập email → nhập OTP → nhập mật khẩu mới
const STEPS = [
  { id: 1, label: 'Nhập email' },
  { id: 2, label: 'Xác minh OTP' },
  { id: 3, label: 'Mật khẩu mới' },
];

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [email, setEmail] = useState('');

  // Step 2
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [resending, setResending] = useState(false);

  // Step 3
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Bước 1: Gửi OTP đến email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await forgotPasswordApi({ email });
      const fallbackOtp = data.data?.otp;
      if (fallbackOtp) {
        setDevOtp(fallbackOtp);
        setOtp(fallbackOtp);
        toast('⚠️ Email gặp sự cố. Mã OTP: ' + fallbackOtp, { duration: 15000 });
      } else {
        toast.success('Mã OTP đã được gửi đến email của bạn!');
      }
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi mã OTP');
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Xác minh OTP (chỉ kiểm tra độ dài, việc verify thực sự ở bước 3)
  const handleVerifyOtp = (otpValue) => {
    const code = otpValue ?? otp;
    if (code.length < 6) return;
    setStep(3);
  };

  // Gửi lại OTP
  const handleResend = async () => {
    setResending(true);
    try {
      const { data } = await forgotPasswordApi({ email });
      const fallbackOtp = data.data?.otp;
      if (fallbackOtp) {
        setDevOtp(fallbackOtp);
        setOtp(fallbackOtp);
        toast('⚠️ OTP mới (email lỗi): ' + fallbackOtp, { duration: 15000 });
      } else {
        toast.success('Đã gửi lại mã OTP!');
        setOtp('');
      }
    } catch {
      toast.error('Không thể gửi lại');
    } finally {
      setResending(false);
    }
  };

  // Bước 3: Đặt mật khẩu mới
  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu tối thiểu 6 ký tự');
      return;
    }
    setLoading(true);
    try {
      await resetPasswordApi({ email, otp, newPassword });
      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Đặt lại mật khẩu thất bại';
      toast.error(msg);
      // Nếu OTP sai → quay lại bước 2
      if (msg.includes('OTP') || msg.includes('otp')) {
        setStep(2);
        setOtp('');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 right-8 w-32 h-32 bg-white/10 rounded-full" />

        <div className="relative">
          <img src="/logo.png" alt="CleanConnect" className="h-10 w-auto brightness-0 invert" />
        </div>

        <div className="relative">
          <h2 className="text-2xl font-extrabold text-white leading-tight mb-4">
            Đặt lại mật khẩu<br />nhanh chóng & an toàn
          </h2>
          <p className="text-orange-100 text-sm leading-relaxed mb-6">
            Chúng tôi sẽ gửi mã OTP đến email của bạn để xác minh danh tính trước khi đặt lại mật khẩu.
          </p>
          <div className="bg-white/10 rounded-2xl p-4 space-y-3">
            {STEPS.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  step > s.id ? 'bg-green-400 text-white' :
                  step === s.id ? 'bg-white text-orange-600' :
                  'bg-white/20 text-white/60'
                }`}>
                  {step > s.id ? '✓' : s.id}
                </div>
                <span className={`text-sm font-medium ${
                  step >= s.id ? 'text-white' : 'text-white/50'
                }`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <p className="text-orange-200 text-xs">©CleanConnect — ĐATN của Nguyễn Trọng Phúc</p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">

          {/* Back */}
          <div className="mb-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại đăng nhập
            </Link>
          </div>

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <img src="/logo.png" alt="CleanConnect" className="h-10 w-auto mx-auto" />
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">

            {/* ─── BƯỚC 1: Nhập email ─── */}
            {step === 1 && (
              <>
                <div className="mb-7">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-orange-500" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">Quên mật khẩu?</h1>
                  <p className="text-gray-500 text-sm mt-1">
                    Nhập email đã đăng ký — chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
                  </p>
                </div>
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa chỉ email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      placeholder="email@example.com"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full btn-primary py-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin h-4 w-4" />
                        Đang gửi...
                      </span>
                    ) : 'Gửi mã OTP'}
                  </button>
                </form>
                <p className="text-center text-sm text-gray-500 mt-5">
                  Nhớ mật khẩu rồi?{' '}
                  <Link to="/login" className="text-orange-500 font-medium hover:text-orange-600">
                    Đăng nhập
                  </Link>
                </p>
              </>
            )}

            {/* ─── BƯỚC 2: Nhập OTP ─── */}
            {step === 2 && (
              <>
                <div className="mb-7">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <KeyRound className="w-6 h-6 text-blue-500" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">Nhập mã OTP</h1>
                  <p className="text-gray-500 text-sm mt-1">
                    Mã xác nhận đã gửi đến <span className="font-semibold text-gray-700">{email}</span>
                  </p>
                </div>
                {devOtp && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                    ⚠️ Chế độ dev (email lỗi) — OTP: <span className="font-bold">{devOtp}</span>
                  </div>
                )}
                <div className="space-y-5">
                  <OtpInput value={otp} onChange={setOtp} onComplete={handleVerifyOtp} />
                  <button
                    onClick={() => handleVerifyOtp()}
                    disabled={otp.length < 6}
                    className="w-full btn-primary py-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Xác nhận mã OTP
                  </button>
                </div>
                <div className="mt-5 text-center text-sm text-gray-500">
                  Không nhận được mã?{' '}
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="text-orange-500 font-medium hover:text-orange-600 disabled:opacity-60"
                  >
                    {resending ? 'Đang gửi...' : 'Gửi lại'}
                  </button>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="mt-3 w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← Đổi email khác
                </button>
              </>
            )}

            {/* ─── BƯỚC 3: Mật khẩu mới ─── */}
            {step === 3 && (
              <>
                <div className="mb-7">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">Tạo mật khẩu mới</h1>
                  <p className="text-gray-500 text-sm mt-1">
                    OTP hợp lệ. Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
                  </p>
                </div>
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input-field pr-11"
                        placeholder="Tối thiểu 6 ký tự"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Xác nhận mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`input-field pr-11 ${
                          confirmPassword && confirmPassword !== newPassword
                            ? 'border-red-400 focus:border-red-500'
                            : ''
                        }`}
                        placeholder="Nhập lại mật khẩu"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-xs text-red-500 mt-1">Mật khẩu không khớp</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                    className="w-full btn-primary py-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin h-4 w-4" />
                        Đang xử lý...
                      </span>
                    ) : 'Đặt lại mật khẩu'}
                  </button>
                </form>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
