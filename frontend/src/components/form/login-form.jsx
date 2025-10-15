import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { userApi } from "@/lib/api";

export function LoginForm({ className, ...props }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    // Clear error for this field when user starts typing
    setFieldErrors((prev) => ({ ...prev, [id]: "", general: "" }));
  };

  const parseErrors = (errors) => {
    const fieldErrs = {
      email: "",
      password: "",
      general: "",
    };

    if (Array.isArray(errors)) {
      errors.forEach((error) => {
        const errorLower = error.toLowerCase();
        
        // Check for authentication/general errors first (these should NOT highlight fields)
        if (errorLower.includes("invalid email or password") || 
            errorLower.includes("invalid email") || 
            (errorLower.includes("account") && errorLower.includes("locked"))) {
          fieldErrs.general = error;
        } 
        // Then check for specific field validation errors
        else if (errorLower.includes("valid email") || errorLower.includes("email address is required")) {
          fieldErrs.email = error;
        } else if (errorLower.includes("password is required")) {
          fieldErrs.password = error;
        } else {
          fieldErrs.general = error;
        }
      });
    } else if (typeof errors === "string") {
      const errorLower = errors.toLowerCase();
      
      // Check for authentication/general errors first
      if (errorLower.includes("invalid email or password") || 
          errorLower.includes("invalid email") || 
          (errorLower.includes("account") && errorLower.includes("locked"))) {
        fieldErrs.general = errors;
      }
      // Then check for specific field validation errors
      else if (errorLower.includes("valid email") || errorLower.includes("email address is required")) {
        fieldErrs.email = errors;
      } else if (errorLower.includes("password is required")) {
        fieldErrs.password = errors;
      } else {
        fieldErrs.general = errors;
      }
    }

    return fieldErrs;
  };

  const validateForm = () => {
    const errors = {
      email: "",
      password: "",
      general: "",
    };

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      errors.email = "Email is required.";
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email address.";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required.";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const validationErrors = validateForm();
    if (validationErrors.email || validationErrors.password) {
      setFieldErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setFieldErrors({
      email: "",
      password: "",
      general: "",
    });

    try {
      const response = await userApi.login(formData);
      
      // Store user data and token in localStorage
      if (response.user) {
        localStorage.setItem("user", JSON.stringify(response.user));
      }
      if (response.token) {
        localStorage.setItem("token", response.token);
      }

      // Dispatch custom event to notify navbar of login
      window.dispatchEvent(new Event("userLoggedIn"));

      toast.success("Login successful!");
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      
      // Handle validation errors or other errors from the backend
      if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        setFieldErrors(parseErrors(error.errors));
      } else if (error.message) {
        setFieldErrors(parseErrors([error.message]));
      } else {
        setFieldErrors({
          email: "",
          password: "",
          general: "Unable to connect to the server. Please try again later.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              {fieldErrors.general && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {fieldErrors.general}
                </div>
              )}

              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                    className={fieldErrors.email ? "border-destructive" : ""}
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-destructive">{fieldErrors.email}</p>
                  )}
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <a
                      href="/forgot-password"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                    className={fieldErrors.password ? "border-destructive" : ""}
                  />
                  {fieldErrors.password && (
                    <p className="text-xs text-destructive">{fieldErrors.password}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>

              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <a href="/register" className="underline underline-offset-4">
                  Sign up
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
