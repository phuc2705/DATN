import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getHelperProfileApi } from '../../api/user.api';
import { getAllServicesApi } from '../../api/service.api';
import { createBookingApi } from '../../api/booking.api';
import { formatPrice } from '../../utils/format';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function CreateBookingPage() {
  const [searchParams] = useSearchParams();
  const helperId = searchParams.get('helperId');
  const serviceId = searchParams.get('serviceId');
  const navigate = useNavigate();

  const [helper, setHelper] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    helperId: parseInt(helperId) || '',
    serviceId: parseInt(serviceId) || '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    address: '',
    note: '',
  });

  useEffect(() => {
    Promise.all([
      helperId ? getHelperProfileApi(helperId) : Promise.resolve(null),
      getAllServicesApi(),
    ]).then(([h, s]) => {
      if (h) setHelper(h.data.data);
      setServices(s.data.data);
    }).finally(() => setLoading(false));
  }, [helperId]);

  // Tính giá ước tính
  const estimatedHours =
    form.startTime && form.endTime
      ? Math.max(0, (
          new Date(`2000-01-01T${form.endTime}`) - new Date(`2000-01-01T${form.startTime}`)
        ) / 3600000)
      : 0;
  const estimatedPrice = helper ? estimatedHours * helper.hourlyRate : 0;

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createBookingApi({
        helperId: parseInt(form.helperId),
        serviceId: parseInt(form.serviceId),
        bookingDate: form.bookingDate,
        startTime: form.startTime,
        endTime: form.endTime,
        address: form.address,
        note: form.note || undefined,
      });
      toast.success('Đặt lịch thành công! Đang chờ xác nhận từ người giúp việc.');
      navigate('/bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đặt lịch thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="text-primary-600 hover:underline text-sm mb-4 block">
        ← Quay lại
      </button>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Đặt lịch dịch vụ</h1>

      {helper && (
        <div className="bg-primary-50 rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-200 flex items-center justify-center text-xl">👩</div>
          <div>
            <p className="font-semibold text-gray-800">{helper.fullName}</p>
            <p className="text-primary-600 text-sm">{formatPrice(helper.hourlyRate)}/giờ</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4 border border-gray-100">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dịch vụ</label>
          <select
            required value={form.serviceId} onChange={set('serviceId')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">-- Chọn dịch vụ --</option>
            {services.map((s) => (
              <option key={s.serviceId} value={s.serviceId}>{s.serviceName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ngày làm việc</label>
          <input
            type="date" required
            min={new Date().toISOString().split('T')[0]}
            value={form.bookingDate} onChange={set('bookingDate')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giờ bắt đầu</label>
            <input
              type="time" required
              value={form.startTime} onChange={set('startTime')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giờ kết thúc</label>
            <input
              type="time" required
              value={form.endTime} onChange={set('endTime')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ làm việc</label>
          <input
            type="text" required
            value={form.address} onChange={set('address')}
            placeholder="123 Đường ABC, Phường XYZ, TP.HCM"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (tùy chọn)</label>
          <textarea
            rows={2}
            value={form.note} onChange={set('note')}
            placeholder="Yêu cầu đặc biệt..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Ước tính giá */}
        {estimatedHours > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>{estimatedHours} giờ × {formatPrice(helper?.hourlyRate || 0)}/giờ</span>
            </div>
            <div className="flex justify-between font-bold text-gray-800 mt-1 text-base">
              <span>Ước tính</span>
              <span className="text-primary-600">{formatPrice(estimatedPrice)}</span>
            </div>
          </div>
        )}

        <button
          type="submit" disabled={submitting}
          className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
        >
          {submitting ? 'Đang đặt lịch...' : 'Xác nhận đặt lịch'}
        </button>
      </form>
    </div>
  );
}
