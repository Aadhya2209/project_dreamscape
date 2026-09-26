import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useRefreshProfile } from "@/hooks/useProfile";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { BellRing, Lock } from "lucide-react";
import { toast } from "sonner";

const BedtimeSettings = () => {
  const { user } = useAuth();
  const { data: p } = useProfile();
  const refresh = useRefreshProfile();
  const [f, setF] = useState({ target_bedtime: "22:30", wake_target: "06:30", reminder_minutes: 30, reminder_enabled: false, night_lock_enabled: false });
  useEffect(() => {
    if (p) setF({ target_bedtime: p.target_bedtime.slice(0, 5), wake_target: p.wake_target.slice(0, 5), reminder_minutes: p.reminder_minutes, reminder_enabled: p.reminder_enabled, night_lock_enabled: p.night_lock_enabled });
  }, [p]);

  const save = async () => {
    if (f.reminder_enabled && "Notification" in window && Notification.permission === "default") await Notification.requestPermission();
    const { error } = await supabase.from("profiles").update({ ...f, reminder_minutes: Math.min(120, Math.max(0, Number(f.reminder_minutes) || 0)) }).eq("id", user!.id);
    if (error) return toast.error(error.message);
    toast.success("Bedtime routine saved"); refresh();
  };

  return (
    <Card className="glass-card p-6 space-y-5">
      <h2 className="text-xl font-semibold">Bedtime routine</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1"><Label htmlFor="bt">Bedtime</Label><Input id="bt" type="time" value={f.target_bedtime} onChange={(e) => setF({ ...f, target_bedtime: e.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor="wt">Wake up</Label><Input id="wt" type="time" value={f.wake_target} onChange={(e) => setF({ ...f, wake_target: e.target.value })} /></div>
      </div>
      <div className="flex items-start justify-between gap-4">
        <div><p className="font-medium flex items-center gap-2"><BellRing size={16} className="text-primary" />Bedtime reminder</p>
          <p className="text-xs text-muted-foreground">A gentle nudge before bed while DreamScape is open.</p></div>
        <Switch checked={f.reminder_enabled} onCheckedChange={(v) => setF({ ...f, reminder_enabled: v })} aria-label="Bedtime reminder" />
      </div>
      {f.reminder_enabled && (
        <div className="flex items-center gap-2 text-sm">Remind me
          <Input type="number" min={0} max={120} className="w-20" value={f.reminder_minutes} onChange={(e) => setF({ ...f, reminder_minutes: Number(e.target.value) })} />
          minutes before</div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div><p className="font-medium flex items-center gap-2"><Lock size={16} className="text-primary" />Night Lock</p>
          <p className="text-xs text-muted-foreground">From bedtime until wake-up, only Breathe and Sounds stay open so you can drift off.</p></div>
        <Switch checked={f.night_lock_enabled} onCheckedChange={(v) => setF({ ...f, night_lock_enabled: v })} aria-label="Night Lock" />
      </div>
      <Button onClick={save} className="w-full">Save routine</Button>
    </Card>
  );
};
export default BedtimeSettings;
