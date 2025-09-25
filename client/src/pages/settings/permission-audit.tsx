import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Shield, ShieldAlert, ShieldCheck, Eye, Search, Filter, Calendar, ArrowLeft, Activity } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

interface PermissionAuditLog {
  id: string;
  auditType: string;
  roleId: string | null;
  roleName: string | null;
  targetUserId: string | null;
  targetUserName: string | null;
  moduleAffected: string | null;
  changesSummary: string;
  changesCount: number;
  performedBy: string;
  performedByName: string;
  riskLevel: string;
  isElevatedPermission: boolean;
  timestamp: string;
}

interface PermissionAuditResponse {
  logs: PermissionAuditLog[];
  total: number;
}

const riskLevelColors = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

const riskLevelIcons = {
  low: ShieldCheck,
  medium: Shield,
  high: ShieldAlert,
  critical: AlertTriangle,
};

const auditTypeLabels = {
  role_created: "Role Created",
  role_updated: "Role Updated",
  role_deleted: "Role Deleted",
  role_assigned: "Role Assigned",
  role_unassigned: "Role Unassigned",
  permission_changed: "Permission Changed",
};

export default function PermissionAudit() {
  const [filters, setFilters] = useState({
    auditType: "all",
    riskLevel: "all",
    search: "",
    limit: 50,
    offset: 0,
  });

  const { data, isLoading, refetch } = useQuery<PermissionAuditResponse>({
    queryKey: ['/api/permission-audit-logs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.auditType && filters.auditType !== 'all') params.append('auditType', filters.auditType);
      if (filters.riskLevel && filters.riskLevel !== 'all') params.append('riskLevel', filters.riskLevel);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());

      const response = await fetch(`/api/permission-audit-logs?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch permission audit logs');
      }
      return response.json();
    },
  });

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: key !== 'offset' ? 0 : (typeof value === 'number' ? value : 0) // Reset pagination when other filters change
    }));
  };

  const clearFilters = () => {
    setFilters({
      auditType: "all",
      riskLevel: "all",
      search: "",
      limit: 50,
      offset: 0,
    });
  };

  const getRiskIcon = (riskLevel: string) => {
    const Icon = riskLevelIcons[riskLevel as keyof typeof riskLevelIcons] || Shield;
    return <Icon className="h-4 w-4" />;
  };

  const filteredLogs = data?.logs?.filter(log => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      log.changesSummary.toLowerCase().includes(searchLower) ||
      log.roleName?.toLowerCase().includes(searchLower) ||
      log.targetUserName?.toLowerCase().includes(searchLower) ||
      log.performedByName.toLowerCase().includes(searchLower)
    );
  }) || [];

  return (
    <div className="space-y-6">
      {/* Back to Settings Button */}
      <div className="flex items-center space-x-2">
        <Link href="/settings">
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Settings</span>
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
          <Activity className="h-8 w-8 text-primary" />
          <span>Permission Audit Trail</span>
        </h1>
        <p className="text-muted-foreground">
          Comprehensive tracking of all permission changes and role assignments
        </p>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Audit Logs</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Changes</CardTitle>
            <ShieldAlert className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {filteredLogs.filter(log => log.riskLevel === 'high' || log.riskLevel === 'critical').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Role Assignments</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {filteredLogs.filter(log => log.auditType === 'role_assigned').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Elevated Permissions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filteredLogs.filter(log => log.isElevatedPermission).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter audit logs by type, risk level, or search terms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Audit Type</label>
              <Select
                value={filters.auditType}
                onValueChange={(value) => handleFilterChange('auditType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="role_created">Role Created</SelectItem>
                  <SelectItem value="role_updated">Role Updated</SelectItem>
                  <SelectItem value="role_deleted">Role Deleted</SelectItem>
                  <SelectItem value="role_assigned">Role Assigned</SelectItem>
                  <SelectItem value="role_unassigned">Role Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Risk Level</label>
              <Select
                value={filters.riskLevel}
                onValueChange={(value) => handleFilterChange('riskLevel', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Audit Logs</CardTitle>
          <CardDescription>
            Detailed log of all permission changes and role assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading audit logs...</div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">No audit logs found</div>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Risk</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Target User</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`flex items-center gap-1 ${
                              riskLevelColors[log.riskLevel as keyof typeof riskLevelColors]
                            }`}
                          >
                            {getRiskIcon(log.riskLevel)}
                            {log.riskLevel.charAt(0).toUpperCase() + log.riskLevel.slice(1)}
                          </Badge>
                          {log.isElevatedPermission && (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {auditTypeLabels[log.auditType as keyof typeof auditTypeLabels] || log.auditType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{log.roleName || 'N/A'}</div>
                        {log.moduleAffected && (
                          <div className="text-xs text-muted-foreground">Module: {log.moduleAffected}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.targetUserName ? (
                          <div className="font-medium">{log.targetUserName}</div>
                        ) : (
                          <div className="text-muted-foreground">N/A</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <div className="font-medium">{log.changesSummary}</div>
                          {log.changesCount > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {log.changesCount} permission{log.changesCount !== 1 ? 's' : ''} changed
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{log.performedByName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(log.timestamp), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(log.timestamp), 'HH:mm:ss')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data && data.total > filters.limit && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {filters.offset + 1} to {Math.min(filters.offset + filters.limit, data.total)} of{' '}
                    {data.total} results
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('offset', Math.max(0, filters.offset - filters.limit))}
                      disabled={filters.offset === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('offset', filters.offset + filters.limit)}
                      disabled={filters.offset + filters.limit >= data.total}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}