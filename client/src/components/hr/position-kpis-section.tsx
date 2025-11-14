import { useQuery, useMutation } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Target, AlertCircle } from "lucide-react";
import type { Position, PositionKpi, OneOnOneMeetingKpiStatus } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PositionKpisSectionProps {
  staffPosition?: string;
  meetingId: string | null;
}

const KPI_STATUS_OPTIONS = [
  { value: "on_track", label: "On-Track", color: "bg-green-100 text-green-800" },
  { value: "off_track", label: "Off-Track", color: "bg-red-100 text-red-800" },
  { value: "complete", label: "Complete", color: "bg-blue-100 text-blue-800" },
];

export function PositionKpisSection({ staffPosition, meetingId }: PositionKpisSectionProps) {
  const { toast } = useToast();

  // Fetch all positions to find the position ID from the staff member's position name
  const { 
    data: positions, 
    isLoading: loadingPositions, 
    error: positionsError 
  } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
  });

  // Normalize position name matching (case-insensitive, trimmed)
  const normalizedStaffPosition = staffPosition?.trim().toLowerCase();
  const matchedPosition = positions?.find(
    (p: Position) => p.name?.trim().toLowerCase() === normalizedStaffPosition
  );

  // Fetch position KPIs if we have a position ID
  const { 
    data: positionKpis, 
    isLoading: loadingKpis, 
    error: kpisError 
  } = useQuery<PositionKpi[]>({
    queryKey: [`/api/positions/${matchedPosition?.id}/kpis`],
    enabled: !!matchedPosition?.id,
  });

  // Fetch KPI statuses for this meeting
  // Only fetch after position KPIs are loaded to avoid 404 on new meetings
  const { 
    data: kpiStatuses = [],
    isLoading: loadingStatuses 
  } = useQuery<OneOnOneMeetingKpiStatus[]>({
    queryKey: [`/api/hr/one-on-one/meetings/${meetingId}/kpi-statuses`],
    enabled: !!meetingId && !!positionKpis && positionKpis.length > 0,
  });

  // Create a map of KPI ID to status for quick lookup
  const statusMap = new Map(
    kpiStatuses.map(status => [status.positionKpiId, status.status])
  );

  // Mutation to update KPI status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ kpiId, status }: { kpiId: string; status: string }) => {
      return await apiRequest(
        "PUT",
        `/api/hr/one-on-one/kpi-statuses/${meetingId}/${kpiId}`,
        { status }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/hr/one-on-one/meetings/${meetingId}/kpi-statuses`] 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update KPI status",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (kpiId: string, status: string) => {
    updateStatusMutation.mutate({ kpiId, status });
  };

  // Don't show section if staff has no position assigned
  if (!staffPosition) {
    return null;
  }

  // Show loading state
  if (loadingPositions || loadingKpis) {
    return (
      <div data-testid="position-kpis-loading">
        <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
          <Target className="h-4 w-4" />
          Position KPIs
        </Label>
        <p className="text-sm text-muted-foreground">Loading KPIs...</p>
      </div>
    );
  }

  // Show error if positions query failed
  if (positionsError) {
    return (
      <div data-testid="position-kpis-error">
        <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
          <Target className="h-4 w-4" />
          Position KPIs
        </Label>
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Failed to load positions. Please try again.</span>
        </div>
      </div>
    );
  }

  // Show error if KPIs query failed
  if (kpisError) {
    return (
      <div data-testid="position-kpis-error">
        <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
          <Target className="h-4 w-4" />
          Position KPIs
        </Label>
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Failed to load KPIs. Please try again.</span>
        </div>
      </div>
    );
  }

  // Show error if position not found
  if (!matchedPosition) {
    return (
      <div data-testid="position-kpis-not-found">
        <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
          <Target className="h-4 w-4" />
          Position KPIs
        </Label>
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Position "{staffPosition}" not found in system</span>
        </div>
      </div>
    );
  }

  // Show empty state if no KPIs configured
  if (!positionKpis || positionKpis.length === 0) {
    return (
      <div data-testid="position-kpis-empty">
        <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
          <Target className="h-4 w-4" />
          Position KPIs ({matchedPosition.name})
        </Label>
        <p className="text-sm text-muted-foreground">
          No KPIs configured for this position
        </p>
      </div>
    );
  }

  // Show KPIs with status dropdowns
  return (
    <div>
      <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
        <Target className="h-4 w-4" />
        Position KPIs ({matchedPosition.name})
      </Label>
      <div className="space-y-2">
        {positionKpis.map((kpi) => {
          const currentStatus = statusMap.get(kpi.id) || "on_track";
          
          return (
            <div
              key={kpi.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded gap-4"
              data-testid={`position-kpi-${kpi.id}`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{kpi.kpiName}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Target: {kpi.benchmark}
                </p>
              </div>
              <Select
                value={currentStatus}
                onValueChange={(value) => handleStatusChange(kpi.id, value)}
              >
                <SelectTrigger className="w-[140px]" data-testid={`select-kpi-status-${kpi.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KPI_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
