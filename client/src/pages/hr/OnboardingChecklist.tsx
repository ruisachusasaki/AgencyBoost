import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, ClipboardList, Lock, CheckCircle, Circle } from "lucide-react";
import ChecklistDaySection from "@/components/onboarding/ChecklistDaySection";

interface InstanceData {
  id: number;
  staffId: string;
  startDate: string;
  status: string;
  totalDays: number;
  dayUnlockMode: string;
  completedAt: string | null;
  createdAt: string;
}

interface ItemData {
  id: number;
  instanceId: number;
  dayNumber: number;
  sortOrder: number;
  title: string;
  description: string | null;
  itemType: string;
  referenceId: number | null;
  referenceTitle: string | null;
  referenceUrl: string | null;
  isRequired: boolean | null;
  isCompleted: boolean | null;
  completedAt: string | null;
  completedBy: string | null;
  autoCompleted: boolean | null;
}

interface ChecklistResponse {
  instance: InstanceData | null;
  items: ItemData[];
}

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
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

function getBusinessDaysBetween(start: Date, end: Date): number {
  let count = 0;
  const d = new Date(start);
  while (d <= end) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

export default function OnboardingChecklist() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery<UserData>({
    queryKey: ["/api/auth/me"],
  });

  const { data: checklist, isLoading } = useQuery<ChecklistResponse>({
    queryKey: ["/api/onboarding/my-checklist"],
    queryFn: async () => {
      const res = await fetch("/api/onboarding/my-checklist", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch checklist");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ itemId, isCompleted }: { itemId: number; isCompleted: boolean }) => {
      const res = await apiRequest("PATCH", `/api/onboarding/my-checklist/items/${itemId}`, { isCompleted });
      if (!res.ok) throw new Error("Failed to update item");
      return res.json();
    },
    onMutate: async ({ itemId, isCompleted }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/onboarding/my-checklist"] });
      const previous = queryClient.getQueryData<ChecklistResponse>(["/api/onboarding/my-checklist"]);
      queryClient.setQueryData<ChecklistResponse>(["/api/onboarding/my-checklist"], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map(i => i.id === itemId
            ? { ...i, isCompleted, completedAt: isCompleted ? new Date().toISOString() : null }
            : i
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["/api/onboarding/my-checklist"], context.previous);
      }
      toast({ title: "Failed to update item", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/my-checklist"] });
    },
  });

  const handleToggle = (itemId: number, isCompleted: boolean) => {
    toggleMutation.mutate({ itemId, isCompleted });
  };

  const { dayGroups, progress, currentDay, daysRemaining } = useMemo(() => {
    if (!checklist?.instance || !checklist.items.length) {
      return { dayGroups: [], progress: 0, currentDay: 1, daysRemaining: 0 };
    }

    const { instance, items } = checklist;
    const groups: { dayNumber: number; items: ItemData[] }[] = [];
    for (let d = 1; d <= instance.totalDays; d++) {
      groups.push({ dayNumber: d, items: items.filter(i => i.dayNumber === d) });
    }

    const required = items.filter(i => i.isRequired);
    const completedRequired = required.filter(i => i.isCompleted);
    const pct = required.length > 0 ? Math.round((completedRequired.length / required.length) * 100) : 100;

    const start = new Date(instance.startDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bizDays = getBusinessDaysBetween(start, today);
    const cDay = Math.max(1, Math.min(bizDays, instance.totalDays));
    const remaining = Math.max(0, instance.totalDays - cDay);

    return { dayGroups: groups, progress: pct, currentDay: cDay, daysRemaining: remaining };
  }, [checklist]);

  const completedCount = checklist?.items?.filter(i => i.isCompleted).length || 0;
  const totalCount = checklist?.items?.length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(179,100%,39%)]" />
      </div>
    );
  }

  if (!checklist?.instance) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ClipboardList className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">No onboarding checklist yet</h2>
        <p className="text-gray-500 max-w-md">
          Your manager will set up your onboarding checklist. Check back soon!
        </p>
      </div>
    );
  }

  const instance = checklist.instance;
  const isComplete = instance.status === "completed";

  const getDayStatus = (dayNumber: number) => {
    const dayItems = checklist.items.filter(i => i.dayNumber === dayNumber);
    const requiredItems = dayItems.filter(i => i.isRequired);
    const allDone = requiredItems.length > 0 && requiredItems.every(i => i.isCompleted);
    const someDone = dayItems.some(i => i.isCompleted);

    let isUnlocked = true;
    if (instance.dayUnlockMode === "completion" && dayNumber > 1) {
      const prevRequired = checklist.items.filter(i => i.dayNumber === dayNumber - 1 && i.isRequired);
      isUnlocked = prevRequired.length === 0 || prevRequired.every(i => i.isCompleted);
    } else if (instance.dayUnlockMode === "calendar") {
      const start = new Date(instance.startDate + "T00:00:00");
      const unlockDate = dayNumber === 1 ? start : addWeekdays(start, dayNumber - 1);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      isUnlocked = today >= unlockDate;
    }

    return { allDone, someDone, isUnlocked, isCurrent: dayNumber === currentDay };
  };

  const scrollToDay = (dayNumber: number) => {
    const el = document.getElementById(`day-${dayNumber}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm bg-gradient-to-r from-[hsl(179,100%,39%)]/5 to-white">
        <CardContent className="p-6">
          {isComplete ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">🎉</div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">You've completed your onboarding!</h2>
              <p className="text-gray-600">Great work, {user?.firstName || "team member"}. Your checklist is available below for reference.</p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Welcome to the team{user?.firstName ? `, ${user.firstName}` : ""}! Here's your onboarding journey.
              </h2>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{progress}% complete</span>
                  <span className="text-sm text-gray-500">
                    {completedCount} of {totalCount} items complete · Day {currentDay} of {instance.totalDays} · {
                      daysRemaining === 0
                        ? "Final day!"
                        : `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`
                    }
                  </span>
                </div>
                <Progress value={progress} className="h-2 [&>div]:bg-[hsl(179,100%,39%)]" />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-6">
        <div className="hidden md:block w-48 flex-shrink-0">
          <div className="sticky top-4 space-y-1">
            {Array.from({ length: instance.totalDays }, (_, i) => i + 1).map((d) => {
              const status = getDayStatus(d);
              return (
                <button
                  key={d}
                  onClick={() => scrollToDay(d)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                    status.isCurrent
                      ? "bg-[hsl(179,100%,39%)]/10 text-[hsl(179,100%,39%)] font-bold"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {status.allDone ? (
                    <CheckCircle className="h-4 w-4 text-[hsl(179,100%,39%)] flex-shrink-0" />
                  ) : !status.isUnlocked ? (
                    <Lock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  ) : status.someDone ? (
                    <div className="h-4 w-4 rounded-full border-2 border-[hsl(179,100%,39%)] flex-shrink-0 relative overflow-hidden">
                      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-[hsl(179,100%,39%)]" />
                    </div>
                  ) : (
                    <Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  )}
                  Day {d}
                </button>
              );
            })}
          </div>
        </div>

        <div className="md:hidden overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex gap-2">
            {Array.from({ length: instance.totalDays }, (_, i) => i + 1).map((d) => {
              const status = getDayStatus(d);
              return (
                <button
                  key={d}
                  onClick={() => scrollToDay(d)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${
                    status.isCurrent
                      ? "bg-[hsl(179,100%,39%)] text-white border-[hsl(179,100%,39%)]"
                      : status.allDone
                        ? "bg-[hsl(179,100%,39%)]/10 text-[hsl(179,100%,39%)] border-[hsl(179,100%,39%)]/30"
                        : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  {status.allDone && <CheckCircle className="h-3.5 w-3.5" />}
                  {!status.isUnlocked && <Lock className="h-3.5 w-3.5" />}
                  Day {d}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-8">
          {dayGroups.map(({ dayNumber, items }) => (
            <ChecklistDaySection
              key={dayNumber}
              dayNumber={dayNumber}
              items={items}
              dayUnlockMode={instance.dayUnlockMode}
              startDate={instance.startDate}
              isComplete={isComplete}
              instanceStatus={instance.status}
              allItems={checklist.items}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
