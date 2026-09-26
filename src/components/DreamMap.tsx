import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";

// Stable pseudo-random position from the dream id
const hash = (s: string, salt: number) => {
  let h = salt;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
};
const MOOD_COLOR: Record<string, string> = {
  peaceful: "hsl(var(--primary))",
  mysterious: "hsl(var(--accent))",
  adventurous: "hsl(45 95% 70%)",
  surreal: "hsl(320 80% 75%)",
};

const DreamMap = () => {
  const [open, setOpen] = useState<string | null>(null);
  const { data: dreams = [] } = useQuery({
    queryKey: ["dreams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dreams").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const d = dreams.find((x) => x.id === open);

  return (
    <Card className="glass-card p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Your dream sky</h2>
        <p className="text-sm text-muted-foreground">Every saved dream is a star. Brighter stars are more recent — tap one to revisit it.</p>
      </div>
      <div className="relative w-full h-[420px] rounded-xl overflow-hidden border border-border/40 bg-background">
        {Array.from({ length: 60 }).map((_, i) => (
          <span key={i} className="absolute rounded-full bg-foreground/40 star-twinkle"
            style={{ left: `${hash(String(i), 7) * 100}%`, top: `${hash(String(i), 13) * 100}%`, width: 2, height: 2, animationDelay: `${i % 5}s` }} />
        ))}
        {dreams.length === 0 && <p className="absolute inset-0 flex items-center justify-center text-muted-foreground">Save a dream to light your first star ✨</p>}
        {dreams.map((dr, i) => {
          const size = 10 + Math.max(0, 14 - i);
          const color = MOOD_COLOR[dr.mood] ?? "hsl(var(--primary))";
          return (
            <button key={dr.id} onClick={() => setOpen(dr.id)} aria-label={dr.title} title={dr.title}
              className="absolute group -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform hover:scale-150 focus:scale-150 outline-none"
              style={{ left: `${6 + hash(dr.id, 3) * 88}%`, top: `${8 + hash(dr.id, 11) * 84}%`, width: size, height: size, background: color, boxShadow: `0 0 ${size * 1.5}px ${color}`, opacity: Math.max(0.5, 1 - i * 0.03) }}>
              <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap text-xs opacity-0 group-hover:opacity-100 group-focus:opacity-100">{dr.title}</span>
            </button>
          );
        })}
      </div>
      <div className="flex gap-3 flex-wrap text-xs text-muted-foreground">
        {Object.entries(MOOD_COLOR).map(([m, c]) => <span key={m} className="flex items-center gap-1 capitalize"><span className="w-2.5 h-2.5 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />{m}</span>)}
      </div>
      <Dialog open={!!d} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="glass-card max-w-lg">
          {d && <>
            <DialogHeader><DialogTitle className="gradient-text text-2xl">{d.title}</DialogTitle></DialogHeader>
            <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()} · {d.mood}</p>
            <p className="leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">{d.content}</p>
            {d.tags.length > 0 && <div className="flex gap-2 flex-wrap">{d.tags.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}</div>}
            {d.ai_summary && <div className="rounded-lg bg-secondary/40 border border-border/50 p-3 text-sm"><p className="font-medium flex items-center gap-2 mb-1"><Sparkles size={14} className="text-primary" />AI interpretation</p><p className="whitespace-pre-line">{d.ai_summary}</p></div>}
          </>}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
export default DreamMap;
