import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { userApi } from "@/lib/api";
import { Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

const UserContext = createContext(null);
const UNAUTHENTICATED_ROUTES = ["/register", "/login", "/"];

export const UserProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    handleInitialLoad();
  }, []);

  useEffect(() => {
    if (loading) return; // Return if initialLoad is not complete

    if (user && token) {
      if (location.pathname === "/register" || location.pathname === "/login") {
        // Don't allow auth users to access login/register pages
        navigate("/matchmaking");
      }
      return;
    }

    // If no valid user obj, we need to only allow routes to main page + login page
    if (!UNAUTHENTICATED_ROUTES.includes(location.pathname)) {
      toast.info("Please login to access this page.");
      navigate("/login");
    }
  }, [loading, user, token, location]);

  const setUserAndStorage = useCallback(
    (newUser, token = undefined, rememberMe = false) => {
      setUser(newUser);
      if (typeof token !== "undefined") setToken(token);

      const storage = rememberMe ? localStorage : sessionStorage;
      if (newUser) {
        storage.setItem("token", token);
      } else {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
      }
    },
    [setUser, setToken],
  );

  const loginUser = useCallback(
    (userData, token, rememberMe) => {
      setUserAndStorage(userData, token, rememberMe);
      toast.success("Logged in successfully!");
    },
    [setUserAndStorage],
  );

  const logout = useCallback(() => {
    navigate("/login", { replace: true, state: {} });
    setUserAndStorage(null, null);
    toast.success("Logged out successfully!");
  }, [setUserAndStorage, navigate]);

  const refreshUserData = useCallback(async () => {
    try {
      // Fetch updated user data from API
      const response = await userApi.getMe();
      setUser(response.user);
      return response.user;
    } catch (e) {
      if (e.status === 401) {
        setUserAndStorage(null, null); // Invalid token, maybe expired
      }
      return null;
    }
  }, [setUser]);

  const handleInitialLoad = useCallback(async () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      const isValidUser = await refreshUserData();
      if (isValidUser) setToken(token);
    }
    setLoading(false);
  }, [refreshUserData]);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        token,
        setUser: setUserAndStorage,
        loginUser,
        logout,
        refreshUserData,
      }}
    >
      {loading ? (
        <div className="animate-in fade-in duration-100 flex justify-center items-center w-screen h-screen">
          <div className="flex flex-col items-center">
            <img src={logo} className="h-24 mb-3" alt="logo" />
            <h1 className="text-2xl tracking-widest">Loading PeerPrep...</h1>
            <Loader2 className="w-16 h-16 mt-4 text-primary animate-spin" />
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in-100">{children}</div>
      )}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
