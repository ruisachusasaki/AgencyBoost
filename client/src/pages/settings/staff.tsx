import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Plus, Search, Edit, Trash2, User, Upload, Phone, Mail, Users, ChevronUp, ChevronDown, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Staff, InsertStaff, Role } from "@shared/schema";

// Removed hardcoded userTypes - now using dynamic roles from API

const staffFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  roleId: z.string().min(1, "Role is required"),
  position: z.string().optional(),
});

type StaffFormData = z.infer<typeof staffFormSchema>;

type SortField = 'name' | 'email' | 'phone' | 'role';
type SortOrder = 'asc' | 'desc';

export default function Staff() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const form = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      roleId: "",
    }
  });
  
  // Fetch staff with real-time search
  const { data: staffMembers = [], isLoading } = useQuery<Staff[]>({
    queryKey: ["/api/staff", searchTerm],
    queryFn: async () => {
      const url = `/api/staff${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch staff');
      return response.json();
    },
  });

  // Fetch available roles for the dropdown
  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  // Create staff mutation
  const createStaffMutation = useMutation({
    mutationFn: async (data: StaffFormData) => {
      // When creating staff, we need to assign them to the role they selected
      const staffResponse = await apiRequest("POST", "/api/staff", data);
      
      // Also assign the role in the user_roles table
      if (data.roleId && staffResponse.id) {
        await apiRequest("POST", `/api/users/${staffResponse.id}/roles`, {
          roleId: data.roleId,
          assignedBy: "system" // TODO: Replace with current user ID
        });
      }
      
      return staffResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success", 
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
      const response = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error('Failed to delete staff member');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({ title: "Success", description: "Staff member deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete staff member"
      });
    }
  });

  const onSubmit = (data: StaffFormData) => {
    createStaffMutation.mutate(data);
  };

  const handleDeleteStaff = async (staffId: string, staffName: string) => {
    if (!confirm(`Are you sure you want to delete ${staffName}?`)) return;
    deleteStaffMutation.mutate(staffId);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedStaffMembers = [...staffMembers].sort((a, b) => {
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
                        <FormLabel>First Name</FormLabel>
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
                        <FormLabel>Last Name</FormLabel>
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
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Marketing Director, Account Manager" />
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
                      <FormLabel>Role</FormLabel>
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
                              <div className="flex flex-col">
                                <span className="font-medium">{role.name}</span>
                                <span className="text-xs text-muted-foreground">{role.description}</span>
                              </div>
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
                          {searchTerm ? "No staff members found" : "No staff members yet"}
                        </p>
                        {!searchTerm && (
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
                  sortedStaffMembers.map((staff) => (
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}