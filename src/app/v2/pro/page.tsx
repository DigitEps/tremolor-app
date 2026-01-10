"use client";

import Link from "next/link";

export default function ProPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <p className="text-sm opacity-70">Tremolor · V2 · PRO</p>

        <h1 className="text-4xl font-extrabold">PRO — Sprint 1</h1>

        <p className="opacity-80">
          Si estàs veient això, la ruta <b>/v2/pro</b> ja funciona. Ara toca connectar el qüestionari PRO
          (15 preguntes V1) i després l’enviament per correu + pla 7 dies.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/v2" className="px-4 py-2 rounded-md bg-white/10 border border-white/15 hover:bg-white/15">
            ← Tornar a V2
          </Link>
          <Link href="/informe" className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-500">
            Veure informe
          </Link>
        </div>
      </div>
    </main>
  );
}
