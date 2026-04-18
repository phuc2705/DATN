// Chặn truy cập nếu chưa đăng nhập
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

export default function PrivateRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner size="lg" />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
