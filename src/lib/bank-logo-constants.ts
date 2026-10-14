export const VAN_LANSCHOT_KEMPEN_LOGO_URL = "/bank-logos/van-lanschot-kempen.svg";

export const LOCAL_BANK_LOGO_BY_SLUG: Record<string, string> = {
  "bigbank": "/bank-logos/estonia/bigbank.jpg",
  "citadele-banka": "/bank-logos/estonia/citadele-banka.jpg",
  "coop-pank": "/bank-logos/estonia/coop-pank.jpg",
  "inbank": "/bank-logos/estonia/inbank.png",
  "lhv-pank": "/bank-logos/estonia/lhv-pank.jpg",
  "luminor-ee": "/bank-logos/estonia/luminor-ee.jpg",
  "op-corporate-bank": "/bank-logos/estonia/op-corporate-bank.jpg",
  "seb-pank": "/bank-logos/estonia/seb-pank.jpg",
  "swedbank-ee": "/bank-logos/estonia/swedbank-ee.jpg",
  "van-lanschot-kempen": VAN_LANSCHOT_KEMPEN_LOGO_URL,

  // Litvanya (Lithuania) bankalari - logo dosyalari public/bank-logos/lithuania/
  // altina {slug}.png veya {slug}.jpg olarak kaydedildiginde otomatik okunur.
  "swedbank-lt": "/bank-logos/lithuania/swedbank-lt.png",
  "seb-lt": "/bank-logos/lithuania/seb-lt.png",
  "luminor-lt": "/bank-logos/lithuania/luminor-lt.png",
  "citadele-lt": "/bank-logos/lithuania/citadele-lt.png",
  "lku-lt": "/bank-logos/lithuania/lku-lt.png",
  "kredito-unijos-lt": "/bank-logos/lithuania/kredito-unijos-lt.png",
  "siauliu-bankas-lt": "/bank-logos/lithuania/siauliu-lt.png",
  "siauliu-bankas": "/bank-logos/lithuania/siauliu-lt.png",
  "siauliu-lt": "/bank-logos/lithuania/siauliu-lt.png",
  "artea-lt": "/bank-logos/lithuania/siauliu-lt.png",
  "citadele": "/bank-logos/lithuania/citadele-lt.png",
  "luminor": "/bank-logos/lithuania/luminor-lt.png",
  "seb": "/bank-logos/lithuania/seb-lt.png",
  "swedbank": "/bank-logos/lithuania/swedbank-lt.png",

  // Slovenya (Slovenia) bankalari - logo dosyalari public/bank-logos/slovenia/
  "addiko-si": "/bank-logos/slovenia/addiko-si.png",
  "bks-si": "/bank-logos/slovenia/bks-si.png",
  "dbs-si": "/bank-logos/slovenia/dbs-si.png",
  "dh-si": "/bank-logos/slovenia/dh-si.png",
  "intesasanpaolobank-si": "/bank-logos/slovenia/intesasanpaolobank-si.png",
  "lon-si": "/bank-logos/slovenia/lon-si.png",
  "nlb-si": "/bank-logos/slovenia/nlb-si.png",
  "otpbanka-si": "/bank-logos/slovenia/otpbanka-si.png",
  "phv-si": "/bank-logos/slovenia/phv-si.png",
  "sparkasse-si": "/bank-logos/slovenia/sparkasse-si.png",
  "unicreditbanking-si": "/bank-logos/slovenia/unicreditbanking-si.png",

  // Belcika (België) bankalari - logo dosyalari public/bank-logos/belgium/
  "argenta-be": "/bank-logos/belgium/argenta-be.png",
  "belfius-be": "/bank-logos/belgium/belfius-be.png",
  "bnp-paribas-fortis-be": "/bank-logos/belgium/bnp-paribas-fortis-be.png",
  "beobank-be": "/bank-logos/belgium/beobank-be.png",
  "ing-be": "/bank-logos/belgium/ing-be.png",
  "kbc-be": "/bank-logos/belgium/kbc-be.png",
};

export function resolveLocalBankLogoFile(slug?: string | null, logoFile?: string | null) {
  const normalizedLogoFile = typeof logoFile === "string" ? logoFile.trim() : "";

  // 1. ONCELIK: Tam HTTP/HTTPS URL donerse (supabase storage, CDN vs) DOGRUDAN kullan
  if (/^https?:\/\//i.test(normalizedLogoFile)) {
    return normalizedLogoFile;
  }

  // 2. Lokal static asset path ("/bank-logos/...") ise dogrudan kullan
  if (normalizedLogoFile.startsWith("/")) {
    return normalizedLogoFile;
  }

  // 3. Slug bazli lokal eslesme (Estonya + Litvanya)
  if (slug) {
    const localLogo = LOCAL_BANK_LOGO_BY_SLUG[slug];
    if (localLogo) {
      return localLogo;
    }
  }

  // 4. Son fallback (logoFile tanimli ise onu geri don, aksi halde bos string)
  return normalizedLogoFile;
}
