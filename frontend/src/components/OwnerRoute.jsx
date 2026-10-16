import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const OwnerRoute = () => {
  const { userInfo } = useSelector((state) => state.auth);
  return userInfo && userInfo.isOwner ? <Outlet /> : <Navigate to='/login' replace />;
};
export default OwnerRoute;