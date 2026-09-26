import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flame, Copy, Share2, MessageCircle } from "lucide-react";
import BuddyChat from "@/components/BuddyChat";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";

type Profile = { id: string; display_name: string; avatar: string; zzz_points: number; current_streak: number; last_log_date: string | null };

export const addByCode = async (raw: string) => {
  const c = raw.trim().toUpperCase();
  if (!c) return false;
  const { data: { user } } = await supabase.auth.getUser();
  const { data: p } = await supabase.from("profiles").select("id, display_name").eq("invite_code", c).maybeSingle();
  if (!p) { toast.error("No dreamer found with that code"); return false; }
  if (p.id === user?.id) { toast.error("That's your own code 🙂"); return false; }
  const { error } = await supabase.from("buddies").insert({ addressee_id: p.id });
  if (error) { toast.error(error.code === "23505" ? "Request already sent" : error.message); return false; }
  toast.success(`Buddy request sent to ${p.display_name}`);
  return true;
};

const Buddies = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Profile[]>([]);

  const { data } = useQuery({
    queryKey: ["buddies"],
    queryFn: async () => {
      const { data: links, error } = await supabase.from("buddies").select("*");
      if (error) throw error;
      const ids = links.map((l) => (l.requester_id === user!.id ? l.addressee_id : l.requester_id));
      const { data: profs } = ids.length ? await supabase.from("profiles").select("*").in("id", ids) : { data: [] as Profile[] };
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      return links.map((l) => ({ ...l, other: map.get(l.requester_id === user!.id ? l.addressee_id : l.requester_id) as Profile | undefined }));
    },
  });
  const reload = () => qc.invalidateQueries({ queryKey: ["buddies"] });
  const links = data ?? [];
  const friends = links.filter((l) => l.status === "accepted");
  const incoming = links.filter((l) => l.status === "pending" && l.addressee_id === user!.id);
  const outgoing = links.filter((l) => l.status === "pending" && l.requester_id === user!.id);

  const search = async () => {
    if (!q.trim()) return;
    const { data } = await supabase.from("profiles").select("*").ilike("display_name", `%${q.trim()}%`).neq("id", user!.id).limit(10);
    setResults(data ?? []);
  };
  const add = async (id: string) => {
    const { error } = await supabase.from("buddies").insert({ addressee_id: id });
    if (error) return toast.error(error.code === "23505" ? "Request already sent" : error.message);
    toast.success("DreamBuddy request sent"); setResults([]); reload();
  };
  const accept = async (id: string) => { await supabase.from("buddies").update({ status: "accepted" }).eq("id", id); reload(); };
  const remove = async (id: string) => { await supabase.from("buddies").delete().eq("id", id); reload(); };
  const { data: me } = useProfile();
  const [code, setCode] = useState("");
  const [chat, setChat] = useState<Profile | null>(null);
  const link = `${window.location.origin}/invite/${me?.invite_code ?? ""}`;

  const today = new Date().toISOString().slice(0, 10);
  const Row = ({ p, children }: { p?: Profile; children?: React.ReactNode }) => (
    <div className="flex items-center gap-3 py-2">
      <span className="text-3xl">{p?.avatar ?? "🌙"}</span>
      <div className="flex-1">
        <p className="font-medium">{p?.display_name ?? "Dreamer"}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1"><Flame size={12} />{p?.current_streak ?? 0} night streak · 💤 {p?.zzz_points ?? 0}{p?.last_log_date === today && " · slept well today ✓"}</p>
      </div>
      {children}
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="glass-card p-6 space-y-4">
        <h2 className="text-xl font-semibold">Your DreamBuddies</h2>
        {friends.length === 0 && <p className="text-muted-foreground text-sm">No buddies yet. Find a friend and keep your streaks alive together.</p>}
        {friends.sort((a, b) => (b.other?.current_streak ?? 0) - (a.other?.current_streak ?? 0)).map((l) => (
          <Row key={l.id} p={l.other}>{l.other && <Button size="sm" variant="outline" onClick={() => setChat(l.other!)}><MessageCircle size={14} className="mr-1" />Chat</Button>}<Button size="sm" variant="ghost" onClick={() => remove(l.id)}>Remove</Button></Row>
        ))}
        {incoming.length > 0 && <div className="pt-4 border-t border-border/40"><h3 className="font-medium mb-2">Requests</h3>
          {incoming.map((l) => <Row key={l.id} p={l.other}><Button size="sm" onClick={() => accept(l.id)}>Accept</Button><Button size="sm" variant="ghost" onClick={() => remove(l.id)}>Decline</Button></Row>)}
        </div>}
        {outgoing.length > 0 && <div className="pt-4 border-t border-border/40"><h3 className="font-medium mb-2 text-muted-foreground">Waiting for reply</h3>
          {outgoing.map((l) => <Row key={l.id} p={l.other}><Button size="sm" variant="ghost" onClick={() => remove(l.id)}>Cancel</Button></Row>)}
        </div>}
      </Card>
      <div className="space-y-6">
      <Card className="glass-card p-6 space-y-3">
        <h2 className="text-xl font-semibold">Invite a friend</h2>
        <p className="text-sm text-muted-foreground">Share your link on WhatsApp — when they open it, a buddy request is sent to you.</p>
        <p className="text-3xl font-bold tracking-widest gradient-text">{me?.invite_code ?? "……"}</p>
        <div className="flex gap-2">
          <Button onClick={() => { navigator.clipboard.writeText(link); toast.success("Invite link copied"); }}><Copy size={16} className="mr-1" />Copy link</Button>
          {typeof navigator.share === "function" && <Button variant="outline" onClick={() => navigator.share({ title: "Join me on DreamScape", text: "Be my DreamBuddy!", url: link }).catch(() => {})}><Share2 size={16} className="mr-1" />Share</Button>}
        </div>
        <div className="flex gap-2 pt-3 border-t border-border/40">
          <Input placeholder="Friend's code" value={code} maxLength={6} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          <Button variant="outline" onClick={async () => { if (await addByCode(code)) setCode(""); }}>Add</Button>
        </div>
      </Card>
      <Card className="glass-card p-6 space-y-4">
        <h2 className="text-xl font-semibold">Find a buddy</h2>
        <div className="flex gap-2">
          <Input placeholder="Search by display name" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} />
          <Button onClick={search}>Search</Button>
        </div>
        {results.map((p) => <Row key={p.id} p={p}><Button size="sm" onClick={() => add(p.id)}>Add</Button></Row>)}
      </Card>
      </div>
      <BuddyChat buddy={chat} onClose={() => setChat(null)} />
    </div>
  );
};
export default Buddies;
