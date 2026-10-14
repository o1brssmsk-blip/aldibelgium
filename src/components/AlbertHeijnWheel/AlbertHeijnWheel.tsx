"use client";

import React, { forwardRef } from "react";
import type { ActiveWheelLayout, WheelSceneKey } from "@/app/wheel/wheel-layout";

type WheelPrizeLabel = {
  kind: string;
  rotationIndex: number;
  popupLines: string[];
};

type Props = {
  layout: ActiveWheelLayout;
  rotation: number;
  spinning: boolean;
  disabled: boolean;
  prizes?: WheelPrizeLabel[];
  onSpin: () => void;
  onSpinEnd: () => void;
};

const WHEEL_ASSETS: Record<
  WheelSceneKey,
  {
    backgroundSrc: string;
    wheelSrc: string;
    rimSrc: string;
    pointerSrc: string;
    buttonSrc: string;
    centerHubSrc: string;

    wheelLeft: string;
    wheelTop: string;
    wheelWidth: string;
    wheelHeight: string;

    rimLeft: string;
    rimTop: string;
    rimWidth: string;
    rimHeight: string;

    hubWidth: string;
    hubHeight: string;

    pointerLeft: string;
    pointerTop: string;
    pointerWidth: string;
    pointerHeight: string;

    buttonLeft: string;
    buttonTop: string;
    buttonWidth: string;
    buttonHeight: string;
  }
> = {
  desktop: {
    backgroundSrc: "/wheel-assets/desktop/background.png",
    wheelSrc: "/wheel-assets/desktop/wheel.png",
    rimSrc: "/wheel-assets/desktop/rim.png",
    pointerSrc: "/wheel-assets/desktop/pointer.png",
    buttonSrc: "/wheel-assets/desktop/button.png",
    centerHubSrc: "/wheel-assets/desktop/center-hub.png",

    wheelLeft: "32.56%",
    wheelTop: "15%",
    wheelWidth: "34.88%",
    wheelHeight: "62%",

    rimLeft: "31.7%",
    rimTop: "13.46%",
    rimWidth: "36.61%",
    rimHeight: "65.09%",

    hubWidth: "12.27%",
    hubHeight: "21.81%",

    pointerLeft: "47.17%",
    pointerTop: "8%",
    pointerWidth: "5.67%",
    pointerHeight: "8.69%",

    buttonLeft: "35%",
    buttonTop: "81%",
    buttonWidth: "30%",
    buttonHeight: "13%",
  },
  mobile: {
    backgroundSrc: "/wheel-assets/mobile/background.png",
    wheelSrc: "/wheel-assets/mobile/wheel.png",
    rimSrc: "/wheel-assets/mobile/rim.png",
    pointerSrc: "/wheel-assets/mobile/pointer.png",
    buttonSrc: "/wheel-assets/mobile/button.png",
    centerHubSrc: "/wheel-assets/mobile/center-hub.png",

    wheelLeft: "6%",
    wheelTop: "17.25%",
    wheelWidth: "88%",
    wheelHeight: "49.5%",

    rimLeft: "3.94%",
    rimTop: "16.09%",
    rimWidth: "92.13%",
    rimHeight: "51.83%",

    hubWidth: "29.04%",
    hubHeight: "16.34%",

    pointerLeft: "43.12%",
    pointerTop: "11.5%",
    pointerWidth: "13.76%",
    pointerHeight: "6.84%",

    buttonLeft: "20%",
    buttonTop: "70.5%",
    buttonWidth: "60%",
    buttonHeight: "8.54%",
  },
};

