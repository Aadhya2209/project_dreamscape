CREATE OR REPLACE FUNCTION public.are_buddies(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.buddies WHERE status = 'accepted'
    AND ((requester_id = _a AND addressee_id = _b) OR (requester_id = _b AND addressee_id = _a)))
$$;

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL DEFAULT auth.uid(),
  recipient_id uuid NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own conversations" ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Message buddies" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND public.are_buddies(sender_id, recipient_id));
CREATE INDEX messages_pair_idx ON public.messages(sender_id, recipient_id, created_at);
CREATE INDEX messages_recipient_idx ON public.messages(recipient_id, created_at);
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;