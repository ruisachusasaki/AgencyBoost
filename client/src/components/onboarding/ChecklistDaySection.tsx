import { useMemo } from "react";
import { Lock, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, addDays } from "date-fns";
import ChecklistItem from "./ChecklistItem";

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

interface ChecklistDaySectionProps {
  dayNumber: number;
  items: ItemData[];
  dayUnlockMode: string;
  startDate: string;
  isComplete: boolean;
  instanceStatus: string;
  allItems: ItemData[];
  onToggle: (itemId: number, isCompleted: boolean) => void;
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

export default function ChecklistDaySection({
  dayNumber,
  items,
  dayUnlockMode,
  startDate,
  isComplete,
  instanceStatus,
  allItems,
  onToggle,
}: ChecklistDaySectionProps) {
  const { isUnlocked, unlockDate } = useMemo(() => {
    const start = new Date(startDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dayUnlockMode === "completion") {
      if (dayNumber === 1) return { isUnlocked: true, unlockDate: start };
      const prevDayRequired = allItems.filter(i => i.dayNumber === dayNumber - 1 && i.isRequired);
      const prevComplete = prevDayRequired.length === 0 || prevDayRequired.every(i => i.isCompleted);
      const date = addWeekdays(start, dayNumber - 1);
      return { isUnlocked: prevComplete, unlockDate: date };
    }

    const date = dayNumber === 1 ? start : addWeekdays(start, dayNumber - 1);
    return { isUnlocked: today >= date, unlockDate: date };
  }, [dayNumber, dayUnlockMode, startDate, allItems]);

  const requiredItems = items.filter(i => i.isRequired);
  const requiredComplete = requiredItems.length > 0 && requiredItems.every(i => i.isCompleted);
  const isReadOnly = instanceStatus === "completed";

  return (
    <div id={`day-${dayNumber}`} className={`space-y-3 ${!isUnlocked ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-bold text-gray-900">Day {dayNumber}</h3>
        {isUnlocked && unlockDate && (
          <span className="text-sm text-gray-500">
            {format(unlockDate, "EEEE, MMMM d")}
          </span>
        )}
        {!isUnlocked && (
          <div className="flex items-center gap-1.5 text-gray-400">
            <Lock className="h-4 w-4" />
            <span className="text-sm">
              Unlocks {unlockDate ? format(unlockDate, "MMMM d") : "later"}
            </span>
          </div>
        )}
        {requiredComplete && (
          <Badge className="bg-[hsl(179,100%,39%)]/10 text-[hsl(179,100%,39%)] border-0 text-xs font-medium">
            <CheckCircle className="h-3 w-3 mr-1" />
            Day Complete
          </Badge>
        )}
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <ChecklistItem
            key={item.id}
            item={item}
            isUnlocked={isUnlocked}
            isReadOnly={isReadOnly}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}
