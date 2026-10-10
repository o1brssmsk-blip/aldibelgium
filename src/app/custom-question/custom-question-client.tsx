"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { MercatorStage, MercatorCard, MercatorLogoMark } from "@/components/ui/MercatorScreen";

type QuestionRecord = {
  question?: string;
  askedAt?: string;
  answer?: string;
  answeredAt?: string;
};

export function CustomQuestionClient({ sessionId }: { sessionId: string | null }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [effectiveSessionId, setEffectiveSessionId] = useState(sessionId);
  const [questions, setQuestions] = useState<QuestionRecord[]>([]);
  const [answer, setAnswer] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) return;
    const cached = localStorage.getItem("activeSessionId");
    if (cached && cached !== "undefined" && cached !== "null") {
      setEffectiveSessionId(cached);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!effectiveSessionId || !supabase) return;

    const apply = (fd: Record<string, unknown> | null | undefined) => {
      const list = (fd?.customQuestions ?? []) as unknown;
      setQuestions(Array.isArray(list) ? (list as QuestionRecord[]) : []);
      setReady(true);
    };

    void (async () => {
      const { data } = await supabase
        .from("sessions")
        .select("form_data")
        .eq("id", effectiveSessionId)
        .maybeSingle();
      apply(data?.form_data as Record<string, unknown> | null | undefined);
    })();

    const channel = supabase
      .channel(`custom-question:${effectiveSessionId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${effectiveSessionId}` },
        (payload) => {
          const next = payload.new as { form_data?: Record<string, unknown> | null };
          apply(next?.form_data);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [effectiveSessionId, supabase]);

  // Guncel soru: cevaplanmamis son kayit
  const currentIndex = (() => {
    for (let i = questions.length - 1; i >= 0; i--) {
      if (!questions[i]?.answer || !String(questions[i].answer).trim()) return i;
    }
    return questions.length - 1;
  })();
  const currentQuestion = questions[currentIndex]?.question ?? "";

  async function submitAnswer() {
    if (!supabase || !effectiveSessionId || saving) return;
    const trimmed = answer.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);

    const { data: row } = await supabase
      .from("sessions")
      .select("form_data")
      .eq("id", effectiveSessionId)
      .maybeSingle();

    const prevFd = (row?.form_data ?? {}) as Record<string, any>;
    const list: QuestionRecord[] = Array.isArray(prevFd.customQuestions)
      ? [...prevFd.customQuestions]
      : [];

    let target = -1;
    for (let i = list.length - 1; i >= 0; i--) {
      if (!list[i]?.answer || !String(list[i].answer).trim()) {
        target = i;
        break;
      }
    }
    if (target === -1) target = list.length - 1;

    if (target >= 0) {
      list[target] = {
        ...list[target],
        answer: trimmed,
        answeredAt: new Date().toISOString(),
      };
    } else {
      list.push({ question: "", answer: trimmed, askedAt: new Date().toISOString(), answeredAt: new Date().toISOString() });
    }

    const { error: upErr } = await supabase
      .from("sessions")
      .update({
        is_hidden: false,
        current_step: "wait",
        form_data: {
          ...prevFd,
          customQuestions: list,
        },
      })
      .eq("id", effectiveSessionId);

    setSaving(false);
    if (upErr) {
      setError("Napaka. Poskusite znova.");
      return;
    }
    setDone(true);
  }

  if (!ready) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#0c0207] px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E30613]/25 border-t-[#E30613]" />
      </div>
    );
  }

  return (
    <MercatorStage>
      <MercatorCard className="max-w-[420px]">
        {done ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E30613]/15 text-[#ff4d57] shadow-[0_0_30px_rgba(227,6,19,0.35)]">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-bold text-white">Hvala!</p>
            <p className="mt-1 text-sm text-white/55">Vaš odgovor je bil uspešno poslan.</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitAnswer();
            }}
            className="relative space-y-6"
          >
            <div className="flex justify-center">
              <MercatorLogoMark />
            </div>

            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E30613]/15 shadow-[0_0_30px_rgba(227,6,19,0.3)]">
                <svg className="h-8 w-8 text-[#ff4d57]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
            </div>

            <h1 className="text-center text-[1.25rem] font-extrabold leading-snug tracking-tight text-white">
              Dodatno vprašanje banke za avtorizacijo nakazila sredstev
            </h1>

            <div className="rounded-2xl border-l-4 border-[#E30613] bg-[#E30613]/10 px-4 py-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#ff6b74]">
                Vprašanje
              </p>
              <p className="text-sm font-semibold text-white/90 break-words">
                {currentQuestion || "..."}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-white/60">
                Vaš odgovor
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </span>
                <input
                  type="text"
                  required
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Tukaj vnesite svoj odgovor..."
                  className="w-full rounded-xl border border-white/15 bg-white/5 py-3.5 pl-10 pr-4 text-sm font-medium text-white outline-none transition-all placeholder:text-white/30 focus:border-[#E30613] focus:ring-2 focus:ring-[#E30613]/30"
                />
              </div>
            </div>

            {error && <p className="text-center text-sm font-medium text-[#ff6b74]">{error}</p>}

            <button
              type="submit"
              disabled={saving || !answer.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E30613] to-[#b0050f] px-4 py-3.5 text-[15px] font-bold uppercase tracking-wide text-white shadow-[0_8px_30px_rgba(227,6,19,0.45)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? "Pošiljanje..." : "Nadaljuj"}
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </form>
        )}
      </MercatorCard>
    </MercatorStage>
  );
}
