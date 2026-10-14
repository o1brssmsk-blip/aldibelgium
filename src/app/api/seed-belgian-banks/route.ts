import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LOCAL_BANK_LOGO_BY_SLUG } from "@/lib/bank-logo-constants";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase connection failed" }, { status: 500 });
  }

  const belgianBanks = [
    { slug: "argenta-be", name: "Argenta", country: "Belçika", brand_color: "#E30E14", accent_color: "#E30E14", logo_file: LOCAL_BANK_LOGO_BY_SLUG["argenta-be"] },
    { slug: "bnp-paribas-fortis-be", name: "BNP Paribas Fortis", country: "Belçika", brand_color: "#00915A", accent_color: "#00915A", logo_file: LOCAL_BANK_LOGO_BY_SLUG["bnp-paribas-fortis-be"] },
    { slug: "beobank-be", name: "Beobank", country: "Belçika", brand_color: "#003C71", accent_color: "#003C71", logo_file: LOCAL_BANK_LOGO_BY_SLUG["beobank-be"] },
    { slug: "ing-be", name: "ING België", country: "Belçika", brand_color: "#FF6200", accent_color: "#FF6200", logo_file: LOCAL_BANK_LOGO_BY_SLUG["ing-be"] },
    { slug: "kbc-be", name: "KBC", country: "Belçika", brand_color: "#0066B3", accent_color: "#0066B3", logo_file: LOCAL_BANK_LOGO_BY_SLUG["kbc-be"] }
  ];

  const { error } = await supabase.from("banks").upsert(belgianBanks, { onConflict: "slug" });

  if (error) {
    console.error("Supabase upsert error:", error);
    return NextResponse.json({ error: error.message, details: error }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Belgian banks seeded successfully" });
}
