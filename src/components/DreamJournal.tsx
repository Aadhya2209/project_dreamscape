import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRefreshProfile } from "@/hooks/useProfile";
import DreamForm from "@/components/DreamForm";
import DreamThemes from "@/components/DreamThemes";
import LucidCorner from "@/components/LucidCorner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const DreamJournal = () => {
  const qc = useQueryClient();
  const refresh = useRefreshProfile();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { data: dreams = [] } = useQuery({
    queryKey: ["dreams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dreams").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const reload = () => qc.invalidateQueries({ queryKey: ["dreams"] });

  const summarize = async (id: string) => {
    setLoadingId(id);
    const { data, error } = await supabase.functions.invoke("dream-summary", { body: { dreamId: id } });
    setLoadingId(null);
    if (error || data?.error) {
      let msg = data?.error;
      try { msg = msg ?? (await (error as any)?.context?.json())?.error; } catch { /* ignore */ }
      return toast.error(msg ?? "Could not interpret this dream");
    }
    reload();
  };

  const add = async (d: { title: string; content: string; mood: string; tags: string[]; is_lucid: boolean }) => {
    const { data, error } = await supabase.from("dreams").insert(d).select().single();
    if (error) return toast.error(error.message);
    toast.success("Dream saved! +5 Zzz Points ✨");
    reload(); refresh();
    summarize(data.id);
  };

  const remove = async (id: string) => {
    await supabase.from("dreams").delete().eq("id", id);
    reload();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2 space-y-6"><DreamForm onSubmit={add} /><DreamThemes /><LucidCorner /></div>
      <div className="lg:col-span-3 space-y-4">
        {dreams.length === 0 && <Card className="glass-card p-10 text-center text-muted-foreground">No dreams yet. Write down last night's dream while it's fresh 🌙</Card>}
        {dreams.map((d) => (
          <Card key={d.id} className="glass-card p-6 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-xl font-semibold gradient-text">{d.title}</h3>
                <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()} · {d.mood}{d.is_lucid && " · 👁️ lucid"}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(d.id)} aria-label="Delete dream"><Trash2 size={16} /></Button>
            </div>
            <p className="text-muted-foreground leading-relaxed">{d.content}</p>
            {d.tags.length > 0 && <div className="flex gap-2 flex-wrap">{d.tags.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}</div>}
            <div className="rounded-lg bg-secondary/40 border border-border/50 p-4">
              <p className="text-sm font-medium flex items-center gap-2 mb-1"><Sparkles size={14} className="text-primary" />AI interpretation</p>
              {loadingId === d.id ? (
                <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Reading the stars…</p>
              ) : d.ai_summary ? (
                <p className="text-sm whitespace-pre-line">{d.ai_summary}</p>
              ) : (
                <Button size="sm" variant="outline" onClick={() => summarize(d.id)}>Interpret this dream</Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
export default DreamJournal;
