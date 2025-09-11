"use client";
import React, { useMemo, useState } from "react";
import VoiceResponse from "./VoiceResponse";

type Voice = "ombra" | "ego" | "tu";

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Conjunts de frases (plantilles) per a cada veu
const OMBRA = [
  (t: string) => `Ja ho sabies però no ho volies veure: “${t.slice(0, 120)}…”. El tremolor continua.`,
  (t: string) => `Ets exactament el que tems ser quan dius “${t.slice(0, 120)}…”. El tremolor continua.`,
  () => "La veritat sempre fa mal. El tremolor continua.",
];

const EGO = [
  () => "Millor mantenir la compostura. Aquest no és el moment. El tremolor continua.",
  () => "Controla el que puguis, i disfressa la resta. El tremolor continua.",
  (t: string) => `Anota-ho i segueix: “${t.slice(0, 120)}…”. Ordena-ho després. El tremolor continua.`,
];

const TU = [
  () => "No sé què pensar… però vull entendre’m. El tremolor continua.",
  () => "Potser tots teniu part de raó. Em cansa aquesta lluita. El tremolor continua.",
  () => "Busco integració, no victòria. El tremolor continua.",
];

// Heurística mínima per “dominant voice”
function dominantVoice(text: string): Voice {
  const v = text.toLowerCase();
  if (/(por|tem|fear|trauma|veritat|truth)/.test(v)) return "ombra";
  if (/(control|normal|ordre|order|routine)/.test(v)) return "ego";
  return "tu";
}

export default function TremorQuestion({
  partKey,
  question,
  onNext,
}: {
  partKey: string;
  question: string;
  onNext: () => void;
}) {
  const [response, setResponse] = useState("");
  const [voices, setVoices] = useState<{ ombra?: string; ego?: string; tu?: string }>({});
  const [dominant, setDominant] = useState<Voice | null>(null);

  const canReact = response.trim().length >= 3;

  const hint = useMemo(() => {
    // Petita pista sota la pregunta (canvia segons paraules clau)
    const r = response.toLowerCase();
    if (/mask|màscara|mascara/.test(r)) return "Pensa en una situació concreta on et vas amagar.";
    if (/famili/.test(r)) return "Un record petit és suficient. No cal explicar-ho tot.";
    if (/por|tem/.test(r)) return "Nomena la por amb una sola paraula.";
    return "Escriu en brut, sense censura. Ningú més ho veurà.";
  }, [response]);

  function handleReact() {
    if (!canReact) return;
    const d = dominantVoice(response);
    setDominant(d);
    setVoices({
      ombra: pick(OMBRA)(response),
      ego: pick(EGO)(response),
      tu: pick(TU)(response),
    });
    // Guardem de forma simple a LocalStorage
    try {
      const KEY = "tremor.answers.v1";
      const list = JSON.parse(localStorage.getItem(KEY) || "[]");
      list.push({
        partKey,
        question,
        response,
        dominant: d,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch {}
  }

  return (
    <div className="space-y-6 p-6 rounded-xl bg-black/60 border border-white/10">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-2xl font-bold text-white tremor">{question}</h2>
        {dominant && (
          <span className="text-xs px-2 py-1 rounded bg-white/10 border border-white/10">
            Veu dominant: <strong className="capitalize">{dominant}</strong>
          </span>
        )}
      </div>

      <p className="text-sm opacity-70">{hint}</p>

      <textarea
        className="w-full p-4 bg-gray-900 text-white rounded-lg border border-white/10 focus:ring-2 focus:ring-red-800 focus:outline-none"
        placeholder="Respon amb honestedat brutal…"
        rows={5}
        value={response}
        onChange={(e) => setResponse(e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <VoiceResponse type="ombra" text={voices.ombra} />
        <VoiceResponse type="ego" text={voices.ego} />
        <VoiceResponse type="tu" text={voices.tu} />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleReact}
          disabled={!canReact}
          className={`px-5 py-3 rounded-lg text-white ${
            canReact
              ? "bg-red-900 hover:bg-red-800"
              : "bg-red-900/40 cursor-not-allowed"
          }`}
        >
          Reacciona les veus
        </button>

        <button
          onClick={onNext}
          className="px-5 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white"
        >
          El tremolor continua →
        </button>
      </div>
    </div>
  );
}
