import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export const ProtectedRoute = () => {
  const { isAuth, user, isInitialized } = useAuthStore();
  const location = useLocation();

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isInitialized || !isAuth || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (((user as unknown) as Record<string, unknown>).rules_accepted === false && location.pathname !== '/rules') {
    return <Navigate to="/rules" replace />;
  }

  return <Outlet />;
};