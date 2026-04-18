import { useEffect, useState } from 'react';
import { getHelperBookingsApi, confirmBookingApi, checkInApi, checkOutApi } from '../../api/booking.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice, formatDate, BOOKING_STATUS_LABEL } from '../../utils/format';
import toast from 'react-hot-toast';

export default function HelperJobsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    getHelperBookingsApi()
      .then(({ data }) => setBookings(data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const act = async (fn, id, successMsg) => {
    try {
      await fn(id);
      toast.success(successMsg);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Công việc của tôi</h1>
      {loading ? <LoadingSpinner /> : (
        bookings.length === 0
          ? <p className="text-center text-gray-400 py-12">Chưa có công việc nào.</p>
          : (
            <div className="space-y-4">
              {bookings.map((b) => {
                const sl = BOOKING_STATUS_LABEL[b.status] || {};
                return (
                  <div key={b.bookingId} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-800">Đơn #{b.bookingId}</p>
                        <p className="text-sm text-gray-500">{formatDate(b.bookingDate)} · {b.startTime} – {b.endTime}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{b.address}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${sl.color}`}>{sl.text}</span>
                        <p className="text-primary-600 font-semibold mt-1">{formatPrice(b.totalPrice)}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-2">
                      {b.status === 'pending' && (
                        <button
                          onClick={() => act(confirmBookingApi, b.bookingId, 'Đã xác nhận đơn!')}
                          className="flex-1 bg-blue-500 text-white py-1.5 rounded-lg text-sm hover:bg-blue-600"
                        >
                          Xác nhận
                        </button>
                      )}
                      {b.status === 'confirmed' && (
                        <button
                          onClick={() => act(checkInApi, b.bookingId, 'Check-in thành công!')}
                          className="flex-1 bg-indigo-500 text-white py-1.5 rounded-lg text-sm hover:bg-indigo-600"
                        >
                          Check-in
                        </button>
                      )}
                      {b.status === 'in_progress' && (
                        <button
                          onClick={() => act(checkOutApi, b.bookingId, 'Check-out thành công!')}
                          className="flex-1 bg-green-500 text-white py-1.5 rounded-lg text-sm hover:bg-green-600"
                        >
                          Check-out
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
      )}
    </div>
  );
}
