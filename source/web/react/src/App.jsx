import { useContext, useState } from "react";
import "./App.css";
import Login from "./Login";
import { Navigate, Route, Routes, createBrowserRouter } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import { PrivateRoutes } from "./privateRoute";
import { UserContext } from "./context/auth";
import Cookies from "js-cookie";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Dashboard />,
    },
    {
      path: "login",
      element: <Login />,
    },
    {
      path: "adminDashboard",
      element: <AdminDashboard />,
    },
  ]);

  const { getRole } = useContext(UserContext);
  return (
    <>
      <Routes>
        <Route element={<PrivateRoutes />}>
          <Route
            exact
            path="/"
            element={getRole() ? <AdminDashboard /> : <Dashboard />}
          />
          <Route
            path="/adminDashboard"
            element={getRole() ? <AdminDashboard /> : <Navigate to="/" />}
          />
        </Route>
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  );
}

export default App;
