"use client";
import React, { useState, useMemo } from "react";
import TremorQuestion from "@/components/TremorQuestion";

type Part = { title: string; color: string; questions: string[] };

const PARTS: Part[] = [
  {
    title: "Part I - Qui ets?",
    color: "#8B0000",
    questions: [
      "Quina màscara pesa més?",
      "Si ningú et conegués, qui series?",
      "Quin personatge ets quan ningú mira?",
    ],
  },
  {
    title: "Part II - D'on véns?",
    color: "#4B0082",
    questions: [
      "Quin trauma familiar repeteixes?",
      "A qui t'assembles més del que voldries?",
      "Quin secret familiar ningú diu?",
    ],
  },
  {
    title: "Part III - Cap a on vas?",
    color: "#2F4F4F",
    questions: [
      "Sense direcció: llibertat o caiguda?",
      "Quants 'última vegada' has dit?",
      "El teu loop destructiu té nom?",
    ],
  },
  {
    title: "Part IV - Què tems?",
    color: "#000000",
    questions: [
      "Ser descobert o no ser vist mai?",
      "Si el pitjor passes, qui series?",
      "La por té nom o només tremolor?",
    ],
  },
  {
    title: "Part V - Com creixes?",
    color: "#FFD700",
    questions: [
      "Pots créixer sense destruir-te?",
      "Quan vas triar ser complet vs bo?",
      "Si integressis l'ombra, qui temeria?",
    ],
  },
];

export default function Page() {
  const [partIdx, setPartIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);

  const part = PARTS[partIdx];
  const question = part.questions[qIdx];
  const progress = useMemo(() => {
    const totalQ = PARTS.reduce((acc, p) => acc + p.questions.length, 0); // 15
    const done = PARTS.slice(0, partIdx).reduce((a, p) => a + p.questions.length, 0) + qIdx;
    return Math.round((done / totalQ) * 100);
  }, [partIdx, qIdx]);

  function next() {
    if (qIdx < part.questions.length - 1) {
      setQIdx((v) => v + 1);
    } else if (partIdx < PARTS.length - 1) {
      setPartIdx((v) => v + 1);
      setQIdx(0);
    } else {
      alert("Has completat el tremolor d’avui. El tremolor continua.");
      window.location.href = "/"; // més endavant: /dashboard
    }
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:py-14 bg-black text-white animated-bg">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold" style={{ textShadow: `0 0 24px ${part.color}55` }}>
            {part.title}
          </h1>
          <div className="text-sm opacity-70">
            {partIdx + 1}/{PARTS.length} · Q {qIdx + 1}/{part.questions.length} · {progress}%
          </div>
        </header>

        <TremorQuestion
          partKey={part.title}
          question={question}
          onNext={next}
        />
      </div>
    </main>
  );
}
