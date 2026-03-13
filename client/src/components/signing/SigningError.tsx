import { AlertCircle } from "lucide-react";

interface SigningErrorProps {
  heading: string;
  message: string;
}

export default function SigningError({ heading, message }: SigningErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-[560px] w-full text-center py-16">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-3">{heading}</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <p className="text-sm text-gray-400">Contact your hiring manager for assistance.</p>
      </div>
    </div>
  );
}
