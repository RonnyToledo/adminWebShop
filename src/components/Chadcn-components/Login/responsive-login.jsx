"use client";

import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Coffee } from "lucide-react";
import Link from "next/link";
import { sileo } from "sileo";
import Loading from "../../component/loading";
import { ThemeContext } from "@/context/useContext";
import { authService } from "@/lib/supabase";

const PARTICLES = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  size: [6, 10, 8, 5, 12, 7][i],
  top: [15, 70, 40, 85, 25, 60][i],
  left: [10, 20, 75, 55, 88, 40][i],
  delay: [0, 1.2, 0.6, 2.1, 0.3, 1.7][i],
  duration: [4, 5.5, 3.8, 6, 4.5, 5][i],
}));

export function ResponsiveLogin({ user }) {
  const { webshop } = useContext(ThemeContext);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCharge] = useState(false);
  const [focused, setFocused] = useState(null);

  const storeName = webshop?.store?.name ?? "Roumenu";

  useEffect(() => {
    if (user && user !== undefined) router.push("/");
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.signIn(email, password);
      router.refresh();
      await new Promise((r) => setTimeout(r, 500));
      window.location.replace("/");
    } catch (err) {
      console.error(err);
      sileo.error({
        title: "Error al iniciar sesión",
        description: err.message || "Error inesperado.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingCharge) return <Loading />;

  return (
    <div className="min-h-screen bg-background flex overflow-hidden relative">
      {/* Textura sutil sobre el fondo */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Panel izquierdo — solo desktop ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex flex-col justify-between flex-[0_0_42%] px-12 py-14 border-r border-border relative z-10"
      >
        {/* Partículas con color primario del tema */}
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
            {storeName}
          </span>
        </div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[11px] text-primary uppercase tracking-[0.18em] mb-5 font-medium">
            Panel de administración
          </p>
          <h2 className="text-[40px] font-normal leading-[1.15] text-foreground italic m-0">
            Gestiona tu
            <br />
            <span className="text-primary">tienda</span>
            <br />
            desde aquí.
          </h2>
        </motion.div>

        {/* Footer izquierdo */}
        <p className="text-xs text-muted-foreground/50 m-0">
          © {new Date().getFullYear()} {storeName}
        </p>
      </motion.div>

      {/* ── Panel derecho — formulario ──────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          {/* Logo — solo mobile */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Coffee size={15} className="text-primary-foreground" />
            </div>
            <span className="text-foreground text-sm font-medium">
              {storeName}
            </span>
          </div>

          {/* Encabezado */}
          <div className="mb-9">
            <h1 className="text-2xl font-normal text-foreground italic mb-2 leading-tight">
              Bienvenido de vuelta
            </h1>
            <p className="text-sm text-muted-foreground">
              Inicia sesión para continuar
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className={`block text-[11px] uppercase tracking-[0.12em] font-medium transition-colors duration-200 ${
                  focused === "email" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Correo electrónico
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                placeholder="usuario@ejemplo.com"
                className={`w-full bg-secondary/50 rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border transition-all duration-200 ${
                  focused === "email"
                    ? "border-primary ring-2 ring-primary/10"
                    : "border-border hover:border-border/60"
                }`}
              />
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className={`block text-[11px] uppercase tracking-[0.12em] font-medium transition-colors duration-200 ${
                  focused === "password"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  placeholder="••••••••"
                  className={`w-full bg-secondary/50 rounded-xl px-4 py-3.5 pr-12 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border transition-all duration-200 ${
                    focused === "password"
                      ? "border-primary ring-2 ring-primary/10"
                      : "border-border hover:border-border/60"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className={`w-full rounded-xl py-3.5 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 mt-2 ${
                loading
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              }`}
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="inline-block w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground"
                    />
                    Iniciando...
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    Iniciar sesión
                    <ArrowRight size={15} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>

          {/* Link registro */}
          <div className="mt-8 pt-6 border-t border-border flex justify-center">
            <Link
              href="/createAccount"
              className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              ¿Primera vez aquí? Crear cuenta →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
