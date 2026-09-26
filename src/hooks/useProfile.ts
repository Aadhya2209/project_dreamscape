import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const AVATARS = [
  { emoji: "🌙", cost: 0, name: "Moon" },
  { emoji: "⭐", cost: 0, name: "Star" },
  { emoji: "🦉", cost: 30, name: "Night Owl" },
  { emoji: "🐑", cost: 60, name: "Counting Sheep" },
  { emoji: "🦊", cost: 100, name: "Dream Fox" },
  { emoji: "🐉", cost: 200, name: "Tamed Dragon" },
  { emoji: "🪐", cost: 350, name: "Planet Walker" },
  { emoji: "🦄", cost: 500, name: "Dream Unicorn" },
];

export const useProfile = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
};

export const useRefreshProfile = () => {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["profile"] });
};
