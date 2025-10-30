import { Navigate } from "react-router-dom";
import { useUserContext } from "@/context/UserContext";

export function ProtectedRoute({ children }) {
  const { user, loading } = useUserContext();

  if (loading) return <p>Loading...</p>;

  if (!user) {
    toast.info("Please login to access this page.");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }


  return children;
}
