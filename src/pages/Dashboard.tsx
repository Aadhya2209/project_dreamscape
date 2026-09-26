import { Link } from "react-router-dom";
import CountingSheep from "@/components/CountingSheep";
import NotificationBell from "@/components/NotificationBell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import FloatingStars from "@/components/FloatingStars";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import SleepTracker from "@/components/SleepTracker";
import DreamJournal from "@/components/DreamJournal";
import BreathingGame from "@/components/BreathingGame";
import SoundMixer from "@/components/SoundMixer";
import Rewards from "@/components/Rewards";
import Buddies, { addByCode } from "@/components/Buddies";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import BedtimeSettings from "@/components/BedtimeSettings";
import { useNightMode } from "@/hooks/useNightMode";
import { Moon, BookOpen, Wind, Music, Trophy, Users, Flame, LogOut, Sparkles, Lock, BarChart3 } from "lucide-react";
import DreamMap from "@/components/DreamMap";
import Insights from "@/components/Insights";

const tabs = [
  { v: "sleep", label: "Sleep", icon: Moon, el: <div className="space-y-6"><SleepTracker /><BedtimeSettings /></div> },
  { v: "dreams", label: "Dreams", icon: BookOpen, el: <DreamJournal /> },
  { v: "sky", label: "Dream Sky", icon: Sparkles, el: <DreamMap /> },
  { v: "breathe", label: "Breathe", icon: Wind, el: <div className="space-y-8"><BreathingGame /><CountingSheep /></div> },
  { v: "sounds", label: "Sounds", icon: Music, el: <SoundMixer /> },
  { v: "stats", label: "Stats", icon: BarChart3, el: <Insights /> },
  { v: "rewards", label: "Rewards", icon: Trophy, el: <Rewards /> },
  { v: "buddies", label: "Buddies", icon: Users, el: <Buddies /> },
];
const NIGHT_TABS = ["breathe", "sounds"];

const Dashboard = () => {
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const { locked, snooze, wake } = useNightMode();
  const [tab, setTab] = useState("sleep");
  useEffect(() => { if (locked && !NIGHT_TABS.includes(tab)) setTab("breathe"); }, [locked, tab]);
  useEffect(() => {
    const code = localStorage.getItem("pendingInvite");
    if (!code) return;
    localStorage.removeItem("pendingInvite");
    addByCode(code).then(() => qc.invalidateQueries({ queryKey: ["buddies"] }));
  }, [qc]);
  const visible = locked ? tabs.filter((t) => NIGHT_TABS.includes(t.v)) : tabs;
  return (
    <div className="min-h-screen relative">
      <FloatingStars />
      <header className="relative z-10 border-b border-border/30 glass-card">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="text-2xl font-bold gradient-text font-display">DreamScape</Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1" title="Streak"><Flame size={16} className="text-primary" />{profile?.current_streak ?? 0}</span>
            <span className="font-semibold" title="Zzz Points">💤 {profile?.zzz_points ?? 0}</span>
            <span className="text-2xl" title={profile?.display_name}>{profile?.avatar ?? "🌙"}</span>
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out"><LogOut size={18} /></Button>
          </div>
        </div>
      </header>
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Good night, <span className="gradient-text">{profile?.display_name ?? "dreamer"}</span></h1>
        {locked && (
          <div className="glass-card rounded-xl p-5 mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3"><Lock className="text-primary" size={20} />
              <div><p className="font-semibold">Night Lock is on</p><p className="text-sm text-muted-foreground">Only calming tools until {wake}. Put the screen down soon 🌙</p></div></div>
            <Button variant="ghost" size="sm" onClick={snooze}>I need 5 more minutes</Button>
          </div>
        )}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="glass-card w-full h-auto flex flex-wrap justify-start gap-1 p-1 mb-6">
            {visible.map((t) => (
              <TabsTrigger key={t.v} value={t.v} className="flex-1 min-w-[90px]"><t.icon size={16} className="mr-1" />{t.label}</TabsTrigger>
            ))}
          </TabsList>
          {visible.map((t) => <TabsContent key={t.v} value={t.v}>{t.el}</TabsContent>)}
        </Tabs>
      </main>
    </div>
  );
};
export default Dashboard;
