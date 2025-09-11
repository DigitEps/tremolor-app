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
const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export default function InformePage() {
  const router = useRouter();
  const [raw, setRaw] = useState<Answer[]>([]);

  // Carrega respostes del LocalStorage
  useEffect(() => {
    try {
      const payload = localStorage.getItem("tremor.answers.v1");
      const arr = payload ? JSON.parse(payload) : [];
      setRaw(Array.isArray(arr) ? arr : []);
    } catch { setRaw([]); }
  }, []);

  // Desduplica per (part, pregunta) mantenint la més nova
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

  // Comptes globals
  const counts = { ombra:0, ego:0, tu:0 } as Record<"ombra"|"ego"|"tu", number>;
  answers.forEach(a => { const d = norm(a.dominant); if (d) counts[d]++; });
  const total = PARTS.length*TOTAL_PER_PART;
  const progress = Math.round((answers.length/total)*100);
  const domEntry = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0] as [("ombra"|"ego"|"tu"), number] | undefined;
  const dominantVoice = domEntry?.[0] ?? "—";
  const dominantCount = domEntry?.[1] ?? 0;

  // Agrupat per part
  const grouped = useMemo(() => {
    const g: Record<string, Answer[]> = {};
    for (const p of PARTS) g[p] = [];
    for (const a of answers) g[a.partKey]?.push(a);
    for (const p of PARTS) g[p].sort((A,B)=>byNewest(B.createdAt,A.createdAt));
    return g;
  }, [answers]);

  // Detecció simple de patrons
  const textAll = (answers.map(a => `${a.question} ${a.response || ""}`)).join(" ").toLowerCase();
  const peoplePleaser   = has(textAll, ["amable amb tothom","agradar","complaure","caure bé","plaure"]);
  const controlPattern  = has(textAll, ["controlar-ho tot","control"]);
  const scarcityPattern = has(textAll, ["pèrdua econòmica","guerra","diners","escassetat","deute","por de perdre"]);
  const anesthesiaCycle = has(textAll, ["fumar","beure","alcohol","cigar","nostàlgia","tristesa"]);
  const invisibility    = has(textAll, ["no ser vist","invisible","llop solitari","ningú em veu"]);
  const touchBottom     = has(textAll, ["tocar fons","toco fons","col·lapse"]);
  const fearLoseAll     = has(textAll, ["perdria tot","perdre-ho tot","ho perdré tot"]);

  // Lectura per parts + microacció
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

  // Resum executiu
  const loopName    = anesthesiaCycle ? "nostàlgia → tristesa → anestèsia (fumar/beure)" : "evitació → dispersió → esgotament";
  const coreWound   = invisibility ? "invisibilitat (et sobre-adaptes per ser vist)" : "rebuig (por a no ser prou)";
  const keyDefense  = controlPattern ? "control (Ego) per por d'escassetat" : "hiperresponsabilitat (Ego) per evitar el caos";
  const shortestLever = invisibility
    ? "visibilitat sana + límits petits + substitució d'anestèsia"
    : "coherència diària + microcompromisos + descans real";

  // Markdown export
  const buildMarkdown = () => {
    let md = `# 🧭 Com llegir el TEU informe\n\n`;
    md += `Veu dominant global: **${capitalize(dominantVoice)} (${dominantCount}/15)**\n`;
    md += `\n## Lectura per parts (telegràfica + 1 microacció)\n`;
    for (const pr of partReadings) {
      md += `\n**${pr.title}**\n\n`;
      pr.lines.forEach(l => md += `- ${l}\n`);
    }
    md += `\n## 🛠️ El que t'aporta personalment (resum executiu)\n`;
    md += `- **Nom del teu bucle**: ${loopName}.\n`;
    md += `- **Ferida mare**: ${coreWound}.\n`;
    md += `- **Defensa clau**: ${keyDefense}.\n`;
    md += `- **Palanca més curta**: ${shortestLever}.\n`;
    return md;
  };

  const download = (name:string, text:string, mime="text/markdown")=>{
    const blob = new Blob([text], {type: mime});
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {href:url, download:name});
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };
  const handleCopyMD = async ()=>{
    const md = buildMarkdown();
    try { await navigator.clipboard.writeText(md); alert("Informe copiat (Markdown)."); }
    catch { download("informe-tremolor.md", md); }
  };
  const handleDownloadMD = ()=> download("informe-tremolor.md", buildMarkdown());

  return (
    <main className="min-h-screen px-6 py-12 bg-black text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Informe del Tremolor</h1>
          <div className="flex flex-wrap gap-2">
            <button onClick={()=>router.push("/dashboard")} className="px-3 py-2 rounded bg-white/10 border border-white/10 text-sm">← Tornar</button>
            <button onClick={handleCopyMD} className="px-3 py-2 rounded bg-white/10 border border-white/10 text-sm">Copiar (MD)</button>
            <button onClick={handleDownloadMD} className="px-3 py-2 rounded bg-white/10 border border-white/10 text-sm">Descarregar .MD</button>
            <button onClick={()=>window.print()} className="px-3 py-2 rounded bg-white/10 border border-white/10 text-sm">Imprimir / PDF</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded bg-white/5 border border-white/10">
            <p className="text-sm opacity-70">Progrés</p>
            <p className="text-2xl font-bold">{progress}%</p>
          </div>
          <div className="p-6 rounded bg-white/5 border border-white/10">
            <p className="text-sm opacity-70">Veu dominant global</p>
            <p className="text-2xl font-bold capitalize">{capitalize(dominantVoice)} ({dominantCount}/15)</p>
          </div>
          <div className="p-6 rounded bg-white/5 border border-white/10">
            <p className="text-sm opacity-70">Respostes</p>
            <p className="text-2xl font-bold">{answers.length}/{total}</p>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">🧭 Com llegir el TEU informe</h2>
          <ul className="list-disc pl-6 text-sm space-y-1">
            {controlPattern && <li>Patró de control (Ego).</li>}
            {scarcityPattern && <li>Por d'escassetat / relat d'escassetat actiu.</li>}
            {anesthesiaCycle && <li>Cicle d'anestèsia (evitació amb substàncies o dopamina ràpida).</li>}
            {invisibility && <li>Ferida d'invisibilitat (no ser vist / llop solitari).</li>}
          </ul>
        </section>

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
            <li><strong>Nom del teu bucle:</strong> {loopName}.</li>
            <li><strong>Ferida mare:</strong> {coreWound}.</li>
            <li><strong>Defensa clau:</strong> {keyDefense}.</li>
            <li><strong>Palanca més curta:</strong> {shortestLever}.</li>
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