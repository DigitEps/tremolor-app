"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Answer = {
  partKey: string;
  question: string;
  response: string;
  dominant: string;
  createdAt: string;
};

// ─────────────────────────────────────────────────────────────
// UTILITATS
// ─────────────────────────────────────────────────────────────

function norm(s?: string) {
  return (s ?? "").toLowerCase().normalize("NFC");
}

function trimLen(s: string, n = 200) {
  const t = (s || "").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}

function capitalize(s: string) {
  const t = (s || "").trim();
  if (!t) return "—";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function pickLast(answers: Answer[], qFrag: string) {
  const f = norm(qFrag);
  for (let i = answers.length - 1; i >= 0; i--) {
    if (norm(answers[i]?.question).includes(f)) return answers[i]?.response || "";
  }
  return "";
}

function has(text: string, keywords: string[]): boolean {
  const t = norm(text);
  return keywords.some(k => t.includes(norm(k)));
}

function statsFrom(answers: Answer[]) {
  const total = 15;
  const completed = answers?.length || 0;
  const progress = Math.round((completed / total) * 100);

  const counts: Record<string, number> = {};
  answers.forEach((a) => {
    const k = (a?.dominant || "").toLowerCase();
    if (!k) return;
    counts[k] = (counts[k] || 0) + 1;
  });

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const dominantVoice = entries[0]?.[0] || "—";

  return { total, completed, progress, counts, dominantVoice };
}

// ─────────────────────────────────────────────────────────────
// DETECCIÓ DE PATRONS
// ─────────────────────────────────────────────────────────────

interface Patterns {
  clown: boolean;
  blameOthers: boolean;
  failure: boolean;
  invisible: boolean;
  control: boolean;
  perfectionist: boolean;
  pleaser: boolean;
  parentMirror: boolean;
  fall: boolean;
  selfDestruct: boolean;
  postpone: boolean;
  arrogance: boolean;
}

function detectPatterns(answers: Answer[]): Patterns {
  const allText = answers.map(a => `${a.question} ${a.response}`).join(" ");
  const mask = pickLast(answers, "màscara");
  const loop = pickLast(answers, "loop");
  const parent = pickLast(answers, "assembles") || pickLast(answers, "pare") || pickLast(answers, "mare");
  const direction = pickLast(answers, "direcció") || pickLast(answers, "llibertat");
  const growth = pickLast(answers, "créixer") || pickLast(answers, "destruir");
  const tomorrow = pickLast(answers, "triar") || pickLast(answers, "complet");
  const family = pickLast(answers, "secret") || pickLast(answers, "familiar");

  return {
    clown: has(mask, ["pallasso", "graciós", "riure", "humor", "fer riure"]),
    blameOthers: has(allText, ["culpa", "altres", "ells", "seu problema", "no és meva"]),
    failure: has(allText, ["fracàs", "fracas", "no serveixo", "inútil", "merda", "no valc"]),
    invisible: has(allText, ["invisible", "no ser vist", "ningú em veu", "sol", "solitari"]),
    control: has(allText, ["control", "controlar", "ordre", "mandar", "tenir raó"]),
    perfectionist: has(allText, ["perfecte", "perfecta", "error", "fallar", "no puc fallar"]),
    pleaser: has(allText, ["agradar", "complaure", "quedar bé", "què diran"]),
    parentMirror: has(parent, ["pare", "mare", "igual", "mateix", "assemblo"]),
    fall: has(direction, ["caiguda", "caure", "perdre", "buit"]),
    selfDestruct: has(growth, ["no", "destruir", "impossible", "no puc"]),
    postpone: has(tomorrow, ["demà", "potser", "algun dia", "ja veurem"]),
    arrogance: has(family, ["cregut", "creguts", "superiors", "millors"]),
  };
}

// ─────────────────────────────────────────────────────────────
// GENERACIÓ INFORME TXT (TO TREMOLOR)
// ─────────────────────────────────────────────────────────────

function buildInformeTremolor(answers: Answer[], patterns: Patterns): string {
  const st = statsFrom(answers);

  // IMPORTANT: evitem el “demo vibe”. Si falta alguna resposta clau, millor “—”.
  const fallback = "—";

  const mask = trimLen(pickLast(answers, "màscara"), 150) || fallback;
  const loop = trimLen(pickLast(answers, "loop"), 150) || fallback;
  const fear = trimLen(pickLast(answers, "por") || pickLast(answers, "fracas") || pickLast(answers, "descobert"), 150) || fallback;
  const whoAlone = trimLen(pickLast(answers, "ningú mira"), 150) || fallback;

  const lines: string[] = [];

  // Header
  lines.push("╔══════════════════════════════════════════════════════════════════╗");
  lines.push("║                                                                  ║");
  lines.push("║                    MAPA DEL TREMOLOR                             ║");
  lines.push("║                    El teu informe                                ║");
  lines.push("║                                                                  ║");
  lines.push("╚══════════════════════════════════════════════════════════════════╝");
  lines.push("");
  lines.push(`Progrés: ${st.progress}%  ·  Respostes: ${st.completed}/${st.total}  ·  Veu dominant: ${capitalize(st.dominantVoice)}`);
  lines.push("");
  lines.push("══════════════════════════════════════════════════════════════════════");
  lines.push("");
  lines.push("Això no és un test de personalitat. És un mirall.");
  lines.push("I els miralls no et volen fer sentir bé.");
  lines.push("Et volen fer RESPONSABLE.");
  lines.push("");
  lines.push("──────────────────────────────────────────────────────────────────────");
  lines.push("  NOTA IMPORTANT");
  lines.push("──────────────────────────────────────────────────────────────────────");
  lines.push("");
  lines.push("Això NO substitueix teràpia, medicació ni cap professional.");
  lines.push("Si estàs en crisi o tens idees d'autolesió: PARA AQUÍ.");
  lines.push("Parla amb un psicòleg, psiquiatre o metge. Demana ajuda.");
  lines.push("Això és un complement. Un cop de llum. No una sala d'urgències.");
  lines.push("");
  lines.push("══════════════════════════════════════════════════════════════════════");
  lines.push("");

  // 4 Miralls
  lines.push("EL QUE HAS REVELAT (4 miralls)");
  lines.push("──────────────────────────────────────────────────────────────────────");
  lines.push("");
  lines.push("🎭 LA TEVA MÀSCARA");
  lines.push(`   "${mask}"`);
  lines.push("   No és qui ets. És el que fas perquè no et vegin.");
  lines.push("");
  lines.push("🔄 EL LOOP QUE ES REPETEIX");
  lines.push(`   "${loop}"`);
  lines.push("   La teva rutina no és vida. És un mecanisme per no sentir.");
  lines.push("");
  lines.push("💔 LA FERIDA QUE PROTEGEIXES");
  lines.push(`   "${fear}"`);
  lines.push("   Això no és debilitat. És la factura d'anys fent veure que no passa res.");
  lines.push("");
  lines.push("👁 QUI ETS QUAN NINGÚ MIRA");
  lines.push(`   "${whoAlone}"`);
  lines.push("   Aquí hi ha la veritat. I fa ràbia. Perquè és simple.");
  lines.push("");
  lines.push("══════════════════════════════════════════════════════════════════════");
  lines.push("");

  // Veritat incòmoda
  lines.push("UNA VERITAT INCÒMODA (però reversible)");
  lines.push("──────────────────────────────────────────────────────────────────────");
  lines.push("");
  lines.push("No estàs condemnat. Però tampoc estàs \"bloquejat\".");
  lines.push("Estàs REPETINT.");
  lines.push("");
  lines.push("I sí: es pot revertir sense heroïcitats.");
  lines.push("Sense pagar un \"preu alt\"...");
  lines.push("Perquè el preu alt JA EL PAGUES ARA:");
  lines.push("en energia, en soroll i en autoengany.");
  lines.push("");
  lines.push("══════════════════════════════════════════════════════════════════════");
  lines.push("");

  // 3 Accions
  lines.push("3 ACCIONS PER AVUI (no demà, avui)");
  lines.push("──────────────────────────────────────────────────────────────────────");
  lines.push("");

  // Acció 1
  lines.push("1) UN \"NO\" PETIT on normalment diries \"sí\"");
  lines.push("");
  if (patterns.pleaser || patterns.clown) {
    lines.push("   Tu que vas de maja/o amb tothom:");
    lines.push("   · \"No puc avui. Ho fem demà.\"");
    lines.push("   · \"Això no m'encaixa. Passo.\"");
    lines.push("   · \"No em va bé aquest to. Parlem bé o no parlem.\"");
  } else if (patterns.control) {
    lines.push("   Tu que necessites controlar-ho tot:");
    lines.push("   · \"Això ho delego. No ho superviso.\"");
    lines.push("   · \"No opino. Fes-ho com vegis.\"");
    lines.push("   · \"No és problema meu. Següent.\"");
  } else {
    lines.push("   Exemples:");
    lines.push("   · \"No puc avui. Ho fem demà.\"");
    lines.push("   · \"Això no m'encaixa. Passo.\"");
    lines.push("   · \"No em va bé aquest to. Parlem bé o no parlem.\"");
  }
  lines.push("");
  lines.push("   👉 No és agressiu. És HIGIENE.");
  lines.push("");

  // Acció 2
  lines.push("2) REGLA 10' — comença i prou");
  lines.push("");
  if (patterns.postpone) {
    lines.push("   Tu que sempre dius \"demà\":");
    lines.push("   · 10' fent AIXÒ que portes posposant. Ara.");
    lines.push("   · No tot. Només 10 minuts. I veus què passa.");
  } else if (patterns.selfDestruct) {
    lines.push("   Tu que creus que has de destruir-te per canviar:");
    lines.push("   · 10' caminar sense música (sí, sense anestèsia).");
    lines.push("   · 10' escriure el que estàs evitant en 5 línies.");
    lines.push("   · No cal heroïcitats. Només 10 minuts.");
  } else {
    lines.push("   Exemples:");
    lines.push("   · 10' caminar sense música (sí, sense anestèsia).");
    lines.push("   · 10' ordenar un sol racó (no tota la casa, no siguis teatrero).");
    lines.push("   · 10' escriure el que estàs evitant en 5 línies.");
  }
  lines.push("");
  lines.push("   👉 El teu cervell negocia. Tu no.");
  lines.push("");

  // Acció 3
  lines.push("3) ACTE DE VISIBILITAT: una veritat o una ajuda concreta");
  lines.push("");
  if (patterns.invisible) {
    lines.push("   Tu que t'amagues perquè ser vist fa mal:");
    lines.push("   · Un missatge honest. Sense excuses. Curt.");
    lines.push("   · \"Em costa. Necessito parlar 10 minuts.\"");
    lines.push("   · Deixa que et vegin. Només una mica. És un múscul.");
  } else if (patterns.failure) {
    lines.push("   Tu que creus que ets un fracàs:");
    lines.push("   · Diu en veu alta: \"He fracassat en X. I segueixo aquí.\"");
    lines.push("   · A la parella: \"Em fa por això. No em surt dir-ho bé, però és això.\"");
    lines.push("   · El fracàs no et defineix. La rendició sí.");
  } else {
    lines.push("   Exemples:");
    lines.push("   · A la parella: \"Em fa por això. No em surt dir-ho bé, però és això.\"");
    lines.push("   · A un amic: \"Em costa. Necessito parlar 10 minuts.\"");
    lines.push("   · A la feina: \"Això ho puc fer, això no. I no em disculpo per existir.\"");
  }
  lines.push("");
  lines.push("   👉 Visibilitat no és drama. És CLAREDAT.");
  lines.push("");
  lines.push("══════════════════════════════════════════════════════════════════════");
  lines.push("");

  // Pla 7 dies
  lines.push("PLA 7 DIES (sense poesia, amb efecte)");
  lines.push("──────────────────────────────────────────────────────────────────────");
  lines.push("");
  lines.push("DIA 1 — NO + 10' acció");
  lines.push("   Un límit petit + una acció petita. Sense explicacions eternes.");
  lines.push("");
  lines.push("DIA 2 — Talla 1 anestèsia 24h");
  lines.push("   Pantalla / sucre / tabac / alcohol: UNA. Només 24h.");
  lines.push("   No és moral. És veure qui mana.");
  lines.push("");
  lines.push("DIA 3 — 1 límit en 1 frase");
  lines.push("   Curt. Ferm. Educat.");
  lines.push("   \"Ho entenc, però no ho faré.\"");
  lines.push("");
  lines.push("DIA 4 — 10' ordre (objecte/espai)");
  lines.push("   Un objecte o un espai = una ment menys bruta.");
  lines.push("");
  lines.push("DIA 5 — Frase far (1 línia) + 10' pas");
  lines.push("   Far: \"Aquesta setmana trio X.\"");
  lines.push("   Pas: una acció que ho demostri.");
  lines.push("");
  lines.push("DIA 6 — Acte de visibilitat");
  lines.push("   Una conversa o un missatge que portes dies evitant.");
  lines.push("");
  lines.push("DIA 7 — Revisió brutal (sense fuet)");
  lines.push("   Què has evitat? Per què?");
  lines.push("   I quina excusa t'ha sonat més \"intel·ligent\"?");
  lines.push("");
  lines.push("══════════════════════════════════════════════════════════════════════");
  lines.push("");

  // Tancament
  lines.push("I ARA, ESCOLTA AIXÒ");
  lines.push("──────────────────────────────────────────────────────────────────────");
  lines.push("");
  lines.push("Sí, t'he parlat dur.");
  lines.push("Perquè algú havia de fer-ho.");
  lines.push("Perquè portes massa temps escoltant mentides amables");
  lines.push("que et deixen exactament on ets.");
  lines.push("");
  lines.push("Però això no vol dir que no valguis.");
  lines.push("Vol dir que VALS MASSA per seguir dormint.");
  lines.push("");
  lines.push("El tremolor que sents no és debilitat.");
  lines.push("És la prova que alguna cosa vol néixer.");
  lines.push("");
  lines.push("No has de ser perfecte. No has de tenir-ho clar.");
  lines.push("Només has de fer el següent pas.");
  lines.push("Petit. Ara.");
  lines.push("");
  lines.push("══════════════════════════════════════════════════════════════════════");
  lines.push("");

  // Respostes
  lines.push("LES TEVES RESPOSTES");
  lines.push("──────────────────────────────────────────────────────────────────────");
  lines.push("");
  if (!answers?.length) {
    lines.push("(Encara no hi ha respostes guardades)");
  } else {
    answers.forEach((a, i) => {
      const q = (a.question || "").replace(/\s+/g, " ").trim();
      const r = (a.response || "—").replace(/\s+/g, " ").trim();
      lines.push(`${i + 1}. ${q}`);
      lines.push(`   → ${r}`);
      lines.push("");
    });
  }

  // Footer
  lines.push("══════════════════════════════════════════════════════════════════════");
  lines.push("");
  lines.push("                       El tremolor continua.");
  lines.push("");
  lines.push("                       — EdmondSystems · Tremolor");
  lines.push("");
  lines.push("══════════════════════════════════════════════════════════════════════");

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────
// FUNCIONS UI
// ─────────────────────────────────────────────────────────────

function downloadText(filename: string, content: string) {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────
// COMPONENT PRINCIPAL
// ─────────────────────────────────────────────────────────────

export default function InformePage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tremor.answers.v1") || "[]";
      const parsed = JSON.parse(raw);
      setAnswers(Array.isArray(parsed) ? parsed : []);
    } catch {
      setAnswers([]);
    }
  }, []);

  const stats = useMemo(() => statsFrom(answers), [answers]);
  const patterns = useMemo(() => detectPatterns(answers), [answers]);
  const informeText = useMemo(() => buildInformeTremolor(answers, patterns), [answers, patterns]);

  const isComplete = stats.completed >= stats.total;
  const isEmpty = stats.completed === 0;

  const goToQuiz = () => router.push("/preguntes");

  const resetProgress = () => {
    if (window.confirm("Segur? Perdràs el progrés actual.")) {
      localStorage.removeItem("tremor.answers.v1");
      router.push("/preguntes");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // MODE PORTA v2 (0/15 i parcial)
  // ─────────────────────────────────────────────────────────────
  if (!isComplete) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-white">
        {/* Header */}
        <header className="border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-20">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight">Mapa del Tremolor</h1>
            <button
              onClick={() => router.push("/")}
              className="text-sm text-white/40 hover:text-white transition"
            >
              ← Inici
            </button>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-16">
          <section className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 text-center space-y-6">
            {isEmpty ? (
              <>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Encara no tens informe
                </h2>
                <p className="text-white/60 text-base md:text-lg">
                  15 preguntes. 5 minuts. Cap resposta correcta.
                </p>

                <button
                  onClick={goToQuiz}
                  className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition text-lg"
                >
                  Entrar →
                </button>

                <p className="text-white/35 text-sm pt-2">
                  Les respostes es queden al teu dispositiu. Ningú més les veu.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Tens el mirall a mitges
                </h2>
                <p className="text-white/60 text-base md:text-lg">
                  Has fet <strong className="text-white">{stats.completed}/{stats.total}</strong>. El que falta és on l’Ombra s’amaga.
                </p>

                {/* Progress bar */}
                <div className="pt-2">
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-white/80"
                      style={{ width: `${Math.min(Math.max(stats.progress, 0), 100)}%` }}
                    />
                  </div>
                  <div className="text-white/35 text-sm mt-2">
                    Progrés: {stats.progress}%
                  </div>
                </div>

                <button
                  onClick={goToQuiz}
                  className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition text-lg"
                >
                  Continuar ({stats.completed}/{stats.total}) →
                </button>

                <div className="pt-2">
                  <button
                    onClick={resetProgress}
                    className="text-white/30 hover:text-white/60 text-sm underline underline-offset-4 transition"
                  >
                    Tornar a començar
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // INFORME COMPLET (15/15) — TAL QUAL (amb millores mínimes)
  // ─────────────────────────────────────────────────────────────

  const fallback = "—";
  const mask = trimLen(pickLast(answers, "màscara"), 150) || fallback;
  const loop = trimLen(pickLast(answers, "loop"), 150) || fallback;
  const fear = trimLen(pickLast(answers, "por") || pickLast(answers, "fracas"), 150) || fallback;
  const whoAlone = trimLen(pickLast(answers, "ningú mira"), 150) || fallback;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(informeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = informeText;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  };

  // Donut
  const Donut = () => {
    const tu = stats.counts.tu || 0;
    const ego = stats.counts.ego || 0;
    const ombra = stats.counts.ombra || 0;
    const total = Math.max(tu + ego + ombra, 1);

    const segments = [
      { pct: tu / total, color: "#facc15", label: "Tu", count: tu },
      { pct: ego / total, color: "#3b82f6", label: "Ego", count: ego },
      { pct: ombra / total, color: "#a855f7", label: "Ombra", count: ombra },
    ];

    const R = 45;
    const C = 120;
    const P = 2 * Math.PI * R;
    let offset = 0;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
        <svg width={C} height={C} viewBox={`0 0 ${C} ${C}`}>
          <circle cx={C / 2} cy={C / 2} r={R} fill="none" stroke="#1f1f1f" strokeWidth="20" />
          <g transform={`rotate(-90 ${C / 2} ${C / 2})`}>
            {segments.map((s, i) => {
              const len = s.pct * P;
              const circle = (
                <circle
                  key={i}
                  cx={C / 2}
                  cy={C / 2}
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="20"
                  strokeDasharray={`${len} ${P - len}`}
                  strokeDashoffset={-offset}
                  className="transition-all duration-500"
                />
              );
              offset += len;
              return circle;
            })}
          </g>
        </svg>
        <div className="space-y-3">
          {segments.map((s, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="w-4 h-4 rounded-full" style={{ background: s.color }} />
              <span className="text-white/60 w-16">{s.label}</span>
              <span className="text-white font-bold text-lg">{Math.round(s.pct * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Accions personalitzades per UI
  const getAccio1 = () => {
    if (patterns.pleaser || patterns.clown) {
      return {
        title: 'Un "NO" petit (tu que vas de maja/o)',
        examples: [
          '"No puc avui. Ho fem demà."',
          '"Això no m\'encaixa. Passo."',
          '"No em va bé aquest to. Parlem bé o no parlem."',
        ],
        nota: "No és agressiu. És higiene.",
      };
    }
    if (patterns.control) {
      return {
        title: 'Un "NO" petit (tu que controles tot)',
        examples: ['"Això ho delego. No ho superviso."', '"No opino. Fes-ho com vegis."', '"No és problema meu. Següent."'],
        nota: "Deixar anar no és perdre. És respirar.",
      };
    }
    return {
      title: 'Un "NO" petit on normalment diries "sí"',
      examples: ['"No puc avui. Ho fem demà."', '"Això no m\'encaixa. Passo."', '"No em va bé aquest to. Parlem bé o no parlem."'],
      nota: "No és agressiu. És higiene.",
    };
  };

  const getAccio2 = () => {
    if (patterns.postpone) {
      return {
        title: 'Regla 10\' (tu que sempre dius "demà")',
        examples: ["10' fent AIXÒ que portes posposant. Ara.", "No tot. Només 10 minuts. I veus què passa."],
        nota: "El demà no existeix. Només hi ha ara.",
      };
    }
    return {
      title: "Regla 10' — comença i prou",
      examples: ["10' caminar sense música (sí, sense anestèsia).", "10' ordenar un sol racó (no tota la casa).", "10' escriure el que estàs evitant en 5 línies."],
      nota: "El teu cervell negocia. Tu no.",
    };
  };

  const getAccio3 = () => {
    if (patterns.invisible) {
      return {
        title: "Acte de visibilitat (tu que t'amagues)",
        examples: ["Un missatge honest. Sense excuses. Curt.", '"Em costa. Necessito parlar 10 minuts."', "Deixa que et vegin. Només una mica."],
        nota: "Visibilitat no és drama. És claredat.",
      };
    }
    if (patterns.failure) {
      return {
        title: "Acte de visibilitat (tu que et sents fracàs)",
        examples: ['Diu en veu alta: "He fracassat en X. I segueixo aquí."', 'A la parella: "Em fa por això."', "El fracàs no et defineix. La rendició sí."],
        nota: "Ets més que els teus errors.",
      };
    }
    return {
      title: "Acte de visibilitat: una veritat o una ajuda",
      examples: ['A la parella: "Em fa por això. No em surt dir-ho bé, però és això."', 'A un amic: "Em costa. Necessito parlar 10 minuts."', 'A la feina: "Això ho puc fer, això no."'],
      nota: "Visibilitat no és drama. És claredat.",
    };
  };

  const accio1 = getAccio1();
  const accio2 = getAccio2();
  const accio3 = getAccio3();

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">Mapa del Tremolor</h1>
          <button onClick={() => router.push("/")} className="text-sm text-white/40 hover:text-white transition">
            ← Inici
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">
        {/* Hero */}
        <section className="text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">El teu informe</h2>
          <p className="text-lg text-white/50 max-w-xl mx-auto">
            Això no és un test de personalitat. És un mirall.<br />
            I els miralls no et volen fer sentir bé.<br />
            <span className="text-white/80 font-medium">Et volen fer responsable.</span>
          </p>
        </section>

        {/* Avís ètic */}
        <section className="bg-red-950/30 border border-red-500/20 rounded-xl p-6">
          <p className="text-red-200/80 text-sm leading-relaxed">
            <strong className="text-red-300">Nota important:</strong> Això NO substitueix teràpia, medicació ni cap professional.
            Si estàs en crisi o tens idees d'autolesió: <strong>para aquí</strong> i parla amb un psicòleg, psiquiatre o metge.
            Això és un complement. Un cop de llum. No una sala d'urgències.
          </p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold">{stats.progress}%</div>
            <div className="text-sm text-white/40 mt-1">Progrés</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold">
              {stats.completed}/{stats.total}
            </div>
            <div className="text-sm text-white/40 mt-1">Respostes</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-2xl font-bold">{capitalize(stats.dominantVoice)}</div>
            <div className="text-sm text-white/40 mt-1">Veu dominant</div>
          </div>
        </section>

        {/* Donut */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <Donut />
        </section>

        {/* 4 Miralls */}
        <section className="space-y-6">
          <h3 className="text-2xl font-bold">El que has revelat</h3>
          <div className="grid gap-4">
            {[
              {
                icon: "🎭",
                label: "La teva màscara",
                value: mask,
                subtext: "No és qui ets. És el que fas perquè no et vegin.",
              },
              {
                icon: "🔄",
                label: "El loop que es repeteix",
                value: loop,
                subtext: "La teva rutina no és vida. És un mecanisme per no sentir.",
              },
              {
                icon: "💔",
                label: "La ferida que protegeixes",
                value: fear,
                subtext: "Això no és debilitat. És la factura d'anys fent veure que no passa res.",
              },
              {
                icon: "👁",
                label: "Qui ets quan ningú mira",
                value: whoAlone,
                subtext: "Aquí hi ha la veritat. I fa ràbia. Perquè és simple.",
              },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-2 text-sm text-white/40 mb-2">
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                <div className="text-white text-xl font-medium mb-2">"{item.value}"</div>
                <div className="text-white/40 text-sm italic">{item.subtext}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Veritat incòmoda */}
        <section className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8 text-center space-y-4">
          <h3 className="text-xl font-bold text-white/90">Una veritat incòmoda (però reversible)</h3>
          <div className="space-y-2 text-white/60">
            <p>No estàs condemnat. Però tampoc estàs "bloquejat".</p>
            <p className="text-white text-xl font-bold">Estàs repetint.</p>
            <p className="text-sm pt-2">
              I sí: es pot revertir sense heroïcitats. Sense pagar un "preu alt"...<br />
              Perquè el preu alt <strong className="text-white">ja el pagues ara</strong>: en energia, en soroll i en autoengany.
            </p>
          </div>
        </section>

        {/* 3 Accions */}
        <section className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold">3 accions per avui</h3>
            <p className="text-white/40 text-sm mt-1">No demà. Avui. El tremolor no espera.</p>
          </div>

          <div className="space-y-4">
            {[accio1, accio2, accio3].map((accio, i) => (
              <div key={i} className="bg-gradient-to-br from-amber-950/30 to-black border border-amber-500/20 rounded-xl p-6">
                <div className="text-amber-300 font-bold text-lg mb-3">
                  {i + 1}. {accio.title}
                </div>
                <ul className="space-y-2 mb-4">
                  {accio.examples.map((ex, j) => (
                    <li key={j} className="text-white/70 text-sm flex items-start gap-2">
                      <span className="text-amber-500">·</span>
                      <span>{ex}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-amber-200/60 text-sm italic">👉 {accio.nota}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Pla 7 dies */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
          <div>
            <h3 className="text-2xl font-bold">Pla 7 dies</h3>
            <p className="text-white/40 text-sm">Sense poesia. Amb efecte.</p>
          </div>

          <div className="grid gap-3">
            {[
              { dia: "1", text: "NO + 10' acció", desc: "Un límit petit + una acció petita." },
              { dia: "2", text: "Talla 1 anestèsia 24h", desc: "Pantalla / sucre / tabac / alcohol: UNA." },
              { dia: "3", text: '1 límit en 1 frase', desc: '"Ho entenc, però no ho faré."' },
              { dia: "4", text: "10' ordre", desc: "Un objecte o un espai = ment menys bruta." },
              { dia: "5", text: "Frase far + 10' pas", desc: '"Aquesta setmana trio X" + acció.' },
              { dia: "6", text: "Acte de visibilitat", desc: "La conversa que portes dies evitant." },
              { dia: "7", text: "Revisió brutal", desc: 'Què has evitat? Quina excusa t\'ha sonat més "intel·ligent"?' },
            ].map((d, i) => (
              <div key={i} className="flex items-start gap-4 bg-black/30 rounded-lg p-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold shrink-0">{d.dia}</div>
                <div>
                  <div className="text-white font-medium">{d.text}</div>
                  <div className="text-white/40 text-sm">{d.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tancament */}
        <section className="text-center space-y-6 py-8">
          <h3 className="text-2xl font-bold">I ara, escolta això</h3>
          <div className="max-w-2xl mx-auto space-y-4 text-white/60 leading-relaxed">
            <p>
              Sí, t'he parlat dur. Perquè algú havia de fer-ho.<br />
              Perquè portes massa temps escoltant mentides amables<br />
              que et deixen exactament on ets.
            </p>
            <p className="text-white text-lg font-medium">
              Però això no vol dir que no valguis.<br />
              Vol dir que vals massa per seguir dormint.
            </p>
            <p>
              El tremolor que sents no és debilitat.<br />
              És la prova que alguna cosa vol néixer.
            </p>
            <p className="text-white/80 italic">
              No has de ser perfecte. No has de tenir-ho clar.<br />
              Només has de fer el següent pas. Petit. Ara.
            </p>
            <p className="text-white/50">
              I si caus, caus. Ja t'aixecaràs.<br />
              Perquè això és el que fas. El que sempre has fet.
            </p>
          </div>
        </section>

        {/* Descarrega */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4">
          <h3 className="text-xl font-semibold">Guarda el teu informe</h3>
          <p className="text-white/40 text-sm">
            Per quan el soroll torni a guanyar.<br />
            Per recordar el que ja saps... i oblides quan et convé.
          </p>
          <div className="flex flex-wrap gap-3 pt-4">
            <button
              onClick={() => downloadText("mapa-del-tremolor.txt", informeText)}
              className="px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition"
            >
              Guardar-ho (per quan et menteixis)
            </button>
            <button
              onClick={onCopy}
              className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 transition"
            >
              {copied ? "Copiat ✓" : "Copiar el mirall"}
            </button>
          </div>
        </section>

        {/* CTA El Tremolor Complet */}
        <section className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-black to-indigo-950/50" />
          <div className="relative p-8 md:p-12 space-y-8">
            <div className="space-y-4">
              <h3 className="text-3xl font-bold text-white">I ara què?</h3>
              <div className="space-y-3 text-white/60">
                <p>Ja ho has vist: patró, màscara, loop.</p>
                <p>Ara tens dues opcions:</p>
              </div>
              <div className="space-y-2 text-white/70 text-sm pl-4 border-l-2 border-white/20">
                <p>1. Fer el que fas sempre: guardar-ho, dir "ja ho miraré", i tornar al soroll.</p>
                <p>2. Continuar tremolant... però amb direcció.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="flex-1 space-y-1">
                  <div className="text-xl font-bold text-white">El Tremolor Complet</div>
                  <div className="text-white/40 text-sm">7 dies + profunditat + el que no s'escriu quan tens por de mirar-ho</div>
                </div>
                <button
                  onClick={() => window.open("https://digiteps.com/tremolor-complet", "_blank")}
                  className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition text-lg whitespace-nowrap"
                >
                  No em vull escapar
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Reiniciar (complet) */}
        <section className="text-center py-8">
          <button
            onClick={() => {
              if (window.confirm("Segur que vols esborrar les teves respostes i tornar a començar?")) {
                localStorage.removeItem("tremor.answers.v1");
                router.push("/preguntes");
              }
            }}
            className="text-white/30 hover:text-white/60 text-sm underline underline-offset-4 transition"
          >
            Tornar a començar (esborrar i repetir)
          </button>
        </section>

        {/* Footer */}
        <footer className="text-center py-12 border-t border-white/10">
          <p className="text-white/30 text-lg tracking-wide">El tremolor continua.</p>
          <p className="text-white/15 text-sm mt-3">EdmondSystems · Tremolor</p>
        </footer>
      </div>
    </main>
  );
}
