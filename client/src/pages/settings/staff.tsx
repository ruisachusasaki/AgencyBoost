import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Edit, Trash2, Shield, Mail, Phone, Search } from "lucide-react";

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  extension: string;
  role: string;
  status: "active" | "inactive";
  lastLogin: string;
  createdAt: string;
}

export default function Staff() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Mock staff data - replace with actual API call
  const [staffMembers] = useState<StaffMember[]>([
    {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      email: "john@agencyflow.com",
      phone: "(555) 123-4567",
      extension: "101",
      role: "Admin",
      status: "active",
      lastLogin: "2024-08-07 14:30",
      createdAt: "2024-01-15"
    },
    {
      id: "2",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@agencyflow.com",
      phone: "(555) 123-4568",
      extension: "102",
      role: "Manager",
      status: "active",
      lastLogin: "2024-08-07 09:15",
      createdAt: "2024-02-01"
    },
    {
      id: "3",
      firstName: "Mike",
      lastName: "Johnson",
      email: "mike@agencyflow.com",
      phone: "(555) 123-4569",
      extension: "103",
      role: "User",
      status: "inactive",
      lastLogin: "2024-08-05 16:45",
      createdAt: "2024-03-10"
    }
  ]);

  const [newStaff, setNewStaff] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    extension: "",
    password: "",
    role: "User"
  });

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // TODO: Implement API call to add staff
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Success",
        description: "Staff member added successfully.",
      });
      
      setIsAddDialogOpen(false);
      setNewStaff({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        extension: "",
        password: "",
        role: "User"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add staff member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setIsEditDialogOpen(true);
  };

  const handleEditStaff = async () => {
    if (!selectedStaff) return;
    
    setIsLoading(true);
    try {
      // TODO: Implement API call to update staff member
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Success",
        description: "Staff member updated successfully.",
      });
      
      setIsEditDialogOpen(false);
      setSelectedStaff(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update staff member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStaff = staffMembers.filter(staff => 
    `${staff.firstName} ${staff.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;
    
    try {
      // TODO: Implement API call to delete staff
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Success",
        description: "Staff member deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete staff member. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              Staff Management
            </h1>
            <p className="text-gray-600 mt-2">Manage team members and user accounts</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search staff members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddStaff} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={newStaff.firstName}
                      onChange={(e) => setNewStaff({...newStaff, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={newStaff.lastName}
                      onChange={(e) => setNewStaff({...newStaff, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                    required
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={newStaff.phone}
                      onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="extension">Extension</Label>
                    <Input
                      id="extension"
                      value={newStaff.extension}
                      onChange={(e) => setNewStaff({...newStaff, extension: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="role">Role & Permissions</Label>
                  <Select value={newStaff.role} onValueChange={(value) => setNewStaff({...newStaff, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="User">User</SelectItem>
                      <SelectItem value="Accounting">Accounting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Adding..." : "Add Staff Member"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Edit Staff Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Staff Member</DialogTitle>
            </DialogHeader>
            {selectedStaff && (
              <form onSubmit={(e) => {
                e.preventDefault();
                handleEditStaff();
              }} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editFirstName">First Name *</Label>
                    <Input
                      id="editFirstName"
                      value={selectedStaff.firstName}
                      onChange={(e) => setSelectedStaff({...selectedStaff, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editLastName">Last Name *</Label>
                    <Input
                      id="editLastName"
                      value={selectedStaff.lastName}
                      onChange={(e) => setSelectedStaff({...selectedStaff, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="editEmail">Email Address *</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={selectedStaff.email}
                    onChange={(e) => setSelectedStaff({...selectedStaff, email: e.target.value})}
                    required
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editPhone">Phone Number</Label>
                    <Input
                      id="editPhone"
                      value={selectedStaff.phone}
                      onChange={(e) => setSelectedStaff({...selectedStaff, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editExtension">Extension</Label>
                    <Input
                      id="editExtension"
                      value={selectedStaff.extension}
                      onChange={(e) => setSelectedStaff({...selectedStaff, extension: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="editRole">Role & Permissions</Label>
                  <Select value={selectedStaff.role} onValueChange={(value) => setSelectedStaff({...selectedStaff, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="User">User</SelectItem>
                      <SelectItem value="Accounting">Accounting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="editStatus">Status</Label>
                  <Select value={selectedStaff.status} onValueChange={(value) => setSelectedStaff({...selectedStaff, status: value as "active" | "inactive"})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Updating..." : "Update Staff Member"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Staff List */}
        <div className="grid gap-4">
          {filteredStaff.map((staff) => (
            <Card key={staff.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {staff.firstName} {staff.lastName}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          {staff.email}
                        </div>
                        {staff.phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            {staff.phone} {staff.extension && `ext. ${staff.extension}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge variant={staff.status === 'active' ? 'default' : 'secondary'}>
                      {staff.status}
                    </Badge>
                    <Badge variant="outline" className="flex items-center">
                      <Shield className="h-3 w-3 mr-1" />
                      {staff.role}
                    </Badge>
                    
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(staff)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStaff(staff.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 text-sm text-gray-500">
                  Last login: {staff.lastLogin} • Member since: {staff.createdAt}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Note for Admin Only */}
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-amber-600 mr-2" />
              <p className="text-sm text-amber-800">
                <strong>Admin Only:</strong> This section is only visible to CRM administrators.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}