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

export function RegisterForm({ className, ...props }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState({
    username: "",
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
      username: "",
      email: "",
      password: "",
      general: "",
    };

    if (Array.isArray(errors)) {
      errors.forEach((error) => {
        const errorLower = error.toLowerCase();
        if (errorLower.includes("username")) {
          fieldErrs.username = error;
        } else if (errorLower.includes("email")) {
          fieldErrs.email = error;
        } else if (errorLower.includes("password")) {
          fieldErrs.password = error;
        } else {
          fieldErrs.general = error;
        }
      });
    } else if (typeof errors === "string") {
      fieldErrs.general = errors;
    }

    return fieldErrs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFieldErrors({
      username: "",
      email: "",
      password: "",
      general: "",
    });

    try {
      await userApi.register(formData);

      // Success - show toast and redirect to login
      toast.success("Account created successfully! Please log in.");
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      
      // Handle validation errors or other errors from the backend
      if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        setFieldErrors(parseErrors(error.errors));
      } else if (error.message) {
        setFieldErrors(parseErrors([error.message]));
      } else {
        setFieldErrors({
          username: "",
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
          <CardTitle className="text-xl">Get started with us!</CardTitle>
          <CardDescription>
            Create your account to begin solving problems
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
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="johndoe123"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                    className={fieldErrors.username ? "border-destructive" : ""}
                  />
                  {fieldErrors.username && (
                    <p className="text-xs text-destructive">{fieldErrors.username}</p>
                  )}
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
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
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>
              </div>

              <div className="text-center text-sm">
                Have an account?{" "}
                <a href="/login" className="underline underline-offset-4">
                  Log in
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
