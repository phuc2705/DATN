// Chặn truy cập nếu không đúng role
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

export default function RoleRoute({ roles }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner size="lg" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.userType)) return <Navigate to="/" replace />;
  return <Outlet />;
}
