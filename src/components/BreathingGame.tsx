import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRefreshProfile } from "@/hooks/useProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PHASES = [
  { name: "Breathe in", secs: 6, scale: 1.6 },
  { name: "Hold", secs: 7, scale: 1.6 },
  { name: "Breathe out", secs: 8, scale: 0.8 },
];
const TOTAL = 4;

const BreathingGame = () => {
  const refresh = useRefreshProfile();
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [left, setLeft] = useState(PHASES[0].secs);
  const [cycle, setCycle] = useState(0);
  const state = useRef({ phase: 0, left: PHASES[0].secs, cycle: 0 });

  useEffect(() => {
    if (!running) return;
    const t = setInterval(async () => {
      const s = state.current;
      s.left -= 1;
      if (s.left <= 0) {
        s.phase = (s.phase + 1) % 3;
        if (s.phase === 0) s.cycle += 1;
        s.left = PHASES[s.phase].secs;
        if (s.cycle >= TOTAL) {
          setRunning(false);
          setCycle(TOTAL);
          const { error } = await supabase.from("breathing_sessions").insert({ cycles: TOTAL });
          if (!error) { toast.success("Dragon of Insomnia calmed! +3 Zzz Points 🐉"); refresh(); }
          return;
        }
      }
      setPhase(s.phase); setLeft(s.left); setCycle(s.cycle);
    }, 1000);
    return () => clearInterval(t);
  }, [running, refresh]);

  const start = () => {
    state.current = { phase: 0, left: PHASES[0].secs, cycle: 0 };
    setPhase(0); setLeft(PHASES[0].secs); setCycle(0); setRunning(true);
  };

  const p = PHASES[phase];
  const dragonCalm = Math.round((cycle / TOTAL) * 100);

  return (
    <Card className="glass-card p-8 max-w-2xl mx-auto text-center space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">6-7-8 Breathing: Calm the Insomnia Dragon</h2>
        <p className="text-muted-foreground">Complete {TOTAL} cycles to lull the dragon to sleep.</p>
      </div>
      <div className="relative h-72 flex items-center justify-center">
        <div
          className="w-32 h-32 rounded-full bg-primary/30 border border-primary/60 dream-glow flex items-center justify-center"
          style={{ transform: `scale(${running ? p.scale : 1})`, transition: `transform ${running ? p.secs : 0.5}s ease-in-out` }}
        >
          <span className="text-5xl" style={{ transform: `scale(${running ? 1 / p.scale : 1})` }}>{cycle >= TOTAL ? "😴" : "🐉"}</span>
        </div>
      </div>
      {running ? (
        <div><p className="text-3xl font-bold gradient-text">{p.name}</p><p className="text-5xl font-light mt-2">{left}</p></div>
      ) : (
        <p className="text-lg">{cycle >= TOTAL ? "The dragon sleeps. So can you. 🌙" : "Find a comfortable position, then begin."}</p>
      )}
      <div className="space-y-1">
        <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${dragonCalm}%` }} /></div>
        <p className="text-xs text-muted-foreground">Dragon calmness {dragonCalm}% · cycle {Math.min(cycle + (running ? 1 : 0), TOTAL)}/{TOTAL}</p>
      </div>
      <Button onClick={running ? () => setRunning(false) : start} className="dream-glow">{running ? "Stop" : "Begin"}</Button>
    </Card>
  );
};
export default BreathingGame;
