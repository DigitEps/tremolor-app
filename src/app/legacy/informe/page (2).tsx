"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type NightId = 1 | 2 | 3 | 4 | 5;

type NightAnswer = {
  night: NightId;
  answer: string;
};

type StoredState = {
  version: 2;
  answers: Record<string, string>;
  startedAt?: number;
  updatedAt?: number;
};

const STORAGE_KEY = "tremolor_v2_state";

const NIGHTS: Array<{
  night: NightId;
  label: string;
  title: string;
  question: string;
  placeholder: string;
  hints: string[];
}> = [
  {
    night: 1,
    label: "NIT 1 · LA PORTA",
    title: "La porta",
    question: "Què has entès de tu que abans no volies veure?",
    placeholder: "Escriu sense fer-te el simpàtic. Una veritat petita ja serveix.",
    hints: [
      "M’he adonat que em passa això…",
      "El que evito veure és…",
      "Em fa por admetre que…",
      "El meu autoengany preferit és…",
    ],
  },
  {
    night: 2,
    label: "NIT 2 · LA MÀSCARA",
    title: "La màscara",
    question: "Quina màscara utilitzes per no ser vist/a? I què t’estalvia?",
    placeholder: "Quina versió de tu surt quan hi ha risc de vulnerabilitat?",
    hints: [
      "Faig veure que… per no…",
      "Jo sóc “el/la que…” i així evito…",
      "M’amago darrere de…",
      "Si em veiessin, passaria que…",
    ],
  },
  {
    night: 3,
    label: "NIT 3 · EL LOOP",
    title: "El loop",
    question:
      "Quin patró es repeteix i et fa perdre energia (sempre igual, amb excuses diferents)?",
    placeholder: "El mateix guió, amb actors diferents. Quin és?",
    hints: [
      "Sempre acabo fent…",
      "Em prometo que canviaré però…",
      "Quan passa X, jo faig Y…",
      "La meva excusa més intel·ligent és…",
    ],
  },
  {
    night: 4,
    label: "NIT 4 · LA FERIDA",
    title: "La ferida",
    question: "Quina ferida protegeixes com si et salvés… però t’està cobrant interessos?",
    placeholder: "Això que defenses tant… què et costa?",
    hints: [
      "Ho protegeixo perquè…",
      "Em fa mal quan…",
      "No ho dic mai, però…",
      "A dins hi ha… i ho tapo amb…",
    ],
  },
  {
    night: 5,
    label: "NIT 5 · EL PAS",
    title: "El pas",
    question:
      "Quin és el pas petit i real que estàs evitant (i què et fa por perdre si el fas)?",
    placeholder: "Un pas de 24h. No un projecte de vida.",
    hints: [
      "El pas és… però em fa por…",
      "Si ho faig, perdo…",
      "Si ho dic, pensarien que…",
      "El meu cos ja sap que…",
    ],
  },
];

function safeTrim(s: string) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function now() {
  return Date.now();
}

