import { CheckCircle, XCircle, AlertCircle, Clock, FileCheck, UserCheck, Briefcase } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface StatusTooltipProps {
  type: "time-off-status" | "application-stage";
  status: string;
  children: React.ReactNode;
}

export function StatusTooltip({ type, status, children }: StatusTooltipProps) {
  const getTooltipContent = () => {
    if (type === "time-off-status") {
      switch (status) {
        case "pending":
          return (
            <div className="max-w-sm">
              <div className="font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                Pending Review
              </div>
              <div className="space-y-2 text-sm">
                <p>This time off request is waiting for manager approval.</p>
                <div className="bg-yellow-50 p-2 rounded border">
                  <p className="text-xs font-medium">What happens next:</p>
                  <ul className="text-xs mt-1 space-y-1">
                    <li>• Manager will review the request</li>
                    <li>• Employee will be notified of decision</li>
                    <li>• Days will be deducted upon approval</li>
                  </ul>
                </div>
                <p className="text-xs text-slate-500">
                  Pending requests do not affect your current available balance until approved.
                </p>
              </div>
            </div>
          );
        
        case "approved":
          return (
            <div className="max-w-sm">
              <div className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Approved
              </div>
              <div className="space-y-2 text-sm">
                <p>This time off request has been approved by the manager.</p>
                <div className="bg-green-50 p-2 rounded border">
                  <p className="text-xs font-medium">Status details:</p>
                  <ul className="text-xs mt-1 space-y-1">
                    <li>• Days have been deducted from balance</li>
                    <li>• Employee has been notified</li>
                    <li>• Time off is scheduled and confirmed</li>
                  </ul>
                </div>
                <p className="text-xs text-slate-500">
                  Approved time off is reflected in the employee's remaining balance.
                </p>
              </div>
            </div>
          );
        
        case "rejected":
          return (
            <div className="max-w-sm">
              <div className="font-medium mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                Rejected
              </div>
              <div className="space-y-2 text-sm">
                <p>This time off request was not approved by the manager.</p>
                <div className="bg-red-50 p-2 rounded border">
                  <p className="text-xs font-medium">Status details:</p>
                  <ul className="text-xs mt-1 space-y-1">
                    <li>• No days deducted from balance</li>
                    <li>• Employee notified with reason</li>
                    <li>• Can resubmit with changes if needed</li>
                  </ul>
                </div>
                <p className="text-xs text-slate-500">
                  Rejected requests do not affect the employee's time off balance.
                </p>
              </div>
            </div>
          );
        
        default:
          return <div className="text-sm">Time off status information</div>;
      }
    }

    if (type === "application-stage") {
      switch (status) {
        case "applied":
          return (
            <div className="max-w-sm">
              <div className="font-medium mb-2 flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-blue-600" />
                Application Received
              </div>
              <div className="space-y-2 text-sm">
                <p>The candidate has submitted their application and it's under initial review.</p>
                <div className="bg-blue-50 p-2 rounded border">
                  <p className="text-xs font-medium">Next steps:</p>
                  <ul className="text-xs mt-1 space-y-1">
                    <li>• HR will review application materials</li>
                    <li>• Initial qualification screening</li>
                    <li>• Progress to next stage if suitable</li>
                  </ul>
                </div>
              </div>
            </div>
          );
        
        case "screening":
          return (
            <div className="max-w-sm">
              <div className="font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                Screening Phase
              </div>
              <div className="space-y-2 text-sm">
                <p>HR is conducting initial screening to assess basic qualifications and fit.</p>
                <div className="bg-yellow-50 p-2 rounded border">
                  <p className="text-xs font-medium">Current activities:</p>
                  <ul className="text-xs mt-1 space-y-1">
                    <li>• Phone or video screening call</li>
                    <li>• Basic qualification verification</li>
                    <li>• Cultural fit assessment</li>
                  </ul>
                </div>
              </div>
            </div>
          );
        
        case "interview":
          return (
            <div className="max-w-sm">
              <div className="font-medium mb-2 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-purple-600" />
                Interview Stage
              </div>
              <div className="space-y-2 text-sm">
                <p>Candidate is progressing through the interview process with the hiring team.</p>
                <div className="bg-purple-50 p-2 rounded border">
                  <p className="text-xs font-medium">Interview process:</p>
                  <ul className="text-xs mt-1 space-y-1">
                    <li>• Technical or behavioral interviews</li>
                    <li>• Team fit assessment</li>
                    <li>• Skills evaluation</li>
                  </ul>
                </div>
              </div>
            </div>
          );
        
        case "offer":
          return (
            <div className="max-w-sm">
              <div className="font-medium mb-2 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-green-600" />
                Offer Extended
              </div>
              <div className="space-y-2 text-sm">
                <p>An employment offer has been extended to the candidate.</p>
                <div className="bg-green-50 p-2 rounded border">
                  <p className="text-xs font-medium">Offer stage:</p>
                  <ul className="text-xs mt-1 space-y-1">
                    <li>• Formal offer letter sent</li>
                    <li>• Awaiting candidate response</li>
                    <li>• Negotiation may be in progress</li>
                  </ul>
                </div>
              </div>
            </div>
          );
        
        case "hired":
          return (
            <div className="max-w-sm">
              <div className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Successfully Hired
              </div>
              <div className="space-y-2 text-sm">
                <p>Candidate has accepted the offer and joined the company.</p>
                <div className="bg-green-50 p-2 rounded border">
                  <p className="text-xs font-medium">Completion:</p>
                  <ul className="text-xs mt-1 space-y-1">
                    <li>• Offer accepted and signed</li>
                    <li>• Onboarding process initiated</li>
                    <li>• Position filled successfully</li>
                  </ul>
                </div>
              </div>
            </div>
          );
        
        case "rejected":
          return (
            <div className="max-w-sm">
              <div className="font-medium mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                Application Declined
              </div>
              <div className="space-y-2 text-sm">
                <p>The candidate was not selected for this position.</p>
                <div className="bg-red-50 p-2 rounded border">
                  <p className="text-xs font-medium">Outcome:</p>
                  <ul className="text-xs mt-1 space-y-1">
                    <li>• Not a fit for current role</li>
                    <li>• Candidate notified professionally</li>
                    <li>• May be considered for future openings</li>
                  </ul>
                </div>
              </div>
            </div>
          );
        
        default:
          return <div className="text-sm">Application status information</div>;
      }
    }

    return <div className="text-sm">Status information</div>;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help" data-testid={`status-tooltip-${type}-${status}`}>
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm">
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}