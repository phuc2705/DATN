// Router chính — định nghĩa tất cả routes với phân quyền theo role
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import PrivateRoute from './components/common/PrivateRoute';
import RoleRoute from './components/common/RoleRoute';

import LoginPage from './pages/auth/LoginPage';
import RegisterCustomerPage from './pages/auth/RegisterCustomerPage';
import RegisterHelperPage from './pages/auth/RegisterHelperPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import HomePage from './pages/home/HomePage';
import SearchHelpersPage from './pages/booking/SearchHelpersPage';
import HelperProfilePage from './pages/booking/HelperProfilePage';
import ServiceDetailPage from './pages/booking/ServiceDetailPage';
import CreateBookingPage from './pages/booking/CreateBookingPage';
import MyBookingsPage from './pages/booking/MyBookingsPage';
import BookingDetailPage from './pages/booking/BookingDetailPage';
import HelperJobsPage from './pages/helper/HelperJobsPage';
import HelperEarningsPage from './pages/helper/HelperEarningsPage';
import HelperSchedulePage from './pages/helper/HelperSchedulePage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import UserProfilePage from './pages/profile/UserProfilePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminHelpersPage from './pages/admin/AdminHelpersPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminServicesPage from './pages/admin/AdminServicesPage';
import AdminPromotionsPage from './pages/admin/AdminPromotionsPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AdminFeedbacksPage from './pages/admin/AdminFeedbacksPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import HelpPage from './pages/HelpPage';
import AboutPage from './pages/AboutPage';
import TermsPage from './pages/TermsPage';
import NotFoundPage from './pages/NotFoundPage';
import VNPayReturnPage from './pages/payment/VNPayReturnPage';

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
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
              <Route path="/admin/reviews" element={<AdminReviewsPage />} />
              <Route path="/admin/feedbacks" element={<AdminFeedbacksPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
            </Route>
          </Route>

          {/* Main layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/terms" element={<TermsPage />} />
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
              <Route path="/helper/jobs"     element={<HelperJobsPage />} />
              <Route path="/helper/earnings" element={<HelperEarningsPage />} />
              <Route path="/helper/schedule" element={<HelperSchedulePage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
