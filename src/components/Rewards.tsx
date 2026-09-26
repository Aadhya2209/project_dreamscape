import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AVATARS, useProfile, useRefreshProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock } from "lucide-react";

const Rewards = () => {
  const { user } = useAuth();
  const { data: p } = useProfile();
  const refresh = useRefreshProfile();
  const [name, setName] = useState("");
  useEffect(() => { if (p) setName(p.display_name); }, [p]);
  const pts = p?.zzz_points ?? 0;

  const update = async (fields: { avatar?: string; display_name?: string }) => {
    const { error } = await supabase.from("profiles").update(fields).eq("id", user!.id);
    if (error) return toast.error(error.message);
    toast.success("Profile updated"); refresh();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="glass-card p-6 space-y-4 text-center">
        <div className="text-7xl">{p?.avatar}</div>
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
          <Button variant="outline" onClick={() => name.trim() && update({ display_name: name.trim() })}>Save</Button>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div><p className="text-2xl font-bold gradient-text">{pts}</p><p className="text-muted-foreground">Zzz Points</p></div>
          <div><p className="text-2xl font-bold gradient-text">{p?.current_streak ?? 0}</p><p className="text-muted-foreground">Streak</p></div>
          <div><p className="text-2xl font-bold gradient-text">{p?.longest_streak ?? 0}</p><p className="text-muted-foreground">Best</p></div>
        </div>
        <div className="text-xs text-muted-foreground text-left space-y-1 pt-2 border-t border-border/40">
          <p>+10 for each night logged</p><p>+5 for each dream recorded</p><p>+3 for breathing (up to 3 a day)</p>
        </div>
      </Card>
      <Card className="glass-card p-6 lg:col-span-2">
        <h2 className="text-xl font-semibold mb-4">Avatar collection</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {AVATARS.map((a) => {
            const locked = pts < a.cost;
            const active = p?.avatar === a.emoji;
            return (
              <button key={a.emoji} disabled={locked} onClick={() => update({ avatar: a.emoji })}
                className={`rounded-xl border p-4 text-center transition ${active ? "border-primary dream-glow" : "border-border/50"} ${locked ? "opacity-40 cursor-not-allowed" : "hover:border-primary"}`}>
                <div className="text-4xl">{a.emoji}</div>
                <p className="text-sm mt-1">{a.name}</p>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">{locked && <Lock size={10} />}{a.cost ? `${a.cost} pts` : "Free"}</p>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
export default Rewards;
