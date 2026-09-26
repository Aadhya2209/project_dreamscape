import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const isRecovery = window.location.hash.includes("type=recovery");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate("/app");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="glass-card w-full max-w-md p-8 space-y-6">
        <h1 className="text-3xl font-bold gradient-text text-center">Set a new password</h1>
        {!isRecovery && <p className="text-sm text-muted-foreground text-center">Open this page from the link in your reset email.</p>}
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="pw">New password</Label>
            <Input id="pw" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button type="submit" className="w-full">Update password</Button>
        </form>
      </Card>
    </div>
  );
};
export default ResetPassword;
