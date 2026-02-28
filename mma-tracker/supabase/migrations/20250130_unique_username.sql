-- Enforce unique usernames within a group (where username is not null)
CREATE UNIQUE INDEX idx_group_members_unique_username
  ON public.group_members(group_id, username)
  WHERE username IS NOT NULL;
