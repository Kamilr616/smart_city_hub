import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { UserContext } from "./context/auth";
import Cookies from "js-cookie";

export const PrivateRoutes = () => {
  return Cookies.get("user") ? <Outlet /> : <Navigate to="/login" />;
};
