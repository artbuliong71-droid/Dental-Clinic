import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Walang naka-login — ibalik sa login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // May naka-login, pero mali ang role (hal. patient na sumusubok pumasok sa admin page)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
