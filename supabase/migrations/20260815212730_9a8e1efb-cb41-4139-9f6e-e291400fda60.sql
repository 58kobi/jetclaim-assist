-- roles
CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email, NEW.raw_user_meta_data ->> 'phone')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- reference data
CREATE TABLE public.airlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  iata_code text,
  country text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.airlines TO anon, authenticated;
GRANT ALL ON public.airlines TO service_role;
ALTER TABLE public.airlines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Airlines are public" ON public.airlines FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.regulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  region text NOT NULL,
  max_compensation text,
  summary text,
  trigger_conditions text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.regulations TO anon, authenticated;
GRANT ALL ON public.regulations TO service_role;
ALTER TABLE public.regulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Regulations are public" ON public.regulations FOR SELECT TO anon, authenticated USING (true);

-- claims
CREATE TABLE public.claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference text NOT NULL UNIQUE DEFAULT ('JC-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  airline_name text NOT NULL,
  flight_number text NOT NULL,
  flight_date date NOT NULL,
  departure_airport text NOT NULL,
  arrival_airport text NOT NULL,
  issue_type text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'Submitted',
  regulation_code text,
  is_refundable boolean NOT NULL DEFAULT false,
  compensation_amount numeric(12,2),
  compensation_currency text DEFAULT 'EUR',
  jetclaim_fee_amount numeric(12,2),
  fee_status text NOT NULL DEFAULT 'not_set',
  bank_details_submitted_at timestamptz,
  expected_payout_window text DEFAULT '1-3 weeks (up to 6 weeks in some cases)',
  actual_payout_received_at timestamptz,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.claims TO authenticated;
GRANT ALL ON public.claims TO service_role;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own claims" ON public.claims FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users create own claims" ON public.claims FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own claims" ON public.claims FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER claims_updated_at BEFORE UPDATE ON public.claims FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.claim_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  content_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.claim_documents TO authenticated;
GRANT ALL ON public.claim_documents TO service_role;
ALTER TABLE public.claim_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own documents" ON public.claim_documents FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users add own documents" ON public.claim_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own documents" ON public.claim_documents FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.bank_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL UNIQUE REFERENCES public.claims(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_holder text NOT NULL,
  account_number text NOT NULL,
  swift_bic text,
  bank_name text NOT NULL,
  country text NOT NULL,
  currency text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.bank_details TO authenticated;
GRANT ALL ON public.bank_details TO service_role;
ALTER TABLE public.bank_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bank details" ON public.bank_details FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER bank_details_updated_at BEFORE UPDATE ON public.bank_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- seed regulations
INSERT INTO public.regulations (code, name, region, max_compensation, summary, trigger_conditions, sort_order) VALUES
('EU261','EU Regulation EC 261/2004','European Union','Up to €600','Compensation and assistance for delays, cancellations and denied boarding on EU flights.','Delay of 3+ hours on arrival, cancellation with less than 14 days notice, or denied boarding.',1),
('UK261','UK Regulation (retained EC 261)','United Kingdom','Up to £520','UK version of EC261 covering flights from the UK and UK carriers into the UK.','Delay of 3+ hours, cancellation with short notice, or denied boarding.',2),
('USDOT','US Department of Transportation Rules','United States','Refunds & up to $2,150','Mandatory refunds for cancelled or significantly changed flights, plus denied boarding compensation.','Cancellation, significant schedule change, or involuntary bumping.',3),
('APPR','Canada Air Passenger Protection Regulations','Canada','Up to C$1,000','Compensation for delays and cancellations within airline control.','Arrival delay of 3+ hours within airline control, or denied boarding.',4),
('DGCA','India DGCA Passenger Charter','India','Up to ₹20,000','Compensation and assistance for cancellations, delays and denied boarding.','Cancellation without 2 weeks notice, long delay, or denied boarding.',5),
('ANAC','Brazil ANAC Resolution 400','Brazil','Assistance & reimbursement','Passenger rights for delays over 4 hours, cancellations and baggage issues.','Delay over 4 hours, cancellation, or baggage delivered late.',6),
('MONTREAL','Montreal Convention 1999','International','Up to ~SDR 1,288','International liability for baggage loss, damage or delay and passenger delay damages.','Lost, damaged or delayed baggage on an international itinerary.',7),
('SHY','Turkey SHY-Passenger Rights','Turkey','Up to €600','Turkish regulation mirroring EU261 for flights from Turkey and Turkish carriers.','Delay of 3+ hours, cancellation or denied boarding.',8);

-- seed airlines
INSERT INTO public.airlines (name, iata_code, country) VALUES
('British Airways','BA','United Kingdom'),('Lufthansa','LH','Germany'),('Air France','AF','France'),('KLM Royal Dutch Airlines','KL','Netherlands'),
('Ryanair','FR','Ireland'),('easyJet','U2','United Kingdom'),('Iberia','IB','Spain'),('Vueling','VY','Spain'),('Wizz Air','W6','Hungary'),
('Turkish Airlines','TK','Turkey'),('Emirates','EK','United Arab Emirates'),('Qatar Airways','QR','Qatar'),('Etihad Airways','EY','United Arab Emirates'),
('Swiss International Air Lines','LX','Switzerland'),('Austrian Airlines','OS','Austria'),('Brussels Airlines','SN','Belgium'),('TAP Air Portugal','TP','Portugal'),
('SAS Scandinavian Airlines','SK','Sweden'),('Finnair','AY','Finland'),('Norwegian','DY','Norway'),('ITA Airways','AZ','Italy'),('Aer Lingus','EI','Ireland'),
('American Airlines','AA','United States'),('Delta Air Lines','DL','United States'),('United Airlines','UA','United States'),('JetBlue Airways','B6','United States'),
('Southwest Airlines','WN','United States'),('Alaska Airlines','AS','United States'),('Air Canada','AC','Canada'),('WestJet','WS','Canada'),
('LATAM Airlines','LA','Chile'),('GOL Linhas Aereas','G3','Brazil'),('Azul Brazilian Airlines','AD','Brazil'),('Avianca','AV','Colombia'),('Aeromexico','AM','Mexico'),
('Air India','AI','India'),('IndiGo','6E','India'),('SpiceJet','SG','India'),('Vistara','UK','India'),
('Singapore Airlines','SQ','Singapore'),('Cathay Pacific','CX','Hong Kong'),('Japan Airlines','JL','Japan'),('ANA All Nippon Airways','NH','Japan'),
('Korean Air','KE','South Korea'),('Thai Airways','TG','Thailand'),('Malaysia Airlines','MH','Malaysia'),('Qantas','QF','Australia'),('Air New Zealand','NZ','New Zealand'),
('South African Airways','SA','South Africa'),('Kenya Airways','KQ','Kenya'),('Ethiopian Airlines','ET','Ethiopia'),('EgyptAir','MS','Egypt'),
('Royal Air Maroc','AT','Morocco'),('Saudia','SV','Saudi Arabia'),('China Southern Airlines','CZ','China'),('China Eastern Airlines','MU','China'),
('Air China','CA','China'),('Aeroflot','SU','Russia'),('Copa Airlines','CM','Panama'),('Icelandair','FI','Iceland');