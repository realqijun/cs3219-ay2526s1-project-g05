import { Navigate, useLocation } from "react-router-dom";
import { useUserContext } from "@/context/UserContext";

export function ProtectedRoute({ children }) {
  const { user, loading } = useUserContext();
  const location = useLocation();

  if (loading) return <p>Loading...</p>;

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, reason: "auth" }}
      />
    );
  }

  return children;
}
