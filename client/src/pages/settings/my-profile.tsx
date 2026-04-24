import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Upload, Camera, Eye, EyeOff, ArrowLeft, Calendar, CalendarIcon, MapPin, Bell, Settings, UserCheck, Mail, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UploadResult } from "@uppy/core";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import type { Staff, TimeOffRequest } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import NotificationSettingsPanel from "@/components/settings/NotificationSettingsPanel";
import { RichTextEditor } from "@/components/rich-text-editor";

// Form schemas for different tabs
const personalInfoSchema = z.object({
  birthdate: z.string().optional(),
  shirtSize: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
});

const addressSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
});

export default function MyProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signatureEnabled, setSignatureEnabled] = useState(true);
  const [birthdateOpen, setBirthdateOpen] = useState(false);
  
  // Get current user from authenticated session
  const { data: authUser } = useQuery<{ id: string; firstName: string; lastName: string }>({
    queryKey: ['/api/auth/current-user'],
  });
  
  const currentUserId = authUser?.id;
  
  // Fetch current user's staff record
  const { data: currentUser, isLoading: userLoading } = useQuery<Staff>({
    queryKey: ["/api/staff", currentUserId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/staff/${currentUserId}`);
      return await response.json();
    },
    enabled: !!currentUserId, // Only fetch when we have a user ID
  });

  // Fetch time off requests for HR tab
  const { data: timeOffResponse } = useQuery<{ requests: TimeOffRequest[] }>({
    queryKey: ["/api/hr/time-off-requests"],
  });
  
  const timeOffRequests = timeOffResponse?.requests || [];

  // Fetch time off policies to get current allocations
  const { data: policies = [] } = useQuery<any[]>({
    queryKey: ["/api/hr/time-off-policies"],
  });

  // Fetch calendars for assignment
  const { data: calendars = [], isLoading: calendarsLoading } = useQuery<Array<{
    id: string;
    name: string;
    description?: string;
    type: string;
    isActive: boolean;
    color: string;
  }>>({
    queryKey: ["/api/calendars"],
  });

  // Fetch linked email accounts for the current user
  const { data: linkedEmails = [], isLoading: linkedEmailsLoading } = useQuery<Array<{
    id: string;
    staffId: string;
    email: string;
    googleSub: string | null;
    isPrimary: boolean;
    createdAt: string;
  }>>({
    queryKey: ["/api/staff", currentUserId, "linked-emails"],
    queryFn: async () => {
      const response = await fetch(`/api/staff/${currentUserId}/linked-emails`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Failed to fetch linked emails");
      return response.json();
    },
    enabled: !!currentUserId,
  });

  // Form for personal information
  const personalForm = useForm<z.infer<typeof personalInfoSchema>>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      birthdate: currentUser?.birthdate || "",
      shirtSize: currentUser?.shirtSize || "",
      emergencyContactName: currentUser?.emergencyContactName || "",
      emergencyContactPhone: currentUser?.emergencyContactPhone || "",
      emergencyContactRelationship: currentUser?.emergencyContactRelationship || "",
    },
  });

  // Form for address information
  const addressForm = useForm<z.infer<typeof addressSchema>>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      address: currentUser?.address || "",
      city: currentUser?.city || "",
      state: currentUser?.state || "",
      zip: currentUser?.zip || "",
      country: currentUser?.country || "",
    },
  });
  
  const [formData, setFormData] = useState({
    email: currentUser?.email || "",
    extension: "101",
    assignedCalendarId: currentUser?.assignedCalendarId || "none",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    signature: `<p><strong>Best regards,</strong></p><p>${currentUser?.firstName || "John"} ${currentUser?.lastName || "Doe"}<br>AgencyBoost Marketing<br><a href="mailto:${currentUser?.email || "john@agencyflow.com"}">${currentUser?.email || "john@agencyflow.com"}</a><br>${currentUser?.phone || "(555) 123-4567"}</p>`
  });

  // Update staff mutation for personal info
  const updateStaffMutation = useMutation({
    mutationFn: async (data: Partial<Staff>) => {
      const response = await apiRequest("PUT", `/api/staff/${currentUserId}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff", currentUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff", currentUserId, "linked-emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/current-user"] });
      toast({
        title: "Success",
        variant: "default",
        description: "Profile updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest("POST", "/api/auth/change-password", data);
      return await response.json();
    },
    onSuccess: () => {
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      toast({
        title: "Success",
        variant: "default",
        description: "Password changed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove linked email mutation
  const removeLinkedEmailMutation = useMutation({
    mutationFn: async (emailId: string) => {
      const response = await apiRequest("DELETE", `/api/staff/${currentUserId}/linked-emails/${emailId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff", currentUserId, "linked-emails"] });
      toast({
        title: "Success",
        variant: "default",
        description: "Email account unlinked successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unlink email. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Set email as primary mutation
  const setPrimaryEmailMutation = useMutation({
    mutationFn: async (emailId: string) => {
      const response = await apiRequest("PATCH", `/api/staff/${currentUserId}/linked-emails/${emailId}/set-primary`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff", currentUserId, "linked-emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff", currentUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/current-user"] });
      toast({
        title: "Success",
        variant: "default",
        description: "Primary email updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set primary email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleChangePassword = () => {
    if (!formData.currentPassword) {
      toast({
        title: "Error",
        description: "Please enter your current password.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.newPassword) {
      toast({
        title: "Error",
        description: "Please enter a new password.",
        variant: "destructive",
      });
      return;
    }
    if (formData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    });
  };

  // Update form defaults when user data loads
  useEffect(() => {
    if (currentUser) {
      personalForm.reset({
        birthdate: currentUser.birthdate || "",
        shirtSize: currentUser.shirtSize || "",
        emergencyContactName: currentUser.emergencyContactName || "",
        emergencyContactPhone: currentUser.emergencyContactPhone || "",
        emergencyContactRelationship: currentUser.emergencyContactRelationship || "",
      });
      addressForm.reset({
        address: currentUser.address || "",
        city: currentUser.city || "",
        state: currentUser.state || "",
        zip: currentUser.zip || "",
        country: currentUser.country || "",
      });
      setFormData(prev => ({
        ...prev,
        email: currentUser.email || "",
        assignedCalendarId: currentUser.assignedCalendarId || "none",
        signature: `<p><strong>Best regards,</strong></p><p>${currentUser.firstName} ${currentUser.lastName}<br>AgencyBoost Marketing<br><a href="mailto:${currentUser.email}">${currentUser.email}</a><br>${currentUser.phone}</p>`
      }));
    }
  }, [currentUser, personalForm, addressForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate email format
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    // Update staff record with calendar assignment and email
    updateStaffMutation.mutate({
      email: formData.email || undefined,
      assignedCalendarId: formData.assignedCalendarId === "none" ? null : formData.assignedCalendarId,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
        {/* Back to Settings */}
        <div className="mb-4">
          <Link href="/settings">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Settings</span>
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <User className="h-8 w-8 text-primary" />
            My Profile
          </h1>
          <p className="text-gray-600 mt-2">Manage your personal profile and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tabs Navigation - Matching Calendar Settings Style */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("profile")}
                className={`${
                  activeTab === "profile"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => setActiveTab("personal")}
                className={`${
                  activeTab === "personal"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <Calendar className="h-4 w-4" />
                <span>Personal</span>
              </button>
              <button
                onClick={() => setActiveTab("address")}
                className={`${
                  activeTab === "address"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <MapPin className="h-4 w-4" />
                <span>Address</span>
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`${
                  activeTab === "notifications"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
              </button>
              <button
                onClick={() => setActiveTab("px")}
                className={`${
                  activeTab === "px"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <UserCheck className="h-4 w-4" />
                <span>HR</span>
              </button>
            </nav>
          </div>

          {/* Profile Tab */}
          <div className={activeTab === "profile" ? "space-y-6" : "hidden"}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Photo */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Photo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <Avatar className="w-32 h-32 border-2 border-gray-200">
                        <AvatarImage 
                          src={currentUser?.profileImagePath ? `/objects${currentUser.profileImagePath}` : undefined}
                          alt="Profile photo" 
                        />
                        <AvatarFallback className="text-2xl">
                          {currentUser ? `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}` : "JD"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={5242880} // 5MB
                        onGetUploadParameters={async () => {
                          const response = await apiRequest("POST", "/api/objects/upload", {
                            entityType: "staff",
                            entityId: currentUserId,
                            fileExtension: ".jpg"
                          });
                          const data = await response.json();
                          return { method: "PUT" as const, url: data.uploadURL };
                        }}
                        onComplete={async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
                          const uploadedFile = result.successful[0];
                          if (uploadedFile?.uploadURL) {
                            // Normalize the upload URL to get a persistent object path
                            const normalizeResponse = await apiRequest("PUT", "/api/profile-images", {
                              profileImageURL: uploadedFile.uploadURL as string
                            });
                            const { objectPath } = await normalizeResponse.json();
                            // Update staff record with normalized profile image path
                            updateStaffMutation.mutate({
                              profileImagePath: objectPath
                            });
                          }
                        }}
                        buttonClassName="mb-2"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Upload Photo
                      </ObjectUploader>
                      <p className="text-sm text-gray-500">
                        Recommended: 500x500px, PNG or JPG, max 5MB
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={currentUser?.firstName || ""}
                        readOnly
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">Edit in Staff Management to change</p>
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={currentUser?.lastName || ""}
                        readOnly
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">Edit in Staff Management to change</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter your email address"
                    />
                    <p className="text-xs text-gray-500 mt-1">This is your primary contact email</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={currentUser?.phone || ""}
                        readOnly
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">Edit in Staff Management to change</p>
                    </div>
                    <div>
                      <Label htmlFor="extension">Extension</Label>
                      <Input
                        id="extension"
                        value={formData.extension}
                        onChange={(e) => handleInputChange('extension', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>System Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="assignedCalendar">Assigned Calendar</Label>
                    <Select 
                      value={formData.assignedCalendarId} 
                      onValueChange={(value) => handleInputChange('assignedCalendarId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={calendarsLoading ? "Loading calendars..." : "Select a calendar"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No calendar assigned</SelectItem>
                        {calendars
                          .filter(calendar => calendar.isActive)
                          .map((calendar) => (
                            <SelectItem key={calendar.id} value={calendar.id}>
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: calendar.color }}
                                />
                                <span>{calendar.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({calendar.type})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 mt-1">
                      Select which calendar this staff member should be assigned to for appointments and scheduling
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Password Update */}
              <Card>
                <CardHeader>
                  <CardTitle>Password Update</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        value={formData.currentPassword}
                        onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                        placeholder="Enter current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          value={formData.newPassword}
                          onChange={(e) => handleInputChange('newPassword', e.target.value)}
                          placeholder="Enter new password"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          placeholder="Confirm new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    Password must be at least 8 characters long and include uppercase, lowercase, and numbers.
                  </p>
                  <div className="pt-2">
                    <Button
                      type="button"
                      onClick={handleChangePassword}
                      disabled={changePasswordMutation.isPending}
                      data-testid="button-change-password"
                    >
                      {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Linked Email Accounts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Linked Email Accounts
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Link multiple Gmail accounts to your profile. You can log in with any of your linked email addresses.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {linkedEmailsLoading ? (
                      <p className="text-sm text-muted-foreground">Loading linked accounts...</p>
                    ) : linkedEmails.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No linked email accounts found.</p>
                    ) : (
                      <div className="space-y-2">
                        {linkedEmails.map((linkedEmail) => (
                          <div key={linkedEmail.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{linkedEmail.email}</span>
                              {linkedEmail.isPrimary && (
                                <Badge variant="secondary">Primary</Badge>
                              )}
                              {linkedEmail.googleSub && (
                                <Badge variant="outline" className="text-primary border-primary">Google Verified</Badge>
                              )}
                            </div>
                            {!linkedEmail.isPrimary && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPrimaryEmailMutation.mutate(linkedEmail.id)}
                                  disabled={setPrimaryEmailMutation.isPending}
                                >
                                  Set as Primary
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => removeLinkedEmailMutation.mutate(linkedEmail.id)}
                                  disabled={removeLinkedEmailMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Link a New Gmail Account</p>
                        <p className="text-sm text-muted-foreground">
                          Add another Gmail address to log in with
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          window.location.href = `/api/link-gmail?staffId=${currentUserId}`;
                        }}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Link Gmail Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Email Signature */}
              <Card>
                <CardHeader>
                  <CardTitle>Email Signature</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signatureEnabled" className="text-sm font-medium">
                        Enable signature on all outgoing messages
                      </Label>
                      <Switch
                        id="signatureEnabled"
                        checked={signatureEnabled}
                        onCheckedChange={setSignatureEnabled}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label>Signature Content</Label>
                      <div className={!signatureEnabled ? 'opacity-50 pointer-events-none' : ''}>
                        <RichTextEditor
                          content={formData.signature}
                          onChange={(content) => handleInputChange('signature', content)}
                          placeholder="Enter your email signature..."
                        />
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-500">
                      This signature will be automatically added to all outgoing emails when enabled.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Fathom Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                    </svg>
                    Fathom Integration
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Connect your Fathom account to automatically link meeting recordings to tasks
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fathomApiKey">Fathom API Key</Label>
                      <Input
                        id="fathomApiKey"
                        type="password"
                        value={(currentUser as any)?.fathomApiKey || ""}
                        onChange={(e) => updateStaffMutation.mutate({ fathomApiKey: e.target.value })}
                        placeholder="Enter your Fathom API key"
                        data-testid="input-fathom-api-key"
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Get your API key from{" "}
                        <a 
                          href="https://fathom.video/settings/api" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Fathom Settings → API
                        </a>
                        . When you mark a calendar event as "Showed", we'll automatically fetch the recording link.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gmail Sync Connection */}
              <GmailConnectionCard />

              <div className="flex justify-end">
                <Button type="submit">
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Personal Information Tab */}
          <div className={activeTab === "personal" ? "space-y-6" : "hidden"}>
            <Form {...personalForm}>
              <form onSubmit={personalForm.handleSubmit((data) => updateStaffMutation.mutate(data))}>
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <p className="text-sm text-muted-foreground">Update your personal details</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={personalForm.control}
                        name="birthdate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Birthdate</FormLabel>
                            <Popover open={birthdateOpen} onOpenChange={setBirthdateOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(new Date(field.value + "T00:00:00"), "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value ? new Date(field.value + "T00:00:00") : undefined}
                                  onSelect={(date) => {
                                    field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                                    setBirthdateOpen(false);
                                  }}
                                  disabled={(date) => date > new Date()}
                                  captionLayout="dropdown-buttons"
                                  fromYear={1940}
                                  toYear={new Date().getFullYear()}
                                  defaultMonth={field.value ? new Date(field.value + "T00:00:00") : new Date(2000, 0)}
                                  classNames={{ caption_label: "hidden" }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={personalForm.control}
                        name="shirtSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Shirt Size</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-shirt-size">
                                  <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="S">S</SelectItem>
                                <SelectItem value="M">M</SelectItem>
                                <SelectItem value="L">L</SelectItem>
                                <SelectItem value="XL">XL</SelectItem>
                                <SelectItem value="2XL">2XL</SelectItem>
                                <SelectItem value="3XL">3XL</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="text-lg font-semibold mb-3">Emergency Contact</h4>
                      <div className="space-y-4">
                        <FormField
                          control={personalForm.control}
                          name="emergencyContactName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Emergency Contact Person Name</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Full name" 
                                  data-testid="input-emergency-contact-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={personalForm.control}
                          name="emergencyContactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Emergency Contact Phone Number</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="tel" 
                                  placeholder="(555) 123-4567" 
                                  data-testid="input-emergency-contact-phone"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={personalForm.control}
                          name="emergencyContactRelationship"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relationship with Emergency Contact</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="e.g., Spouse, Parent, Sibling" 
                                  data-testid="input-emergency-contact-relationship"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <Button type="submit" disabled={updateStaffMutation.isPending}>
                      {updateStaffMutation.isPending ? "Saving..." : "Save Personal Information"}
                    </Button>
                  </CardContent>
                </Card>
              </form>
            </Form>
          </div>

          {/* Address Tab */}
          <div className={activeTab === "address" ? "space-y-6" : "hidden"}>
            <Form {...addressForm}>
              <form onSubmit={addressForm.handleSubmit((data) => updateStaffMutation.mutate(data))}>
                <Card>
                  <CardHeader>
                    <CardTitle>Address Information</CardTitle>
                    <p className="text-sm text-muted-foreground">Update your address details</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={addressForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="123 Main Street" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={addressForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="City" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State/Province</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="State" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={addressForm.control}
                        name="zip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP/Postal Code</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="12345" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Country" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" disabled={updateStaffMutation.isPending}>
                      {updateStaffMutation.isPending ? "Saving..." : "Save Address Information"}
                    </Button>
                  </CardContent>
                </Card>
              </form>
            </Form>
          </div>

          {/* Notifications Tab */}
          <div className={activeTab === "notifications" ? "space-y-6" : "hidden"}>
            {currentUserId && <NotificationSettingsPanel userId={currentUserId} />}
          </div>

          {/* PX Tab */}
          <div className={activeTab === "px" ? "space-y-6" : "hidden"}>
            <Card>
              <CardHeader>
                <CardTitle>My Time Off Usage</CardTitle>
                <p className="text-sm text-muted-foreground">Your personal time off history and usage</p>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Filter time off requests for current user
                  const myTimeOffRequests = timeOffRequests.filter(request => request.staffId === currentUserId);

                  if (myTimeOffRequests.length === 0) {
                    return <p className="text-slate-500 text-center py-8">No time off requests found</p>;
                  }

                  // Calculate usage and remaining days
                  const usedDays = myTimeOffRequests.reduce((acc, request) => {
                    const days = request.totalDays || 0;
                    acc[request.type as 'vacation' | 'sick' | 'personal'] += days;
                    acc.total += days;
                    return acc;
                  }, { vacation: 0, sick: 0, personal: 0, total: 0 });

                  // Get current user's annual entitlements from policy or fallback to staff record or defaults
                  const currentPolicy = policies[0]; // Use the latest/active policy
                  const annualEntitlements = {
                    vacation: currentPolicy?.vacationDaysDefault ?? currentUser?.vacationDaysAnnually ?? 15,
                    sick: currentPolicy?.sickDaysDefault ?? currentUser?.sickDaysAnnually ?? 10, 
                    personal: currentPolicy?.personalDaysDefault ?? currentUser?.personalDaysAnnually ?? 3
                  };

                  // Calculate remaining days
                  const remainingDays = {
                    vacation: Math.max(0, annualEntitlements.vacation - usedDays.vacation),
                    sick: Math.max(0, annualEntitlements.sick - usedDays.sick),
                    personal: Math.max(0, annualEntitlements.personal - usedDays.personal),
                    total: Math.max(0, (annualEntitlements.vacation + annualEntitlements.sick + annualEntitlements.personal) - usedDays.total)
                  };

                  return (
                    <div className="space-y-6">
                      {/* Usage Summary */}
                      <div className={`grid grid-cols-1 gap-4 ${annualEntitlements.personal > 0 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">{remainingDays.vacation}</div>
                            <div className="text-sm text-slate-600">Vacation Days Left</div>
                            <div className="text-xs text-slate-500 mt-1">{usedDays.vacation} used of {annualEntitlements.vacation}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-orange-600">{remainingDays.sick}</div>
                            <div className="text-sm text-slate-600">Sick Days Left</div>
                            <div className="text-xs text-slate-500 mt-1">{usedDays.sick} used of {annualEntitlements.sick}</div>
                          </CardContent>
                        </Card>
                        {annualEntitlements.personal > 0 && (
                          <Card>
                            <CardContent className="p-4 text-center">
                              <div className="text-2xl font-bold text-green-600">{remainingDays.personal}</div>
                              <div className="text-sm text-slate-600">Personal Days Left</div>
                              <div className="text-xs text-slate-500 mt-1">{usedDays.personal} used of {annualEntitlements.personal}</div>
                            </CardContent>
                          </Card>
                        )}
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-slate-600">{remainingDays.total}</div>
                            <div className="text-sm text-slate-600">Total Days Left</div>
                            <div className="text-xs text-slate-500 mt-1">{usedDays.total} used of {annualEntitlements.vacation + annualEntitlements.sick + annualEntitlements.personal}</div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Recent Requests */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Recent Time Off Requests</h3>
                        <div className="space-y-3">
                          {myTimeOffRequests
                            .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
                            .slice(0, 5)
                            .map((request) => (
                            <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div>
                                <div className="font-medium">
                                  {request.type === 'vacation' ? 'Vacation' : 
                                   request.type === 'sick' ? 'Sick Leave' : 
                                   'Personal Time Off'}
                                </div>
                                <div className="text-sm text-slate-600">
                                  {request.startDate && request.endDate && 
                                    `${format(parseISO(request.startDate), 'M/d/yyyy')} - ${format(parseISO(request.endDate), 'M/d/yyyy')}`
                                  } • {request.totalDays} days
                                </div>
                                {request.reason && (
                                  <div className="text-xs text-slate-500 mt-1">{request.reason}</div>
                                )}
                              </div>
                              <div className="text-right">
                                {request.status === "pending" && (
                                  <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700">Pending</Badge>
                                )}
                                {request.status === "approved" && (
                                  <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">Approved</Badge>
                                )}
                                {request.status === "rejected" && (
                                  <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700">Rejected</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </Tabs>
      </div>
  );
}

// ---------------------------------------------------------------------------
// Gmail Sync — connect/disconnect/sync card. Renders inside the Profile tab.
// ---------------------------------------------------------------------------
function GmailConnectionCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  const startGmailConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch("/api/gmail/auth", { credentials: "include" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Server returned ${res.status}`);
      }
      const data = await res.json();
      if (!data?.authUrl) {
        throw new Error("Server did not return an authorization URL.");
      }
      // Redirect the browser to Google's consent screen. We do this *after*
      // the fetch so the OAuth nonce stays in the same session that initiated
      // the request (the /auth endpoint stores it in req.session before
      // returning the URL).
      window.location.href = data.authUrl;
    } catch (e: any) {
      setIsConnecting(false);
      toast({
        title: "Couldn't start Gmail connection",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const { data: status, isLoading } = useQuery<{
    connected: boolean;
    email?: string;
    syncEnabled?: boolean;
    lastSyncedAt?: string | null;
    lastSyncStatus?: string | null;
    lastSyncError?: string | null;
    emailsLogged?: number;
    emailsScanned?: number;
    initialSyncCompleted?: boolean;
  }>({
    queryKey: ["/api/gmail/status"],
    refetchInterval: 30_000,
  });

  // Surface ?gmail=connected and ?gmail=error from the OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("gmail");
    if (result === "connected") {
      toast({ title: "Gmail connected", description: "Background sync will begin within 2 minutes." });
      queryClient.invalidateQueries({ queryKey: ["/api/gmail/status"] });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (result === "error") {
      toast({
        title: "Gmail connection failed",
        description: params.get("message") || "Please try again.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [toast, queryClient]);

  const disconnect = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/gmail/disconnect"),
    onSuccess: () => {
      toast({ title: "Gmail disconnected" });
      queryClient.invalidateQueries({ queryKey: ["/api/gmail/status"] });
    },
    onError: (e: any) => toast({ title: "Disconnect failed", description: e?.message, variant: "destructive" }),
  });

  const syncNow = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/gmail/sync-now"),
    onSuccess: () => {
      toast({ title: "Sync started", description: "We'll process new mail in the background." });
      queryClient.invalidateQueries({ queryKey: ["/api/gmail/status"] });
    },
    onError: (e: any) => toast({ title: "Sync failed", description: e?.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Gmail Sync
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Authorize read-only access to your Gmail so AgencyBoost can automatically log emails against the right
          client. Only messages matching a known client domain or contact are stored.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : status?.connected ? (
          <div className="space-y-3" data-testid="gmail-connected-block">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Connected as {status.email}</p>
                <p className="text-sm text-muted-foreground">
                  {status.initialSyncCompleted ? "Initial sync complete." : "Initial 90-day sync in progress."}
                  {typeof status.emailsLogged === "number" && (
                    <> · {status.emailsLogged} logged / {status.emailsScanned} scanned</>
                  )}
                </p>
                {status.lastSyncedAt && (
                  <p className="text-xs text-muted-foreground">
                    Last synced: {new Date(status.lastSyncedAt).toLocaleString()}
                  </p>
                )}
                {status.lastSyncError && (
                  <p className="text-xs text-red-600">Last error: {status.lastSyncError}</p>
                )}
              </div>
              <Badge variant={status.lastSyncStatus === "failed" ? "destructive" : "default"}>
                {status.lastSyncStatus || "idle"}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => syncNow.mutate()}
                disabled={syncNow.isPending}
                data-testid="button-gmail-sync-now"
              >
                Sync now
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm("Disconnect Gmail? Existing logged emails will be retained, but new mail will not be synced.")) {
                    disconnect.mutate();
                  }
                }}
                disabled={disconnect.isPending}
                data-testid="button-gmail-disconnect"
              >
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            onClick={startGmailConnect}
            disabled={isConnecting}
            data-testid="button-gmail-connect"
          >
            <Mail className="w-4 h-4 mr-2" />
            {isConnecting ? "Redirecting to Google…" : "Connect Gmail"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}