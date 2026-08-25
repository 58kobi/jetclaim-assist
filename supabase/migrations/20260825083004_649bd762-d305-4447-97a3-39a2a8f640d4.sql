CREATE INDEX IF NOT EXISTS claims_user_created_idx ON public.claims (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS claims_created_idx ON public.claims (created_at DESC);
CREATE INDEX IF NOT EXISTS claims_status_idx ON public.claims (status);
CREATE INDEX IF NOT EXISTS claim_documents_claim_idx ON public.claim_documents (claim_id, created_at);
CREATE INDEX IF NOT EXISTS claim_activity_claim_idx ON public.claim_activity (claim_id, created_at DESC);
CREATE INDEX IF NOT EXISTS user_roles_user_idx ON public.user_roles (user_id, role);