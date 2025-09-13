"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import VoiceAnalysisChart from "@/components/VoiceAnalysisChart";
import TestimonialsSection from "@/components/TestimonialsSection";
import { ProfessionalPDFGenerator, type ReportData } from "@/utils/pdfGenerator";

type Answer = {
  partKey: string;
  question: string;
  response: string;
  dominant: string;
  createdAt: string;
};

function norm(s?: string) { return (s ?? "").toLowerCase().normalize("NFC"); }
function trimLen(s: string, n = 140) { const t = (s || "").trim(); return t.length > n ? t.slice(0, n-1) + "…" : t; }
function escapeMd(s: string) {
  return (s || "")
    .replace(/\|/g, "\\|")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\r?\n/g, " "); // single line in tables/lists
}
function pickLast(answers: Answer[], qFrag: string) {
  const f = norm(qFrag);
  for (let i = answers.length - 1; i >= 0; i--) {
    if (norm(answers[i]?.question).includes(f)) return answers[i]?.response || "";
  }
  return "";
}
function statsFrom(answers: Answer[]) {
  const total = 15;
  const completed = answers?.length || 0;
  const progress = Math.round((completed / total) * 100);
  const counts: Record<string, number> = {};
  answers.forEach(a => { const k = (a?.dominant || "").toLowerCase(); counts[k] = (counts[k] || 0) + 1; });
  const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  const dominantVoice = entries[0]?.[0] || "—";
  const percent = (k: string) => Math.round(((counts[k] || 0) / (answers.length || 1)) * 100);
  return { progress, completed, dominantVoice, counts, percent };
}

function buildPreviewMd(answers: Answer[]) {
  const st = statsFrom(answers);
  const mask = trimLen(escapeMd(pickLast(answers, "màscara")));
  const loop = trimLen(escapeMd(pickLast(answers, "loop")));
  const fear = trimLen(escapeMd(pickLast(answers, "invisible") || pickLast(answers,"por") || pickLast(answers,"ser descobert")));
  const control = trimLen(escapeMd(answers.find(a => norm(a.response).includes("control"))?.response || ""));

  return `# Mapa del Tremolor — Vista prèvia

- Progrés: **${st.progress}%**
- Veu dominant: **${capitalize(st.dominantVoice)}**
- Respostes: **${st.completed}/15**

## 🧭 Lectura ràpida
- Màscara: **${mask || "—"}**
- Cicle d'anestèsia: **${loop || "—"}**
- Ferida/por central: **${fear || "—"}**
- Patró de control (Ego): **${control || "—"}**

> Descarrega el **Pla Enriquit (.MD)** per checklist diari, scripts SOS, registre d'hàbits i notes.
`; }

