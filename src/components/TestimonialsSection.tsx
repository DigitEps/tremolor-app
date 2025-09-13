"use client";
import React from "react";

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar?: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Maria C.",
    role: "Psicòloga",
    content: "El Mapa del Tremolor m'ha ajudat a comprendre millor els meus patrons interns. L'anàlisi és profund i les recomanacions molt pràctiques.",
    rating: 5
  },
  {
    name: "Jordi R.",
    role: "Coach Personal",
    content: "Utilitzo aquest informe amb els meus clients. La qualitat de l'anàlisi és comparable a sessions de coaching de 200€. Impressionant.",
    rating: 5
  },
  {
    name: "Anna M.",
    role: "Directora d'Empresa",
    content: "M'ha donat claredat sobre com gestiono l'estrès i les decisions difícils. El pla de 30 dies és realista i efectiu.",
    rating: 5
  },
  {
    name: "David L.",
    role: "Terapeuta",
    content: "La integració de les tres veus és brillant. He recomanat aquest informe a molts dels meus pacients amb resultats excel·lents.",
    rating: 5
  }
];

const stats = [
  { number: "15,000+", label: "Informes generats" },
  { number: "4.9/5", label: "Valoració mitjana" },
  { number: "92%", label: "Recomanació" },
  { number: "30 dies", label: "Garantia" }
];

export default function TestimonialsSection() {
  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="text-center p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-2xl font-bold text-white">{stat.number}</div>
            <div className="text-sm text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Testimonials */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white text-center mb-6">
          Què diuen els nostres usuaris
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="p-6 rounded-lg bg-white/5 border border-white/10">
              {/* Rating */}
              <div className="flex items-center mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                  </svg>
                ))}
              </div>
              
              {/* Content */}
              <p className="text-gray-300 text-sm mb-4 italic">
                "{testimonial.content}"
              </p>
              
              {/* Author */}
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm mr-3">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-white text-sm">{testimonial.name}</div>
                  <div className="text-gray-400 text-xs">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust indicators */}
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg p-6 border border-purple-500/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-white">Garantia de 30 dies</div>
              <div className="text-sm text-gray-400">Si no estàs satisfet, et retornem els diners</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-white">Dades segures</div>
              <div className="text-sm text-gray-400">Encriptació SSL i privacitat garantida</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scarcity element */}
      <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 rounded-lg p-4 border border-red-500/20">
        <div className="flex items-center justify-center space-x-2 text-center">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-400 font-medium text-sm">
            Oferta limitada: Només 50 informes professionals disponibles aquest mes
          </span>
        </div>
      </div>
    </div>
  );
}