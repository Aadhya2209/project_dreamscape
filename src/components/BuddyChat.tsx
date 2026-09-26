import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { toast } from "sonner";

type Buddy = { id: string; display_name: string; avatar: string };

const BuddyChat = ({ buddy, onClose }: { buddy: Buddy | null; onClose: () => void }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const key = ["messages", buddy?.id];

  const { data: msgs = [] } = useQuery({
    queryKey: key,
    enabled: !!buddy && !!user,
    queryFn: async () => {
      const me = user!.id, b = buddy!.id;
      const { data, error } = await supabase.from("messages").select("*")
        .or(`and(sender_id.eq.${me},recipient_id.eq.${b}),and(sender_id.eq.${b},recipient_id.eq.${me})`)
        .order("created_at").limit(200);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!buddy || !user) return;
    const ch = supabase.channel(`chat-${user.id}-${buddy.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` },
        (p) => { if ((p.new as { sender_id: string }).sender_id === buddy.id) qc.invalidateQueries({ queryKey: ["messages", buddy.id] }); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [buddy, user, qc]);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  const send = async () => {
    const body = text.trim();
    if (!body || !buddy) return;
    setText("");
    const { error } = await supabase.from("messages").insert({ recipient_id: buddy.id, body });
    if (error) { setText(body); return toast.error("Message not sent — you can only chat with accepted buddies"); }
    qc.invalidateQueries({ queryKey: key });
  };

  return (
    <Dialog open={!!buddy} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass-card max-w-lg">
        <DialogHeader><DialogTitle>{buddy?.avatar} {buddy?.display_name}</DialogTitle></DialogHeader>
        <div className="h-80 overflow-y-auto space-y-2 pr-1">
          {msgs.length === 0 && <p className="text-sm text-muted-foreground text-center pt-10">Share a dream or a reflection to start the conversation 🌙</p>}
          {msgs.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${mine ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                  {m.body}
                  <p className="text-[10px] opacity-70 mt-1">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            );
          })}
          <div ref={end} />
        </div>
        <div className="flex gap-2">
          <Input value={text} maxLength={2000} placeholder="Write a message…" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
          <Button onClick={send} size="icon" aria-label="Send"><Send size={16} /></Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default BuddyChat;
