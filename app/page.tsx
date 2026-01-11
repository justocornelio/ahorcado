"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  RotateCcw,
  RefreshCw,
  Heart,
  Sparkles,
  Keyboard,
  Eye,
  EyeOff,
} from "lucide-react";

type Phase = "PLAY" | "WON" | "LOST";

type WordItem = {
  word: string; // en MAYÚSCULA
  hint: string;
  category: string;
};

const WORDS: WordItem[] = [
  // Cortas 4–7 letras (sin tildes)
  { word: "CASA", hint: "Lugar donde vives", category: "Objetos" },
  { word: "MESA", hint: "Tiene patas", category: "Objetos" },
  { word: "SILLA", hint: "Para sentarse", category: "Objetos" },
  { word: "LLAVE", hint: "Abre puertas", category: "Objetos" },
  { word: "VASO", hint: "Para beber", category: "Objetos" },

  { word: "PERRO", hint: "Mejor amigo", category: "Animales" },
  { word: "GATO", hint: "Le gusta dormir", category: "Animales" },
  { word: "RANA", hint: "Salta y croa", category: "Animales" },
  { word: "PATO", hint: "Dice cuac", category: "Animales" },
  { word: "LEON", hint: "Rey de la selva", category: "Animales" },

  { word: "AZUL", hint: "Color del cielo", category: "Colores" },
  { word: "ROJO", hint: "Color intenso", category: "Colores" },
  { word: "VERDE", hint: "Color de plantas", category: "Colores" },
  { word: "NEGRO", hint: "Oscuro", category: "Colores" },
  { word: "BLANCO", hint: "Como la nieve", category: "Colores" },

  { word: "PLAYA", hint: "Arena y mar", category: "Lugares" },
  { word: "MONTE", hint: "Montana pequeña", category: "Lugares" },
  { word: "BOSQUE", hint: "Muchos arboles", category: "Lugares" },
  { word: "RIO", hint: "Agua que corre", category: "Lugares" },
  { word: "CALLE", hint: "Por donde pasan carros", category: "Lugares" },

  { word: "PAN", hint: "Se come", category: "Comida" },
  { word: "ARROZ", hint: "Muy común", category: "Comida" },
  { word: "PIZZA", hint: "Con queso", category: "Comida" },
  { word: "PASTA", hint: "Con salsa", category: "Comida" },
  { word: "MANGO", hint: "Fruta tropical", category: "Comida" },

  { word: "LUZ", hint: "No es oscuridad", category: "Conceptos" },
  { word: "TIEMPO", hint: "Pasa siempre", category: "Conceptos" },
  { word: "SUERTE", hint: "A veces ayuda", category: "Conceptos" },
];

const ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

