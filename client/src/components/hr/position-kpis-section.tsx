import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Target, AlertCircle } from "lucide-react";
import type { Position, PositionKpi } from "@shared/schema";

interface PositionKpisSectionProps {
  staffPosition?: string;
}

export function PositionKpisSection({ staffPosition }: PositionKpisSectionProps) {
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

  // Log if no match found (for debugging)
  // Note: Relies on label matching until stable position ID is exposed on DirectReport
  if (staffPosition && !matchedPosition && positions && positions.length > 0 && !loadingPositions) {
    console.warn(`No position found matching "${staffPosition}"`);
  }

  // Fetch position KPIs if we have a position ID
  const { 
    data: positionKpis, 
    isLoading: loadingKpis, 
    error: kpisError 
  } = useQuery<PositionKpi[]>({
    queryKey: ["/api/positions", matchedPosition?.id, "kpis"],
    enabled: !!matchedPosition?.id,
  });

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

  // Show KPIs
  return (
    <div>
      <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
        <Target className="h-4 w-4" />
        Position KPIs ({matchedPosition.name})
      </Label>
      <div className="space-y-2">
        {positionKpis.map((kpi) => (
          <div
            key={kpi.id}
            className="flex items-start justify-between p-3 bg-gray-50 rounded"
            data-testid={`position-kpi-${kpi.id}`}
          >
            <div className="flex-1">
              <p className="font-medium text-sm">{kpi.kpiName}</p>
            </div>
            <div className="ml-4">
              <span className="text-sm font-semibold text-primary">
                {kpi.benchmark}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
