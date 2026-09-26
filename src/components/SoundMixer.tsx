import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause } from "lucide-react";

type Kind = "rain" | "ocean" | "wind" | "hum";
const SOUNDS: { id: Kind; label: string; emoji: string }[] = [
  { id: "rain", label: "Soft Rain", emoji: "🌧️" },
  { id: "ocean", label: "Ocean Waves", emoji: "🌊" },
  { id: "wind", label: "Night Wind", emoji: "🍃" },
  { id: "hum", label: "Dream Hum", emoji: "🔔" },
];

const noiseBuffer = (ctx: AudioContext, brown: boolean) => {
  const len = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
  }
  return buf;
};

const build = (ctx: AudioContext, kind: Kind, out: GainNode) => {
  if (kind === "hum") {
    [110, 164.8, 220].forEach((f) => { const o = ctx.createOscillator(); o.frequency.value = f; const g = ctx.createGain(); g.gain.value = 0.08; o.connect(g).connect(out); o.start(); });
    return;
  }
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, kind !== "rain");
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = kind === "rain" ? "highpass" : "lowpass";
  filter.frequency.value = kind === "rain" ? 1200 : kind === "ocean" ? 600 : 900;
  const g = ctx.createGain();
  g.gain.value = kind === "rain" ? 0.25 : 0.9;
  if (kind !== "rain") {
    const lfo = ctx.createOscillator(); lfo.frequency.value = kind === "ocean" ? 0.12 : 0.07;
    const depth = ctx.createGain(); depth.gain.value = 0.5;
    lfo.connect(depth).connect(g.gain); lfo.start();
  }
  src.connect(filter).connect(g).connect(out);
  src.start();
};

const SoundMixer = () => {
  const ctxRef = useRef<AudioContext | null>(null);
  const gains = useRef<Partial<Record<Kind, GainNode>>>({});
  const [playing, setPlaying] = useState(false);
  const [vols, setVols] = useState<Record<Kind, number>>({ rain: 50, ocean: 30, wind: 0, hum: 0 });
  const [timer, setTimer] = useState(0);

  const ensure = () => {
    if (ctxRef.current) return ctxRef.current;
    const ctx = new AudioContext();
    SOUNDS.forEach((s) => { const g = ctx.createGain(); g.gain.value = vols[s.id] / 100; g.connect(ctx.destination); gains.current[s.id] = g; build(ctx, s.id, g); });
    ctxRef.current = ctx;
    return ctx;
  };

  const toggle = async () => {
    const ctx = ensure();
    if (playing) await ctx.suspend(); else await ctx.resume();
    setPlaying(!playing);
  };

  useEffect(() => { SOUNDS.forEach((s) => gains.current[s.id]?.gain.setTargetAtTime(vols[s.id] / 100, ctxRef.current!.currentTime, 0.2)); }, [vols]);
  useEffect(() => () => { ctxRef.current?.close(); }, []);
  useEffect(() => {
    if (!playing || !timer) return;
    const t = setTimeout(() => { ctxRef.current?.suspend(); setPlaying(false); }, timer * 60000);
    return () => clearTimeout(t);
  }, [playing, timer]);

  return (
    <Card className="glass-card p-8 max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Create your soundscape</h2>
        <p className="text-muted-foreground">Blend calming sounds to drift off.</p>
      </div>
      {SOUNDS.map((s) => (
        <div key={s.id} className="flex items-center gap-4">
          <span className="text-2xl w-8">{s.emoji}</span>
          <span className="w-28 text-sm">{s.label}</span>
          <Slider className="flex-1" value={[vols[s.id]]} max={100} onValueChange={(v) => setVols((p) => ({ ...p, [s.id]: v[0] }))} />
        </div>
      ))}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Sleep timer:</span>
        {[0, 15, 30, 60].map((m) => (
          <Button key={m} size="sm" variant={timer === m ? "default" : "outline"} onClick={() => setTimer(m)}>{m ? `${m} min` : "Off"}</Button>
        ))}
      </div>
      <Button className="w-full dream-glow" size="lg" onClick={toggle}>{playing ? <><Pause className="mr-2" size={18} />Pause</> : <><Play className="mr-2" size={18} />Play</>}</Button>
    </Card>
  );
};
export default SoundMixer;
