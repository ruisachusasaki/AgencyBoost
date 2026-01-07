import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Plus, Search, Edit, Trash2, User, Upload, Phone, Mail, Users, ChevronUp, ChevronDown, ArrowLeft, Building2, UserCheck, Settings, UsersIcon, Info, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { FormLabelWithTooltip } from "@/components/ui/form-label-with-tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Staff, InsertStaff, Role, Department, InsertDepartment, Position, InsertPosition } from "@shared/schema";

// Removed hardcoded userTypes - now using dynamic roles from API

const staffFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  roleId: z.string().min(1, "Role is required"),
  department: z.string().optional(),
  position: z.string().optional(),
});

const teamFormSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional(),
});

type StaffFormData = z.infer<typeof staffFormSchema>;
type TeamFormData = z.infer<typeof teamFormSchema>;

type SortField = 'name' | 'email' | 'phone' | 'role';
type SortOrder = 'asc' | 'desc';

export default function Staff() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("staff");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddTeamDialogOpen, setIsAddTeamDialogOpen] = useState(false);
  const [isTeamSettingsDialogOpen, setIsTeamSettingsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<{ id: string; name: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Debounce search term to prevent rapid API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const form = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      roleId: "",
      department: "",
      position: "",
    }
  });

  // Clear position when department changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'department') {
        form.setValue('position', '');
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const teamForm = useForm<TeamFormData>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
      description: "",
    }
  });
  
  // Fetch staff with debounced search
  const { data: staffMembers = [], isLoading } = useQuery<Staff[]>({
    queryKey: ["/api/staff", debouncedSearchTerm],
    queryFn: async () => {
      const url = `/api/staff${debouncedSearchTerm ? `?search=${encodeURIComponent(debouncedSearchTerm)}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch staff');
      return response.json();
    },
  });

  // Fetch available roles for the dropdown
  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  // Set default roleId to "User" role when roles are loaded and dialog opens
  useEffect(() => {
    if (isAddDialogOpen && roles.length > 0 && !form.getValues('roleId')) {
      const userRole = roles.find(role => role.name === 'User');
      if (userRole) {
        form.setValue('roleId', userRole.id);
      }
    }
  }, [isAddDialogOpen, roles, form]);

  // Fetch departments (teams) and positions
  const { data: departments = [], isLoading: departmentsLoading } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const { data: positions = [], isLoading: positionsLoading } = useQuery<Position[]>({
    queryKey: ['/api/positions'],
  });

  // Get selected department for position filtering
  const selectedDepartment = form.watch('department');
  const selectedDeptObj = departments.find(dept => dept.name === selectedDepartment);

  // Fetch positions for selected department
  const { data: departmentPositions = [] } = useQuery<Position[]>({
    queryKey: ['/api/departments', selectedDeptObj?.id, 'positions'],
    queryFn: () => fetch(`/api/departments/${selectedDeptObj?.id}/positions`).then(res => res.json()),
    enabled: !!selectedDeptObj?.id,
  });

  // Create staff mutation
  const createStaffMutation = useMutation({
    mutationFn: async (data: StaffFormData) => {
      // Map department field to the correct column name
      const staffData = {
        ...data,
        department: data.department, // This maps to the department varchar column
      };
      
      // When creating staff, we need to assign them to the role they selected
      const staffResponse = await apiRequest("POST", "/api/staff", staffData);
      
      // Also assign the role in the user_roles table
      const createdStaff = await staffResponse.json();
      if (data.roleId && createdStaff?.id) {
        try {
          await apiRequest("POST", `/api/users/${createdStaff.id}/roles`, {
            roleId: data.roleId,
            assignedBy: "system" // TODO: Replace with current user ID
          });
        } catch (error) {
          console.warn('Role assignment failed:', error);
          // Don't fail the whole operation if role assignment fails
        }
      }
      
      return createdStaff;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        variant: "success", 
        description: "Staff member created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create staff member"
      });
    }
  });

  // Delete staff mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/staff/${id}`, { 
        method: "DELETE",
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete staff member (${response.status})`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setStaffToDelete(null);
      toast({ title: "Success", description: "Staff member deleted successfully" });
    },
    onError: (error: any) => {
      setStaffToDelete(null);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete staff member"
      });
    }
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (data: TeamFormData) => {
      return apiRequest("POST", "/api/departments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setIsAddTeamDialogOpen(false);
      teamForm.reset();
      toast({
        title: "Success",
        variant: "success",
        description: "Team created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create team"
      });
    }
  });

  const onSubmit = (data: StaffFormData) => {
    createStaffMutation.mutate(data);
  };

  const onTeamSubmit = (data: TeamFormData) => {
    createTeamMutation.mutate(data);
  };

  const handleDeleteStaff = (staffId: string, staffName: string) => {
    setStaffToDelete({ id: staffId, name: staffName });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteStaff = () => {
    if (staffToDelete) {
      deleteStaffMutation.mutate(staffToDelete.id);
      setDeleteDialogOpen(false);
      setStaffToDelete(null);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedStaffMembers = useMemo(() => {
    return [...staffMembers].sort((a, b) => {
      let aValue = '';
      let bValue = '';

      switch (sortField) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'phone':
          aValue = a.phone || '';
          bValue = b.phone || '';
          break;
        case 'role':
          // Get role name from our roles data
          const aRole = roles.find(r => r.id === a.roleId);
          const bRole = roles.find(r => r.id === b.roleId);
          aValue = aRole?.name?.toLowerCase() || '';
          bValue = bRole?.name?.toLowerCase() || '';
          break;
      }

      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  }, [staffMembers, sortField, sortOrder, roles]);

  // Paginated staff members
  const paginatedStaffMembers = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return sortedStaffMembers.slice(start, end);
  }, [sortedStaffMembers, page, pageSize]);

  const totalPages = Math.ceil(sortedStaffMembers.length / pageSize);

  // Reset to last valid page when data changes
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [sortedStaffMembers.length, pageSize, totalPages, page]);

  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return "—";
    
    // Remove all non-numeric characters
    const numbers = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for 10-digit numbers
    if (numbers.length === 10) {
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    }
    
    // Return original if not 10 digits
    return phone;
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center justify-between">
        {children}
        <div className="flex flex-col ml-2">
          <ChevronUp 
            className={`h-3 w-3 ${
              sortField === field && sortOrder === 'asc' 
                ? 'text-primary' 
                : 'text-muted-foreground/40'
            }`} 
          />
          <ChevronDown 
            className={`h-3 w-3 -mt-1 ${
              sortField === field && sortOrder === 'desc' 
                ? 'text-primary' 
                : 'text-muted-foreground/40'
            }`} 
          />
        </div>
      </div>
    </TableHead>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading staff members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back to Settings */}
      <div className="mb-4">
        <Link href="/settings">
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Settings</span>
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          Staff Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your team members and their access levels
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "staff", name: "Staff Members", icon: UserCheck, count: staffMembers.length },
            { id: "teams", name: "Teams", icon: Building2, count: 0 },
            { id: "capacity", name: "Capacity Settings", icon: Settings, count: 0 }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name} {tab.count > 0 && `(${tab.count})`}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "staff" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Staff Member</DialogTitle>
                  <DialogDescription>
                    Create a new staff member account with basic information.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabelWithTooltip tooltip="Staff member's legal first name">
                          First Name
                        </FormLabelWithTooltip>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabelWithTooltip tooltip="Staff member's legal last name">
                          Last Name
                        </FormLabelWithTooltip>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team/Department</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team/department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectedDepartment && selectedDepartment !== '' ? (
                            departmentPositions.map((pos) => (
                              <SelectItem key={pos.id} value={pos.name}>
                                {pos.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-department-selected" disabled>
                              Please select a team/department first
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="roleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabelWithTooltip tooltip="Software access and permissions level">
                        Role (Software Permissions)
                      </FormLabelWithTooltip>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createStaffMutation.isPending}>
                    {createStaffMutation.isPending ? "Creating..." : "Create Staff Member"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Directory</CardTitle>
          <CardDescription>
            Search and manage all staff members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search staff members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Staff Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader field="name">Staff Member</SortableHeader>
                  <SortableHeader field="email">Email</SortableHeader>
                  <SortableHeader field="phone">Phone</SortableHeader>
                  <SortableHeader field="role">Role</SortableHeader>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      <div className="flex flex-col items-center space-y-2">
                        <User className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {debouncedSearchTerm ? "No staff members found" : "No staff members yet"}
                        </p>
                        {!debouncedSearchTerm && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAddDialogOpen(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Staff Member
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedStaffMembers.map((staff) => (
                    <TableRow key={staff.id}>
                      {/* Profile Image + Name */}
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage
                              src={staff.profileImagePath ? `/objects${staff.profileImagePath}` : undefined}
                            />
                            <AvatarFallback>
                              {staff.firstName.charAt(0)}{staff.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {staff.firstName} {staff.lastName}
                            </div>
                            {staff.department && (
                              <div className="text-sm text-muted-foreground">
                                {staff.department}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Email */}
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{staff.email}</span>
                        </div>
                      </TableCell>

                      {/* Phone */}
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{formatPhoneNumber(staff.phone || "")}</span>
                        </div>
                      </TableCell>

                      {/* Role */}
                      <TableCell>
                        {(() => {
                          const role = roles.find(r => r.id === staff.roleId);
                          return role ? (
                            <Badge variant={role.name === "Admin" ? "default" : "secondary"}>
                              {role.name}
                            </Badge>
                          ) : (
                            <Badge variant="outline">No Role</Badge>
                          );
                        })()}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link href={`/settings/staff/${staff.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteStaff(staff.id, `${staff.firstName} ${staff.lastName}`)}
                            disabled={deleteStaffMutation.isPending}
                            data-testid={`button-delete-staff-${staff.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Show:</span>
                  <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setPage(1); }}>
                    <SelectTrigger className="w-20" data-testid="select-staff-page-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">entries</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    data-testid="button-staff-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          data-testid={`button-staff-page-${pageNum}`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    data-testid="button-staff-next-page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "teams" && (
        <div className="space-y-6">
          {/* Header with action buttons */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Teams Overview</h2>
              <p className="text-sm text-muted-foreground">
                Manage teams and their positions
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setIsTeamSettingsDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Team Settings
              </Button>
              <Button 
                onClick={() => setIsAddTeamDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Team
              </Button>
            </div>
          </div>

          {/* Teams Grid */}
          {departmentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : departments.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Teams Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first team to organize your staff members
                  </p>
                  <Button 
                    onClick={() => setIsAddTeamDialogOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create First Team
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((department) => {
                const teamPositions = positions.filter(p => p.departmentId === department.id);
                const staffCount = staffMembers.filter(s => s.department === department.name).length;
                
                return (
                  <Link key={department.id} href={`/settings/teams/${department.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-md">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{department.name}</h3>
                              {department.description && (
                                <p className="text-sm text-muted-foreground">
                                  {department.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Staff Members</span>
                            <span className="font-medium">{staffCount}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Positions</span>
                            <span className="font-medium">{teamPositions.length}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Add Team Dialog */}
          <Dialog open={isAddTeamDialogOpen} onOpenChange={setIsAddTeamDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>
                  Add a new team to organize your staff members
                </DialogDescription>
              </DialogHeader>
              <Form {...teamForm}>
                <form onSubmit={teamForm.handleSubmit(onTeamSubmit)} className="space-y-4">
                  <FormField
                    control={teamForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabelWithTooltip tooltip="Create a new team or department for organizing your staff members">
                          Team Name
                        </FormLabelWithTooltip>
                        <FormControl>
                          <Input placeholder="e.g. Marketing, Sales, Development" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={teamForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabelWithTooltip tooltip="A brief description explaining this team's purpose and responsibilities">
                          Description
                        </FormLabelWithTooltip>
                        <FormControl>
                          <Input placeholder="Brief description of this team" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddTeamDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createTeamMutation.isPending}>
                      {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Team Settings Dialog */}
          <Dialog open={isTeamSettingsDialogOpen} onOpenChange={setIsTeamSettingsDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Team Settings</DialogTitle>
                <DialogDescription>
                  Manage positions across all teams
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Positions</h3>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Position
                  </Button>
                </div>
                {positionsLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-10 bg-muted rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : positions.length === 0 ? (
                  <div className="text-center py-8">
                    <UsersIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No positions created yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {positions.map((position) => {
                      const department = departments.find(d => d.id === position.departmentId);
                      return (
                        <div key={position.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div>
                            <div className="font-medium">{position.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {department?.name} • {position.description}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsTeamSettingsDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {activeTab === "capacity" && (
        <CapacitySettingsTab />
      )}
    </div>
  );
}

// Capacity Settings Tab Component
function CapacitySettingsTab() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<any | null>(null);

  // Fetch capacity settings
  const { data: capacitySettings = [], isLoading } = useQuery({
    queryKey: ['/api/capacity-settings'],
  });

  // Fetch departments for dropdown
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  // Fetch staff for notification recipients
  const { data: allStaff = [] } = useQuery<any[]>({
    queryKey: ['/api/staff'],
  });

  const capacityFormSchema = z.object({
    department: z.string().min(1, "Department is required"),
    role: z.string().optional(),
    maxClientsPerStaff: z.number().min(1, "Must be at least 1").max(100, "Max 100 clients per staff"),
    alertThreshold: z.number().min(0, "Must be at least 0").max(100, "Must be at most 100"),
    notifyUserIds: z.array(z.string()).optional(),
    notificationMessage: z.string().optional(),
    isActive: z.boolean().default(true),
  });

  type CapacityFormData = z.infer<typeof capacityFormSchema>;

  const form = useForm<CapacityFormData>({
    resolver: zodResolver(capacityFormSchema),
    defaultValues: {
      department: "",
      role: "",
      maxClientsPerStaff: 10,
      alertThreshold: 80,
      notifyUserIds: [],
      notificationMessage: "",
      isActive: true,
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CapacityFormData) => {
      const res = await apiRequest('POST', '/api/capacity-settings', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/capacity-settings'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        variant: "success",
        description: "Capacity setting created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create capacity setting",
        variant: "destructive",
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CapacityFormData> }) => {
      const res = await apiRequest('PATCH', `/api/capacity-settings/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/capacity-settings'] });
      setIsAddDialogOpen(false);
      setEditingSetting(null);
      form.reset();
      toast({
        title: "Success",
        variant: "success",
        description: "Capacity setting updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update capacity setting",
        variant: "destructive",
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/capacity-settings/${id}`, undefined);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/capacity-settings'] });
      toast({
        title: "Success",
        variant: "success",
        description: "Capacity setting deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete capacity setting",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: CapacityFormData) => {
    if (editingSetting) {
      updateMutation.mutate({ id: editingSetting.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (setting: any) => {
    setEditingSetting(setting);
    form.reset({
      department: setting.department,
      role: setting.role || "",
      maxClientsPerStaff: setting.maxClientsPerStaff,
      alertThreshold: parseFloat(setting.alertThreshold),
      notifyUserIds: setting.notifyUserIds || [],
      notificationMessage: setting.notificationMessage || "",
      isActive: setting.isActive,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string, department: string) => {
    if (window.confirm(`Are you sure you want to delete the capacity setting for ${department}?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Capacity Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure team capacity limits for predictive hiring alerts
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingSetting(null);
            form.reset();
            setIsAddDialogOpen(true);
          }}
          className="flex items-center gap-2"
          data-testid="button-add-capacity-setting"
        >
          <Plus className="h-4 w-4" />
          Add Capacity Setting
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-100 p-2">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Predictive Hiring Alerts</h3>
              <p className="text-sm text-blue-800">
                AgencyBoost uses your pipeline data to predict when teams will reach capacity and need additional staff. 
                Configure maximum clients per staff member and alert thresholds for each department.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacity Settings List */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : capacitySettings.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Capacity Settings</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first capacity setting to enable predictive hiring alerts
              </p>
              <Button 
                onClick={() => {
                  setEditingSetting(null);
                  form.reset();
                  setIsAddDialogOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create First Setting
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {capacitySettings.map((setting: any) => (
                <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">{setting.department}</h4>
                        {setting.role && (
                          <Badge variant="outline">{setting.role}</Badge>
                        )}
                        {!setting.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Max Clients/Staff:</span> {setting.maxClientsPerStaff}
                      </div>
                      <div>
                        <span className="font-medium">Alert Threshold:</span> {setting.alertThreshold}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(setting)}
                      data-testid={`button-edit-${setting.id}`}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(setting.id, setting.department)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${setting.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) {
          setEditingSetting(null);
          form.reset();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSetting ? 'Edit' : 'Add'} Capacity Setting</DialogTitle>
            <DialogDescription>
              Configure maximum client load and alert thresholds for a department
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-department">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept: Department) => (
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
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Account Manager" {...field} data-testid="input-role" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxClientsPerStaff"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Clients per Staff *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        max="100"
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-max-clients"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Maximum number of clients each staff member can handle
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alertThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alert Threshold (%) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        max="100"
                        step="0.1"
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        data-testid="input-alert-threshold"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Alert managers when capacity reaches this percentage
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notifyUserIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notify Specific Users (Optional)</FormLabel>
                    <FormDescription className="text-xs">
                      Select specific users to notify. If none selected, all managers and admins will be notified.
                    </FormDescription>
                    <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto space-y-2">
                      {allStaff.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-2">No staff members available</p>
                      ) : (
                        allStaff.map((staff: any) => (
                          <div key={staff.id} className="flex items-center space-x-2">
                            <Checkbox
                              checked={field.value?.includes(staff.id)}
                              onCheckedChange={(checked) => {
                                const currentValue = field.value || [];
                                if (checked) {
                                  field.onChange([...currentValue, staff.id]);
                                } else {
                                  field.onChange(currentValue.filter((id: string) => id !== staff.id));
                                }
                              }}
                              data-testid={`checkbox-staff-${staff.id}`}
                            />
                            <label className="text-sm cursor-pointer flex-1">
                              {staff.firstName} {staff.lastName}
                              {staff.email && (
                                <span className="text-muted-foreground ml-2">({staff.email})</span>
                              )}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notificationMessage"
                render={({ field }) => {
                  const mergeTagsForCapacityAlert = [
                    { tag: '{department}', description: 'Department name' },
                    { tag: '{role}', description: 'Role/position name' },
                    { tag: '{capacity_percentage}', description: 'Projected capacity %' },
                    { tag: '{current_clients}', description: 'Current client count' },
                    { tag: '{predicted_clients}', description: 'Predicted new clients' },
                    { tag: '{max_capacity}', description: 'Maximum capacity' },
                  ];

                  const insertMergeTag = (tag: string, textareaElement: HTMLTextAreaElement | null) => {
                    if (!textareaElement) return;

                    const start = textareaElement.selectionStart;
                    const end = textareaElement.selectionEnd;
                    const currentValue = field.value || '';
                    
                    const newValue = currentValue.substring(0, start) + tag + currentValue.substring(end);
                    field.onChange(newValue);
                    
                    // Set cursor position after inserted tag
                    setTimeout(() => {
                      textareaElement.focus();
                      textareaElement.setSelectionRange(start + tag.length, start + tag.length);
                    }, 0);
                  };

                  return (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Custom Notification Message (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              className="h-7 text-xs"
                              data-testid="button-merge-tags"
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              Merge Tags
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80" align="end">
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Available Merge Tags</h4>
                              <p className="text-xs text-muted-foreground">Click a tag to insert it into your message</p>
                              <div className="space-y-1 max-h-60 overflow-y-auto">
                                {mergeTagsForCapacityAlert.map(({ tag, description }) => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => {
                                      const textarea = document.querySelector('[data-testid="input-notification-message"]') as HTMLTextAreaElement;
                                      insertMergeTag(tag, textarea);
                                    }}
                                    className="w-full text-left px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                                    data-testid={`merge-tag-${tag.replace(/[{}]/g, '')}`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
                                        {tag}
                                      </code>
                                      <span className="text-xs text-muted-foreground flex-1">
                                        {description}
                                      </span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="Your {department} team is approaching capacity..."
                          rows={4}
                          {...field}
                          data-testid="input-notification-message"
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        Create a custom alert message using merge tags for dynamic content
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingSetting(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-capacity-setting"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : (editingSetting ? "Update" : "Create")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Staff Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {staffToDelete?.name}? This action will deactivate the staff member and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStaffToDelete(null)}>Cancel</AlertDialogCancel>
            <Button 
              onClick={confirmDeleteStaff}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-staff"
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}