import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { HeadphonesIcon, Plus, Edit, Trash2, Users, Flag, Clock, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface Department {
  id: string;
  name: string;
  description: string;
  members: string[];
  ticketCount: number;
}

interface Priority {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface TicketStatus {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
  isClosed: boolean;
}

export default function Support() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"departments" | "priorities" | "statuses">("departments");
  const [isAddDeptDialogOpen, setIsAddDeptDialogOpen] = useState(false);
  const [isAddPriorityDialogOpen, setIsAddPriorityDialogOpen] = useState(false);
  const [isAddStatusDialogOpen, setIsAddStatusDialogOpen] = useState(false);
  
  // Mock data
  const [departments] = useState<Department[]>([
    { id: "1", name: "Technical Support", description: "Handle technical issues and bugs", members: ["John Doe", "Jane Smith"], ticketCount: 15 },
    { id: "2", name: "Sales Support", description: "Assist with sales inquiries and demos", members: ["Mike Johnson"], ticketCount: 8 },
    { id: "3", name: "Billing", description: "Handle billing and payment issues", members: ["Sarah Wilson"], ticketCount: 5 }
  ]);
  
  const [priorities] = useState<Priority[]>([
    { id: "1", name: "Critical", color: "red", order: 1 },
    { id: "2", name: "High", color: "orange", order: 2 },
    { id: "3", name: "Medium", color: "yellow", order: 3 },
    { id: "4", name: "Low", color: "green", order: 4 }
  ]);
  
  const [ticketStatuses] = useState<TicketStatus[]>([
    { id: "1", name: "New", color: "blue", isDefault: true, isClosed: false },
    { id: "2", name: "In Progress", color: "yellow", isDefault: false, isClosed: false },
    { id: "3", name: "Waiting for Customer", color: "purple", isDefault: false, isClosed: false },
    { id: "4", name: "Resolved", color: "green", isDefault: false, isClosed: true },
    { id: "5", name: "Closed", color: "gray", isDefault: false, isClosed: true }
  ]);

  const [newDepartment, setNewDepartment] = useState({
    name: "",
    description: "",
    members: [] as string[]
  });

  const [newPriority, setNewPriority] = useState({
    name: "",
    color: "blue"
  });

  const [newStatus, setNewStatus] = useState({
    name: "",
    color: "blue",
    isDefault: false,
    isClosed: false
  });

  const staffMembers = ["John Doe", "Jane Smith", "Mike Johnson", "Sarah Wilson"];
  const colors = ["red", "orange", "yellow", "green", "blue", "purple", "gray"];

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Implement API call
      toast({ title: "Success", description: "Department created successfully." });
      setIsAddDeptDialogOpen(false);
      setNewDepartment({ name: "", description: "", members: [] });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create department.", variant: "destructive" });
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      red: "bg-red-100 text-red-800 border-red-200",
      orange: "bg-orange-100 text-orange-800 border-orange-200",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
      green: "bg-green-100 text-green-800 border-green-200",
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      gray: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return colorMap[color] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <HeadphonesIcon className="h-8 w-8 text-primary" />
                Support Settings
              </h1>
              <p className="text-gray-600 mt-2">Configure support departments and ticketing system</p>
            </div>
            <Link href="/settings">
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Settings</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "departments", name: "Departments", icon: Users },
              { id: "priorities", name: "Priorities", icon: Flag },
              { id: "statuses", name: "Statuses", icon: Clock }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Departments Tab */}
        {activeTab === "departments" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Support Departments</h2>
              <Dialog open={isAddDeptDialogOpen} onOpenChange={setIsAddDeptDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Department
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Department</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddDepartment} className="space-y-4">
                    <div>
                      <Label htmlFor="deptName">Department Name *</Label>
                      <Input
                        id="deptName"
                        value={newDepartment.name}
                        onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="deptDesc">Description</Label>
                      <Textarea
                        id="deptDesc"
                        value={newDepartment.description}
                        onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddDeptDialogOpen(false)}>Cancel</Button>
                      <Button type="submit">Create Department</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {departments.map((dept) => (
                <Card key={dept.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{dept.name}</h3>
                          <Badge>{dept.ticketCount} tickets</Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{dept.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {dept.members.length} members: {dept.members.join(", ")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Priorities Tab */}
        {activeTab === "priorities" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Ticket Priorities</h2>
              <Dialog open={isAddPriorityDialogOpen} onOpenChange={setIsAddPriorityDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Priority
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Priority Level</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4">
                    <div>
                      <Label htmlFor="priorityName">Priority Name *</Label>
                      <Input
                        id="priorityName"
                        value={newPriority.name}
                        onChange={(e) => setNewPriority({...newPriority, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label>Color</Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {colors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewPriority({...newPriority, color})}
                            className={`p-2 rounded border-2 ${newPriority.color === color ? 'ring-2 ring-primary' : ''} ${getColorClasses(color)}`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddPriorityDialogOpen(false)}>Cancel</Button>
                      <Button type="submit">Create Priority</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-3">
              {priorities.map((priority) => (
                <Card key={priority.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`px-3 py-1 rounded border ${getColorClasses(priority.color)}`}>
                          {priority.name}
                        </div>
                        <span className="text-sm text-gray-500">Order: {priority.order}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Statuses Tab */}
        {activeTab === "statuses" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Ticket Statuses</h2>
              <Dialog open={isAddStatusDialogOpen} onOpenChange={setIsAddStatusDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Status
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Ticket Status</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4">
                    <div>
                      <Label htmlFor="statusName">Status Name *</Label>
                      <Input
                        id="statusName"
                        value={newStatus.name}
                        onChange={(e) => setNewStatus({...newStatus, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label>Color</Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {colors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewStatus({...newStatus, color})}
                            className={`p-2 rounded border-2 ${newStatus.color === color ? 'ring-2 ring-primary' : ''} ${getColorClasses(color)}`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddStatusDialogOpen(false)}>Cancel</Button>
                      <Button type="submit">Create Status</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-3">
              {ticketStatuses.map((status) => (
                <Card key={status.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`px-3 py-1 rounded border ${getColorClasses(status.color)}`}>
                          {status.name}
                        </div>
                        <div className="flex space-x-2">
                          {status.isDefault && <Badge variant="secondary">Default</Badge>}
                          {status.isClosed && <Badge variant="outline">Closed Status</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Coming Soon Note */}
        <Card className="mt-8 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <HeadphonesIcon className="h-5 w-5 text-blue-600 mr-2" />
              <p className="text-sm text-blue-800">
                <strong>Coming Soon:</strong> Full ticketing system integration is in development. These settings will be used when the ticketing module is released.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}