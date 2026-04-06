import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NotificationProvider } from './components/ui/NotificationProvider';
import { InactivityProvider } from './components/InactivityProvider';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <InactivityProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            {/* Always redirect to login first - ProtectedRoute will handle authenticated users */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            {/* Explicitly allow /forgot-password to avoid redirection by catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </InactivityProvider>
      </Router>
    </NotificationProvider>
  );
}

export default App;
