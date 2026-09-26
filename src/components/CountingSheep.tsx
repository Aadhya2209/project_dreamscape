import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRefreshProfile } from "@/hooks/useProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const GOAL = 20;
const TRIP_MS = 5000; // one sheep crossing
// The fence sits in the middle; a sheep is "over it" between 40% and 60% of its trip
const inJump = (p: number) => p > 0.4 && p < 0.6;

const CountingSheep = () => {
  const refresh = useRefreshProfile();
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState("Tap the sheep as it leaps over the fence.");
  const counted = useRef(false);
  const startAt = useRef(0);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = (t: number) => {
      if (!startAt.current) startAt.current = t;
      const p = ((t - startAt.current) % TRIP_MS) / TRIP_MS;
      setProgress((prev) => { if (p < prev) counted.current = false; return p; });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const start = () => { setCount(0); counted.current = false; startAt.current = 0; setMsg("Breathe slowly… tap when the sheep jumps."); setRunning(true); };

  const tap = async () => {
    if (!running || counted.current) return;
    if (!inJump(progress)) { setMsg("Gently… wait for the leap 🐑"); return; }
    counted.current = true;
    const n = count + 1;
    setCount(n);
    setMsg(`${n} sheep…`);
    if (n >= GOAL) {
      setRunning(false);
      setMsg("All the sheep are home. Sweet dreams 🌙");
      const { error } = await supabase.from("breathing_sessions").insert({ cycles: GOAL });
      if (!error) { toast.success("Flock counted! +3 Zzz Points 🐑"); refresh(); }
    }
  };

  const x = progress * 100;
  const y = inJump(progress) ? Math.sin(((progress - 0.4) / 0.2) * Math.PI) * 60 : 0;

  return (
    <Card className="glass-card p-8 max-w-2xl mx-auto text-center space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Counting Sheep</h2>
        <p className="text-muted-foreground">Count {GOAL} sheep over the fence at your own slow pace.</p>
      </div>
      <button type="button" onClick={tap} aria-label="Count sheep"
        className="relative w-full h-48 rounded-xl bg-secondary/30 border border-border/50 overflow-hidden cursor-pointer">
        <div className="absolute bottom-0 inset-x-0 h-8 bg-primary/15" />
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-4xl select-none">🪵</div>
        {running && (
          <span className="absolute bottom-8 text-5xl select-none" style={{ left: `calc(${x}% - 24px)`, transform: `translateY(${-y}px) scaleX(-1)` }}>🐑</span>
        )}
        {!running && <span className="absolute inset-0 flex items-center justify-center text-6xl">{count >= GOAL ? "😴" : "🐑"}</span>}
      </button>
      <p className="text-lg">{msg}</p>
      <div className="space-y-1">
        <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${(count / GOAL) * 100}%` }} /></div>
        <p className="text-xs text-muted-foreground">{count}/{GOAL} sheep</p>
      </div>
      <Button onClick={running ? () => setRunning(false) : start} className="dream-glow">{running ? "Stop" : count >= GOAL ? "Count again" : "Begin"}</Button>
      <p className="text-xs text-muted-foreground">Calming sessions (breathing or sheep) earn +3 Zzz Points, up to 3 a day.</p>
    </Card>
  );
};
export default CountingSheep;
