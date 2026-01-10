"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type NightId = 1 | 2 | 3 | 4 | 5;

type Night = {
  id: NightId;
  label: string;
  title: string;
  question: string;
  placeholder: string;
  seeds: string[]; // petites “pistes” optatives (no obliguen)
};

type SavedState = {
  version: "v2";
  startedAt: number;
  updatedAt: number;
  currentNight: NightId;
  answers: Record<NightId, string>;
};

type RiskKind = "none" | "selfharm" | "violence" | "both";

const STORAGE_KEY = "tremolor_v2_state";

const NIGHTS: Night[] = [
  {
    id: 1,
    label: "NIT 1",
    title: "La porta",
    question: "Què has entès de tu que abans no volies veure?",
    placeholder: "Escriu sense fer-te el simpàtic. 2–6 línies. El suficient.",
    seeds: [
      "M’he adonat que…",
      "El que no volia veure és que…",
      "La veritat incòmoda és…",
      "Em costa admetre que…",
    ],
  },
  {
    id: 2,
    label: "NIT 2",
    title: "La màscara",
    question: "Quina màscara utilitzes per no ser vist/a? I què t’estalvia?",
    placeholder: "Quin paper fas? I quin preu et cobra cada setmana?",
    seeds: [
      "La meva màscara és…",
      "Faig veure que… perquè…",
      "Em salva de… però em roba…",
      "Quan em miren, jo…",
    ],
  },
  {
    id: 3,
    label: "NIT 3",
    title: "El loop",
    question:
      "Quin patró es repeteix i et fa perdre energia (sempre igual, amb excuses diferents)?",
    placeholder: "Descriu el guió. No el justifiquis.",
    seeds: [
      "Sempre acabo fent…",
      "Quan passa X, jo…",
      "La meva excusa preferida és…",
      "El meu bucle és…",
    ],
  },
  {
    id: 4,
    label: "NIT 4",
    title: "La ferida",
    question:
      "Quina ferida protegeixes com si et salvés… però t’està cobrant interessos?",
    placeholder: "Què defenses amb dents? I què et costa defensar-ho?",
    seeds: [
      "Em fa mal quan…",
      "Ho protegeixo perquè…",
      "El que no vull sentir és…",
      "La ferida és…",
    ],
  },
  {
    id: 5,
    label: "NIT 5",
    title: "El pas",
    question:
      "Quin és el pas petit i real que estàs evitant (i què et fa por perdre si el fas)?",
    placeholder: "Pas petit. Real. En 24 hores. Sense epopeies.",
    seeds: [
      "El pas que estic evitant és…",
      "Em fa por perdre…",
      "Si ho faig, em temo que…",
      "El meu següent pas seria…",
    ],
  },
];

// ------------------------------
// Helpers: text, hashing, detect
// ------------------------------

function now() {
  return Date.now();
}

