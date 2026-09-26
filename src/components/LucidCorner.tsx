import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

const TIPS = [
  "Look at your hands. Count your fingers — in dreams they often look strange.",
  "Read a line of text, look away, then read it again. Does it change?",
  "Try to push a finger through your palm. Ask: am I dreaming?",
  "Check a clock twice. Dream clocks rarely show the same time.",
  "As you fall asleep, repeat: \"Next time I'm dreaming, I'll know I'm dreaming.\"",
  "Pinch your nose and try to breathe. If you can, you're dreaming.",
  "Notice something odd today? Pause and do a reality check.",
];

const LucidCorner = () => {
  const [i, setI] = useState(() => new Date().getDate() % TIPS.length);
  return (
    <Card className="glass-card p-6 space-y-3">
      <h3 className="text-xl font-display flex items-center gap-2"><Eye size={18} className="text-primary" />Lucid dreaming corner</h3>
      <p className="text-sm text-muted-foreground">Reality check of the moment:</p>
      <p className="leading-relaxed">{TIPS[i]}</p>
      <Button size="sm" variant="outline" onClick={() => setI((i + 1) % TIPS.length)}>Another tip</Button>
      <p className="text-xs text-muted-foreground">Knew you were dreaming? Tick "Lucid dream" when you save it.</p>
    </Card>
  );
};
export default LucidCorner;
