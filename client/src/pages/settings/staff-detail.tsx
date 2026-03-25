import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Upload, User, Mail, Phone, MapPin, Calendar, CalendarIcon, Building, Users, Bell, Smartphone, Trash2, Plus, Link2, DollarSign, History, TrendingUp, TrendingDown, ClipboardList, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormLabelWithTooltip } from "@/components/ui/form-label-with-tooltip";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Staff, InsertStaff, Role, NotificationSettings, InsertNotificationSettings, Department, Position, StaffLinkedEmail } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import NotificationSettingsPanel from "@/components/settings/NotificationSettingsPanel";
import StaffOnboardingHistory from "@/components/onboarding/StaffOnboardingHistory";

const userTypes = [
  "Admin",
  "User",
  "Manager",
  "Viewer"
];

const staffFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  roleId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  hireDate: z.string().optional(),
  startDate: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  managerId: z.string().nullable().optional(),
  birthdate: z.string().optional(),
});

type StaffFormData = z.infer<typeof staffFormSchema>;

export default function StaffDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [hireDateOpen, setHireDateOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [showSpawnConfirm, setShowSpawnConfirm] = useState(false);
  const [birthdateOpen, setBirthdateOpen] = useState(false);

  // Handle URL query parameters for Gmail linking feedback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    const error = urlParams.get('error');
    
    if (message === 'email_linked_successfully') {
      toast({
        title: "Success",
        variant: "default",
        description: "Gmail account linked successfully! You can now login with this email.",
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (message === 'email_already_linked') {
      toast({
        title: "Info",
        description: "This Gmail is already linked to your account.",
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error === 'email_linked_to_other_account') {
      toast({
        title: "Error",
        description: "This Gmail is already linked to a different staff account.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error === 'google_account_linked_to_other_staff') {
      toast({
        title: "Error",
        description: "This Google account is already linked to another staff member.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error === 'link_failed') {
      toast({
        title: "Error",
        description: urlParams.get('details') || "Failed to link Gmail account. Please try again.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast]);

  const { data: staffMember, isLoading } = useQuery<Staff>({
    queryKey: [`/api/staff/${id}`],
    enabled: !!id
  });

  const { data: allStaff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"]
  });

  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ["/api/roles"]
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"]
  });

  const { data: notificationSettings } = useQuery<NotificationSettings>({
    queryKey: ["/api/notification-settings", id],
    enabled: !!id
  });

  // Linked emails query
  const { data: linkedEmails = [], isLoading: isLoadingEmails } = useQuery<StaffLinkedEmail[]>({
    queryKey: ["/api/staff", id, "linked-emails"],
    queryFn: async () => {
      const res = await fetch(`/api/staff/${id}/linked-emails`, { credentials: 'include' });
      if (!res.ok) {
        throw new Error("Failed to fetch linked emails");
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!id
  });

  const { data: adminStatus } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/auth/is-admin"],
  });
  const isAdmin = adminStatus?.isAdmin === true;

  const { data: onboardingStatus } = useQuery<{ hasActiveInstance: boolean }>({
    queryKey: ["/api/staff", id, "onboarding-status"],
    queryFn: async () => {
      const res = await fetch(`/api/staff/${id}/onboarding-status`, { credentials: "include" });
      return res.json();
    },
    enabled: !!id && isAdmin,
  });

  const spawnOnboardingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/staff/${id}/spawn-onboarding`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to spawn onboarding");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff", id, "onboarding-status"] });
      setShowSpawnConfirm(false);
      toast({ title: "Onboarding checklist created successfully" });
    },
    onError: (error: any) => {
      setShowSpawnConfirm(false);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  interface SalaryData {
    staffId: string;
    annualSalary: string | null;
    hourlyRate: string | null;
  }
  interface SalaryHistoryEntry {
    id: string;
    previousSalary: string | null;
    newSalary: string | null;
    effectiveDate: string;
    notes: string | null;
    changedBy: string | null;
    changedByName: string;
    createdAt: string;
  }
  const { data: salaryData, isLoading: isSalaryLoading } = useQuery<SalaryData | null>({
    queryKey: ["/api/staff", id, "salary"],
    queryFn: async () => {
      const res = await fetch(`/api/staff/${id}/salary`, { credentials: 'include' });
      if (res.status === 403 || res.status === 401) return null;
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!id && isAdmin,
  });

  const { data: salaryHistoryData } = useQuery<SalaryHistoryEntry[]>({
    queryKey: ["/api/staff", id, "salary-history"],
    queryFn: async () => {
      const res = await fetch(`/api/staff/${id}/salary-history`, { credentials: 'include' });
      if (res.status === 403 || res.status === 401) return [];
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!id && isAdmin,
  });

  const [salaryInput, setSalaryInput] = useState("");
  const [salaryNotes, setSalaryNotes] = useState("");
  const [isSalaryEditing, setIsSalaryEditing] = useState(false);
  const [showSalaryHistory, setShowSalaryHistory] = useState(false);

  useEffect(() => {
    if (salaryData?.annualSalary) {
      setSalaryInput(salaryData.annualSalary);
    }
  }, [salaryData]);

  const updateSalaryMutation = useMutation({
    mutationFn: async (data: { salary: string | null; notes: string }) => {
      return apiRequest("PUT", `/api/staff/${id}/salary`, { annualSalary: data.salary, notes: data.notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff", id, "salary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff", id, "salary-history"] });
      toast({ title: "Success", variant: "default", description: "Salary updated successfully" });
      setIsSalaryEditing(false);
      setSalaryNotes("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update salary", variant: "destructive" });
    },
  });

  // Delete linked email mutation
  const deleteLinkedEmailMutation = useMutation({
    mutationFn: async (emailId: string) => {
      const response = await apiRequest("DELETE", `/api/staff/${id}/linked-emails/${emailId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff", id, "linked-emails"] });
      toast({
        title: "Success",
        variant: "default",
        description: "Email unlinked successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unlink email",
        variant: "destructive",
      });
    },
  });

  // Set email as primary mutation
  const setPrimaryEmailMutation = useMutation({
    mutationFn: async (emailId: string) => {
      const response = await apiRequest("PATCH", `/api/staff/${id}/linked-emails/${emailId}/set-primary`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff", id, "linked-emails"] });
      queryClient.invalidateQueries({ queryKey: [`/api/staff/${id}`] });
      toast({
        title: "Success",
        variant: "default",
        description: "Primary email updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set primary email",
        variant: "destructive",
      });
    },
  });

  const form = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      roleId: "none",
      address: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      hireDate: "",
      startDate: "",
      department: "",
      managerId: "none",
      birthdate: "",
    }
  });

  // Watch the department field to fetch positions when it changes
  const selectedDepartment = form.watch("department");
  
  // Find the selected department to get its ID
  const selectedDeptObj = departments.find(dept => dept.name === selectedDepartment);
  
  // Fetch positions for the selected department
  const { data: departmentPositions = [] } = useQuery<Position[]>({
    queryKey: ["/api/departments", selectedDeptObj?.id, "positions"],
    queryFn: () => fetch(`/api/departments/${selectedDeptObj?.id}/positions`).then(res => res.json()),
    enabled: !!selectedDeptObj?.id && selectedDepartment !== "none",
  });

  // Update form values when staff member changes
  useEffect(() => {
    if (staffMember) {
      form.reset({
        firstName: staffMember.firstName,
        lastName: staffMember.lastName,
        email: staffMember.email,
        phone: staffMember.phone || "",
        roleId: staffMember.roleId || "none",
        address: staffMember.address || "",
        city: staffMember.city || "",
        state: staffMember.state || "",
        zip: staffMember.zip || "",
        country: staffMember.country || "",
        hireDate: staffMember.hireDate ? new Date(staffMember.hireDate).toISOString().split('T')[0] : "",
        startDate: staffMember.startDate ? new Date(staffMember.startDate).toISOString().split('T')[0] : "",
        department: staffMember.department || "none",
        position: staffMember.position || "",
        managerId: staffMember.managerId || "none",
        birthdate: staffMember.birthdate ? new Date(staffMember.birthdate).toISOString().split('T')[0] : "",
      });
    }
  }, [staffMember, form]);

  // Only clear position when actively changing departments during editing
  const [previousDepartment, setPreviousDepartment] = useState<string>("");
  
  useEffect(() => {
    if (isEditing && previousDepartment && previousDepartment !== selectedDepartment) {
      // Only clear when user actively changes department during editing
      console.log("Department changed during editing, clearing position");
      form.setValue("position", "");
    }
    setPreviousDepartment(selectedDepartment || "");
  }, [selectedDepartment, isEditing, form, previousDepartment]);

  const updateMutation = useMutation({
    mutationFn: async (data: StaffFormData) => {
      const response = await apiRequest("PUT", `/api/staff/${id}`, data);
      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      queryClient.invalidateQueries({ queryKey: [`/api/staff/${id}`] });
      setIsEditing(false);
      toast({
        title: "Success",
        variant: "default",
        description: "Staff member updated successfully",
      });
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast({
        title: "Error",
        description: "Failed to update staff member",
        variant: "destructive",
      });
    },
  });

  // Send password reset email mutation
  const sendPasswordResetMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/send-password-reset", { staffId: id });
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        variant: "default",
        description: data.message || "Password reset email sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email",
        variant: "destructive",
      });
    },
  });

  const handleProfileImageUpload = async () => {
    try {
      const response = await apiRequest("POST", "/api/objects/upload", {
        entityType: "staff",
        entityId: id,
        fileExtension: ".jpg"
      });
      const data = await response.json();
      return {
        method: "PUT" as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error("Upload URL error:", error);
      toast({
        title: "Error",
        description: "Failed to get upload URL",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUploadComplete = async (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL;
      try {
        console.log("Sending profile image URL:", uploadURL);
        const response = await apiRequest("PUT", "/api/profile-images", { profileImageURL: uploadURL });
        const data = await response.json();
        console.log("Profile image response:", data);
        
        // Update the staff member directly with the new profile image path
        const staffUpdateData = {
          ...form.getValues(),
          profileImagePath: data.objectPath,
          managerId: form.getValues().managerId === "none" ? null : (form.getValues().managerId || null)
        };
        console.log("Updating staff with:", staffUpdateData);
        updateMutation.mutate(staffUpdateData);
        
        toast({
          title: "Success",
          variant: "default", 
          description: "Profile image updated successfully",
        });
      } catch (error) {
        console.error("Profile image update error:", error);
        toast({
          title: "Error",
          description: "Failed to update profile image",
          variant: "destructive",
        });
      }
    }
  };

  const onSubmit = (data: StaffFormData) => {
    console.log("Form data before processing:", data);
    // Convert "none" back to null for managerId, department, and roleId
    const submitData = {
      ...data,
      roleId: data.roleId === "none" ? null : (data.roleId || null),
      managerId: data.managerId === "none" ? null : (data.managerId || null),
      department: data.department === "none" ? null : (data.department || null),
    };
    console.log("Submit data after processing:", submitData);
    updateMutation.mutate(submitData as any);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading staff member...</p>
        </div>
      </div>
    );
  }

  if (!staffMember) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Staff Member Not Found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            The requested staff member could not be found.
          </p>
          <Link href="/settings/staff">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Staff
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const managerOptions = allStaff.filter(member => member.id !== staffMember.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/settings/staff">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Staff
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={staffMember.profileImagePath ? `/objects${staffMember.profileImagePath}` : undefined} 
              />
              <AvatarFallback>
                {(staffMember.firstName || '').charAt(0) || 'U'}{(staffMember.lastName || '').charAt(0) || 'S'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                {staffMember.firstName} {staffMember.lastName}
              </h1>
              <p className="text-muted-foreground text-sm">{staffMember.email}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <>
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
            <Button 
              variant="outline"
              onClick={() => sendPasswordResetMutation.mutate()}
              disabled={sendPasswordResetMutation.isPending}
              data-testid="button-send-password-reset"
            >
              {sendPasswordResetMutation.isPending ? "Sending..." : "Send Password Reset Email"}
            </Button>
            </>
          ) : (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button 
                onClick={form.handleSubmit(onSubmit)}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Image Card */}
        <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Profile Image</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <Avatar className="h-32 w-32">
                  <AvatarImage 
                    src={staffMember.profileImagePath ? `/objects${staffMember.profileImagePath}` : undefined} 
                  />
                  <AvatarFallback className="text-2xl">
                    {(staffMember.firstName || '').charAt(0) || 'U'}{(staffMember.lastName || '').charAt(0) || 'S'}
                  </AvatarFallback>
                </Avatar>
              </div>
              {isEditing && (
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5242880} // 5MB
                  onGetUploadParameters={handleProfileImageUpload}
                  onComplete={handleUploadComplete}
                  buttonClassName="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New Image
                </ObjectUploader>
              )}
            </CardContent>
          </Card>

        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Basic Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabelWithTooltip tooltip="The staff member's legal first name">
                          First Name
                        </FormLabelWithTooltip>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabelWithTooltip tooltip="The staff member's legal last name">
                          Last Name
                        </FormLabelWithTooltip>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="roleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabelWithTooltip tooltip="Assign a role to control what features and data this staff member can access">
                          Role & Permissions
                        </FormLabelWithTooltip>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={!isEditing}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Role Assigned</SelectItem>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Work Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>Work Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabelWithTooltip tooltip="Select which team/department this staff member belongs to">
                          Department
                        </FormLabelWithTooltip>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={!isEditing}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Department</SelectItem>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.name}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => {
                      return (
                      <FormItem>
                        <FormLabelWithTooltip tooltip="Choose a position from the selected department, or select a department first">
                          Position
                        </FormLabelWithTooltip>
                        <Select
                          value={field.value === "" ? "none" : (field.value || "none")}
                          onValueChange={(value) => {
                            // Only process onChange if user is actively editing
                            if (isEditing) {
                              field.onChange(value === "none" ? "" : value);
                            }
                          }}
                          disabled={!isEditing || !selectedDeptObj || selectedDepartment === "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={
                                !selectedDeptObj || selectedDepartment === "none" 
                                  ? "Select a department first" 
                                  : "Select position"
                              } />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Position</SelectItem>
                            {departmentPositions.map((position) => (
                              <SelectItem key={position.id} value={position.name}>
                                {position.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="managerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabelWithTooltip tooltip="Choose who this staff member reports to for management hierarchy">
                          Manager
                        </FormLabelWithTooltip>
                        <Select
                          value={field.value || undefined}
                          onValueChange={field.onChange}
                          disabled={!isEditing}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select manager" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Manager</SelectItem>
                            {managerOptions.map((manager) => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.firstName} {manager.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hireDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabelWithTooltip tooltip="The date when this staff member was officially hired">
                          Hire Date
                        </FormLabelWithTooltip>
                        <Popover open={hireDateOpen} onOpenChange={setHireDateOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                disabled={!isEditing}
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
                                setHireDateOpen(false);
                              }}
                              disabled={(date) => date > new Date()}
                              captionLayout="dropdown-buttons"
                              fromYear={2000}
                              toYear={new Date().getFullYear()}
                              defaultMonth={field.value ? new Date(field.value + "T00:00:00") : new Date()}
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
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabelWithTooltip tooltip="Start Date = the date they physically begin working.">
                          Start Date
                        </FormLabelWithTooltip>
                        <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                disabled={!isEditing}
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
                                setStartDateOpen(false);
                              }}
                              captionLayout="dropdown-buttons"
                              fromYear={2000}
                              toYear={new Date().getFullYear()}
                              defaultMonth={field.value ? new Date(field.value + "T00:00:00") : new Date()}
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
                    control={form.control}
                    name="birthdate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Birthdate</FormLabel>
                        <Popover open={birthdateOpen} onOpenChange={setBirthdateOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                disabled={!isEditing}
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
                </CardContent>
                {isAdmin && onboardingStatus && !onboardingStatus.hasActiveInstance && (
                  <div className="px-6 pb-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-[hsl(179,100%,39%)] text-[hsl(179,100%,39%)] hover:bg-[hsl(179,100%,39%)]/10"
                      onClick={() => setShowSpawnConfirm(true)}
                      disabled={spawnOnboardingMutation.isPending}
                    >
                      {spawnOnboardingMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ClipboardList className="h-4 w-4 mr-2" />
                      )}
                      Spawn Onboarding Checklist
                    </Button>
                  </div>
                )}
              </Card>

              <AlertDialog open={showSpawnConfirm} onOpenChange={setShowSpawnConfirm}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Spawn Onboarding Checklist</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will create a new onboarding checklist for {staffMember?.firstName} {staffMember?.lastName} based on their current position and department. Continue?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-[hsl(179,100%,39%)] hover:bg-[hsl(179,100%,33%)] text-white"
                      onClick={() => spawnOnboardingMutation.mutate()}
                    >
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Compensation - Admin only, hierarchy-restricted */}
              {isAdmin && salaryData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5" />
                      <span>Compensation</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium mb-1.5 block">Annual Salary</Label>
                        {isSalaryEditing ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={salaryInput}
                                  onChange={(e) => setSalaryInput(e.target.value)}
                                  placeholder="0.00"
                                  className="pl-7"
                                  data-testid="input-annual-salary"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1 block">Notes (optional)</Label>
                              <Input
                                type="text"
                                value={salaryNotes}
                                onChange={(e) => setSalaryNotes(e.target.value)}
                                placeholder="e.g., Annual review raise, promotion, etc."
                                className="text-sm"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => updateSalaryMutation.mutate({ salary: salaryInput || null, notes: salaryNotes })}
                                disabled={updateSalaryMutation.isPending}
                              >
                                {updateSalaryMutation.isPending ? "Saving..." : "Save"}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setIsSalaryEditing(false);
                                  setSalaryInput(salaryData?.annualSalary || "");
                                  setSalaryNotes("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-base">
                              {salaryData.annualSalary
                                ? `$${parseFloat(salaryData.annualSalary).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : "Not set"}
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setIsSalaryEditing(true)}
                              className="h-7 px-2 text-xs"
                            >
                              {salaryData.annualSalary ? "Edit" : "Add"}
                            </Button>
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-1.5 block">Hourly Rate</Label>
                        <span className="text-base text-muted-foreground">
                          {salaryData.hourlyRate
                            ? `$${parseFloat(salaryData.hourlyRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / hr`
                            : "—"}
                        </span>
                        {salaryData.annualSalary && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Based on 2,080 working hours/year (52 weeks x 40 hrs)
                          </p>
                        )}
                      </div>
                    </div>

                    {salaryHistoryData && salaryHistoryData.length > 0 && (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-medium flex items-center gap-1.5">
                            <History className="h-4 w-4" />
                            Compensation History
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setShowSalaryHistory(!showSalaryHistory)}
                          >
                            {showSalaryHistory ? "Hide" : `Show (${salaryHistoryData.length})`}
                          </Button>
                        </div>
                        {showSalaryHistory && (
                          <div className="space-y-2">
                            {salaryHistoryData.map((entry) => {
                              const prevAmt = entry.previousSalary ? parseFloat(entry.previousSalary) : null;
                              const newAmt = entry.newSalary ? parseFloat(entry.newSalary) : null;
                              const isIncrease = prevAmt !== null && newAmt !== null && newAmt > prevAmt;
                              const isDecrease = prevAmt !== null && newAmt !== null && newAmt < prevAmt;
                              const diff = prevAmt !== null && newAmt !== null ? newAmt - prevAmt : null;
                              return (
                                <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-sm">
                                  <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                    isIncrease ? 'bg-green-100 dark:bg-green-900/30' :
                                    isDecrease ? 'bg-red-100 dark:bg-red-900/30' :
                                    'bg-gray-100 dark:bg-gray-700'
                                  }`}>
                                    {isIncrease ? (
                                      <TrendingUp className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                    ) : isDecrease ? (
                                      <TrendingDown className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                    ) : (
                                      <DollarSign className="w-3.5 h-3.5 text-gray-500" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                      <span className="text-muted-foreground">
                                        {prevAmt !== null ? `$${prevAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Not set'}
                                      </span>
                                      <span className="text-muted-foreground">→</span>
                                      <span className="font-medium">
                                        {newAmt !== null ? `$${newAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Removed'}
                                      </span>
                                      {diff !== null && diff !== 0 && (
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                                          isIncrease ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                          {isIncrease ? '+' : ''}{diff.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                                      <span>{new Date(entry.effectiveDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                      <span>by {entry.changedByName}</span>
                                    </div>
                                    {entry.notes && (
                                      <p className="mt-1 text-xs text-muted-foreground italic">"{entry.notes}"</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Address Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Calendar Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Calendar Configuration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                    <p>Calendar integration settings will be available here once the calendar system is implemented.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Linked Email Accounts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Link2 className="h-5 w-5" />
                    <span>Linked Email Accounts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Link multiple Gmail accounts to allow login with any of them. All linked emails will authenticate to this same staff account.
                    </p>
                    
                    {isLoadingEmails ? (
                      <div className="text-sm text-muted-foreground">Loading...</div>
                    ) : linkedEmails.length === 0 ? (
                      <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                        No linked emails found. The primary email will be linked automatically on first Google login.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {linkedEmails.map((linkedEmail) => (
                          <div key={linkedEmail.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{linkedEmail.email}</span>
                              {linkedEmail.isPrimary && (
                                <Badge variant="secondary" className="text-xs">Primary</Badge>
                              )}
                              {linkedEmail.googleSub && (
                                <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                                  Google Verified
                                </Badge>
                              )}
                            </div>
                            {!linkedEmail.isPrimary && (
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPrimaryEmailMutation.mutate(linkedEmail.id)}
                                  disabled={setPrimaryEmailMutation.isPending}
                                >
                                  Set as Primary
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteLinkedEmailMutation.mutate(linkedEmail.id)}
                                  disabled={deleteLinkedEmailMutation.isPending}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.location.href = '/api/link-gmail'}
                        className="flex items-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Link Gmail Account</span>
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        This will redirect you to Google to verify and link the new email address.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>Notification Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {id && (
                    <NotificationSettingsPanel 
                      userId={id} 
                      isEditing={isEditing}
                      showSaveButton={true}
                      onSaveSuccess={() => {
                        // Refresh staff data after notification settings change
                        queryClient.invalidateQueries({ queryKey: [`/api/staff/${id}`] });
                        queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </form>
          </Form>

          {isAdmin && id && (
            <StaffOnboardingHistory staffId={id} />
          )}
        </div>
      </div>
    </div>
  );
}