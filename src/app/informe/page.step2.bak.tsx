"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Answer = {
  partKey: string;
  question: string;
  response?: string;
  dominant?: string;
  createdAt?: string;
};

const PARTS = [
  "Part I - Qui ets?",
  "Part II - D'on véns?",
  "Part III - Cap a on vas?",
  "Part IV - Què tems?",
  "Part V - Com creixes?",
];
const TOTAL_PER_PART = 3;

const byNewest = (a?: string, b?: string) => {
  const ta = a ? Date.parse(a) : 0;
  const tb = b ? Date.parse(b) : 0;
  return tb - ta;
};
const norm = (v?: string) => {
  if (!v) return null;
  const s = v.toLowerCase().trim();
  if (["ombra","shadow"].includes(s)) return "ombra";
  if (["ego"].includes(s)) return "ego";
  if (["tu","you"].includes(s)) return "tu";
  return null;
};
const has = (text?: string, kws: string[] = []) => {
  if (!text) return false;
  const s = text.toLowerCase();
  return kws.some(k => s.includes(k.toLowerCase()));
};
const snippet = (s?: string, n=200) =>
  (s || "").replace(/\s+/g," ").trim().slice(0,n) + ((s || "").length > n ? "…" : "");
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// Try to pull a concrete phrase from user answers for personalization
const pickFromAnswers = (answers: Answer[], kws: string[], n=140) => {
  for (const a of answers) {
    const t = `${a.question} ${a.response || ""}`.toLowerCase();
    if (kws.some(k => t.includes(k.toLowerCase()))) {
      const raw = a.response || a.question;
      return (raw || "").replace(/\s+/g," ").trim().slice(0,n);
    }
  }
  return "";
};

