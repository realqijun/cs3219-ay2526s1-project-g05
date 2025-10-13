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

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  defaultValue={user.username}
                  readOnly={!isEditingProfile}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={user.email}
                  readOnly={!isEditingProfile}
                />
              </div>
            </div>

            {isEditingProfile && (
              <div className="space-y-4">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" />
              </div>
            )}

            {isEditingProfile && (
              <div className="flex justify-end mt-6">
                <Button variant="default" onClick={() => setIsEditingProfile(false)}>
                  Save Changes
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