function clampText(input: string, maxLen = 1200) {
  const s = (input ?? "").toString();
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function normalize(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function simpleHash(s: string) {
  // hash determinista (no crypto) per variar respostes sense “aleatori”
  let h = 0;
  const str = s || "";
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function excerpt(s: string, max = 72) {
  const clean = (s || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.length <= max ? clean : clean.slice(0, max - 1) + "…";
}

function isMostlyEmpty(s: string) {
  return normalize(s).replace(/[^a-z0-9]/g, "").length < 6;
}

// Profanity (bàsic) + violència + autolesió
const PROFANITY = [
  "puta",
  "puto",
  "cabr",
  "gilip",
  "idiot",
  "merda",
  "collons",
  "joder",
  "cojones",
  "me cago",
  "hostia",
  "polla",
  "mierda",
];

const SELF_HARM = [
  "suicid",
  "matar-me",
  "matarme",
  "autolesi",
  "auto lesi",
  "em vull morir",
  "no vull viure",
  "llevar-me la vida",
  "quitarme la vida",
  "em faig mal",
];

const VIOLENCE = [
  "el matare",
  "el mataré",
  "la matare",
  "li fotare",
  "li fotré",
  "pallissa",
  "palissa",
  "el rebentare",
  "el rebentaré",
  "li clava",
  "li clavare",
  "li pegar",
  "le pego",
  "lo mato",
  "te matare",
  "te mataré",
];

function detectProfanity(text: string) {
  const t = normalize(text);
  return PROFANITY.some((w) => t.includes(w));
}

function detectRisk(text: string): RiskKind {
  const t = normalize(text);
  const sh = SELF_HARM.some((w) => t.includes(w));
  const v = VIOLENCE.some((w) => t.includes(w));
  if (sh && v) return "both";
  if (sh) return "selfharm";
  if (v) return "violence";
  return "none";
}

function redactIfRisk(answer: string, risk: RiskKind) {
  // En risc: no reproduïm literalment amenaces/insults. Mostrem resum.
  if (risk === "none") return answer;
  const a = (answer || "").trim();
  if (!a) return a;

  const t = normalize(a);
  const hasProf = detectProfanity(a);

  const parts: string[] = [];
  if (risk === "selfharm" || risk === "both") parts.push("frases de possible autolesió/suïcidi");
  if (risk === "violence" || risk === "both") parts.push("frases d’agressió/amenaces");
  if (hasProf) parts.push("insults/paraulotes");

  return `He escrit ${parts.join(" + ")}. (No ho reprodueixo literalment aquí.)`;
}

type Themes = {
  control: boolean;
  fear: boolean;
  shame: boolean;
  anger: boolean;
  exhaustion: boolean;
  loneliness: boolean;
  perfectionism: boolean;
  avoidance: boolean;
  peoplePleaser: boolean;
};

function analyzeThemes(answer: string): Themes {
  const t = normalize(answer);
  const has = (arr: string[]) => arr.some((w) => t.includes(w));
  return {
    control: has(["control", "necessito", "vull que", "tot sota", "orden", "rutina", "sorpres"]),
    fear: has(["por", "fa por", "pateixo", "angoix", "ansiet", "em fa por", "espant"]),
    shame: has(["vergonya", "ridicul", "no vull que vegin", "que pensin", "no soc prou", "no soc tan bo"]),
    anger: has(["rabia", "ràbia", "furia", "fúria", "odi", "molt violent", "em poso nervios", "crido"]),
    exhaustion: has(["cansat", "cansada", "esgot", "no puc mes", "no puc més", "fatiga"]),
    loneliness: has(["sol", "sola", "ningu", "ningú", "abandon", "no importo", "invisible"]),
    perfectionism: has(["perfect", "exigent", "ho he de fer be", "ho he de fer bé", "error", "fallar", "frac"]),
    avoidance: has(["evito", "fuge", "fujo", "anestes", "pantalla", "distraccio", "distracció", "no vull sentir"]),
    peoplePleaser: has(["agradar", "quedar be", "quedar bé", "dir que si", "dir que sí", "complac", "no dir no"]),
  };
}

function pickVariant(answer: string, count: number) {
  const h = simpleHash(normalize(answer));
  return count <= 0 ? 0 : h % count;
}

// ------------------------------
// Mirror generation
// ------------------------------

function mirrorForNight(nightId: NightId, answerRaw: string) {
  const answer = (answerRaw || "").trim();
  const themes = analyzeThemes(answer);
  const anch = excerpt(answer, 64);

  const variant = pickVariant(answer + `|${nightId}`, 5);

  const openers = [
    "Aquí no hi ha “descobriment”. Hi ha admissió.",
    "Això no és una opinió: és una pista sobre tu.",
    "Quan escrius així, el teu cervell deixa de fer màgia i comença a dir la veritat.",
    "Has deixat una marca. No és bonica. És útil.",
    "No cal que sigui elegant. Cal que sigui real.",
  ];

  const translationsByNight: Record<NightId, string[]> = {
    1: [
      "El teu “jo” no necessita excuses. Necessita que el miris de cara.",
      "Això que admetes és el primer tall al guió vell.",
      "Quan poses paraules al que evites, deixes de ser víctima del teu propi relat.",
      "No és que siguis feble: és que estàs cansat de fingir que no passa res.",
      "El primer pas no és arreglar-ho. És deixar de mentir-te amb educació.",
    ],
    2: [
      "La màscara dona control social… però et roba intimitat i descans.",
      "No ets “així”. Et defenses així. I defensar-se cansa.",
      "Si el paper et salva, també et cobra. Sempre.",
      "El somriure perfecte és una porta tancada amb bon gust.",
      "Quan la màscara manda, tu desapareixes una mica cada setmana.",
    ],
    3: [
      "Un loop no és mala sort: és una rutina emocional ben entrenada.",
      "El patró es repeteix perquè té benefici ocult. I tu el cobres sense adonar-te’n.",
      "Quan el guió és sempre el mateix, la llibertat no és pensar més: és interrompre’l.",
      "El teu cervell no busca veritat. Busca alleujament ràpid. I així et torna a vendre el mateix.",
      "L’excusa canvia. El mecanisme no. Això és el que estàs veient ara.",
    ],
    4: [
      "Una ferida protegida sembla força… fins que et deixa sense aire.",
      "Això no et salva. T’hi aferres perquè t’espanta el que ve després.",
      "La ferida cobra interessos: energia, relacions i futur.",
      "No és drama: és història no digerida que encara mana.",
      "La pregunta no és “per què em fa mal”. És “què no vull perdre si la deixo guarir”.",
    ],
    5: [
      "El pas petit és el teu antídot contra la gran mentida: “ja ho faré”.",
      "No necessites motivació. Necessites un gest honest que no puguis negociar.",
      "El teu cervell negociarà. Tu només has de complir el pacte amb tu.",
      "El pas real fa por perquè et treu el personatge, no el problema.",
      "Un pas petit avui val més que una gran promesa demà (que no faràs).",
    ],
  };

  const questionsByNight: Record<NightId, string[]> = {
    1: [
      "Quina part de tu vol seguir fent-se l’innocent… i què hi guanya?",
      "Si això fos cert del tot, què hauries de deixar de justificar a partir d’avui?",
      "Què estàs protegint quan ho dius “a mitges” i amb prudència?",
      "Quin és el cost de seguir fent veure que no ho veus?",
      "Si ho haguessis d’explicar en una frase brutal, quina seria?",
    ],
    2: [
      "Què et costa cada setmana mantenir aquest paper en peu?",
      "Qui perds quan actues així? (No “què”. Qui.)",
      "Quina veritat quedaria si et prohibissin fer broma durant 24 hores?",
      "Què t’estalvia avui… i què et roba a llarg termini?",
      "Amb qui et permets ser simple, sense performance?",
    ],
    3: [
      "Quin és el benefici ocult d’aquest bucle (control, anestèsia, evitar vergonya…)?",
      "En quin moment exacte comença el loop? (el primer senyal físic/mental)",
      "Quina és l’excusa “intel·ligent” que et compra el cervell sempre?",
      "Què passaria si avui NO fessis el pas 1 del guió?",
      "Quina part de tu s’espanta si interromps el patró?",
    ],
    4: [
      "Què necessitava sentir la teva part més jove… i no va sentir?",
      "Quina emoció intentes evitar quan et poses dur/a?",
      "Què has convertit en “norma” que en realitat és una defensa?",
      "A qui estàs castigant (encara) quan et tanques així?",
      "Quina seria una forma adulta de cuidar-te sense enfonsar-te?",
    ],
    5: [
      "Quin pas faràs en 24 hores que sigui petit però irreversible (encara que tremolis)?",
      "Quina frase diràs (una) que fins ara no has dit?",
      "Quin límit posaràs que et fa por perquè et treu el rol?",
      "Quina cosa concreta deixaràs de fer aquesta setmana per recuperar aire?",
      "Si ho féssim fàcil: quin és el pas mínim que et faria sentir respecte per tu?",
    ],
  };

  // Tocs de humor negre (controlat) segons tema
  const humorTags: string[] = [];
  if (themes.control) humorTags.push("control");
  if (themes.perfectionism) humorTags.push("perfeccio");
  if (themes.peoplePleaser) humorTags.push("bonnoi");
  if (themes.avoidance) humorTags.push("anestesia");
  if (themes.shame) humorTags.push("vergonya");

  const humorLine = (() => {
    if (!humorTags.length) return "";
    const v = pickVariant(answer + "|humor", 5);
    const pool: Record<string, string[]> = {
      control: [
        "Tens un talent: convertir la vida en full d’Excel emocional.",
        "Quan controles massa, no vius: administres.",
        "Control no és seguretat. És por amb uniforme.",
        "El teu cervell vol garanties. La vida vol coratge barat.",
        "No ets maniàtic/a. Només estàs cansat/ada de l’imprevist.",
      ],
      perfeccio: [
        "Perfecció: el teu narcòtic legal preferit.",
        "Quan busques fer-ho perfecte, normalment és perquè et fa por fer-ho humà.",
        "La perfecció és una manera elegant de no començar.",
        "Exigir-te tant és una forma fina d’autocàstig.",
        "El teu llistó no és alt: és un mur.",
      ],
      bonnoi: [
        "Ser “majo/maja” és barat… fins que et costa la pau.",
        "Complaure és un esport. El problema és que no hi ha medalla.",
        "Dir que sí a tothom és dir que no a tu (i això ja ho saps).",
        "Ets molt amable… amb tothom menys amb tu.",
        "El teu “sí” ràpid és un “no” lent a la teva vida.",
      ],
      anestesia: [
        "L’anestèsia no cura. Només fa que el dolor arribi més tard, amb interessos.",
        "Quan et distreus molt, normalment és perquè et fa por estar amb tu.",
        "Pantalla, soroll, ocupació: el trio clàssic per no sentir.",
        "No estàs “ocupat/ada”. Estàs fugint amb agenda.",
        "La rutina pot ser pau… o una gàbia neta.",
      ],
      vergonya: [
        "La vergonya té un superpoder: fer-te actuar com si no et passés res.",
        "La vergonya no vol veritat. Vol silenci.",
        "Quan et tapes, sembla modestia. Sovint és por.",
        "No et falta valor. Et sobra judici sobre tu mateix/a.",
        "Et critiques abans que ho facin els altres. Previsió… i presó.",
      ],
    };
    const key = humorTags[v % humorTags.length];
    const arr = pool[key] || [];
    return arr.length ? arr[v % arr.length] : "";
  })();

  const opener = openers[variant % openers.length];
  const translation = translationsByNight[nightId][variant % translationsByNight[nightId].length];
  const question = questionsByNight[nightId][variant % questionsByNight[nightId].length];

  const anchorLine = anch ? `Quan dius «${anch}»…` : "Quan ho mires així…";

  // “Cop final” integrat (sense dir-ho)
  const closingFor5 = (() => {
    if (nightId !== 5) return "";
    const v = pickVariant(answer + "|close5", 5);
    const lines = [
      "No et trauré el dolor. Però sí l’autoengany.",
      "No necessites ser perfecte. Necessites ser honest 10 minuts.",
      "Avui no et demano valentia: et demano un gest net.",
      "El respecte per tu no es pensa. Es practica.",
      "Fes el pas petit. I després respira. Ja vindrà la resta.",
    ];
    return lines[v % lines.length];
  })();

  // Construeix el mirall (sense repetir la resposta sencera)
  const paragraphs: string[] = [];
  paragraphs.push(opener);
  paragraphs.push(anchorLine + " això ja és una confessió, no una descripció.");
  if (humorLine) paragraphs.push(humorLine);

  return {
    mirror: paragraphs.join("\n"),
    translation,
    question,
    closingFor5,
  };
}

function riskGuidance(risk: RiskKind, nightId: NightId) {
  // Diversificat per nit (no mantra repetit)
  const common = {
    title: "Avís important",
    subtitle:
      "He detectat possibles senyals de risc (autolesió/suïcidi/violència). Primer seguretat. Després profunditat.",
    emergency: "Si estàs en perill immediat: 112. A Espanya també tens el 024.",
    note: "Això és un complement. No substitueix ajuda professional.",
  };

  const promptsByNight: Record<NightId, string[]> = {
    1: [
      "Ara mateix: no ho analitzis. Busca una presència humana (una persona) i digues-li: “No estic bé. Necessito estar acompanyat/ada.”",
      "Prioritat: estar amb algú. No quedis sol/a si hi ha risc.",
      "Fes una cosa útil ara: aixeca’t, beu aigua, i truca a algú. Després ja parlarem de sentit.",
    ],
    2: [
      "Si tens impuls agressiu o autolesiu: posa distància. Canvia d’espai físic. Evita alcohol/estímuls.",
      "Pas segur: surt a un lloc on hi hagi gent o contacta amb algú de confiança.",
      "No has de sostenir això sol/a. Avui el teu objectiu és seguretat, no lucidesa.",
    ],
    3: [
      "Si hi ha violència: talla el contacte immediatament. Distància física abans que paraules boniques.",
      "Si hi ha autolesió: treu del teu entorn qualsevol mitjà que et faciliti fer-te mal.",
      "Truca ara. No negociïs amb el pic emocional.",
    ],
    4: [
      "Què necessites per estar a salvo aquesta nit? (llum, companyia, telèfon a mà, porta oberta, no aïllar-te).",
      "Si estàs alterat/ada: respira 60 segons. Després demana ajuda. Un pas. Ara.",
      "El mirall pot esperar. Tu no.",
    ],
    5: [
      "Avui no hi ha “pas petit”. Hi ha “pas segur”: contactar suport professional o emergències si cal.",
      "Si tens impuls de fer mal: 112 si hi ha perill. Si és crisi emocional: 024 (Espanya).",
      "Quan estiguis a salvo, tornes. Però ara… primer seguretat.",
    ],
  };

  const prompt = promptsByNight[nightId][pickVariant(String(nightId) + "|" + risk, promptsByNight[nightId].length)];

  return { ...common, prompt };
}

// ------------------------------
// Exports (TXT / Word / Print)
// ------------------------------

function buildReportText(answers: Record<NightId, string>, risk: RiskKind) {
  const lines: string[] = [];
  lines.push("TREMOLOR.APP — INFORME (V2)");
  lines.push("");
  lines.push("Cinc nits. Cinc miralls. No està “bé” ni “malament”. Està escrit.");
  if (risk !== "none") {
    lines.push("");
    lines.push("AVÍS: S'han detectat possibles senyals de risc. Prioritat: seguretat (112 / 024).");
  }
  lines.push("");
  for (const night of NIGHTS) {
    const raw = answers[night.id] || "";
    lines.push(`${night.label} · ${night.title}`);
    lines.push(night.question);
    lines.push("");
    lines.push("EL QUE HAS ESCRIT:");
    lines.push(raw.trim() ? raw.trim() : "(sense resposta)");
    lines.push("");
    if (risk === "none") {
      const m = mirrorForNight(night.id, raw);
      lines.push("MIRALL:");
      lines.push(m.mirror);
      lines.push("");
      lines.push("TRADUCCIÓ:");
      lines.push(m.translation);
      lines.push("");
      lines.push("PREGUNTA:");
      lines.push(m.question);
      if (night.id === 5 && m.closingFor5) {
        lines.push("");
        lines.push(m.closingFor5);
      }
    } else {
      const g = riskGuidance(risk, night.id);
      lines.push("PRIMER SEGURETAT:");
      lines.push(g.prompt);
    }
    lines.push("");
    lines.push("— — —");
    lines.push("");
  }
  lines.push("El tremolor continua.");
  return lines.join("\n");
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadTxt(text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  downloadBlob("tremolor_informe_v2.txt", blob);
}

function downloadWordFromHtml(title: string, htmlBody: string) {
  // Word simple (.doc) via HTML
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
body{font-family: Arial, sans-serif; line-height:1.4; color:#111;}
h1,h2,h3{margin:0 0 8px 0;}
.small{color:#555; font-size:12px;}
.block{border:1px solid #ddd; padding:10px; margin:10px 0; border-radius:6px;}
.badge{display:inline-block; padding:2px 8px; border-radius:999px; background:#eee; font-size:12px;}
.hr{height:1px; background:#ddd; margin:14px 0;}
</style>
</head>
<body>
${htmlBody}
</body>
</html>`;

  const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
  downloadBlob("tremolor_informe_v2.doc", blob);
}

// ------------------------------
// UI
// ------------------------------

export default function PageV2() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"landing" | "questions" | "report">("landing");
  const [currentNight, setCurrentNight] = useState<NightId>(1);
  const [answers, setAnswers] = useState<Record<NightId, string>>({
    1: "",
    2: "",
    3: "",
    4: "",
    5: "",
  });

  const [startedAt, setStartedAt] = useState<number>(now());
  const [updatedAt, setUpdatedAt] = useState<number>(now());

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: SavedState = JSON.parse(raw);
        if (parsed?.version === "v2" && parsed?.answers) {
          setAnswers(parsed.answers);
          setCurrentNight(parsed.currentNight || 1);
          setStartedAt(parsed.startedAt || now());
          setUpdatedAt(parsed.updatedAt || now());

          const done = (Object.values(parsed.answers) as string[]).every((v) => (v || "").trim().length > 0);
          if (done) setMode("report");
          else setMode("landing");
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const progress = useMemo(() => {
    const filled = (Object.values(answers) as string[]).filter((v) => (v || "").trim().length > 0).length;
    return { filled, total: 5, pct: Math.round((filled / 5) * 100) };
  }, [answers]);

  const risk: RiskKind = useMemo(() => {
    const all = Object.values(answers).join(" \n ");
    return detectRisk(all);
  }, [answers]);

  const profanity = useMemo(() => {
    const all = Object.values(answers).join(" \n ");
    return detectProfanity(all);
  }, [answers]);

  function persist(next: Partial<SavedState>) {
    const state: SavedState = {
      version: "v2",
      startedAt,
      updatedAt: now(),
      currentNight,
      answers,
      ...next,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }

  function start() {
    setMode("questions");
    setCurrentNight(1);
    persist({ currentNight: 1 });
    setTimeout(() => textareaRef.current?.focus(), 60);
  }

  function resetAll() {
    const fresh: Record<NightId, string> = { 1: "", 2: "", 3: "", 4: "", 5: "" };
    setAnswers(fresh);
    setCurrentNight(1);
    setMode("landing");
    setStartedAt(now());
    setUpdatedAt(now());
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  function setAnswer(nightId: NightId, value: string) {
    const v = clampText(value, 1400);
    setAnswers((prev) => {
      const next = { ...prev, [nightId]: v };
      return next;
    });
    setUpdatedAt(now());
  }

  function saveAndNext() {
    persist({ answers, currentNight });
    if (currentNight < 5) {
      const next = (currentNight + 1) as NightId;
      setCurrentNight(next);
      persist({ currentNight: next, answers });
      setTimeout(() => textareaRef.current?.focus(), 60);
    } else {
      setMode("report");
      persist({ currentNight: 5, answers });
    }
  }

  function back() {
    if (currentNight > 1) {
      const prev = (currentNight - 1) as NightId;
      setCurrentNight(prev);
      persist({ currentNight: prev, answers });
      setTimeout(() => textareaRef.current?.focus(), 60);
    } else {
      setMode("landing");
    }
  }

  function fillSeed(seed: string) {
    const cur = answers[currentNight] || "";
    const next = cur.trim().length ? `${cur}\n${seed}` : seed;
    setAnswer(currentNight, next);
    setTimeout(() => textareaRef.current?.focus(), 30);
  }

  const reportText = useMemo(() => buildReportText(answers, risk), [answers, risk]);

  const reportHtml = useMemo(() => {
    // HTML per Word
    const parts: string[] = [];
    parts.push(`<h1>Tremolor · Informe (V2)</h1>`);
    parts.push(`<p class="small">Cinc nits. Cinc miralls. No està “bé” ni “malament”. Està escrit.</p>`);
    if (risk !== "none") {
      parts.push(
        `<div class="block"><span class="badge">AVÍS</span> He detectat possibles senyals de risc. Si estàs en perill immediat: <b>112</b>. A Espanya també tens el <b>024</b>.</div>`
      );
    }
    for (const night of NIGHTS) {
      const raw = (answers[night.id] || "").trim();
      const safeShown = risk === "none" ? raw : redactIfRisk(raw, risk);
      parts.push(`<div class="hr"></div>`);
      parts.push(`<h2>${night.label} · ${night.title}</h2>`);
      parts.push(`<p><b>${night.question}</b></p>`);
      parts.push(`<div class="block"><div class="small">El que has escrit</div><div>${(safeShown || "(sense resposta)").replaceAll(
        "\n",
        "<br/>"
      )}</div></div>`);
      if (risk === "none") {
        const m = mirrorForNight(night.id, raw);
        parts.push(`<div class="block"><div class="small">Mirall</div><div>${m.mirror.replaceAll("\n", "<br/>")}</div></div>`);
        parts.push(
          `<div class="block"><div><span class="badge">Traducció</span> ${m.translation}</div><div style="margin-top:8px;"><b>${m.question}</b></div>${
            night.id === 5 && m.closingFor5 ? `<div style="margin-top:10px;">${m.closingFor5}</div>` : ""
          }</div>`
        );
      } else {
        const g = riskGuidance(risk, night.id);
        parts.push(
          `<div class="block"><span class="badge">Primer seguretat</span><div style="margin-top:6px;">${g.prompt}</div></div>`
        );
      }
    }
    parts.push(`<div class="hr"></div>`);
    parts.push(`<p><i>El tremolor continua.</i></p>`);
    return parts.join("\n");
  }, [answers, risk]);

  // CTA copy (Nivell següent) — clatellot amorós + humor negre suau
  const nextLevelCopy = useMemo(() => {
    const base = [
      "Aquest informe és un mirall curt: et posa davant del guió.",
      "El següent nivell és quan el guió es converteix en mapa i tens un pla perquè no quedi en “ja ho miraré”.",
      "No et prometo motivació. Et prometo claredat… i una mica de respecte per tu mateix/a.",
    ];
    const spice = [
      "Si venies a sentir-te bé, Netflix. Si venies a veure’t… segueix.",
      "Això no és teràpia. Però sí que pot ser el primer acte d’adult.",
      "No et canviaré la vida amb frases boniques. Però sí que et puc treure una excusa.",
    ];
    const v = pickVariant(Object.values(answers).join("|"), 3);
    return { base, spice: spice[v] };
  }, [answers]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#07070a] text-white">
      <GlobalStyles />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="text-sm font-semibold tracking-wide text-white/90">Tremolor · V2</div>
          <div className="flex items-center gap-3 text-xs text-white/70">
            <span className="rounded-full border border-white/15 px-2 py-1">
              Progrés: <b className="text-white">{progress.pct}%</b>
            </span>
            <button
              onClick={resetAll}
              className="rounded-full border border-white/15 px-3 py-1 hover:bg-white/5"
              type="button"
            >
              Reiniciar
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        {mode === "landing" && (
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#120a1e] via-[#07070a] to-black p-8 md:p-14">
            <div className="pointer-events-none absolute inset-0 opacity-60">
              <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-purple-500/20 blur-3xl" />
              <div className="absolute -bottom-28 right-10 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
            </div>

            <div className="relative">
              <h1 className="tremor-title text-5xl font-extrabold leading-tight md:text-7xl">
                El tremolor
                <span className="tremor-dot inline-block"> </span>
                <br />
                continua<span className="tremor-dot inline-block">…</span>
              </h1>

              <p className="mt-6 text-lg text-white/75 md:text-xl">
                Això no és un test de personalitat.
              </p>
              <p className="mt-2 max-w-2xl text-base text-white/65 md:text-lg">
                És una conversa amb les veus que ja coneixes però prefereixes no escoltar.
              </p>

              <div className="mt-6 text-base text-white/60 md:text-lg">
                5 preguntes. 5 minuts. Cap resposta correcta. Només la teva veritat.
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={start}
                  className="rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-black hover:bg-white/90"
                  type="button"
                >
                  Entrar →
                </button>

                <div className="text-sm text-white/55">
                  <span className="inline-block rounded-full border border-white/10 px-3 py-2">
                    Les respostes es queden al teu dispositiu
                  </span>
                </div>
              </div>

              <div className="mt-10 border-t border-white/10 pt-6 text-sm text-white/55">
                Nota: això és un complement. No substitueix teràpia ni cap professional.
                <span className="ml-2 text-white/45">Si estàs en crisi o tens idees d’autolesió: 112 / 024.</span>
              </div>
            </div>
          </div>
        )}

        {mode === "questions" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-xs font-semibold tracking-widest text-white/50">
                    {NIGHTS[currentNight - 1].label} · {NIGHTS[currentNight - 1].title.toUpperCase()}
                  </div>
                  <h2 className="mt-2 text-2xl font-bold md:text-3xl">
                    {NIGHTS[currentNight - 1].question}
                  </h2>
                </div>

                <div className="text-xs text-white/60">
                  {progress.filled}/{progress.total} respostes
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-sm font-semibold text-white/80">Pistes (opcional)</div>
                  <div className="mt-2 text-sm text-white/60">
                    Si et quedes en blanc, agafa una frase i continua. No és trampa. És entrada.
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {NIGHTS[currentNight - 1].seeds.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => fillSeed(s)}
                        className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-sm font-semibold text-white/80">Recordatori ràpid</div>
                  <ul className="mt-2 space-y-2 text-sm text-white/60">
                    <li>• Curt i honest. No busquis quedar bé.</li>
                    <li>• 2–6 línies és suficient.</li>
                    <li>• Si tens ràbia, escriu-la… però no la facis servir d’arma.</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6">
                <textarea
                  ref={textareaRef}
                  value={answers[currentNight]}
                  onChange={(e) => setAnswer(currentNight, e.target.value)}
                  placeholder={NIGHTS[currentNight - 1].placeholder}
                  className="min-h-[180px] w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-base text-white/90 outline-none placeholder:text-white/35 focus:border-purple-400/50"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-white/45">
                  <span>
                    {detectProfanity(answers[currentNight]) ? "Paraulotes detectades (ok, però no és necessari)." : " "}
                  </span>
                  <span>{(answers[currentNight] || "").length}/1400</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={back}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                  type="button"
                >
                  ← Enrere
                </button>

                <button
                  onClick={saveAndNext}
                  disabled={isMostlyEmpty(answers[currentNight])}
                  className="rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
                  type="button"
                  title={isMostlyEmpty(answers[currentNight]) ? "Escriu una mica més (mínim real)" : ""}
                >
                  {currentNight < 5 ? "Guardar i seguir →" : "Veure informe →"}
                </button>
              </div>
            </div>

            <div className="text-center text-xs text-white/50">
              Les respostes es queden al teu dispositiu. No hi ha registre.
            </div>
          </div>
        )}

        {mode === "report" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-xs font-semibold tracking-widest text-white/50">MAPA DEL TREMOLOR</div>
                  <h2 className="mt-2 text-3xl font-extrabold md:text-4xl">El teu informe</h2>
                  <p className="mt-3 max-w-2xl text-white/65">
                    Cinc nits. Cinc miralls. No està “bé” ni “malament”. Està escrit. I això ja és un canvi.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("questions")}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                  >
                    Editar respostes
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadTxt(reportText)}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                    title="TXT (simple i universal)"
                  >
                    TXT
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadWordFromHtml("Tremolor · Informe (V2)", reportHtml)}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                    title="Word (.doc)"
                  >
                    Word
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
                    title="Imprimir o desar en PDF"
                  >
                    Imprimir / PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Risk banner */}
            {risk !== "none" && (
              <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-6">
                <div className="text-sm font-semibold text-red-200">Avís important</div>
                <div className="mt-1 text-sm text-white/80">
                  He detectat possibles senyals de risc (autolesió/suïcidi/violència).
                </div>
                <div className="mt-2 text-sm text-white/80">
                  <b>Si estàs en perill immediat: 112.</b> A Espanya també tens el <b>024</b>.
                </div>
                <div className="mt-2 text-sm text-white/70">
                  Això és un complement. No substitueix ajuda professional.
                </div>
              </div>
            )}

            {/* “nota” visible però sense ocupar mig món */}
            {risk === "none" && (
              <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4">
                <div className="text-sm font-semibold text-yellow-200">Nota important</div>
                <div className="mt-1 text-sm text-white/80">
                  Si estàs en crisi o tens idees d’autolesió: para aquí i parla amb un professional.
                  <span className="text-white/70"> Això és un complement. No una sala d’urgències.</span>
                </div>
              </div>
            )}

            {/* Nights */}
            {NIGHTS.map((night) => {
              const raw = (answers[night.id] || "").trim();
              const shownAnswer = risk === "none" ? raw : redactIfRisk(raw, risk);

              if (risk !== "none") {
                const g = riskGuidance(risk, night.id);
                return (
                  <section
                    key={night.id}
                    className="rounded-3xl border border-white/10 bg-gradient-to-b from-black/30 to-black/10 p-6 md:p-8"
                  >
                    <div className="text-xs font-semibold tracking-widest text-white/50">
                      {night.label} · {night.title.toUpperCase()}
                    </div>
                    <h3 className="mt-2 text-2xl font-bold md:text-3xl">{night.question}</h3>

                    <div className="mt-4 text-sm font-semibold text-white/70">El que has escrit</div>
                    <div className="mt-2 rounded-2xl border border-white/10 bg-black/40 p-4 text-white/85">
                      {shownAnswer || "(sense resposta)"}
                    </div>

                    <div className="mt-4 rounded-2xl border border-red-400/25 bg-red-500/10 p-5">
                      <div className="text-sm font-semibold text-red-200">Primer seguretat</div>
                      <div className="mt-2 whitespace-pre-line text-white/85">{g.prompt}</div>
                      <div className="mt-3 text-sm text-white/75">
                        Si estàs en risc immediat: <b>112</b>. A Espanya també <b>024</b>.
                      </div>
                    </div>
                  </section>
                );
              }

              const m = mirrorForNight(night.id, raw);

              return (
                <section
                  key={night.id}
                  className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#120a1e]/40 via-black/30 to-black/10 p-6 md:p-8"
                >
                  <div className="text-xs font-semibold tracking-widest text-white/50">
                    {night.label} · {night.title.toUpperCase()}
                  </div>
                  <h3 className="mt-2 text-2xl font-bold md:text-3xl">{night.question}</h3>

                  <div className="mt-5 text-sm font-semibold text-white/70">El que has escrit</div>
                  <div className="mt-2 rounded-2xl border border-white/10 bg-black/40 p-4 text-white/85">
                    {shownAnswer || "(sense resposta)"}
                  </div>

                  <div className="mt-5 text-sm font-semibold text-white/70">Mirall (reformulat)</div>
                  <div className="mt-2 rounded-2xl border border-purple-400/20 bg-purple-500/10 p-5">
                    <div className="whitespace-pre-line text-white/90">{m.mirror}</div>

                    <div className="mt-4">
                      <span className="font-semibold text-yellow-300">Traducció:</span>{" "}
                      <span className="text-white/85">{m.translation}</span>
                    </div>

                    <div className="mt-4 text-lg font-semibold text-white">{m.question}</div>

                    {night.id === 5 && m.closingFor5 && (
                      <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-white/85">
                        {m.closingFor5}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}

            {/* Next level CTA */}
            {risk === "none" && (
              <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-purple-500/15 via-black/20 to-black/10 p-6 md:p-10">
                <h3 className="text-3xl font-extrabold">I ara què?</h3>

                <div className="mt-4 space-y-2 text-white/70">
                  {nextLevelCopy.base.map((l) => (
                    <p key={l}>{l}</p>
                  ))}
                  <p className="text-white/80">{nextLevelCopy.spice}</p>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-xl font-bold">El Tremolor Complet</div>
                    <div className="text-white/60">
                      7 dies + profunditat + el que no s’escriu quan tens por de mirar-ho
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => alert("Aquí enganxarem el següent nivell (PRO) quan el tinguem llest).")}
                    className="rounded-2xl bg-purple-600 px-10 py-5 text-lg font-semibold hover:bg-purple-500"
                  >
                    No em vull escapar
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pb-10 text-center text-xs text-white/45">
              EdmondSystems · Tremolor (V2) — Les respostes es queden al teu dispositiu
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function GlobalStyles() {
  return (
    <style jsx global>{`
      @media print {
        header,
        button {
          display: none !important;
        }
        body {
          background: white !important;
          color: #111 !important;
        }
      }

      /* Tremolor: perceptible però no molest */
      .tremor-title {
        display: inline-block;
        will-change: transform;
        animation: tremor 1.8s infinite;
      }
      .tremor-dot {
        will-change: transform;
        animation: tremorDot 1.2s infinite;
      }

      @keyframes tremor {
        0% {
          transform: translate(0px, 0px);
        }
        10% {
          transform: translate(0.8px, -0.6px);
        }
        20% {
          transform: translate(-1px, 0.7px);
        }
        30% {
          transform: translate(1.2px, 0.2px);
        }
        40% {
          transform: translate(-0.7px, -0.8px);
        }
        50% {
          transform: translate(0.4px, 1px);
        }
        60% {
          transform: translate(-0.6px, 0.4px);
        }
        70% {
          transform: translate(0.9px, -0.4px);
        }
        80% {
          transform: translate(-0.3px, 0.7px);
        }
        90% {
          transform: translate(0.5px, -0.2px);
        }
        100% {
          transform: translate(0px, 0px);
        }
      }

      @keyframes tremorDot {
        0% {
          transform: translate(0px, 0px);
        }
        25% {
          transform: translate(0.8px, -0.3px);
        }
        50% {
          transform: translate(-0.6px, 0.6px);
        }
        75% {
          transform: translate(0.4px, 0.2px);
        }
        100% {
          transform: translate(0px, 0px);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .tremor-title,
        .tremor-dot {
          animation: none !important;
        }
      }
    `}</style>
  );
}
