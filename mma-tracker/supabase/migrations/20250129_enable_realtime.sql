-- Enable realtime for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.shoutbox_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sparring_sessions;
