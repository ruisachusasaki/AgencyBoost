import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ChevronDown, ChevronUp, AlertTriangle, Mail, Copy, Check } from "lucide-react";

interface SendOfferModalProps {
  open: boolean;
  onClose: () => void;
  application: {
    id: string;
    applicantName: string;
    applicantEmail: string;
    positionTitle: string;
  };
}

export default function SendOfferModal({ open, onClose, application }: SendOfferModalProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [compensation, setCompensation] = useState("");
  const [compensationType, setCompensationType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [customTerms, setCustomTerms] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [successResult, setSuccessResult] = useState<{ signingUrl: string; emailSent: boolean; warning?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const activeTemplateQuery = useQuery<any>({
    queryKey: ["/api/ic-agreement-templates/active"],
    enabled: open,
  });

  const hasActiveTemplate = !!activeTemplateQuery.data?.template;

  const sendOfferMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/applications/${application.id}/send-offer`, data),
    onSuccess: async (response) => {
      const result = await response.json();
      qc.invalidateQueries({ queryKey: ["/api/hr/job-applications", application.id] });
      qc.invalidateQueries({ queryKey: ["/api/hr/job-applications"] });
      qc.invalidateQueries({ queryKey: [`/api/applications/${application.id}/offer`] });
      toast({ title: `Offer sent to ${application.applicantName}` });
      setSuccessResult(result);
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Failed to send offer", description: err.message || "Something went wrong" });
    },
  });

  const handleSend = () => {
    if (!compensation.trim() || !compensationType || !startDate) return;
    sendOfferMutation.mutate({
      compensation: compensation.trim(),
      compensationType,
      startDate,
      customTerms: customTerms.trim() || null,
    });
  };

  const handleCopy = () => {
    if (successResult?.signingUrl) {
      navigator.clipboard.writeText(successResult.signingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setSuccessResult(null);
    setCompensation("");
    setCompensationType("");
    setStartDate("");
    setCustomTerms("");
    setShowPreview(false);
    onClose();
  };

  const isFormValid = compensation.trim() && compensationType && startDate && hasActiveTemplate;

  if (successResult) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-green-600">Offer Sent Successfully</DialogTitle>
            <DialogDescription>
              The IC Agreement has been sent to {application.applicantName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {!successResult.emailSent && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  {successResult.warning || "Email failed to send. Please share the link below manually."}
                </p>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium">Signing Link</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input
                  readOnly
                  value={successResult.signingUrl}
                  className="text-xs font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>

            <Button onClick={handleClose} className="w-full bg-[hsl(179,100%,39%)] hover:bg-[hsl(179,100%,32%)] text-white">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Offer to {application.applicantName}</DialogTitle>
          <DialogDescription>
            Complete the offer details below. The IC Agreement will be automatically populated and sent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="compensation">Compensation <span className="text-red-500">*</span></Label>
              <Input
                id="compensation"
                value={compensation}
                onChange={(e) => setCompensation(e.target.value)}
                placeholder="e.g. 5000 or 25"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="comp-type">Compensation Type <span className="text-red-500">*</span></Label>
              <Select value={compensationType} onValueChange={setCompensationType}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_hour">Per Hour</SelectItem>
                  <SelectItem value="per_month">Per Month</SelectItem>
                  <SelectItem value="flat_rate">Flat Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="start-date">Start Date <span className="text-red-500">*</span></Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This will be used as Day 1 of their onboarding checklist
            </p>
          </div>

          <div>
            <Label htmlFor="custom-terms">Additional Terms (optional)</Label>
            <Textarea
              id="custom-terms"
              value={customTerms}
              onChange={(e) => setCustomTerms(e.target.value)}
              placeholder="Any additional terms or conditions to include in the agreement..."
              rows={3}
              className="mt-1.5"
            />
          </div>

          <div className="border rounded-lg">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center justify-between w-full p-3 text-sm font-medium text-left hover:bg-muted/50 rounded-lg"
            >
              <span>Preview IC Agreement</span>
              {showPreview ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showPreview && (
              <div className="px-3 pb-3">
                {hasActiveTemplate ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">
                      This is the template that will be populated with the details above when sent.
                    </p>
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert p-4 bg-gray-50 dark:bg-gray-900 rounded-md max-h-64 overflow-y-auto text-xs"
                      dangerouslySetInnerHTML={{ __html: activeTemplateQuery.data.template.content }}
                    />
                  </>
                ) : (
                  <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      No active IC Agreement template found. Please configure one under Settings &gt; HR Settings &gt; IC Agreement before sending offers.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-[hsl(179,100%,39%)]/10 border border-[hsl(179,100%,39%)]/20">
            <Mail className="h-5 w-5 text-[hsl(179,100%,39%)] mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">
              The signing link will be automatically emailed to <strong>{application.applicantEmail}</strong>. You will also receive a copyable link after sending.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!isFormValid || sendOfferMutation.isPending}
              className="bg-[hsl(179,100%,39%)] hover:bg-[hsl(179,100%,32%)] text-white"
            >
              {sendOfferMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Send Offer & Agreement
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
