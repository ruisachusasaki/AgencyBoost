import { Info, HelpCircle, Calendar, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface PolicyTooltipProps {
  type: "vacation" | "sick" | "personal" | "calculation" | "policy-overview" | "remaining-balance";
  allocation?: number;
  used?: number;
  remaining?: number;
  children?: React.ReactNode;
  className?: string;
}

export function PolicyTooltip({ 
  type, 
  allocation, 
  used, 
  remaining, 
  children, 
  className = "" 
}: PolicyTooltipProps) {
  const getTooltipContent = () => {
    switch (type) {
      case "vacation":
        return (
          <div className="max-w-sm">
            <div className="font-medium mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Vacation Time Policy
            </div>
            <div className="space-y-2 text-sm">
              <p>Annual vacation allocation that can be used for planned time off, holidays, and personal activities.</p>
              {allocation && (
                <div className="bg-blue-50 p-2 rounded border">
                  <p><strong>Annual Allocation:</strong> {allocation} days</p>
                  <p className="text-xs text-slate-600 mt-1">Allocated at the beginning of each calendar year</p>
                </div>
              )}
              <p className="text-xs text-slate-500">
                • Requires advance approval from manager<br/>
                • Cannot exceed annual allocation<br/>
                • Unused days may not carry over (check company policy)
              </p>
            </div>
          </div>
        );
      
      case "sick":
        return (
          <div className="max-w-sm">
            <div className="font-medium mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Sick Time Policy
            </div>
            <div className="space-y-2 text-sm">
              <p>Time allocated for illness, medical appointments, and health-related absences.</p>
              {allocation && (
                <div className="bg-orange-50 p-2 rounded border">
                  <p><strong>Annual Allocation:</strong> {allocation} days</p>
                  <p className="text-xs text-slate-600 mt-1">Available for health-related absences</p>
                </div>
              )}
              <p className="text-xs text-slate-500">
                • Can be used for personal illness or family care<br/>
                • May require medical documentation for extended use<br/>
                • Some sick time may carry over year to year
              </p>
            </div>
          </div>
        );
      
      case "personal":
        return (
          <div className="max-w-sm">
            <div className="font-medium mb-2 flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Personal Time Policy
            </div>
            <div className="space-y-2 text-sm">
              <p>Flexible time off for personal matters, emergencies, or other non-vacation purposes.</p>
              {allocation && (
                <div className="bg-purple-50 p-2 rounded border">
                  <p><strong>Annual Allocation:</strong> {allocation} days</p>
                  <p className="text-xs text-slate-600 mt-1">For personal emergencies and matters</p>
                </div>
              )}
              <p className="text-xs text-slate-500">
                • Can be used for personal emergencies<br/>
                • Advance notice preferred when possible<br/>
                • Subject to manager approval
              </p>
            </div>
          </div>
        );
      
      case "calculation":
        return (
          <div className="max-w-sm">
            <div className="font-medium mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Time Off Calculation
            </div>
            <div className="space-y-2 text-sm">
              <p>How your time off balance is calculated:</p>
              <div className="bg-slate-50 p-3 rounded border font-mono text-xs">
                <p><strong>Remaining = Allocated - Used</strong></p>
                {allocation && used !== undefined && (
                  <div className="mt-2 space-y-1">
                    <p>Allocated: {allocation} days</p>
                    <p>Used: {used} days</p>
                    <p className="border-t pt-1">Remaining: {Math.max(0, allocation - used)} days</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500">
                • Balances reset annually on January 1st<br/>
                • Approved requests count against your balance<br/>
                • Pending requests do not affect current balance
              </p>
            </div>
          </div>
        );
      
      case "policy-overview":
        return (
          <div className="max-w-sm">
            <div className="font-medium mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              HR Time Off Policies
            </div>
            <div className="space-y-2 text-sm">
              <p>Company-wide time off policies that apply to all eligible employees.</p>
              <div className="bg-blue-50 p-2 rounded border">
                <p className="font-medium">Standard Allocations:</p>
                <ul className="text-xs mt-1 space-y-1">
                  <li>• Vacation: Based on tenure and role</li>
                  <li>• Sick: Health-related absences</li>
                  <li>• Personal: Emergency and personal matters</li>
                </ul>
              </div>
              <p className="text-xs text-slate-500">
                Policies are reviewed annually and may vary by department, role, or employment status. Contact HR for specific questions about your allocation.
              </p>
            </div>
          </div>
        );
      
      case "remaining-balance":
        return (
          <div className="max-w-sm">
            <div className="font-medium mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Remaining Balance Explanation
            </div>
            <div className="space-y-2 text-sm">
              <p>Your current available time off balance after subtracting used days from your annual allocation.</p>
              {allocation && used !== undefined && remaining !== undefined && (
                <div className="bg-green-50 p-2 rounded border">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="font-medium">Allocated:</p>
                      <p>{allocation} days</p>
                    </div>
                    <div>
                      <p className="font-medium">Used:</p>
                      <p>{used} days</p>
                    </div>
                  </div>
                  <div className="border-t mt-2 pt-2">
                    <p className="font-medium">Available: {remaining} days</p>
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-500">
                This includes all approved time off requests. Pending requests are not deducted from your available balance until approved.
              </p>
            </div>
          </div>
        );
      
      default:
        return <div>Policy information</div>;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className={`inline-flex items-center text-slate-400 hover:text-slate-600 transition-colors ${className}`} data-testid={`tooltip-${type}`}>
            {children || <Info className="h-4 w-4" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm">
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}