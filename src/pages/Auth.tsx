import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import FloatingStars from "@/components/FloatingStars";

const Auth = () => {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate("/app"); }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/app`, data: { display_name: name } },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account ✨");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("Password reset link sent to your email");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally { setBusy(false); }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) toast.error(result.error.message ?? "Google sign-in failed");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <FloatingStars />
      <Card className="glass-card w-full max-w-md p-8 relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="text-4xl font-bold gradient-text font-display">DreamScape</Link>
          <p className="text-muted-foreground">
            {mode === "signup" ? "Begin your journey to better sleep" : mode === "forgot" ? "Reset your password" : "Welcome back, dreamer"}
          </p>
        </div>

        {mode !== "forgot" && (
          <>
            <Button variant="outline" className="w-full bg-background/30" onClick={google}>Continue with Google</Button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" /></div>
          </>
        )}

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2"><Label htmlFor="name">Display name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="bg-background/50" /></div>
          )}
          <div className="space-y-2"><Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background/50" /></div>
          {mode !== "forgot" && (
            <div className="space-y-2"><Label htmlFor="password">Password</Label>
              <Input id="password" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-background/50" /></div>
          )}
          <Button type="submit" className="w-full dream-glow" disabled={busy}>
            {mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
          </Button>
        </form>

        <div className="text-sm text-center space-y-1 text-muted-foreground">
          {mode === "signin" && <>
            <button className="hover:text-foreground" onClick={() => setMode("forgot")}>Forgot password?</button>
            <p>New here? <button className="text-primary hover:underline" onClick={() => setMode("signup")}>Create an account</button></p>
          </>}
          {mode !== "signin" && <p><button className="text-primary hover:underline" onClick={() => setMode("signin")}>Back to sign in</button></p>}
        </div>
      </Card>
    </div>
  );
};
export default Auth;
