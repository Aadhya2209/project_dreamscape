CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text NOT NULL DEFAULT 'Dreamer',
  avatar text NOT NULL DEFAULT '🌙',
  zzz_points integer NOT NULL DEFAULT 0,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_log_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (display_name, avatar) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1), 'Dreamer'));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.sleep_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  log_date date NOT NULL DEFAULT current_date,
  bedtime time NOT NULL,
  wake_time time NOT NULL,
  hours numeric(4,2) NOT NULL,
  quality integer NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sleep_logs TO authenticated;
GRANT ALL ON public.sleep_logs TO service_role;
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own sleep logs" ON public.sleep_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.dreams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  content text NOT NULL,
  mood text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  ai_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dreams TO authenticated;
GRANT ALL ON public.dreams TO service_role;
ALTER TABLE public.dreams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own dreams" ON public.dreams FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.buddies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL DEFAULT auth.uid(),
  addressee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.buddies TO authenticated;
GRANT ALL ON public.buddies TO service_role;
ALTER TABLE public.buddies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "See own buddy links" ON public.buddies FOR SELECT TO authenticated USING (auth.uid() IN (requester_id, addressee_id));
CREATE POLICY "Send requests" ON public.buddies FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id AND requester_id <> addressee_id AND status = 'pending');
CREATE POLICY "Addressee accepts" ON public.buddies FOR UPDATE TO authenticated USING (auth.uid() = addressee_id) WITH CHECK (auth.uid() = addressee_id AND status IN ('pending','accepted'));
CREATE POLICY "Either removes" ON public.buddies FOR DELETE TO authenticated USING (auth.uid() IN (requester_id, addressee_id));

CREATE OR REPLACE FUNCTION public.on_sleep_log() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles;
BEGIN
  SELECT * INTO p FROM public.profiles WHERE id = NEW.user_id;
  IF p.last_log_date IS NULL OR NEW.log_date > p.last_log_date THEN
    UPDATE public.profiles SET
      current_streak = CASE WHEN p.last_log_date = NEW.log_date - 1 THEN p.current_streak + 1 ELSE 1 END,
      longest_streak = GREATEST(p.longest_streak, CASE WHEN p.last_log_date = NEW.log_date - 1 THEN p.current_streak + 1 ELSE 1 END),
      last_log_date = NEW.log_date,
      zzz_points = p.zzz_points + 10
    WHERE id = NEW.user_id;
  ELSE
    UPDATE public.profiles SET zzz_points = zzz_points + 10 WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER sleep_log_points AFTER INSERT ON public.sleep_logs FOR EACH ROW EXECUTE FUNCTION public.on_sleep_log();

CREATE OR REPLACE FUNCTION public.on_dream() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET zzz_points = zzz_points + 5 WHERE id = NEW.user_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER dream_points AFTER INSERT ON public.dreams FOR EACH ROW EXECUTE FUNCTION public.on_dream();

CREATE TABLE public.breathing_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  cycles integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.breathing_sessions TO authenticated;
GRANT ALL ON public.breathing_sessions TO service_role;
ALTER TABLE public.breathing_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own breathing" ON public.breathing_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND cycles BETWEEN 1 AND 20);

CREATE OR REPLACE FUNCTION public.on_breathing() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.breathing_sessions WHERE user_id = NEW.user_id AND created_at::date = current_date) <= 3 THEN
    UPDATE public.profiles SET zzz_points = zzz_points + 3 WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER breathing_points AFTER INSERT ON public.breathing_sessions FOR EACH ROW EXECUTE FUNCTION public.on_breathing();