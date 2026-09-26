import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { recordWav } from "@/lib/recordWav";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";

const MAX_SECS = 300;

const VoiceDreamButton = ({ onText }: { onText: (t: string) => void }) => {
  const [state, setState] = useState<"idle" | "rec" | "busy">("idle");
  const [secs, setSecs] = useState(0);
  const rec = useRef<{ stop: () => Promise<File> } | null>(null);

  useEffect(() => {
    if (state !== "rec") return;
    const t = setInterval(() => setSecs((s) => { if (s + 1 >= MAX_SECS) stop(); return s + 1; }), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const start = async () => {
    try { rec.current = await recordWav(); setSecs(0); setState("rec"); }
    catch { toast.error("Please allow microphone access to record your dream"); }
  };

  const stop = async () => {
    const r = rec.current; rec.current = null;
    if (!r) return;
    setState("busy");
    try {
      const file = await r.stop();
      const fd = new FormData(); fd.append("file", file);
      const { data, error } = await supabase.functions.invoke("transcribe-dream", { body: fd });
      if (error || data?.error) {
        let msg = data?.error;
        try { msg = msg ?? (await (error as any)?.context?.json())?.error; } catch { /* ignore */ }
        throw new Error(msg ?? "Could not transcribe your dream");
      }
      onText(data.text);
      toast.success("Dream transcribed — review it and save ✨");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not transcribe your dream");
    } finally { setState("idle"); }
  };

  const mm = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  return (
    <Button type="button" variant={state === "rec" ? "destructive" : "outline"} className="w-full" disabled={state === "busy"} onClick={state === "rec" ? stop : start}>
      {state === "idle" && <><Mic size={16} className="mr-2" />Speak your dream</>}
      {state === "rec" && <><Square size={14} className="mr-2" />Stop recording · {mm}</>}
      {state === "busy" && <><Loader2 size={16} className="mr-2 animate-spin" />Writing it down…</>}
    </Button>
  );
};
export default VoiceDreamButton;
