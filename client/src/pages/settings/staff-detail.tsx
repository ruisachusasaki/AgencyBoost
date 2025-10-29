import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Upload, User, Mail, Phone, MapPin, Calendar, Building, Users, Bell, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { Staff, InsertStaff, Role, NotificationSettings, InsertNotificationSettings, Department, Position } from "@shared/schema";

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
      queryClient.invalidateQueries({ queryKey: ["/api/staff", id] });
      setIsEditing(false);
      toast({
        title: "Success",
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
    // Convert "none" back to null for managerId and department
    const submitData = {
      ...data,
      managerId: data.managerId === "none" ? null : (data.managerId || null),
      department: data.department === "none" ? null : (data.department || null)
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
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
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
                            {/* Show the current position even if it's not in the loaded positions yet */}
                            {field.value && field.value !== "none" && !departmentPositions.find(p => p.name === field.value) && (
                              <SelectItem key="current" value={field.value}>
                                {field.value} (current)
                              </SelectItem>
                            )}
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
                      <FormItem>
                        <FormLabelWithTooltip tooltip="The date when this staff member was officially hired">
                          Hire Date
                        </FormLabelWithTooltip>
                        <FormControl>
                          <Input {...field} type="date" disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="birthdate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birthdate</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

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

              {/* Notification Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>Notification Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Client Assignment */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Client Assignment</h4>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="client-assigned-app" />
                          <Label htmlFor="client-assigned-app" className="text-xs">In-App</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="client-assigned-email" />
                          <Label htmlFor="client-assigned-email" className="text-xs">Email</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="client-assigned-sms" />
                          <Label htmlFor="client-assigned-sms" className="text-xs">SMS</Label>
                        </div>
                      </div>
                    </div>

                    {/* Internal Chat Added */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Added to Chat</h4>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="chat-added-app" />
                          <Label htmlFor="chat-added-app" className="text-xs">In-App</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="chat-added-email" />
                          <Label htmlFor="chat-added-email" className="text-xs">Email</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="chat-added-sms" />
                          <Label htmlFor="chat-added-sms" className="text-xs">SMS</Label>
                        </div>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">All Chat Messages</h4>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="chat-messages-app" />
                          <Label htmlFor="chat-messages-app" className="text-xs">In-App</Label>
                        </div>
                        <div className="flex items-center space-x-2 opacity-50">
                          <Checkbox id="chat-messages-email" disabled />
                          <Label htmlFor="chat-messages-email" className="text-xs text-muted-foreground">Email</Label>
                        </div>
                        <div className="flex items-center space-x-2 opacity-50">
                          <Checkbox id="chat-messages-sms" disabled />
                          <Label htmlFor="chat-messages-sms" className="text-xs text-muted-foreground">SMS</Label>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Web only</p>
                    </div>

                    {/* Mentions */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Mentions</h4>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="mentioned-app" />
                          <Label htmlFor="mentioned-app" className="text-xs">In-App</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="mentioned-email" />
                          <Label htmlFor="mentioned-email" className="text-xs">Email</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="mentioned-sms" />
                          <Label htmlFor="mentioned-sms" className="text-xs">SMS</Label>
                        </div>
                      </div>
                    </div>

                    {/* Mention Follow-ups */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Mention Follow-ups</h4>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="mention-followup-app" />
                          <Label htmlFor="mention-followup-app" className="text-xs">In-App</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="mention-followup-email" />
                          <Label htmlFor="mention-followup-email" className="text-xs">Email</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="mention-followup-sms" />
                          <Label htmlFor="mention-followup-sms" className="text-xs">SMS</Label>
                        </div>
                      </div>
                    </div>

                    {/* Task Assignment */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Task Assignment</h4>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="task-assigned-app" />
                          <Label htmlFor="task-assigned-app" className="text-xs">In-App</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="task-assigned-email" />
                          <Label htmlFor="task-assigned-email" className="text-xs">Email</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="task-assigned-sms" />
                          <Label htmlFor="task-assigned-sms" className="text-xs">SMS</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}