import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRefreshProfile } from "@/hooks/useProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Line, ComposedChart } from "recharts";

const calcHours = (bed: string, wake: string) => {
  const [bh, bm] = bed.split(":").map(Number);
  const [wh, wm] = wake.split(":").map(Number);
  let mins = wh * 60 + wm - (bh * 60 + bm);
  if (mins <= 0) mins += 24 * 60;
  return Math.round((mins / 60) * 100) / 100;
};

const SleepTracker = () => {
  const qc = useQueryClient();
  const refresh = useRefreshProfile();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [bed, setBed] = useState("23:00");
  const [wake, setWake] = useState("07:00");
  const [quality, setQuality] = useState(3);

  const { data: logs = [] } = useQuery({
    queryKey: ["sleep_logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sleep_logs").select("*").order("log_date", { ascending: true }).limit(60);
      if (error) throw error;
      return data;
    },
  });

  const save = async () => {
    const { error } = await supabase.from("sleep_logs").insert({ log_date: date, bedtime: bed, wake_time: wake, hours: calcHours(bed, wake), quality });
    if (error) return toast.error(error.code === "23505" ? "You already logged that night" : error.message);
    toast.success("Night logged! +10 Zzz Points 💤");
    qc.invalidateQueries({ queryKey: ["sleep_logs"] });
    refresh();
  };

  const recent = logs.slice(-14);
  const avg = (k: "hours" | "quality") => recent.length ? (recent.reduce((s, l) => s + Number(l[k]), 0) / recent.length).toFixed(1) : "–";
  const chartData = recent.map((l) => ({ day: l.log_date.slice(5), hours: Number(l.hours), quality: l.quality }));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="glass-card p-6 space-y-4">
        <h2 className="text-xl font-semibold">Log last night</h2>
        <div className="space-y-2"><Label>Night of</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label>Bedtime</Label><Input type="time" value={bed} onChange={(e) => setBed(e.target.value)} /></div>
          <div className="space-y-2"><Label>Wake time</Label><Input type="time" value={wake} onChange={(e) => setWake(e.target.value)} /></div>
        </div>
        <p className="text-sm text-muted-foreground">That's <span className="text-foreground font-medium">{calcHours(bed, wake)} hours</span> of sleep.</p>
        <div className="space-y-3"><Label>Sleep quality: {["😫", "😕", "😐", "🙂", "😴"][quality - 1]}</Label>
          <Slider min={1} max={5} step={1} value={[quality]} onValueChange={(v) => setQuality(v[0])} /></div>
        <Button className="w-full dream-glow" onClick={save}>Save night</Button>
      </Card>

      <Card className="glass-card p-6 lg:col-span-2 space-y-4">
        <div className="flex flex-wrap gap-6">
          <div><p className="text-sm text-muted-foreground">Avg hours (14 nights)</p><p className="text-3xl font-bold gradient-text">{avg("hours")}</p></div>
          <div><p className="text-sm text-muted-foreground">Avg quality</p><p className="text-3xl font-bold gradient-text">{avg("quality")}/5</p></div>
          <div><p className="text-sm text-muted-foreground">Nights logged</p><p className="text-3xl font-bold gradient-text">{logs.length}</p></div>
        </div>
        {chartData.length === 0 ? (
          <p className="text-muted-foreground py-16 text-center">Log your first night to see your sleep trends 🌙</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer>
              <ComposedChart data={chartData}>
                <defs><linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis yAxisId="h" stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 12]} />
                <YAxis yAxisId="q" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 5]} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Area yAxisId="h" type="monotone" dataKey="hours" stroke="hsl(var(--primary))" fill="url(#h)" name="Hours" />
                <Line yAxisId="q" type="monotone" dataKey="quality" stroke="hsl(var(--accent-foreground))" strokeDasharray="4 4" name="Quality" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
};
export default SleepTracker;
