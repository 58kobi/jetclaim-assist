ALTER TABLE public.claims REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='claims') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.claims;
  END IF;
END $$;