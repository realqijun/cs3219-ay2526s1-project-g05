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

  useEffect(() => {
    const stored = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const setUserAndStorage = useCallback((newUser, token, rememberMe = false) => {
    const storage = rememberMe ? localStorage : sessionStorage;

    if (newUser) {
      storage.setItem("user", JSON.stringify(newUser));
      if (token) storage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
    }
    setUser(newUser);
  }, []);

  const loginUser = useCallback((userData, token, rememberMe = false) => {
    setUserAndStorage(userData, token, rememberMe);
    toast.success("Logged in successfully!");
  }, [setUserAndStorage]);

  const logout = useCallback(() => {
    setUserAndStorage(null);
    toast.success("Logged out successfully!");
    navigate("/login");
  }, [setUserAndStorage, navigate]);

  const handleInitialLoad = useCallback(async () => {
    await refreshUserData();
    setLoading(false);
  });

  const refreshUserData = useCallback(async () => {
    try {
      // Fetch updated user data from API
      const response = await userApi.getMe();
      setUser(response.user);
      return response.user;
    } catch (e) {
      return null;
    }
  }, [user, setUser]);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
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
