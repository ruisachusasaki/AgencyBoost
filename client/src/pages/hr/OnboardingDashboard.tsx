import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Users, Loader2, Search, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";
import OnboardingInstanceCard from "@/components/onboarding/OnboardingInstanceCard";
import OnboardingInstanceDrawer from "@/components/onboarding/OnboardingInstanceDrawer";

export default function OnboardingDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("active");
  const [deptFilter, setDeptFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [drawerInstanceId, setDrawerInstanceId] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ instanceId: number; status: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: adminStatus } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/auth/is-admin"],
  });
  const isAdmin = adminStatus?.isAdmin === true;

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("status", statusFilter);
    if (deptFilter !== "all" && isAdmin) params.set("teamId", deptFilter);
    if (debouncedSearch) params.set("search", debouncedSearch);
    return params.toString();
  }, [statusFilter, deptFilter, debouncedSearch, isAdmin]);

  const { data: instances = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/onboarding/instances", queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/onboarding/instances?${queryParams}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: allInstances = [] } = useQuery<any[]>({
    queryKey: ["/api/onboarding/instances", "all-stats"],
    queryFn: async () => {
      const res = await fetch("/api/onboarding/instances?status=all", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ["/api/departments"],
    enabled: isAdmin,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ instanceId, status }: { instanceId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/onboarding/instances/${instanceId}/status`, { status });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      setConfirmAction(null);
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/instances"] });
      toast({ title: "Status updated successfully" });
    },
    onError: () => {
      setConfirmAction(null);
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const stats = useMemo(() => {
    const active = allInstances.filter((i: any) => i.status === "active");
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const completedThisMonth = allInstances.filter((i: any) =>
      i.status === "completed" && i.completedAt && new Date(i.completedAt) >= monthStart
    );
    const behind = active.filter((i: any) => i.progress?.isBehind);
    const avgCompletion = active.length > 0
      ? Math.round(active.reduce((sum: number, i: any) => sum + (i.progress?.percentComplete || 0), 0) / active.length)
      : 0;

    return {
      active: active.length,
      completedThisMonth: completedThisMonth.length,
      behind: behind.length,
      avgCompletion,
    };
  }, [allInstances]);

  const handleStatusChange = (instanceId: number, status: string) => {
    setConfirmAction({ instanceId, status });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(179,100%,39%)]/10">
                <Users className="h-5 w-5 text-[hsl(179,100%,39%)]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Active Onboardings</p>
                <p className="text-2xl font-bold text-[hsl(179,100%,39%)]">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Completed This Month</p>
                <p className="text-2xl font-bold text-[hsl(179,100%,39%)]">{stats.completedThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Behind Schedule</p>
                <p className="text-2xl font-bold text-[hsl(179,100%,39%)]">{stats.behind}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(179,100%,39%)]/10">
                <TrendingUp className="h-5 w-5 text-[hsl(179,100%,39%)]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Avg. Completion</p>
                <p className="text-2xl font-bold text-[hsl(179,100%,39%)]">{stats.avgCompletion}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        {isAdmin && (
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d: any) => (
                <SelectItem key={d.id || d.name} value={d.name}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(179,100%,39%)]" />
        </div>
      ) : instances.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No active onboardings</h3>
          <p className="text-gray-500 max-w-md">
            New hire onboarding checklists will appear here when staff members are added with a matching position template.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase">Hire</th>
                <th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase">Start Date</th>
                <th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase">Day</th>
                <th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {instances.map((instance: any) => (
                <OnboardingInstanceCard
                  key={instance.id}
                  instance={instance}
                  onViewDetails={setDrawerInstanceId}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <OnboardingInstanceDrawer
        instanceId={drawerInstanceId}
        open={drawerInstanceId !== null}
        onClose={() => setDrawerInstanceId(null)}
      />

      <AlertDialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.status === "paused" ? "Pause Onboarding" : confirmAction?.status === "active" ? "Resume Onboarding" : "Mark as Complete"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.status === "paused"
                ? "This will pause the onboarding checklist. The hire will not be able to make progress until resumed."
                : confirmAction?.status === "active"
                  ? "This will resume the onboarding checklist so the hire can continue."
                  : "This will mark the onboarding as complete regardless of remaining items. Continue?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[hsl(179,100%,39%)] hover:bg-[hsl(179,100%,33%)] text-white"
              onClick={() => confirmAction && statusMutation.mutate(confirmAction)}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
