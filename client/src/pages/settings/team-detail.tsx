import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Users, MapPin, Phone, Mail, Edit, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Department, Staff, Position } from "@shared/schema";

export default function TeamDetail() {
  const [, params] = useRoute("/settings/teams/:id");
  const [searchTerm, setSearchTerm] = useState("");
  const teamId = params?.id;

  // Fetch team details
  const { data: team, isLoading: teamLoading } = useQuery<Department>({
    queryKey: ["/api/departments", teamId],
    queryFn: () => fetch(`/api/departments/${teamId}`).then(res => res.json()),
    enabled: !!teamId,
  });

  // Fetch team members (staff assigned to this department)
  const { data: staff = [], isLoading: staffLoading } = useQuery<Staff[]>({
    queryKey: ["/api/staff", "by-department", teamId, searchTerm],
    queryFn: async () => {
      let url = `/api/staff?departmentId=${teamId}`;
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      const response = await fetch(url);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!teamId,
  });

  // Fetch positions for this team
  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ["/api/departments", teamId, "positions"],
    queryFn: () => fetch(`/api/departments/${teamId}/positions`).then(res => res.json()),
    enabled: !!teamId,
  });

  if (teamLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/settings/staff">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Teams
            </Button>
          </Link>
        </div>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Team Not Found</h2>
          <p className="text-gray-600">The requested team could not be found.</p>
        </div>
      </div>
    );
  }

  const filteredStaff = staff.filter(member => {
    if (!searchTerm) return true;
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    const email = member.email?.toLowerCase() || '';
    return fullName.includes(searchTerm.toLowerCase()) || 
           email.includes(searchTerm.toLowerCase());
  });

  const getRoleBadgeColor = (roleId: string) => {
    // Simple role color mapping - you may want to fetch actual role names
    const roleColors: { [key: string]: string } = {
      'admin': 'bg-red-100 text-red-800',
      'manager': 'bg-blue-100 text-blue-800',
      'user': 'bg-green-100 text-green-800',
      'accounting': 'bg-purple-100 text-purple-800',
    };
    return roleColors[roleId] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/settings/staff">
            <Button variant="ghost" size="sm" data-testid="button-back-to-teams">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Teams
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="text-team-name">
              {team.name}
            </h1>
            {team.description && (
              <p className="text-gray-600 mt-1" data-testid="text-team-description">
                {team.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" data-testid="button-edit-team">
            <Edit className="h-4 w-4 mr-2" />
            Edit Team
          </Button>
          <Button size="sm" data-testid="button-add-member">
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Team Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-member-count">
              {staff.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active team members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positions</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-position-count">
              {positions.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Available positions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={team.isActive ? "default" : "secondary"} data-testid="badge-team-status">
              {team.isActive ? "Active" : "Inactive"}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Current status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Manage members assigned to this team
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                  data-testid="input-search-members"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {staffLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "No members found" : "No members assigned"}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? "Try adjusting your search terms"
                  : "Start by adding team members to this team"
                }
              </p>
              {!searchTerm && (
                <Button data-testid="button-add-first-member">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Member
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member) => {
                  const position = positions.find(p => p.id === member.position);
                  return (
                    <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.profileImagePath || undefined} />
                            <AvatarFallback>
                              {member.firstName?.[0]}{member.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium" data-testid={`text-member-name-${member.id}`}>
                              {member.firstName} {member.lastName}
                            </div>
                            <div className="text-sm text-gray-600" data-testid={`text-member-email-${member.id}`}>
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm" data-testid={`text-member-position-${member.id}`}>
                          {position?.name || (member.position ? member.position : "No position")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={getRoleBadgeColor(member.roleId)} 
                          data-testid={`badge-member-role-${member.id}`}
                        >
                          {member.roleId}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {member.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-3 w-3 mr-1" />
                              {member.phone}
                            </div>
                          )}
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            {member.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            data-testid={`button-edit-member-${member.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-remove-member-${member.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}