// Router chính — định nghĩa tất cả routes với phân quyền theo role
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import PrivateRoute from './components/common/PrivateRoute';
import RoleRoute from './components/common/RoleRoute';

import LoginPage from './pages/auth/LoginPage';
import RegisterCustomerPage from './pages/auth/RegisterCustomerPage';
import RegisterHelperPage from './pages/auth/RegisterHelperPage';
import HomePage from './pages/home/HomePage';
import SearchHelpersPage from './pages/booking/SearchHelpersPage';
import HelperProfilePage from './pages/booking/HelperProfilePage';
import ServiceDetailPage from './pages/booking/ServiceDetailPage';
import CreateBookingPage from './pages/booking/CreateBookingPage';
import MyBookingsPage from './pages/booking/MyBookingsPage';
import BookingDetailPage from './pages/booking/BookingDetailPage';
import HelperJobsPage from './pages/helper/HelperJobsPage';
import HelperEarningsPage from './pages/helper/HelperEarningsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import UserProfilePage from './pages/profile/UserProfilePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminHelpersPage from './pages/admin/AdminHelpersPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminServicesPage from './pages/admin/AdminServicesPage';
import AdminPromotionsPage from './pages/admin/AdminPromotionsPage';

// Trang kết quả VNPay — đọc query params từ redirect của backend
function VNPayReturnPage() {
  const [params] = useSearchParams();
  const success = params.get('vnp_ResponseCode') === '00';
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-10 max-w-sm w-full text-center">
        <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl ${success ? 'bg-green-100' : 'bg-red-100'}`}>
          {success ? '✅' : '❌'}
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          {success ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          {success
            ? 'Đơn hàng của bạn đã được thanh toán qua VNPay.'
            : 'Giao dịch không thành công. Vui lòng thử lại.'}
        </p>
        <a href="/bookings" className="btn-primary py-2.5 px-6 text-sm inline-block">
          Xem đơn hàng
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { borderRadius: '12px', fontSize: '14px' },
          success: { iconTheme: { primary: '#f97316', secondary: '#fff' } },
        }} />
        <Routes>
          {/* Public — không cần Layout */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/customer" element={<RegisterCustomerPage />} />
          <Route path="/register/helper" element={<RegisterHelperPage />} />
          <Route path="/payment/vnpay-return" element={<VNPayReturnPage />} />

          {/* Admin — sidebar riêng */}
          <Route element={<RoleRoute roles={['admin']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/helpers" element={<AdminHelpersPage />} />
              <Route path="/admin/bookings" element={<AdminBookingsPage />} />
              <Route path="/admin/payments" element={<AdminPaymentsPage />} />
              <Route path="/admin/services" element={<AdminServicesPage />} />
              <Route path="/admin/promotions" element={<AdminPromotionsPage />} />
            </Route>
          </Route>

          {/* Main layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/services/:serviceId" element={<ServiceDetailPage />} />
            <Route path="/services/:serviceId/helpers" element={<SearchHelpersPage />} />
            <Route path="/helpers/:helperId" element={<HelperProfilePage />} />

            {/* Yêu cầu đăng nhập */}
            <Route element={<PrivateRoute />}>
              <Route path="/profile" element={<UserProfilePage />} />
              <Route path="/bookings/:bookingId" element={<BookingDetailPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>

            {/* Customer only */}
            <Route element={<RoleRoute roles={['customer']} />}>
              <Route path="/bookings/new" element={<CreateBookingPage />} />
              <Route path="/bookings" element={<MyBookingsPage />} />
            </Route>

            {/* Helper only */}
            <Route element={<RoleRoute roles={['helper']} />}>
              <Route path="/helper/jobs" element={<HelperJobsPage />} />
              <Route path="/helper/earnings" element={<HelperEarningsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
