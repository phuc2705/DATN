import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAllServicesApi } from '../../api/service.api';
import { createBookingApi, validatePromoCodeApi, pricePreviewApi } from '../../api/booking.api';
import { formatPrice } from '../../utils/format';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 1, label: 'Dịch vụ & Thời gian', icon: '🗓️' },
  { id: 2, label: 'Địa chỉ & Ghi chú',   icon: '📍' },
  { id: 3, label: 'Thanh toán & Xác nhận', icon: '💳' },
];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, idx) => (
        <div key={step.id} className="flex items-center">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            current === step.id
              ? 'bg-orange-500 text-white shadow-md'
              : current > step.id
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-400'
          }`}>
            <span>{current > step.id ? '✓' : step.icon}</span>
            <span className="hidden sm:block">{step.label}</span>
            <span className="sm:hidden">{step.id}</span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`w-8 h-0.5 mx-1 transition-colors ${current > step.id ? 'bg-green-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

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

  useEffect(() => {
    getAllServicesApi()
      .then(({ data }) => setServices(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Tính giá từ backend mỗi khi thay đổi dịch vụ / giờ / promo
  useEffect(() => {
    if (!form.serviceId || !form.startTime || !form.endTime) { setPriceData(null); return; }
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
      } catch { setPriceData(null); }
      finally { setPriceLoading(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [form.serviceId, form.startTime, form.endTime, promoApplied]);

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (['serviceId', 'startTime', 'endTime'].includes(field)) setPromoApplied(null);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return toast.error('Vui lòng nhập mã khuyến mãi');
    if (!priceData || priceData.basePrice <= 0) return toast.error('Vui lòng chọn dịch vụ và giờ làm việc trước');
    setPromoLoading(true);
    try {
      const { data } = await validatePromoCodeApi(promoCode.trim(), priceData.basePrice);
      setPromoApplied(data.data);
      toast.success(data.message || 'Áp dụng mã thành công!');
    } catch (err) {
      setPromoApplied(null);
      toast.error(err.response?.data?.message || 'Mã không hợp lệ');
    } finally { setPromoLoading(false); }
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
      toast.success('Đặt lịch thành công!');
      navigate(`/bookings/${data.data.bookingId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đặt lịch thất bại');
    } finally { setSubmitting(false); }
  };

  const validateStep1 = () => {
    if (!form.serviceId) { toast.error('Vui lòng chọn dịch vụ'); return false; }
    if (!form.bookingDate) { toast.error('Vui lòng chọn ngày làm việc'); return false; }
    if (!form.startTime) { toast.error('Vui lòng chọn giờ bắt đầu'); return false; }
    if (!form.endTime) { toast.error('Vui lòng chọn giờ kết thúc'); return false; }
    if (form.startTime >= form.endTime) { toast.error('Giờ kết thúc phải sau giờ bắt đầu'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!form.address.trim()) { toast.error('Vui lòng nhập địa chỉ'); return false; }
    return true;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectedService = services.find(s => String(s.serviceId) === String(form.serviceId));

  if (loading) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-100 rounded-2xl w-2/3" />
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto animate-fadeIn">
      <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
        className="text-orange-500 hover:text-orange-600 text-sm mb-5 flex items-center gap-1 font-medium">
        ← {step > 1 ? 'Bước trước' : 'Quay lại'}
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Đặt lịch dịch vụ</h1>

      <StepIndicator current={step} />

      {/* ─── STEP 1: Dịch vụ & Thời gian ─── */}
      {step === 1 && (
        <div className="space-y-5 animate-fadeIn">
          {/* Chọn dịch vụ */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-orange-500 text-white rounded-lg flex items-center justify-center text-xs font-bold">1</span>
              Chọn dịch vụ
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {services.map((s, idx) => {
                const icons = ['🧹','🪟','🌿','👕','🍳','✨','🚿','🛁'];
                const colors = ['border-orange-200 bg-orange-50','border-blue-200 bg-blue-50','border-green-200 bg-green-50','border-purple-200 bg-purple-50','border-pink-200 bg-pink-50','border-yellow-200 bg-yellow-50'];
                const selected = String(form.serviceId) === String(s.serviceId);
                return (
                  <button
                    key={s.serviceId}
                    type="button"
                    onClick={() => { setForm(p => ({...p, serviceId: String(s.serviceId)})); setPromoApplied(null); }}
                    className={`text-left p-3 rounded-xl border-2 transition-all ${
                      selected ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="text-xl mb-1">{icons[idx % icons.length]}</div>
                    <p className={`text-sm font-medium ${selected ? 'text-orange-700' : 'text-gray-800'}`}>{s.serviceName}</p>
                    <p className="text-xs text-orange-500 font-semibold mt-0.5">{formatPrice(s.basePrice)}/giờ</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Thời gian */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-orange-500 text-white rounded-lg flex items-center justify-center text-xs font-bold">2</span>
              Thời gian làm việc
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label">Ngày làm việc</label>
                <input type="date" required
                  min={new Date().toISOString().split('T')[0]}
                  value={form.bookingDate} onChange={set('bookingDate')}
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Giờ bắt đầu</label>
                  <input type="time" required value={form.startTime} onChange={set('startTime')} className="input-field" />
                </div>
                <div>
                  <label className="label">Giờ kết thúc</label>
                  <input type="time" required value={form.endTime} onChange={set('endTime')} className="input-field" />
                </div>
              </div>

              {/* Preview thời lượng & giá */}
              {priceLoading && (
                <div className="bg-orange-50 rounded-xl p-3 text-center text-sm text-orange-500">
                  Đang tính giá...
                </div>
              )}
              {priceData && !priceLoading && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{priceData.hours}h × {formatPrice(priceData.effectiveRate)}/giờ</span>
                    <span className="font-medium">{formatPrice(priceData.basePrice)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-gray-900 border-t border-orange-100 pt-2">
                    <span>Dự kiến</span>
                    <span className="text-orange-500">{formatPrice(priceData.totalPrice)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ─── STEP 2: Địa chỉ & Ghi chú ─── */}
      {step === 2 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-orange-500 text-white rounded-lg flex items-center justify-center text-xs font-bold">3</span>
              Địa chỉ làm việc
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label">Địa chỉ đầy đủ <span className="text-red-500">*</span></label>
                <input type="text" required value={form.address} onChange={set('address')}
                  placeholder="VD: 123 Nguyễn Huệ, P.Bến Nghé, Q.1, TP.HCM"
                  className="input-field"
                />
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                  <span>💡</span> Nhập địa chỉ chi tiết để người giúp việc dễ tìm đến
                </p>
              </div>
              <div>
                <label className="label">Ghi chú cho người giúp việc (tùy chọn)</label>
                <textarea rows={3} value={form.note} onChange={set('note')}
                  placeholder="VD: Tập trung vệ sinh nhà bếp, tránh làm ồn buổi sáng..."
                  className="input-field resize-none"
                />
              </div>
            </div>
          </div>

          {/* Tóm tắt đơn hàng */}
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
            <h3 className="font-semibold text-orange-800 mb-3 text-sm">Tóm tắt đặt lịch</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Dịch vụ</span>
                <span className="font-medium text-gray-800">{selectedService?.serviceName || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ngày</span>
                <span className="font-medium text-gray-800">{form.bookingDate || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Giờ</span>
                <span className="font-medium text-gray-800">{form.startTime} – {form.endTime}</span>
              </div>
              {priceData && (
                <div className="flex justify-between font-bold text-base border-t border-orange-200 pt-2 mt-2">
                  <span className="text-gray-700">Dự kiến chi phí</span>
                  <span className="text-orange-600">{formatPrice(priceData.totalPrice)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 3: Thanh toán & Xác nhận ─── */}
      {step === 3 && (
        <div className="space-y-5 animate-fadeIn">
          {/* Mã khuyến mãi */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-orange-500 text-white rounded-lg flex items-center justify-center text-xs font-bold">🎁</span>
              Mã khuyến mãi
            </h2>
            {promoApplied ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <div>
                  <span className="text-green-700 font-semibold text-sm">✓ {promoCode.toUpperCase()}</span>
                  <span className="text-green-600 text-sm ml-2">— {promoApplied.discountLabel}</span>
                </div>
                <button type="button" onClick={() => { setPromoApplied(null); setPromoCode(''); }}
                  className="text-gray-400 hover:text-red-500 text-xl leading-none">×</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input type="text" value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyPromo())}
                  placeholder="Nhập mã giảm giá..."
                  className="input-field flex-1 uppercase placeholder:normal-case"
                />
                <button type="button" onClick={handleApplyPromo}
                  disabled={promoLoading || !promoCode.trim()}
                  className="px-4 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 disabled:opacity-50 whitespace-nowrap transition-colors"
                >
                  {promoLoading ? '...' : 'Áp dụng'}
                </button>
              </div>
            )}
          </div>

          {/* Phương thức thanh toán */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">Phương thức thanh toán</h2>
            <div className="space-y-3">
              {[
                { key: 'cash', icon: '💵', label: 'Tiền mặt', sub: 'Trả trực tiếp khi hoàn thành' },
                { key: 'bank_transfer', icon: '🏧', label: 'Chuyển khoản', sub: 'Quét mã QR ngân hàng' },
                { key: 'vnpay', icon: '🏦', label: 'VNPay', sub: 'Thanh toán online qua VNPay' },
              ].map(({ key, icon, label, sub }) => (
                <button key={key} type="button" onClick={() => setPaymentMethod(key)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    paymentMethod === key ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <span className="text-2xl">{icon}</span>
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${paymentMethod === key ? 'text-orange-700' : 'text-gray-800'}`}>{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    paymentMethod === key ? 'border-orange-500' : 'border-gray-300'
                  }`}>
                    {paymentMethod === key && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tóm tắt chi phí cuối */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">Chi tiết đặt lịch</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Dịch vụ</span>
                <span className="font-medium text-gray-800">{selectedService?.serviceName}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Thời gian</span>
                <span className="font-medium text-gray-800">{form.bookingDate} · {form.startTime}–{form.endTime}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Địa chỉ</span>
                <span className="font-medium text-gray-800 text-right max-w-[200px]">{form.address}</span>
              </div>
<hr className="my-2" />
              {priceLoading ? (
                <p className="text-center text-orange-400 text-xs py-1">Đang tính giá...</p>
              ) : priceData ? (
                <>
                  <div className="flex justify-between text-gray-600">
                    <span>{priceData.hours}h × {formatPrice(priceData.effectiveRate)}/giờ</span>
                    <span>{formatPrice(priceData.basePrice)}</span>
                  </div>
                  {priceData.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá ({promoApplied?.discountLabel})</span>
                      <span>-{formatPrice(priceData.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg text-gray-900 border-t pt-2">
                    <span>Tổng cộng</span>
                    <span className="text-orange-500">{formatPrice(priceData.totalPrice)}</span>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* Thông báo phân công */}
          <div className="rounded-xl p-4 text-sm border bg-blue-50 border-blue-200">
            <p className="text-blue-700">
              <span className="font-semibold">Phân công tự động:</span> Đơn sẽ được gửi đến các người giúp việc phù hợp. Người giúp việc sẽ nhận việc sớm nhất có thể.
            </p>
          </div>
        </div>
      )}

      {/* ─── Navigation buttons ─── */}
      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <button type="button" onClick={() => setStep(s => s - 1)}
            className="flex-1 border-2 border-gray-200 text-gray-600 py-3.5 rounded-xl font-semibold hover:border-gray-300 transition-colors">
            ← Quay lại
          </button>
        )}
        {step < 3 ? (
          <button type="button" onClick={nextStep}
            className="flex-1 btn-primary py-3.5 text-base">
            Tiếp tục →
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="flex-1 btn-primary py-3.5 text-base disabled:opacity-50">
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Đang đặt lịch...
              </span>
            ) : '✅ Xác nhận đặt lịch'}
          </button>
        )}
      </div>
    </div>
  );
}
