CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own notifications read" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own notifications delete" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.on_buddy_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT display_name INTO n FROM public.profiles WHERE id = NEW.requester_id;
    INSERT INTO public.notifications(user_id, message) VALUES (NEW.addressee_id, COALESCE(n,'Someone') || ' sent you a DreamBuddy request');
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
    SELECT display_name INTO n FROM public.profiles WHERE id = NEW.addressee_id;
    INSERT INTO public.notifications(user_id, message) VALUES (NEW.requester_id, COALESCE(n,'Someone') || ' accepted your DreamBuddy request 🎉');
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'pending' AND auth.uid() = OLD.addressee_id THEN
    SELECT display_name INTO n FROM public.profiles WHERE id = OLD.addressee_id;
    INSERT INTO public.notifications(user_id, message) VALUES (OLD.requester_id, COALESCE(n,'Someone') || ' declined your DreamBuddy request');
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER buddy_notify AFTER INSERT OR UPDATE OR DELETE ON public.buddies
FOR EACH ROW EXECUTE FUNCTION public.on_buddy_change();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;