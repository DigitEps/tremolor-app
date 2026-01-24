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

function normalizeApostrophes(text: string): string {
  return text.replace(/[''ʼ`´]/g, "'");
}

function sanitizeForExport(s: string) {
  return normalizeApostrophes((s || "").replace(/\r/g, "").trim());
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

// ---------- patrons (Nivell A, sense IA) - Sistema de 12 patrons ----------
type PatternId =
  | "CONTROL"
  | "APROVACIÓ"
  | "FUGIDA"
  | "CULPA"
  | "DESVALORITZACIÓ"
  | "RÀBIA_CONTINGUDA"
  | "POR_CONFLICTE"
  | "RUMIACIÓ"
  | "AUTOEXIGÈNCIA"
  | "DEPENDÈNCIA"
  | "ANESTÈSIA"
  | "JA_ES_TARD"
  | "SENSE_DADES";

type Pattern = {
  id: PatternId;
  label: string;
  keywords: string[];
  risk: string;
  microAction: string;
  cutPhrase: string;
};

const PATTERNS: Pattern[] = [
  {
    id: "CONTROL",
    label: "CONTROL",
    keywords: ["control", "perfecte", "ha de sortir", "si no ho faig jo"],
    risk: "Controlar no és calma: és por amb uniforme.",
    microAction: "Tria 1 cosa imperfecta avui i NO la corregeixis.",
    cutPhrase: "Controlar no és calma: és por amb uniforme."
  },
  {
    id: "APROVACIÓ",
    label: "APROVACIÓ",
    keywords: ["vist", "no em respon", "què pensarà"],
    risk: "Si has de convèncer, ja has perdut.",
    microAction: "En un xat, respon en 1 frase i punt. Sense justificar.",
    cutPhrase: "Si has de convèncer, ja has perdut."
  },
  {
    id: "FUGIDA",
    label: "FUGIDA",
    keywords: ["demà", "ja ho faré", "em disperso", "no començo"],
    risk: "No et falta temps: et falta inici.",
    microAction: "5 minuts: fes la primera peça ridícula (inici).",
    cutPhrase: "No et falta temps: et falta inici."
  },
  {
    id: "CULPA",
    label: "CULPA",
    keywords: ["culpa", "no valc", "sóc", "fracàs"],
    risk: "La culpa no arregla res: només et manté sotmès.",
    microAction: "Escriu \"em perdono per ___\" + 1 acció reparadora petita.",
    cutPhrase: "La culpa no arregla res: només et manté sotmès."
  },
  {
    id: "DESVALORITZACIÓ",
    label: "DESVALORITZACIÓ",
    keywords: ["no valc", "fracàs"],
    risk: "No ets menys: estàs cansat.",
    microAction: "Fes 1 cosa petita i deixa prova (nota/captura).",
    cutPhrase: "No ets menys: estàs cansat."
  },
  {
    id: "RÀBIA_CONTINGUDA",
    label: "RÀBIA CONTINGUDA",
    keywords: ["ràbia", "m'ho callo", "aguanto"],
    risk: "La ràbia callada es cobra interessos.",
    microAction: "1 límit avui: \"Això no ho faré.\"",
    cutPhrase: "La ràbia callada es cobra interessos."
  },
  {
    id: "POR_CONFLICTE",
    label: "POR AL CONFLICTE",
    keywords: ["conflicte", "no vull problemes"],
    risk: "Evitar el conflicte és comprar pau amb tu.",
    microAction: "Practica 1 \"NO\" net (sense sucre).",
    cutPhrase: "Evitar el conflicte és comprar pau amb tu."
  },
  {
    id: "RUMIACIÓ",
    label: "RUMIACIÓ",
    keywords: ["li dono voltes", "no paro de pensar"],
    risk: "Pensar no és decidir.",
    microAction: "3 minuts: escriu el bucle i tanca amb \"prou\".",
    cutPhrase: "Pensar no és decidir."
  },
  {
    id: "AUTOEXIGÈNCIA",
    label: "AUTOEXIGÈNCIA",
    keywords: ["ha de ser perfecte", "no és prou bo"],
    risk: "Perfecció: la manera fina de no viure.",
    microAction: "Defineix \"prou bé\" abans de començar.",
    cutPhrase: "Perfecció: la manera fina de no viure."
  },
  {
    id: "DEPENDÈNCIA",
    label: "DEPENDÈNCIA",
    keywords: ["necessito", "m'ignora"],
    risk: "Quan necessites, negocies la teva dignitat.",
    microAction: "24h sense buscar resposta/reacció.",
    cutPhrase: "Quan necessites, negocies la teva dignitat."
  },
  {
    id: "ANESTÈSIA",
    label: "ANESTÈSIA",
    keywords: ["m'és igual", "apagat", "no sento"],
    risk: "El que no sents, et dirigeix.",
    microAction: "2 minuts: on ho notes al cos? posa-li nom.",
    cutPhrase: "El que no sents, et dirigeix."
  },
  {
    id: "JA_ES_TARD",
    label: "JA ÉS TARD",
    keywords: ["ja és tard", "massa gran", "no té sentit"],
    risk: "Tard és morir. Avui encara hi ets.",
    microAction: "Acció mínima avui. No planis. Executa.",
    cutPhrase: "Tard és morir. Avui encara hi ets."
  }
];

function detectPattern(answer: string): Pattern {
  const t = normalize(answer);
  if (!t) return {
    id: "SENSE_DADES",
    label: "SENSE DADES",
    keywords: [],
    risk: "Sense dades: no hi ha mirall.",
    microAction: "Escriu 2 línies avui, encara que et faci ràbia.",
    cutPhrase: "Sense text no hi ha diagnòstic."
  };

  // Buscar coincidències amb keywords
  for (const pattern of PATTERNS) {
    if (pattern.keywords.some(keyword => t.includes(normalize(keyword)))) {
      return pattern;
    }
  }

  // Si no hi ha coincidències, retornar SENSE_DADES
  return {
    id: "SENSE_DADES",
    label: "SENSE DADES",
    keywords: [],
    risk: "Sense dades: no hi ha mirall.",
    microAction: "Escriu 2 línies avui, encara que et faci ràbia.",
    cutPhrase: "Sense text no hi ha diagnòstic."
  };
}

// ---------- resposta per nit + patró ----------
type MirrorOut = {
  patternLabel: string;
  mirror: string;
  micro24h: string;
  questionPro: string;
};

function trimQuote(text: string, maxLen = 120): string {
  const normalized = normalizeApostrophes(text.trim());
  if (!normalized) return "";
  
  if (normalized.length <= maxLen) {
    return normalized.endsWith('.') ? normalized : normalized + "…";
  }
  
  return normalized.slice(0, maxLen - 1) + "…";
}

function buildMirror(night: Night, answerRaw: string): MirrorOut {
  const answer = sanitizeForExport(answerRaw);
  const p = detectPattern(answer);
  
  // Usar directament les dades del patró detectat
  const quote = trimQuote(answer);
  
  // Construir el mirall amb les dades del patró
  const mirror = answer ?
    `"${quote}" — ${p.risk}` :
    "Si no escrius res, el teu cervell decideix per tu. I normalment decideix evitar.";

  const micro24h = p.microAction;
  
  // Preguntes PRO per nit
  const proQByNight: Record<NightId, string[]> = {
    n1: ["Quina part de tu continua fent-se l'innocent… i què hi guanya?", "Què estàs protegint quan dius 'ja ho faré'?"],
    n2: ["Què et costa cada setmana mantenir aquest paper en peu?", "Qui series si avui no haguessis de semblar res?"],
    n3: ["Quin és el primer segon on s'encén el loop?", "Quina recompensa secreta té repetir-ho?"],
    n4: ["Quin límit no has posat per por del conflicte?", "De què et protegeix aquesta ferida… exactament?"],
    n5: ["Quin és el 'mínim digne' d'avui, sense negociar?", "Què perdries si ho fessis bé… i ningú ho veiés?"],
  };

  const seed = `${night.id}::${p.id}::${answer}`;
  const questionPro = pick(seed + "::proq", proQByNight[night.id]);

  return {
    patternLabel: p.label,
    mirror,
    micro24h,
    questionPro
  };
}

// ---------- exports ----------
function buildReportTxt(answers: Record<NightId, string>) {
  const lines: string[] = [];
  lines.push("TREMOLOR · NIVELL A (5 NITS)");
  lines.push("");
  lines.push("Cinc nits. Cinc miralls. No està \"bé\" ni \"malament\". Està escrit. I això ja és un canvi.");
  lines.push("");

  for (const night of NIGHTS) {
    const a = sanitizeForExport(answers[night.id] || "");
    const p = detectPattern(a);
    const quote = trimQuote(a);

    lines.push(`${night.label} — ${p.label}`);
    lines.push(night.question);
    lines.push("");
    if (quote) {
      lines.push(`"${quote}"`);
    } else {
      lines.push("(Sense text)");
    }
    lines.push("");
    lines.push(`Risc: ${p.risk}`);
    lines.push(`Microacció 24h: ${p.microAction}`);
    lines.push(`Tall: ${p.cutPhrase}`);
    lines.push("");
    lines.push("------------------------------------------------------------");
    lines.push("");
  }

  lines.push("El tremolor continua.");
  lines.push("");
  lines.push("— EdmondSystems · Tremolor");
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

  let html = `<!doctype html><html><head><meta charset="utf-8"/><title>Tremolor · Informe Nivell A</title></head>
  <body style="font-family: Arial, sans-serif; line-height:1.5;">
  <h1 style="margin:0 0 8px 0;">Tremolor · Nivell A (5 nits)</h1>
  <div style="opacity:.75;margin-bottom:18px;">Cinc nits. Cinc miralls. No està "bé" ni "malament". Està escrit. I això ja és un canvi.</div>`;

  for (const night of NIGHTS) {
    const a = sanitizeForExport(answers[night.id] || "");
    const p = detectPattern(a);
    const quote = trimQuote(a);
    
    html += `
      <h2 style="margin:18px 0 6px 0;">${esc(night.label)} — ${esc(p.label)}</h2>
      <div style="margin-bottom:10px;"><b>${esc(night.question)}</b></div>
      <div style="margin-bottom:8px;opacity:.8;">
        ${quote ? `"${esc(quote)}"` : "(Sense text)"}
      </div>
      <div style="margin-bottom:8px;"><b>Risc:</b> ${esc(p.risk)}</div>
      <div style="margin-bottom:8px;"><b>Microacció 24h:</b> ${esc(p.microAction)}</div>
      <div style="margin-bottom:18px;"><b>Tall:</b> ${esc(p.cutPhrase)}</div>
      <hr style="border:none;border-top:1px solid #ddd;margin:18px 0;"/>
    `;
  }

  html += `<p style="text-align:center;margin-top:30px;">El tremolor continua.<br/><small>— EdmondSystems · Tremolor</small></p></body></html>`;
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
                const p = detectPattern(a);
                const quote = trimQuote(a);
                return (
                  <div key={night.id} className="border border-white/10 rounded-2xl p-6 bg-black/25">
                    <div className="text-white/50 text-sm tracking-wider">{night.label} — {p.label}</div>
                    <div className="text-white font-semibold text-xl mt-2">{night.question}</div>

                    <div className="mt-4 text-white/50 text-sm">El que has escrit</div>
                    <div className="mt-2 rounded-xl border border-white/10 bg-black/30 p-4 text-white/90">
                      {quote ? `"${quote}"` : "(Sense text)"}
                    </div>

                    <div className="mt-5 text-white/50 text-sm">Anàlisi determinista</div>
                    <div className="mt-2 rounded-xl border border-purple-400/20 bg-purple-500/10 p-4 space-y-3">
                      <div className="text-red-300">
                        <b>Risc:</b> {p.risk}
                      </div>
                      <div className="text-amber-300">
                        <b>Microacció 24h:</b> {p.microAction}
                      </div>
                      <div className="text-white/60 italic">
                        &ldquo;{p.cutPhrase}&rdquo;
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
