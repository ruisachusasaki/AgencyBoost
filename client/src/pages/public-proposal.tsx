import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Check, CheckCircle, FileText, CreditCard, Building, Pen,
  Shield, Loader2, AlertCircle, ChevronDown, ChevronUp,
  Calendar, Repeat, ChevronRight
} from "lucide-react";
import { loadStripe, type Stripe, type StripeElements } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

type ProposalStep = "review" | "sign" | "pay" | "complete";

function CollapsibleSection({ label, defaultOpen, brandColor, children }: { label: string; defaultOpen: boolean; brandColor: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-1 mb-3 hover:text-gray-900 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{label}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>
      {isOpen && children}
      {!isOpen && (
        <p className="text-xs text-gray-400 italic cursor-pointer" onClick={() => setIsOpen(true)}>Click to expand</p>
      )}
    </div>
  );
}

function CardPaymentForm({
  clientSecret,
  signerName,
  signerEmail,
  onSuccess,
  onError,
  amount,
  brandColor,
}: {
  clientSecret: string;
  signerName: string;
  signerEmail: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
  amount: number;
  brandColor: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardReady, setCardReady] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setProcessing(true);
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: { name: signerName, email: signerEmail },
      },
    });

    setProcessing(false);
    if (error) {
      if (error.message?.includes('No such payment_intent')) {
        onError("Payment session expired. Please re-select your payment method to try again.");
      } else {
        onError(error.message || "Payment failed");
      }
    } else if (paymentIntent?.status === "succeeded") {
      onSuccess();
    }
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-white">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#1a1a1a",
                "::placeholder": { color: "#9ca3af" },
                fontFamily: "system-ui, -apple-system, sans-serif",
              },
              invalid: { color: "#ef4444" },
            },
          }}
          onChange={(e) => setCardReady(e.complete)}
        />
      </div>
      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
        <Shield className="h-3 w-3" />
        Secured by Stripe. Your payment information is encrypted.
      </div>
      <Button
        onClick={handleSubmit}
        className="w-full text-white py-3 text-lg"
        style={{ backgroundColor: brandColor }}
        disabled={processing || !cardReady || !stripe}
        size="lg"
      >
        {processing ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing Payment...</>
        ) : (
          <>Pay ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</>
        )}
      </Button>
    </div>
  );
}