export const AlbertHeijnWheel = forwardRef<HTMLDivElement, Props>(function AlbertHeijnWheel(
  { layout, rotation, spinning, disabled, prizes, onSpin, onSpinEnd },
  ref,
) {
  const scene = layout.scene;
  const assets = WHEEL_ASSETS[layout.sceneKey];
  const segmentAngle = prizes && prizes.length > 0 ? 360 / prizes.length : 40;

  return (
    <div className="absolute inset-0" ref={ref}>
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
        <div
          className="relative overflow-hidden"
          style={{
            width: layout.stageStyle.width,
            height: layout.stageStyle.height,
            aspectRatio: scene.aspectRatio,
          }}
        >
          {/* 1. BACKGROUND */}
          <img
            src={assets.backgroundSrc}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[1] h-full w-full select-none object-fill"
            draggable={false}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />

          {/* 2. ROTATING WHEEL + SEGMENT LABELS */}
          <div
            className="pointer-events-none absolute z-[2] will-change-transform"
            style={{
              left: assets.wheelLeft,
              top: assets.wheelTop,
              width: assets.wheelWidth,
              height: assets.wheelHeight,
              transform: `translateZ(0) rotate(${rotation}deg)`,
              transition: spinning ? "transform 5000ms cubic-bezier(.12,.8,.18,1)" : "none",
            }}
            onTransitionEnd={onSpinEnd}
          >
            <img
              src={assets.wheelSrc}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="h-full w-full select-none object-contain"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
            {prizes && prizes.length > 0 && (
              <svg
                viewBox="0 0 100 100"
                className="pointer-events-none absolute inset-0 h-full w-full select-none"
                aria-hidden="true"
              >
                {prizes
                  .filter((p) => p.kind === "amount")
                  .map((p) => {
                    const isRedSegment = p.rotationIndex % 2 === 0;
                    const sliceDeg = (p.rotationIndex + 0.5) * segmentAngle;
                    const theta = (sliceDeg * Math.PI) / 180;
                    const radius = 32.5;
                    const x = 50 + radius * Math.sin(theta);
                    const y = 50 - radius * Math.cos(theta);
                    const label = p.popupLines[0] ?? "";
                    // Radyal/dikey: metin yaricap boyunca merkezden disa okunur,
                    // dilim ortasinda kalir (gomulu PROBEER OPNIEUW ile ayni yon).
                    const textDeg = sliceDeg - 90;
                    return (
                      <text
                        key={p.rotationIndex}
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${textDeg} ${x} ${y})`}
                        fontSize="3.7"
                        fontWeight="800"
                        fontFamily="'Arial Narrow', 'Helvetica Neue', Arial, sans-serif"
                        letterSpacing="0"
                        textLength="12.5"
                        lengthAdjust="spacingAndGlyphs"
                        fill={isRedSegment ? "#ffffff" : "#3f3f46"}
                        stroke={isRedSegment ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.55)"}
                        strokeWidth="0.4"
                        paintOrder="stroke"
                      >
                        {label}
                      </text>
                    );
                  })}
              </svg>
            )}
          </div>

          {/* 3. STATIC RIM (BULB RING — DOES NOT ROTATE) */}
          <img
            src={assets.rimSrc}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="pointer-events-none absolute z-[3] select-none object-contain"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            style={{
              left: assets.rimLeft,
              top: assets.rimTop,
              width: assets.rimWidth,
              height: assets.rimHeight,
            }}
          />

          {/* 4. STATIC CENTER HUB (PERFECTLY CENTERED OVER WHEEL) */}
          <div
            className="pointer-events-none absolute z-[4] flex items-center justify-center"
            style={{
              left: assets.wheelLeft,
              top: assets.wheelTop,
              width: assets.wheelWidth,
              height: assets.wheelHeight,
            }}
          >
            <img
              src={assets.centerHubSrc}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="select-none object-contain"
              loading="eager"
              decoding="async"
              style={{
                width: `${(Number.parseFloat(assets.hubWidth) / Number.parseFloat(assets.wheelWidth)) * 100}%`,
                height: `${(Number.parseFloat(assets.hubHeight) / Number.parseFloat(assets.wheelHeight)) * 100}%`,
              }}
            />
          </div>

          {/* 5. STATIC POINTER */}
          <img
            src={assets.pointerSrc}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="pointer-events-none absolute z-[5] select-none object-contain"
            loading="eager"
            decoding="async"
            style={{
              left: assets.pointerLeft,
              top: assets.pointerTop,
              width: assets.pointerWidth,
              height: assets.pointerHeight,
            }}
          />

          {/* 6. BUTTON HIGHLIGHT GLOW */}
          <div
            className={`pointer-events-none absolute z-[6] transition-all duration-300 ${spinning ? "bg-white/10 shadow-[0_0_36px_rgba(255,255,255,0.28)]" : "bg-transparent"}`}
            style={{
              left: assets.buttonLeft,
              top: assets.buttonTop,
              width: assets.buttonWidth,
              height: assets.buttonHeight,
              borderRadius: "100px",
            }}
          />

          {/* 7. STATIC BUTTON ART */}
          <img
            src={assets.buttonSrc}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`pointer-events-none absolute z-[6] select-none transition-transform duration-200 object-contain ${disabled ? "opacity-90" : "opacity-100"}`}
            loading="eager"
            decoding="async"
            style={{
              left: assets.buttonLeft,
              top: assets.buttonTop,
              width: assets.buttonWidth,
              height: assets.buttonHeight,
            }}
          />

          {/* CLICKABLE HIT AREA */}
          <button
            type="button"
            onClick={onSpin}
            disabled={disabled}
            aria-label="Draai het geluksrad"
            className="absolute z-[7] bg-transparent focus:outline-none focus-visible:ring-4 focus-visible:ring-white/80 disabled:cursor-not-allowed"
            style={{
              left: assets.buttonLeft,
              top: assets.buttonTop,
              width: assets.buttonWidth,
              height: assets.buttonHeight,
              touchAction: "manipulation",
              borderRadius: "100px",
            }}
          >
            <span className="sr-only">{spinning ? "Draait" : "Draai nu"}</span>
          </button>
        </div>
      </div>
    </div>
  );
});
