import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { userApi } from "@/lib/api";

export function useAuth() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const parseErrors = (errors) => {
    const fieldErrs = { username: "", email: "", password: "", general: "" };
    if (Array.isArray(errors)) {
      errors.forEach((err) => {
        const e = err.toLowerCase();
        if (e.includes("username")) fieldErrs.username = err;
        else if (e.includes("email")) fieldErrs.email = err;
        else if (e.includes("password")) fieldErrs.password = err;
        else fieldErrs.general = err;
      });
    } else if (typeof errors === "string") {
      fieldErrs.general = errors;
    }
    return fieldErrs;
  };

  const login = async (data, setErrors) => {
    setIsLoading(true);
    setErrors({ username: "", email: "", password: "", general: "" });

    try {
      const response = await userApi.login(data);
      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("token", response.token);
      window.dispatchEvent(new Event("userLoggedIn"));
      toast.success("Login successful!");
      navigate("/"); // redirect after login
    } catch (error) {
      setErrors(error.errors ? parseErrors(error.errors) : { general: error.message || "Server error" });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data, setErrors) => {
    setIsLoading(true);
    setErrors({ username: "", email: "", password: "", general: "" });

    try {
      const response = await userApi.register(data);
      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("token", response.token);
      window.dispatchEvent(new Event("userLoggedIn"));
      toast.success("Registration successful!");
      navigate("/"); // redirect after register
    } catch (error) {
      setErrors(error.errors ? parseErrors(error.errors) : { general: error.message || "Server error" });
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email, setErrors) => {
    setIsLoading(true);
    setErrors({ email: "", general: "" });

    try {
      await userApi.requestPasswordReset(email);
      toast.success("If an account exists, a reset link has been sent.");
    } catch (error) {
      setErrors(error.errors ? parseErrors(error.errors) : { general: error.message || "Server error" });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("userLoggedOut"));
    navigate("/login");
  };

  return { login, register, forgotPassword, logout, isLoading };
}