function darkenColor(hex: string, amount: number): string {
  let color = hex.replace('#', '');
  if (color.length === 3) color = color.split('').map(c => c + c).join('');
  if (color.length !== 6) return hex;
  const num = parseInt(color, 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xFF) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xFF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xFF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PublicProposal() {
  const { token } = useParams<{ token: string }>();
  const [currentStep, setCurrentStep] = useState<ProposalStep>("review");
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [hasExpandedTerms, setHasExpandedTerms] = useState(false);
  const [hasScrolledTerms, setHasScrolledTerms] = useState(false);
  const termsScrollRef = useRef<HTMLDivElement>(null);
  const [signatureMode, setSignatureMode] = useState<"type" | "draw">("type");
  const [typedSignature, setTypedSignature] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ach" | null>(null);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [convertedClientId, setConvertedClientId] = useState<string | null>(null);
  const [onboardingPollingDone, setOnboardingPollingDone] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [achProcessing, setAchProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data, isLoading, error, refetch } = useQuery<any>({
    queryKey: ["/api/quotes/public", token],
    queryFn: async () => {
      const res = await fetch(`/api/quotes/public/${token}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to load proposal");
      }
      return res.json();
    },
    enabled: !!token,
  });

  const [loadedStripeKey, setLoadedStripeKey] = useState<string | null>(null);
  useEffect(() => {
    if (data?.stripePublishableKey && data.stripePublishableKey !== loadedStripeKey) {
      setLoadedStripeKey(data.stripePublishableKey);
      setStripePromise(loadStripe(data.stripePublishableKey));
    }
  }, [data?.stripePublishableKey]);

  useEffect(() => {
    if (data) {
      if (data.clientName && !signerName) {
        setSignerName(data.clientName);
      }
      if (data.clientEmail && !signerEmail) {
        setSignerEmail(data.clientEmail);
      }
    }
  }, [data]);

  useEffect(() => {
    if (showTerms && termsScrollRef.current && !hasScrolledTerms) {
      const el = termsScrollRef.current;
      if (el.scrollHeight <= el.clientHeight + 30) {
        setHasScrolledTerms(true);
      }
    }
  }, [showTerms, hasScrolledTerms]);

  useEffect(() => {
    if (data?.proposal?.status === "completed") {
      setCurrentStep("complete");
    } else if (data?.proposal?.status === "signed" || data?.proposal?.status === "payment_pending") {
      setCurrentStep("pay");
      if (data?.proposal?.signedByName) setSignerName(data.proposal.signedByName);
      if (data?.proposal?.signedByEmail) setSignerEmail(data.proposal.signedByEmail);
    } else if (data?.proposal?.signedAt) {
      setCurrentStep("pay");
    }
  }, [data]);

  useEffect(() => {
    if (currentStep === "complete" && token) {
      let attempts = 0;
      const maxAttempts = 5;
      setOnboardingPollingDone(false);
      const fetchOnboardingUrl = () => {
        fetch(`/api/quotes/public/${token}/onboarding-url`)
          .then(res => res.json())
          .then(data => {
            if (data.onboardingUrl) {
              setOnboardingUrl(data.onboardingUrl);
              setOnboardingPollingDone(true);
            } else if (attempts < maxAttempts) {
              attempts++;
              setTimeout(fetchOnboardingUrl, 3000);
            } else {
              setOnboardingPollingDone(true);
            }
          })
          .catch(() => {
            setOnboardingPollingDone(true);
          });
      };
      const timer = setTimeout(fetchOnboardingUrl, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, token]);

  const signMutation = useMutation({
    mutationFn: async (signData: any) => {
      const res = await fetch(`/api/quotes/public/${token}/sign`, {
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
    onSuccess: (data: any) => {
      if (data?.clientId) {
        setConvertedClientId(data.clientId);
      }
      refetch();
      setCurrentStep("pay");
    },
  });

  const createPaymentIntentFn = useCallback(async (method: "card" | "ach") => {
    setPaymentError(null);
    setClientSecret(null);

    const res = await fetch(`/api/quotes/public/${token}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethod: method }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }
    const result = await res.json();
    if (result.clientSecret) {
      setClientSecret(result.clientSecret);
    }
    return result;
  }, [token]);

  const handleSelectPaymentMethod = async (method: "card" | "ach") => {
    setPaymentMethod(method);
    setPaymentError(null);
    setClientSecret(null);

    try {
      await createPaymentIntentFn(method);
    } catch (err: any) {
      setPaymentError(err.message || "Failed to initialize payment");
    }
  };

  const [achPending, setAchPending] = useState(false);

  const handleACHPayment = async () => {
    if (!clientSecret || !stripePromise) {
      setPaymentError("Payment system is not available. Please try again or contact support.");
      return;
    }
    setAchProcessing(true);
    setPaymentError(null);

    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Payment system not available");

      const { error, paymentIntent } = await (stripe as any).collectBankAccountForPayment({
        clientSecret,
        params: {
          payment_method_type: "us_bank_account",
          payment_method_data: {
            billing_details: { name: signerName, email: signerEmail },
          },
        },
        expand: ["payment_method"],
      });

      if (error) {
        setPaymentError(error.message || "Failed to connect bank account");
        setAchProcessing(false);
        return;
      }

      if (paymentIntent?.status === "requires_confirmation") {
        const { error: confirmError, paymentIntent: confirmedIntent } = await stripe.confirmUsBankAccountPayment(clientSecret);

        if (confirmError) {
          setPaymentError(confirmError.message || "Payment confirmation failed");
        } else if (confirmedIntent?.status === "succeeded") {
          setCurrentStep("complete");
          refetch();
        } else if (confirmedIntent?.status === "processing") {
          setAchPending(true);
          setCurrentStep("complete");
          refetch();
        } else if (confirmedIntent?.status === "requires_action") {
          setPaymentError("Additional verification is required. Please follow the prompts from your bank.");
        }
      } else if (paymentIntent?.status === "succeeded") {
        setCurrentStep("complete");
        refetch();
      } else if (paymentIntent?.status === "processing") {
        setAchPending(true);
        setCurrentStep("complete");
        refetch();
      }
    } catch (err: any) {
      setPaymentError(err.message || "Payment failed");
    } finally {
      setAchProcessing(false);
    }
  };

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
  const branding = data?.branding || {};
  const brandColor = branding.primaryColor || "#00C9C6";
  const brandColorDark = darkenColor(brandColor, -20);
  const companyName = branding.companyName || "";
  const logoUrl = branding.logoUrl ? "/api/public/proposal-logo" : "";
  const footerText = branding.footerText || "";

  const buildFee = data?.buildFee || 0;
  const monthlyFee = data?.monthlyFee || 0;
  const billingMode = data?.billingMode || "trial";
  const payNowAmount = data?.payNowAmount || data?.paymentAmount || 0;
  const hasRecurring = monthlyFee > 0;
  const hasBuildFee = buildFee > 0;

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
            {logoUrl ? (
              <img src={logoUrl} alt={companyName || "Logo"} className="h-10 w-auto max-w-[160px] object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: brandColor }}>
                <FileText className="h-5 w-5 text-white" />
              </div>
            )}
            <div>
              {companyName && <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">{companyName}</p>}
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
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isCompleted ? "bg-green-500 text-white" :
                      isActive ? "text-white shadow-lg" :
                      "bg-gray-200 text-gray-500"
                    }`}
                    style={isActive ? { backgroundColor: brandColor, boxShadow: `0 4px 14px ${brandColor}4D` } : undefined}
                  >
                    {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span
                    className={`text-xs mt-1 font-medium ${isCompleted ? "text-green-600" : !isActive ? "text-gray-400" : ""}`}
                    style={isActive ? { color: brandColor } : undefined}
                  >
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
              <div className="p-6 text-white" style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColorDark} 100%)` }}>
                <h2 className="text-2xl font-bold">Proposal Summary</h2>
                <p className="opacity-90 mt-1">Review the services and pricing below</p>
              </div>
              <CardContent className="p-6">
                {items.length > 0 ? (
                  <div className="space-y-4">
                    {items.map((item: any, index: number) => {
                      if (item.itemType === 'package' && item.packageContents?.length > 0) {
                        const onboarding = item.packageContents.filter((c: any) => c.name?.toLowerCase().startsWith('onboarding'));
                        const monthly = item.packageContents.filter((c: any) => c.name?.toLowerCase().startsWith('monthly'));
                        const other = item.packageContents.filter((c: any) => !c.name?.toLowerCase().startsWith('onboarding') && !c.name?.toLowerCase().startsWith('monthly'));
                        const groups = [
                          ...(onboarding.length > 0 ? [{ label: 'Onboarding', items: onboarding, defaultOpen: true }] : []),
                          ...(monthly.length > 0 ? [{ label: 'Monthly Services', items: monthly, defaultOpen: false }] : []),
                          ...(other.length > 0 ? [{ label: 'Included Services', items: other, defaultOpen: true }] : []),
                        ];
                        return (
                          <div key={item.id || index} className="py-3 border-b last:border-0">
                            <div className="font-semibold text-lg text-gray-900 mb-1">{item.itemName || 'Package'}</div>
                            <Badge variant="outline" className="capitalize text-xs mb-4">Package</Badge>
                            <div className="space-y-4 mt-3">
                              {groups.map((group, gi) => (
                                <CollapsibleSection key={gi} label={group.label} defaultOpen={group.defaultOpen} brandColor={brandColor}>
                                  <div className="space-y-3">
                                    {group.items.map((content: any, ci: number) => (
                                      <div key={ci}>
                                        <div className="flex items-center gap-2 mb-1">
                                          <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                          <span className="text-sm font-medium text-gray-800">{content.name}</span>
                                        </div>
                                        {content.type === 'bundle' && content.items?.length > 0 && (
                                          <div className="ml-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5">
                                            {content.items.map((svc: any, si: number) => (
                                              <div key={si} className="flex items-center gap-2 py-0.5">
                                                <Check className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                                                <span className="text-xs text-gray-600">
                                                  {typeof svc === 'string' ? svc : svc.name}
                                                  {typeof svc !== 'string' && svc.quantity > 1 && (
                                                    <span className="text-gray-400 ml-1"> - {svc.quantity}</span>
                                                  )}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </CollapsibleSection>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={item.id || index} className="flex items-center py-3 border-b last:border-0">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{item.itemName || `${item.itemType} Item`}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="capitalize text-xs">{item.itemType}</Badge>
                              {item.quantity > 1 && <span className="text-xs text-gray-500">Qty: {item.quantity}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {(hasBuildFee || hasRecurring) && (
                      <div className="pt-4 border-t-2 space-y-3">
                        {hasBuildFee && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="font-medium text-gray-700">Build Investment</span>
                              <span className="text-xs text-gray-400">(one-time)</span>
                            </div>
                            <span className="text-lg font-bold text-gray-900">${formatCurrency(buildFee)}</span>
                          </div>
                        )}
                        {hasRecurring && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Repeat className="h-4 w-4 text-gray-500" />
                              <span className="font-medium text-gray-700">Monthly Investment</span>
                              <span className="text-xs text-gray-400">(recurring)</span>
                            </div>
                            <span className="text-lg font-bold text-gray-900">${formatCurrency(monthlyFee)}/mo</span>
                          </div>
                        )}
                      </div>
                    )}

                    {hasRecurring && (
                      <div className="rounded-lg p-4 mt-2" style={{ backgroundColor: `${brandColor}0D`, borderLeft: `3px solid ${brandColor}` }}>
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: brandColor }} />
                          <div className="text-sm text-gray-700">
                            {billingMode === "trial" ? (
                              <>
                                <p className="font-medium">Payment Summary</p>
                                <p className="mt-1">
                                  {hasBuildFee
                                    ? `You'll pay the Build Investment of $${formatCurrency(buildFee)} today. Your monthly billing of $${formatCurrency(monthlyFee)}/mo begins 30 days after payment.`
                                    : `Your monthly billing of $${formatCurrency(monthlyFee)}/mo begins 30 days from today.`
                                  }
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="font-medium">Payment Summary</p>
                                <p className="mt-1">
                                  {hasBuildFee
                                    ? `You'll pay $${formatCurrency(buildFee + monthlyFee)} today (Build Investment + first month). Monthly billing of $${formatCurrency(monthlyFee)}/mo continues each month after.`
                                    : `You'll pay $${formatCurrency(monthlyFee)} today. Monthly billing of $${formatCurrency(monthlyFee)}/mo continues each month after.`
                                  }
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="text-lg font-bold">Due Today</span>
                      <span className="text-2xl font-bold" style={{ color: brandColor }}>
                        ${formatCurrency(payNowAmount)}
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
                className="text-white px-8 py-3 text-lg"
                style={{ backgroundColor: brandColor }}
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
                      style={signatureMode === "type" ? { backgroundColor: brandColor } : undefined}
                    >
                      Type
                    </Button>
                    <Button
                      variant={signatureMode === "draw" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSignatureMode("draw")}
                      style={signatureMode === "draw" ? { backgroundColor: brandColor } : undefined}
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
                  <div className="border rounded-lg" id="terms-section">
                    <button
                      onClick={() => {
                        const newState = !showTerms;
                        setShowTerms(newState);
                        if (newState) setHasExpandedTerms(true);
                      }}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5" style={{ color: brandColor }} />
                        <span className="font-medium">{terms.title || "Service Agreement"}</span>
                        {!showTerms && <span className="text-xs text-gray-400 ml-1">(click to expand & read)</span>}
                      </div>
                      {showTerms ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {showTerms && (
                      <div
                        ref={termsScrollRef}
                        className="border-t p-4 max-h-96 overflow-y-auto"
                        onScroll={(e) => {
                          const el = e.currentTarget;
                          const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
                          if (atBottom) setHasScrolledTerms(true);
                        }}
                      >
                        <div className="prose prose-sm max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: terms.content }} />
                        {!hasScrolledTerms && (
                          <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/90 to-transparent pt-6 pb-2 text-center">
                            <p className="text-xs text-gray-500 animate-pulse flex items-center justify-center gap-1">
                              <ChevronDown className="h-3 w-3" /> Scroll down to read the full agreement <ChevronDown className="h-3 w-3" />
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {terms && !hasExpandedTerms && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Please expand and read the Service Agreement above before proceeding.
                  </p>
                )}
                {terms && hasExpandedTerms && !hasScrolledTerms && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Please scroll to the bottom of the Service Agreement to continue.
                  </p>
                )}

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms-checkbox"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => {
                      if (terms && (!hasExpandedTerms || !hasScrolledTerms)) return;
                      setTermsAccepted(checked === true);
                    }}
                    disabled={terms ? (!hasExpandedTerms || !hasScrolledTerms) : false}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="terms-checkbox"
                    className={`text-sm leading-relaxed ${terms && (!hasExpandedTerms || !hasScrolledTerms) ? "text-gray-400 cursor-not-allowed" : "text-gray-600 cursor-pointer"}`}
                  >
                    I have read and agree to the{" "}
                    {terms ? (
                      <span
                        className="underline font-medium cursor-pointer"
                        style={{ color: brandColor }}
                        onClick={(e) => {
                          e.preventDefault();
                          setShowTerms(true);
                          if (!hasExpandedTerms) setHasExpandedTerms(true);
                          setTimeout(() => {
                            document.getElementById("terms-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }, 100);
                        }}
                      >
                        {terms.title || "Service Agreement"}
                      </span>
                    ) : (
                      "Terms & Conditions"
                    )}
                    . I authorize this electronic signature as my binding signature.
                  </Label>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep("review")}>Back</Button>
                  <Button
                    onClick={handleSign}
                    className="text-white px-8"
                    style={{ backgroundColor: !termsAccepted ? undefined : brandColor }}
                    disabled={signMutation.isPending || !termsAccepted}
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
                </div>

                <div className="rounded-lg border bg-gray-50 p-4 space-y-2">
                  {hasBuildFee && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Build Investment (one-time)</span>
                      <span className="font-medium">${formatCurrency(buildFee)}</span>
                    </div>
                  )}
                  {hasRecurring && billingMode === "immediate" && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">First Month</span>
                      <span className="font-medium">${formatCurrency(monthlyFee)}</span>
                    </div>
                  )}
                  {paymentMethod === "card" && (
                    <div className="flex items-center justify-between text-sm text-amber-700">
                      <span>Credit Card Fee (3%)</span>
                      <span className="font-medium">${formatCurrency(payNowAmount * 0.03)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-semibold">Due Now</span>
                    <span className="text-xl font-bold" style={{ color: brandColor }}>
                      ${formatCurrency(paymentMethod === "card" ? payNowAmount * 1.03 : payNowAmount)}
                    </span>
                  </div>
                  {hasRecurring && (
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Repeat className="h-3 w-3" />
                        Monthly recurring
                      </span>
                      <span>
                        ${formatCurrency(paymentMethod === "card" ? monthlyFee * 1.03 : monthlyFee)}/mo {billingMode === "trial" ? "(starts in 30 days)" : "(next month)"}
                        {paymentMethod === "card" && " (incl. 3% CC fee)"}
                      </span>
                    </div>
                  )}
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
                        onClick={() => handleSelectPaymentMethod("card")}
                        className="p-6 rounded-xl border-2 text-left transition-all"
                        style={paymentMethod === "card" ? {
                          borderColor: brandColor,
                          backgroundColor: `${brandColor}0D`,
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                        } : { borderColor: '#e5e7eb' }}
                      >
                        <CreditCard className="h-8 w-8 mb-3" style={{ color: paymentMethod === "card" ? brandColor : "#9ca3af" }} />
                        <div className="font-semibold">Credit / Debit Card</div>
                        <p className="text-sm text-gray-500 mt-1">Pay instantly with your card</p>
                        <p className="text-xs text-amber-600 mt-1">3% processing fee applies</p>
                      </button>
                      <button
                        onClick={() => handleSelectPaymentMethod("ach")}
                        className="p-6 rounded-xl border-2 text-left transition-all"
                        style={paymentMethod === "ach" ? {
                          borderColor: brandColor,
                          backgroundColor: `${brandColor}0D`,
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                        } : { borderColor: '#e5e7eb' }}
                      >
                        <Building className="h-8 w-8 mb-3" style={{ color: paymentMethod === "ach" ? brandColor : "#9ca3af" }} />
                        <div className="font-semibold">Bank Transfer (ACH)</div>
                        <p className="text-sm text-gray-500 mt-1">Pay directly from your bank account</p>
                      </button>
                    </div>

                    {paymentMethod === "card" && clientSecret && stripePromise && (
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <CardPaymentForm
                          clientSecret={clientSecret}
                          signerName={signerName}
                          signerEmail={signerEmail}
                          amount={payNowAmount * 1.03}
                          brandColor={brandColor}
                          onSuccess={() => {
                            setCurrentStep("complete");
                            refetch();
                          }}
                          onError={(msg) => setPaymentError(msg)}
                        />
                      </Elements>
                    )}

                    {paymentMethod === "ach" && clientSecret && (
                      <div className="space-y-4">
                        <div className="border rounded-lg p-6 bg-gray-50 text-center">
                          <Building className="h-10 w-10 mx-auto mb-3" style={{ color: brandColor }} />
                          <p className="text-sm text-gray-600 mb-2">
                            Click the button below to securely connect your bank account via Stripe.
                          </p>
                          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                            <Shield className="h-3 w-3" />
                            Secured by Stripe Financial Connections
                          </div>
                        </div>
                        <Button
                          onClick={handleACHPayment}
                          className="w-full text-white py-3 text-lg"
                          style={{ backgroundColor: brandColor }}
                          disabled={achProcessing}
                          size="lg"
                        >
                          {achProcessing ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Connecting Bank Account...</>
                          ) : (
                            <>Pay ${formatCurrency(payNowAmount)} via ACH</>
                          )}
                        </Button>
                      </div>
                    )}

                    {paymentMethod && !clientSecret && (
                      <div className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" style={{ color: brandColor }} />
                        <p className="text-sm text-gray-500">Setting up payment...</p>
                      </div>
                    )}

                    {paymentError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                        {paymentError}
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
            {achPending ? (
              <>
                <p className="text-lg text-gray-600 mb-2">Your proposal has been signed and your ACH payment is being processed.</p>
                <p className="text-gray-500">Bank transfers typically take 1-3 business days to complete. We'll notify you once the payment is confirmed.</p>
              </>
            ) : (
              <>
                <p className="text-lg text-gray-600 mb-2">Your proposal has been signed and payment has been received.</p>
                {hasRecurring && (
                  <p className="text-gray-500">
                    {billingMode === "trial"
                      ? `Your monthly billing of $${formatCurrency(monthlyFee)}/mo will begin in 30 days.`
                      : `Your monthly billing of $${formatCurrency(monthlyFee)}/mo will continue each month.`
                    }
                  </p>
                )}
                {!hasRecurring && (
                  <p className="text-gray-500">We'll be in touch shortly to get started on your project.</p>
                )}
              </>
            )}
            <div className="mt-8 inline-flex items-center gap-2 bg-gray-100 rounded-full px-6 py-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-gray-700">Confirmation sent to {proposal?.signedByEmail || signerEmail}</span>
            </div>
            {onboardingUrl ? (
              <div className="mt-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-3">Next Step</h3>
                <p className="text-gray-600 mb-5 max-w-lg mx-auto">We are super excited to get your campaigns launched! We need your help with this... The faster we are able to get everything we need, the faster we can launch. So please start your onboarding process below (you can start now, save and come back to it later).</p>
                <a
                  href={onboardingUrl}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
                  style={{ backgroundColor: brandColor || '#00C9C6' }}
                >
                  Start Your Onboarding
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            ) : !onboardingPollingDone && currentStep === "complete" ? (
              <div className="mt-8">
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium opacity-60 cursor-not-allowed"
                  style={{ backgroundColor: brandColor || '#00C9C6' }}
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Setting up your account...
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {footerText && (
        <div className="max-w-4xl mx-auto px-4 py-4 text-center">
          <p className="text-xs text-gray-400">{footerText}</p>
        </div>
      )}

      <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap" rel="stylesheet" />
    </div>
  );
}