export default function InformePage() {
  const router = useRouter();
  const [raw, setRaw] = useState<Answer[]>([]);
  const [email, setEmail] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load answers and email
  useEffect(() => {
    try {
      const payload = localStorage.getItem("tremor.answers.v1");
      const arr = payload ? JSON.parse(payload) : [];
      setRaw(Array.isArray(arr) ? arr : []);
      
      const savedEmail = localStorage.getItem("tremor.email");
      if (savedEmail) setEmail(savedEmail);
    } catch { setRaw([]); }
  }, []);

  // Dedupe latest by (part, question)
  const answers = useMemo(() => {
    const map = new Map<string, Answer>();
    for (const a of raw) {
      if (!a?.partKey || !a?.question) continue;
      const key = `${a.partKey}||${a.question}`;
      const prev = map.get(key);
      if (!prev || byNewest(a.createdAt, prev.createdAt) < 0) map.set(key,a);
    }
    return [...map.values()];
  }, [raw]);

  // Global metrics
  const counts = { ombra:0, ego:0, tu:0 } as Record<"ombra"|"ego"|"tu", number>;
  answers.forEach(a => { const d = norm(a.dominant); if (d) counts[d]++; });
  const total = PARTS.length*TOTAL_PER_PART;
  const progress = Math.round((answers.length/total)*100);
  const domEntry = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0] as [("ombra"|"ego"|"tu"), number] | undefined;
  const dominantVoice = domEntry?.[0] ?? "—";
  const dominantCount = domEntry?.[1] ?? 0;

  // Grouped
  const grouped = useMemo(() => {
    const g: Record<string, Answer[]> = {};
    for (const p of PARTS) g[p] = [];
    for (const a of answers) g[a.partKey]?.push(a);
    for (const p of PARTS) g[p].sort((A,B)=>byNewest(B.createdAt,A.createdAt));
    return g;
  }, [answers]);

  // Pattern flags
  const textAll = (answers.map(a => `${a.question} ${a.response || ""}`)).join(" ").toLowerCase();
  const peoplePleaser   = has(textAll, ["amable amb tothom","agradar","complaure","caure bé","plaure"]);
  const controlPattern  = has(textAll, ["controlar-ho tot","control"]);
  const scarcityPattern = has(textAll, ["pèrdua econòmica","guerra","diners","escassetat","deute","por de perdre"]);
  const anesthesiaCycle = has(textAll, ["fumar","beure","alcohol","cigar","nostàlgia","tristesa"]);
  const invisibility    = has(textAll, ["no ser vist","invisible","llop solitari","ningú em veu"]);
  const touchBottom     = has(textAll, ["tocar fons","toco fons","col·lapse"]);
  const fearLoseAll     = has(textAll, ["perdria tot","perdre-ho tot","ho perdré tot"]);

  // --- Preview Markdown (what page shows / copy button copies) ---
  const buildPreviewMD = () => {
    const partLines = (title: string, lines: string[]) =>
      `\n**${title}**\n\n` + lines.map(l=>`- ${l}`).join("\n") + "\n";
    const blocks: string[] = [];

    const section = (title: string, lines: string[]) => blocks.push(partLines(title, lines));

    section("I. Qui ets?", [
      peoplePleaser ? "Tens claredat: «ser amable amb tothom» és màscara; vols límits."
                    : "Estàs afinant identitat: vols coherència i límits clars.",
      "Risc: agradar per no ser rebutjat.",
      "Microacció: avui **1 NO petit** on normalment diries sí.",
    ]);
    section("II. D'on véns?", [
      controlPattern ? "Ego controla per seguretat — és una memòria de protecció."
                     : "Tens trams del passat que encara regulen reaccions.",
      scarcityPattern ? "El relat d'escassetat/«guerra» continua actiu de fons."
                      : "Posa nom als patrons familiars per desactivar-los.",
      "Microacció: identifica **1 situació** on controles per por i **delega 1 detall**.",
    ]);
    section("III. Cap a on vas?", [
      anesthesiaCycle ? "Has posat nom al **loop d'anestèsia** (nostàlgia→tristesa→fumar/beure)."
                      : "Sense direcció clara hi ha dispersió — defineix un far simple.",
      "Microacció: quan vingui l'impuls, **regla 10'** + respiració 4-4-6 + passeig curt.",
    ]);
    section("IV. Què tems?", [
      invisibility ? "Ferida central: **invisibilitat** («no ser vist», «llop solitari»)."
                   : "La por principal és no ser reconegut en la teva veritat.",
      "Microacció: **acte de visibilitat** diari (missatge honest o demanar ajuda concreta).",
    ]);
    section("V. Com creixes?", [
      (touchBottom || fearLoseAll) ? "Creença: «només canvio si **toco fons**» + por a «**perdre-ho tot**» si integres l'Ombra."
                                   : "Creixement sostingut > heroïcitats puntuals. La clau és el llindar mínim.",
      "Microacció: defineix un **llindar mínim** (2' escriptura o 10' caminar) i compleix-lo 7 dies.",
    ]);

    return (
`# 🧭 Com llegir el TEU informe

Veu dominant global: **${cap(dominantVoice)} (${dominantCount}/15)**
Progrés: **${progress}%**

## Lectura per parts (telegràfica + 1 microacció)
` + blocks.join("") + `
## 🛠️ Resum executiu
- **Nom del teu bucle**: ${anesthesiaCycle ? "nostàlgia → tristesa → anestèsia (fumar/beure)" : "evitació → dispersió → esgotament"}.
- **Ferida mare**: ${invisibility ? "invisibilitat (et sobre-adaptes per ser vist)" : "rebuig (por a no ser prou)"}.
- **Defensa clau**: ${controlPattern ? "control (Ego) per por d'escassetat" : "hiperresponsabilitat (Ego) per evitar el caos"}.
- **Palanca més curta**: ${invisibility ? "visibilitat sana + límits petits + substitució d'anestèsia" : "coherència diària + microcompromisos + descans real"}.
`
    );
  };

  // --- Enriched Full Plan (sent by email & downloadable after email) ---
  const buildFullPlanMD = () => {
    const maskEx = pickFromAnswers(answers, ["màscara","amable"]);
    const loopEx = pickFromAnswers(answers, ["fumar","beure","nostàlgia","tristesa"]);
    const invisEx = pickFromAnswers(answers, ["invisible","no ser vist","llop solitari"]);
    const controlEx = pickFromAnswers(answers, ["controlar-ho tot","control"]);

    const day = (n:number, title:string, items:string[]) =>
      `### Day ${n} — ${title}\n` + items.map(i=>`- [ ] ${i}`).join("\n") + "\n\n";

    const plan =
      day(1, "Identitat i límits",
        [
          "Un **NO petit** on diries sí.",
          maskEx ? `Nota de màscara detectada: "${maskEx}".` : "Detecta 1 màscara recurrent i escriu-la.",
          "3' de respiració 4-4-6 abans d'una decisió.",
        ]) +
      day(2, "Trencar el loop d'anestèsia",
        [
          "Franja de **24 h** sense fumar/beure.",
          "Quan piqui: **Regla 10'** + caminar 10'.",
          loopEx ? `Nom del teu loop: "${loopEx}".` : "Posa nom al teu loop (3 paraules).",
        ]) +
      day(3, "Límit amb algú clau",
        [
          "Comunica 1 límit en **1 frase** (amable i ferm).",
          "Petita recompensa sana després.",
        ]) +
      day(4, "Escassetat fora",
        [
          "Ordre/neteja d'1 objecte-àncora del passat.",
          "Revisió finances 20' i una acció (cancel·lar, ajustar, estalviar).",
        ]) +
      day(5, "Direcció i far",
        [
          "Escriu la teva **frase far** (1 línia).",
          "**Pas de 15'** que t'hi acosta (agenda'l).",
        ]) +
      day(6, "Visibilitat sana",
        [
          "Missatge honest a 1 persona (agraïment o demanar ajuda).",
          invisEx ? `Recordatori: vas escriure "${invisEx}".` : "Dóna nom a la teva por d'invisibilitat.",
        ]) +
      day(7, "Tancament i hàbit mínim",
        [
          "Revisió: què ha funcionat? (3 línies).",
          "Defineix **hàbit mínim setmanal** (p.ex. 2' escriure / 10' caminar).",
        ]);

    const ifThen = `
## If–Then Rescue Scripts
- **If** ganes de fumar/beure **then** posa un temporitzador de 10' i fes 5 cicles 4-4-6 + camina 10'.
- **If** sents invisibilitat **then** envia un text honest a 1 persona de confiança ("Avui em costa, em dones un cop de mà?").
- **If** urges de control **then** delega 1 detall i registra què passa (${controlEx ? `exemple: "${controlEx}"` : "exemple propi"}).
`;

    const tracker = `
## 7-Day Habit Tracker
| Day | Key Action | Done |
|-----|------------|------|
| 1 | NO petit + 4-4-6 |   |
| 2 | 24h sense + 10' rule |   |
| 3 | Límits 1 frase |   |
| 4 | Ordre + finances 20' |   |
| 5 | Pas de 15' cap al far |   |
| 6 | Missatge honest |   |
| 7 | Revisió + hàbit mínim |   |
`;

    const sos = `
## Targeta SOS (3 passos)
1) **Atura** (10s cos quiet).  
2) **Respira 4-4-6** ×5.  
3) **Pregunta**: "Què necessito de veritat ara?" i fes el **pas més petit**.
`;

    return (
`# Tremolor — Enriched 7-Day Plan

Progress: **${progress}%** · Dominant: **${cap(dominantVoice)} (${dominantCount}/15)**

${plan}
${ifThen}
${tracker}
${sos}
`
    );
  };

  // Actions (copy/download/print and email)
  const download = (name:string, text:string, mime="text/markdown")=>{
    const blob = new Blob([text], {type: mime});
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {href:url, download:name});
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const copyPreview = async ()=>{
    const md = buildPreviewMD();
    try { await navigator.clipboard.writeText(md); alert("Preview copied (Markdown)."); }
    catch { download("tremolor-preview.md", md); }
  };

  const validEmail = (s:string)=>/\S+@\S+\.\S+/.test(s);
  const sendPlan = async ()=>{
    setError(null);
    if (!validEmail(email)) { setError("Introdueix un correu vàlid."); return; }
    setSending(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          progress,
          dominantVoice,
          markdownFull: buildFullPlanMD(),
          answers,
          createdAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Error d'enviament");
      setSent(true);
      localStorage.setItem("tremor.email", email);
    } catch (e:any) {
      setError(e?.message || "No s'ha pogut enviar.");
    } finally { setSending(false); }
  };

  const downloadFullIfAllowed = ()=>{
    const saved = localStorage.getItem("tremor.email");
    if (!saved && !sent) { setError("Deixa el teu correu per rebre i desbloquejar el Pla complet."); return; }
    download("tremolor-enriched-plan.md", buildFullPlanMD());
  };

  // Per-part preview blocks (unchanged from original)
  const partReadings: Array<{title:string, lines:string[]}> = [
    {
      title: "I. Qui ets?",
      lines: [
        peoplePleaser
          ? "Tens claredat: «ser amable amb tothom» és màscara; vols límits."
          : "Estàs afinant identitat: vols coherència i límits clars.",
        "Risc: agradar per no ser rebutjat.",
        "Microacció: avui **1 NO petit** on normalment diries sí.",
      ],
    },
    {
      title: "II. D'on véns?",
      lines: [
        controlPattern
          ? "Ego controla per seguretat — és una memòria de protecció."
          : "Tens trams del passat que encara regulen reaccions.",
        scarcityPattern
          ? "El relat d'escassetat/«guerra» continua actiu de fons."
          : "Posa nom als patrons familiars per desactivar-los.",
        "Microacció: identifica **1 situació** on controles per por i **delega 1 detall**.",
      ],
    },
    {
      title: "III. Cap a on vas?",
      lines: [
        anesthesiaCycle
          ? "Has posat nom al **loop d'anestèsia** (nostàlgia→tristesa→fumar/beure)."
          : "Sense direcció clara hi ha dispersió — defineix un far simple.",
        "Microacció: quan vingui l'impuls, **regla 10'** + respiració 4-4-6 + passeig curt.",
      ],
    },
    {
      title: "IV. Què tems?",
      lines: [
        invisibility
          ? "Ferida central: **invisibilitat** («no ser vist», «llop solitari»)."
          : "La por principal és no ser reconegut en la teva veritat.",
        "Microacció: **acte de visibilitat** diari (missatge honest o demanar ajuda concreta).",
      ],
    },
    {
      title: "V. Com creixes?",
      lines: [
        (touchBottom || fearLoseAll)
          ? "Creença: «només canvio si **toco fons**» + por a «**perdre-ho tot**» si integres l'Ombra."
          : "Creixement sostingut > heroïcitats puntuals. La clau és el llindar mínim.",
        "Microacció: defineix un **llindar mínim** (2' escriptura o 10' caminar) i compleix-lo 7 dies.",
      ],
    },
  ];

  // UI
  return (
    <main className="min-h-screen px-6 py-12 bg-black text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Informe del Tremolor</h1>
          <div className="flex flex-wrap gap-2">
            <button onClick={()=>router.push("/dashboard")} className="px-3 py-2 rounded bg-white/10 border border-white/10 text-sm">← Tornar</button>
            <button onClick={copyPreview} className="px-3 py-2 rounded bg-white/10 border border-white/10 text-sm">Copiar Preview (MD)</button>
            <button onClick={()=>window.print()} className="px-3 py-2 rounded bg-white/10 border border-white/10 text-sm">Imprimir Preview</button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded bg-white/5 border border-white/10"><p className="text-sm opacity-70">Progrés</p><p className="text-2xl font-bold">{progress}%</p></div>
          <div className="p-6 rounded bg-white/5 border border-white/10"><p className="text-sm opacity-70">Veu dominant</p><p className="text-2xl font-bold capitalize">{cap(dominantVoice)} ({dominantCount}/15)</p></div>
          <div className="p-6 rounded bg-white/5 border border-white/10"><p className="text-sm opacity-70">Respostes</p><p className="text-2xl font-bold">{answers.length}/{total}</p></div>
        </div>

        {/* Email capture & value prop */}
        <section className="bg-white/5 border border-white/10 rounded p-4 space-y-3">
          <div className="text-sm opacity-90">
            Get your **Enriched 7-Day Plan** by email (includes: daily checklist, If-Then SOS scripts, 7-day habit tracker, personalized notes).  
            After sending, you'll unlock the **Download .MD (Full Plan)** button below.
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              placeholder="you@email.com"
              className="px-3 py-2 rounded bg-black/40 border border-white/15 flex-1"
            />
            <button onClick={sendPlan} disabled={sending} className="px-3 py-2 rounded bg-white/10 hover:bg-white/15 border border-white/10 text-sm">
              {sending ? "Enviant…" : "Send me the Full Plan"}
            </button>
            <button onClick={downloadFullIfAllowed} className="px-3 py-2 rounded bg-white/10 hover:bg-white/15 border border-white/10 text-sm">
              Download .MD (Full Plan)
            </button>
          </div>
          {error && <div className="text-xs text-red-400">{error}</div>}
          {sent && <div className="text-xs text-green-400">✅ Sent. Check your inbox (and spam folder).</div>}
        </section>

        {/* Preview (unchanged) */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">🧭 Com llegir el TEU informe (Preview)</h2>
          <ul className="list-disc pl-6 text-sm space-y-1">
            {controlPattern && <li>Patró de control (Ego).</li>}
            {scarcityPattern && <li>Por d&apos;escassetat / relat d&apos;escassetat actiu.</li>}
            {anesthesiaCycle && <li>Cicle d&apos;anestèsia (evitació amb substàncies o dopamina ràpida).</li>}
            {invisibility && <li>Ferida d&apos;invisibilitat (no ser vist / llop solitari).</li>}
          </ul>
        </section>

        {/* Per-part preview blocks and executive summary remain the same as before */}
        <section className="space-y-4">
          <h3 className="font-semibold">Lectura per parts (telegràfica + 1 microacció)</h3>
          {partReadings.map((pr, idx)=>(
            <div key={idx} className="bg-white/5 border border-white/10 rounded p-4">
              <div className="font-medium mb-1">{pr.title}</div>
              <ul className="list-disc pl-6 text-sm space-y-1">
                {pr.lines.map((l,i)=>(<li key={i} dangerouslySetInnerHTML={{__html:l}} />))}
              </ul>
            </div>
          ))}
        </section>

        <section className="space-y-2">
          <h3 className="font-semibold">🛠️ Resum executiu</h3>
          <ul className="list-disc pl-6 text-sm space-y-1">
            <li><strong>Nom del teu bucle:</strong> {anesthesiaCycle ? "nostàlgia → tristesa → anestèsia (fumar/beure)" : "evitació → dispersió → esgotament"}.</li>
            <li><strong>Ferida mare:</strong> {invisibility ? "invisibilitat (et sobre-adaptes per ser vist)" : "rebuig (por a no ser prou)"}.</li>
            <li><strong>Defensa clau:</strong> {controlPattern ? "control (Ego) per por d'escassetat" : "hiperresponsabilitat (Ego) per evitar el caos"}.</li>
            <li><strong>Palanca més curta:</strong> {invisibility ? "visibilitat sana + límits petits + substitució d'anestèsia" : "coherència diària + microcompromisos + descans real"}.</li>
          </ul>
        </section>

        <details className="bg-white/5 border border-white/10 rounded">
          <summary className="cursor-pointer select-none px-4 py-3 font-medium">Veure respostes</summary>
          <div className="px-4 pb-4 space-y-2">
            {PARTS.map(p=>(
              <div key={p} className="text-sm">
                <div className="opacity-80 font-medium mt-3">{p}</div>
                {(grouped[p] || []).map((a,i)=>(
                  <div key={i} className="mt-1 border border-white/10 rounded p-2">
                    <div className="opacity-70">Q: {a.question}</div>
                    <div>Tu: {snippet(a.response, 260)}</div>
                    <div className="text-xs opacity-60">Dominant: {a.dominant ?? "—"}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </details>
      </div>
    </main>
  );
}