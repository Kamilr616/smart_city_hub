import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { UserContext } from './context/auth';

export const PrivateRoutes = () => {
  const { user } = useContext(UserContext);
  return user && user.exp * 1000 > Date.now() ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
};
