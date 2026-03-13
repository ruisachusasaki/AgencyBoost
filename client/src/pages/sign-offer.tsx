import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, AlertTriangle } from "lucide-react";
import SignatureCapture from "@/components/signing/SignatureCapture";
import SigningComplete from "@/components/signing/SigningComplete";
import SigningDeclined from "@/components/signing/SigningDeclined";
import SigningError from "@/components/signing/SigningError";

export default function SignOfferPage() {
  const { token } = useParams<{ token: string }>();
  const [signed, setSigned] = useState(false);
  const [signedName, setSignedName] = useState("");
  const [declined, setDeclined] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const offerQuery = useQuery<any>({
    queryKey: [`/api/sign-offer/${token}`],
    queryFn: async () => {
      const res = await fetch(`/api/sign-offer/${token}`);
      if (!res.ok) {
        if (res.status === 404) return { status: "not_found" };
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || "Failed to load");
      }
      return res.json();
    },
    retry: false,
  });

  const signMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/sign-offer/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to sign" }));
        throw new Error(err.error || "Failed to sign");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      setSignedName(variables.signerName);
      setSigned(true);
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/sign-offer/${token}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to decline" }));
        throw new Error(err.error || "Failed to decline");
      }
      return res.json();
    },
    onSuccess: () => {
      setDeclined(true);
      setShowDeclineDialog(false);
    },
  });

  const data = offerQuery.data;

  if (offerQuery.isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[hsl(179,100%,39%)]" />
        <p className="text-gray-500 text-sm">Loading your agreement...</p>
      </div>
    );
  }

  if (offerQuery.error) {
    return <SigningError heading="Something Went Wrong" message={(offerQuery.error as Error).message} />;
  }

  if (data?.status === "not_found") {
    return (
      <SigningError
        heading="Link Not Found"
        message="This signing link is invalid or has been removed. Please contact your hiring manager."
      />
    );
  }

  if (data?.status === "expired") {
    return (
      <SigningError
        heading="Link Expired"
        message="This signing link has expired. Please contact your hiring manager to request a new one."
      />
    );
  }

  if (data?.status === "already_signed" || signed) {
    return (
      <SigningComplete
        signerName={signedName || data?.applicant?.name}
        startDate={data?.offer?.startDate}
        alreadySigned={data?.status === "already_signed" && !signed}
      />
    );
  }

  if (data?.status === "already_declined" || declined) {
    return <SigningDeclined />;
  }

  if (data?.status !== "pending") {
    return <SigningError heading="Unexpected State" message="Unable to load this agreement." />;
  }

  const offer = data.offer;
  const applicant = data.applicant;
  const compTypeLabel = offer.compensationType === "per_hour" ? "per hour" : offer.compensationType === "per_month" ? "per month" : "flat rate";
  const formattedStartDate = new Date(offer.startDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const formattedSentAt = offer.sentAt
    ? new Date(offer.sentAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet" />

      <header className="bg-white border-b px-4 py-4">
        <div className="max-w-[860px] mx-auto flex items-center justify-between">
          <span className="font-bold text-lg text-[hsl(179,100%,39%)]">The Media Optimizers</span>
          <span className="text-sm text-gray-500">
            Signing as: <strong>{applicant.name}</strong> — {applicant.position}
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-[860px] w-full mx-auto px-4 py-8 space-y-8">
        <div className="bg-white rounded-xl border shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Independent Contractor Agreement</h1>
          <p className="text-gray-600 mb-4">
            Please read the agreement below carefully before signing. By signing you confirm you have read,
            understood, and agree to all terms.
          </p>
          <p className="text-sm text-gray-400">
            Sent by The Media Optimizers
            {formattedSentAt && ` · ${formattedSentAt}`}
          </p>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-8 sm:p-10">
          <div
            className="prose prose-base max-w-none"
            style={{ lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: offer.populatedContent }}
          />
          <div className="border-t mt-8 pt-4 text-center text-sm text-gray-400">
            — End of Agreement —
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign Agreement</h2>

          {signMutation.error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-6">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{(signMutation.error as Error).message}</p>
            </div>
          )}

          <SignatureCapture
            onSign={(payload) => signMutation.mutate(payload)}
            isLoading={signMutation.isPending}
            defaultName={applicant.name}
            defaultEmail={applicant.email}
          />

          <div className="mt-6 pt-4 border-t text-center">
            <button
              onClick={() => setShowDeclineDialog(true)}
              className="text-sm text-red-500 hover:text-red-600 hover:underline"
            >
              I do not wish to accept this offer
            </button>
          </div>
        </div>
      </main>

      <footer className="border-t bg-white py-6 px-4 mt-auto">
        <div className="max-w-[860px] mx-auto text-center space-y-1">
          <p className="text-xs text-gray-400">
            This document was prepared by The Media Optimizers · Powered by AgencyBoost
          </p>
          <p className="text-xs text-gray-400">
            Your signature, IP address, and timestamp are recorded for verification purposes.
          </p>
        </div>
      </footer>

      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent className="max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Decline this offer?</DialogTitle>
            <DialogDescription>
              Are you sure you want to decline? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="decline-reason" className="text-sm">Reason for declining (optional)</Label>
            <Textarea
              id="decline-reason"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Let us know why you're declining..."
              rows={3}
              className="mt-1.5"
            />
          </div>
          {declineMutation.error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{(declineMutation.error as Error).message}</p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowDeclineDialog(false)}>Go Back</Button>
            <Button
              variant="destructive"
              onClick={() => declineMutation.mutate({ reason: declineReason.trim() || null })}
              disabled={declineMutation.isPending}
            >
              {declineMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Decline Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
