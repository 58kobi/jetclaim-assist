CREATE TABLE public.claim_activity (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  actor_id uuid,
  field text not null,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);

GRANT SELECT ON public.claim_activity TO authenticated;
GRANT ALL ON public.claim_activity TO service_role;

ALTER TABLE public.claim_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read claim activity" ON public.claim_activity
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.log_claim_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.claim_activity(claim_id, actor_id, field, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'status', OLD.status, NEW.status);
  END IF;
  IF NEW.is_refundable IS DISTINCT FROM OLD.is_refundable THEN
    INSERT INTO public.claim_activity(claim_id, actor_id, field, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'is_refundable', OLD.is_refundable::text, NEW.is_refundable::text);
  END IF;
  IF NEW.compensation_amount IS DISTINCT FROM OLD.compensation_amount THEN
    INSERT INTO public.claim_activity(claim_id, actor_id, field, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'compensation_amount', OLD.compensation_amount::text, NEW.compensation_amount::text);
  END IF;
  IF NEW.jetclaim_fee_amount IS DISTINCT FROM OLD.jetclaim_fee_amount THEN
    INSERT INTO public.claim_activity(claim_id, actor_id, field, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'jetclaim_fee_amount', OLD.jetclaim_fee_amount::text, NEW.jetclaim_fee_amount::text);
  END IF;
  IF NEW.fee_status IS DISTINCT FROM OLD.fee_status THEN
    INSERT INTO public.claim_activity(claim_id, actor_id, field, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'fee_status', OLD.fee_status, NEW.fee_status);
  END IF;
  IF NEW.regulation_code IS DISTINCT FROM OLD.regulation_code THEN
    INSERT INTO public.claim_activity(claim_id, actor_id, field, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'regulation_code', OLD.regulation_code, NEW.regulation_code);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER claims_activity_log
AFTER UPDATE ON public.claims
FOR EACH ROW EXECUTE FUNCTION public.log_claim_activity();