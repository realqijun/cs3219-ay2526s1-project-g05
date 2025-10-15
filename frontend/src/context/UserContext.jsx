import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { userApi } from "@/lib/api";

// Create the context
const UserContext = createContext(null);

// Provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
  });
  const [editFieldErrors, setEditFieldErrors] = useState({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    general: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Delete account state (optional)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Load user from localStorage and listen to login/logout events
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("user");
        setUser(null);
      }
    }

    const handleLogin = () => {
      const storedUser = localStorage.getItem("user");
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };

    const handleLogout = () => setUser(null);

    window.addEventListener("userLoggedIn", handleLogin);
    window.addEventListener("userLoggedOut", handleLogout);

    return () => {
      window.removeEventListener("userLoggedIn", handleLogin);
      window.removeEventListener("userLoggedOut", handleLogout);
    };
  }, []);

  // Sync editFormData whenever user changes
  useEffect(() => {
    if (user) {
      setEditFormData({
        username: user.username || "",
        email: user.email || "",
        currentPassword: "",
        newPassword: "",
      });
    } else {
      setEditFormData({
        username: "",
        email: "",
        currentPassword: "",
        newPassword: "",
      });
    }
  }, [user]);

  // Set user both in state and localStorage
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

  const logout = useCallback(() => {
    setUserAndStorage(null);
    window.dispatchEvent(new Event("userLoggedOut"));
    toast.success("Logged out successfully!");
  }, [setUserAndStorage]);

  // Profile editing handlers
  const handleEditInputChange = (e) => {
    const { id, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [id]: value }));
    setEditFieldErrors((prev) => ({ ...prev, [id]: "", general: "" }));
  };

  const parseEditErrors = (errors) => {
    const fieldErrs = { username: "", email: "", currentPassword: "", newPassword: "", general: "" };
    if (Array.isArray(errors)) {
      errors.forEach((error) => {
        const e = error.toLowerCase();
        if (e.includes("username")) fieldErrs.username = error;
        else if (e.includes("email")) fieldErrs.email = error;
        else if (e.includes("password")) {
          if (e.includes("current")) fieldErrs.currentPassword = error;
          else fieldErrs.newPassword = error;
        } else fieldErrs.general = error;
      });
    } else if (typeof errors === "string") {
      fieldErrs.general = errors;
    }
    return fieldErrs;
  };

  const saveChanges = async () => {
    if (!user) return;
    setIsSaving(true);
    setEditFieldErrors({ username: "", email: "", currentPassword: "", newPassword: "", general: "" });

    try {
      const updates = {};
      if (editFormData.username !== user.username) updates.username = editFormData.username;
      if (editFormData.email !== user.email) updates.email = editFormData.email;

      if (editFormData.newPassword) {
        if (!editFormData.currentPassword) {
          setEditFieldErrors((prev) => ({ ...prev, currentPassword: "Current password is required." }));
          setIsSaving(false);
          return;
        }
        try {
          await userApi.login({ email: user.email, password: editFormData.currentPassword });
        } catch {
          setEditFieldErrors((prev) => ({ ...prev, currentPassword: "Current password is incorrect." }));
          setIsSaving(false);
          return;
        }
        updates.password = editFormData.newPassword;
      }

      if (Object.keys(updates).length === 0) {
        setEditFieldErrors((prev) => ({ ...prev, general: "No changes detected." }));
        setIsSaving(false);
        return;
      }

      const response = await userApi.update(user.id, updates);
      const updatedUser = { ...user, ...response.user };
      setUserAndStorage(updatedUser);
      setIsEditingProfile(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      setEditFieldErrors(error.errors ? parseEditErrors(error.errors) : parseEditErrors([error.message]));
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    if (!user) return;
    setEditFormData({
      username: user.username,
      email: user.email,
      currentPassword: "",
      newPassword: "",
    });
    setEditFieldErrors({ username: "", email: "", currentPassword: "", newPassword: "", general: "" });
    setIsEditingProfile(false);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser: setUserAndStorage,
        logout,
        isEditingProfile,
        setIsEditingProfile,
        editFormData,
        editFieldErrors,
        isSaving,
        handleEditInputChange,
        saveChanges,
        cancelEdit,
        isDeleteDialogOpen,
        setIsDeleteDialogOpen,
        deletePassword,
        setDeletePassword,
        deleteError,
        isDeleting,
        // optional: you can implement openDeleteDialog and deleteAccount here too
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Hook to use the context
export const useUserContext = () => useContext(UserContext);
