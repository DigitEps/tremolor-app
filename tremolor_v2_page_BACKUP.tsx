"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type NightId = "n1" | "n2" | "n3" | "n4" | "n5";
type RiskLevel = "none" | "soft" | "high";

type Night = {
  id: NightId;
  label: string;
  title: string;
  question: string;
  starters: string[];
};

const NIGHTS: Night[] = [
  {
    id: "n1",
    label: "NIT 1 · LA PORTA",
    title: "La Porta",
    question: "Què has entès de tu que abans no volies veure?",
    starters: ["He vist que…", "M’he adonat que…", "La veritat és que…", "Em costa acceptar que…"],
  },
  {
    id: "n2",
    label: "NIT 2 · LA MÀSCARA",
    title: "La Màscara",
    question: "Quina màscara utilitzes per no ser vist/a? I què t’estalvia?",
    starters: ["Faig veure que…", "Em poso la màscara de…", "Això m’estalvia sentir…", "Ho faig per evitar…"],
  },
  {
    id: "n3",
    label: "NIT 3 · EL LOOP",
    title: "El Loop",
    question: "Quin patró es repeteix i et fa perdre energia (sempre igual, amb excuses diferents)?",
    starters: ["El guió de sempre és…", "La meva excusa preferida és…", "Torno a caure en…", "Quan em poso així, sempre…"],
  },
  {
    id: "n4",
    label: "NIT 4 · LA FERIDA",
    title: "La Ferida",
    question: "Quina ferida protegeixes com si et salvés… però t’està cobrant interessos?",
    starters: ["Em fa mal quan…", "Ho amago perquè…", "Això em toca perquè…", "Em tanco quan…"],
  },
  {
    id: "n5",
    label: "NIT 5 · EL PAS",
    title: "El Pas",
    question: "Quin és el pas petit i real que estàs evitant (i què et fa por perdre si el fas)?",
    starters: ["El pas que evito és…", "Em fa por perdre…", "Si ho faig, temo que…", "El que no vull admetre és…"],
  },
];

