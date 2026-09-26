import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DreamCardProps {
  title: string;
  content: string;
  date: string;
  mood: string;
  tags?: string[];
}

const DreamCard = ({ title, content, date, mood, tags = [] }: DreamCardProps) => {
  const moodColors = {
    peaceful: "bg-blue-500/20 text-blue-300 border-blue-400/30",
    mysterious: "bg-purple-500/20 text-purple-300 border-purple-400/30", 
    adventurous: "bg-orange-500/20 text-orange-300 border-orange-400/30",
    surreal: "bg-pink-500/20 text-pink-300 border-pink-400/30",
  };

  return (
    <Card className="glass-card p-6 dream-float hover:dream-glow transition-all duration-300 group">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold gradient-text">{title}</h3>
          <Badge 
            variant="secondary" 
            className={moodColors[mood as keyof typeof moodColors] || moodColors.peaceful}
          >
            {mood}
          </Badge>
        </div>
        
        <p className="text-muted-foreground leading-relaxed line-clamp-3">
          {content}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{date}</span>
          <div className="flex gap-2">
            {tags.slice(0, 2).map((tag, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs bg-accent/10 border-accent/30 text-accent-foreground"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DreamCard;