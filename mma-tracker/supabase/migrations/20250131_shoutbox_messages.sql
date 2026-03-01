CREATE TABLE IF NOT EXISTS public.shoutbox_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'user' CHECK (type IN ('system', 'user')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shoutbox_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all messages"
  ON public.shoutbox_messages FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own messages"
  ON public.shoutbox_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_shoutbox_messages_created ON public.shoutbox_messages(created_at DESC);
