import { XCircle } from "lucide-react";

export default function SigningDeclined() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-[560px] w-full text-center py-16">
        <XCircle className="h-16 w-16 text-gray-400 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Offer Declined</h1>
        <p className="text-gray-600 mb-6">
          You have declined this offer. If this was a mistake or you would like to reconsider,
          please reach out to your hiring manager directly.
        </p>
        <p className="text-sm text-gray-400">The Media Optimizers team has been notified.</p>
      </div>
    </div>
  );
}
