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
    "autolesió",
    "fer-me mal",
    "ferme mal",
  ];
  if (high.some((k) => t.includes(normalize(k)))) return "high";

  const soft = ["odio", "rabia", "ràbia", "exploto", "cremar-ho tot", "destrossar", "agredir"];
  if (soft.some((k) => t.includes(normalize(k)))) return "soft";

  return "none";
}

// ---------- patrons (Nivell A, sense IA) - Sistema de 12 patrons ----------
//
// Regla #1 Edmond: El que funciona (landing + preguntes) NO es toca.
// Aquest bloc només millora el diagnòstic i l'informe final.
//
// Objectiu: menys falsos positius, més personalització i més utilitat en 30 segons.

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
  | "SENSE_DADES"
  | "SENSE_PATRÓ_CLAR";

type WeightedKeyword = { word: string; weight: number }; // 1..10

type Pattern = {
  id: PatternId;
  label: string;

  // Paraules/frases amb pes: frases específiques puntuen més que paraules genèriques
  keywords: WeightedKeyword[];

  // Textos de retorn (viscerals però útils)
  risk: string;
  microAction: string;
  cutPhrase: string;

  // Valor extra (opcional) per enriquir el report sense trencar res
  protection?: string;
  price?: string;
  consequence?: string;
};

const SCORE_THRESHOLD = 5;