function buildFullPlanMd(answers: Answer[]) {
  const st = statsFrom(answers);
  const mask = trimLen(escapeMd(pickLast(answers, "màscara")));
  const whoWhenNone = trimLen(escapeMd(pickLast(answers, "ningú mira")));
  const loop = trimLen(escapeMd(pickLast(answers, "loop")));
  const direction = trimLen(escapeMd(pickLast(answers, "direcció")));
  const fear = trimLen(escapeMd(pickLast(answers, "invisible") || pickLast(answers,"por") || pickLast(answers,"ser descobert")));
  const control = trimLen(escapeMd(answers.find(a => norm(a.response).includes("control"))?.response || ""));

  return `# Tremolor — Pla Enriquit de 7 dies (personalitzat)

Progrés: **${st.progress}%** · Veu dominant: **${capitalize(st.dominantVoice)} (${st.completed}/15)**

## 🧭 Com llegir el TEU informe
- **Màscara**: ${mask || "—"}
- **Cicle d'anestèsia**: ${loop || "—"}
- **Ferida central**: ${fear || "—"}
- **Patró de control (Ego)**: ${control || "—"}

### Context
- Quan ningú mira ets: **${whoWhenNone || "—"}**
- Sense direcció → **${direction || "—"}**

---

## ✅ Pla de 7 dies

### Dia 1 — Identitat i límits
- [ ] Avui, **1 NO petit** on diries sí.
- [ ] Nota de màscara: "${mask || "—"}".
- [ ] **Respiració 4-4-6** 3'.

### Dia 2 — Trencar el loop
- [ ] **24 h** sense fumar/beure.
- [ ] Regla **10'** + 5 cicles **4-4-6** + **caminar 10'**.
- [ ] Nom curt del loop: "${loop || "—"}".

### Dia 3 — Límit amb algú clau
- [ ] **1 límit en 1 frase** (amable i ferm).
- [ ] **Recompensa sana** després.

### Dia 4 — Escassetat fora
- [ ] Neteja d'**1 objecte-àncora** del passat.
- [ ] **Finances 20'**: una acció (cancel·lar/ajustar/estalviar).

### Dia 5 — Direcció i far
- [ ] Escriu **frase far** (1 línia).
- [ ] **Pas de 15'** que t'hi acosta (agenda'l avui).

### Dia 6 — Visibilitat sana
- [ ] Acte de **visibilitat** (missatge honest / demanar ajuda).
- [ ] Recordatori: "${fear || "—"}".

### Dia 7 — Tancament i hàbit mínim
- [ ] Revisió (3 línies).
- [ ] **Llindar mínim** 7 dies (2' escriure / 10' caminar).

---

## 🆘 Scripts SOS
- **Si** urgeix fumar/beure **aleshores** temporitzador 10' + 4-4-6 ×5 + caminar 10'.
- **Si** sents **invisibilitat** **aleshores** missatge honest a algú de confiança.
- **Si** urges **control** **aleshores** **delega 1 detall** i registra què passa.

## 🗓️ Registre d'hàbits — 7 dies
| Dia | Acció clau | Fet |
| --- | ---------- | --- |
| 1 | NO + 4-4-6 |   |
| 2 | 24h + regla 10' |   |
| 3 | Límit 1 frase |   |
| 4 | Ordre + finances |   |
| 5 | Pas 15' |   |
| 6 | Visibilitat |   |
| 7 | Revisió + hàbit mínim |   |

> **Pas més petit > perfecció.** Usa el tremolor com a brúixola.
`; }

function capitalize(s: string) { return s ? s[0].toUpperCase()+s.slice(1) : s; }

const PARTS = [
  "Part I - Qui ets?",
  "Part II - D'on véns?",
  "Part III - Cap a on vas?",
  "Part IV - Què tems?",
  "Part V - Com creixes?",
];
const TOTAL_PER_PART = 3;

