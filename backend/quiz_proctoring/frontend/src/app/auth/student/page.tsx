"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { setStoredUser } from "@/lib/auth";

export default function StudentAuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("login");
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirm, setRegisterConfirm] = useState("");

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
  };

  const hideMessage = () => {
    setMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    hideMessage();
    setIsLoading(true);

    try {
      const data = await authApi.studentLogin(loginEmail, loginPassword);

      if (data.success && data.user) {
        setStoredUser(data.user);
        showMessage("Login successful! Redirecting...", "success");
        setTimeout(() => {
          router.push("/student/dashboard");
        }, 1000);
      } else {
        showMessage(data.message, "error");
      }
    } catch (error) {
      showMessage(
        "Login failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    hideMessage();

    if (registerPassword !== registerConfirm) {
      showMessage("Passwords do not match", "error");
      return;
    }

    setIsLoading(true);

    try {
      const data = await authApi.studentRegister(
        registerEmail,
        registerPassword,
      );

      if (data.success) {
        showMessage("Registration successful! Please login.", "success");
        setTimeout(() => {
          setActiveTab("login");
          setLoginEmail(registerEmail);
          setRegisterEmail("");
          setRegisterPassword("");
          setRegisterConfirm("");
        }, 1500);
      } else {
        showMessage(data.message, "error");
      }
    } catch (error) {
      showMessage(
        "Registration failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="glass max-w-md w-full shadow-xl rounded-3xl">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-black tracking-tight text-foreground">
            Student Portal
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted p-1 rounded-lg">
              <TabsTrigger
                value="login"
                className="rounded-md font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-md font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Register
              </TabsTrigger>
            </TabsList>

            {message && (
              <div
                className={`p-3 rounded-lg mb-4 text-center font-medium ${
                  message.type === "error"
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : "bg-accent/10 text-accent border border-accent/20"
                }`}
              >
                {message.text}
              </div>
            )}

            <TabsContent value="login" className="mt-0">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium uppercase tracking-wider text-foreground">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="h-12 bg-background border-border focus:border-primary focus:ring-primary/10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium uppercase tracking-wider text-foreground">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="h-12 bg-background border-border focus:border-primary focus:ring-primary/10"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-0">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium uppercase tracking-wider text-foreground">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                    className="h-12 bg-background border-border focus:border-primary focus:ring-primary/10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium uppercase tracking-wider text-foreground">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-12 bg-background border-border focus:border-primary focus:ring-primary/10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium uppercase tracking-wider text-foreground">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    value={registerConfirm}
                    onChange={(e) => setRegisterConfirm(e.target.value)}
                    required
                    minLength={6}
                    className="h-12 bg-background border-border focus:border-primary focus:ring-primary/10"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Register"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
