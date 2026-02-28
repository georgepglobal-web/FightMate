CREATE TABLE IF NOT EXISTS public.group_members (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id text NOT NULL DEFAULT 'global',
  username text,
  score numeric NOT NULL DEFAULT 0,
  badges jsonb NOT NULL DEFAULT '[]'::jsonb,
  avatar_level text DEFAULT 'Novice',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, group_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all members"
  ON public.group_members FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own membership"
  ON public.group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own membership"
  ON public.group_members FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_group_members_score ON public.group_members(score DESC);

CREATE TRIGGER update_group_members_updated_at BEFORE UPDATE ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
