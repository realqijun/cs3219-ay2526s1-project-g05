import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { userApi } from "@/lib/api";
import { useUserContext } from "@/context/UserContext";

export function useAuth() {
  const navigate = useNavigate();
  const { loginUser, logout } = useUserContext();
  const [isLoading, setIsLoading] = useState(false);

  const login = async (data) => {
    setIsLoading(true);
    try {
      const response = await userApi.login(data);
      loginUser(response.user, response.token); // update context + toast
      navigate("/");
    } catch (error) {
      toast.error("Login failed. Check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data) => {
    setIsLoading(true);
    try {
      const response = await userApi.register(data);
      loginUser(response.user, response.token); // update context + toast
      navigate("/");
    } catch (error) {
      toast.error("Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const logoutUser = () => {
    logout(); // context handles state + toast
    navigate("/login");
  };

  return { login, register, logout: logoutUser, isLoading };
}
