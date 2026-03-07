import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClipboardCheck, Eye, CheckCircle2, Circle, Lock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import OnboardingProgressBar from "./OnboardingProgressBar";

interface HistoryInstance {
  id: number;
  status: string;
  startDate: string | null;
  completedAt: string | null;
  createdAt: string;
  totalDays: number;
  positionName: string;
  totalItems: number;
  completedItems: number;
  requiredItems: number;
  completedRequiredItems: number;
  percentComplete: number;
}

function getBusinessDaysElapsed(startDate: Date, today: Date): number {
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(0, 0, 0, 0);
  while (current < end) {
    current.setDate(current.getDate() + 1);
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "active":
      return <Badge className="bg-[hsl(179,100%,39%)]/10 text-[hsl(179,100%,39%)] border-0">Active</Badge>;
    case "completed":
      return <Badge className="bg-green-100 text-green-700 border-0">Completed</Badge>;
    case "paused":
      return <Badge className="bg-gray-100 text-gray-600 border-0">Paused</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function InstanceDetailDialog({ staffId, instanceId, open, onClose }: {
  staffId: string;
  instanceId: number;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery<any>({
    queryKey: [`/api/staff/${staffId}/onboarding-history/${instanceId}`],
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-[hsl(179,100%,39%)]" />
            {data?.positionName || "Onboarding"} Checklist
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{data.completedItems} of {data.totalItems} items complete</span>
              <StatusBadge status={data.status} />
            </div>
            <OnboardingProgressBar
              completed={data.completedItems}
              total={data.totalItems}
              size="sm"
            />

            <div className="space-y-4 mt-4">
              {data.days?.map((day: any) => (
                <div key={day.dayNumber} className="border rounded-lg p-3">
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Day {day.dayNumber}</h4>
                  <div className="space-y-2">
                    {day.items.map((item: any) => (
                      <div key={item.id} className="flex items-start gap-2 text-sm">
                        {item.isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 mt-0.5 text-gray-300 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={item.isCompleted ? "text-gray-500 line-through" : "text-gray-800"}>
                              {item.title}
                            </span>
                            {item.isRequired && !item.isCompleted && (
                              <Badge variant="outline" className="text-[10px] py-0 border-red-200 text-red-500">Required</Badge>
                            )}
                            {item.autoCompleted && (
                              <Badge className="bg-[hsl(179,100%,39%)]/10 text-[hsl(179,100%,39%)] border-0 text-[10px] py-0">
                                Auto-completed
                              </Badge>
                            )}
                          </div>
                          {item.isCompleted && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              {item.completedAt && `Completed ${format(new Date(item.completedAt), "MMM d, yyyy")}`}
                              {item.completedByName && ` by ${item.completedByName}`}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6">Failed to load checklist</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function StaffOnboardingHistory({ staffId }: { staffId: string }) {
  const [viewingInstanceId, setViewingInstanceId] = useState<number | null>(null);

  const { data: instances = [], isLoading } = useQuery<HistoryInstance[]>({
    queryKey: [`/api/staff/${staffId}/onboarding-history`],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardCheck className="h-5 w-5 text-[hsl(179,100%,39%)]" />
            Onboarding History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardCheck className="h-5 w-5 text-[hsl(179,100%,39%)]" />
          Onboarding History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {instances.length === 0 ? (
          <p className="text-sm text-gray-500">
            No onboarding history for this staff member. Use the "Spawn Onboarding Checklist" button in Work Information above to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {instances.map((inst) => {
              const startDate = inst.startDate ? new Date(inst.startDate) : new Date(inst.createdAt);
              const today = new Date();
              const businessDays = getBusinessDaysElapsed(startDate, today);
              const currentDay = Math.min(businessDays + 1, inst.totalDays);

              let durationText = "";
              if (inst.status === "completed" && inst.completedAt) {
                const completedDate = new Date(inst.completedAt);
                const daysToComplete = getBusinessDaysElapsed(startDate, completedDate);
                durationText = `Completed in ${daysToComplete} business day${daysToComplete !== 1 ? "s" : ""}`;
              } else if (inst.status === "active") {
                durationText = `In progress — Day ${currentDay} of ${inst.totalDays}`;
              } else if (inst.status === "paused") {
                durationText = `Paused — Day ${currentDay} of ${inst.totalDays}`;
              }

              return (
                <div key={inst.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{inst.positionName}</span>
                    <StatusBadge status={inst.status} />
                  </div>

                  <div className="text-xs text-gray-500 space-y-0.5">
                    <div>Started {format(startDate, "MMMM d, yyyy")}</div>
                    {inst.status === "completed" && inst.completedAt && (
                      <div>Completed {format(new Date(inst.completedAt), "MMMM d, yyyy")}</div>
                    )}
                    <div>{durationText}</div>
                  </div>

                  <OnboardingProgressBar
                    completed={inst.completedItems}
                    total={inst.totalItems}
                    size="sm"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {inst.completedRequiredItems} of {inst.requiredItems} required items complete
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => setViewingInstanceId(inst.id)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View Full Checklist
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {viewingInstanceId && (
        <InstanceDetailDialog
          staffId={staffId}
          instanceId={viewingInstanceId}
          open={!!viewingInstanceId}
          onClose={() => setViewingInstanceId(null)}
        />
      )}
    </Card>
  );
}
