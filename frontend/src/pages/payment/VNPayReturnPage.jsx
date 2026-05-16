import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function VNPayReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get('status');
  const bookingId = searchParams.get('bookingId');
  const isSuccess = status === 'success';

  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          if (bookingId) navigate(`/bookings/${bookingId}`, { replace: true });
          else navigate('/bookings', { replace: true });
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [bookingId, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 max-w-sm w-full text-center animate-fadeIn">
        {isSuccess ? (
          <>
            {/* Success */}
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Thanh toán thành công!</h1>
            <p className="text-gray-500 text-sm mb-2">
              Đơn hàng #{bookingId} đã được thanh toán qua VNPay.
            </p>
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-4 py-2 rounded-full mb-6">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Đã xác nhận thanh toán
            </div>
          </>
        ) : (
          <>
            {/* Failed */}
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Thanh toán thất bại</h1>
            <p className="text-gray-500 text-sm mb-6">
              Giao dịch VNPay không thành công. Vui lòng thử lại hoặc chọn phương thức khác.
            </p>
          </>
        )}

        <p className="text-xs text-gray-400 mb-4">
          Tự động chuyển về sau <span className="font-bold text-orange-500">{countdown}s</span>
        </p>

        <button
          onClick={() => bookingId ? navigate(`/bookings/${bookingId}`) : navigate('/bookings')}
          className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-all"
        >
          {bookingId ? 'Xem chi tiết đơn hàng' : 'Về trang đặt lịch'}
        </button>
      </div>
    </div>
  );
}
