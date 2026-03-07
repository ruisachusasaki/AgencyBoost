import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pause, Play, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import OnboardingProgressBar from "./OnboardingProgressBar";

interface InstanceData {
  id: number;
  status: string;
  startDate: string;
  totalDays: number;
  staffMember: {
    id: string;
    firstName: string;
    lastName: string;
    position: string | null;
    department: string | null;
    profileImagePath: string | null;
  };
  progress: {
    totalItems: number;
    completedItems: number;
    requiredItems: number;
    completedRequiredItems: number;
    currentDay: number;
    percentComplete: number;
    isBehind: boolean;
  };
}

interface Props {
  instance: InstanceData;
  onViewDetails: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
}

export default function OnboardingInstanceCard({ instance, onViewDetails, onStatusChange }: Props) {
  const { staffMember: s, progress: p, status } = instance;

  const statusBadge = () => {
    if (p.isBehind && status === "active") return <Badge className="bg-red-100 text-red-700 border-0 text-xs">Behind</Badge>;
    switch (status) {
      case "active": return <Badge className="bg-[hsl(179,100%,39%)]/10 text-[hsl(179,100%,39%)] border-0 text-xs">Active</Badge>;
      case "completed": return <Badge className="bg-green-100 text-green-700 border-0 text-xs">Completed</Badge>;
      case "paused": return <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">Paused</Badge>;
      default: return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  return (
    <tr className="border-b hover:bg-gray-50/50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={s.profileImagePath || ""} />
            <AvatarFallback className="bg-[hsl(179,100%,39%)]/10 text-[hsl(179,100%,39%)] text-xs">
              {s.firstName?.[0]}{s.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{s.firstName} {s.lastName}</p>
            <p className="text-xs text-gray-500">{s.position || "—"}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">{s.department || "—"}</td>
      <td className="py-3 px-4 text-sm text-gray-600">{format(new Date(instance.startDate), "MMM d, yyyy")}</td>
      <td className="py-3 px-4 w-48">
        <OnboardingProgressBar percent={p.percentComplete} />
        <p className="text-xs text-gray-500 mt-1">
          {p.completedRequiredItems} of {p.requiredItems} required · {p.percentComplete}%
        </p>
      </td>
      <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
        Day {p.currentDay} of {instance.totalDays}
        {p.currentDay >= instance.totalDays && status === "completed" && (
          <span className="text-xs text-green-600 ml-1">(Complete)</span>
        )}
      </td>
      <td className="py-3 px-4">{statusBadge()}</td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm"
            className="border-[hsl(179,100%,39%)] text-[hsl(179,100%,39%)] hover:bg-[hsl(179,100%,39%)]/10 text-xs h-7"
            onClick={() => onViewDetails(instance.id)}>
            View Details
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {status === "active" && (
                <DropdownMenuItem onClick={() => onStatusChange(instance.id, "paused")}>
                  <Pause className="h-4 w-4 mr-2" /> Pause Onboarding
                </DropdownMenuItem>
              )}
              {status === "paused" && (
                <DropdownMenuItem onClick={() => onStatusChange(instance.id, "active")}>
                  <Play className="h-4 w-4 mr-2" /> Resume Onboarding
                </DropdownMenuItem>
              )}
              {status !== "completed" && (
                <DropdownMenuItem onClick={() => onStatusChange(instance.id, "completed")}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Mark as Complete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}
