import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Lock, AlertTriangle, ExternalLink } from "lucide-react";
import { format, addDays } from "date-fns";
import OnboardingProgressBar from "./OnboardingProgressBar";

interface DrawerProps {
  instanceId: number | null;
  open: boolean;
  onClose: () => void;
}

function addWeekdays(start: Date, days: number): Date {
  let result = new Date(start);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return result;
}

export default function OnboardingInstanceDrawer({ instanceId, open, onClose }: DrawerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusAction, setStatusAction] = useState<string | null>(null);

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/onboarding/instances", instanceId],
    queryFn: async () => {
      const res = await fetch(`/api/onboarding/instances/${instanceId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch instance");
      return res.json();
    },
    enabled: !!instanceId && open,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ itemId, isCompleted }: { itemId: number; isCompleted: boolean }) => {
      const res = await apiRequest("PATCH", `/api/onboarding/instances/${instanceId}/items/${itemId}`, { isCompleted });
      if (!res.ok) throw new Error("Failed to update item");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/instances", instanceId] });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/instances"] });
    },
    onError: () => {
      toast({ title: "Failed to update item", variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await apiRequest("PATCH", `/api/onboarding/instances/${instanceId}/status`, { status: newStatus });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      setStatusAction(null);
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/instances", instanceId] });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/instances"] });
      toast({ title: "Status updated successfully" });
    },
    onError: () => {
      setStatusAction(null);
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const statusBadge = (status: string, isBehind?: boolean) => {
    if (isBehind && status === "active") return <Badge className="bg-red-100 text-red-700 border-0">Behind</Badge>;
    switch (status) {
      case "active": return <Badge className="bg-[hsl(179,100%,39%)]/10 text-[hsl(179,100%,39%)] border-0">Active</Badge>;
      case "completed": return <Badge className="bg-green-100 text-green-700 border-0">Completed</Badge>;
      case "paused": return <Badge className="bg-gray-100 text-gray-600 border-0">Paused</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!open) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Onboarding Details</SheetTitle>
          </SheetHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[hsl(179,100%,39%)]" />
            </div>
          ) : data ? (
            <div className="space-y-6 mt-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={data.staffMember?.profileImagePath || ""} />
                  <AvatarFallback className="bg-[hsl(179,100%,39%)]/10 text-[hsl(179,100%,39%)]">
                    {data.staffMember?.firstName?.[0]}{data.staffMember?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{data.staffMember?.firstName} {data.staffMember?.lastName}</h3>
                  <p className="text-sm text-gray-500">{data.staffMember?.position}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {statusBadge(data.status, data.progress?.isBehind)}
                    <span className="text-xs text-gray-500">
                      Started {format(new Date(data.startDate), "MMM d, yyyy")} · Day {data.progress?.currentDay} of {data.totalDays}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <OnboardingProgressBar percent={data.progress?.percentComplete || 0} showLabel size="md" />
                <p className="text-xs text-gray-500 mt-1">
                  {data.progress?.completedRequiredItems} of {data.progress?.requiredItems} required items complete
                </p>
              </div>

              <div className="space-y-4">
                {Array.from({ length: data.totalDays }, (_, i) => i + 1).map((dayNum) => {
                  const dayItems = (data.items || []).filter((item: any) => item.dayNumber === dayNum);
                  if (dayItems.length === 0) return null;

                  const start = new Date(data.startDate + "T00:00:00");
                  const unlockDate = dayNum === 1 ? start : addWeekdays(start, dayNum - 1);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  let isUnlocked = true;
                  if (data.dayUnlockMode === "calendar") {
                    isUnlocked = today >= unlockDate;
                  } else if (data.dayUnlockMode === "completion" && dayNum > 1) {
                    const prevRequired = (data.items || []).filter((i: any) => i.dayNumber === dayNum - 1 && i.isRequired);
                    isUnlocked = prevRequired.length === 0 || prevRequired.every((i: any) => i.isCompleted);
                  }

                  const requiredItems = dayItems.filter((i: any) => i.isRequired);
                  const dayComplete = requiredItems.length > 0 && requiredItems.every((i: any) => i.isCompleted);

                  return (
                    <div key={dayNum} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-sm">Day {dayNum}</h4>
                        <span className="text-xs text-gray-500">{format(unlockDate, "EEEE, MMM d")}</span>
                        {!isUnlocked && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <Lock className="h-3 w-3" />
                            <span className="text-xs">Not yet unlocked</span>
                          </div>
                        )}
                        {dayComplete && (
                          <Badge className="bg-[hsl(179,100%,39%)]/10 text-[hsl(179,100%,39%)] border-0 text-xs">Complete</Badge>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {dayItems.map((item: any) => {
                          const isOverdue = item.isRequired && !item.isCompleted && item.dayNumber < (data.progress?.currentDay || 1);
                          return (
                            <div key={item.id} className={`flex items-start gap-3 py-1.5 px-2 rounded ${item.isCompleted ? "bg-[hsl(179,100%,39%)]/5" : ""}`}>
                              <button
                                onClick={() => toggleMutation.mutate({ itemId: item.id, isCompleted: !item.isCompleted })}
                                className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  item.isCompleted
                                    ? "bg-[hsl(179,100%,39%)] border-[hsl(179,100%,39%)]"
                                    : "border-gray-400 hover:border-[hsl(179,100%,39%)] cursor-pointer"
                                }`}
                              >
                                {item.isCompleted && (
                                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-sm ${item.isCompleted ? "line-through text-gray-500" : "text-gray-900"}`}>
                                    {item.title}
                                  </span>
                                  {item.itemType === "kb_article" && (
                                    <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-50 text-[10px] py-0">KB</Badge>
                                  )}
                                  {item.itemType === "training_course" && (
                                    <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 text-[10px] py-0">Training</Badge>
                                  )}
                                  {isOverdue && (
                                    <Badge className="bg-red-100 text-red-700 border-0 text-[10px] py-0">Overdue</Badge>
                                  )}
                                  {item.autoCompleted && (
                                    <Badge className="bg-[hsl(179,100%,39%)]/10 text-[hsl(179,100%,39%)] border-0 text-[10px] py-0">Auto-completed</Badge>
                                  )}
                                </div>
                                {item.isCompleted && item.completedAt && (
                                  <p className="text-[11px] text-gray-400 mt-0.5">
                                    Completed {format(new Date(item.completedAt), "MMM d")}
                                  </p>
                                )}
                                {item.referenceId && !item.referenceTitle && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                    <span className="text-[10px] text-yellow-600">Resource unavailable</span>
                                  </div>
                                )}
                              </div>
                              {item.referenceUrl && item.referenceTitle && (
                                <a href={item.referenceUrl} target="_blank" rel="noopener noreferrer"
                                  className="text-[hsl(179,100%,39%)] hover:text-[hsl(179,100%,33%)] flex-shrink-0">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                {data.status === "active" && (
                  <Button variant="outline" size="sm" onClick={() => setStatusAction("paused")} className="flex-1">
                    Pause Onboarding
                  </Button>
                )}
                {data.status === "paused" && (
                  <Button variant="outline" size="sm" onClick={() => setStatusAction("active")}
                    className="flex-1 border-[hsl(179,100%,39%)] text-[hsl(179,100%,39%)]">
                    Resume Onboarding
                  </Button>
                )}
                {data.status !== "completed" && (
                  <Button size="sm" onClick={() => setStatusAction("completed")}
                    className="flex-1 bg-[hsl(179,100%,39%)] hover:bg-[hsl(179,100%,33%)] text-white">
                    Mark as Complete
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 py-10 text-center">Failed to load instance</p>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!statusAction} onOpenChange={(o) => !o && setStatusAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusAction === "paused" ? "Pause Onboarding" : statusAction === "active" ? "Resume Onboarding" : "Mark as Complete"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusAction === "paused"
                ? "This will pause the onboarding checklist. The hire will not be able to make progress until resumed."
                : statusAction === "active"
                  ? "This will resume the onboarding checklist so the hire can continue."
                  : "This will mark the onboarding as complete regardless of remaining items. Continue?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[hsl(179,100%,39%)] hover:bg-[hsl(179,100%,33%)] text-white"
              onClick={() => statusAction && statusMutation.mutate(statusAction)}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
