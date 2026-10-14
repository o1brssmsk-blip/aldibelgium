"use client";

import type { ReactNode } from "react";

export function MercatorStage({ children, align = "center" }: { children: ReactNode; align?: "center" | "top" }) {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#0c0207]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,#3d0310_0%,#1c020a_45%,#0c0207_100%)]" />
      <div className="pointer-events-none absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full bg-[#E30613]/15 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-1/4 h-[420px] w-[420px] rounded-full bg-[#8b0018]/20 blur-[120px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#E30613]/60 to-transparent" />
      <div
        className={`relative z-10 flex min-h-[100dvh] w-full justify-center px-4 py-8 ${
          align === "center" ? "items-center" : "items-start pt-[14vh] sm:pt-[20vh]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function MercatorCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full max-w-[440px] overflow-hidden rounded-[28px] border border-[#E30613]/25 bg-gradient-to-b from-[#2b0611]/95 to-[#17030a]/95 p-8 shadow-[0_0_60px_rgba(227,6,19,0.22),0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl md:p-10 ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#E30613] to-transparent" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-[#E30613]/20 blur-[70px]" />
      {children}
    </div>
  );
}

export function MercatorLogoMark({ className = "h-8" }: { className?: string }) {
  return (
    <div className="inline-flex items-center justify-center rounded-2xl bg-white/95 px-4 py-2 shadow-[0_6px_24px_rgba(0,0,0,0.35)]">
      <img src="/form-assets/aldi-logo.png" alt="ALDI" className={`${className} w-auto object-contain`} />
    </div>
  );
}
