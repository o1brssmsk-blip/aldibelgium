-- =====================================================================
-- 2026-10-13  AVUSTURYA BANKALARINI PASIF OLARAK EKLE
-- Admin Banka Islemleri'nde gorunsunler, public'te cikmasinlar.
-- Logo dosyalari public/logos/ altinda mevcut.
-- Calistir: Supabase > SQL Editor > New Query > Yapistir > RUN
-- =====================================================================

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

-- Slovenija disi her sey pasif kalmali (garanti):
UPDATE public.banks SET is_active = false, updated_at = NOW()
WHERE COALESCE(country,'') <> 'Slovenija';
UPDATE public.banks SET is_active = true, updated_at = NOW()
WHERE slug ILIKE '%-si' OR country = 'Slovenija';

NOTIFY pgrst, 'reload schema';

-- Kontrol
SELECT country, is_active, count(*) FROM public.banks
GROUP BY country, is_active ORDER BY country;
