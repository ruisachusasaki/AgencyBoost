import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface ChecklistItemData {
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

interface ChecklistItemProps {
  item: ChecklistItemData;
  isUnlocked: boolean;
  isReadOnly: boolean;
  onToggle: (itemId: number, isCompleted: boolean) => void;
}

export default function ChecklistItem({ item, isUnlocked, isReadOnly, onToggle }: ChecklistItemProps) {
  const [optimisticCompleted, setOptimisticCompleted] = useState<boolean | null>(null);
  const isCompleted = optimisticCompleted !== null ? optimisticCompleted : !!item.isCompleted;
  const disabled = !isUnlocked || isReadOnly;

  const handleToggle = () => {
    if (disabled) return;
    const newValue = !isCompleted;
    setOptimisticCompleted(newValue);
    onToggle(item.id, newValue);
    setTimeout(() => setOptimisticCompleted(null), 3000);
  };

  const typeBadge = () => {
    switch (item.itemType) {
      case "kb_article":
        return <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-50 text-xs">KB Article</Badge>;
      case "training_course":
        return <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 text-xs">Training Course</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-500 border-gray-300 bg-gray-50 text-xs">Text</Badge>;
    }
  };

  return (
    <div className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
      isCompleted
        ? "bg-[hsl(179,100%,39%)]/5 border-[hsl(179,100%,39%)]/20"
        : "bg-white border-gray-200"
    } ${!isUnlocked ? "opacity-50" : ""}`}>
      <button
        onClick={handleToggle}
        disabled={disabled}
        className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          isCompleted
            ? "bg-[hsl(179,100%,39%)] border-[hsl(179,100%,39%)]"
            : disabled
              ? "border-gray-300 cursor-not-allowed"
              : "border-gray-400 hover:border-[hsl(179,100%,39%)] cursor-pointer"
        }`}
        aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
      >
        {isCompleted && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium ${isCompleted ? "line-through text-gray-500" : "text-gray-900"}`}>
            {item.title}
          </span>
          {typeBadge()}
          {!item.isRequired && (
            <Badge variant="outline" className="text-gray-400 border-gray-200 text-xs">Optional</Badge>
          )}
        </div>
        {item.description && (
          <p className="text-sm text-gray-500 mt-1">{item.description}</p>
        )}
        {item.autoCompleted && (
          <Badge className="mt-1 bg-[hsl(179,100%,39%)]/10 text-[hsl(179,100%,39%)] border-0 text-xs">
            Auto-completed via Training
          </Badge>
        )}
        {item.referenceId && !item.referenceTitle && (
          <div className="flex items-center gap-1 mt-1">
            <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
            <span className="text-xs text-yellow-600">Resource unavailable</span>
          </div>
        )}
        {isCompleted && item.completedAt && (
          <p className="text-xs text-gray-400 mt-1">
            Completed {format(new Date(item.completedAt), "MMMM d 'at' h:mm a")}
          </p>
        )}
      </div>

      <div className="flex-shrink-0">
        {item.itemType === "kb_article" && item.referenceTitle && item.referenceUrl && (
          <Button
            variant="ghost"
            size="sm"
            className="text-[hsl(179,100%,39%)] hover:text-[hsl(179,100%,33%)] hover:bg-[hsl(179,100%,39%)]/10"
            asChild
          >
            <a href={item.referenceUrl} target="_blank" rel="noopener noreferrer">
              Read Article <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
        )}
        {item.itemType === "training_course" && item.referenceTitle && item.referenceUrl && (
          <Button
            variant="ghost"
            size="sm"
            className="text-[hsl(179,100%,39%)] hover:text-[hsl(179,100%,33%)] hover:bg-[hsl(179,100%,39%)]/10"
            asChild
          >
            <a href={item.referenceUrl} target="_blank" rel="noopener noreferrer">
              Start Course <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
