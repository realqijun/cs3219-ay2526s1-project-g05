import { Navigate } from "react-router-dom";
import { useUserContext } from "@/context/UserContext";

export function ProtectedRoute({ children }) {
  const { user, loading } = useUserContext();

  if (loading) return <p>Loading...</p>;

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
