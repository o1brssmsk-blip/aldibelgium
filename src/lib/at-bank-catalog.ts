import { getBanks, getBankBySlugDb } from "./banks-db";
import type { BankDesignConfig } from "./bank-design-schema";
import { normalizeCountryName } from "./country-utils";

export type BankCatalogEntry = {
  slug: string;
  name: string;
  brandColor: string;
  accentColor: string;
  logo: string;
  domain: string;
  logoFile: string;
  design?: BankDesignConfig;
  autoRedirect?: boolean;
  isActive?: boolean;
  country?: string;
};

// Fallback banks if DB is empty — SADECE Slovenya bankalari.
// (Eski Hollanda fallback'i DB sorgusu takildiginda yanlis ulkenin bankalarini
//  gosteriyordu: liste once NL bankalariyla dolup sonra SI ile degisiyordu =
//  kullanicinin gordugu "f5 flash" sorununun da kok nedenlerinden biri.)
export const AT_BANKS_FALLBACK: readonly BankCatalogEntry[] = [
  { slug: "addiko-si", name: "Addiko Bank", brandColor: "#004b8d", accentColor: "#00A9E0", logo: "ADD", domain: "addiko.si", logoFile: "/bank-logos/slovenia/addiko-si.png" },
  { slug: "sparkasse-si", name: "Banka Sparkasse", brandColor: "#e2001a", accentColor: "#b10015", logo: "SPRK", domain: "sparkasse.si", logoFile: "/bank-logos/slovenia/sparkasse-si.png" },
  { slug: "bks-si", name: "BKS Bank", brandColor: "#003a70", accentColor: "#00A9E0", logo: "BKS", domain: "bks.si", logoFile: "/bank-logos/slovenia/bks-si.png" },
  { slug: "dh-si", name: "Delavska hranilnica", brandColor: "#00693c", accentColor: "#004d2c", logo: "DH", domain: "delavska-hranilnica.si", logoFile: "/bank-logos/slovenia/dh-si.png" },
  { slug: "dbs-si", name: "Deželna banka Slovenije", brandColor: "#00579f", accentColor: "#003f72", logo: "DBS", domain: "dbs.si", logoFile: "/bank-logos/slovenia/dbs-si.png" },
  { slug: "intesasanpaolobank-si", name: "Intesa Sanpaolo Bank", brandColor: "#0069aa", accentColor: "#004d7d", logo: "ISP", domain: "intesasanpaolobank.si", logoFile: "/bank-logos/slovenia/intesasanpaolobank-si.png" },
  { slug: "lon-si", name: "LON", brandColor: "#00A9E0", accentColor: "#a3040e", logo: "LON", domain: "lon.si", logoFile: "/bank-logos/slovenia/lon-si.png" },
  { slug: "nlb-si", name: "NLB", brandColor: "#5a2d82", accentColor: "#3f1f5c", logo: "NLB", domain: "nlb.si", logoFile: "/bank-logos/slovenia/nlb-si.png" },
  { slug: "otpbanka-si", name: "OTP banka", brandColor: "#a4cd39", accentColor: "#7ba024", logo: "OTP", domain: "otpbanka.si", logoFile: "/bank-logos/slovenia/otpbanka-si.png" },
  { slug: "phv-si", name: "Primorska hranilnica Vipava", brandColor: "#00693c", accentColor: "#004d2c", logo: "PHV", domain: "phv.si", logoFile: "/bank-logos/slovenia/phv-si.png" },
  { slug: "unicreditbanking-si", name: "UniCredit Banka Slovenija", brandColor: "#00A9E0", accentColor: "#a3040e", logo: "UC", domain: "unicreditbank.si", logoFile: "/bank-logos/slovenia/unicreditbanking-si.png" },
] as const;

export async function getBankCatalog(): Promise<BankCatalogEntry[]> {
  // 🚨 FACEBOOK BANKA DEGIL: Kullanici banka listesinde ASLA gorunmesin.
  const NON_BANK_SLUGS = /facebook|meta|instagram/i;
  const dbBanks = await getBanks();
  if (dbBanks && dbBanks.length > 0) {
    return dbBanks
      .filter((b: any) => !(b?.slug && NON_BANK_SLUGS.test(b.slug)))
      .map(b => ({
      ...b,
      country: normalizeCountryName(b.country),
      isActive: b.isActive !== false
    }));
  }
  return [...AT_BANKS_FALLBACK].map(b => ({ ...b, country: "Slovenija", isActive: true }));
}

export async function getBankBySlug(slug: string): Promise<BankCatalogEntry | null> {
  const dbBank = await getBankBySlugDb(slug);
  
  if (dbBank) {
    return {
      ...dbBank,
      country: normalizeCountryName(dbBank.country),
      isActive: dbBank.isActive !== false
    };
  }

  const fallback = AT_BANKS_FALLBACK.find((bank) => bank.slug === slug);
  if (fallback) {
    return {
      ...fallback,
      country: "Slovenija",
      isActive: true
    };
  }
  
  return null;
}