// Nota: els pesos estan pensats perquè una frase clara dispari el patró,
// i paraules "genèriques" necessitin context (sumar més d’una).
const PATTERNS: Pattern[] = [
  {
    id: "CONTROL",
    label: "CONTROL",
    keywords: [
      { word: "si no ho faig jo", weight: 10 },
      { word: "ho he de controlar", weight: 8 },
      { word: "ho vull controlar tot", weight: 9 },
      { word: "ha de sortir", weight: 6 },
      { word: "ho reviso mil cops", weight: 7 },
      { word: "no em fio", weight: 6 },
      { word: "ordre", weight: 3 },
      { word: "control", weight: 4 },
      { word: "controlat", weight: 4 },
    ],
    protection: "Evitar la incertesa i sentir que no et poden fallar.",
    price: "Esgotament + irritació + relació tensa amb tothom (i amb tu).",
    consequence: "Acabes vivint com a vigilant del teu propi cap.",
    risk: "El teu cos portarà el compte que el cap no vol fer.",
    microAction: "Tria 1 cosa imperfecta avui i NO la corregeixis. Deixa-la respirar 24h.",
    cutPhrase: "Controlar no és calma: és por amb uniforme.",
  },
  {
    id: "AUTOEXIGÈNCIA",
    label: "AUTOEXIGÈNCIA",
    keywords: [
      { word: "ha de ser perfecte", weight: 9 },
      { word: "no es prou bo", weight: 7 },
      { word: "no és prou bo", weight: 7 },
      { word: "fins que quedi perfecte", weight: 9 },
      { word: "refinar", weight: 4 },
      { word: "millorar", weight: 4 },
      { word: "perfeccio", weight: 6 },
      { word: "perfecció", weight: 6 },
      { word: "perfecte", weight: 3 },
    ],
    protection: "Evitar el judici: si és perfecte, ningú et pot tocar.",
    price: "Paràlisi disfressada d’excel·lència.",
    consequence: "No falles: simplement no comences (i això també és perdre).",
    risk: "L’excel·lència s’ha convertit en excusa per no exposar-te.",
    microAction: "Defineix 'prou bé' EN UNA FRASE i executa 10 minuts. Sense retocar.",
    cutPhrase: "Perfecció: la manera fina de no viure.",
  },
  {
    id: "FUGIDA",
    label: "FUGIDA",
    keywords: [
      { word: "demà", weight: 3 },
      { word: "ja ho fare", weight: 6 },
      { word: "ja ho faré", weight: 6 },
      { word: "no començo", weight: 8 },
      { word: "em disperso", weight: 6 },
      { word: "salto d'un projecte", weight: 8 },
      { word: "salto d’un projecte", weight: 8 },
      { word: "inacabats", weight: 6 },
      { word: "em distrec", weight: 5 },
      { word: "procrastino", weight: 8 },
      { word: "procrastinacio", weight: 6 },
      { word: "procrastinació", weight: 6 },
    ],
    protection: "Evitar el compromís real (on hi ha risc i resultat).",
    price: "Vida en mode preàmbul: molta preparació, poca vida.",
    consequence: "Cada 'demà' t’acaba robant un any.",
    risk: "Cada 'demà' és un dia que et robes a tu mateix.",
    microAction: "5 minuts: fes la primera peça ridícula (inici). Sense pensar-hi.",
    cutPhrase: "No et falta temps: et falta inici.",
  },
  {
    id: "DESVALORITZACIÓ",
    label: "DESVALORITZACIÓ",
    keywords: [
      { word: "no em valoren", weight: 9 },
      { word: "no se'm valora", weight: 9 },
      { word: "no se’m valora", weight: 9 },
      { word: "menyspreu", weight: 8 },
      { word: "menysprear", weight: 7 },
      { word: "em tracta com", weight: 6 },
      { word: "no valc", weight: 7 },
      { word: "soc un fracas", weight: 6 },
      { word: "sóc un fracàs", weight: 6 },
      { word: "fracàs", weight: 4 },
    ],
    protection: "Evitar demanar el que mereixes (per por a un 'no').",
    price: "Acceptes menys del que vols i t’hi acostumes.",
    consequence: "El teu límit es torna invisible fins i tot per tu.",
    risk: "Acceptes menys del que mereixes per costum.",
    microAction: "Fes 1 cosa petita i deixa prova (nota/captura). No ho negociïs amb ningú.",
    cutPhrase: "No ets menys: estàs cansat.",
  },
  {
    id: "APROVACIÓ",
    label: "APROVACIÓ",
    keywords: [
      { word: "que pensaran", weight: 6 },
      { word: "què pensaran", weight: 6 },
      { word: "què diran", weight: 7 },
      { word: "reconeixement", weight: 6 },
      { word: "agradar", weight: 5 },
      { word: "quedar be", weight: 5 },
      { word: "quedar bé", weight: 5 },
      { word: "no em respon", weight: 6 },
      { word: "no em contesten", weight: 6 },
      { word: "vist", weight: 2 },
    ],
    protection: "Sentir-te segur a través de l’aplaudiment.",
    price: "Te’n vas a viure a casa dels altres (cap a dins).",
    consequence: "Quan no hi ha 'like', et quedes buit.",
    risk: "Perds la teva veu buscant permís.",
    microAction: "En un xat, respon en 1 frase i punt. Sense justificar-te.",
    cutPhrase: "Si has de convèncer, ja has perdut.",
  },
  {
    id: "POR_CONFLICTE",
    label: "POR AL CONFLICTE",
    keywords: [
      { word: "no vull problemes", weight: 8 },
      { word: "millor callar", weight: 7 },
      { word: "evito conflicte", weight: 8 },
      { word: "por al conflicte", weight: 9 },
      { word: "por del conflicte", weight: 9 },
      { word: "em fa por dir", weight: 6 },
      { word: "conflicte", weight: 4 },
    ],
    protection: "Evitar el xoc i el rebuig.",
    price: "Pau falsa comprada amb tu mateix.",
    consequence: "Un dia explotes… i ningú entén per què.",
    risk: "Sacrifiques necessitats per una pau de cartró.",
    microAction: "Practica 1 'NO' net avui (sense sucre).",
    cutPhrase: "Evitar el conflicte és comprar pau amb tu.",
  },
  {
    id: "RUMIACIÓ",
    label: "RUMIACIÓ",
    keywords: [
      { word: "li dono voltes", weight: 8 },
      { word: "no paro de pensar", weight: 8 },
      { word: "el cap fa soroll", weight: 9 },
      { word: "rumio", weight: 7 },
      { word: "rumiacio", weight: 6 },
      { word: "rumiació", weight: 6 },
      { word: "sempre pensant", weight: 6 },
    ],
    protection: "Intentar controlar el futur amb el pensament.",
    price: "Energia mental cremada sense avançar.",
    consequence: "Cansament + decisions pitjors.",
    risk: "Penses per no sentir. I et quedes igual.",
    microAction: "3 minuts: escriu el bucle i tanca amb 'prou'. Després aixeca’t.",
    cutPhrase: "Pensar no és decidir.",
  },
  {
    id: "CULPA",
    label: "CULPA",
    keywords: [
      { word: "per culpa meva", weight: 10 },
      { word: "m'ho mereixo", weight: 8 },
      { word: "m’ho mereixo", weight: 8 },
      { word: "hauria de", weight: 4 },
      { word: "sóc un fracàs", weight: 6 },
      { word: "soc un fracas", weight: 6 },
      { word: "culpa", weight: 5 },
      { word: "em sento culpable", weight: 8 },
    ],
    protection: "Creure que castigant-te arregles el passat.",
    price: "Vius en un bucle de càstig inútil.",
    consequence: "Et tornes obedient: a la culpa i als altres.",
    risk: "La culpa et dona la sensació de control. És mentida.",
    microAction: "Escriu: 'Em perdono per ___' + 1 acció reparadora petita (real).",
    cutPhrase: "La culpa no arregla res: només et manté sotmès.",
  },
  {
    id: "RÀBIA_CONTINGUDA",
    label: "RÀBIA CONTINGUDA",
    keywords: [
      { word: "m'ho callo", weight: 9 },
      { word: "m’ho callo", weight: 9 },
      { word: "aguanto", weight: 6 },
      { word: "em bull", weight: 7 },
      { word: "estic fart", weight: 6 },
      { word: "estoy harto", weight: 6 },
      { word: "rabia", weight: 4 },
      { word: "ràbia", weight: 4 },
      { word: "exploto", weight: 7 },
    ],
    protection: "Evitar dir el que penses per no perdre relació/imatge.",
    price: "Ressentiment + somatització.",
    consequence: "Un dia explotes i sembla 'del no-res'.",
    risk: "La ràbia callada es cobra interessos.",
    microAction: "1 límit avui: 'Això no ho faré.' I sostén-lo.",
    cutPhrase: "O poses límit o poses venjança.",
  },
  {
    id: "DEPENDÈNCIA",
    label: "DEPENDÈNCIA",
    keywords: [
      { word: "necessito", weight: 4 },
      { word: "si em deixen", weight: 7 },
      { word: "m'ignora", weight: 7 },
      { word: "m’ignora", weight: 7 },
      { word: "no soc important", weight: 8 },
      { word: "no sóc important", weight: 8 },
      { word: "ningu em veu", weight: 6 },
      { word: "ningú em veu", weight: 6 },
      { word: "em fa falta", weight: 6 },
    ],
    protection: "Sentir que existeixes a través d’algú.",
    price: "Negocies la teva dignitat per una mica d’atenció.",
    consequence: "Qualsevol silenci et destrossa el dia.",
    risk: "Quan necessites algú per existir, ja no estàs estimant: estàs sobrevivint.",
    microAction: "24h sense buscar resposta/reacció. I aguanta el buit.",
    cutPhrase: "Quan necessites, negocies la teva dignitat.",
  },
  {
    id: "ANESTÈSIA",
    label: "ANESTÈSIA",
    keywords: [
      { word: "m'es igual", weight: 7 },
      { word: "m’és igual", weight: 7 },
      { word: "apagat", weight: 6 },
      { word: "no sento", weight: 8 },
      { word: "desconnectat", weight: 7 },
      { word: "buit", weight: 6 },
      { word: "estic buit", weight: 7 },
    ],
    protection: "No sentir per no patir.",
    price: "Tampoc gaudeixes. I el cos ho nota.",
    consequence: "Vius en mode 'pilot automàtic'.",
    risk: "El que no sents… et dirigeix.",
    microAction: "2 minuts: on ho notes al cos? posa-li nom. Sense explicar-ho.",
    cutPhrase: "El que apagues, et governa.",
  },
  {
    id: "JA_ES_TARD",
    label: "JA ÉS TARD",
    keywords: [
      { word: "ja es tard", weight: 9 },
      { word: "ja és tard", weight: 9 },
      { word: "massa gran", weight: 8 },
      { word: "massa vell", weight: 8 },
      { word: "he perdut el tren", weight: 9 },
      { word: "no te sentit", weight: 6 },
      { word: "no té sentit", weight: 6 },
    ],
    protection: "Evitar l’esforç de tornar a començar.",
    price: "Renúncia anticipada.",
    consequence: "Et converteixes en espectador de la teva vida.",
    risk: "La renúncia és una sedació elegant.",
    microAction: "Acció mínima avui. No planis. Executa (5 minuts).",
    cutPhrase: "Tard és morir. Avui encara hi ets.",
  },
];

