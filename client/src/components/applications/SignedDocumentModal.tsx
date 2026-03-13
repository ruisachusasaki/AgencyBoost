import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Printer, CheckCircle, Shield } from "lucide-react";

interface SignedDocumentModalProps {
  open: boolean;
  onClose: () => void;
  applicationId: string;
}

export default function SignedDocumentModal({ open, onClose, applicationId }: SignedDocumentModalProps) {
  const docQuery = useQuery<any>({
    queryKey: [`/api/applications/${applicationId}/offer/signed-document`],
    enabled: open,
  });

  const handlePrint = () => {
    window.print();
  };

  const doc = docQuery.data;
  const sig = doc?.signature;
  const offer = doc?.offer;
  const applicant = doc?.applicant;

  const compTypeLabel = offer?.compensationType === "per_hour" ? "per hour" : offer?.compensationType === "per_month" ? "per month" : "flat rate";
  const signedAtFormatted = sig?.signedAt
    ? new Date(sig.signedAt).toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })
    : "";
  const signedDateOnly = sig?.signedAt
    ? new Date(sig.signedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[900px] max-h-[95vh] overflow-y-auto print-content">
        <DialogHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Signed IC Agreement — {applicant?.name || "Contractor"}</DialogTitle>
              <DialogDescription>
                {sig ? `Signed ${signedAtFormatted}` : "Loading..."}
              </DialogDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer className="h-4 w-4" />
              Print / Save as PDF
            </Button>
          </div>
        </DialogHeader>

        {docQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[hsl(179,100%,39%)]" />
          </div>
        ) : docQuery.error ? (
          <div className="py-12 text-center text-red-500">Failed to load signed document.</div>
        ) : doc ? (
          <div className="space-y-6 mt-2">
            <div className="bg-[hsl(179,100%,39%)]/10 border border-[hsl(179,100%,39%)]/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-[hsl(179,100%,39%)] mt-0.5 shrink-0" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Agreement signed by {sig?.signerName} ({sig?.signerEmail})
                  </p>
                  <p className="text-gray-600">Signed at: {signedAtFormatted}</p>
                  <p className="text-gray-600">IP Address: {sig?.ipAddress || "Not recorded"}</p>
                  <p className="text-gray-600">Signature type: {sig?.signatureType === "drawn" ? "Drawn" : "Typed"}</p>
                </div>
              </div>
            </div>

            <div
              className="prose prose-sm max-w-none bg-white p-8 rounded-lg border"
              dangerouslySetInnerHTML={{ __html: doc.populatedContent || "" }}
            />

            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Signature</h3>
              {sig?.signatureType === "drawn" ? (
                <div className="inline-block">
                  <img
                    src={sig.signatureData}
                    alt="Drawn signature"
                    className="max-w-[300px] border-b border-gray-400 pb-1"
                  />
                </div>
              ) : (
                <p
                  className="text-3xl text-gray-800 border-b border-gray-400 pb-1 inline-block"
                  style={{ fontFamily: "'Dancing Script', cursive" }}
                >
                  {sig?.signatureData}
                </p>
              )}
              <div className="mt-2 text-sm text-gray-600">
                <p>{sig?.signerName}</p>
                <p>Date: {signedDateOnly}</p>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
