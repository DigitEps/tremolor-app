export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center text-white animated-bg px-4">
      <h1 className="text-4xl md:text-6xl font-bold tremor mb-6">
        El tremolor continua...
      </h1>
      <p className="mb-8 opacity-80">Escolta les teves veus interiors</p>
      <a
        href="/preguntes"
        className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition"
      >
        Comença el teu tremolor
      </a>
    </main>
  );
}
