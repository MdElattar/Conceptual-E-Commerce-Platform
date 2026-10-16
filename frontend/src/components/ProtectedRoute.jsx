import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ErrorBoundary from './ErrorBoundary';

const ProtectedRoute = () => {
  const { userInfo } = useSelector((state) => state.auth);

  return userInfo ? <ErrorBoundary><Outlet /></ErrorBoundary> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;