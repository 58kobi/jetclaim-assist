ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS deleted_by uuid;
CREATE INDEX IF NOT EXISTS claims_deleted_at_idx ON public.claims (deleted_at);

CREATE OR REPLACE FUNCTION public.enforce_claim_update_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    IF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
      NEW.deleted_by := CASE WHEN NEW.deleted_at IS NULL THEN NULL ELSE auth.uid() END;
    END IF;
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

  IF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at OR NEW.deleted_by IS DISTINCT FROM OLD.deleted_by THEN
    RAISE EXCEPTION 'Only JetClaim staff can delete or restore claims';
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

CREATE OR REPLACE FUNCTION public.log_claim_trash_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
    INSERT INTO public.claim_activity(claim_id, actor_id, field, old_value, new_value)
    VALUES (
      NEW.id,
      auth.uid(),
      'trash',
      CASE WHEN OLD.deleted_at IS NULL THEN 'Active' ELSE 'In trash' END,
      CASE WHEN NEW.deleted_at IS NULL THEN 'Restored' ELSE 'Moved to trash' END
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_claim_trash_activity() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS claims_log_trash_activity ON public.claims;
CREATE TRIGGER claims_log_trash_activity
AFTER UPDATE OF deleted_at ON public.claims
FOR EACH ROW EXECUTE FUNCTION public.log_claim_trash_activity();