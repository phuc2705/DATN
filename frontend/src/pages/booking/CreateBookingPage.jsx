import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAllServicesApi } from '../../api/service.api';
import { createBookingApi, validatePromoCodeApi, pricePreviewApi, checkAvailabilityApi, getCustomerTrustInfoApi } from '../../api/booking.api';
import { createVNPayUrlApi, createVNPayDepositUrlApi } from '../../api/payment.api';
import { formatPrice } from '../../utils/format';
import toast from 'react-hot-toast';
import {
  ArrowLeft, CheckCircle2, Calendar, MapPin,
  CreditCard, Banknote, ChevronRight, Info, Loader2, Check, Tag, X, AlertTriangle,
  Clock, Users, Lightbulb, ShieldCheck, ShieldAlert,
  Sparkles, Shirt, ChefHat, Baby, HeartHandshake, Building2,
  Wind, Droplets, PawPrint, Briefcase, Zap, Home,
} from 'lucide-react';
import TimePicker24h from '../../components/common/TimePicker24h';

// ─── Steps ───────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Dịch vụ & Thời gian' },
  { id: 2, label: 'Xác nhận & Thanh toán' },
];

// ─── Payment methods (cash + VNPay only) ────────────────────────────
const PAYMENT_METHODS = [
  { key: 'cash',  icon: Banknote,    label: 'Tiền mặt', sub: 'Trả trực tiếp khi hoàn thành dịch vụ' },
  { key: 'vnpay', icon: CreditCard,  label: 'VNPay',    sub: 'Thanh toán online ngay sau khi đặt lịch' },
];

const getServiceIcon = (name = '', className = 'w-6 h-6') => {
  const n = name.toLowerCase();
  if (n.includes('trẻ') || n.includes('trông'))           return <Baby           className={className} />;
  if (n.includes('nấu') || n.includes('nau'))             return <ChefHat        className={className} />;
  if (n.includes('giặt') || n.includes('giat'))           return <Shirt          className={className} />;
  if (n.includes('người già') || n.includes('cao tu'))    return <HeartHandshake className={className} />;
  if (n.includes('thú cưng') || n.includes('thu cung'))   return <PawPrint       className={className} />;
  if (n.includes('văn phòng') || n.includes('shop'))      return <Briefcase      className={className} />;
  if (n.includes('công nghiệp') || n.includes('cong ng')) return <Building2      className={className} />;
  if (n.includes('điều hòa') || n.includes('dieu hoa'))   return <Wind           className={className} />;
  if (n.includes('khử') || n.includes('phun'))            return <Zap            className={className} />;
  if (n.includes('sofa') || n.includes('nệm') || n.includes('rèm')) return <Wind className={className} />;
  if (n.includes('máy giặt') || n.includes('thiết bị'))  return <Droplets       className={className} />;
  if (n.includes('định kỳ') || n.includes('dinh ky'))    return <Home           className={className} />;
  return <Sparkles className={className} />;
};

const INPUT_CLS =
  'w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-[#222222] placeholder:text-[#6a6a6a] focus:outline-none focus:border-gray-900 focus:ring-0 transition-colors';

