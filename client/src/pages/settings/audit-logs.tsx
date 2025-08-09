import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollText, Search, Filter, User, Calendar, Activity } from "lucide-react";
import type { AuditLog } from "@shared/schema";

interface AuditLogDisplay extends AuditLog {
  userName: string;
}

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");
  const [filterUser, setFilterUser] = useState("all");
  
  // Fetch audit logs from API
  const { data: auditLogs = [], isLoading } = useQuery<AuditLogDisplay[]>({
    queryKey: ["/api/audit-logs"],
  });

  // Mock user data for display (in real app, fetch from users API)
  const [mockUsers] = useState<Record<string, string>>({
    "user-1": "John Doe",
    "user-2": "Jane Smith", 
    "user-3": "Mike Johnson",
  });

  // Transform audit logs to include user names
  const auditLogsWithUserNames = auditLogs.map(log => ({
    ...log,
    userName: mockUsers[log.userId] || "Unknown User",
    timestamp: new Date(log.timestamp).toLocaleString(),
  }));

  // For the mock data while we build out the system
  const [mockAuditLogs] = useState<AuditLogDisplay[]>([
    {
      id: "1",
      action: "created",
      entityType: "contact",
      entityId: "client-1",
      entityName: "Sarah Johnson",
      userId: "user-1",
      userName: "John Doe",
      timestamp: "2024-08-07 14:30:15",
      details: "New contact record created with email: sarah@techstartup.com",
      ipAddress: "192.168.1.100"
    },
    {
      id: "2", 
      action: "updated",
      entityType: "contact",
      entityId: "client-1",
      entityName: "Sarah Johnson",
      userId: "user-2",
      userName: "Jane Smith",
      timestamp: "2024-08-07 11:45:22",
      details: "Updated phone number from (555) 123-0000 to (555) 123-4567",
      ipAddress: "192.168.1.105"
    },
    {
      id: "3",
      action: "created",
      entityType: "project",
      entityId: "proj-1",
      entityName: "Website Redesign",
      userId: "user-1",
      userName: "John Doe", 
      timestamp: "2024-08-07 09:15:33",
      details: "New project created for client Sarah Johnson with budget $15,000",
      ipAddress: "192.168.1.100"
    },
    {
      id: "4",
      action: "deleted",
      entityType: "contact",
      entityId: "client-5",
      entityName: "Old Contact",
      userId: "user-1",
      userName: "John Doe",
      timestamp: "2024-08-06 16:20:45",
      details: "Contact record permanently deleted - duplicate entry",
      ipAddress: "192.168.1.100"
    },
    {
      id: "5",
      action: "updated",
      entityType: "campaign",
      entityId: "camp-1",
      entityName: "Summer Promotion",
      userId: "user-3",
      userName: "Mike Johnson",
      timestamp: "2024-08-06 13:30:12",
      details: "Campaign status changed from Draft to Active",
      ipAddress: "192.168.1.110"
    },
    {
      id: "6",
      action: "created",
      entityType: "task",
      entityId: "task-1",
      entityName: "Content Review",
      userId: "user-2",
      userName: "Jane Smith",
      timestamp: "2024-08-06 10:45:18",
      details: "Task assigned to Mike Johnson with due date 2024-08-10",
      ipAddress: "192.168.1.105"
    }
  ]);

  const actions = ["created", "updated", "deleted"];
  const entityTypes = ["contact", "project", "campaign", "task", "invoice"];
  const users = ["John Doe", "Jane Smith", "Mike Johnson"];

  // Use real data if available, otherwise show mock data
  const displayLogs = auditLogsWithUserNames.length > 0 ? auditLogsWithUserNames : mockAuditLogs;
  
  const filteredLogs = displayLogs.filter(log => {
    const matchesSearch = 
      log.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesAction = filterAction === "all" || log.action === filterAction;
    const matchesEntity = filterEntity === "all" || log.entityType === filterEntity; 
    const matchesUser = filterUser === "all" || log.userName === filterUser;
    
    return matchesSearch && matchesAction && matchesEntity && matchesUser;
  });

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "created": return "bg-green-100 text-green-800 border-green-200";
      case "updated": return "bg-blue-100 text-blue-800 border-blue-200"; 
      case "deleted": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case "contact": return "👤";
      case "project": return "📁";
      case "campaign": return "📢";
      case "task": return "✓";
      case "invoice": return "📄";
      default: return "📝";
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ScrollText className="h-8 w-8 text-primary" />
            Audit Logs
          </h1>
          <p className="text-gray-600 mt-2">Track all system activity and changes</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search logs..."
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="action">Action</Label>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {actions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="entity">Entity Type</Label>
                <Select value={filterEntity} onValueChange={setFilterEntity}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {entityTypes.map((entity) => (
                      <SelectItem key={entity} value={entity}>
                        {entity.charAt(0).toUpperCase() + entity.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="user">User</Label>
                <Select value={filterUser} onValueChange={setFilterUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user} value={user}>
                        {user}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {/* Loading State */}
        {isLoading ? (
          <Card className="mb-6">
            <CardContent className="p-12 text-center">
              <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading audit logs...</h3>
              <p className="text-gray-500">Please wait while we fetch the audit trail.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Activity className="h-8 w-8 text-primary mr-3" />
                    <div>
                      <div className="text-2xl font-bold">{displayLogs.length}</div>
                      <div className="text-sm text-gray-600">Total Activities</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-green-600 font-bold">+</span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{displayLogs.filter(l => l.action === 'created').length}</div>
                      <div className="text-sm text-gray-600">Created</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-bold">~</span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{displayLogs.filter(l => l.action === 'updated').length}</div>
                      <div className="text-sm text-gray-600">Updated</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-red-600 font-bold">-</span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{displayLogs.filter(l => l.action === 'deleted').length}</div>
                      <div className="text-sm text-gray-600">Deleted</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Audit Log Entries */}
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="text-2xl">{getEntityIcon(log.entityType)}</div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className={getActionBadgeColor(log.action)}>
                          {log.action.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-medium">{log.entityType}</span>
                        <span className="text-sm text-gray-500">→</span>
                        <span className="text-sm font-semibold text-gray-900">{log.entityName}</span>
                      </div>
                      
                      <p className="text-gray-700 mb-2">{log.details}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {log.userName}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {log.timestamp}
                        </div>
                        <div>IP: {log.ipAddress}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredLogs.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <ScrollText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
              <p className="text-gray-500">Try adjusting your search criteria or filters.</p>
            </CardContent>
          </Card>
        )}

        {/* Admin Note */}
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <ScrollText className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm text-red-800">
                <strong>Admin Only:</strong> Audit logs are only visible to system administrators and track all critical system changes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}