"use client";
import React from "react";

type VoiceType = "ombra" | "ego" | "tu";

export default function VoiceResponse({
  type,
  text,
}: {
  type: VoiceType;
  text?: string;
}) {
  const styles: Record<VoiceType, string> = {
    ombra:
      "italic text-[#8B0000] border border-[#8B0000]/30 bg-[#1a0000]/40",
    ego: "font-semibold text-[#FFD700] border border-[#FFD700]/30 bg-[#332b00]/30",
    tu: "text-white border border-white/10 bg-white/5",
  };
  const title = { ombra: "Ombra", ego: "Ego", tu: "Tu" }[type];

  return (
    <div
      className={`rounded-lg p-4 min-h-[96px] backdrop-blur-sm transition-colors ${styles[type]}`}
      aria-live="polite"
    >
      <div className="text-sm opacity-70 mb-1">{title}</div>
      <div className="text-sm leading-relaxed">
        {text || <span className="opacity-50">…</span>}
      </div>
    </div>
  );
}
