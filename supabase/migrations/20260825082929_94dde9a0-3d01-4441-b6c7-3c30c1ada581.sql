-- 1. Staff-only internal notes, moved off the client-readable claims row
CREATE TABLE public.claim_notes (
  claim_id UUID PRIMARY KEY REFERENCES public.claims(id) ON DELETE CASCADE,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.claim_notes TO authenticated;
GRANT ALL ON public.claim_notes TO service_role;

ALTER TABLE public.claim_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage claim notes"
ON public.claim_notes FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_claim_notes_updated_at
BEFORE UPDATE ON public.claim_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.claim_notes (claim_id, notes)
SELECT id, internal_notes FROM public.claims
WHERE internal_notes IS NOT NULL AND internal_notes <> '';

ALTER TABLE public.claims DROP COLUMN internal_notes;

-- 2. Clients may only settle fees / submit bank details on their own claim
CREATE OR REPLACE FUNCTION public.enforce_claim_update_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.reference IS DISTINCT FROM OLD.reference
     OR NEW.is_refundable IS DISTINCT FROM OLD.is_refundable
     OR NEW.regulation_code IS DISTINCT FROM OLD.regulation_code
     OR NEW.compensation_amount IS DISTINCT FROM OLD.compensation_amount
     OR NEW.compensation_currency IS DISTINCT FROM OLD.compensation_currency
     OR NEW.jetclaim_fee_amount IS DISTINCT FROM OLD.jetclaim_fee_amount
     OR NEW.expected_payout_window IS DISTINCT FROM OLD.expected_payout_window
     OR NEW.actual_payout_received_at IS DISTINCT FROM OLD.actual_payout_received_at
  THEN
    RAISE EXCEPTION 'Only JetClaim staff can change claim assessment or payout fields';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'Awaiting Payout' THEN
    RAISE EXCEPTION 'Only JetClaim staff can change the claim status';
  END IF;

  IF NEW.fee_status IS DISTINCT FROM OLD.fee_status AND NEW.fee_status <> 'settled' THEN
    RAISE EXCEPTION 'Only JetClaim staff can change the fee status';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_claim_update_rules
BEFORE UPDATE ON public.claims
FOR EACH ROW EXECUTE FUNCTION public.enforce_claim_update_rules();

REVOKE EXECUTE ON FUNCTION public.enforce_claim_update_rules() FROM PUBLIC, anon, authenticated;