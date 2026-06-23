import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CollegesPage from './pages/CollegesPage';

const App = () => {
  const token = localStorage.getItem('token');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={token ? <DashboardPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/colleges"
          element={token ? <CollegesPage /> : <Navigate to="/login" />}
        />
        <Route
          path="*"
          element={<Navigate to={token ? '/dashboard' : '/login'} />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;