import { useContext } from 'react';
import { Navigate, Route, Routes, useOutletContext } from 'react-router-dom';
import { UserContext } from './context/auth';
import { PrivateRoutes } from './privateRoute';
import Login from './Login';
import PanelLayout from './components/PanelLayout';
import Overview from './components/Overview';
import Devices from './components/Devices';
import Locations from './components/Locations';
import SensorPanel from './components/SensorPanel';
import AddDevice from './AddDevice';
import AddNewUser from './AddNewUser';
import './App.css';

function NewDevice() {
  const { refresh } = useOutletContext();
  return <AddDevice onSaved={refresh} />;
}

export default function App() {
  const { user } = useContext(UserContext);
  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin');
  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route element={<PrivateRoutes />}>
        <Route element={<PanelLayout />}>
          <Route index element={<Overview />} />
          <Route path="/devices" element={<Devices />} />
          <Route
            path="/sensors"
            element={
              <>
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">DANE ŚRODOWISKOWE</p>
                    <h1>Czujniki</h1>
                    <p>
                      Pomiary, trendy i historia warunków w Twojej makiecie.
                    </p>
                  </div>
                </div>
                <SensorPanel />
              </>
            }
          />
          <Route path="/locations" element={<Locations />} />
          <Route
            path="/cities"
            element={<Navigate to="/locations" replace />}
          />
          <Route
            path="/devices/new"
            element={isAdmin ? <NewDevice /> : <Navigate to="/" replace />}
          />
          <Route
            path="/users/new"
            element={isAdmin ? <AddNewUser /> : <Navigate to="/" replace />}
          />
          <Route path="/adminDashboard" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
      <Route
        path="*"
        element={<Navigate to={user ? '/' : '/login'} replace />}
      />
    </Routes>
  );
}