function pickWord(exclude?: string) {
  const pool = exclude ? WORDS.filter((w) => w.word !== exclude) : WORDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function uniqueLetters(word: string) {
  return Array.from(new Set(word.split("")));
}

export default function Home() {
  const [item, setItem] = useState<WordItem>(() => pickWord());
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<Phase>("PLAY");

  const [lives, setLives] = useState(6);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);

  const [revealHint, setRevealHint] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const word = item.word;
  const lettersNeeded = useMemo(() => uniqueLetters(word), [word]);

  const toastRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastRef.current) window.clearTimeout(toastRef.current);
    toastRef.current = window.setTimeout(() => setToast(null), 1200);
  };

  const masked = useMemo(() => {
    return word
      .split("")
      .map((ch) => (guessed.has(ch) ? ch : "•"))
      .join(" ");
  }, [word, guessed]);

  const progress = useMemo(() => {
    const hit = lettersNeeded.filter((c) => guessed.has(c)).length;
    const total = lettersNeeded.length;
    return Math.round((hit / total) * 100);
  }, [lettersNeeded, guessed]);

  const canPlay = phase === "PLAY";

  const applyGuess = (raw: string) => {
    if (!canPlay) return;
    const letter = raw.toUpperCase();

    if (!ALPHABET.includes(letter)) return;

    if (guessed.has(letter) || wrong.has(letter)) {
      showToast("Ya usaste esa letra");
      return;
    }

    if (word.includes(letter)) {
      const next = new Set(guessed);
      next.add(letter);
      setGuessed(next);

      const win = lettersNeeded.every((c) => next.has(c));
      if (win) {
        setPhase("WON");
        const nextStreak = streak + 1;
        setStreak(nextStreak);

        const base = 20;
        const bonusLives = lives * 2;
        const bonusStreak = Math.min(30, nextStreak * 3);
        const add = base + bonusLives + bonusStreak;

        setScore((s) => s + add);
        showToast(`¡Bien! +${add}`);
      } else {
        showToast("Correcto");
      }
    } else {
      const nextWrong = new Set(wrong);
      nextWrong.add(letter);
      setWrong(nextWrong);

      setLives((v) => {
        const nv = v - 1;
        if (nv <= 0) {
          setPhase("LOST");
          setStreak(0);
          showToast("Perdiste");
          return 0;
        }
        showToast("Fallaste");
        return nv;
      });
    }
  };

  const nextWord = () => {
    const nw = pickWord(word);
    setItem(nw);
    setGuessed(new Set());
    setWrong(new Set());
    setLives(6);
    setPhase("PLAY");
    showToast("Nueva palabra");
  };

  const restartAll = () => {
    const nw = pickWord();
    setItem(nw);
    setGuessed(new Set());
    setWrong(new Set());
    setLives(6);
    setPhase("PLAY");
    setStreak(0);
    setScore(0);
    showToast("Reiniciado");
  };

  // Teclado físico
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!canPlay) return;
      const key = e.key.toUpperCase();
      // soporte Ñ: en teclado puede llegar como "Ñ" o como ";" según layout, pero aquí mantenemos simple
      if (key.length === 1) applyGuess(key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canPlay, guessed, wrong, lives, phase, word]);

  // ===== Diseño estilo "pizarra minimal" =====
  const bannerTone =
    phase === "WON"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : phase === "LOST"
      ? "border-rose-200 bg-rose-50 text-rose-900"
      : "border-slate-200 bg-slate-50 text-slate-800";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 overflow-hidden">
      {/* Banda superior (diferente a tarjetas) */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white grid place-items-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h1 className="text-base">Ahorcado minimal</h1>
              <p className="text-xs text-slate-500">Palabras cortas • sin ruido</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={nextWord}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
            >
              <RefreshCw size={16} />
              Otra
            </button>
            <button
              onClick={restartAll}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw size={16} />
              Reiniciar
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Panel izquierdo tipo “ficha” */}
          <section className="rounded-2xl bg-white border border-slate-200 p-4 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">Estado</span>
              <span className={`rounded-full border px-3 py-1 text-xs ${bannerTone}`}>
                {phase === "PLAY" ? "Jugando" : phase === "WON" ? "Ganaste" : "Perdiste"}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <MiniStat label="Puntos" value={score} />
              <MiniStat label="Racha" value={streak} />
            </div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Vidas</span>
                <span className="inline-flex items-center gap-1">
                  {Array.from({ length: 6 }, (_, i) => (
                    <Heart
                      key={i}
                      size={16}
                      className={i < lives ? "text-rose-500" : "text-slate-300"}
                      fill={i < lives ? "currentColor" : "none"}
                    />
                  ))}
                </span>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Progreso</span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-[width] duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">Categoría</div>
                <div className="text-xs text-slate-700">{item.category}</div>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-slate-500">Pista</div>
                <button
                  onClick={() => setRevealHint((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                >
                  {revealHint ? <EyeOff size={14} /> : <Eye size={14} />}
                  {revealHint ? "Ocultar" : "Ver"}
                </button>
              </div>

              {revealHint && (
                <div className="mt-2 text-sm text-slate-700">{item.hint}</div>
              )}
            </div>

            {phase !== "PLAY" && (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                {phase === "WON" ? (
                  <span>
                    Correcto: <span className="text-slate-900">{word}</span>
                  </span>
                ) : (
                  <span>
                    Era: <span className="text-slate-900">{word}</span>
                  </span>
                )}
              </div>
            )}
          </section>

          {/* Área principal estilo “pizarra” (bien distinta) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2">
            {/* “Pizarra” */}
            <div className="rounded-2xl border border-slate-200 bg-slate-900 p-4 text-slate-50">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-300">Adivina la palabra</div>
                <div className="text-xs text-slate-300">
                  <span className="inline-flex items-center gap-2">
                    <Keyboard size={14} />
                    teclado disponible
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center">
                <div className="rounded-2xl bg-white/5 px-4 py-3 text-xl tracking-[0.35em] text-center">
                  {phase === "LOST" ? word.split("").join(" ") : masked}
                </div>
              </div>

              <div className="mt-4 text-center text-xs text-slate-300">
                Letras falladas:{" "}
                <span className="text-slate-100">
                  {Array.from(wrong).length ? Array.from(wrong).join(" ") : "—"}
                </span>
              </div>
            </div>

            {/* Teclado */}
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-slate-700">Elige una letra</span>
                {toast && (
                  <span className="text-xs text-slate-500 transition-opacity">{toast}</span>
                )}
              </div>

              <div className="grid grid-cols-9 gap-2 sm:grid-cols-10 md:grid-cols-11">
                {ALPHABET.map((ch) => {
                  const used = guessed.has(ch) || wrong.has(ch);
                  const correct = guessed.has(ch);
                  const wronged = wrong.has(ch);

                  const base =
                    "h-9 rounded-xl border text-sm transition flex items-center justify-center";
                  const normal = "border-slate-200 bg-white text-slate-800 hover:bg-slate-50";
                  const usedCls = "opacity-60 cursor-not-allowed";
                  const okCls = "border-blue-200 bg-blue-50 text-blue-900";
                  const badCls = "border-rose-200 bg-rose-50 text-rose-900";

                  return (
                    <button
                      key={ch}
                      disabled={!canPlay || used}
                      onClick={() => applyGuess(ch)}
                      className={[
                        base,
                        correct ? okCls : wronged ? badCls : normal,
                        (!canPlay || used) ? usedCls : "",
                      ].join(" ")}
                      title={used ? "Ya usada" : "Probar"}
                    >
                      {ch}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={nextWord}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                >
                  <RefreshCw size={16} />
                  Nueva palabra
                </button>

                <button
                  onClick={restartAll}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <RotateCcw size={16} />
                  Reiniciar todo
                </button>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-6 text-center text-xs text-slate-500">
          Tip: puedes usar el teclado físico (A–Z, Ñ).
        </footer>
      </main>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-lg text-slate-900">{value}</div>
    </div>
  );
}
