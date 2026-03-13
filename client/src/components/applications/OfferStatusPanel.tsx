import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Copy, Check, RefreshCw, Loader2, FileText } from "lucide-react";

interface OfferStatusPanelProps {
  applicationId: string;
  applicantEmail: string;
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getCompTypeLabel(type: string) {
  switch (type) {
    case "per_hour": return "per hour";
    case "per_month": return "per month";
    case "flat_rate": return "flat rate";
    default: return type;
  }
}

export default function OfferStatusPanel({ applicationId, applicantEmail }: OfferStatusPanelProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [showResendConfirm, setShowResendConfirm] = useState(false);

  const offerQuery = useQuery<any>({
    queryKey: [`/api/applications/${applicationId}/offer`],
  });

  const resendMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/applications/${applicationId}/resend-offer`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [`/api/applications/${applicationId}/offer`] });
      toast({ title: "Email resent successfully" });
      setShowResendConfirm(false);
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Failed to resend", description: err.message || "Something went wrong" });
    },
  });

  const offer = offerQuery.data?.offer;
  if (!offer) return null;

  const signingUrl = offerQuery.data?.signingUrl;
  const signature = offerQuery.data?.signature;
  const statusLog = offerQuery.data?.statusLog || [];

  const handleCopy = () => {
    if (signingUrl) {
      navigator.clipboard.writeText(signingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const statusBadge = () => {
    switch (offer.status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Awaiting Signature</Badge>;
      case "signed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Offer Accepted ✓</Badge>;
      case "declined":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Offer Declined</Badge>;
      default:
        return <Badge variant="secondary">{offer.status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            IC Agreement
          </span>
          {statusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Compensation</p>
            <p className="font-medium">{offer.compensation} {getCompTypeLabel(offer.compensationType)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Start Date</p>
            <p className="font-medium">{new Date(offer.startDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Sent</p>
            <p className="font-medium">{offer.sentAt ? formatRelativeTime(offer.sentAt) : "—"}</p>
          </div>
          {signature && (
            <div>
              <p className="text-muted-foreground text-xs">Signed At</p>
              <p className="font-medium">{new Date(signature.signedAt).toLocaleString()}</p>
            </div>
          )}
        </div>

        {offer.status === "pending" && signingUrl && (
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-xs font-medium">Signing Link</Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={signingUrl} className="text-xs font-mono h-8" />
              <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0 h-8">
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowResendConfirm(true)}
              disabled={resendMutation.isPending}
            >
              {resendMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
              )}
              Resend Email
            </Button>
          </div>
        )}

        {statusLog.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Status Timeline</p>
            <div className="space-y-0">
              {statusLog.map((entry: any, i: number) => (
                <div key={entry.id} className="flex items-start gap-2 relative">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-[hsl(179,100%,39%)] mt-1.5 shrink-0" />
                    {i < statusLog.length - 1 && <div className="w-px h-full bg-border min-h-[20px]" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-xs font-medium">{entry.note || entry.status}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {entry.changedByName || "Applicant"} · {formatRelativeTime(entry.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <AlertDialog open={showResendConfirm} onOpenChange={setShowResendConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resend Signing Link</AlertDialogTitle>
            <AlertDialogDescription>
              Resend the signing link to {applicantEmail}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resendMutation.mutate()}
              className="bg-[hsl(179,100%,39%)] hover:bg-[hsl(179,100%,32%)] text-white"
            >
              Resend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
