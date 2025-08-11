import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import type { Client } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface PaginatedClientsResponse {
  clients: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number | string;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export default function RecentClients() {
  const { data: clientsData, isLoading, error } = useQuery<PaginatedClientsResponse>({
    queryKey: ["/api/clients", "recent", "v5"],
    queryFn: async () => {
      const timestamp = Date.now();
      const response = await fetch(`/api/clients?page=1&limit=3&sortBy=createdAt&sortOrder=desc&_t=${timestamp}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result;
    },
    staleTime: 0,
    gcTime: 0,
  });

  const clients = clientsData?.clients || [];
  const recentClients = Array.isArray(clients) ? clients : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border border-slate-200">
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Recent Clients</h3>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded animate-pulse" />
                  <div className="h-3 bg-slate-200 rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-slate-200">
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Recent Clients</h3>
          <Link href="/clients">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {recentClients.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No clients found</p>
            <Link href="/clients">
              <Button className="mt-4">Add Your First Client</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentClients.map((client) => (
              <div key={client.id} className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-b-0">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-slate-600">
                    {getInitials(client.name)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{client.name}</p>
                  <p className="text-sm text-slate-600">{client.email}</p>
                </div>
                <Badge className={getStatusColor(client.status)}>
                  {client.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
