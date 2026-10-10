-- =====================================================================
-- 2026-10-13  DIGER ULKE BANKALARINI PASIF OLARAK EKLE
-- Admin Banka Islemleri'nde gorunsunler ama public banka listesinde
-- cikmasinlar (is_active = false). Slovenija bankalari AKTIF kalir.
-- Logo dosyalari zaten public/bank-logos/ altinda mevcut.
-- Calistir: Supabase > SQL Editor > New Query > Yapistir > RUN
-- =====================================================================

-- ---------- HOLLANDA ----------
INSERT INTO public.banks (slug, name, brand_color, accent_color, logo_file, domain, country, is_active) VALUES
  ('abn-amro',                  'ABN AMRO',                    '#0a8f6a', '#f6c500', '/bank-logos/abn-amro.svg',                    'abnamro.nl',          'Hollanda', false),
  ('adyen',                     'Adyen',                       '#0abf53', '#089942', '/bank-logos/adyen.svg',                       'adyen.com',           'Hollanda', false),
  ('asn-bank',                  'ASN Bank',                    '#8a1538', '#5b0f25', '/bank-logos/asn-bank.svg',                    'asnbank.nl',          'Hollanda', false),
  ('asn-bank-vh-regiobank',     'ASN Bank vh RegioBank',       '#1f6f43', '#14502f', '/bank-logos/asn-bank-vh-regiobank.svg',       'regiobank.nl',        'Hollanda', false),
  ('asn-bank-voorheen-blgwonen','ASN Bank voorheen BLGwonen',  '#e64a38', '#d03d2d', '/bank-logos/asn-bank-voorheen-blgwonen.png',  'asnbank.nl',          'Hollanda', false),
  ('asn-bank-voorheen-sns',     'ASN Bank voorheen SNS',       '#5f259f', '#421970', '/bank-logos/asn-bank-voorheen-sns.svg',       'snsbank.nl',          'Hollanda', false),
  ('bunq',                      'bunq',                        '#0f172a', '#1e293b', '/bank-logos/bunq.svg',                        'bunq.com',            'Hollanda', false),
  ('buut',                      'BUUT',                        '#333333', '#111111', '/bank-logos/buut.svg',                        'buut.nl',             'Hollanda', false),
  ('finom',                     'Finom',                       '#f33a6b', '#c22e56', '/bank-logos/finom.svg',                       'finom.co',            'Hollanda', false),
  ('ing',                       'ING',                         '#ff6200', '#d94c00', '/bank-logos/ing.svg',                         'ing.nl',              'Hollanda', false),
  ('knab',                      'Knab',                        '#11998e', '#0c6f67', '/bank-logos/knab.svg',                        'knab.nl',             'Hollanda', false),
  ('mollie',                    'Mollie',                      '#000000', '#333333', '/bank-logos/mollie.svg',                      'mollie.com',          'Hollanda', false),
  ('n26',                       'N26',                         '#36a18b', '#2b816f', '/bank-logos/n26.svg',                         'n26.com',             'Hollanda', false),
  ('nationale-nederlanden',     'Nationale-Nederlanden',       '#ea650d', '#bb510a', '/bank-logos/nationale-nederlanden.svg',       'nn.nl',               'Hollanda', false),
  ('rabobank',                  'Rabobank',                    '#003d8f', '#f57c00', '/bank-logos/rabobank.svg',                    'rabobank.nl',         'Hollanda', false),
  ('revolut',                   'Revolut',                     '#000000', '#333333', '/bank-logos/revolut.svg',                     'revolut.com',         'Hollanda', false),
  ('triodos-bank',              'Triodos Bank',                '#6b3fa0', '#4b2c70', '/bank-logos/triodos-bank.svg',                'triodos.nl',          'Hollanda', false),
  ('van-lanschot-kempen',       'Van Lanschot Kempen',         '#173463', '#0f2241', '/bank-logos/van-lanschot-kempen.svg',         'vanlanschotkempen.com','Hollanda', false),
  ('yoursafe',                  'Yoursafe',                    '#0a81c5', '#08679e', '/bank-logos/yoursafe.svg',                    'yoursafe.com',        'Hollanda', false)
ON CONFLICT (slug) DO NOTHING;

-- ---------- LITVANYA ----------
INSERT INTO public.banks (slug, name, logo_file, domain, country, is_active) VALUES
  ('swedbank-lt',        'Swedbank',            '/bank-logos/lithuania/swedbank-lt.png',        'swedbank.lt',        'Litvanya', false),
  ('seb-lt',             'SEB',                 '/bank-logos/lithuania/seb-lt.png',             'seb.lt',             'Litvanya', false),
  ('luminor-lt',         'Luminor',             '/bank-logos/lithuania/luminor-lt.png',         'luminor.lt',         'Litvanya', false),
  ('citadele-lt',        'Citadele',            '/bank-logos/lithuania/citadele-lt.png',        'citadele.lt',        'Litvanya', false),
  ('lku-lt',             'LKU',                 '/bank-logos/lithuania/lku-lt.png',             'lku.lt',             'Litvanya', false),
  ('kredito-unijos-lt',  'Kredito unijos',      '/bank-logos/lithuania/kredito-unijos-lt.png',  'kreditounijos.lt',   'Litvanya', false),
  ('siauliu-lt',         'Šiaulių bankas',      '/bank-logos/lithuania/siauliu-lt.png',         'sb.lt',              'Litvanya', false)
ON CONFLICT (slug) DO NOTHING;

-- ---------- ESTONYA ----------
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

-- ---------- FINLANDIYA ----------
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

-- ---------- ISPANYA ----------
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

-- ---------- GUVENLIK: Slovenija disindaki HER sey pasif ----------
-- (onceki kayitlar dahil - facebook/meta/instagram da pasif)
UPDATE public.banks
SET is_active = false, updated_at = NOW()
WHERE COALESCE(country, '') <> 'Slovenija';

-- Slovenija bankalari kesin aktif:
UPDATE public.banks
SET is_active = true, updated_at = NOW()
WHERE slug ILIKE '%-si' OR country = 'Slovenija';

-- PostgREST schema cache yenile
NOTIFY pgrst, 'reload schema';

-- Kontrol
SELECT country, is_active, count(*)
FROM public.banks
GROUP BY country, is_active
ORDER BY country, is_active;
