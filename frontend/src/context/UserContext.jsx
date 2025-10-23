import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { userApi } from "@/lib/api";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setUserAndStorage = useCallback((newUser, token) => {
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
      if (token) localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
    setUser(newUser);
  }, []);

  const loginUser = useCallback(
    (userData, token) => {
      setUserAndStorage(userData, token);
      toast.success("Logged in successfully!");
    },
    [setUserAndStorage],
  );

  const logout = useCallback(() => {
    setUserAndStorage(null);
    toast.success("Logged out successfully!");
    navigate("/");
  }, [setUserAndStorage, navigate]);

  const refreshUserData = useCallback(async () => {
    try {
      // Fetch updated user data from API
      const response = await userApi.getById(user.id);
      setUserAndStorage(response.user);
    } catch (e) {
      console.error(e);
      toast.error("Failed to refresh user data:", e);
    }
  }, [user, setUserAndStorage]);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser: setUserAndStorage,
        loginUser,
        logout,
        refreshUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
