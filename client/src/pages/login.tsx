import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Login form schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address").transform(email => email.toLowerCase()),
  password: z.string().min(1, "Password is required")
});

type LoginFormData = z.infer<typeof loginSchema>;

// Bootstrap form schema
const bootstrapSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password must be less than 100 characters")
    .regex(/(?=.*[a-z])/, "Password must contain at least one lowercase letter")
    .regex(/(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
    .regex(/(?=.*\d)/, "Password must contain at least one number")
});

type BootstrapFormData = z.infer<typeof bootstrapSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  
  // Check if bootstrap is needed
  const { data: bootstrapStatus, isLoading: isCheckingBootstrap } = useQuery({
    queryKey: ['/api/auth/bootstrap'],
    retry: 1
  });

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  // Bootstrap form
  const bootstrapForm = useForm<BootstrapFormData>({
    resolver: zodResolver(bootstrapSchema),
    defaultValues: {
      password: ""
    }
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) => apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: (response) => {
      toast({
        title: "Welcome!",
        description: `Signed in as ${response.user.firstName} ${response.user.lastName}`,
        duration: 3000
      });
      // Redirect to dashboard
      setLocation('/');
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Login failed. Please check your credentials.";
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
        duration: 5000
      });
    }
  });

  // Bootstrap mutation
  const bootstrapMutation = useMutation({
    mutationFn: (data: BootstrapFormData) => apiRequest('/api/auth/bootstrap', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Password set successfully. You can now sign in.",
        duration: 5000
      });
      // Refresh bootstrap status
      window.location.reload();
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to set password. Please try again.";
      toast({
        variant: "destructive",
        title: "Setup Failed",
        description: errorMessage,
        duration: 5000
      });
    }
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onBootstrapSubmit = (data: BootstrapFormData) => {
    bootstrapMutation.mutate(data);
  };

  if (isCheckingBootstrap) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  // Show bootstrap form if needed
  if (bootstrapStatus?.needsBootstrap) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md" data-testid="bootstrap-card">
          <CardHeader>
            <CardTitle className="text-center">Welcome to TMO CRM</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              First-time setup: Please set your admin password
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={bootstrapForm.handleSubmit(onBootstrapSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="bootstrap-password">Password</Label>
                <div className="relative">
                  <Input
                    id="bootstrap-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    data-testid="input-bootstrap-password"
                    {...bootstrapForm.register("password")}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {bootstrapForm.formState.errors.password && (
                  <p className="text-sm text-red-600 mt-1" data-testid="error-bootstrap-password">
                    {bootstrapForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <p>Password requirements:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li>At least 8 characters long</li>
                  <li>One uppercase and one lowercase letter</li>
                  <li>At least one number</li>
                </ul>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={bootstrapMutation.isPending}
                data-testid="button-bootstrap-submit"
              >
                {bootstrapMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Set Password & Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show login form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md" data-testid="login-card">
        <CardHeader>
          <CardTitle className="text-center">Sign In</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Access your TMO CRM account
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="joe@themediaoptimizers.com"
                data-testid="input-email"
                {...loginForm.register("email")}
              />
              {loginForm.formState.errors.email && (
                <p className="text-sm text-red-600 mt-1" data-testid="error-email">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  data-testid="input-password"
                  {...loginForm.register("password")}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-sm text-red-600 mt-1" data-testid="error-password">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loginMutation.isPending}
              data-testid="button-login-submit"
            >
              {loginMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}