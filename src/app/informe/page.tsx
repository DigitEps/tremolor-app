"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────────────────────────
// TIPUS PER NIVELL A (5 NITS)
// ─────────────────────────────────────────────────────────────

type NightEntry = {
  nightNumber: number;
  quote: string;
  label: string;
  risk: string;
  microAction24h: string;
  cutPhrase: string;
};

type CorePattern = {
  name: string;
  protection: string;
  price: string;
  decision24h: string;
  ifDoNothing: string;
  closing: string;
};

// ─────────────────────────────────────────────────────────────
// UTILITATS
// ─────────────────────────────────────────────────────────────

function normalizeApostrophes(text: string): string {
  return text.replace(/[''ʼ`´]/g, "'");
}

function trimQuote(text: string, maxLen = 120): string {
  const normalized = normalizeApostrophes(text.trim());
  if (!normalized) return "";
  
  if (normalized.length <= maxLen) {
    // Si no acaba en punt, afegir "…"
    return normalized.endsWith('.') ? normalized : normalized + "…";
  }
  
  // Tallar i afegir "…"
  return normalized.slice(0, maxLen - 1) + "…";
}

// ─────────────────────────────────────────────────────────────
// PATRONS I DETECCIÓ
// ─────────────────────────────────────────────────────────────

const PATTERNS = {
  CONTROL: {
    keywords: ["control", "perfecte", "ha de sortir", "si no ho faig jo"],
    label: "CONTROL",
    risk: "Controlar no és calma: és por amb uniforme.",
    microAction: "Tria 1 cosa imperfecta avui i NO la corregeixis.",
    cutPhrase: "Controlar no és calma: és por amb uniforme.",
    protection: "Et protegeix del caos i de sentir-te vulnerable.",
    price: "Exhauriment constant i relacions rígides.",
    decision24h: "Delega 1 tasca sense supervisar-la.",
    ifDoNothing: "Seguiràs cremant-te per mantenir una il·lusió d'ordre.",
    closing: "El control és una presó que tu mateix construeixes."
  },
  APROVACIÓ: {
    keywords: ["vist", "no em respon", "què pensarà"],
    label: "APROVACIÓ",
    risk: "Si has de convèncer, ja has perdut.",
    microAction: "En un xat, respon en 1 frase i punt. Sense justificar.",
    cutPhrase: "Si has de convèncer, ja has perdut.",
    protection: "Et protegeix del rebuig i de sentir-te sol.",
    price: "Perds la teva veu i autenticitat.",
    decision24h: "Diu 'no' a alguna cosa sense explicar per què.",
    ifDoNothing: "Seguiràs vivint la vida que altres esperen de tu.",
    closing: "La teva aprovació més important és la teva."
  },
  FUGIDA: {
    keywords: ["demà", "ja ho faré", "em disperso", "no començo"],
    label: "FUGIDA",
    risk: "No et falta temps: et falta inici.",
    microAction: "5 minuts: fes la primera peça ridícula (inici).",
    cutPhrase: "No et falta temps: et falta inici.",
    protection: "Et protegeix del fracàs i de la responsabilitat.",
    price: "Els teus somnis es converteixen en remordiments.",
    decision24h: "Comença 1 cosa que portes posposant. Només 10 minuts.",
    ifDoNothing: "Els anys passaran i seguiràs dient 'demà'.",
    closing: "El millor moment per començar era ahir. El segon millor és ara."
  },
  CULPA: {
    keywords: ["culpa", "no valc", "sóc", "fracàs"],
    label: "CULPA",
    risk: "La culpa no arregla res: només et manté sotmès.",
    microAction: "Escriu \"em perdono per ___\" + 1 acció reparadora petita.",
    cutPhrase: "La culpa no arregla res: només et manté sotmès.",
    protection: "Et protegeix de sentir-te responsable del canvi.",
    price: "Vius en un bucle de càstig sense sortida.",
    decision24h: "Fes 1 acció reparadora petita sense dramatisme.",
    ifDoNothing: "La culpa et consumirà més que l'error original.",
    closing: "La culpa és un luxe que no et pots permetre."
  },
  DESVALORITZACIÓ: {
    keywords: ["no valc", "fracàs"],
    label: "DESVALORITZACIÓ",
    risk: "No ets menys: estàs cansat.",
    microAction: "Fes 1 cosa petita i deixa prova (nota/captura).",
    cutPhrase: "No ets menys: estàs cansat.",
    protection: "Et protegeix de les expectatives i de la decepció.",
    price: "Infravalores les teves capacitats reals.",
    decision24h: "Reconeix 1 cosa que fas bé, sense minimitzar-la.",
    ifDoNothing: "Seguiràs sabotejant les teves oportunitats.",
    closing: "El teu valor no depèn del teu rendiment."
  },
  RÀBIA_CONTINGUDA: {
    keywords: ["ràbia", "m'ho callo", "aguanto"],
    label: "RÀBIA CONTINGUDA",
    risk: "La ràbia callada es cobra interessos.",
    microAction: "1 límit avui: \"Això no ho faré.\"",
    cutPhrase: "La ràbia callada es cobra interessos.",
    protection: "Et protegeix del conflicte i de ser vist com agressiu.",
    price: "Acumules ressentiment i explotes en moments inadequats.",
    decision24h: "Expressa 1 límit clar sense agressivitat.",
    ifDoNothing: "La ràbia sortirà de manera destructiva.",
    closing: "La ràbia és informació. Escolta-la."
  },
  POR_CONFLICTE: {
    keywords: ["conflicte", "no vull problemes"],
    label: "POR AL CONFLICTE",
    risk: "Evitar el conflicte és comprar pau amb tu.",
    microAction: "Practica 1 \"NO\" net (sense sucre).",
    cutPhrase: "Evitar el conflicte és comprar pau amb tu.",
    protection: "Et protegeix de la tensió i de perdre relacions.",
    price: "Sacrifiques les teves necessitats per mantenir la pau.",
    decision24h: "Aborda 1 conversa incòmoda que estàs evitant.",
    ifDoNothing: "Els problemes creixeran fins ser inmanejables.",
    closing: "El conflicte saludable enforteix les relacions."
  },
  RUMIACIÓ: {
    keywords: ["li dono voltes", "no paro de pensar"],
    label: "RUMIACIÓ",
    risk: "Pensar no és decidir.",
    microAction: "3 minuts: escriu el bucle i tanca amb \"prou\".",
    cutPhrase: "Pensar no és decidir.",
    protection: "Et protegeix de prendre decisions i assumir riscos.",
    price: "Gastes energia mental sense avançar.",
    decision24h: "Pren 1 decisió petita sense més anàlisi.",
    ifDoNothing: "Seguiràs donant voltes als mateixos pensaments.",
    closing: "L'acció imperfecta és millor que la inacció perfecta."
  },
  AUTOEXIGÈNCIA: {
    keywords: ["ha de ser perfecte", "no és prou bo"],
    label: "AUTOEXIGÈNCIA",
    risk: "Perfecció: la manera fina de no viure.",
    microAction: "Defineix \"prou bé\" abans de començar.",
    cutPhrase: "Perfecció: la manera fina de no viure.",
    protection: "Et protegeix de la crítica i del fracàs visible.",
    price: "Paralitzis i exhauriment per estàndards impossibles.",
    decision24h: "Fes alguna cosa \"prou bé\" i deixa-ho estar.",
    ifDoNothing: "Seguiràs posposant per por a la imperfecció.",
    closing: "Fet és millor que perfecte."
  },
  DEPENDÈNCIA: {
    keywords: ["necessito", "m'ignora"],
    label: "DEPENDÈNCIA",
    risk: "Quan necessites, negocies la teva dignitat.",
    microAction: "24h sense buscar resposta/reacció.",
    cutPhrase: "Quan necessites, negocies la teva dignitat.",
    protection: "Et protegeix de la solitud i de l'autonomia.",
    price: "Perds la teva independència emocional.",
    decision24h: "Fes 1 cosa per tu sense buscar validació externa.",
    ifDoNothing: "Seguiràs depenent de l'humor dels altres.",
    closing: "La teva estabilitat no pot dependre d'altri."
  },
  ANESTÈSIA: {
    keywords: ["m'és igual", "apagat", "no sento"],
    label: "ANESTÈSIA",
    risk: "El que no sents, et dirigeix.",
    microAction: "2 minuts: on ho notes al cos? posa-li nom.",
    cutPhrase: "El que no sents, et dirigeix.",
    protection: "Et protegeix del dolor i de la intensitat emocional.",
    price: "Perds la capacitat de gaudir i de connectar.",
    decision24h: "Identifica 1 emoció que estàs evitant.",
    ifDoNothing: "Seguiràs vivint en pilot automàtic.",
    closing: "Sentir és viure. Tot la resta és supervivència."
  },
  JA_ES_TARD: {
    keywords: ["ja és tard", "massa gran", "no té sentit"],
    label: "JA ÉS TARD",
    risk: "Tard és morir. Avui encara hi ets.",
    microAction: "Acció mínima avui. No planis. Executa.",
    cutPhrase: "Tard és morir. Avui encara hi ets.",
    protection: "Et protegeix de la decepció i de l'esforç.",
    price: "Renúncies als teus somnis per por al temps perdut.",
    decision24h: "Fes 1 pas cap a alguna cosa que creus que \"ja és tard\".",
    ifDoNothing: "El temps passarà igualment, però sense progrés.",
    closing: "Mentre respires, tens opcions."
  }
};

function detectPattern(text: string): string {
  const normalizedText = text.toLowerCase();
  
  for (const [patternName, pattern] of Object.entries(PATTERNS)) {
    if (pattern.keywords.some(keyword => normalizedText.includes(keyword))) {
      return patternName;
    }
  }
  
  return "SENSE_DADES";
}

// ─────────────────────────────────────────────────────────────
// LECTURA DE DADES V2 NIVELL A
// ─────────────────────────────────────────────────────────────

function loadNightAnswers(): Record<string, string> {
  try {
    const raw = localStorage.getItem("tremolor.v2.a.answers");
    if (!raw) return {};
    
    let data = JSON.parse(raw);
    
    // Acceptar wrappers
    if (data.answers) data = data.answers;
    if (data.data) data = data.data;
    
    // Assegurar que és un objecte
    if (typeof data !== 'object' || Array.isArray(data)) return {};
    
    // Normalitzar apòstrofs
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        normalized[key] = normalizeApostrophes(value);
      }
    }
    
    return normalized;
  } catch {
    return {};
  }
}

// ─────────────────────────────────────────────────────────────
// MOTOR D'INFORME DETERMINISTA
// ─────────────────────────────────────────────────────────────

function buildNightEntries(answers: Record<string, string>): NightEntry[] {
  const entries: NightEntry[] = [];
  
  for (let i = 1; i <= 5; i++) {
    const key = `n${i}`;
    const rawText = answers[key] || "";
    
    if (!rawText.trim()) {
      // Nit buida
      entries.push({
        nightNumber: i,
        quote: "",
        label: "SENSE DADES",
        risk: "Sense dades: no hi ha mirall.",
        microAction24h: "Escriu 2 línies avui, encara que et faci ràbia.",
        cutPhrase: "Sense text no hi ha diagnòstic."
      });
    } else {
      // Nit amb contingut
      const quote = trimQuote(rawText);
      const detectedPattern = detectPattern(rawText);
      const pattern = PATTERNS[detectedPattern as keyof typeof PATTERNS];
      
      if (pattern) {
        entries.push({
          nightNumber: i,
          quote,
          label: pattern.label,
          risk: pattern.risk,
          microAction24h: pattern.microAction,
          cutPhrase: pattern.cutPhrase
        });
      } else {
        entries.push({
          nightNumber: i,
          quote,
          label: "SENSE DADES",
          risk: "Sense dades: no hi ha mirall.",
          microAction24h: "Escriu 2 línies avui, encara que et faci ràbia.",
          cutPhrase: "Sense text no hi ha diagnòstic."
        });
      }
    }
  }
  
  return entries;
}

function findCorePattern(entries: NightEntry[]): CorePattern {
  // Comptar patrons (excloent SENSE_DADES)
  const patternCounts: Record<string, number> = {};
  
  entries.forEach(entry => {
    if (entry.label !== "SENSE DADES") {
      patternCounts[entry.label] = (patternCounts[entry.label] || 0) + 1;
    }
  });
  
  // Trobar el més repetit
  let maxCount = 0;
  let corePatternName = "";
  
  for (const [pattern, count] of Object.entries(patternCounts)) {
    if (count > maxCount) {
      maxCount = count;
      corePatternName = pattern;
    }
  }
  
  // Si empat, mana Nit 5
  if (maxCount > 0) {
    const tiedPatterns = Object.entries(patternCounts)
      .filter(([_, count]) => count === maxCount)
      .map(([pattern, _]) => pattern);
    
    if (tiedPatterns.length > 1) {
      const night5Pattern = entries[4]?.label;
      if (night5Pattern && night5Pattern !== "SENSE DADES" && tiedPatterns.includes(night5Pattern)) {
        corePatternName = night5Pattern;
      }
    }
  }
  
  // Buscar el patró en la definició
  const patternKey = Object.keys(PATTERNS).find(key => 
    PATTERNS[key as keyof typeof PATTERNS].label === corePatternName
  );
  
  if (patternKey) {
    const pattern = PATTERNS[patternKey as keyof typeof PATTERNS];
    return {
      name: pattern.label,
      protection: pattern.protection,
      price: pattern.price,
      decision24h: pattern.decision24h,
      ifDoNothing: pattern.ifDoNothing,
      closing: pattern.closing
    };
  }
  
  // Fallback si no hi ha patró clar
  return {
    name: "SENSE PATRÓ CLAR",
    protection: "Et protegeixes de maneres que encara no hem identificat.",
    price: "El preu és viure sense direcció clara.",
    decision24h: "Escriu 5 línies sobre el que realment vols.",
    ifDoNothing: "Seguiràs en el mateix lloc, preguntant-te què passa.",
    closing: "Fins i tot la confusió és informació."
  };
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

function buildReportText(entries: NightEntry[], corePattern: CorePattern): string {
  const lines: string[] = [];
  
  lines.push("╔══════════════════════════════════════════════════════════════════╗");
  lines.push("║                                                                  ║");
  lines.push("║                    INFORME NIVELL A                              ║");
  lines.push("║                    5 nits · 5 miralls                           ║");
  lines.push("║                                                                  ║");
  lines.push("╚══════════════════════════════════════════════════════════════════╝");
  lines.push("");
  lines.push("══════════════════════════════════════════════════════════════════════");
  lines.push("");
  
  // Nits individuals
  entries.forEach(entry => {
    lines.push(`NIT ${entry.nightNumber} — ${entry.label}`);
    lines.push("──────────────────────────────────────────────────────────────────────");
    if (entry.quote) {
      lines.push(`"${entry.quote}"`);
    } else {
      lines.push("(Sense text)");
    }
    lines.push("");
    lines.push(`Risc: ${entry.risk}`);
    lines.push(`Microacció 24h: ${entry.microAction24h}`);
    lines.push(`Tall: ${entry.cutPhrase}`);
    lines.push("");
    lines.push("══════════════════════════════════════════════════════════════════════");
    lines.push("");
  });
  
  // Síntesi
  lines.push("SÍNTESI — PATRÓ CENTRAL");
  lines.push("──────────────────────────────────────────────────────────────────────");
  lines.push("");
  lines.push(`Patró dominant: ${corePattern.name}`);
  lines.push("");
  lines.push(`Què protegeix: ${corePattern.protection}`);
  lines.push(`Què costa: ${corePattern.price}`);
  lines.push(`Decisió 24h: ${corePattern.decision24h}`);
  lines.push(`Si no fas res: ${corePattern.ifDoNothing}`);
  lines.push("");
  lines.push(`${corePattern.closing}`);
  lines.push("");
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
// COMPONENT PRINCIPAL
// ─────────────────────────────────────────────────────────────

export default function InformePage() {
  const router = useRouter();
  const [nightAnswers, setNightAnswers] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setNightAnswers(loadNightAnswers());
  }, []);

  const nightEntries = useMemo(() => buildNightEntries(nightAnswers), [nightAnswers]);
  const corePattern = useMemo(() => findCorePattern(nightEntries), [nightEntries]);
  const reportText = useMemo(() => buildReportText(nightEntries, corePattern), [nightEntries, corePattern]);

  const completedNights = Object.keys(nightAnswers).filter(key => 
    key.match(/^n[1-5]$/) && nightAnswers[key]?.trim()
  ).length;
  
  const isEmpty = completedNights === 0;
  const isComplete = completedNights === 5;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = reportText;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  };

  // ─────────────────────────────────────────────────────────────
  // PANTALLA BUIDA O INCOMPLETA
  // ─────────────────────────────────────────────────────────────
  if (isEmpty || !isComplete) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-white">
        <header className="border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-20">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight">Informe Nivell A</h1>
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
                  5 nits. 5 respostes. Cap màscara.
                </p>
                <button
                  onClick={() => router.push("/v2")}
                  className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition text-lg"
                >
                  Començar Nivell A →
                </button>
              </>
            ) : (
              <>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Informe incomplet
                </h2>
                <p className="text-white/60 text-base md:text-lg">
                  Has completat <strong className="text-white">{completedNights}/5</strong> nits.
                </p>
                <button
                  onClick={() => router.push("/v2")}
                  className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition text-lg"
                >
                  Continuar ({completedNights}/5) →
                </button>
              </>
            )}
          </section>
        </div>
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // INFORME COMPLET (5/5)
  // ─────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-white">
      <header className="border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">Informe Nivell A</h1>
          <button onClick={() => router.push("/")} className="text-sm text-white/40 hover:text-white transition">
            ← Inici
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">
        {/* Hero */}
        <section className="text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">5 nits, 5 miralls</h2>
          <p className="text-lg text-white/50 max-w-xl mx-auto">
            Això no és un test de personalitat. És un mirall.<br />
            I els miralls no et volen fer sentir bé.<br />
            <span className="text-white/80 font-medium">Et volen fer responsable.</span>
          </p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold">5/5</div>
            <div className="text-sm text-white/40 mt-1">Nits</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-2xl font-bold">{corePattern.name}</div>
            <div className="text-sm text-white/40 mt-1">Patró central</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold">A</div>
            <div className="text-sm text-white/40 mt-1">Nivell</div>
          </div>
        </section>

        {/* Nits individuals */}
        <section className="space-y-6">
          <h3 className="text-2xl font-bold">Les teves 5 nits</h3>
          <div className="space-y-4">
            {nightEntries.map((entry, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-2 text-sm text-white/40 mb-2">
                  <span className="text-lg">🌙</span>
                  <span>Nit {entry.nightNumber} — {entry.label}</span>
                </div>
                {entry.quote ? (
                  <div className="text-white text-xl font-medium mb-4">&ldquo;{entry.quote}&rdquo;</div>
                ) : (
                  <div className="text-white/40 text-xl italic mb-4">(Sense text)</div>
                )}
                <div className="space-y-2 text-sm">
                  <div className="text-red-300">
                    <strong>Risc:</strong> {entry.risk}
                  </div>
                  <div className="text-amber-300">
                    <strong>Microacció 24h:</strong> {entry.microAction24h}
                  </div>
                  <div className="text-white/60 italic">
                    &ldquo;{entry.cutPhrase}&rdquo;
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Síntesi */}
        <section className="bg-gradient-to-br from-purple-950/30 to-black border border-purple-500/20 rounded-2xl p-8 space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-purple-200">Síntesi — Patró Central</h3>
            <p className="text-purple-300/60 text-lg mt-2">{corePattern.name}</p>
          </div>
          
          <div className="grid gap-4">
            <div className="bg-black/30 rounded-lg p-4">
              <div className="text-purple-300 font-medium mb-1">Què protegeix:</div>
              <div className="text-white/80">{corePattern.protection}</div>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <div className="text-purple-300 font-medium mb-1">Què costa:</div>
              <div className="text-white/80">{corePattern.price}</div>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <div className="text-purple-300 font-medium mb-1">Decisió 24h:</div>
              <div className="text-white/80">{corePattern.decision24h}</div>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <div className="text-purple-300 font-medium mb-1">Si no fas res:</div>
              <div className="text-white/80">{corePattern.ifDoNothing}</div>
            </div>
          </div>
          
          <div className="text-center pt-4 border-t border-purple-500/20">
            <p className="text-purple-200/80 italic text-lg">{corePattern.closing}</p>
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
              onClick={() => downloadText("informe-nivell-a.txt", reportText)}
              className="px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition"
            >
              Descarregar informe
            </button>
            <button
              onClick={onCopy}
              className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 transition"
            >
              {copied ? "Copiat ✓" : "Copiar"}
            </button>
          </div>
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
