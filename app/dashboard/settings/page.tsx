"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { z } from "zod";

// Zod schemas for validation
const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-zA-Z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const profileSchema = z.object({
  phone: z.string().optional(),
  location: z.string().optional(),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  industry: z.string().optional(),
  experience: z.string().optional(),
});

interface UserSettings {
  name: string;
  email: string;
  phone: string;
  location: string;
  jobTitle: string;
  company: string;
  industry: string;
  experience: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function Settings() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    name: "",
    email: "",
    phone: "",
    location: "",
    jobTitle: "",
    company: "",
    industry: "",
    experience: "",
  });
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch user settings
  useEffect(() => {
    if (status === "authenticated") {
      fetchUserSettings();
    }
  }, [status]);

  const fetchUserSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/settings");

      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }

      const data = await response.json();
      console.log("Fetched user settings:", data);

      if (data.success && data.data) {
        setUserSettings({
          name: data.data.name || "",
          email: data.data.email || "",
          phone: data.data.phone || "",
          location: data.data.location || "",
          jobTitle: data.data.jobTitle || "",
          company: data.data.company || "",
          industry: data.data.industry || "",
          experience: data.data.experience || "",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserSettings((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setUserSettings((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user selects a value
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateAccountForm = () => {
    try {
      accountSchema.parse(userSettings);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            formattedErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(formattedErrors);
      }
      return false;
    }
  };

  const validatePasswordForm = () => {
    try {
      passwordSchema.parse(passwordData);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            formattedErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(formattedErrors);
      }
      return false;
    }
  };

  const validateProfileForm = () => {
    try {
      profileSchema.parse(userSettings);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            formattedErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(formattedErrors);
      }
      return false;
    }
  };

  const saveAccountSettings = async () => {
    if (!validateAccountForm()) return;

    try {
      setIsSaving(true);

      // Log what we're sending to the API
      console.log("Sending account data:", userSettings);

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userSettings.name,
          email: userSettings.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update settings");
      }

      // Update local state with the returned data
      if (data.data) {
        setUserSettings((prev) => ({
          ...prev,
          name: data.data.name || prev.name,
          email: data.data.email || prev.email,
        }));
      }

      toast.success("Account settings updated successfully", {
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update settings",
        {
          icon: <AlertCircle className="h-4 w-4 text-red-500" />,
        }
      );
    } finally {
      setIsSaving(false);
    }
  };

  const saveProfileSettings = async () => {
    if (!validateProfileForm()) return;

    try {
      setIsSaving(true);

      // Log what we're sending to the API
      console.log("Sending profile data:", userSettings);

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...userSettings,
          // Explicitly include all fields to ensure they're sent
          phone: userSettings.phone,
          location: userSettings.location,
          jobTitle: userSettings.jobTitle,
          company: userSettings.company,
          industry: userSettings.industry,
          experience: userSettings.experience,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      // Update local state with the returned data
      if (data.data) {
        setUserSettings({
          name: data.data.name || "",
          email: data.data.email || "",
          phone: data.data.phone || "",
          location: data.data.location || "",
          jobTitle: data.data.jobTitle || "",
          company: data.data.company || "",
          industry: data.data.industry || "",
          experience: data.data.experience || "",
        });
      }

      toast.success("Profile settings updated successfully", {
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile",
        {
          icon: <AlertCircle className="h-4 w-4 text-red-500" />,
        }
      );
    } finally {
      setIsSaving(false);
    }
  };

  const changePassword = async () => {
    if (!validatePasswordForm()) return;

    try {
      setIsSaving(true);

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      // Reset password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast.success("Password changed successfully", {
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      });
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to change password",
        {
          icon: <AlertCircle className="h-4 w-4 text-red-500" />,
        }
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <Card className="border-none shadow-md">
        <CardContent className="p-6 flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <span className="ml-2">Loading settings...</span>
        </CardContent>
      </Card>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">Not authenticated</h3>
            <p className="text-sm text-slate-500">
              Please sign in to view settings
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-md">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-6 bg-[#274754] text-white">
          <h2 className="text-xl font-bold mb-2">SETTINGS</h2>
          <p className="text-sm text-slate-300">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            {/* Account Settings */}
            <TabsContent value="account" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">
                  Account Information
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={userSettings.email}
                      onChange={handleSettingsChange}
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500 flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" /> {errors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={userSettings.name}
                      onChange={handleSettingsChange}
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" /> {errors.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Change Password</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className={errors.currentPassword ? "border-red-500" : ""}
                    />
                    {errors.currentPassword && (
                      <p className="text-sm text-red-500 flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />{" "}
                        {errors.currentPassword}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className={errors.newPassword ? "border-red-500" : ""}
                      />
                      {errors.newPassword && (
                        <p className="text-sm text-red-500 flex items-center mt-1">
                          <AlertCircle className="h-3 w-3 mr-1" />{" "}
                          {errors.newPassword}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className={
                          errors.confirmPassword ? "border-red-500" : ""
                        }
                      />
                      {errors.confirmPassword && (
                        <p className="text-sm text-red-500 flex items-center mt-1">
                          <AlertCircle className="h-3 w-3 mr-1" />{" "}
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={changePassword}
                      disabled={isSaving}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                          Changing Password...
                        </>
                      ) : (
                        "Change Password"
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => fetchUserSettings()}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveAccountSettings}
                  disabled={isSaving}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">
                  Personal Information
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={userSettings.phone}
                      onChange={handleSettingsChange}
                      className={errors.phone ? "border-red-500" : ""}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500 flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" /> {errors.phone}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="City, State"
                      value={userSettings.location}
                      onChange={handleSettingsChange}
                      className={errors.location ? "border-red-500" : ""}
                    />
                    {errors.location && (
                      <p className="text-sm text-red-500 flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />{" "}
                        {errors.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">
                  Professional Information
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Current Job Title</Label>
                    <Input
                      id="jobTitle"
                      name="jobTitle"
                      value={userSettings.jobTitle}
                      onChange={handleSettingsChange}
                      className={errors.jobTitle ? "border-red-500" : ""}
                    />
                    {errors.jobTitle && (
                      <p className="text-sm text-red-500 flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />{" "}
                        {errors.jobTitle}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company/Organization</Label>
                    <Input
                      id="company"
                      name="company"
                      value={userSettings.company}
                      onChange={handleSettingsChange}
                      className={errors.company ? "border-red-500" : ""}
                    />
                    {errors.company && (
                      <p className="text-sm text-red-500 flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />{" "}
                        {errors.company}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select
                      value={userSettings.industry}
                      onValueChange={(value) =>
                        handleSelectChange("industry", value)
                      }
                    >
                      <SelectTrigger
                        id="industry"
                        className={errors.industry ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="nonprofit">Nonprofit</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.industry && (
                      <p className="text-sm text-red-500 flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />{" "}
                        {errors.industry}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Select
                      value={userSettings.experience}
                      onValueChange={(value) =>
                        handleSelectChange("experience", value)
                      }
                    >
                      <SelectTrigger
                        id="experience"
                        className={errors.experience ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Select experience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-2">0-2 years</SelectItem>
                        <SelectItem value="3-5">3-5 years</SelectItem>
                        <SelectItem value="6-10">6-10 years</SelectItem>
                        <SelectItem value="11-15">11-15 years</SelectItem>
                        <SelectItem value="16+">16+ years</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.experience && (
                      <p className="text-sm text-red-500 flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />{" "}
                        {errors.experience}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => fetchUserSettings()}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveProfileSettings}
                  disabled={isSaving}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
