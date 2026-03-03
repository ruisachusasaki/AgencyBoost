import { useState, useRef, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle, FileText, CreditCard, Building, Pen,
  Shield, Loader2, AlertCircle, ChevronDown, ChevronUp
} from "lucide-react";

type ProposalStep = "review" | "sign" | "pay" | "complete";

export default function PublicProposal() {
  const { token } = useParams<{ token: string }>();
  const [currentStep, setCurrentStep] = useState<ProposalStep>("review");
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [signatureMode, setSignatureMode] = useState<"type" | "draw">("type");
  const [typedSignature, setTypedSignature] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ach" | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data, isLoading, error, refetch } = useQuery<any>({
    queryKey: ["/api/proposals/public", token],
    queryFn: async () => {
      const res = await fetch(`/api/proposals/public/${token}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to load proposal");
      }
      return res.json();
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (data?.proposal?.status === "completed") {
      setCurrentStep("complete");
    } else if (data?.proposal?.status === "signed" || data?.proposal?.status === "payment_pending") {
      setCurrentStep("pay");
    } else if (data?.proposal?.signedAt) {
      setCurrentStep("pay");
    }
  }, [data]);

  const signMutation = useMutation({
    mutationFn: async (signData: any) => {
      const res = await fetch(`/api/proposals/public/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      refetch();
      setCurrentStep("pay");
    },
  });

  const payMutation = useMutation({
    mutationFn: async (payData: any) => {
      const res = await fetch(`/api/proposals/public/${token}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: async (result) => {
      if (result.clientSecret && data?.stripePublishableKey) {
        const { loadStripe } = await import("@stripe/stripe-js");
        const stripe = await loadStripe(data.stripePublishableKey);
        if (stripe) {
          if (paymentMethod === "card") {
            const { error } = await stripe.confirmCardPayment(result.clientSecret, {
              payment_method: {
                card: cardElement!,
                billing_details: { name: signerName, email: signerEmail },
              },
            });
            if (error) {
              alert(error.message);
            } else {
              setCurrentStep("complete");
              refetch();
            }
          } else {
            const { error } = await stripe.confirmUsBankAccountPayment(result.clientSecret, {
              payment_method: {
                us_bank_account: {},
                billing_details: { name: signerName, email: signerEmail },
              },
            });
            if (error) {
              alert(error.message);
            } else {
              setCurrentStep("complete");
              refetch();
            }
          }
        }
      }
    },
  });

  let cardElement: any = null;

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  useEffect(() => {
    if (signatureMode === "draw" && canvasRef.current) {
      initCanvas();
    }
  }, [signatureMode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getSignatureData = (): string => {
    if (signatureMode === "type") return `typed:${typedSignature}`;
    if (canvasRef.current) return canvasRef.current.toDataURL();
    return "";
  };

  const handleSign = () => {
    const signatureData = getSignatureData();
    if (!signerName || !signerEmail) {
      alert("Please enter your name and email");
      return;
    }
    if (signatureMode === "type" && !typedSignature) {
      alert("Please type your signature");
      return;
    }
    if (!termsAccepted) {
      alert("You must accept the Terms & Conditions");
      return;
    }
    signMutation.mutate({ signerName, signerEmail, signatureData, termsAccepted });
  };

  const handlePay = () => {
    if (!paymentMethod) {
      alert("Please select a payment method");
      return;
    }
    payMutation.mutate({ paymentMethod });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#00C9C6]" />
          <p className="text-gray-600">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Unable to Load Proposal</h2>
            <p className="text-gray-600">{(error as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const proposal = data?.proposal;
  const quote = data?.quote;
  const items = data?.items || [];
  const terms = data?.terms;
  const paymentAmountValue = data?.paymentAmount || 0;

  const steps = [
    { id: "review", label: "Review", icon: FileText },
    { id: "sign", label: "Sign", icon: Pen },
    { id: "pay", label: "Pay", icon: CreditCard },
    { id: "complete", label: "Done", icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#00C9C6] flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{quote?.name || "Proposal"}</h1>
              {data?.clientName && <p className="text-sm text-gray-500">Prepared for {data.clientName}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center mb-8 gap-0">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = steps.findIndex(s => s.id === currentStep) > i;
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCompleted ? "bg-green-500 text-white" :
                    isActive ? "bg-[#00C9C6] text-white shadow-lg shadow-[#00C9C6]/30" :
                    "bg-gray-200 text-gray-500"
                  }`}>
                    {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${isActive ? "text-[#00C9C6]" : isCompleted ? "text-green-600" : "text-gray-400"}`}>
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-16 sm:w-24 h-0.5 mx-2 mt-[-12px] ${isCompleted ? "bg-green-500" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {currentStep === "review" && (
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-[#00C9C6] to-[#00A8A6] p-6 text-white">
                <h2 className="text-2xl font-bold">Proposal Summary</h2>
                <p className="opacity-90 mt-1">Review the services and pricing below</p>
              </div>
              <CardContent className="p-6">
                {items.length > 0 ? (
                  <div className="space-y-4">
                    {items.map((item: any, index: number) => (
                      <div key={item.id || index} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.itemName || item.notes || `${item.itemType} Item`}</div>
                          {item.itemDescription && (
                            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{item.itemDescription}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="capitalize text-xs">{item.itemType}</Badge>
                            {item.quantity > 1 && <span className="text-xs text-gray-500">Qty: {item.quantity}</span>}
                          </div>
                        </div>
                        <div className="text-right pl-4">
                          <div className="font-semibold text-gray-900">${parseFloat(item.totalCost || "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-4 border-t-2">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-2xl font-bold text-[#00C9C6]">
                        ${paymentAmountValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No items in this proposal</p>
                )}
              </CardContent>
            </Card>

            {quote?.notes && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{quote.notes}</p>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => setCurrentStep("sign")}
                className="bg-[#00C9C6] hover:bg-[#00A8A6] text-white px-8 py-3 text-lg"
                size="lg"
              >
                Continue to Sign
              </Button>
            </div>
          </div>
        )}

        {currentStep === "sign" && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-6">
                <h2 className="text-xl font-bold">Sign This Proposal</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="signer-name">Your Full Name *</Label>
                    <Input id="signer-name" value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="John Smith" />
                  </div>
                  <div>
                    <Label htmlFor="signer-email">Your Email *</Label>
                    <Input id="signer-email" type="email" value={signerEmail} onChange={(e) => setSignerEmail(e.target.value)} placeholder="john@company.com" />
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Signature *</Label>
                  <div className="flex gap-2 mb-3">
                    <Button
                      variant={signatureMode === "type" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSignatureMode("type")}
                      className={signatureMode === "type" ? "bg-[#00C9C6] hover:bg-[#00A8A6]" : ""}
                    >
                      Type
                    </Button>
                    <Button
                      variant={signatureMode === "draw" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSignatureMode("draw")}
                      className={signatureMode === "draw" ? "bg-[#00C9C6] hover:bg-[#00A8A6]" : ""}
                    >
                      Draw
                    </Button>
                  </div>

                  {signatureMode === "type" ? (
                    <div>
                      <Input
                        value={typedSignature}
                        onChange={(e) => setTypedSignature(e.target.value)}
                        placeholder="Type your full name as signature"
                        className="text-lg"
                      />
                      {typedSignature && (
                        <div className="mt-3 p-4 border rounded-lg bg-gray-50">
                          <p className="text-2xl font-signature text-gray-800" style={{ fontFamily: "'Caveat', cursive" }}>
                            {typedSignature}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="border rounded-lg bg-white relative">
                        <canvas
                          ref={canvasRef}
                          width={500}
                          height={150}
                          className="w-full cursor-crosshair touch-none"
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                        />
                      </div>
                      <Button variant="ghost" size="sm" onClick={clearCanvas} className="mt-1 text-xs">
                        Clear
                      </Button>
                    </div>
                  )}
                </div>

                {terms && (
                  <div className="border rounded-lg">
                    <button
                      onClick={() => setShowTerms(!showTerms)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-[#00C9C6]" />
                        <span className="font-medium">{terms.title || "Terms & Conditions"}</span>
                      </div>
                      {showTerms ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {showTerms && (
                      <div className="border-t p-4 max-h-64 overflow-y-auto">
                        <div className="prose prose-sm max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: terms.content }} />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms-checkbox"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="terms-checkbox" className="text-sm text-gray-600 cursor-pointer leading-relaxed">
                    I have read and agree to the {terms ? terms.title : "Terms & Conditions"}. I authorize this electronic signature as my binding signature.
                  </Label>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep("review")}>Back</Button>
                  <Button
                    onClick={handleSign}
                    className="bg-[#00C9C6] hover:bg-[#00A8A6] text-white px-8"
                    disabled={signMutation.isPending}
                  >
                    {signMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing...</>
                    ) : (
                      <><Pen className="h-4 w-4 mr-2" /> Sign Proposal</>
                    )}
                  </Button>
                </div>

                {signMutation.isError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                    {(signMutation.error as Error).message}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === "pay" && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                    <CheckCircle className="h-4 w-4" />
                    Proposal Signed Successfully
                  </div>
                  <h2 className="text-xl font-bold">Complete Payment</h2>
                  <p className="text-gray-500 mt-1">
                    Amount due: <span className="text-2xl font-bold text-[#00C9C6]">${paymentAmountValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </p>
                </div>

                {!data?.stripeConfigured ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm text-center">
                    <AlertCircle className="h-5 w-5 mx-auto mb-2" />
                    Payment processing is currently being set up. Please contact us to arrange payment.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => setPaymentMethod("card")}
                        className={`p-6 rounded-xl border-2 text-left transition-all ${
                          paymentMethod === "card"
                            ? "border-[#00C9C6] bg-[#00C9C6]/5 shadow-md"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <CreditCard className={`h-8 w-8 mb-3 ${paymentMethod === "card" ? "text-[#00C9C6]" : "text-gray-400"}`} />
                        <div className="font-semibold">Credit / Debit Card</div>
                        <p className="text-sm text-gray-500 mt-1">Pay instantly with your card</p>
                      </button>
                      <button
                        onClick={() => setPaymentMethod("ach")}
                        className={`p-6 rounded-xl border-2 text-left transition-all ${
                          paymentMethod === "ach"
                            ? "border-[#00C9C6] bg-[#00C9C6]/5 shadow-md"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Building className={`h-8 w-8 mb-3 ${paymentMethod === "ach" ? "text-[#00C9C6]" : "text-gray-400"}`} />
                        <div className="font-semibold">Bank Transfer (ACH)</div>
                        <p className="text-sm text-gray-500 mt-1">Pay directly from your bank account</p>
                      </button>
                    </div>

                    {paymentMethod && (
                      <div className="border rounded-lg p-6 bg-gray-50">
                        <p className="text-sm text-gray-600 text-center mb-4">
                          {paymentMethod === "card"
                            ? "You'll be prompted to enter your card details securely via Stripe."
                            : "You'll be prompted to connect your bank account securely via Stripe."}
                        </p>
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-4">
                          <Shield className="h-3 w-3" />
                          Secured by Stripe. Your payment information is encrypted.
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button
                        onClick={handlePay}
                        className="bg-[#00C9C6] hover:bg-[#00A8A6] text-white px-8"
                        disabled={!paymentMethod || payMutation.isPending}
                        size="lg"
                      >
                        {payMutation.isPending ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                        ) : (
                          <>Pay ${paymentAmountValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</>
                        )}
                      </Button>
                    </div>

                    {payMutation.isError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                        {(payMutation.error as Error).message}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === "complete" && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Thank You!</h2>
            <p className="text-lg text-gray-600 mb-2">Your proposal has been signed and payment has been received.</p>
            <p className="text-gray-500">We'll be in touch shortly to get started on your project.</p>
            <div className="mt-8 inline-flex items-center gap-2 bg-gray-100 rounded-full px-6 py-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-gray-700">Confirmation sent to {proposal?.signedByEmail || signerEmail}</span>
            </div>
          </div>
        )}
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap" rel="stylesheet" />
    </div>
  );
}
