import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAllServicesApi } from '../../api/service.api';
import { createBookingApi, validatePromoCodeApi, pricePreviewApi } from '../../api/booking.api';
import { formatPrice } from '../../utils/format';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Tag,
  CreditCard,
  Banknote,
  QrCode,
  ChevronRight,
  Info,
  Loader2,
  X,
  Check,
} from 'lucide-react';

// ─── Step definitions ───────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Dịch vụ & Thời gian' },
  { id: 2, label: 'Địa chỉ & Ghi chú' },
  { id: 3, label: 'Thanh toán' },
];

// ─── Step indicator ─────────────────────────────────────────────────
function StepIndicator({ current }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((step, idx) => {
        const done = current > step.id;
        const active = current === step.id;
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                  ${done ? 'bg-green-500 text-white' : active ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}
              >
                {done ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block transition-colors
                  ${active ? 'text-orange-500' : done ? 'text-green-600' : 'text-gray-400'}`}
              >
                {step.label}
              </span>
            </div>
            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mt-[-12px] sm:mt-[-20px] transition-colors ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Service icon mapping ────────────────────────────────────────────
const SERVICE_ICONS = ['🧹', '🪟', '🌿', '👕', '🍳', '✨', '🚿', '🛁'];

// ─── Payment methods ─────────────────────────────────────────────────
const PAYMENT_METHODS = [
  {
    key: 'cash',
    icon: Banknote,
    label: 'Tiền mặt',
    sub: 'Trả trực tiếp khi hoàn thành',
  },
  {
    key: 'bank_transfer',
    icon: QrCode,
    label: 'Chuyển khoản',
    sub: 'Quét mã QR ngân hàng',
  },
  {
    key: 'vnpay',
    icon: CreditCard,
    label: 'VNPay',
    sub: 'Thanh toán online qua VNPay',
  },
];

// ─── Section card wrapper ────────────────────────────────────────────
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

// ─── Form label ──────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <label className="block text-sm font-medium text-[#222222] mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

// ─── Input base classes ──────────────────────────────────────────────
const INPUT_CLS =
  'w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-[#222222] placeholder:text-[#6a6a6a] focus:outline-none focus:border-gray-900 focus:ring-0 transition-colors';

// ─── Price preview block ──────────────────────────────────────────────
function PricePreview({ priceData, priceLoading }) {
  if (priceLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#6a6a6a] bg-gray-50 rounded-xl px-4 py-3">
        <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
        Đang tính giá...
      </div>
    );
  }
  if (!priceData) return null;
  return (
    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-2">
      <div className="flex justify-between text-sm text-[#6a6a6a]">
        <span>
          {priceData.hours}h × {formatPrice(priceData.effectiveRate)}/giờ
        </span>
        <span className="font-medium text-[#222222]">{formatPrice(priceData.basePrice)}</span>
      </div>
      <div className="flex justify-between font-semibold text-base text-[#222222] border-t border-orange-200 pt-2">
        <span>Dự kiến thanh toán</span>
        <span className="text-orange-500">{formatPrice(priceData.totalPrice)}</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────
export default function CreateBookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    serviceId: searchParams.get('serviceId') || '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    address: '',
    note: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [priceData, setPriceData] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);

  // Load danh sách dịch vụ
  useEffect(() => {
    getAllServicesApi()
      .then(({ data }) => setServices(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Tính giá từ backend mỗi khi thay đổi dịch vụ / giờ / promo
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
          endTime: form.endTime,
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

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (['serviceId', 'startTime', 'endTime'].includes(field)) setPromoApplied(null);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return toast.error('Vui lòng nhập mã khuyến mãi');
    if (!priceData || priceData.basePrice <= 0)
      return toast.error('Vui lòng chọn dịch vụ và giờ làm việc trước');
    setPromoLoading(true);
    try {
      const { data } = await validatePromoCodeApi(promoCode.trim(), priceData.basePrice);
      setPromoApplied(data.data);
      toast.success(data.message || 'Áp dụng mã thành công!');
    } catch (err) {
      setPromoApplied(null);
      toast.error(err.response?.data?.message || 'Mã không hợp lệ');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data } = await createBookingApi({
        serviceId: parseInt(form.serviceId),
        bookingDate: form.bookingDate,
        startTime: form.startTime,
        endTime: form.endTime,
        address: form.address,
        note: form.note || undefined,
        paymentMethod,
        promoCode: promoApplied ? promoCode.trim() : undefined,
      });
      if (data.data.availableHelperCount === 0) {
        toast('Đặt lịch thành công! Hiện chưa có nhân viên rảnh trong khung giờ này — chúng tôi sẽ thông báo khi có người phù hợp.', {
          icon: '⚠️',
          duration: 6000,
        });
      } else {
        toast.success(data.message || 'Đặt lịch thành công!');
      }
      navigate(`/bookings/${data.data.bookingId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đặt lịch thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const validateStep1 = () => {
    if (!form.serviceId) { toast.error('Vui lòng chọn dịch vụ'); return false; }
    if (!form.bookingDate) { toast.error('Vui lòng chọn ngày làm việc'); return false; }
    if (!form.startTime) { toast.error('Vui lòng chọn giờ bắt đầu'); return false; }
    if (!form.endTime) { toast.error('Vui lòng chọn giờ kết thúc'); return false; }
    if (form.startTime >= form.endTime) {
      toast.error('Giờ kết thúc phải sau giờ bắt đầu');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!form.address.trim()) { toast.error('Vui lòng nhập địa chỉ'); return false; }
    return true;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectedService = services.find((s) => String(s.serviceId) === String(form.serviceId));

  // ─── Loading skeleton ──────────────────────────────────────────────
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
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Back button */}
      <button
        onClick={() => (step > 1 ? setStep((s) => s - 1) : navigate(-1))}
        className="flex items-center gap-1.5 text-sm font-medium text-[#6a6a6a] hover:text-[#222222] transition-colors mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        {step > 1 ? 'Bước trước' : 'Quay lại'}
      </button>

      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-[#222222] leading-tight">Đặt lịch dịch vụ</h1>
        <p className="text-sm text-[#6a6a6a] mt-1">Điền thông tin để đặt lịch người giúp việc</p>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* ─── STEP 1: Dịch vụ & Thời gian ─────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4 animate-[fadeIn_0.2s_ease]">
          {/* Chọn dịch vụ */}
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
                      onClick={() => {
                        setForm((p) => ({ ...p, serviceId: String(s.serviceId) }));
                        setPromoApplied(null);
                      }}
                      className={`group text-left p-4 rounded-xl border-2 transition-all duration-150
                        ${selected
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-[rgba(0,0,0,0.02)_0_0_0_1px,rgba(0,0,0,0.04)_0_2px_6px,rgba(0,0,0,0.1)_0_4px_8px]'
                        }`}
                    >
                      <div className="text-2xl mb-2">{SERVICE_ICONS[idx % SERVICE_ICONS.length]}</div>
                      <p
                        className={`text-sm font-semibold leading-tight mb-1
                          ${selected ? 'text-orange-600' : 'text-[#222222]'}`}
                      >
                        {s.serviceName}
                      </p>
                      <p className="text-xs text-orange-500 font-medium">{formatPrice(s.basePrice)}/giờ</p>
                    </button>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* Thời gian làm việc */}
          <SectionCard title="Thời gian làm việc" icon={Calendar}>
            <div className="space-y-4">
              <div>
                <Label required>Ngày làm việc</Label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={form.bookingDate}
                  onChange={set('bookingDate')}
                  className={INPUT_CLS}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label required>Giờ bắt đầu</Label>
                  <input
                    type="time"
                    required
                    value={form.startTime}
                    onChange={set('startTime')}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <Label required>Giờ kết thúc</Label>
                  <input
                    type="time"
                    required
                    value={form.endTime}
                    onChange={set('endTime')}
                    className={INPUT_CLS}
                  />
                </div>
              </div>

              {/* Price preview */}
              <PricePreview priceData={priceData} priceLoading={priceLoading} />
            </div>
          </SectionCard>
        </div>
      )}

      {/* ─── STEP 2: Địa chỉ & Ghi chú ───────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4 animate-[fadeIn_0.2s_ease]">
          <SectionCard title="Địa chỉ làm việc" icon={MapPin}>
            <div className="space-y-4">
              <div>
                <Label required>Địa chỉ đầy đủ</Label>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={set('address')}
                  placeholder="VD: 123 Nguyễn Huệ, P.Bến Nghé, Q.1, TP.HCM"
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

          {/* Order summary */}
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-[#222222] mb-3">Tóm tắt đặt lịch</h3>
            <dl className="space-y-2 text-sm">
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
                <dd className="font-medium text-[#222222]">
                  {form.startTime} – {form.endTime}
                </dd>
              </div>
              {priceData && (
                <div className="flex justify-between font-semibold text-base border-t border-orange-200 pt-2 mt-2">
                  <dt className="text-[#222222]">Dự kiến chi phí</dt>
                  <dd className="text-orange-500">{formatPrice(priceData.totalPrice)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}

      {/* ─── STEP 3: Thanh toán & Xác nhận ───────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4 animate-[fadeIn_0.2s_ease]">
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
                  aria-label="Xóa mã"
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
                  onKeyDown={(e) =>
                    e.key === 'Enter' && (e.preventDefault(), handleApplyPromo())
                  }
                  placeholder="Nhập mã giảm giá..."
                  className={`${INPUT_CLS} flex-1 uppercase placeholder:normal-case`}
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={promoLoading || !promoCode.trim()}
                  className="px-4 h-[42px] bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 whitespace-nowrap transition-colors flex items-center gap-1.5"
                >
                  {promoLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Áp dụng'
                  )}
                </button>
              </div>
            )}
          </SectionCard>

          {/* Phương thức thanh toán */}
          <SectionCard title="Phương thức thanh toán" icon={CreditCard}>
            <div className="space-y-2.5">
              {PAYMENT_METHODS.map(({ key, icon: Icon, label, sub }) => {
                const active = paymentMethod === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPaymentMethod(key)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all
                      ${active
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 bg-white hover:border-orange-200'
                      }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                        ${active ? 'bg-orange-100' : 'bg-gray-100'}`}
                    >
                      <Icon className={`w-5 h-5 ${active ? 'text-orange-500' : 'text-[#6a6a6a]'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${active ? 'text-orange-600' : 'text-[#222222]'}`}>
                        {label}
                      </p>
                      <p className="text-xs text-[#6a6a6a] mt-0.5">{sub}</p>
                    </div>
                    {/* Radio circle */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                        ${active ? 'border-orange-500' : 'border-gray-300'}`}
                    >
                      {active && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* Chi tiết đặt lịch */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#222222] text-base">Chi tiết đặt lịch</h2>
            </div>
            <div className="p-6 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6a6a6a]">Dịch vụ</span>
                <span className="font-medium text-[#222222]">{selectedService?.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6a6a6a]">Thời gian</span>
                <span className="font-medium text-[#222222] text-right">
                  {form.bookingDate} · {form.startTime}–{form.endTime}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#6a6a6a] flex-shrink-0">Địa chỉ</span>
                <span className="font-medium text-[#222222] text-right">{form.address}</span>
              </div>

              <div className="border-t border-gray-100 my-1" />

              {priceLoading ? (
                <div className="flex items-center justify-center gap-2 text-xs text-[#6a6a6a] py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
                  Đang tính giá...
                </div>
              ) : priceData ? (
                <>
                  <div className="flex justify-between text-[#6a6a6a]">
                    <span>
                      {priceData.hours}h × {formatPrice(priceData.effectiveRate)}/giờ
                    </span>
                    <span>{formatPrice(priceData.basePrice)}</span>
                  </div>
                  {priceData.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá ({promoApplied?.discountLabel})</span>
                      <span>-{formatPrice(priceData.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg text-[#222222] border-t border-gray-200 pt-3 mt-1">
                    <span>Tổng cộng</span>
                    <span className="text-orange-500">{formatPrice(priceData.totalPrice)}</span>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* Info notice */}
          <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              <span className="font-semibold">Phân công tự động:</span> Đơn sẽ được gửi đến các người giúp việc phù hợp. Người giúp việc sẽ nhận việc sớm nhất có thể.
            </p>
          </div>
        </div>
      )}

      {/* ─── Navigation buttons ─────────────────────────────────────── */}
      <div className="flex gap-3 mt-6 pb-8">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="flex-1 flex items-center justify-center gap-2 h-12 border-2 border-gray-200 text-[#222222] rounded-lg font-medium text-sm hover:border-gray-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
        )}
        {step < 3 ? (
          <button
            type="button"
            onClick={nextStep}
            className="flex-1 flex items-center justify-center gap-2 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-base transition-colors"
          >
            Tiếp tục
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 h-12 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-base transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang đặt lịch...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Xác nhận đặt lịch
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