function loadState(): StoredState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredState;
    if (!parsed || parsed.version !== 2) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveState(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function countAnswered(answers: Record<string, string>) {
  let c = 0;
  for (const n of NIGHTS) {
    if (safeTrim(answers[String(n.night)])) c += 1;
  }
  return c;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function pickThemeTags(text: string): string[] {
  const t = text.toLowerCase();
  const tags: string[] = [];

  const add = (tag: string) => {
    if (!tags.includes(tag)) tags.push(tag);
  };

  if (/(control|controlar|sota control|ordre|perfe|perfecte|exigent)/.test(t)) add("control");
  if (/(por|pànic|angoix|ansietat|insegur|incert)/.test(t)) add("por");
  if (/(vergonya|rid[ií]cul|no vull que em vegin|amagar|silenci)/.test(t)) add("vergonya");
  if (/(culpa|culpable|responsable|m'ho mereixo)/.test(t)) add("culpa");
  if (/(sol|soledat|no em recull|abandon|invisible|no importo)/.test(t)) add("abandonament");
  if (/(enfadat|ràbia|odi|resentiment)/.test(t)) add("ràbia");
  if (/(cansat|esgotat|fatiga|no puc més|cremat)/.test(t)) add("esgotament");
  if (/(decepc|tra[iï]ci|no confio|m'han fallat)/.test(t)) add("desconfiança");

  if (tags.length === 0) add("nucli");
  return tags.slice(0, 3);
}

function mirrorForNight(night: NightId, answer: string) {
  const a = safeTrim(answer);
  const tags = pickThemeTags(a);
  const main = tags[0];

  const leadByNight: Record<NightId, string[]> = {
    1: ["Aquí no hi ha “descobriment”. Hi ha admissió.", "Això que has escrit no és opinió: és pista."],
    2: ["Això és una protecció, no una identitat.", "La màscara és útil… fins que et cobra la vida."],
    3: ["Això no és mala sort. És un patró.", "El loop no et vol fer mal: et vol mantenir igual."],
    4: ["Aquesta ferida no és debilitat. És història.", "El problema no és sentir-ho: és viure governat per això."],
    5: ["El pas petit és el que espanta més.", "Si és real, fa tremolor. Si no, és teatre."],
  };

  const translationByTheme: Record<string, string[]> = {
    control: [
      "Pista: no controles perquè siguis fort/a. Controles perquè tens por.",
      "Traducció: el control és anestèsia elegant.",
    ],
    por: [
      "Traducció: no és falta de capacitat. És por d’equivocar-te davant d’algú.",
      "Pista: la por no vol veritat. Vol retard.",
    ],
    vergonya: [
      "Traducció: la vergonya no vol veritat. Vol silenci.",
      "Pista: la màscara et protegeix… i t’aïlla.",
    ],
    culpa: [
      "Traducció: la culpa és una manera de seguir “pagant” sense canviar res.",
      "Pista: si tot és culpa, no cal fer cap pas.",
    ],
    abandonament: [
      "Traducció: quan et sents invisible, o controles o t’apagues.",
      "Pista: la ferida antiga busca escenes noves per repetir-se.",
    ],
    ràbia: [
      "Traducció: la ràbia és energia. El problema és on la descarregues.",
      "Pista: si no la mires, la ràbia decideix per tu.",
    ],
    esgotament: [
      "Traducció: no estàs “fluix/a”. Estàs sobrecarregat/da.",
      "Pista: aguantar no és viure. És resistir.",
    ],
    desconfiança: [
      "Traducció: si no confies, tot es converteix en vigilància.",
      "Pista: protegir-se constantment també és una presó.",
    ],
    nucli: ["Traducció: aquí hi ha una veritat petita, però important.", "Pista: el cos ja ho sabia abans que tu."],
  };

  const bodyByNight: Record<NightId, Record<string, string[]>> = {
    1: {
      control: [
        "Quan poses paraules al que evites, deixes de ser víctima del teu propi guió.",
        "La pregunta incòmoda no és “què et passa”, sinó: què estàs protegint quan ho tapes amb control?",
      ],
      por: [
        "Això que has admès és valent, precisament perquè no sona heroic.",
        "Què perdries si deixessis de fingir que ho tens tot clar?",
      ],
      vergonya: [
        "Si ho has escrit aquí, és que ja ho saps. El teu problema no és consciència: és permís.",
        "A qui li estàs demanant permís per ser humà?",
      ],
      culpa: [
        "El primer autoengany de la culpa és fer-te creure que pagar dolor ja és canviar.",
        "Quina acció petita trencaria el pacte de “patir sense moure’s”?",
      ],
      abandonament: [
        "Quan la ferida és antiga, el cervell busca repetir-la amb escenes modernes.",
        "Quina part de tu segueix esperant que algú el vingui a recollir?",
      ],
      nucli: [
        "Has obert una porta que normalment deixes tancada.",
        "Si aquesta porta parla, què et demana avui —sense drama, sense teatre?",
      ],
    },
    2: {
      control: [
        "La màscara de “tot sota control” et dona respecte… però et roba intimitat i descans.",
        "Quan no et deixes veure, tampoc et deixes ajudar.",
      ],
      por: [
        "La màscara sol ser por amb bon vestit.",
        "La pregunta real: què creus que et faran si et veuen de veritat?",
      ],
      vergonya: [
        "La màscara funciona perquè et protegeix del judici. Però també t’aparta de la connexió.",
        "I això —a la llarga— fa més mal que el judici.",
      ],
      esgotament: [
        "Fer de personatge cansa perquè no hi ha repòs: sempre hi ha performance.",
        "Quan va ser l’últim cop que vas poder “baixar la guàrdia” sense culpa?",
      ],
      nucli: [
        "No és “qui ets”. És “què fas perquè no et vegin”.",
        "Què et costa cada setmana mantenir aquest paper en peu?",
      ],
    },
    3: {
      control: [
        "El loop del control sempre acaba igual: més tensió, menys vida.",
        "Quina part de tu confon previsió amb seguretat emocional?",
      ],
      culpa: [
        "Si la culpa és sempre d’algú (tu o els altres), no cal canviar cap conducta.",
        "La pregunta útil: quin 1% sí que depèn de tu, avui?",
      ],
      por: [
        "El teu cervell negocia: “demà”, “quan tingui temps”, “quan estigui millor”.",
        "Aquest és el loop: esperar condicions perfectes per viure.",
      ],
      esgotament: [
        "El loop no és només mental: és fisiològic. Repetir-te et crema.",
        "Quin costum petit és el teu combustible de cansament?",
      ],
      nucli: [
        "Un patró repetit no és casualitat: és fidelitat a una idea antiga.",
        "Quina excusa et sona més “intel·ligent”… i et deixa igual?",
      ],
    },
    4: {
      abandonament: [
        "Quan et sents invisible, pots fer dues coses: suplicar o construir armadura.",
        "I l’armadura et salva… però et separa.",
      ],
      vergonya: [
        "Protegir una ferida amb silenci és protegir-la perquè mai cicatritzi.",
        "Què passaria si la diguessis amb una frase simple, sense justificació?",
      ],
      control: [
        "Hi ha ferides que es disfressen d’exigència: “si ho faig perfecte, no em faran mal”.",
        "Però la factura és clara: tensió crònica i poca tendresa.",
      ],
      desconfiança: [
        "La ferida et fa estar alerta. Però viure en alerta no és viure.",
        "A qui no estàs permetent apropar-se perquè tens por de repetir dolor?",
      ],
      nucli: [
        "Això que protegeixes et va salvar una vegada. Ara t’està cobrant interessos.",
        "Si fos un nen/nena, què necessitaria sentir ara mateix?",
      ],
    },
    5: {
      control: [
        "El pas no és “canviar la vida”. És deixar una escletxa.",
        "Un 5% sense control. Una conversa. Un “no ho sé”. Un “necessito ajuda”.",
      ],
      por: [
        "El pas petit és aquell que no et deixa excuses elegants.",
        "Si ho fas en 24h, demostres que manes tu. No la por.",
      ],
      vergonya: [
        "El pas és visibilitat. Petita. Però real.",
        "Dir la veritat amb una frase. I aguantar el silenci sense fugir.",
      ],
      culpa: [
        "El pas és sortir de la penitència i entrar a l’acció.",
        "No cal patir més. Cal fer diferent.",
      ],
      nucli: [
        "Aquí tens el següent pas: petit, real, imperfecte.",
        "Quin pas faràs en 24h encara que et tremolin les cames?",
      ],
    },
  };

  const questionByNight: Record<NightId, Record<string, string>> = {
    1: {
      control: "Quina part de tu vol seguir fent-se l’innocent… i què hi guanya?",
      por: "Quina veritat estàs evitant perquè et faria canviar avui?",
      vergonya: "Què estàs protegint quan decideixes “millor callar”?",
      culpa: "Si avui deixessis de pagar amb dolor… què faries?",
      abandonament: "Qui ets quan ningú et recull —i què necessites demanar?",
      nucli: "Què seria admetre-ho del tot, en una sola frase?",
    },
    2: {
      control: "Què et costa cada setmana sostenir aquesta màscara?",
      por: "Què creus que passaria si et veiessin humà/na?",
      vergonya: "Quina intimitat estàs sacrificant per sentir-te segur/a?",
      esgotament: "Quan deixaràs de confondre “aguantar” amb “ser fort/a”?",
      nucli: "Quin paper representes… i per a qui?",
    },
    3: {
      control: "Quina escena repeteixes per no sentir incertesa?",
      culpa: "Quin 1% sí que depèn de tu avui, encara que et piqui?",
      por: "Quina excusa et sona més “lògica” i et deixa igual?",
      esgotament: "Quin hàbit alimenta el teu cansament cada dia?",
      nucli: "Quin és el teu patró quan ningú et mira?",
    },
    4: {
      abandonament: "Què faries diferent si et creguessis que sí que importes?",
      vergonya: "Quina veritat callada et té lligat/da?",
      control: "Què intentes evitar quan ho vols fer perfecte?",
      desconfiança: "A qui no li permets apropar-se, i què et costa això?",
      nucli: "Què necessita sentir el teu nen/nena de dins, avui?",
    },
    5: {
      control: "Quin 5% deixaràs sense control en les pròximes 24h?",
      por: "Quin pas faràs tot i la por, per recuperar direcció?",
      vergonya: "Quina frase diràs que et faci visible, sense drama?",
      culpa: "Quina acció petita substituirà la penitència?",
      nucli: "Quin pas faràs en 24h, encara que tremoli tot?",
    },
  };

  const lead = leadByNight[night][0];

  const bodyPack = bodyByNight[night];
  const body =
    bodyPack[main]?.length ? bodyPack[main] : bodyPack["nucli"]?.length ? bodyPack["nucli"] : [""];

  const translationPack = translationByTheme[main] || translationByTheme["nucli"];
  const translation = translationPack[0];

  const qPack = questionByNight[night];
  const closingQ = qPack[main] || qPack["nucli"];

  return {
    lead,
    body,
    translation,
    closingQ,
  };
}

function buildPlainTextReport(answers: NightAnswer[]) {
  const lines: string[] = [];
  lines.push("TREMOLOR.APP — INFORME (V2)");
  lines.push("Cinc nits. Cinc miralls. Guardat al teu dispositiu.");
  lines.push("");

  for (const n of NIGHTS) {
    const a = answers.find((x) => x.night === n.night)?.answer || "";
    const m = mirrorForNight(n.night, a);

    lines.push(`${n.label}`);
    lines.push(n.question);
    lines.push("El que has escrit:");
    lines.push(safeTrim(a) || "—");
    lines.push("");
    lines.push("Mirall:");
    lines.push(m.lead);
    for (const p of m.body) lines.push(p);
    lines.push(`Traducció: ${m.translation}`);
    lines.push("");
    lines.push(m.closingQ);
    lines.push("");
    lines.push("—");
    lines.push("");
  }

  lines.push("Recorda:");
  lines.push(
    "Si estàs en crisi o tens idees d’autolesió: para aquí i parla amb un professional. Això és un complement. No una sala d’urgències."
  );

  return lines.join("\n");
}

function downloadTxt(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function formatRelativeDays(ts?: number) {
  if (!ts) return null;
  const diff = now() - ts;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Avui";
  if (days === 1) return "Fa 1 dia";
  return `Fa ${days} dies`;
}

export default function TremolorV2Page() {
  const [answersMap, setAnswersMap] = useState<Record<string, string>>({
    "1": "",
    "2": "",
    "3": "",
    "4": "",
    "5": "",
  });
  const [startedAt, setStartedAt] = useState<number | undefined>(undefined);
  const [updatedAt, setUpdatedAt] = useState<number | undefined>(undefined);

  const [mode, setMode] = useState<"landing" | "questions" | "report">("landing");
  const [currentNight, setCurrentNight] = useState<NightId>(1);
  const reportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const st = loadState();
    if (!st) return;

    setAnswersMap((prev) => ({ ...prev, ...st.answers }));
    setStartedAt(st.startedAt);
    setUpdatedAt(st.updatedAt);

    const answered = countAnswered(st.answers || {});
    if (answered === 0) setMode("landing");
    else if (answered < 5) {
      setMode("questions");
      setCurrentNight(clamp(answered + 1, 1, 5) as NightId);
    } else setMode("report");
  }, []);

  useEffect(() => {
    const st: StoredState = {
      version: 2,
      answers: answersMap,
      startedAt: startedAt ?? startedAt,
      updatedAt,
    };
    saveState(st);
  }, [answersMap, startedAt, updatedAt]);

  const answeredCount = useMemo(() => countAnswered(answersMap), [answersMap]);
  const progressPct = useMemo(() => Math.round((answeredCount / 5) * 100), [answeredCount]);

  const answersList: NightAnswer[] = useMemo(() => {
    return NIGHTS.map((n) => ({
      night: n.night,
      answer: safeTrim(answersMap[String(n.night)] || ""),
    }));
  }, [answersMap]);

  const lastSeen = useMemo(() => formatRelativeDays(updatedAt), [updatedAt]);

  function goStart() {
    if (!startedAt) setStartedAt(now());
    setMode("questions");
    setCurrentNight(1);
  }

  function setAnswer(night: NightId, val: string) {
    setAnswersMap((prev) => ({ ...prev, [String(night)]: val }));
    setUpdatedAt(now());
  }

  function next() {
    const cur = currentNight;
    const curText = safeTrim(answersMap[String(cur)] || "");
    if (!curText) {
      // no agressiu: només fricció mínima
      alert("Escriu una línia (mínim). Si et surt brut, millor.");
      return;
    }

    if (cur < 5) setCurrentNight((cur + 1) as NightId);
    else setMode("report");
  }

  function back() {
    if (currentNight > 1) setCurrentNight((currentNight - 1) as NightId);
    else setMode("landing");
  }

  function resetAll() {
    const ok = confirm("Vols començar de zero? Esborraràs les respostes guardades en aquest dispositiu.");
    if (!ok) return;
    setAnswersMap({ "1": "", "2": "", "3": "", "4": "", "5": "" });
    setStartedAt(undefined);
    setUpdatedAt(undefined);
    setMode("landing");
    setCurrentNight(1);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  function printPdf() {
    // imprimeix només l’informe (CSS print below)
    window.print();
  }

  function exportTxt() {
    const txt = buildPlainTextReport(answersList);
    downloadTxt("tremolor_informe_v2.txt", txt);
  }

  const landing = (
    <div className="min-h-[100svh] w-full px-4 py-10 md:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5 shadow-[0_0_60px_rgba(168,85,247,0.10)]">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-9 w-9 shrink-0 rounded-xl bg-amber-500/15 ring-1 ring-amber-400/30 flex items-center justify-center">
              <span className="text-amber-300 text-lg">!</span>
            </div>
            <div className="text-sm md:text-[15px] leading-relaxed text-white/90">
              <div className="font-semibold text-white">Nota important</div>
              <div className="mt-1 text-white/80">
                Si estàs en crisi o tens idees d’autolesió: <span className="text-white">para aquí</span> i parla amb un
                professional. Això és un complement. <span className="text-white">No</span> una sala d’urgències.
              </div>
            </div>
          </div>
        </div>

        <header className="text-center">
          <h1 className="tremor-title text-5xl md:text-7xl font-extrabold tracking-tight text-white">
            El tremolor
            <br />
            continua<span className="tremor-dot">…</span>
          </h1>

          <p className="mt-7 text-lg md:text-xl text-white/70">
            Això no és un test de personalitat. <span className="text-white/85">És un mirall.</span>
          </p>
          <p className="mt-3 text-base md:text-lg text-white/55">
            Has travessat les 5 Nits al llibre. Ara et toca a tu, en 5 respostes.
          </p>

          <div className="mt-9 flex items-center justify-center gap-3">
            <button
              onClick={goStart}
              className="rounded-2xl bg-white text-black px-7 py-4 text-base md:text-lg font-semibold shadow-lg hover:opacity-95 active:scale-[0.99]"
            >
              Entrar <span className="ml-1">→</span>
            </button>

            {answeredCount > 0 && answeredCount < 5 ? (
              <button
                onClick={() => {
                  setMode("questions");
                  setCurrentNight((answeredCount + 1) as NightId);
                }}
                className="rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-base md:text-lg font-semibold text-white/90 hover:bg-white/8"
              >
                Continuar ({answeredCount}/5)
              </button>
            ) : null}
          </div>

          <div className="mt-10 text-xs md:text-sm text-white/40">
            5 preguntes · 5 minuts · sense registre · es guarda només al teu dispositiu
          </div>

          {answeredCount > 0 ? (
            <div className="mt-4 text-xs md:text-sm text-white/45">
              Última activitat: <span className="text-white/70">{lastSeen ?? "—"}</span>
            </div>
          ) : null}

          <div className="mt-7">
            <button onClick={resetAll} className="text-sm text-white/40 hover:text-white/60 underline underline-offset-4">
              Reiniciar (esborrar respostes)
            </button>
          </div>
        </header>
      </div>
    </div>
  );

  const questions = (() => {
    const meta = NIGHTS.find((x) => x.night === currentNight)!;
    const value = answersMap[String(currentNight)] || "";

    return (
      <div className="min-h-[100svh] w-full px-4 py-10 md:py-14">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between">
            <button onClick={back} className="text-sm text-white/60 hover:text-white/80">
              ← Enrere
            </button>
            <div className="text-sm text-white/55">
              Progrés: <span className="text-white/80 font-semibold">{answeredCount}</span>/5 · {progressPct}%
            </div>
          </div>

          <div className="mb-6 h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-white/70" style={{ width: `${progressPct}%` }} />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8 shadow-[0_0_80px_rgba(168,85,247,0.10)]">
            <div className="text-xs tracking-widest text-white/45">{meta.label}</div>
            <h2 className="mt-3 text-2xl md:text-3xl font-bold text-white">{meta.question}</h2>

            <div className="mt-5">
              <textarea
                value={value}
                onChange={(e) => setAnswer(currentNight, e.target.value)}
                rows={6}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-base md:text-lg text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-purple-400/30"
                placeholder={meta.placeholder}
              />
            </div>

            {/* hints (opcionals, sense fer test de botons) */}
            <div className="mt-4">
              <div className="text-sm text-white/45">Pistes (opcional):</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {meta.hints.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      const cur = answersMap[String(currentNight)] || "";
                      if (!cur.trim()) setAnswer(currentNight, h + " ");
                      else setAnswer(currentNight, cur.trimEnd() + "\n" + h + " ");
                    }}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10"
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-7 flex items-center justify-between">
              <button onClick={resetAll} className="text-sm text-white/35 hover:text-white/55 underline underline-offset-4">
                Esborrar tot
              </button>

              <button
                onClick={next}
                className="rounded-2xl bg-white text-black px-6 py-3 text-base font-semibold shadow hover:opacity-95 active:scale-[0.99]"
              >
                {currentNight < 5 ? "Següent" : "Veure l’informe"} →
              </button>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/55 leading-relaxed">
            <span className="text-white/75 font-semibold">Recorda:</span> això no substitueix teràpia, medicació ni cap professional.
            Si estàs en crisi, para aquí i demana ajuda.
          </div>
        </div>
      </div>
    );
  })();

  const report = (
    <div className="min-h-[100svh] w-full px-4 py-10 md:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between print-hide">
          <button
            onClick={() => setMode("landing")}
            className="text-sm text-white/60 hover:text-white/80"
          >
            ← Inici
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={exportTxt}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Descarregar .txt
            </button>
            <button
              onClick={printPdf}
              className="rounded-xl bg-white text-black px-4 py-2 text-sm font-semibold hover:opacity-95"
            >
              PDF (imprimir)
            </button>
          </div>
        </div>

        <div className="mb-7 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5 shadow-[0_0_60px_rgba(168,85,247,0.10)]">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-9 w-9 shrink-0 rounded-xl bg-amber-500/15 ring-1 ring-amber-400/30 flex items-center justify-center">
              <span className="text-amber-300 text-lg">!</span>
            </div>
            <div className="text-sm md:text-[15px] leading-relaxed text-white/90">
              <div className="font-semibold text-white">Nota important</div>
              <div className="mt-1 text-white/80">
                Si estàs en crisi o tens idees d’autolesió: <span className="text-white">para aquí</span> i parla amb un
                professional. Això és un complement. <span className="text-white">No</span> una sala d’urgències.
              </div>
            </div>
          </div>
        </div>

        <div ref={reportRef} className="print-area">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">El teu informe</h1>
          <p className="mt-2 text-white/65">
            Cinc nits. Cinc miralls. No està “bé” ni “malament”. Està escrit. I això ja és un canvi.
          </p>

          <div className="mt-8 space-y-6">
            {NIGHTS.map((n) => {
              const raw = answersMap[String(n.night)] || "";
              const ans = safeTrim(raw);
              const m = mirrorForNight(n.night, ans);

              return (
                <section
                  key={n.night}
                  className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8 shadow-[0_0_80px_rgba(168,85,247,0.08)]"
                >
                  <div className="text-xs tracking-widest text-white/45">{n.label}</div>
                  <h2 className="mt-3 text-xl md:text-2xl font-bold text-white">{n.question}</h2>

                  <div className="mt-5 text-sm text-white/45">El que has escrit</div>
                  <div className="mt-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-base md:text-lg text-white/90">
                    {ans || "—"}
                  </div>

                  <div className="mt-5 text-sm text-white/45">Mirall (reformulat)</div>
                  <div className="mt-2 rounded-2xl border border-purple-400/15 bg-gradient-to-b from-purple-500/15 to-black/25 px-5 py-5 text-white/90">
                    <div className="text-white font-semibold">{m.lead}</div>
                    <div className="mt-3 space-y-3 text-white/85 leading-relaxed">
                      {m.body.map((p, idx) => (
                        <p key={idx}>{p}</p>
                      ))}
                    </div>

                    <div className="mt-4">
                      <span className="font-semibold text-amber-300">Traducció:</span>{" "}
                      <span className="text-white/85">{m.translation}</span>
                    </div>

                    <div className="mt-5 text-white font-semibold">{m.closingQ}</div>
                  </div>
                </section>
              );
            })}
          </div>

          {/* COP FINAL (sense etiquetes internes) */}
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8 shadow-[0_0_90px_rgba(168,85,247,0.10)]">
            <h3 className="text-xl md:text-2xl font-bold text-white">I ara, el pas</h3>
            <p className="mt-3 text-white/80 leading-relaxed">
              No et trauré el dolor. Però sí una part de l’autoengany: el que et fa creure que “aguantar” és viure.
            </p>
            <p className="mt-3 text-white/80 leading-relaxed">
              Et demano una cosa petita i real: <span className="text-white font-semibold">un 5% de vida sense control</span>.
              Una acció en 24h. Imperfecta. Però teva.
            </p>
            <p className="mt-3 text-white/75 leading-relaxed">
              Si et tremola una mica, és bona senyal: vol dir que no és postureig.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-4 md:p-5">
              <div className="text-sm text-white/60">Proposta concreta (24h)</div>
              <div className="mt-2 text-white/90 text-base md:text-lg">
                Escriu una frase a algú (o a tu mateix/a) que normalment et costaria:
                <span className="block mt-2 text-white font-semibold">
                  “No ho sé.” / “Necessito ajuda.” / “Avui no puc.” / “Em fa por.”
                </span>
              </div>
            </div>
          </div>

          {/* Nivell següent (ètic, valor, clatellot amorós) */}
          <div className="mt-10 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-purple-500/10 p-6 md:p-8 shadow-[0_0_90px_rgba(168,85,247,0.12)] print-hide">
            <h3 className="text-xl md:text-2xl font-bold text-white">Si vols anar un nivell més endins</h3>
            <p className="mt-3 text-white/80 leading-relaxed">
              Aquest informe és un mirall curt: et posa davant del guió. El següent nivell és quan el guió
              <span className="text-white font-semibold"> es converteix en mapa</span> i tens un pla pràctic perquè no quedi en “ja ho miraré”.
            </p>
            <p className="mt-3 text-white/75 leading-relaxed">
              No prometo motivació. Prometo claredat. I un cop de realitat amb respecte.
            </p>

            <div className="mt-6 flex flex-col md:flex-row gap-3">
              <a
                href="/pro"
                className="inline-flex items-center justify-center rounded-2xl bg-white text-black px-6 py-3 text-base font-semibold hover:opacity-95"
              >
                Desbloquejar Tremolor Complet →
              </a>
              <button
                onClick={() => alert("Encara no està activat. Quan ho vulguis, el connectem sense fer circ.")}
                className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-6 py-3 text-base font-semibold text-white/90 hover:bg-white/10"
              >
                Vull avis quan estigui llest
              </button>
            </div>

            <div className="mt-4 text-sm text-white/55">
              Ètic i simple: si no et serveix, no el facis. No hi ha fum aquí.
            </div>
          </div>

          <div className="mt-10 print-hide">
            <button onClick={resetAll} className="text-sm text-white/45 hover:text-white/70 underline underline-offset-4">
              Reiniciar i esborrar respostes
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-[100svh] w-full bg-black text-white">
      {/* background subtil (amb to) */}
      <div className="pointer-events-none fixed inset-0 opacity-90">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(168,85,247,0.20),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.05),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black" />
      </div>

      <div className="relative">
        {mode === "landing" ? landing : null}
        {mode === "questions" ? questions : null}
        {mode === "report" ? report : null}
      </div>

      {/* tremolor + print styles */}
      <style jsx global>{`
        .tremor-title {
          animation: tremor 2.4s infinite;
          transform-origin: center;
        }
        .tremor-dot {
          display: inline-block;
          animation: tremorDot 1.2s infinite;
        }

        @keyframes tremor {
          0% { transform: translate(0, 0) rotate(0deg); }
          2% { transform: translate(-1px, 0) rotate(-0.2deg); }
          4% { transform: translate(2px, -1px) rotate(0.25deg); }
          6% { transform: translate(-2px, 1px) rotate(-0.25deg); }
          8% { transform: translate(1px, 0) rotate(0.15deg); }
          10% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }

        @keyframes tremorDot {
          0%, 100% { transform: translateY(0); opacity: 0.85; }
          50% { transform: translateY(-2px); opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .tremor-title, .tremor-dot {
            animation: none !important;
          }
        }

        /* PRINT: només imprimeix l’informe */
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .print-hide {
            display: none !important;
          }
          .print-area {
            color: black !important;
          }
          .print-area * {
            color: black !important;
            text-shadow: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </main>
  );
}