type ScoredPattern = { pattern: Pattern; score: number; hits: WeightedKeyword[] };

function textForMatching(raw: string) {
  // normalitza i simplifica perquè el matching sigui estable
  const n = normalize(normalizeApostrophes(raw));
  return n.replace(/[^a-z0-9'\s]/g, " ").replace(/\s+/g, " ").trim();
}

function matchKeyword(t: string, kw: WeightedKeyword): boolean {
  const w = textForMatching(kw.word);
  if (!w) return false;

  // Frases -> includes; paraula -> boundary
  if (w.includes(" ")) {
    return t.includes(w);
  }

  // boundary tolerant: espais/puntuació ja estan netejats
  const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  return re.test(t);
}

function scorePatterns(answer: string): ScoredPattern[] {
  const t = textForMatching(answer);
  if (!t) return [];

  const scored: ScoredPattern[] = PATTERNS.map((p) => {
    const hits: WeightedKeyword[] = [];
    let score = 0;
    for (const kw of p.keywords) {
      if (matchKeyword(t, kw)) {
        hits.push(kw);
        score += kw.weight;
      }
    }
    return { pattern: p, score, hits };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

function detectPattern(answer: string): Pattern {
  const a = sanitizeForExport(answer);
  const t = textForMatching(a);

  if (!t) {
    return {
      id: "SENSE_DADES",
      label: "SENSE DADES",
      keywords: [],
      risk: "Sense dades: no hi ha mirall.",
      microAction: "Escriu 2 línies avui, encara que et faci ràbia.",
      cutPhrase: "Sense text no hi ha diagnòstic.",
    };
  }

  const scored = scorePatterns(t);
  const best = scored[0];

  // si no arriba al llindar, no inventem
  if (!best || best.score < SCORE_THRESHOLD) {
    return {
      id: "SENSE_PATRÓ_CLAR",
      label: "SENSE PATRÓ CLAR",
      keywords: [],
      risk: "El patró no és evident amb aquestes paraules. I és millor això que mentir-te.",
      microAction: "Afegeix 3 línies concretes: què passa + què sents + què fas (sempre igual).",
      cutPhrase: "Fins i tot la confusió és informació.",
    };
  }

  return best.pattern;
}

// ---------- resposta per nit + patró ----------
type MirrorOut = {
  patternLabel: string;
  mirror: string;
  micro24h: string;
  cut: string;
  questionPro: string;
  protection?: string;
  price?: string;
  consequence?: string;

  // debug (no print)
  _score?: number;
  _hits?: string[];
};

function trimQuote(text: string, maxLen = 120): string {
  const normalized = normalizeApostrophes(text.trim());
  if (!normalized) return "";

  if (normalized.length <= maxLen) {
    return normalized.endsWith(".") ? normalized : normalized + "…";
  }

  return normalized.slice(0, maxLen - 1) + "…";
}

function buildMirror(night: Night, answerRaw: string): MirrorOut {
  const answer = sanitizeForExport(answerRaw);
  const p = detectPattern(answer);

  const quote = trimQuote(answer);

  const mirror = answer
    ? `"${quote}" — ${p.risk}`
    : "Si no escrius res, el teu cervell decideix per tu. I normalment decideix evitar.";

  const proQByNight: Record<NightId, string[]> = {
    n1: ["Quina part de tu continua fent-se l'innocent… i què hi guanya?", "Què estàs protegint quan dius 'ja ho faré'?"],
    n2: ["Què et costa cada setmana mantenir aquest paper en peu?", "Qui series si avui no haguessis de semblar res?"],
    n3: ["Quin és el primer segon on s'encén el loop?", "Quina recompensa secreta té repetir-ho?"],
    n4: ["Quin límit no has posat per por del conflicte?", "De què et protegeix aquesta ferida… exactament?"],
    n5: ["Quin és el 'mínim digne' d'avui, sense negociar?", "Què perdries si ho fessis bé… i ningú ho veiés?"],
  };

  const seed = `${night.id}::${p.id}::${answer}`;
  const questionPro = pick(seed + "::proq", proQByNight[night.id]);

  // debug scoring
  const scored = scorePatterns(answer);
  const best = scored[0];
  const _score = best?.score ?? 0;
  const _hits = (best?.hits ?? []).sort((a, b) => b.weight - a.weight).map((h) => `${h.word}(${h.weight})`);

  return {
    patternLabel: p.label,
    mirror,
    micro24h: p.microAction,
    cut: p.cutPhrase,
    questionPro,
    protection: p.protection,
    price: p.price,
    consequence: p.consequence,
    _score,
    _hits,
  };
}

// ---------- síntesi final (patró central) ----------
type Synthesis = {
  patternId: PatternId;
  patternLabel: string;
  protection?: string;
  price?: string;
  decision24h: string;
  consequence?: string;
  isClear: boolean;
};

function computeSynthesis(answers: Record<NightId, string>): Synthesis {
  // per nit: patró + score (per desempatar)
  const perNight = NIGHTS.map((n) => {
    const a = sanitizeForExport((answers[n.id] || "").trim());
    const p = detectPattern(a);
    const scored = scorePatterns(a);
    const best = scored[0];
    return { id: n.id, patternId: p.id, patternLabel: p.label, score: best?.score ?? 0 };
  });

  const valid = perNight.filter((x) => x.patternId !== "SENSE_DADES" && x.patternId !== "SENSE_PATRÓ_CLAR");

  if (valid.length === 0) {
    return {
      patternId: "SENSE_PATRÓ_CLAR",
      patternLabel: "SENSE PATRÓ CLAR",
      decision24h: "Escriu 3 línies concretes avui: què passa + què sents + què fas (sempre igual).",
      consequence: "Si no ho concretes, el patró segueix decidint per tu… en silenci.",
      isClear: false,
    };
  }

  const counts = new Map<PatternId, { count: number; scoreSum: number }>();
  for (const v of valid) {
    const cur = counts.get(v.patternId) || { count: 0, scoreSum: 0 };
    counts.set(v.patternId, { count: cur.count + 1, scoreSum: cur.scoreSum + v.score });
  }

  // guanyador: més repetit; empat -> scoreSum més alt
  let bestId: PatternId = valid[0].patternId;
  let bestCount = -1;
  let bestScore = -1;

  for (const [pid, v] of counts.entries()) {
    if (v.count > bestCount || (v.count === bestCount && v.scoreSum > bestScore)) {
      bestId = pid;
      bestCount = v.count;
      bestScore = v.scoreSum;
    }
  }

  const p = PATTERNS.find((x) => x.id === bestId);

  if (!p) {
    return {
      patternId: "SENSE_PATRÓ_CLAR",
      patternLabel: "SENSE PATRÓ CLAR",
      decision24h: "Afegeix dades (3 línies) i torna a generar l’informe.",
      consequence: "Sense dades, no hi ha mirall.",
      isClear: false,
    };
  }

  return {
    patternId: p.id,
    patternLabel: p.label,
    protection: p.protection,
    price: p.price,
    decision24h: p.microAction,
    consequence: p.consequence,
    isClear: true,
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
    const out = buildMirror(night, a);
    const quote = trimQuote(a);

    lines.push(`${night.label} — ${out.patternLabel}`);
    lines.push(night.question);
    lines.push("");
    lines.push(quote ? `"${quote}"` : "(Sense text)");
    lines.push("");
    lines.push(`Mirall: ${out.mirror}`);
    lines.push(`Microacció 24h: ${out.micro24h}`);
    lines.push(`Tall: ${out.cut}`);
    if (out.protection) lines.push(`Protegeixes: ${out.protection}`);
    if (out.price) lines.push(`Preu: ${out.price}`);
    if (out.consequence) lines.push(`Si no fas res: ${out.consequence}`);
    lines.push(`Pregunta PRO: ${out.questionPro}`);
    lines.push("");
    lines.push("------------------------------------------------------------");
    lines.push("");
  }

  // SÍNTESI FINAL (patró central)
  const synth = computeSynthesis(answers);
  lines.push("SÍNTESI FINAL");
  lines.push("");
  if (synth.isClear) {
    lines.push(`El teu patró central és: ${synth.patternLabel}`);
    if (synth.protection) lines.push(`El que protegeixes: ${synth.protection}`);
    if (synth.price) lines.push(`El preu que pagues: ${synth.price}`);
    lines.push(`Decisió 24h: ${synth.decision24h}`);
    if (synth.consequence) lines.push(`Si no fas res: ${synth.consequence}`);
  } else {
    lines.push("SENSE PATRÓ CLAR");
    lines.push(`Decisió 24h: ${synth.decision24h}`);
    if (synth.consequence) lines.push(`Si no fas res: ${synth.consequence}`);
  }
  lines.push("");
  lines.push("------------------------------------------------------------");
  lines.push("");

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
    const out = buildMirror(night, a);
    const quote = trimQuote(a);

    html += `
      <h2 style="margin:18px 0 6px 0;">${esc(night.label)} — ${esc(out.patternLabel)}</h2>
      <div style="margin-bottom:10px;"><b>${esc(night.question)}</b></div>
      <div style="margin-bottom:8px;opacity:.85;">
        ${quote ? `"${esc(quote)}"` : "(Sense text)"}
      </div>
      <div style="margin-bottom:8px;"><b>Mirall:</b> ${esc(out.mirror)}</div>
      <div style="margin-bottom:8px;"><b>Microacció 24h:</b> ${esc(out.micro24h)}</div>
      <div style="margin-bottom:8px;"><b>Tall:</b> ${esc(out.cut)}</div>
      ${
        out.protection || out.price || out.consequence
          ? `<div style="margin:10px 0 12px 0;padding:10px 12px;border:1px solid #ddd;border-radius:10px;">
              ${out.protection ? `<div><b>Protegeixes:</b> ${esc(out.protection)}</div>` : ""}
              ${out.price ? `<div><b>Preu:</b> ${esc(out.price)}</div>` : ""}
              ${out.consequence ? `<div><b>Si no fas res:</b> ${esc(out.consequence)}</div>` : ""}
            </div>`
          : ""
      }
      <div style="margin-bottom:18px;"><b>Pregunta PRO:</b> ${esc(out.questionPro)}</div>
      <hr style="border:none;border-top:1px solid #ddd;margin:18px 0;"/>
    `;
  }

  // SÍNTESI FINAL (patró central)
  const synth = computeSynthesis(answers);
  html += `
    <div style="margin:22px 0 18px 0;padding:14px 16px;border:1px solid #ddd;border-radius:14px;">
      <h2 style="margin:0 0 10px 0;">SÍNTESI FINAL</h2>
      ${
        synth.isClear
          ? `
            <div><b>El teu patró central és:</b> ${esc(synth.patternLabel)}</div>
            ${synth.protection ? `<div><b>El que protegeixes:</b> ${esc(synth.protection)}</div>` : ""}
            ${synth.price ? `<div><b>El preu que pagues:</b> ${esc(synth.price)}</div>` : ""}
            <div><b>Decisió 24h:</b> ${esc(synth.decision24h)}</div>
            ${synth.consequence ? `<div><b>Si no fas res:</b> ${esc(synth.consequence)}</div>` : ""}
          `
          : `
            <div><b>SENSE PATRÓ CLAR</b></div>
            <div><b>Decisió 24h:</b> ${esc(synth.decision24h)}</div>
            ${synth.consequence ? `<div><b>Si no fas res:</b> ${esc(synth.consequence)}</div>` : ""}
          `
      }
    </div>
  `;

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
  const synthesis = useMemo(() => computeSynthesis(answers), [answers]);


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
                const out = buildMirror(night, a);
                const quote = trimQuote(a);

                return (
                  <div key={night.id} className="border border-white/10 rounded-2xl p-6 bg-black/25">
                    <div className="text-white/50 text-sm tracking-wider">{night.label} — {out.patternLabel}</div>
                    <div className="text-white font-semibold text-xl mt-2">{night.question}</div>

                    <div className="mt-4 text-white/50 text-sm">El que has escrit</div>
                    <div className="mt-2 rounded-xl border border-white/10 bg-black/30 p-4 text-white/90">
                      {quote ? `"${quote}"` : "(Sense text)"}
                    </div>

                    <div className="mt-5 text-white/50 text-sm">Mirall</div>
                    <div className="mt-2 rounded-xl border border-purple-400/20 bg-purple-500/10 p-4 space-y-3">
                      <div className="text-white/90">
                        {out.mirror}
                      </div>

                      <div className="text-amber-300">
                        <b>Microacció 24h:</b> {out.micro24h}
                      </div>

                      <div className="text-white/70 italic">
                        &ldquo;{out.cut}&rdquo;
                      </div>

                      {(out.protection || out.price || out.consequence) && (
                        <div className="pt-2 space-y-1 text-white/80">
                          {out.protection && <div><b>Protegeixes:</b> {out.protection}</div>}
                          {out.price && <div><b>Preu:</b> {out.price}</div>}
                          {out.consequence && <div><b>Si no fas res:</b> {out.consequence}</div>}
                        </div>
                      )}

                      <div className="pt-2 text-white/80">
                        <b>Pregunta PRO:</b> {out.questionPro}
                      </div>

                      {/* Debug discret (es pot treure quan vulguis) */}
                      <div className="pt-2 text-white/35 text-xs">
                        score={out._score} · hits={out._hits?.join(", ") || "-"} · threshold={SCORE_THRESHOLD}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SÍNTESI FINAL */}
            <div className="mt-10 rounded-3xl border border-white/10 bg-black/30 p-8">
              <div className="text-3xl font-bold">SÍNTESI FINAL</div>

              {synthesis.isClear ? (
                <div className="mt-4 space-y-2 text-white/80">
                  <div className="text-white/95">
                    <b>El teu patró central és:</b> {synthesis.patternLabel}
                  </div>
                  {synthesis.protection && (
                    <div>
                      <b>El que protegeixes:</b> {synthesis.protection}
                    </div>
                  )}
                  {synthesis.price && (
                    <div>
                      <b>El preu que pagues:</b> {synthesis.price}
                    </div>
                  )}
                  <div className="text-amber-300">
                    <b>Decisió 24h:</b> {synthesis.decision24h}
                  </div>
                  {synthesis.consequence && (
                    <div>
                      <b>Si no fas res:</b> {synthesis.consequence}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 text-white/80 space-y-2">
                  <div className="text-white/95">
                    <b>SENSE PATRÓ CLAR</b>
                  </div>
                  <div>{synthesis.decision24h}</div>
                  {synthesis.consequence && (
                    <div>
                      <b>Si no fas res:</b> {synthesis.consequence}
                    </div>
                  )}
                </div>
              )}
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
