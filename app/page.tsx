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

// ✅ importa tu JSON (ajusta la ruta según tu proyecto)
import WORDS from "./words.json";

type Phase = "PLAY" | "WON" | "LOST";

type WordItem = {
  word: string; // en MAYÚSCULA
  hint: string;
  category: string;
};

const ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

function uniqueLetters(word: string) {
  return Array.from(new Set(word.split("")));
}

// Función para obtener un índice aleatorio
function getRandomIndex(excludeIndex?: number): number {
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * WORDS.length);
  } while (newIndex === excludeIndex && WORDS.length > 1);
  return newIndex;
}

// Función para mezclar un array (Fisher-Yates shuffle)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function Home() {
  // ====== estado para preguntas aleatorias ======
  const [randomIndices, setRandomIndices] = useState<number[]>([]);
  const [currentIndexPos, setCurrentIndexPos] = useState(0);
  const [usedWords, setUsedWords] = useState<Set<number>>(new Set());

  // Inicializar índices aleatorios al montar
  useEffect(() => {
    const shuffled = shuffleArray(Array.from({ length: WORDS.length }, (_, i) => i));
    setRandomIndices(shuffled);
  }, []);

  // Obtener el índice actual basado en posición aleatoria
  const currentIndex = useMemo(() => {
    if (randomIndices.length === 0) return 0;
    return randomIndices[currentIndexPos];
  }, [randomIndices, currentIndexPos]);

  // normaliza por si el json tiene minúsculas o espacios
  const currentItem: WordItem = useMemo(() => {
    if (WORDS.length === 0) {
      return { word: "", hint: "", category: "" };
    }
    const raw = (WORDS as WordItem[])[currentIndex];
    return {
      ...raw,
      word: raw.word.trim().toUpperCase(),
    };
  }, [currentIndex]);

  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<Phase>("PLAY");

  const [lives, setLives] = useState(6);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);

  const [revealHint, setRevealHint] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const word = currentItem.word;
  const lettersNeeded = useMemo(() => uniqueLetters(word), [word]);

  const toastRef = useRef<number | null>(null);
  const nextTimerRef = useRef<number | null>(null);

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

  // ✅ Función para obtener la siguiente palabra aleatoria
  const getNextRandomWord = () => {
    if (randomIndices.length === 0) return;
    
    // Marcar la palabra actual como usada
    setUsedWords(prev => {
      const next = new Set(prev);
      next.add(currentIndex);
      return next;
    });
    
    // Buscar la siguiente posición
    let nextPos = (currentIndexPos + 1) % randomIndices.length;
    
    // Si hemos usado todas las palabras, resetear
    if (usedWords.size >= randomIndices.length) {
      // Mezclar de nuevo todos los índices
      const reshuffled = shuffleArray(Array.from({ length: WORDS.length }, (_, i) => i));
      setRandomIndices(reshuffled);
      setUsedWords(new Set());
      nextPos = 0;
      showToast("¡Todas las palabras usadas! Reiniciando...");
    }
    
    setCurrentIndexPos(nextPos);
  };

  // ✅ pasar al siguiente reto (automático)
  const goNextChallenge = () => {
    // limpieza por si había timer previo
    if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);

    // delay corto para que se note el "GANASTE"
    nextTimerRef.current = window.setTimeout(() => {
      getNextRandomWord();
      setGuessed(new Set());
      setWrong(new Set());
      setLives(6);
      setPhase("PLAY");
      showToast("Siguiente reto");
    }, 800);
  };

  const restartAll = () => {
    if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);
    
    // Mezclar todos los índices de nuevo
    const shuffled = shuffleArray(Array.from({ length: WORDS.length }, (_, i) => i));
    setRandomIndices(shuffled);
    setCurrentIndexPos(0);
    setUsedWords(new Set());
    
    setGuessed(new Set());
    setWrong(new Set());
    setLives(6);
    setPhase("PLAY");
    setStreak(0);
    setScore(0);
    showToast("Reiniciado con orden aleatorio");
  };

  const restartCurrent = () => {
    if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);
    setGuessed(new Set());
    setWrong(new Set());
    setLives(6);
    setPhase("PLAY");
    setStreak(0); // si quieres que NO se pierda la racha aquí, quita esta línea
    showToast("Reintento");
  };

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

        // ✅ avanza automáticamente al siguiente reto
        goNextChallenge();
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

  // Teclado físico
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!canPlay) return;
      const key = e.key.toUpperCase();
      if (key.length === 1) applyGuess(key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canPlay, guessed, wrong, lives, phase, word]);

  // Limpieza timers al desmontar
  useEffect(() => {
    return () => {
      if (toastRef.current) window.clearTimeout(toastRef.current);
      if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);
    };
  }, []);

  // ===== Diseño estilo "pizarra minimal" =====
  const bannerTone =
    phase === "WON"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : phase === "LOST"
      ? "border-rose-200 bg-rose-50 text-rose-900"
      : "border-slate-200 bg-slate-50 text-slate-800";

  const totalChallenges = (WORDS as WordItem[]).length;
  const currentNumber = currentIndexPos + 1;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 overflow-hidden">
      {/* Banda superior */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white grid place-items-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h1 className="text-base">Ahorcado minimal</h1>
              <p className="text-xs text-slate-500">
                Reto {currentNumber}/{totalChallenges} • Orden aleatorio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goNextChallenge}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
            >
              <RefreshCw size={16} />
              Siguiente
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
          {/* Panel izquierdo */}
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
                <div className="text-xs text-slate-700">{currentItem.category}</div>
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
                <div className="mt-2 text-sm text-slate-700">{currentItem.hint}</div>
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

            {phase === "LOST" && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={restartCurrent}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                >
                  Reintentar
                </button>
                <button
                  onClick={goNextChallenge}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Siguiente
                </button>
              </div>
            )}
          </section>

          {/* Área principal */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2">
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

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-slate-700">Elige una letra</span>
                {toast && <span className="text-xs text-slate-500">{toast}</span>}
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
                  onClick={goNextChallenge}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                >
                  <RefreshCw size={16} />
                  Siguiente reto
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
          Tip: puedes usar el teclado físico (A–Z, Ñ). Las palabras aparecen en orden aleatorio para evitar memorización.
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