import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <p role="status" className="py-20 text-center text-gray-500">
        Loading…
      </p>
    );
  }
  if (!user) {
    // Send them to login and remember where they wanted to go
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}