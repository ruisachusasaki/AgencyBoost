import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Pen, Type } from "lucide-react";

interface SignaturePayload {
  signatureType: "drawn" | "typed";
  signatureData: string;
  signerName: string;
  signerEmail: string;
}

interface SignatureCaptureProps {
  onSign: (data: SignaturePayload) => void;
  isLoading: boolean;
  defaultName?: string;
  defaultEmail?: string;
}

export default function SignatureCapture({ onSign, isLoading, defaultName, defaultEmail }: SignatureCaptureProps) {
  const [signerName, setSignerName] = useState(defaultName || "");
  const [signerEmail, setSignerEmail] = useState(defaultEmail || "");
  const [signatureType, setSignatureType] = useState<"drawn" | "typed">("drawn");
  const [typedSignature, setTypedSignature] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (defaultName && !signerName) setSignerName(defaultName);
    if (defaultEmail && !signerEmail) setSignerEmail(defaultEmail);
  }, [defaultName, defaultEmail]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "hsl(179, 100%, 39%)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  useEffect(() => {
    if (signatureType === "drawn") {
      setTimeout(initCanvas, 50);
    }
  }, [signatureType, initCanvas]);

  const drawWatermark = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || hasDrawn) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.fillStyle = "#d1d5db";
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Sign here", canvas.width / 2, canvas.height / 2);
    ctx.restore();
  }, [hasDrawn]);

  useEffect(() => {
    if (signatureType === "drawn" && !hasDrawn) {
      setTimeout(drawWatermark, 100);
    }
  }, [signatureType, hasDrawn, drawWatermark]);

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!hasDrawn) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        initCanvas();
      }
      setHasDrawn(true);
    }
    isDrawingRef.current = true;
    lastPosRef.current = getCanvasPos(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPosRef.current = pos;
  };

  const stopDraw = () => { isDrawingRef.current = false; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawn(false);
  };

  const switchTab = (type: "drawn" | "typed") => {
    setSignatureType(type);
    setTypedSignature("");
    setHasDrawn(false);
    if (type === "drawn") {
      setTimeout(() => {
        clearCanvas();
        initCanvas();
      }, 100);
    }
  };

  const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isFormValid =
    signerName.trim() &&
    signerEmail.trim() &&
    isEmailValid(signerEmail) &&
    agreedToTerms &&
    (signatureType === "typed" ? typedSignature.trim() : hasDrawn);

  const handleSubmit = () => {
    if (!isFormValid) return;
    const signatureData =
      signatureType === "typed"
        ? typedSignature.trim()
        : canvasRef.current?.toDataURL("image/png") || "";
    onSign({
      signatureType,
      signatureData,
      signerName: signerName.trim(),
      signerEmail: signerEmail.trim(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="signer-name">Full Name <span className="text-red-500">*</span></Label>
          <Input
            id="signer-name"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="Enter your full legal name"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="signer-email">Email Address <span className="text-red-500">*</span></Label>
          <Input
            id="signer-email"
            type="email"
            value={signerEmail}
            onChange={(e) => setSignerEmail(e.target.value)}
            placeholder="Enter your email address"
            className="mt-1.5"
          />
          {signerEmail && !isEmailValid(signerEmail) && (
            <p className="text-xs text-red-500 mt-1">Please enter a valid email address</p>
          )}
        </div>
      </div>

      <div>
        <Label className="mb-3 block">Signature <span className="text-red-500">*</span></Label>
        <div className="flex gap-1 mb-4">
          <button
            onClick={() => switchTab("drawn")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              signatureType === "drawn"
                ? "bg-[hsl(179,100%,39%)] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Pen className="h-3.5 w-3.5" /> Draw Signature
          </button>
          <button
            onClick={() => switchTab("typed")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              signatureType === "typed"
                ? "bg-[hsl(179,100%,39%)] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Type className="h-3.5 w-3.5" /> Type Signature
          </button>
        </div>

        {signatureType === "drawn" ? (
          <div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white relative overflow-hidden">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="w-full cursor-crosshair touch-none"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
              />
            </div>
            <div className="flex justify-end mt-2">
              <Button variant="ghost" size="sm" onClick={clearCanvas} className="text-xs text-gray-500">
                Clear
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Input
              value={typedSignature}
              onChange={(e) => setTypedSignature(e.target.value)}
              placeholder="Type your full name"
              className="text-lg"
              style={{ fontFamily: "'Dancing Script', cursive" }}
            />
            {typedSignature && (
              <div className="mt-3 bg-gray-50 border rounded-lg p-6 text-center">
                <p
                  className="text-3xl text-gray-800"
                  style={{ fontFamily: "'Dancing Script', cursive" }}
                >
                  {typedSignature}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
        <Checkbox
          id="agree-terms"
          checked={agreedToTerms}
          onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
          className="mt-0.5"
        />
        <label htmlFor="agree-terms" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
          I have read and agree to the terms of this Independent Contractor Agreement.
          I understand that my electronic signature is legally binding.
        </label>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!isFormValid || isLoading}
        className="w-full bg-[hsl(179,100%,39%)] hover:bg-[hsl(179,100%,32%)] text-white py-6 text-lg font-semibold"
      >
        {isLoading && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
        Sign Agreement
      </Button>
    </div>
  );
}
