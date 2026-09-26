import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Award, Moon, BookOpen, Flame, Sparkles, Eye } from "lucide-react";

const useData = () =>
  useQuery({
    queryKey: ["insights"],
    queryFn: async () => {
      const [s, d, b] = await Promise.all([
        supabase.from("sleep_logs").select("*").order("log_date", { ascending: false }),
        supabase.from("dreams").select("*").order("created_at", { ascending: false }),
        supabase.from("breathing_sessions").select("id"),
      ]);
      return { sleep: s.data ?? [], dreams: d.data ?? [], breaths: b.data?.length ?? 0 };
    },
  });

const download = (name: string, text: string, type: string) => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
};

const Insights = () => {
  const { data: profile } = useProfile();
  const { data } = useData();
  const sleep = data?.sleep ?? [];
  const dreams = data?.dreams ?? [];
  const weekAgo = new Date(Date.now() - 7 * 864e5);
  const weekSleep = sleep.filter((s) => new Date(s.log_date) >= weekAgo);
  const weekDreams = dreams.filter((d) => new Date(d.created_at) >= weekAgo);
  const avg = (a: number[]) => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : "–");
  const moods: Record<string, number> = {};
  dreams.forEach((d) => (moods[d.mood] = (moods[d.mood] ?? 0) + 1));
  const topMood = Object.entries(moods).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "–";
  const lucid = dreams.filter((d) => d.is_lucid).length;
  const points = profile?.zzz_points ?? 0;
  const longest = profile?.longest_streak ?? 0;

  const badges = [
    { e: "🌙", n: "First night", d: "Log your first sleep", ok: sleep.length >= 1 },
    { e: "📖", n: "Dream keeper", d: "Save your first dream", ok: dreams.length >= 1 },
    { e: "🎙️", n: "Dream teller", d: "Save a spoken dream", ok: dreams.some((d) => d.title.startsWith("Spoken dream")) },
    { e: "🔥", n: "3-night streak", d: "Log 3 nights in a row", ok: longest >= 3 },
    { e: "⭐", n: "7-night streak", d: "Log 7 nights in a row", ok: longest >= 7 },
    { e: "🌌", n: "Dream collector", d: "Save 10 dreams", ok: dreams.length >= 10 },
    { e: "👁️", n: "Lucid dreamer", d: "Mark a dream as lucid", ok: lucid >= 1 },
    { e: "🐉", n: "Dragon calmer", d: "Finish 10 calming games", ok: (data?.breaths ?? 0) >= 10 },
    { e: "💤", n: "100 Zzz", d: "Earn 100 Zzz Points", ok: points >= 100 },
    { e: "👑", n: "500 Zzz", d: "Earn 500 Zzz Points", ok: points >= 500 },
  ];

  const exportText = () => {
    const body = dreams.map((d) =>
      `${d.title}\n${new Date(d.created_at).toLocaleDateString()} · ${d.mood}${d.is_lucid ? " · lucid" : ""}${d.tags.length ? " · " + d.tags.join(", ") : ""}\n\n${d.content}${d.ai_summary ? `\n\nInterpretation:\n${d.ai_summary}` : ""}`
    ).join("\n\n────────────\n\n");
    download("dreamscape-journal.txt", `My DreamScape journal\n\n${body}`, "text/plain");
  };
  const exportJson = () => download("dreamscape-journal.json", JSON.stringify({ dreams, sleep }, null, 2), "application/json");

  const stats = [
    { i: Moon, l: "Avg sleep this week", v: `${avg(weekSleep.map((s) => Number(s.hours)))} h` },
    { i: Sparkles, l: "Avg quality this week", v: `${avg(weekSleep.map((s) => s.quality))} / 5` },
    { i: BookOpen, l: "Dreams this week", v: weekDreams.length },
    { i: Flame, l: "Current streak", v: profile?.current_streak ?? 0 },
    { i: Eye, l: "Lucid dreams", v: lucid },
    { i: Sparkles, l: "Most common mood", v: topMood },
  ];

  return (
    <div className="space-y-6">
      <Card className="glass-card p-6">
        <h2 className="text-2xl font-display mb-4">Your week</h2>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          {stats.map((s) => (
            <div key={s.l} className="rounded-lg bg-secondary/40 border border-border/50 p-4">
              <s.i size={18} className="text-primary mb-2" />
              <p className="text-2xl font-semibold capitalize">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card className="glass-card p-6">
        <h2 className="text-2xl font-display mb-4 flex items-center gap-2"><Award className="text-primary" />Badges · {badges.filter((b) => b.ok).length}/{badges.length}</h2>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
          {badges.map((b) => (
            <div key={b.n} className={`rounded-lg border p-4 text-center transition ${b.ok ? "border-primary/60 bg-primary/10" : "border-border/40 opacity-40 grayscale"}`}>
              <div className="text-3xl mb-1">{b.e}</div>
              <p className="font-semibold text-sm">{b.n}</p>
              <p className="text-xs text-muted-foreground">{b.d}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card className="glass-card p-6">
        <h2 className="text-2xl font-display mb-2">Export your journal</h2>
        <p className="text-sm text-muted-foreground mb-4">Keep a copy of all {dreams.length} dreams and {sleep.length} sleep logs on your device.</p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={exportText} disabled={!dreams.length}><Download size={16} className="mr-2" />Readable file</Button>
          <Button variant="outline" onClick={exportJson} disabled={!dreams.length && !sleep.length}><Download size={16} className="mr-2" />Full backup</Button>
        </div>
      </Card>
    </div>
  );
};
export default Insights;
