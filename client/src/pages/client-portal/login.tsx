import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PortalBranding {
  logoUrl?: string;
  companyName?: string;
  primaryColor?: string;
  accentColor?: string;
  welcomeMessage?: string;
  footerText?: string;
}

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function ClientPortalLogin() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branding, setBranding] = useState<PortalBranding>({});

  useEffect(() => {
    fetch("/api/public/client-portal-branding")
      .then(r => r.json())
      .then(data => setBranding(data || {}))
      .catch(() => {});
  }, []);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await apiRequest("POST", "/api/client-portal/login", data);
      const response = await res.json();

      if (response.success) {
        sessionStorage.setItem("clientPortalUser", JSON.stringify(response.user));
        navigate("/client-portal/dashboard");
      } else {
        setError(response.message || "Login failed");
      }
    } catch (err: any) {
      if (err.status === 429) {
        setError("Too many login attempts. Please try again later.");
      } else if (err.status === 401) {
        setError("Invalid email or password");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Portal Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.companyName || "Company Logo"} className="h-12 w-auto object-contain" />
            ) : (
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl" style={{ backgroundColor: `${branding.primaryColor || 'hsl(179, 100%, 39%)'}20` }}>
                <ArrowRight className="w-6 h-6" style={{ color: branding.primaryColor || 'hsl(179, 100%, 39%)' }} />
              </div>
            )}
            <h1 className="text-2xl font-bold text-foreground">{branding.companyName || "Client Portal"}</h1>
          </div>
          <p className="text-muted-foreground">Client Portal</p>
        </div>

        <Card className="border-0 shadow-xl bg-background/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your project dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" data-testid="alert-login-error">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter your email"
                          disabled={isLoading}
                          className="h-11"
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            disabled={isLoading}
                            className="h-11 pr-10"
                            data-testid="input-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 font-medium"
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>

            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Need help accessing your account?{" "}
                <Button
                  variant="link"
                  className="h-auto p-0 text-primary font-medium"
                  onClick={() => setError("Please contact your agency for assistance.")}
                  data-testid="link-help"
                >
                  Contact Support
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>{branding.footerText || `© ${new Date().getFullYear()} ${branding.companyName || "AgencyBoost"}. All rights reserved.`}</p>
        </div>
      </div>
    </div>
  );
}