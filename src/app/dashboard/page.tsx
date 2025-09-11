"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Answer = {
  partKey: string;
  question: string;
  response?: string;
  dominant?: string;
  createdAt?: string; // ISO
};

const PARTS = [
  "Part I - Qui ets?",
  "Part II - D'on véns?",
  "Part III - Cap a on vas?",
  "Part IV - Què tems?",
  "Part V - Com creixes?",
];

const TOTAL_PER_PART = 3;
const TOTAL_QUESTIONS = PARTS.length * TOTAL_PER_PART;

const byNewest = (a?: string, b?: string) => {
  const ta = a ? Date.parse(a) : 0;
  const tb = b ? Date.parse(b) : 0;
  return tb - ta;
};

function normalizeDominant(v?: string): "ombra" | "ego" | "tu" | null {
  if (!v) return null;
  const s = v.toLowerCase().trim();
  if (["ombra", "shadow"].includes(s)) return "ombra";
  if (["ego"].includes(s)) return "ego";
  if (["tu", "you"].includes(s)) return "tu";
  return null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [raw, setRaw] = useState<Answer[]>([]);

  useEffect(() => {
    try {
      const payload = localStorage.getItem("tremor.answers.v1");
      const arr = payload ? JSON.parse(payload) : [];
      setRaw(Array.isArray(arr) ? arr : []);
    } catch {
      setRaw([]);
    }
  }, []);

  // Desduplicar per (partKey, question) → entrada més recent
  const answers = useMemo<Answer[]>(() => {
    const map = new Map<string, Answer>();
    for (const a of raw) {
      if (!a?.partKey || !a?.question) continue;
      const key = `${a.partKey}||${a.question}`;
      const prev = map.get(key);
      if (!prev || byNewest(a.createdAt, prev.createdAt) < 0) {
        map.set(key, a);
      }
    }
    return [...map.values()];
  }, [raw]);

  const completed = Math.min(answers.length, TOTAL_QUESTIONS);
  const progress = Math.round((completed / TOTAL_QUESTIONS) * 100);

  // Veu dominant global
  const dominantCount: Record<"ombra" | "ego" | "tu", number> = {
    ombra: 0,
    ego: 0,
    tu: 0,
  };
  for (const a of answers) {
    const d = normalizeDominant(a.dominant);
    if (d) dominantCount[d] += 1;
  }
  const dominantVoice =
    (Object.entries(dominantCount).sort((a, b) => b[1] - a[1])[0]?.[1] || 0) > 0
      ? (Object.entries(dominantCount).sort((a, b) => b[1] - a[1])[0]![0] as
          | "ombra"
          | "ego"
          | "tu")
      : null;

  // Comptes per part + grupat per detall
  const perPart = PARTS.map((p) => {
    const count = answers.filter((a) => a.partKey === p).length;
    return { part: p, count: Math.min(count, TOTAL_PER_PART) };
  });

  const grouped = useMemo(() => {
    const g: Record<string, Answer[]> = {};
    for (const p of PARTS) g[p] = [];
    for (const a of answers) g[a.partKey]?.push(a);
    for (const p of PARTS) g[p].sort((A, B) => byNewest(B.createdAt, A.createdAt));
    return g;
  }, [answers]);

  const resetData = () => {
    if (!confirm("Segur que vols esborrar les respostes guardades?")) return;
    localStorage.removeItem("tremor.answers.v1");
    location.reload();
  };

  // Exportacions
  const download = (filename: string, text: string, mime = "application/json") => {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      progress,
      dominantVoice,
      totalAnswers: answers.length,
      answers,
    };
    download("tremolor-export.json", JSON.stringify(payload, null, 2));
  };

  const snippet = (s?: string, n = 180) =>
    (s || "").replace(/\s+/g, " ").trim().slice(0, n) + ((s || "").length > n ? "…" : "");

  const buildMarkdown = () => {
    let md = `# Mapa del Tremolor — Resum\n\n`;
    md += `- Progress: **${progress}%**\n`;
    md += `- Dominant voice: **${dominantVoice ?? "—"}**\n`;
    md += `- Answers: **${answers.length}/${TOTAL_QUESTIONS}**\n\n`;
    for (const p of PARTS) {
      md += `## ${p}\n`;
      const list = grouped[p];
      if (!list?.length) {
        md += `*No responses.*\n\n`;
        continue;
      }
      for (const a of list) {
        md += `- **Q**: ${a.question}\n  - **Dominant**: ${a.dominant ?? "—"}\n  - **You**: ${snippet(a.response)}\n`;
      }
      md += `\n`;
    }
    return md;
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(buildMarkdown());
      alert("Resum (Markdown) copiat al porta-retalls.");
    } catch {
      // fallback: descarrega .md
      download("tremolor-resum.md", buildMarkdown(), "text/markdown");
    }
  };

  return (
    <main className="min-h-screen px-6 py-12 bg-black text-white">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Mapa del Tremolor</h1>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => router.push("/preguntes")}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-sm"
            >
              Continuar responent
            </button>
            <button
              onClick={() => router.push("/informe")}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-sm"
            >
              Veure Informe
            </button>
            <button
              onClick={handleDownloadJSON}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-sm"
            >
              Descarregar JSON
            </button>
            <button
              onClick={handleCopyMarkdown}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-sm"
            >
              Copiar resum (MD)
            </button>
            <button
              onClick={resetData}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm"
            >
              Reiniciar dades
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg bg-white/5 border border-white/10">
            <p className="text-sm opacity-70">Progrés</p>
            <p className="text-2xl font-bold">{progress}%</p>
          </div>
          <div className="p-6 rounded-lg bg-white/5 border border-white/10">
            <p className="text-sm opacity-70">Veu dominant</p>
            <p className="text-2xl font-bold capitalize">{dominantVoice ?? "—"}</p>
          </div>
          <div className="p-6 rounded-lg bg-white/5 border border-white/10">
            <p className="text-sm opacity-70">Respostes totals</p>
            <p className="text-2xl font-bold">
              {completed}/{TOTAL_QUESTIONS}
            </p>
          </div>
        </div>

        {/* Cercles */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-10">
          {perPart.map(({ part, count }) => (
            <div
              key={part}
              className="aspect-square rounded-full flex items-center justify-center border-4"
              style={{
                borderColor: count > 0 ? "#FFD700" : "#333",
                background: count > 0 ? "rgba(255,215,0,0.12)" : "transparent",
              }}
              title={part}
            >
              <span className="font-medium">{count}/3</span>
            </div>
          ))}
        </div>

        {/* Detall per part */}
        <div className="space-y-3">
          {PARTS.map((p) => (
            <details key={p} className="bg-white/5 border border-white/10 rounded-lg">
              <summary className="cursor-pointer select-none px-4 py-3 font-medium">
                {p} · {grouped[p]?.length || 0} respostes
              </summary>
              <div className="px-4 pb-4 space-y-3">
                {(grouped[p] || []).map((a, i) => (
                  <div key={i} className="text-sm border border-white/10 rounded p-3 bg-black/30">
                    <div className="opacity-80">Q: {a.question}</div>
                    <div className="mt-1">
                      <span className="opacity-70">Tu:</span> {snippet(a.response, 240)}
                    </div>
                    <div className="mt-1 text-xs opacity-70">
                      Dominant: <span className="capitalize">{a.dominant ?? "—"}</span> ·{" "}
                      {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
                    </div>
                  </div>
                ))}
                {(grouped[p] || []).length === 0 && (
                  <div className="text-sm opacity-70">Cap resposta en aquesta part.</div>
                )}
              </div>
            </details>
          ))}
        </div>

        <p className="text-xs opacity-60">
          * Comptem només la darrera resposta de cada pregunta i part. Pots exportar JSON o copiar un
          resum en Markdown per guardar o compartir.
        </p>
      </div>
    </main>
  );
}
