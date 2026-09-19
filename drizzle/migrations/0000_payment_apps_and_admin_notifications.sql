ALTER TABLE public.claims
  ADD COLUMN IF NOT EXISTS apps_selected text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS payment_app text,
  ADD COLUMN IF NOT EXISTS download_clicked text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS device_platform text;

ALTER TABLE public.claims
  ADD CONSTRAINT claims_apps_selected_max2 CHECK (cardinality(apps_selected) <= 2),
  ADD CONSTRAINT claims_payment_app_in_selected CHECK (payment_app IS NULL OR payment_app = ANY(apps_selected)),
  ADD CONSTRAINT claims_device_platform_valid CHECK (device_platform IS NULL OR device_platform IN ('ios','android'));

CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('apps_selected','app_download_clicked')),
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX admin_notifications_unread_idx ON public.admin_notifications (is_read, created_at DESC);

GRANT SELECT, UPDATE ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read notifications" ON public.admin_notifications
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update notifications" ON public.admin_notifications
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;

CREATE OR REPLACE FUNCTION public.app_display_name(_key text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _key
    WHEN 'lemfi' THEN 'LemFi'
    WHEN 'worldremit' THEN 'WorldRemit'
    WHEN 'wapipay' THEN 'WapiPay'
    ELSE _key END
$$;

CREATE OR REPLACE FUNCTION public.set_payment_apps(_case_id uuid, _apps text[], _payment_app text, _platform text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref text;
  v_names text;
  v_platform_label text;
BEGIN
  IF _apps IS NULL OR cardinality(_apps) < 1 OR cardinality(_apps) > 2 THEN
    RAISE EXCEPTION 'Select one or two apps';
  END IF;
  IF EXISTS (SELECT 1 FROM unnest(_apps) a WHERE a NOT IN ('lemfi','worldremit','wapipay')) THEN
    RAISE EXCEPTION 'Unknown payment app';
  END IF;
  IF _payment_app IS NULL OR NOT (_payment_app = ANY(_apps)) THEN
    RAISE EXCEPTION 'Payment app must be one of the selected apps';
  END IF;
  IF _platform NOT IN ('ios','android') THEN
    RAISE EXCEPTION 'Invalid platform';
  END IF;

  UPDATE public.claims
     SET apps_selected = _apps,
         payment_app = _payment_app,
         device_platform = _platform
   WHERE id = _case_id
     AND user_id = auth.uid()
     AND status = 'Forwarded to Airline'
     AND payment_app IS NULL
  RETURNING reference INTO v_ref;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Claim not available for payment app selection';
  END IF;

  SELECT string_agg(public.app_display_name(a), ' and ' ORDER BY ord)
    INTO v_names
    FROM unnest(_apps) WITH ORDINALITY AS t(a, ord);

  v_platform_label := CASE WHEN _platform = 'ios' THEN 'iPhone' ELSE 'Android' END;

  INSERT INTO public.admin_notifications (case_id, type, message)
  VALUES (
    _case_id,
    'apps_selected',
    format('%s: customer chose %s, paying with %s (%s)', v_ref, v_names, public.app_display_name(_payment_app), v_platform_label)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.log_app_download_click(_case_id uuid, _app text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref text;
  v_platform text;
BEGIN
  UPDATE public.claims
     SET download_clicked = array_append(download_clicked, _app)
   WHERE id = _case_id
     AND user_id = auth.uid()
     AND _app = ANY(apps_selected)
     AND NOT (_app = ANY(download_clicked))
  RETURNING reference, device_platform INTO v_ref, v_platform;

  IF FOUND THEN
    INSERT INTO public.admin_notifications (case_id, type, message)
    VALUES (
      _case_id,
      'app_download_clicked',
      format('%s: customer tapped Download for %s (%s)', v_ref, public.app_display_name(_app),
             CASE WHEN v_platform = 'ios' THEN 'iPhone' WHEN v_platform = 'android' THEN 'Android' ELSE 'unknown device' END)
    );
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_payment_apps(uuid, text[], text, text) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.log_app_download_click(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_payment_apps(uuid, text[], text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_app_download_click(uuid, text) TO authenticated;