// ─── Step indicator ──────────────────────────────────────────────────
function StepIndicator({ current }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((step, idx) => {
        const done   = current > step.id;
        const active = current === step.id;
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                ${done ? 'bg-green-500 text-white' : active ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {done ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <span className={`text-xs font-medium hidden sm:block transition-colors
                ${active ? 'text-orange-500' : done ? 'text-green-600' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mt-[-12px] sm:mt-[-20px] transition-colors ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Section card ────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        {Icon && (
          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
            <Icon className="w-4 h-4 text-orange-500" />
          </div>
        )}
        <h2 className="font-semibold text-[#222222] text-base">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Label({ children, required }) {
  return (
    <label className="block text-sm font-medium text-[#222222] mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

// ─── Main ────────────────────────────────────────────────────────────
export default function CreateBookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Đọc params từ service page
  const paramServiceId  = searchParams.get('serviceId')  || '';
  const paramDate       = searchParams.get('date')        || '';
  const paramStartTime  = searchParams.get('startTime')   || '';
  const paramEndTime    = searchParams.get('endTime')     || '';

  // Nếu đủ params từ service page → bỏ qua step 1
  const fromServicePage = !!(paramServiceId && paramDate && paramStartTime && paramEndTime);
  // Có serviceId nhưng chưa có giờ → ẩn service picker, chỉ chọn giờ
  const hasServiceParam = !!paramServiceId;

  const [step, setStep]         = useState(fromServicePage ? 2 : 1);
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeError, setTimeError]   = useState('');

  const [form, setForm] = useState({
    serviceId:   paramServiceId,
    bookingDate: paramDate,
    startTime:   paramStartTime,
    endTime:     paramEndTime,
    address:     '',
    note:        '',
  });

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [promoCode, setPromoCode]         = useState('');
  const [promoApplied, setPromoApplied]   = useState(null);
  const [promoLoading, setPromoLoading]   = useState(false);
  const [priceData, setPriceData]         = useState(null);
  const [priceLoading, setPriceLoading]   = useState(false);
  const [conflictError, setConflictError] = useState(null);
  const [availability, setAvailability]   = useState(null); // { available, availableCount, suggestions }
  const [availChecking, setAvailChecking] = useState(false);
  const [trustInfo, setTrustInfo]         = useState(null);
  const [trustLoading, setTrustLoading]   = useState(false);

  useEffect(() => {
    getAllServicesApi()
      .then(({ data }) => setServices(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Hiển thị lỗi giờ quá khứ ngay real-time khi user nhập
  useEffect(() => {
    if (!form.bookingDate || !form.startTime) { setTimeError(''); return; }
    const vnNow    = getVNNow();
    const todayStr = vnNow.toISOString().slice(0, 10);
    if (form.bookingDate !== todayStr) { setTimeError(''); return; }
    const [sh, sm] = form.startTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const nowMins   = vnNow.getUTCHours() * 60 + vnNow.getUTCMinutes();
    if (startMins < nowMins) {
      const nowH = String(vnNow.getUTCHours()).padStart(2, '0');
      const nowM = String(vnNow.getUTCMinutes()).padStart(2, '0');
      setTimeError(`Giờ đã qua (hiện tại ${nowH}:${nowM})`);
    } else {
      setTimeError('');
    }
  }, [form.bookingDate, form.startTime]);

  // Tính giá từ backend (bao gồm promo nếu đã áp dụng)
  useEffect(() => {
    if (!form.serviceId || !form.startTime || !form.endTime) {
      setPriceData(null);
      return;
    }
    const t = setTimeout(async () => {
      setPriceLoading(true);
      try {
        const { data } = await pricePreviewApi({
          serviceId: form.serviceId,
          startTime: form.startTime,
          endTime:   form.endTime,
          promoCode: promoApplied ? promoCode.trim() : undefined,
        });
        setPriceData(data.data);
      } catch {
        setPriceData(null);
      } finally {
        setPriceLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [form.serviceId, form.startTime, form.endTime, promoApplied]);

  // Kiểm tra helper rảnh khi đủ 4 trường: dịch vụ + ngày + giờ bắt đầu + giờ kết thúc
  useEffect(() => {
    if (!form.serviceId || !form.bookingDate || !form.startTime || !form.endTime) {
      setAvailability(null);
      return;
    }
    if (form.startTime >= form.endTime) { setAvailability(null); return; }
    const t = setTimeout(async () => {
      setAvailChecking(true);
      try {
        const { data } = await checkAvailabilityApi({
          serviceId:   form.serviceId,
          bookingDate: form.bookingDate,
          startTime:   form.startTime,
          endTime:     form.endTime,
        });
        setAvailability(data.data);
      } catch {
        setAvailability(null);
      } finally {
        setAvailChecking(false);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [form.serviceId, form.bookingDate, form.startTime, form.endTime]);

  // Tải thông tin uy tín khi vào bước 2; tự động chọn VNPay nếu không được dùng tiền mặt
  useEffect(() => {
    if (step !== 2) return;
    setTrustLoading(true);
    getCustomerTrustInfoApi()
      .then(({ data }) => {
        const info = data.data;
        setTrustInfo(info);
        if (info.requiresOnlinePayment) setPaymentMethod('vnpay');
      })
      .catch(() => {})
      .finally(() => setTrustLoading(false));
  }, [step]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return toast.error('Vui lòng nhập mã khuyến mãi trước khi áp dụng.');
    if (!priceData || priceData.basePrice <= 0)
      return toast.error('Vui lòng chọn dịch vụ và điền đầy đủ giờ bắt đầu/kết thúc để có thể kiểm tra mã.');
    setPromoLoading(true);
    try {
      const { data } = await validatePromoCodeApi(promoCode.trim(), priceData.basePrice);
      setPromoApplied(data.data);
      toast.success(data.message || 'Áp dụng mã thành công!');
    } catch (err) {
      setPromoApplied(null);
      toast.error(err.response?.data?.message || 'Mã khuyến mãi không đúng hoặc đã hết hạn.');
    } finally {
      setPromoLoading(false);
    }
  };

  // Xóa lỗi trùng lịch và reset availability khi user thay đổi form
  const set = (field) => (e) => {
    setConflictError(null);
    setAvailability(null);
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Trả về thông báo lỗi nếu ngày/giờ đặt đã qua, null nếu hợp lệ
  // Dùng UTC+7 (Vietnam) để tính ngày/giờ hiện tại — tránh lệch ngày giữa UTC và VN
  const getVNNow   = () => new Date(Date.now() + 7 * 60 * 60 * 1000);
  const todayVN    = getVNNow().toISOString().slice(0, 10);
  const maxDateVN  = (() => { const d = getVNNow(); d.setUTCDate(d.getUTCDate() + 30); return d.toISOString().slice(0, 10); })();

  const getPastDateTimeError = (bookingDate, startTime) => {
    if (!bookingDate || !startTime) return null;
    const vnNow    = getVNNow();
    const todayStr = vnNow.toISOString().slice(0, 10);
    if (bookingDate < todayStr) return 'Không thể đặt lịch cho ngày đã qua. Vui lòng chọn từ hôm nay trở đi.';
    if (bookingDate > maxDateVN) return 'Chỉ có thể đặt lịch trước tối đa 30 ngày.';
    if (bookingDate === todayStr) {
      const [sh, sm] = startTime.split(':').map(Number);
      const startMins = sh * 60 + sm;
      const nowMins   = vnNow.getUTCHours() * 60 + vnNow.getUTCMinutes();
      if (startMins < nowMins) {
        const nowH = String(vnNow.getUTCHours()).padStart(2, '0');
        const nowM = String(vnNow.getUTCMinutes()).padStart(2, '0');
        return `Giờ bắt đầu đã qua (hiện tại ${nowH}:${nowM}). Vui lòng chọn khung giờ khác.`;
      }
    }
    return null;
  };

  const validateStep1 = () => {
    if (!form.serviceId)  { toast.error('Vui lòng chọn dịch vụ'); return false; }
    if (!form.bookingDate){ toast.error('Vui lòng chọn ngày làm việc'); return false; }
    if (!form.startTime)  { toast.error('Vui lòng chọn giờ bắt đầu'); return false; }
    if (!form.endTime)    { toast.error('Vui lòng chọn giờ kết thúc'); return false; }
    if (form.startTime >= form.endTime) { toast.error('Giờ kết thúc phải sau giờ bắt đầu'); return false; }
    const pastErr = getPastDateTimeError(form.bookingDate, form.startTime);
    if (pastErr) { toast.error(pastErr); return false; }
    return true;
  };

  const goNext = () => {
    if (!validateStep1()) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!form.address.trim()) { toast.error('Vui lòng nhập địa chỉ làm việc để tiếp tục đặt lịch.'); return; }
    const pastErr = getPastDateTimeError(form.bookingDate, form.startTime);
    if (pastErr) { toast.error(pastErr); return; }
    setSubmitting(true);
    try {
      const { data } = await createBookingApi({
        serviceId:   parseInt(form.serviceId),
        bookingDate: form.bookingDate,
        startTime:   form.startTime,
        endTime:     form.endTime,
        address:     form.address,
        note:        form.note || undefined,
        paymentMethod,
        promoCode: promoApplied ? promoCode.trim() : undefined,
      });

      const bookingId = data.data.bookingId;

      if (data.data.availableHelperCount === 0) {
        toast('Đặt lịch thành công! Hiện chưa có nhân viên rảnh — chúng tôi sẽ thông báo khi có người phù hợp.', { icon: '⚠️', duration: 6000 });
      } else {
        toast.success(data.message || 'Đặt lịch thành công!');
      }

      if (paymentMethod === 'vnpay') {
        try {
          // Khách mới/uy tín thấp → cọc 70%; khách uy tín → thanh toán đủ ngay
          const createUrlFn = trustInfo?.requiresOnlinePayment
            ? createVNPayDepositUrlApi
            : createVNPayUrlApi;
          const { data: payData } = await createUrlFn(bookingId);
          window.location.href = payData.data.paymentUrl;
        } catch {
          navigate(`/bookings/${bookingId}`);
        }
      } else {
        navigate(`/bookings/${bookingId}`);
      }
    } catch (err) {
      if (err.response?.status === 409) {
        setConflictError(err.response.data?.message || 'Lịch đã bị trùng. Vui lòng chọn khung giờ khác.');
      } else {
        toast.error(err.response?.data?.message || 'Đặt lịch thất bại. Vui lòng kiểm tra lại thông tin và thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedService = services.find((s) => String(s.serviceId) === String(form.serviceId));

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-7 bg-gray-100 rounded-lg w-48" />
          <div className="h-4 bg-gray-100 rounded w-32" />
          <div className="h-16 bg-gray-100 rounded-2xl" />
          <div className="h-56 bg-gray-100 rounded-2xl" />
          <div className="h-40 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">

      {/* Back button */}
      <button
        onClick={() => (step === 2 && !fromServicePage ? setStep(1) : navigate(-1))}
        className="flex items-center gap-1.5 text-sm font-medium text-[#6a6a6a] hover:text-[#222222] transition-colors mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        {step === 2 && !fromServicePage ? 'Bước trước' : 'Quay lại'}
      </button>

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-[#222222] leading-tight">Đặt lịch dịch vụ</h1>
        <p className="text-sm text-[#6a6a6a] mt-1">Xác nhận thông tin và chọn phương thức thanh toán</p>
      </div>

      {/* Step indicator — ẩn khi đến từ service page (dù đủ hay chưa đủ giờ) */}
      {!hasServiceParam && <StepIndicator current={step} />}

      {/* ─── STEP 1: Dịch vụ & Thời gian ─────────────────────────────── */}
      {step === 1 && (
        <div className="max-w-2xl mx-auto space-y-4 animate-[fadeIn_0.2s_ease]">

          {/* Chọn dịch vụ — ẩn grid khi đã có serviceId từ URL */}
          {hasServiceParam ? (
            selectedService && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 text-orange-500">
                  {getServiceIcon(selectedService?.serviceName, 'w-5 h-5')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-orange-700">{selectedService.serviceName}</p>
                  <p className="text-xs text-orange-500">{formatPrice(selectedService.basePrice)}/{selectedService.priceUnit || 'giờ'}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0" />
              </div>
            )
          ) : (
            <SectionCard title="Chọn dịch vụ" icon={CheckCircle2}>
              {services.length === 0 ? (
                <p className="text-sm text-[#6a6a6a] text-center py-4">Không có dịch vụ nào</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {services.map((s, idx) => {
                    const selected = String(form.serviceId) === String(s.serviceId);
                    return (
                      <button
                        key={s.serviceId}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, serviceId: String(s.serviceId) }))}
                        className={`text-left p-4 rounded-xl border-2 transition-all duration-150
                          ${selected
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 bg-white hover:border-orange-300'}`}
                      >
                        <div className={`mb-2 ${selected ? 'text-orange-500' : 'text-gray-400'}`}>
                          {getServiceIcon(s.serviceName, 'w-7 h-7')}
                        </div>
                        <p className={`text-sm font-semibold leading-tight mb-1 ${selected ? 'text-orange-600' : 'text-[#222222]'}`}>
                          {s.serviceName}
                        </p>
                        <p className="text-xs text-orange-500 font-medium">{formatPrice(s.basePrice)}/giờ</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          )}

          {/* Thời gian */}
          <SectionCard title="Thời gian làm việc" icon={Calendar}>
            <div className="space-y-4">
              <div>
                <Label required>Ngày làm việc</Label>
                <input type="date" min={todayVN} max={maxDateVN}
                  value={form.bookingDate} onChange={set('bookingDate')} className={INPUT_CLS} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label required>Giờ bắt đầu</Label>
                  <TimePicker24h
                    value={form.startTime}
                    onChange={set('startTime')}
                    min={(() => {
                      const vnNow    = getVNNow();
                      const todayStr = vnNow.toISOString().slice(0, 10);
                      if (form.bookingDate !== todayStr) return '';
                      return `${String(vnNow.getUTCHours()).padStart(2, '0')}:${String(vnNow.getUTCMinutes()).padStart(2, '0')}`;
                    })()}
                    className={`${INPUT_CLS} ${timeError ? 'border-red-400 focus:border-red-500' : ''}`}
                  />
                  {timeError && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />{timeError}
                    </p>
                  )}
                </div>
                <div>
                  <Label required>Giờ kết thúc</Label>
                  <TimePicker24h
                    value={form.endTime}
                    onChange={set('endTime')}
                    min={form.startTime || ''}
                    strict
                    className={INPUT_CLS}
                  />
                </div>
              </div>
              {/* Price preview inline */}
              {priceLoading && (
                <div className="flex items-center gap-2 text-sm text-[#6a6a6a] bg-gray-50 rounded-xl px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-400" /> Đang tính giá...
                </div>
              )}
              {!priceLoading && priceData && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm text-[#6a6a6a]">
                    <span>{priceData.hours}h × {formatPrice(priceData.effectiveRate)}/giờ</span>
                    <span className="font-medium text-[#222222]">{formatPrice(priceData.basePrice)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base text-[#222222] border-t border-orange-200 pt-2">
                    <span>Dự kiến thanh toán</span>
                    <span className="text-orange-500">{formatPrice(priceData.totalPrice)}</span>
                  </div>
                </div>
              )}

              {/* Kiểm tra helper rảnh — hiển thị sau khi chọn đủ giờ */}
              {availChecking && form.startTime && form.endTime && form.startTime < form.endTime && (
                <div className="flex items-center gap-2 text-sm text-[#6a6a6a] bg-gray-50 rounded-xl px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> Đang kiểm tra lịch nhân viên...
                </div>
              )}
              {!availChecking && availability && !availability.available && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Tất cả nhân viên đang bận trong khung giờ này</p>
                      <p className="text-xs text-amber-600 mt-0.5">Bạn vẫn có thể đặt — chúng tôi sẽ thông báo khi có người rảnh. Hoặc chọn một khung giờ khác bên dưới:</p>
                    </div>
                  </div>
                  {availability.suggestions.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                      {availability.suggestions.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setAvailability(null);
                            setConflictError(null);
                            setForm(prev => ({
                              ...prev,
                              bookingDate: s.bookingDate,
                              startTime:   s.startTime,
                              endTime:     s.endTime,
                            }));
                          }}
                          className="flex items-center justify-between bg-white border border-amber-200 hover:border-orange-400 hover:bg-orange-50 rounded-lg px-3 py-2.5 text-left transition-all group"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                            <span className="text-sm font-medium text-[#222222]">
                              {s.bookingDate} · {s.startTime} – {s.endTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                            <Users className="w-3 h-3" />
                            {s.availableHelpers} nhân viên rảnh
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600">Hiện chưa tìm được khung giờ thay thế phù hợp trong 7 ngày tới.</p>
                  )}
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ─── STEP 2: 2-column layout ──────────────────────────────────── */}
      {step === 2 && (
        <div className="animate-[fadeIn_0.2s_ease] lg:grid lg:grid-cols-[1fr_380px] lg:gap-8 lg:items-start">

          {/* ─ Right sidebar: tóm tắt + promo + ghi chú (hiện trước trên mobile) ─ */}
          <div className="lg:col-start-2 lg:row-start-1 space-y-4 mb-6 lg:mb-0 lg:sticky lg:top-6">

            {/* Tóm tắt đơn */}
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-[#222222] mb-3">Tóm tắt đặt lịch</h3>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#6a6a6a]">Dịch vụ</dt>
                  <dd className="font-medium text-[#222222]">{selectedService?.serviceName || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#6a6a6a]">Ngày</dt>
                  <dd className="font-medium text-[#222222]">{form.bookingDate || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#6a6a6a]">Giờ</dt>
                  <dd className="font-medium text-[#222222]">{form.startTime} – {form.endTime}</dd>
                </div>
                {priceLoading ? (
                  <div className="flex items-center gap-2 text-xs text-[#6a6a6a] pt-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" /> Đang tính giá...
                  </div>
                ) : priceData ? (
                  <>
                    <div className="flex justify-between text-sm border-t border-orange-200 pt-2.5 mt-1">
                      <dt className="text-[#6a6a6a]">{priceData.hours}h × {formatPrice(priceData.effectiveRate)}/giờ</dt>
                      <dd className="text-[#222222]">{formatPrice(priceData.basePrice)}</dd>
                    </div>
                    {priceData.discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <dt>Giảm giá ({promoApplied?.discountLabel})</dt>
                        <dd>−{formatPrice(priceData.discountAmount)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base border-t border-orange-200 pt-2">
                      <dt className="text-[#222222]">Tổng dự kiến</dt>
                      <dd className="text-orange-500">{formatPrice(priceData.totalPrice)}</dd>
                    </div>
                    {trustInfo?.requiresOnlinePayment && (
                      <>
                        <div className="flex justify-between text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2 mt-1">
                          <dt className="font-medium">Cọc ngay qua VNPay (70%)</dt>
                          <dd className="font-bold">{formatPrice(Math.round(priceData.totalPrice * 0.7))}</dd>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500 px-1">
                          <dt>Thanh toán sau khi hoàn thành (30%)</dt>
                          <dd>{formatPrice(Math.round(priceData.totalPrice * 0.3))}</dd>
                        </div>
                      </>
                    )}
                  </>
                ) : null}
              </dl>
            </div>

            {/* Mã khuyến mãi */}
            <SectionCard title="Mã khuyến mãi" icon={Tag}>
              {promoApplied ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">{promoCode.toUpperCase()}</span>
                    <span className="text-sm text-green-600">— {promoApplied.discountLabel}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setPromoApplied(null); setPromoCode(''); }}
                    className="text-[#6a6a6a] hover:text-red-500 transition-colors p-1 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyPromo())}
                    placeholder="Nhập mã giảm giá..."
                    className={`${INPUT_CLS} flex-1 uppercase placeholder:normal-case`}
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoCode.trim()}
                    className="px-4 h-[42px] bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 whitespace-nowrap transition-colors flex items-center gap-1.5"
                  >
                    {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Áp dụng'}
                  </button>
                </div>
              )}
            </SectionCard>

            {/* Lưu ý phân công */}
            <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                <span className="font-semibold">Phân công tự động:</span> Đơn sẽ được gửi đến người giúp việc phù hợp gần nhất.
              </p>
            </div>

            {/* Banner lỗi trùng lịch */}
            {conflictError && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-700">Lịch bị trùng — không thể đặt</p>
                  <p className="text-sm text-red-600 mt-0.5">{conflictError}</p>
                  <p className="text-xs text-red-500 mt-1">Vui lòng quay lại và chọn ngày/giờ khác.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConflictError(null)}
                  className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* ─ Left column: địa chỉ + thanh toán + nút xác nhận ─ */}
          <div className="lg:col-start-1 lg:row-start-1 space-y-4">

            {/* Địa chỉ */}
            <SectionCard title="Địa chỉ làm việc" icon={MapPin}>
              <div className="space-y-4">
                <div>
                  <Label required>Địa chỉ đầy đủ</Label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={set('address')}
                    placeholder="VD: 15 Phố Huế, P.Nguyễn Du, Q.Hai Bà Trưng, Hà Nội"
                    className={INPUT_CLS}
                  />
                  <p className="flex items-center gap-1.5 text-xs text-[#6a6a6a] mt-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    Nhập địa chỉ chi tiết để người giúp việc dễ tìm đến
                  </p>
                </div>
                <div>
                  <Label>Ghi chú (tùy chọn)</Label>
                  <textarea
                    rows={3}
                    value={form.note}
                    onChange={set('note')}
                    placeholder="VD: Tập trung vệ sinh nhà bếp, tránh làm ồn buổi sáng..."
                    className={`${INPUT_CLS} resize-none`}
                  />
                </div>
              </div>
            </SectionCard>

            {/* Banner uy tín khách hàng */}
            {trustLoading && (
              <div className="flex items-center gap-2 text-sm text-[#6a6a6a] bg-gray-50 rounded-xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-orange-400" /> Đang kiểm tra thông tin tài khoản...
              </div>
            )}
            {!trustLoading && trustInfo && (
              trustInfo.isNewCustomer ? (
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <ShieldAlert className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Lần đầu đặt lịch — đặt cọc 70% qua VNPay</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Để đảm bảo cam kết và bảo vệ thời gian di chuyển của nhân viên,
                      lần đầu bạn cần đặt cọc 70% giá trị đơn qua VNPay ngay khi đặt lịch.
                      Phần 30% còn lại thanh toán sau khi dịch vụ hoàn thành.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                  <ShieldCheck className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">Khách hàng thân quen — tự do chọn thanh toán</p>
                    <p className="text-xs text-green-600 mt-0.5">
                      Bạn đã có lịch sử đặt lịch. Bạn được chọn tiền mặt hoặc VNPay tùy ý.
                    </p>
                  </div>
                </div>
              )
            )}

            {/* Phương thức thanh toán */}
            <SectionCard title="Phương thức thanh toán" icon={CreditCard}>
              <div className="space-y-2.5">
                {PAYMENT_METHODS.map(({ key, icon: Icon, label, sub }) => {
                  const active   = paymentMethod === key;
                  const disabled = key === 'cash' && trustInfo?.requiresOnlinePayment;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => !disabled && setPaymentMethod(key)}
                      disabled={disabled}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all
                        ${disabled
                          ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                          : active
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 bg-white hover:border-orange-200'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                        ${active && !disabled ? 'bg-orange-100' : 'bg-gray-100'}`}>
                        <Icon className={`w-5 h-5 ${active && !disabled ? 'text-orange-500' : 'text-[#6a6a6a]'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${active && !disabled ? 'text-orange-600' : 'text-[#222222]'}`}>
                          {label}
                          {disabled && <span className="ml-2 text-xs text-gray-400 font-normal">(Chưa mở khóa)</span>}
                        </p>
                        <p className="text-xs text-[#6a6a6a] mt-0.5">{sub}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                        ${active && !disabled ? 'border-orange-500' : 'border-gray-300'}`}>
                        {active && !disabled && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-2 pb-8">
              {!fromServicePage && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 flex items-center justify-center gap-2 h-12 border-2 border-gray-200 text-[#222222] rounded-lg font-medium text-sm hover:border-gray-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại
                </button>
              )}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !!conflictError}
                className="flex-1 flex items-center justify-center gap-2 h-12 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-base transition-colors"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Đang đặt lịch...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Xác nhận đặt lịch</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Navigation (Step 1) ─────────────────────────────────────── */}
      {step === 1 && (
        <div className="max-w-2xl mx-auto flex gap-3 mt-6 pb-8">
          <button
            type="button"
            onClick={goNext}
            disabled={!!timeError}
            className="flex-1 flex items-center justify-center gap-2 h-12 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-base transition-colors"
          >
            Tiếp tục
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
