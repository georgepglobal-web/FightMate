CREATE TABLE IF NOT EXISTS public.sparring_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  date date NOT NULL,
  time text NOT NULL,
  location text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sparring_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all sparring sessions"
  ON public.sparring_sessions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create sparring sessions"
  ON public.sparring_sessions FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creator or opponent can update sparring session"
  ON public.sparring_sessions FOR UPDATE
  USING (auth.uid() = creator_id OR auth.uid() = opponent_id);

CREATE INDEX idx_sparring_sessions_creator ON public.sparring_sessions(creator_id);
CREATE INDEX idx_sparring_sessions_date ON public.sparring_sessions(date);

CREATE TRIGGER update_sparring_sessions_updated_at BEFORE UPDATE ON public.sparring_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
