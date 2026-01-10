import Link from "next/link";

export default function Page() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-2xl px-6 py-14">
        <p className="text-sm tracking-widest text-white/60">TREMOLOR · NIVELL A</p>

        <h1 className="mt-3 text-4xl font-extrabold leading-tight">
          Has arribat fins al final.
          <span className="block text-white/70">Ara comença el que importa.</span>
        </h1>

        <p className="mt-5 text-lg text-white/75">
          Aquesta microapp no és teràpia ni diagnòstic. És un mirall curt i útil per detectar patrons i fer un pas petit però real.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/v2"
            className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-base font-semibold text-black hover:bg-white/90"
          >
            Entrar a la V2 (Nivell A)
          </Link>

          <Link
            href="/v2"
            className="inline-flex items-center justify-center rounded-xl border border-white/25 px-5 py-3 text-base font-semibold text-white hover:border-white/45"
          >
            Reprendre / veure informe
          </Link>
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-base font-semibold">Avís de seguretat (clar i curt)</h2>
          <p className="mt-2 text-sm text-white/70">
            Si estàs en crisi o tens impulsos de fer-te mal o fer mal a algú: para aquí i demana ajuda ara mateix (a Espanya: 112).
          </p>
        </div>

        <p className="mt-10 text-xs text-white/45">© Tremolor · Edmond Systems / DigitEps</p>
      </div>
    </main>
  );
}