// ---------- utilitats ----------
function normalize(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function sanitizeForExport(s: string) {
  return (s || "").replace(/\r/g, "").trim();
}

function hashSeed(s: string) {
  // petit hash determinista per variants
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick<T>(seed: string, arr: T[]) {
  const idx = hashSeed(seed) % arr.length;
  return arr[idx];
}

// ---------- risc (mínim viable) ----------
function detectRisk(text: string): RiskLevel {
  const t = normalize(text);

  const high = [
    "vull morir",
    "em vull morir",
    "suicid",
    "suïc",
    "matar-me",
    "matarme",
    "no vull seguir",
    "no puc mes",
    "no puc més",
    "autolesio",
    "autolesio",
    "fer-me mal",
    "ferme mal",
  ];
  if (high.some((k) => t.includes(normalize(k)))) return "high";

  const soft = ["odio", "rabia", "ràbia", "exploto", "cremar-ho tot", "destrossar", "agredir"];
  if (soft.some((k) => t.includes(normalize(k)))) return "soft";

  return "none";
}

// ---------- patrons (Nivell A, sense IA) ----------
type PatternId =
  | "postposar"
  | "control"
  | "exposicio"
  | "validacio"
  | "perfeccio"
  | "culpa"
  | "rumiacio"
  | "victima"
  | "abandono"
  | "rabia"
  | "default";

type Pattern = {
  id: PatternId;
  label: string;
  keywords: string[];
};

const PATTERNS: Pattern[] = [
  { id: "postposar", label: "Postposar", keywords: ["demà", "mes endavant", "encara no toca", "ja ho fare", "ja ho faré", "no es el moment", "quan estigui", "quan estigui llest"] },
  { id: "control", label: "Control", keywords: ["control", "controlat", "tot controlat", "ho controlo", "ordre", "no delego", "si no ho faig jo", "perfe"] },
  { id: "exposicio", label: "Por d’exposar-me", keywords: ["exposar", "que em vegin", "que s'adonin", "que s’adonin", "que descobreixin", "no soc el que semblo", "m'amago", "m’amago"] },
  { id: "validacio", label: "Validació", keywords: ["que em reconeguin", "reconeixement", "que soc bo", "que sóc bo", "aprovar", "agradar", "quedar be", "quedar bé"] },
  { id: "perfeccio", label: "Perfeccionisme", keywords: ["perfecte", "error", "fallar", "fracassar", "equivoco", "m'equivoco", "si m'equivoco", "no serveixo", "inutil", "inútil"] },
  { id: "culpa", label: "Culpa", keywords: ["culpa", "m'ho mereixo", "m’ho mereixo", "hauria", "hauria de", "per culpa meva", "soc un desastre", "sóc un desastre"] },
  { id: "rumiacio", label: "Rumiació", keywords: ["no paro de pensar", "li dono voltes", "dono voltes", "rumio", "sempre pensant", "cap no para", "el cap fa soroll"] },
  { id: "victima", label: "Víctima", keywords: ["sempre em passa", "tothom", "ningú", "m'ho fan", "m’ho fan", "es culpa dels altres", "és culpa dels altres"] },
  { id: "abandono", label: "Abandó", keywords: ["sol", "solitud", "em deixen", "no soc important", "no sóc important", "ningú em veu", "oblidat", "oblit"] },
  { id: "rabia", label: "Ràbia", keywords: ["rabia", "ràbia", "enfadat", "em bull", "exploto", "agressiu", "odi"] },
];

function detectPattern(answer: string): Pattern {
  const t = normalize(answer);
  if (!t) return { id: "default", label: "Sense etiqueta", keywords: [] };

  const scored = PATTERNS
    .map((p) => {
      const hits = p.keywords.filter((k) => t.includes(normalize(k))).length;
      return { p, hits };
    })
    .sort((a, b) => b.hits - a.hits);

  if (scored[0]?.hits > 0) return scored[0].p;

  // heurístiques extra (sense keywords exactes)
  if (/(sempre|mai|un altre cop)/.test(t)) return { id: "rumiacio", label: "Rumiació", keywords: [] };
  return { id: "default", label: "Sense etiqueta", keywords: [] };
}

// ---------- resposta per nit + patró ----------
type MirrorOut = {
  patternLabel: string;
  mirror: string;
  micro24h: string;
  questionPro: string;
};

function buildMirror(night: Night, answerRaw: string): MirrorOut {
  const answer = sanitizeForExport(answerRaw);
  const p = detectPattern(answer);
  const seed = `${night.id}::${p.id}::${answer}`;

  // base per nit (curt, no “cafe per a tots”)
  const baseByNight: Record<NightId, string[]> = {
    n1: [
      "Això que has escrit no és una idea: és un punt feble que ja has localitzat. I quan el veus, ja no pots dir que no ho sabies.",
      "La porta s’obre quan deixes de negociar amb tu mateix. No cal drama: cal precisió.",
    ],
    n2: [
      "La màscara et protegeix… i alhora et separa. El preu és silenciós: menys intimitat, menys descans.",
      "Aparentar control és una manera elegant de no demanar ajuda.",
    ],
    n3: [
      "Un loop no es trenca entenent-lo perfecte. Es trenca quan el talles 10 segons abans del de sempre.",
      "Si es repeteix, és perquè et dona un benefici ocult. No és màgia: és hàbit.",
    ],
    n4: [
      "Una ferida protegida sembla força… fins que t’ofega. La factura arriba en energia, paciència i cos.",
      "No és debilitat. És un lloc que no has volgut mirar amb calma.",
    ],
    n5: [
      "El pas petit no necessita motivació. Necessita un compromís curt i executable avui.",
      "Si esperes seguretat absoluta, estàs comprant ajornament amb el nom de “prudència”.",
    ],
  };

  // microaccions 24h per patró (mesurables)
  const microByPattern: Record<PatternId, string[]> = {
    postposar: [
      "24h: Tria UNA cosa evitada i fes-ne el primer 2% (5 minuts). Posa temporitzador. Quan soni, pares. Però ho has començat.",
      "24h: Escriu en 1 frase què faràs avui i envia-la a algú (o a tu mateix per WhatsApp). Sense explicar-te.",
    ],
    control: [
      "24h: Fes 1 concessió petita al desordre (un 5%). No ho arreglis. Observa el cos 60 segons.",
      "24h: Delegues UNA microdecisió (o demanes una opinió) i no la corregeixes després.",
    ],
    exposicio: [
      "24h: Acte de visibilitat mínim: un missatge curt i honest (1 línia). Sense justificar. Exemple: “Em costa. Necessito 10 minuts.”",
      "24h: Comparteix UNA veritat petita amb algú segur. No és confessió: és claredat.",
    ],
    validacio: [
      "24h: Fes una acció bona i NO l’expliquis a ningú. Observa l’impuls de buscar reconeixement i deixa’l passar.",
      "24h: Escriu: “Si ningú m’aplaudeix, què segueixo triant igualment?” i respon amb 2 línies.",
    ],
    perfeccio: [
      "24h: Publica/entrega una cosa al 80% (petita). No l’optimitzis. El teu objectiu és acabar, no brillar.",
      "24h: Fes una acció amb possibilitat d’error petit. Quan aparegui la por, respira 10 segons i continua.",
    ],
    culpa: [
      "24h: Escriu 3 frases: (1) què et culpes, (2) què has intentat, (3) quin pas digne faràs igualment. Punt.",
      "24h: Reemplaça un “hauria de” per un “avui trio”. I actua 5 minuts.",
    ],
    rumiacio: [
      "24h: Regla 10’: camina 10 minuts sense música. Quan la ment parli, només posa etiqueta: “pensament”.",
      "24h: Escriu el pensament repetitiu en 1 línia i talla’l amb una acció física de 2 minuts (aigua freda mans / flexions / estirament).",
    ],
    victima: [
      "24h: Canvi de frase: de “m’ho fan” a “què permeto?”. Escriu 1 límit possible i practica’l en una frase.",
      "24h: Identifica una cosa que sí controles avui (petita) i fes-la abans de les 12:00.",
    ],
    abandono: [
      "24h: Quan notis el buit, no busquis immediatament resposta externa. Espera 10 minuts. Respira. Escriu què estàs demanant realment.",
      "24h: Fes un acte d’autosuport: una acció que faries per algú estimat… però per tu.",
    ],
    rabia: [
      "24h: Descàrrega segura: 90 segons de moviment intens (saltar / flexions). Després escriu 2 línies del que realment t’ha tocat.",
      "24h: Tria una conversa i posa un límit amb to net (sense puny). Una frase.",
    ],
    default: [
      "24h: Tria una microacció clara (5 minuts) i fes-la avui abans de dormir. Sense negociar.",
      "24h: Escriu el pas petit en una frase i fes-lo immediatament durant 3 minuts.",
    ],
  };

  const proQByNight: Record<NightId, string[]> = {
    n1: ["Quina part de tu continua fent-se l’innocent… i què hi guanya?", "Què estàs protegint quan dius “ja ho faré”?" ],
    n2: ["Què et costa cada setmana mantenir aquest paper en peu?", "Qui series si avui no haguessis de semblar res?" ],
    n3: ["Quin és el primer segon on s’encén el loop?", "Quina recompensa secreta té repetir-ho?" ],
    n4: ["Quin límit no has posat per por del conflicte?", "De què et protegeix aquesta ferida… exactament?" ],
    n5: ["Quin és el ‘mínim digne’ d’avui, sense negociar?", "Què perdries si ho fessis bé… i ningú ho veiés?" ],
  };

  const mirror = [
    pick(seed + "::base", baseByNight[night.id]),
    p.id === "default" ? "" : `Etiqueta: ${p.label}.`,
    answer ? "" : "Si no escrius res, el teu cervell decideix per tu. I normalment decideix evitar.",
  ].filter(Boolean).join(" ");

  const micro24h = pick(seed + "::micro", microByPattern[p.id] || microByPattern.default);
  const questionPro = pick(seed + "::proq", proQByNight[night.id]);

  return { patternLabel: p.id === "default" ? "—" : p.label, mirror, micro24h, questionPro };
}

// ---------- exports ----------
function buildReportTxt(answers: Record<NightId, string>) {
  const lines: string[] = [];
  lines.push("TREMOLOR · NIVELL A (5 NITS)");
  lines.push("");
  lines.push("Cinc nits. Cinc miralls. No està “bé” ni “malament”. Està escrit. I això ja és un canvi.");
  lines.push("");

  for (const night of NIGHTS) {
    const a = sanitizeForExport(answers[night.id] || "");
    const m = buildMirror(night, a);

    lines.push(night.label);
    lines.push(night.question);
    lines.push("");
    lines.push("EL QUE HAS ESCRIT:");
    lines.push(a || "—");
    lines.push("");
    lines.push("MIRALL:");
    lines.push(m.mirror);
    lines.push("");
    lines.push("MICROACCIÓ 24H:");
    lines.push(m.micro24h);
    lines.push("");
    lines.push("PREGUNTA (PRO):");
    lines.push(m.questionPro);
    lines.push("");
    lines.push("------------------------------------------------------------");
    lines.push("");
  }

  lines.push("CTA:");
  lines.push("Segueix amb el PRO (15 preguntes): /v2/pro");
  lines.push("");

  return lines.join("\n");
}

function buildWordHtml(answers: Record<NightId, string>) {
  const esc = (s: string) =>
    (s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>");

  let html = `<!doctype html><html><head><meta charset="utf-8"/><title>Tremolor · Informe</title></head>
  <body style="font-family: Arial, sans-serif; line-height:1.5;">
  <h1 style="margin:0 0 8px 0;">Tremolor · Nivell A (5 nits)</h1>
  <div style="opacity:.75;margin-bottom:18px;">Cinc nits. Cinc miralls. No està “bé” ni “malament”. Està escrit. I això ja és un canvi.</div>`;

  for (const night of NIGHTS) {
    const a = sanitizeForExport(answers[night.id] || "");
    const m = buildMirror(night, a);
    html += `
      <h2 style="margin:18px 0 6px 0;">${esc(night.label)}</h2>
      <div style="margin-bottom:10px;"><b>${esc(night.question)}</b></div>
      <div style="margin-bottom:8px;opacity:.8;"><b>El que has escrit:</b><br/>${esc(a || "—")}</div>
      <div style="margin-bottom:8px;"><b>Mirall:</b><br/>${esc(m.mirror)}</div>
      <div style="margin-bottom:8px;"><b>Microacció 24h:</b><br/>${esc(m.micro24h)}</div>
      <div style="margin-bottom:18px;"><b>Pregunta (PRO):</b><br/>${esc(m.questionPro)}</div>
      <hr style="border:none;border-top:1px solid #ddd;margin:18px 0;"/>
    `;
  }

  html += `<p><b>Segueix amb el PRO:</b> /v2/pro</p></body></html>`;
  return html;
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function TremolorV2_NivellA() {
  const [view, setView] = useState<"landing" | "questions" | "report" | "safety">("landing");
  const [activeIdx, setActiveIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<NightId, string>>({ n1: "", n2: "", n3: "", n4: "", n5: "" });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const progress = useMemo(() => {
    const filled = NIGHTS.filter((n) => (answers[n.id] || "").trim().length > 0).length;
    return Math.round((filled / NIGHTS.length) * 100);
  }, [answers]);

  const riskGlobal = useMemo(() => {
    const levels = NIGHTS.map((n) => detectRisk(answers[n.id] || ""));
    if (levels.includes("high")) return "high";
    if (levels.includes("soft")) return "soft";
    return "none";
  }, [answers]);

  const currentNight = NIGHTS[activeIdx];

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tremolor.v2.a.answers");
      if (raw) setAnswers(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("tremolor.v2.a.answers", JSON.stringify(answers));
    } catch {}
  }, [answers]);

  useEffect(() => {
    if (view === "questions") setTimeout(() => textareaRef.current?.focus(), 60);
  }, [view, activeIdx]);

  function onStarter(st: string) {
    const cur = answers[currentNight.id] || "";
    if (cur.trim().length > 0) return;
    setAnswers((p) => ({ ...p, [currentNight.id]: st + " " }));
    setTimeout(() => textareaRef.current?.focus(), 60);
  }

  function onNext() {
    // risc high: atura i mostra recursos
    if (riskGlobal === "high") {
      setView("safety");
      return;
    }
    const next = activeIdx + 1;
    if (next < NIGHTS.length) setActiveIdx(next);
    else setView("report");
  }

  function onReset() {
    if (!confirm("Vols reiniciar i esborrar les respostes del Nivell A?")) return;
    setAnswers({ n1: "", n2: "", n3: "", n4: "", n5: "" });
    setActiveIdx(0);
    setView("landing");
    try {
      localStorage.removeItem("tremolor.v2.a.answers");
    } catch {}
  }

  const bg = "min-h-screen bg-black text-white";
  const card = "max-w-5xl mx-auto px-6 py-10";
  const panel = "rounded-[28px] border border-white/10 bg-black/40 shadow-[0_0_120px_rgba(130,0,255,0.15)]";
  const gradient = "bg-gradient-to-br from-[#2a0046] via-black to-black";

  return (
    <main className={`${bg} ${gradient}`}>
      <style jsx global>{`
        .tremolorTitle { display:inline-block; animation: tremolor 0.95s infinite; transform-origin:50% 50%; }
        @keyframes tremolor { 0%{transform:translate(0,0) rotate(0deg)} 20%{transform:translate(-1px,1px) rotate(-0.2deg)} 40%{transform:translate(1px,-1px) rotate(0.2deg)} 60%{transform:translate(-1px,0) rotate(-0.1deg)} 80%{transform:translate(1px,1px) rotate(0.1deg)} 100%{transform:translate(0,0) rotate(0deg)} }
        @media (prefers-reduced-motion: reduce) { .tremolorTitle { animation:none !important; } }
        @media print {
          .no-print { display:none !important; }
          body { background:#fff !important; color:#000 !important; }
        }
      `}</style>

      <div className={card}>
        <div className="flex items-center justify-between gap-4 no-print">
          <div className="text-white/60 text-sm">Tremolor · V2</div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-sm text-white/80">
              Progrés: {progress}%
            </div>
            <button onClick={onReset} className="px-3 py-1 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-sm">
              Reiniciar
            </button>
          </div>
        </div>

        {/* LANDING */}
        {view === "landing" && (
          <div className={`${panel} mt-6 p-10`}>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
              <span className="tremolorTitle">El tremolor</span>
              <br />
              continua…
            </h1>

            <div className="mt-6 text-white/75 text-lg max-w-2xl space-y-2">
              <div>Això no és un test de personalitat.</div>
              <div>És una conversa amb les veus que ja coneixes però prefereixes no escoltar.</div>
              <div className="mt-3 text-white/55">5 preguntes. 5 minuts. Cap resposta correcta. Només la teva veritat.</div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 no-print">
              <button
                onClick={() => setView("questions")}
                className="px-8 py-3 rounded-full bg-white text-black font-semibold hover:opacity-90"
              >
                Entrar →
              </button>
              <div className="px-6 py-3 rounded-full border border-white/10 bg-white/5 text-white/70">
                Les respostes es queden al teu dispositiu
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-orange-400/20 bg-orange-500/10 p-5">
              <div className="font-semibold text-white/95">Nota important</div>
              <div className="text-white/75 mt-1">
                Això és un complement. No substitueix teràpia ni cap professional. Si estàs en crisi o tens idees d’autolesió: <b>112 / 024</b>.
              </div>
            </div>
          </div>
        )}

        {/* SAFETY */}
        {view === "safety" && (
          <div className={`${panel} mt-6 p-10`}>
            <h2 className="text-3xl font-bold">Atura aquí.</h2>
            <p className="mt-3 text-white/75 max-w-2xl">
              El que has escrit indica risc alt. Aquesta app no és una sala d’urgències.
              Si estàs en perill o tens idees d’autolesió, demana ajuda ara.
            </p>

            <div className="mt-6 rounded-2xl border border-red-400/25 bg-red-500/10 p-5">
              <div className="text-white/90 font-semibold">Recursos immediats</div>
              <ul className="mt-2 text-white/80 list-disc pl-5 space-y-1">
                <li><b>112</b> emergències</li>
                <li><b>024</b> línia d’atenció a la conducta suïcida (Espanya)</li>
                <li>Truca a algú de confiança i no et quedis sol</li>
              </ul>
            </div>

            <div className="mt-8 flex gap-3 no-print">
              <button onClick={() => setView("questions")} className="px-6 py-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10">
                Tornar a les preguntes
              </button>
              <button onClick={onReset} className="px-6 py-3 rounded-full bg-white text-black font-semibold hover:opacity-90">
                Reiniciar
              </button>
            </div>
          </div>
        )}

        {/* QUESTIONS */}
        {view === "questions" && (
          <div className={`${panel} mt-6 p-10`}>
            <div className="flex items-center justify-between no-print">
              <button onClick={() => setView("landing")} className="text-white/70 hover:text-white">
                ← Inici
              </button>
              <div className="text-white/50">{activeIdx + 1}/{NIGHTS.length}</div>
            </div>

            <div className="mt-6">
              <div className="text-white/50 text-sm tracking-wider">{currentNight.label}</div>
              <h2 className="text-2xl sm:text-3xl font-bold mt-2">{currentNight.question}</h2>

              <div className="mt-6 text-white/60">Per començar (si el cap fa soroll):</div>
              <div className="mt-3 flex flex-wrap gap-2 no-print">
                {currentNight.starters.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onStarter(s)}
                    className="px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/80"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <textarea
                ref={textareaRef}
                value={answers[currentNight.id]}
                onChange={(e) => setAnswers((p) => ({ ...p, [currentNight.id]: e.target.value }))}
                placeholder="Escriu-ho com et surti. Després ja hi haurà ordre."
                className="mt-6 w-full min-h-[220px] rounded-2xl border border-white/10 bg-black/30 p-5 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />

              {riskGlobal !== "none" && (
                <div className="mt-4 text-sm text-white/70">
                  {riskGlobal === "soft" ? "⚠️ Tens intensitat alta (normal). Si notes que t’atabales, respira i fes-ho a poc a poc." : "⛔ Risc alt detectat."}
                </div>
              )}

              <div className="mt-8 flex items-center justify-between no-print">
                <button
                  onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                  disabled={activeIdx === 0}
                  className="px-5 py-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30"
                >
                  ← Enrere
                </button>

                <button
                  onClick={onNext}
                  className="px-7 py-3 rounded-full bg-purple-600 hover:bg-purple-500 font-semibold"
                >
                  {activeIdx === NIGHTS.length - 1 ? "Veure informe →" : "Següent →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REPORT */}
        {view === "report" && (
          <div className={`${panel} mt-6 p-10`}>
            <div className="flex items-center justify-between gap-3 no-print">
              <button onClick={() => setView("questions")} className="text-white/70 hover:text-white">
                ← Editar respostes
              </button>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => downloadFile("tremolor_nivell_a.txt", buildReportTxt(answers), "text/plain;charset=utf-8")}
                  className="px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
                >
                  TXT
                </button>
                <button
                  onClick={() => downloadFile("tremolor_nivell_a.html", buildWordHtml(answers), "text/html;charset=utf-8")}
                  className="px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
                >
                  Word
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
                >
                  Imprimir / PDF
                </button>
              </div>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mt-6">El teu informe</h2>
            <div className="mt-2 text-white/70">
              Cinc nits. Cinc miralls. No està “bé” ni “malament”. Està escrit. I això ja és un canvi.
            </div>

            <div className="mt-8 space-y-6">
              {NIGHTS.map((night) => {
                const a = (answers[night.id] || "").trim();
                const m = buildMirror(night, a);
                return (
                  <div key={night.id} className="border border-white/10 rounded-2xl p-6 bg-black/25">
                    <div className="text-white/50 text-sm tracking-wider">{night.label}</div>
                    <div className="text-white font-semibold text-xl mt-2">{night.question}</div>

                    <div className="mt-4 text-white/50 text-sm">El que has escrit</div>
                    <div className="mt-2 rounded-xl border border-white/10 bg-black/30 p-4 text-white/90">
                      {a || "—"}
                    </div>

                    <div className="mt-5 text-white/50 text-sm">Mirall (útil)</div>
                    <div className="mt-2 rounded-xl border border-purple-400/20 bg-purple-500/10 p-4">
                      <div className="text-white/80 text-sm mb-2">
                        Etiqueta: <b>{m.patternLabel}</b>
                      </div>
                      <div className="text-white/95">{m.mirror}</div>
                      <div className="mt-4 text-white/80">
                        <b>Microacció 24h:</b> {m.micro24h}
                      </div>
                      <div className="mt-4 text-white/95 font-semibold">
                        {m.questionPro}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 rounded-3xl border border-white/10 bg-black/30 p-8">
              <div className="text-3xl font-bold">I ara què?</div>
              <div className="mt-3 text-white/75 max-w-3xl">
                Tens dues opcions: guardar-ho com un souvenir i tornar al soroll… o fer el moviment petit que et costa.
                <br /><br />
                No et prometo motivació. Et prometo una cosa pitjor: <b>claredat</b>. La claredat és el que et treu excuses.
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 no-print">
                <div>
                  <div className="text-2xl font-bold">El Tremolor Complet</div>
                  <div className="text-white/70">15 preguntes (PRO V1) + profunditat + mapa</div>
                </div>
                <a
                  href="/v2/pro"
                  className="px-8 py-4 rounded-full bg-purple-600 hover:bg-purple-500 font-semibold text-center"
                >
                  No em vull escapar
                </a>
              </div>
            </div>

            <div className="mt-8 text-white/40 text-sm">
              EdmondSystems · Tremolor (V2) — Les respostes es queden al teu dispositiu
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
