-- Client-visible progress is limited to five stages:
-- Submitted, Under Review, Approved, Forwarded to Airline, Payout Received.

-- 1. Fold any legacy stage names into the current five.
UPDATE public.claims
SET status = CASE status
  WHEN 'Fee Pending' THEN 'Under Review'
  WHEN 'Awaiting Payout' THEN 'Forwarded to Airline'
  WHEN 'Resolved' THEN 'Payout Received'
  WHEN 'Closed' THEN 'Payout Received'
  ELSE 'Submitted'
END
WHERE status NOT IN (
  'Submitted', 'Under Review', 'Approved', 'Forwarded to Airline', 'Payout Received'
);

-- 2. Enforce the five stages at the database level.
ALTER TABLE public.claims DROP CONSTRAINT IF EXISTS claims_status_check;
ALTER TABLE public.claims
  ADD CONSTRAINT claims_status_check
  CHECK (status IN (
    'Submitted', 'Under Review', 'Approved', 'Forwarded to Airline', 'Payout Received'
  ));

-- 3. Only staff move a claim forward. The old 'Awaiting Payout' carve-out for
--    client bank-detail submissions is removed, so clients can never change status.
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

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Only JetClaim staff can change the claim status';
  END IF;

  IF NEW.fee_status IS DISTINCT FROM OLD.fee_status AND NEW.fee_status <> 'settled' THEN
    RAISE EXCEPTION 'Only JetClaim staff can change the fee status';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_claim_update_rules() FROM PUBLIC, anon, authenticated;