import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Camera, Mail, Calendar, LogOut, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { userApi } from "@/lib/api";
import MainLayout from "@/layout/MainLayout";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [user, setUser] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Edit profile states
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

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // Initialize edit form with current user data
        setEditFormData({
          username: parsedUser.username,
          email: parsedUser.email,
          currentPassword: "",
          newPassword: "",
        });
      } catch (error) {
        console.error("Error parsing user data:", error);
        navigate("/login");
      }
    } else {
      // Redirect to login if not logged in
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    
    // Dispatch custom event to notify navbar of logout
    window.dispatchEvent(new Event("userLoggedOut"));
    
    toast.success("Logged out successfully!");
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError("Password is required to delete your account.");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      await userApi.delete(user.id, deletePassword);

      // Clear user data from localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      // Dispatch custom event to notify navbar of logout
      window.dispatchEvent(new Event("userLoggedOut"));

      toast.success("Account deleted successfully.");
      navigate("/");
    } catch (error) {
      console.error("Delete account error:", error);
      
      if (error.message) {
        setDeleteError(error.message);
      } else {
        setDeleteError("Unable to delete account. Please try again later.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = () => {
    setDeletePassword("");
    setDeleteError("");
    setIsDeleteDialogOpen(true);
  };

  const handleEditInputChange = (e) => {
    const { id, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [id]: value }));
    // Clear error for this field when user starts typing
    setEditFieldErrors((prev) => ({ ...prev, [id]: "", general: "" }));
  };

  const parseEditErrors = (errors) => {
    const fieldErrs = {
      username: "",
      email: "",
      currentPassword: "",
      newPassword: "",
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
          if (errorLower.includes("current")) {
            fieldErrs.currentPassword = error;
          } else {
            fieldErrs.newPassword = error;
          }
        } else {
          fieldErrs.general = error;
        }
      });
    } else if (typeof errors === "string") {
      fieldErrs.general = errors;
    }

    return fieldErrs;
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setEditFieldErrors({
      username: "",
      email: "",
      currentPassword: "",
      newPassword: "",
      general: "",
    });

    try {
      // Build update payload with only changed fields
      const updates = {};
      
      if (editFormData.username !== user.username) {
        updates.username = editFormData.username;
      }
      
      if (editFormData.email !== user.email) {
        updates.email = editFormData.email;
      }
      
      if (editFormData.newPassword) {
        if (!editFormData.currentPassword) {
          setEditFieldErrors((prev) => ({
            ...prev,
            currentPassword: "Current password is required to set a new password.",
          }));
          setIsSaving(false);
          return;
        }
        
        // Verify current password by attempting login (or you could add a verify endpoint)
        try {
          await userApi.login({
            email: user.email,
            password: editFormData.currentPassword,
          });
        } catch (error) {
          setEditFieldErrors((prev) => ({
            ...prev,
            currentPassword: "Current password is incorrect.",
          }));
          setIsSaving(false);
          return;
        }
        
        updates.password = editFormData.newPassword;
      }

      // Check if there are any updates
      if (Object.keys(updates).length === 0) {
        setEditFieldErrors({
          username: "",
          email: "",
          currentPassword: "",
          newPassword: "",
          general: "No changes detected.",
        });
        setIsSaving(false);
        return;
      }

      // Call update API
      const response = await userApi.update(user.id, updates);

      // Update localStorage with new user data
      const updatedUser = { ...user, ...response.user };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Reset form
      setEditFormData({
        username: updatedUser.username,
        email: updatedUser.email,
        currentPassword: "",
        newPassword: "",
      });
      
      setIsEditingProfile(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Update profile error:", error);
      
      if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        setEditFieldErrors(parseEditErrors(error.errors));
      } else if (error.message) {
        setEditFieldErrors(parseEditErrors([error.message]));
      } else {
        setEditFieldErrors({
          username: "",
          email: "",
          currentPassword: "",
          newPassword: "",
          general: "Unable to update profile. Please try again later.",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form to current user data
    setEditFormData({
      username: user.username,
      email: user.email,
      currentPassword: "",
      newPassword: "",
    });
    setEditFieldErrors({
      username: "",
      email: "",
      currentPassword: "",
      newPassword: "",
      general: "",
    });
    setIsEditingProfile(false);
  };

  if (!user) {
    return null; // or a loading spinner
  }

  const userInitials = user.username
    ? user.username.substring(0, 2).toUpperCase()
    : "U";

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
        {/* Header */}
        <Card>
          <CardContent className="p-6 mt-5">
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src="https://bundui-images.netlify.app/avatars/08.png"
                    alt="Profile"
                  />
                  <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="outline"
                  className="absolute -right-2 -bottom-2 h-8 w-8 rounded-full"
                >
                  <Camera />
                </Button>
              </div>

              <div className="flex-1 space-y-2 md:pl-6">
                <h1 className="text-2xl font-bold">{user.username}</h1>
                <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Mail className="size-4" />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="size-4" />
                    Joined {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {!isEditingProfile && (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingProfile(true)}
                  >
                    Edit Profile
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Content */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your username, email, or password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {editFieldErrors.general && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {editFieldErrors.general}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={editFormData.username}
                  onChange={handleEditInputChange}
                  disabled={!isEditingProfile || isSaving}
                  className={editFieldErrors.username ? "border-destructive" : ""}
                />
                {editFieldErrors.username && (
                  <p className="text-xs text-destructive">{editFieldErrors.username}</p>
                )}
                {!editFieldErrors.username && isEditingProfile && (
                  <p className="text-xs text-muted-foreground">
                    3-30 characters, letters, numbers, and underscores only
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editFormData.email}
                  onChange={handleEditInputChange}
                  disabled={!isEditingProfile || isSaving}
                  className={editFieldErrors.email ? "border-destructive" : ""}
                />
                {editFieldErrors.email && (
                  <p className="text-xs text-destructive">{editFieldErrors.email}</p>
                )}
              </div>
            </div>

            {isEditingProfile && (
              <div className="space-y-6 border-t pt-6">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="Enter current password"
                    value={editFormData.currentPassword}
                    onChange={handleEditInputChange}
                    disabled={isSaving}
                    className={editFieldErrors.currentPassword ? "border-destructive" : ""}
                  />
                  {editFieldErrors.currentPassword && (
                    <p className="text-xs text-destructive">{editFieldErrors.currentPassword}</p>
                  )}
                  {!editFieldErrors.currentPassword && (
                    <p className="text-xs text-muted-foreground">
                      Required only if changing password
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password (optional)</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={editFormData.newPassword}
                    onChange={handleEditInputChange}
                    disabled={isSaving}
                    className={editFieldErrors.newPassword ? "border-destructive" : ""}
                  />
                  {editFieldErrors.newPassword && (
                    <p className="text-xs text-destructive">{editFieldErrors.newPassword}</p>
                  )}
                  {!editFieldErrors.newPassword && (
                    <p className="text-xs text-muted-foreground">
                      At least 8 characters with 1 uppercase, 1 number, and 1 special character
                    </p>
                  )}
                </div>
              </div>
            )}

            {isEditingProfile && (
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible and destructive actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Delete Account</Label>
                <p className="text-muted-foreground text-sm">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button variant="destructive" onClick={openDeleteDialog}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delete-password">Confirm your password</Label>
              <Input
                id="delete-password"
                type="password"
                placeholder="Enter your password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setDeleteError("");
                }}
                disabled={isDeleting}
                className={deleteError ? "border-destructive" : ""}
              />
              {deleteError && (
                <p className="text-xs text-destructive">{deleteError}</p>
              )}
            </div>

            <div className="rounded-lg bg-destructive/10 p-3">
              <p className="text-sm text-destructive font-medium">
                Warning: You are about to delete your account
              </p>
              <ul className="mt-2 text-xs text-destructive/80 list-disc list-inside space-y-1">
                <li>All your personal information will be removed</li>
                <li>Your progress and history will be lost</li>
                <li>This action cannot be reversed</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
