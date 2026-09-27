import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import FloatingStars from "@/components/FloatingStars";
import heroImage from "@/assets/hero-dreamscape.jpg";
import { useAuth } from "@/hooks/useAuth";
import { Moon, BookOpen, Wind, Music, Trophy, Users } from "lucide-react";

const features = [
  { icon: Moon, title: "Sleep Tracker", text: "Log bedtime, wake time and quality. Watch your trends grow." },
  { icon: BookOpen, title: "AI Dream Journal", text: "Record dreams and get gentle AI interpretations." },
  { icon: Wind, title: "6-7-8 Breathing", text: "A calming mini-game that guides you into rest." },
  { icon: Music, title: "Soundscapes", text: "Mix rain, ocean, wind and hum into your perfect night." },
  { icon: Trophy, title: "Zzz Points", text: "Earn points and unlock dreamy avatars for good habits." },
  { icon: Users, title: "DreamBuddies", text: "Add friends and keep your sleep streaks alive together." },
];

const Index = () => {
  const { user } = useAuth();
  const cta = user ? "/app" : "/auth";
  return (
    <div className="min-h-screen relative">
      <section className="relative min-h-[520px] h-[85svh] max-h-[800px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{ backgroundImage: `url(${heroImage})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/30 to-background" />
        <FloatingStars />
        <div className="relative z-10 text-center space-y-8 px-4 max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-6xl md:text-8xl font-bold celestial-title dream-float">DreamScape</h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A gentle, gamified sleep wellness companion. Track your nights, decode your dreams, breathe, and rest better.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild size="lg" className="dream-glow text-lg px-8 py-6"><Link to={cta}>{user ? "Open my DreamScape" : "Start sleeping better"}</Link></Button>
            {!user && <Button asChild variant="outline" size="lg" className="bg-background/20 text-lg px-8 py-6"><Link to="/auth">Sign in</Link></Button>}
          </div>
        </div>
      </section>
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="glass-card p-6 space-y-3">
              <f.icon className="text-primary" />
              <h3 className="text-xl font-semibold">{f.title}</h3>
              <p className="text-muted-foreground">{f.text}</p>
            </Card>
          ))}
        </div>
      </section>
      <footer className="py-12 text-center border-t border-border/30 text-muted-foreground space-y-2">
        <div>✨ DreamScape — rest is a superpower</div>
        <div className="text-sm font-display gradient-text">crafted with 🌙 by Aadhya</div>
      </footer>
    </div>
  );
};
export default Index;
