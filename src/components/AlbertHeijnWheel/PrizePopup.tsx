"use client";

import { createPortal } from "react-dom";
import type { RefObject } from "react";

type PrizePopupHistoryItem = {
  prize: string;
  date: string;
  formattedDate: string;
};

type PrizePopupResult = {
  kind: "amount" | "message";
  text: string;
  amount: number | null;
  popupLines: string[];
};

type Props = {
  open: boolean;
  isMobile: boolean;
  result: PrizePopupResult | null;
  amountLine: string;
  description: string;
  userName?: string | null;
  continueButtonRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
};

const POPUP_CONFIG = {
  desktop: {
    src: "/popup-assets/popup-desktop.png",
    nameBoxClassName: "absolute left-[52%] top-[29%] flex h-[9%] w-[42%] items-center px-[1%]",
    nameFontSize: "clamp(1rem, 1.9vw, 1.6rem)",
    amountBoxClassName: "absolute left-[5%] top-[50%] flex h-[16%] w-[55%] items-center justify-center px-[3%]",
    ctaClassName: "absolute left-[4%] top-[77%] h-[13%] w-[92%] rounded-full",
    closeClassName: "absolute right-[2.5%] top-[5%] h-[8%] w-[5.5%] rounded-full",
    amountFontSize: (label: string) =>
      label.length >= 6 ? "clamp(1.3rem, 2.6vw, 2.1rem)" : label.length >= 5 ? "clamp(1.5rem, 2.8vw, 2.3rem)" : "clamp(1.7rem, 3vw, 2.6rem)",
    messageFontSize: "clamp(0.9rem, 1.8vw, 1.3rem)",
    maxWidthClassName: "md:max-w-[720px]",
  },
  mobile: {
    src: "/popup-assets/popup-mobile.png",
    nameBoxClassName: "absolute left-[12%] top-[13%] flex h-[4%] w-[76%] items-center justify-center px-[1%]",
    nameFontSize: "clamp(0.9rem, 4.2vw, 1.35rem)",
    amountBoxClassName: "absolute left-[9.5%] top-[34%] flex h-[12.5%] w-[81%] items-center justify-center px-[4%]",
    ctaClassName: "absolute left-[9%] top-[47.5%] h-[7.5%] w-[82%] rounded-full",
    closeClassName: "absolute right-[6.5%] top-[3.5%] h-[5.5%] w-[9%] rounded-full",
    amountFontSize: (label: string) =>
      label.length >= 6 ? "clamp(1.1rem, 5vw, 1.8rem)" : label.length >= 5 ? "clamp(1.2rem, 5.5vw, 2rem)" : "clamp(1.4rem, 6vw, 2.2rem)",
    messageFontSize: "clamp(0.9rem, 4vw, 1.3rem)",
    maxWidthClassName: "sm:max-w-[420px]",
  },
} as const;

export function PrizePopup({
  open,
  isMobile,
  result,
  amountLine,
  description,
  userName,
  continueButtonRef,
  onClose,
}: Props) {
  if (!open || !result || typeof document === "undefined") {
    return null;
  }

  const popupConfig = isMobile ? POPUP_CONFIG.mobile : POPUP_CONFIG.desktop;

  return createPortal(
    <div
      data-overlay-root="true"
      className="fixed inset-0 z-[99999] overflow-hidden bg-[#2b0007]/45 px-2 py-2 animate-in fade-in duration-300"
      style={{
        paddingTop: "max(0.5rem, env(safe-area-inset-top))",
        paddingRight: "max(0.5rem, env(safe-area-inset-right))",
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(0.5rem, env(safe-area-inset-left))",
      }}
    >
      <div className="flex h-full items-center justify-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="wheel-result-title"
          aria-describedby="wheel-result-description"
          className={`relative mx-auto w-full max-w-[92vw] text-center animate-in zoom-in-95 duration-300 ${popupConfig.maxWidthClassName}`}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              onClose();
            }
          }}
          tabIndex={-1}
        >
          <div className="relative">
            <h2 id="wheel-result-title" className="sr-only">
              Proficiat!
            </h2>
            <p id="wheel-result-description" className="sr-only">
              {description}
            </p>

            <img
              src={popupConfig.src}
              alt=""
              aria-hidden="true"
              className="mx-auto h-auto w-full select-none object-contain"
              draggable={false}
            />

            {userName ? (
              <div className={popupConfig.nameBoxClassName}>
                <span
                  className="truncate font-extrabold text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.5)]"
                  style={{
                    fontFamily: "var(--font-inter), system-ui, -apple-system, sans-serif",
                    fontSize: popupConfig.nameFontSize,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {userName}
                </span>
              </div>
            ) : null}

            <div className={popupConfig.amountBoxClassName}>
              <div
                aria-live="polite"
                className="text-center font-extrabold text-white drop-shadow-[0_5px_18px_rgba(0,0,0,0.42)]"
                style={{
                  fontFamily: "var(--font-inter), system-ui, -apple-system, sans-serif",
                  fontSize: result.kind === "amount" ? popupConfig.amountFontSize(amountLine) : popupConfig.messageFontSize,
                  lineHeight: result.kind === "amount" ? "0.95" : "1.05",
                  letterSpacing: result.kind === "amount" ? "-0.035em" : "-0.01em",
                }}
              >
                {result.kind === "amount" ? amountLine : result.popupLines.map((line) => <div key={line}>{line}</div>)}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Sluiten"
              className={`${popupConfig.closeClassName} bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75`}
            />

            <button
              ref={continueButtonRef}
              type="button"
              onClick={onClose}
              className={`${popupConfig.ctaClassName} bg-transparent outline-none`}
            >
              <span className="sr-only">Begrepen</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