// ---------- utils ----------
const byNewest = (a?: string, b?: string) => {
  const ta = a ? Date.parse(a) : 0;
  const tb = b ? Date.parse(b) : 0;
  return tb - ta;
};
const has = (text?: string, kws: string[] = []) => {
  if (!text) return false;
  const s = text.toLowerCase();
  return kws.some(k => s.includes(k.toLowerCase()));
};
const snippet = (s?: string, n=200) =>
  (s || "").replace(/\s+/g," ").trim().slice(0,n) + ((s || "").length > n ? "…" : "");
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export default function InformePage() {
  const router = useRouter();
  const [raw, setRaw] = useState<Answer[]>([]);

  // email + gating
  const [email, setEmail] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Derived gating state
  const [storedEmail, setStoredEmail] = useState<string>("");
  const [hasPerk, setHasPerk] = useState<boolean>(false);
  const hasEmail = !!storedEmail;
  const canDownload = hasEmail || hasPerk;

  useEffect(() => {
    // if query has ?perk=book and no local flag, respect it (best effort)
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("perk")) setHasPerk(true);
    } catch {}
  }, []);

  // Load answers, email and gating state
  useEffect(() => {
    try {
      const payload = localStorage.getItem("tremor.answers.v1");
      const arr = payload ? JSON.parse(payload) : [];
      setRaw(Array.isArray(arr) ? arr : []);
      
      const savedEmail = localStorage.getItem("tremor.email");
      const savedPerk = localStorage.getItem("tremor.perk");
      
      if (savedEmail) {
        setEmail(savedEmail);
        setStoredEmail(savedEmail);
      }
      
      if (savedPerk) {
        setHasPerk(true);
      }
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

  // Global metrics using new statsFrom
  const stats = statsFrom(answers);
  const progress = stats.progress;
  const dominantVoice = stats.dominantVoice;
  const dominantCount = stats.counts[stats.dominantVoice] || 0;

  // Grouped answers
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

  // Use unified builders
  const previewMd = buildPreviewMd(answers);
  const fullPlanMd = buildFullPlanMd(answers);

  // ---------- actions ----------
  const toCRLF = (s: string) => s.replace(/\r?\n/g, "\r\n");

  const download = (name: string, text: string, mime = "text/markdown;charset=utf-8") => {
    // Add UTF-8 BOM and convert to CRLF for better compatibility with Word on Windows
    const BOM = "\uFEFF";
    const payload = BOM + toCRLF(text);
    const blob = new Blob([payload], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: name });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const copyPreview = async ()=>{
    try { await navigator.clipboard.writeText(previewMd); alert("Vista prèvia copiada (Markdown)."); }
    catch { download("tremolor-preview.md", previewMd); }
  };

  const validEmail = (s:string)=>/\S+@\S+\.\S+/.test(s);
  const sendPlan = async ()=>{
    setError(null);
    if (!validEmail(email)) { setError("Introdueix un correu vàlid."); return; }
    
    // Optimistic gating: save email immediately and grant access
    localStorage.setItem("tremor.email", email);
    setStoredEmail(email);
    setSent(true);
    
    setSending(true);
    
    // Fire-and-forget API call
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          planMd: fullPlanMd,
          dominantVoice: stats.dominantVoice,
          progress: stats.progress,
          userName: email.split('@')[0], // Extract name from email
        }),
      });
      
      if (!res.ok) {
        // Show warning but don't revoke gating
        setError("(Enviament temporalment indisponible; el Pla queda igualment desbloquejat.)");
      }
    } catch (e:any) {
      // Show warning but don't revoke gating
      setError("(Enviament temporalment indisponible; el Pla queda igualment desbloquejat.)");
    } finally {
      setSending(false);
    }
  };

  const downloadFullIfAllowed = ()=>{
    if (!canDownload) {
      setError("Cal correu o codi del llibre per desbloquejar");
      return;
    }
    // Windows-friendly MD with BOM and CRLF
    const BOM = "\uFEFF";
    const content = BOM + fullPlanMd.replace(/\n/g, "\r\n");
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: "tremolor-pla-enriquit.md" });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadProfessionalPDF = async () => {
    if (!canDownload) {
      setError("Cal correu o codi del llibre per desbloquejar");
      return;
    }

    try {
      const reportData: ReportData = {
        answers: answers.map(a => ({
          partKey: a.partKey,
          question: a.question,
          response: a.response || "",
          dominant: a.dominant || "",
          createdAt: a.createdAt || new Date().toISOString()
        })),
        stats,
        userEmail: storedEmail,
        generatedAt: new Date().toISOString()
      };

      const pdfGenerator = new ProfessionalPDFGenerator();
      const pdfBytes = pdfGenerator.generateReport(reportData);
      
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mapa-del-tremolor-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError("Error generant el PDF. Prova amb la versió Markdown.");
    }
  };

  // Donut chart component
  function Donut({tu=0, ego=0, ombra=0}:{tu:number;ego:number;ombra:number}) {
    const total = Math.max(tu+ego+ombra, 1);
    const seg = [
      {pct: tu/total, color: "#FFD700", label:"Tu"},
      {pct: ego/total, color: "#38bdf8", label:"Ego"},
      {pct: ombra/total, color: "#a78bfa", label:"Ombra"},
    ];
    const C = 60, R = 28, P = 2*Math.PI*R;
    let offset = 0;
    return (
      <div className="flex items-center gap-6 p-6 rounded-lg bg-white/5 border border-white/10">
        <svg width={C} height={C} viewBox={`0 0 ${C} ${C}`} className="shrink-0">
          <g transform={`translate(${C/2},${C/2}) rotate(-90)`}>
            <circle r={R} cx={0} cy={0} fill="none" stroke="#222" strokeWidth="12"/>
            {seg.map((s,i)=>{
              const len = s.pct * P;
              const circ = (
                <circle key={i} r={R} cx={0} cy={0}
                  fill="none" stroke={s.color} strokeWidth="12"
                  strokeDasharray={`${len} ${P-len}`} strokeDashoffset={-offset}/>
              );
              offset += len;
              return circ;
            })}
          </g>
        </svg>
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded" style={{background:"#FFD700"}}/> Tu — {Math.round(tu)}%</div>
          <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded" style={{background:"#38bdf8"}}/> Ego — {Math.round(ego)}%</div>
          <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded" style={{background:"#a78bfa"}}/> Ombra — {Math.round(ombra)}%</div>
        </div>
      </div>
    );
  }

  // ---------- UI ----------
  return (
    <main className="min-h-screen px-6 py-12 bg-gradient-to-br from-gray-900 via-black to-purple-900 text-white">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header with improved styling */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Mapa del Tremolor
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Anàlisi professional de les teves veus internes per a un creixement personal profund
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={()=>router.push("/dashboard")} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-sm transition-colors">← Tornar</button>
            <button onClick={copyPreview} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-sm transition-colors">Copiar vista prèvia</button>
            <button onClick={()=>window.print()} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-sm transition-colors">Imprimir</button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded bg-white/5 border border-white/10"><p className="text-sm opacity-70">Progrés</p><p className="text-2xl font-bold">{progress}%</p></div>
          <div className="p-6 rounded bg-white/5 border border-white/10"><p className="text-sm opacity-70">Veu dominant</p><p className="text-2xl font-bold capitalize">{cap(dominantVoice)} ({dominantCount}/15)</p></div>
          <div className="p-6 rounded bg-white/5 border border-white/10"><p className="text-sm opacity-70">Respostes</p><p className="text-2xl font-bold">{answers.length}/15</p></div>
        </div>

        {/* Enhanced Voice Analysis Chart */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Anàlisi de les Teves Veus Internes</h2>
          <VoiceAnalysisChart
            data={{
              tu: stats.counts.tu || 0,
              ego: stats.counts.ego || 0,
              ombra: stats.counts.ombra || 0
            }}
            size="large"
            showLabels={true}
          />
        </div>

        {/* Email capture (Catalan) */}
        <section className="bg-white/5 border border-white/10 rounded p-4 space-y-3">
          <div className="text-sm opacity-90">
            Rep el teu <strong>Pla enriquit de 7 dies</strong> per correu (inclou: checklist diari, scripts SOS "si–aleshores", registre d'hàbits de 7 dies i notes personalitzades).
            Després d'enviar-lo, es desbloquejarà el botó <strong>Descarregar .MD (Pla complet)</strong>.
            {" "}
            <a href="/regal" className="underline underline-offset-4 hover:opacity-80">Tens el llibre? Entra el teu codi</a>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                placeholder="elmeu@email.com"
                className="px-4 py-3 rounded-lg bg-black/40 border border-white/20 flex-1 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={sendPlan}
                disabled={sending}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white font-medium transition-all"
              >
                {sending ? "Enviant…" : "Enviar Informe"}
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={downloadProfessionalPDF}
                disabled={!canDownload}
                className="px-6 py-4 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg shadow-xl transform hover:scale-105 transition-all"
                title={canDownload ? "Descarregar Informe Professional (PDF)" : "Cal correu o codi del llibre per desbloquejar"}
              >
                {canDownload ? "📄 Descarregar Informe Professional (PDF)" : "🔒 Informe Professional (PDF)"}
              </button>
              <button
                onClick={downloadFullIfAllowed}
                disabled={!canDownload}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 text-sm transition-colors"
                title={canDownload ? "Descarregar Pla complet (MD)" : "Cal correu o codi del llibre per desbloquejar"}
              >
                {canDownload ? (hasPerk ? "📝 Pla .MD — Regal del llibre" : "📝 Pla .MD (text)") : "🔒 Pla .MD (text)"}
              </button>
            </div>
          </div>
          {error && <div className="text-xs text-red-400">{error}</div>}
          {sent && <div className="text-xs text-green-400">✅ Enviat. Revisa la teva bústia (i el correu brossa).</div>}
        </section>

        {/* Preview highlights */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">🧭 Com llegir el TEU informe (vista prèvia)</h2>
          <ul className="list-disc pl-6 text-sm space-y-1">
            {controlPattern && <li>Patró de control (Ego).</li>}
            {scarcityPattern && <li>Por d'escassetat / relat d'escassetat actiu.</li>}
            {anesthesiaCycle && <li>Cicle d'anestèsia (evitació amb substàncies o dopamina ràpida).</li>}
            {invisibility && <li>Ferida d'invisibilitat (no ser vist / llop solitari).</li>}
          </ul>
        </section>

        {/* Per-part preview & answers (unchanged) */}
        <section className="space-y-4">
          {[
            {
              t:"I. Qui ets?",
              lines:[
                peoplePleaser ? "Tens claredat: «ser amable amb tothom» és màscara; vols límits." : "Estàs afinant identitat: vols coherència i límits clars.",
                "Risc: agradar per no ser rebutjat.",
                "Microacció: avui **1 NO petit** on normalment diries sí.",
              ]
            },
            {
              t:"II. D'on véns?",
              lines:[
                controlPattern ? "Ego controla per seguretat — és una memòria de protecció." : "Tens trams del passat que encara regulen reaccions.",
                scarcityPattern ? "El relat d'escassetat/«guerra» continua actiu de fons." : "Posa nom als patrons familiars per desactivar-los.",
                "Microacció: identifica **1 situació** on controles per por i **delega 1 detall**.",
              ]
            },
            {
              t:"III. Cap a on vas?",
              lines:[
                anesthesiaCycle ? "Has posat nom al **loop d'anestèsia** (nostàlgia→tristesa→fumar/beure)." : "Sense direcció clara hi ha dispersió — defineix un far simple.",
                "Microacció: quan vingui l'impuls, **regla 10'** + respiració 4-4-6 + passeig curt.",
              ]
            },
            {
              t:"IV. Què tems?",
              lines:[
                invisibility ? "Ferida central: **invisibilitat** («no ser vist», «llop solitari»)." : "La por principal és no ser reconegut en la teva veritat.",
                "Microacció: **acte de visibilitat** diari (missatge honest o demanar ajuda concreta).",
              ]
            },
            {
              t:"V. Com creixes?",
              lines:[
                (touchBottom || fearLoseAll) ? "Creença: «només canvio si **toco fons**» + por a «**perdre-ho tot**» si integres l'Ombra." : "Creixement sostingut > heroïcitats puntuals. La clau és el llindar mínim.",
                "Microacció: defineix un **llindar mínim** (2' escriptura o 10' caminar) i compleix-lo 7 dies.",
              ]
            }
          ].map((blk, idx)=>(
            <div key={idx} className="bg-white/5 border border-white/10 rounded p-4">
              <div className="font-medium mb-1">{blk.t}</div>
              <ul className="list-disc pl-6 text-sm space-y-1">
                {blk.lines.map((l,i)=>(<li key={i} dangerouslySetInnerHTML={{__html:l}} />))}
              </ul>
            </div>
          ))}
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
