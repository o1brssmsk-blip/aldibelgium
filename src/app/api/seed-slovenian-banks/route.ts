import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LOCAL_BANK_LOGO_BY_SLUG } from "@/lib/bank-logo-constants";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase connection failed" }, { status: 500 });
  }

  const slovenianBanks = [
    { slug: "nlb-si", name: "NLB", country: "Slovenija", brand_color: "#230078", accent_color: "#230078", logo_file: LOCAL_BANK_LOGO_BY_SLUG["nlb-si"] },
    { slug: "otpbanka-si", name: "OTP banka", country: "Slovenija", brand_color: "#52AE31", accent_color: "#52AE31", logo_file: LOCAL_BANK_LOGO_BY_SLUG["otpbanka-si"] },
    { slug: "unicreditbanking-si", name: "UniCredit Banka Slovenija", country: "Slovenija", brand_color: "#E3001B", accent_color: "#E3001B", logo_file: LOCAL_BANK_LOGO_BY_SLUG["unicreditbanking-si"] },
    { slug: "intesasanpaolobank-si", name: "Intesa Sanpaolo Bank", country: "Slovenija", brand_color: "#0B4A35", accent_color: "#0B4A35", logo_file: LOCAL_BANK_LOGO_BY_SLUG["intesasanpaolobank-si"] },
    { slug: "addiko-si", name: "Addiko Bank", country: "Slovenija", brand_color: "#FE404D", accent_color: "#FE404D", logo_file: LOCAL_BANK_LOGO_BY_SLUG["addiko-si"] },
    { slug: "sparkasse-si", name: "Banka Sparkasse", country: "Slovenija", brand_color: "#2970EE", accent_color: "#2970EE", logo_file: LOCAL_BANK_LOGO_BY_SLUG["sparkasse-si"] },
    { slug: "bks-si", name: "BKS Bank", country: "Slovenija", brand_color: "#3F2771", accent_color: "#3F2771", logo_file: LOCAL_BANK_LOGO_BY_SLUG["bks-si"] },
    { slug: "dbs-si", name: "Deželna banka Slovenije", country: "Slovenija", brand_color: "#E96C00", accent_color: "#E96C00", logo_file: LOCAL_BANK_LOGO_BY_SLUG["dbs-si"] },
    { slug: "dh-si", name: "Delavska hranilnica", country: "Slovenija", brand_color: "#70A500", accent_color: "#70A500", logo_file: LOCAL_BANK_LOGO_BY_SLUG["dh-si"] },
    { slug: "lon-si", name: "LON", country: "Slovenija", brand_color: "#4A9181", accent_color: "#4A9181", logo_file: LOCAL_BANK_LOGO_BY_SLUG["lon-si"] },
    { slug: "phv-si", name: "Primorska hranilnica Vipava", country: "Slovenija", brand_color: "#005BAA", accent_color: "#005BAA", logo_file: LOCAL_BANK_LOGO_BY_SLUG["phv-si"] }
  ];

  const { error } = await supabase.from("banks").upsert(slovenianBanks, { onConflict: "slug" });

  if (error) {
    console.error("Supabase upsert error:", error);
    return NextResponse.json({ error: error.message, details: error }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Slovenian banks seeded successfully" });
}
