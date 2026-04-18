// Router chính — định nghĩa tất cả routes với phân quyền theo role
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/common/PrivateRoute';
import RoleRoute from './components/common/RoleRoute';

import LoginPage from './pages/auth/LoginPage';
import RegisterCustomerPage from './pages/auth/RegisterCustomerPage';
import RegisterHelperPage from './pages/auth/RegisterHelperPage';
import HomePage from './pages/home/HomePage';
import SearchHelpersPage from './pages/booking/SearchHelpersPage';
import HelperProfilePage from './pages/booking/HelperProfilePage';
import CreateBookingPage from './pages/booking/CreateBookingPage';
import MyBookingsPage from './pages/booking/MyBookingsPage';
import BookingDetailPage from './pages/booking/BookingDetailPage';
import HelperJobsPage from './pages/helper/HelperJobsPage';
import HelperEarningsPage from './pages/helper/HelperEarningsPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Public — không cần Layout */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/customer" element={<RegisterCustomerPage />} />
          <Route path="/register/helper" element={<RegisterHelperPage />} />

          {/* Có Navbar */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/services/:serviceId/helpers" element={<SearchHelpersPage />} />
            <Route path="/helpers/:helperId" element={<HelperProfilePage />} />

            {/* Customer only */}
            <Route element={<RoleRoute roles={['customer']} />}>
              <Route path="/bookings/new" element={<CreateBookingPage />} />
              <Route path="/bookings" element={<MyBookingsPage />} />
            </Route>

            {/* Customer + Helper + Admin xem chi tiết booking */}
            <Route element={<PrivateRoute />}>
              <Route path="/bookings/:bookingId" element={<BookingDetailPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>

            {/* Helper only */}
            <Route element={<RoleRoute roles={['helper']} />}>
              <Route path="/helper/jobs" element={<HelperJobsPage />} />
              <Route path="/helper/earnings" element={<HelperEarningsPage />} />
            </Route>

            {/* Admin only */}
            <Route element={<RoleRoute roles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/bookings" element={<AdminBookingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
