import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './shared/context/AuthContext';
import Landing from './pages/Landing';
import MemberDashboard from './member/pages/Dashboard';
import ModeratorDashboard from './moderator/pages/Dashboard';
import DisplayDashboard from './display/pages/Dashboard';

function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;

  if (requiredRole === 'moderator' && user.role !== 'moderator' && user.role !== 'judge') {
    return <Navigate to={user.role === 'display' ? '/display' : '/member'} replace />;
  }
  if (requiredRole === 'display' && user.role !== 'display') {
    return <Navigate to={user.role === 'moderator' || user.role === 'judge' ? '/moderator' : '/member'} replace />;
  }
  if (requiredRole === 'member' && user.role !== 'member') {
    return <Navigate to={user.role === 'display' ? '/display' : '/moderator'} replace />;
  }
  return children;
}

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Landing />;

  if (user.role === 'display') return <Navigate to="/display" replace />;
  if (user.role === 'moderator' || user.role === 'judge') return <Navigate to="/moderator" replace />;

  return <Navigate to="/member" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route
            path="/member"
            element={
              <ProtectedRoute requiredRole="member">
                <MemberDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/moderator"
            element={
              <ProtectedRoute requiredRole="moderator">
                <ModeratorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/display"
            element={
              <ProtectedRoute requiredRole="display">
                <DisplayDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
