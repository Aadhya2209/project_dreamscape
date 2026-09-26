import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import VoiceDreamButton from "@/components/VoiceDreamButton";

interface DreamFormProps {
  onSubmit: (dream: {
    title: string;
    content: string;
    mood: string;
    tags: string[];
    is_lucid: boolean;
  }) => void;
}

const DreamForm = ({ onSubmit }: DreamFormProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [lucid, setLucid] = useState(false);

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim()) && tags.length < 5) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && content.trim() && mood) {
      onSubmit({ title, content, mood, tags, is_lucid: lucid });
      setLucid(false);
      setTitle("");
      setContent("");
      setMood("");
      setTags([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Card className="glass-card p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <VoiceDreamButton onText={(t) => {
          setContent((c) => (c.trim() ? `${c.trim()}\n\n${t}` : t));
          setTitle((v) => v || `Spoken dream · ${new Date().toLocaleDateString()}`);
        }} />
        <div className="space-y-2">
          <Label htmlFor="title" className="text-foreground font-medium">Dream Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your dream a name..."
            className="bg-background/50 border-border/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content" className="text-foreground font-medium">Dream Description</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe your dream in detail..."
            className="min-h-32 bg-background/50 border-border/50 resize-none"
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mood" className="text-foreground font-medium">Dream Mood</Label>
          <Select value={mood} onValueChange={setMood}>
            <SelectTrigger className="bg-background/50 border-border/50">
              <SelectValue placeholder="How did this dream feel?" />
            </SelectTrigger>
            <SelectContent className="glass-card border-border/50">
              <SelectItem value="peaceful">🌙 Peaceful</SelectItem>
              <SelectItem value="mysterious">🔮 Mysterious</SelectItem>
              <SelectItem value="adventurous">⭐ Adventurous</SelectItem>
              <SelectItem value="surreal">💫 Surreal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags" className="text-foreground font-medium">Tags</Label>
          <div className="flex gap-2">
            <Input
              id="tags"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a tag..."
              className="bg-background/50 border-border/50"
            />
            <Button 
              type="button" 
              onClick={handleAddTag}
              variant="outline"
              className="shrink-0 border-border/50 bg-background/30"
            >
              Add
            </Button>
          </div>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-accent/20 text-accent-foreground border-accent/30 pr-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={lucid} onChange={(e) => setLucid(e.target.checked)} className="accent-primary h-4 w-4" />
          👁️ Lucid dream — I knew I was dreaming
        </label>

        <Button 
          type="submit" 
          className="w-full dream-glow hover:scale-[1.02] transition-all duration-300"
          disabled={!title.trim() || !content.trim() || !mood}
        >
          Save Dream ✨
        </Button>
      </form>
    </Card>
  );
};

export default DreamForm;