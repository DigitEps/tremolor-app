"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [showSubtext, setShowSubtext] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 200);
    setTimeout(() => setShowSubtext(true), 1200);
    setTimeout(() => setShowButton(true), 2200);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Fons amb gradient subtil */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
      
      {/* Cercle difuminat de fons */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Contingut principal */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto space-y-8">
        
        {/* Títol principal */}
        <h1 
          className={`text-5xl md:text-7xl font-bold tracking-tight transition-all duration-1000 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          El tremolor continua...
        </h1>

        {/* Subtítol Ombra */}
        <div 
          className={`space-y-4 transition-all duration-1000 delay-300 ${
            showSubtext ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <p className="text-xl md:text-2xl text-white/60 leading-relaxed">
            Això no és un test de personalitat.
          </p>
          <p className="text-lg text-white/40 leading-relaxed max-w-lg mx-auto">
            És una conversa amb les veus que ja coneixes però 
            <span className="text-white/70"> prefereixes no escoltar.</span>
          </p>
        </div>

        {/* Separador */}
        <div 
          className={`flex items-center justify-center gap-4 transition-all duration-700 ${
            showSubtext ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="h-px w-12 bg-white/20" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500/50" />
          <div className="h-px w-12 bg-white/20" />
        </div>

        {/* Text Ombra */}
        <p 
          className={`text-white/50 text-sm md:text-base italic transition-all duration-1000 ${
            showSubtext ? "opacity-100" : "opacity-0"
          }`}
        >
          15 preguntes. Cap resposta correcta. Només la teva veritat.
        </p>

        {/* Botó */}
        <div 
          className={`pt-4 transition-all duration-1000 ${
            showButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <button
            onClick={() => router.push("/preguntes")}
            className="group relative px-8 py-4 bg-white text-black font-semibold text-lg rounded-xl hover:bg-white/90 transition-all duration-300 hover:scale-105"
          >
            <span>Entrar</span>
            <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>

        {/* Nota inferior */}
        <p 
          className={`text-white/20 text-xs pt-8 transition-all duration-1000 delay-500 ${
            showButton ? "opacity-100" : "opacity-0"
          }`}
        >
          Temps estimat: 5-10 minuts · Sense registre · Les teves respostes es queden al teu dispositiu
        </p>
      </div>

      {/* Footer mínim */}
      <footer className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-white/15 text-xs tracking-widest uppercase">
          EdmondSystems · Tremolor
        </p>
      </footer>
    </main>
  );
}
