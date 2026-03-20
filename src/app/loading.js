"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee } from "lucide-react";

// Partículas — mismas proporciones que login/register
const PARTICLES = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  size: [6, 10, 8, 5, 12, 7][i],
  top: [15, 70, 40, 85, 25, 60][i],
  left: [10, 20, 75, 55, 88, 40][i],
  delay: [0, 1.2, 0.6, 2.1, 0.3, 1.7][i],
  duration: [4, 5.5, 3.8, 6, 4.5, 5][i],
}));

// Frases que rotan mientras carga
const HINTS = [
  "Preparando tu catálogo...",
  "Cargando tus productos...",
  "Sincronizando datos...",
  "Casi listo...",
];

export default function PageLoading({
  title = "Cargando",
  subtitle = "Preparando contenido",
}) {
  const [visible, setVisible] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Rota el hint cada 2s
  useEffect(() => {
    const interval = setInterval(
      () => setHintIndex((i) => (i + 1) % HINTS.length),
      2000,
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="min-h-screen bg-background flex overflow-hidden relative"
        >
          {/* Textura sutil — idéntica al login */}
          <div
            className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* ── Panel izquierdo — solo desktop ─────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex flex-col justify-between flex-[0_0_42%] px-12 py-14 border-r border-border relative z-10"
          >
            {/* Partículas */}
            {PARTICLES.map((p) => (
              <motion.div
                key={p.id}
                animate={{ y: [-8, 8, -8], opacity: [0.12, 0.35, 0.12] }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute rounded-full bg-primary pointer-events-none"
                style={{
                  width: p.size,
                  height: p.size,
                  top: `${p.top}%`,
                  left: `${p.left}%`,
                }}
              />
            ))}

            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Coffee size={18} className="text-primary-foreground" />
              </div>
              <span className="text-foreground text-sm font-medium tracking-wide">
                Roumenu
              </span>
            </div>

            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.3,
                duration: 0.9,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <p className="text-[11px] text-primary uppercase tracking-[0.18em] mb-5 font-medium">
                Un momento
              </p>
              <h2 className="text-[40px] font-normal leading-[1.15] text-foreground italic m-0">
                Preparando
                <br />
                <span className="text-primary">tu tienda</span>
                <br />
                para ti.
              </h2>
            </motion.div>

            <p className="text-xs text-muted-foreground/50 m-0">
              © {new Date().getFullYear()} Roumenu
            </p>
          </motion.div>

          {/* ── Panel derecho — spinner ─────────────────────────────── */}
          <div className="flex-1 flex items-center justify-center px-6 py-10 z-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.15,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex flex-col items-center gap-10"
            >
              {/* Logo mobile */}
              <div className="flex items-center gap-2.5 lg:hidden">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <Coffee size={15} className="text-primary-foreground" />
                </div>
                <span className="text-foreground text-sm font-medium">
                  Roumenu
                </span>
              </div>

              {/* Spinner doble anillo */}
              <div className="relative flex items-center justify-center w-24 h-24">
                {/* Anillo exterior */}
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 2.6,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 rounded-full border-2 border-border border-t-primary"
                  style={{ display: "block" }}
                />
                {/* Anillo medio */}
                <motion.span
                  animate={{ rotate: -360 }}
                  transition={{
                    duration: 1.9,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-4 rounded-full border-2 border-border border-b-primary/60"
                  style={{ display: "block" }}
                />
                {/* Icono central */}
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center z-10 shadow-sm">
                  <Coffee size={18} className="text-primary-foreground" />
                </div>
              </div>

              {/* Texto */}
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-normal text-foreground italic leading-tight">
                  {title}
                </h2>

                {/* Hint rotante con AnimatePresence */}
                <div className="h-5 flex items-center justify-center overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={hintIndex}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.35 }}
                      className="text-sm text-muted-foreground absolute"
                    >
                      {HINTS[hintIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>

              {/* Barra de progreso indeterminada */}
              <div className="w-48 h-0.5 bg-border rounded-full overflow-hidden">
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="h-full w-1/3 bg-primary rounded-full"
                />
              </div>

              {/* Puntos */}
              <div className="flex items-center gap-2">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2], scale: [0.7, 1, 0.7] }}
                    transition={{
                      duration: 1.4,
                      delay,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-1.5 h-1.5 rounded-full bg-primary block"
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
