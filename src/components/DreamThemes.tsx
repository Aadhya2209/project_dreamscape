import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Repeat } from "lucide-react";
import { toast } from "sonner";

type Result = { themes: { name: string; detail: string }[]; prompts: string[] };

const DreamThemes = () => {
  const [dream, setDream] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<Result | null>(null);

  const run = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("dream-themes", { body: { dream } });
    setLoading(false);
    if (error || data?.error) {
      let msg = data?.error;
      try { msg = msg ?? (await (error as any)?.context?.json())?.error; } catch { /* ignore */ }
      return toast.error(msg ?? "Could not find themes");
    }
    setRes(data);
  };

  return (
    <Card className="glass-card p-6 space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2"><Repeat size={18} className="text-primary" />Recurring themes</h2>
      <p className="text-sm text-muted-foreground">Describe a dream (optional) and we'll compare it with your journal to find patterns and questions to reflect on.</p>
      <Textarea rows={3} maxLength={4000} placeholder="Last night I was back at my old school…" value={dream} onChange={(e) => setDream(e.target.value)} />
      <Button onClick={run} disabled={loading}>{loading ? <><Loader2 size={16} className="mr-1 animate-spin" />Looking for patterns…</> : "Find themes"}</Button>
      {res && (
        <div className="space-y-4 pt-2 border-t border-border/40">
          <div className="space-y-2">
            {res.themes.map((t) => (
              <div key={t.name}><Badge variant="outline" className="mb-1">{t.name}</Badge><p className="text-sm text-muted-foreground">{t.detail}</p></div>
            ))}
          </div>
          {res.prompts.length > 0 && (
            <div>
              <p className="font-medium mb-1">Reflect on</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">{res.prompts.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
export default DreamThemes;
