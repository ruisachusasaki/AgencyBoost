import { useState, useRef, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, CheckCircle, XCircle, Pen, Type, AlertTriangle } from "lucide-react";

export default function SignOfferPage() {
  const { token } = useParams<{ token: string }>();

  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signatureType, setSignatureType] = useState<"typed" | "drawn">("typed");
  const [typedSignature, setTypedSignature] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [showDecline, setShowDecline] = useState(false);
  const [signed, setSigned] = useState(false);
  const [declined, setDeclined] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const offerQuery = useQuery<any>({
    queryKey: [`/api/public/sign-offer/${token}`],
    queryFn: async () => {
      const res = await fetch(`/api/public/sign-offer/${token}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Not found" }));
        throw new Error(err.error || "Offer not found");
      }
      return res.json();
    },
  });

  const signMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/public/sign-offer/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Failed to sign");
      }
      return res.json();
    },
    onSuccess: () => setSigned(true),
  });

  const declineMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/public/decline-offer/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Failed to decline");
      }
      return res.json();
    },
    onSuccess: () => setDeclined(true),
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [signatureType]);

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
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getSignatureData = () => {
    if (signatureType === "typed") return typedSignature;
    return canvasRef.current?.toDataURL("image/png") || "";
  };

  const handleSign = () => {
    const signatureData = getSignatureData();
    if (!signerName.trim() || !signerEmail.trim() || !signatureData) return;
    signMutation.mutate({
      signatureType,
      signatureData,
      signerName: signerName.trim(),
      signerEmail: signerEmail.trim(),
    });
  };

  const handleDecline = () => {
    declineMutation.mutate({ reason: declineReason.trim() || null });
  };

  const offer = offerQuery.data;

  if (offerQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(179,100%,39%)]" />
      </div>
    );
  }

  if (offerQuery.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Link Not Found</h2>
            <p className="text-sm text-gray-500">{(offerQuery.error as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Agreement Signed!</h2>
            <p className="text-sm text-gray-500">Thank you for signing. You will receive a confirmation shortly.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (declined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Offer Declined</h2>
            <p className="text-sm text-gray-500">Thank you for letting us know. We wish you all the best.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (offer?.status === "signed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Already Signed</h2>
            <p className="text-sm text-gray-500">This agreement has already been signed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (offer?.status === "declined") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Offer Declined</h2>
            <p className="text-sm text-gray-500">This offer has been declined.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const compTypeLabel = offer?.compensationType === "per_hour" ? "per hour" : offer?.compensationType === "per_month" ? "per month" : "flat rate";
  const formattedStartDate = offer?.startDate ? new Date(offer.startDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";

  const isCanvasEmpty = () => {
    const canvas = canvasRef.current;
    if (!canvas) return true;
    const ctx = canvas.getContext("2d");
    if (!ctx) return true;
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] !== 0) return false;
    }
    return true;
  };

  const isFormValid = signerName.trim() && signerEmail.trim() && (signatureType === "typed" ? typedSignature.trim() : !isCanvasEmpty());

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[hsl(179,100%,39%)] to-[hsl(179,100%,29%)] text-white py-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-1">Independent Contractor Agreement</h1>
          <p className="text-white/80 text-sm">The Media Optimizers</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Offer Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Name</p>
                <p className="font-medium">{offer?.applicantName}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Position</p>
                <p className="font-medium">{offer?.positionTitle}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Compensation</p>
                <p className="font-medium">{offer?.compensation} {compTypeLabel}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Start Date</p>
                <p className="font-medium">{formattedStartDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Agreement</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm max-w-none dark:prose-invert bg-white p-6 rounded-lg border max-h-[500px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: offer?.populatedContent || "" }}
            />
          </CardContent>
        </Card>

        {!showDecline ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Pen className="h-5 w-5" />
                Sign Agreement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="signer-name">Full Legal Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="signer-name"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Enter your full name"
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
                    placeholder="Enter your email"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Signature</Label>
                <Tabs value={signatureType} onValueChange={(v) => setSignatureType(v as "typed" | "drawn")}>
                  <TabsList className="mb-3">
                    <TabsTrigger value="typed" className="gap-1.5">
                      <Type className="h-3.5 w-3.5" /> Type
                    </TabsTrigger>
                    <TabsTrigger value="drawn" className="gap-1.5">
                      <Pen className="h-3.5 w-3.5" /> Draw
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="typed">
                    <Input
                      value={typedSignature}
                      onChange={(e) => setTypedSignature(e.target.value)}
                      placeholder="Type your full name as signature"
                      className="font-serif text-xl italic"
                    />
                  </TabsContent>

                  <TabsContent value="drawn">
                    <div className="border rounded-lg bg-white relative">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearCanvas}
                        className="absolute top-2 right-2 text-xs"
                      >
                        Clear
                      </Button>
                      <p className="text-xs text-center text-muted-foreground pb-2">Draw your signature above</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {signMutation.error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{(signMutation.error as Error).message}</p>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setShowDecline(true)}
                >
                  Decline Offer
                </Button>
                <Button
                  onClick={handleSign}
                  disabled={!isFormValid || signMutation.isPending}
                  className="bg-[hsl(179,100%,39%)] hover:bg-[hsl(179,100%,32%)] text-white px-8"
                >
                  {signMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Sign & Accept
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-red-600">Decline Offer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to decline this offer? This action cannot be undone.
              </p>
              <div>
                <Label htmlFor="decline-reason">Reason (optional)</Label>
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

              <div className="flex items-center justify-end gap-3 pt-2 border-t">
                <Button variant="ghost" onClick={() => setShowDecline(false)}>
                  Go Back
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDecline}
                  disabled={declineMutation.isPending}
                >
                  {declineMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Confirm Decline
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
