import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function LoginPage() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Agency<span className="text-primary">Flow</span>
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Customer Relationship Management System
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription className="text-base">
              Sign in to access your agency management platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <Button
              onClick={handleLogin}
              className="w-full h-12 text-base"
              size="lg"
              data-testid="button-login"
            >
              Continue with Replit
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Sign in with Google, Apple, GitHub, X, or email
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}