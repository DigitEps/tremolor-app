"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegalPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // Load saved email after component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("tremor.email");
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const submit = async () => {
    setErr(null); setOk(null);
    if (!code.trim()) { setErr("Introdueix el codi del llibre."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), email: email || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        const msg = data?.error === "invalid_code" ? "Codi incorrecte." : "No s'ha pogut validar el codi.";
        throw new Error(msg);
      }
      const tier = (data.tier as string) || "book2025";
      localStorage.setItem("tremor.perk", tier);
      if (email && /\S+@\S+\.\S+/.test(email)) localStorage.setItem("tremor.email", email);

      setOk("Codi validat! S'ha desbloquejat el Pla complet.");
      // Porta a l'informe amb el perk actiu
      setTimeout(() => router.push("/informe?perk=book"), 800);
    } catch (e:any) {
      setErr(e?.message || "Error desconegut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-12 bg-black text-white">
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Regal del llibre</h1>
        <p className="opacity-80 text-sm">
          Si tens el llibre <em>"TU, l'EGO i JO"</em>, escriu el <strong>codi del llibre</strong> que hi trobaràs al final. 
          Amb el codi desbloquejaràs el <strong>Pla complet</strong> de l'App. (El correu és opcional.)
        </p>

        <div className="space-y-3 bg-white/5 border border-white/10 rounded p-4">
          <label className="text-sm">Codi del llibre</label>
          <input
            value={code}
            onChange={(e)=>setCode(e.target.value)}
            placeholder="TU-EGO-JO-2025"
            className="w-full px-3 py-2 rounded bg-black/40 border border-white/15"
          />
          <label className="text-sm">Correu (opcional)</label>
          <input
            type="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            placeholder="elmeu@email.com"
            className="w-full px-3 py-2 rounded bg-black/40 border border-white/15"
          />
          <button
            onClick={submit}
            disabled={loading}
            className="w-full px-3 py-2 rounded bg-white/10 hover:bg-white/15 border border-white/10"
          >
            {loading ? "Validant…" : "Desbloqueja el Pla complet"}
          </button>
          {err && <div className="text-xs text-red-400">{err}</div>}
          {ok && <div className="text-xs text-green-400">{ok}</div>}
        </div>

        <button onClick={()=>router.push("/informe")} className="text-sm opacity-80 underline underline-offset-4">
          ← Tornar a l'Informe
        </button>
      </div>
    </main>
  );
}