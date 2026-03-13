import { CheckCircle, Calendar } from "lucide-react";

interface SigningCompleteProps {
  signerName?: string;
  startDate?: string;
  alreadySigned?: boolean;
}

export default function SigningComplete({ signerName, startDate, alreadySigned }: SigningCompleteProps) {
  const formattedDate = startDate
    ? new Date(startDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-[560px] w-full text-center py-16">
        <CheckCircle className="h-16 w-16 text-[hsl(179,100%,39%)] mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Agreement Signed!</h1>
        <p className="text-gray-600 mb-6">
          {alreadySigned ? (
            "You have already signed this agreement."
          ) : (
            <>
              Thank you, <strong>{signerName || "there"}</strong>. Your Independent Contractor Agreement has been
              successfully signed and recorded. You will hear from your hiring manager soon with next steps.
            </>
          )}
        </p>

        {formattedDate && (
          <div className="bg-[hsl(179,100%,39%)]/10 border border-[hsl(179,100%,39%)]/20 rounded-lg p-4 mb-6 inline-flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[hsl(179,100%,39%)]" />
            <span className="text-sm font-medium">Your start date is {formattedDate}</span>
          </div>
        )}

        <p className="text-sm text-gray-400">
          A copy of this agreement is on file with The Media Optimizers.
          If you need a copy for your records, please contact your hiring manager.
        </p>
      </div>
    </div>
  );
}
