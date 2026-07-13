import { useContext } from "react";
import "./App.css";
import Login from "./Login";
import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import { PrivateRoutes } from "./privateRoute";
import { UserContext } from "./context/auth";

function App() {
  const { user } = useContext(UserContext);
  const isAdmin = Boolean(user?.isAdmin);
  return (
    <>
      <Routes>
        <Route element={<PrivateRoutes />}>
          <Route
            exact
            path="/"
            element={isAdmin ? <AdminDashboard /> : <Dashboard />}
          />
          <Route
            path="/adminDashboard"
            element={isAdmin ? <AdminDashboard /> : <Navigate to="/" replace />}
          />
        </Route>
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  );
}

export default App;
