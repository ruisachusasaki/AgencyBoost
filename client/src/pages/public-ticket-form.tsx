import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Loader2, AlertCircle, FileText } from "lucide-react";

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder: string | null;
  required: boolean | null;
  options: string[] | null;
  fieldMapping: string | null;
  order: number;
}

interface FormConfig {
  id: string;
  name: string;
  description: string | null;
  styling: Record<string, any> | null;
  settings: Record<string, any> | null;
  destination: string;
  platformLabel: string | null;
  fields: FormField[];
}

export default function PublicTicketForm() {
  const params = useParams<{ shortCode: string }>();
  const shortCode = params.shortCode;
  const [form, setForm] = useState<FormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!shortCode) return;
    fetch(`/api/public/forms/${shortCode}`)
      .then((res) => {
        if (!res.ok) throw new Error("Form not found or not published");
        return res.json();
      })
      .then((data: FormConfig) => {
        setForm(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [shortCode]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!submitterName.trim()) errors["submitterName"] = "Name is required";
    if (!submitterEmail.trim()) errors["submitterEmail"] = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterEmail)) errors["submitterEmail"] = "Invalid email";

    if (form?.fields) {
      for (const field of form.fields) {
        if (field.required) {
          const val = answers[field.id];
          if (!val || (typeof val === "string" && val.trim() === "")) {
            errors[field.id] = `${field.label} is required`;
          }
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const resp = await fetch(`/api/public/forms/${shortCode}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          submitterName: submitterName.trim(),
          submitterEmail: submitterEmail.trim(),
          platform: form?.platformLabel || form?.name || "External Form",
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to submit form");
      }

      const result = await resp.json();
      setReferenceNumber(result.referenceNumber || null);
      setSubmitted(true);
    } catch (err: any) {
      setValidationErrors({ _form: err.message || "Submission failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const styling = form?.styling as Record<string, any> || {};
  const primaryColor = styling.primaryColor || "hsl(179, 100%, 39%)";
  const bgColor = styling.backgroundColor || "#ffffff";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor }}>
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: bgColor }}>
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Form Not Available</h2>
            <p className="text-sm text-gray-500">{error || "This form is no longer available."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: bgColor }}>
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-14 h-14 mx-auto mb-4" style={{ color: primaryColor }} />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Submitted Successfully!</h2>
            <p className="text-sm text-gray-500 mb-4">Your submission has been received. We'll get back to you soon.</p>
            {referenceNumber && (
              <p className="text-sm font-mono text-gray-600 bg-gray-50 py-2 px-4 rounded-lg inline-block">
                Reference: {referenceNumber}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: bgColor }}>
      <div className="max-w-lg mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                <FileText className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
              <CardTitle className="text-xl">{form.name}</CardTitle>
            </div>
            {form.description && (
              <CardDescription>{form.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="submitterName">Your Name *</Label>
                  <Input
                    id="submitterName"
                    value={submitterName}
                    onChange={(e) => setSubmitterName(e.target.value)}
                    placeholder="John Doe"
                    className={validationErrors["submitterName"] ? "border-red-500" : ""}
                  />
                  {validationErrors["submitterName"] && (
                    <p className="text-xs text-red-500">{validationErrors["submitterName"]}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="submitterEmail">Your Email *</Label>
                  <Input
                    id="submitterEmail"
                    type="email"
                    value={submitterEmail}
                    onChange={(e) => setSubmitterEmail(e.target.value)}
                    placeholder="john@example.com"
                    className={validationErrors["submitterEmail"] ? "border-red-500" : ""}
                  />
                  {validationErrors["submitterEmail"] && (
                    <p className="text-xs text-red-500">{validationErrors["submitterEmail"]}</p>
                  )}
                </div>
              </div>

              {form.fields.map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <Label>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                  </Label>

                  {field.type === "text" && (
                    <Input
                      value={answers[field.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                      placeholder={field.placeholder || ""}
                      className={validationErrors[field.id] ? "border-red-500" : ""}
                    />
                  )}

                  {field.type === "textarea" && (
                    <Textarea
                      value={answers[field.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                      placeholder={field.placeholder || ""}
                      rows={4}
                      className={validationErrors[field.id] ? "border-red-500" : ""}
                    />
                  )}

                  {field.type === "select" && field.options && (
                    <Select value={answers[field.id] || ""} onValueChange={(v) => setAnswers({ ...answers, [field.id]: v })}>
                      <SelectTrigger className={validationErrors[field.id] ? "border-red-500" : ""}>
                        <SelectValue placeholder={field.placeholder || "Select..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {field.type === "checkbox" && (
                    <div className="flex items-center gap-2 pt-1">
                      <Checkbox
                        checked={!!answers[field.id]}
                        onCheckedChange={(c) => setAnswers({ ...answers, [field.id]: !!c })}
                      />
                      <span className="text-sm text-gray-600">{field.placeholder || field.label}</span>
                    </div>
                  )}

                  {field.type === "file" && (
                    <Input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setAnswers({ ...answers, [field.id]: file.name });
                      }}
                      className={validationErrors[field.id] ? "border-red-500" : ""}
                    />
                  )}

                  {validationErrors[field.id] && (
                    <p className="text-xs text-red-500">{validationErrors[field.id]}</p>
                  )}
                </div>
              ))}

              {validationErrors["_form"] && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{validationErrors["_form"]}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
