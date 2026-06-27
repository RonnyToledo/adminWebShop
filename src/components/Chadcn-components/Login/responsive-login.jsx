"use client";
import React, { useContext, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Check } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Loading from "../../component/loading";
import { ThemeContext } from "@/context/useContext";
import { authService } from "@/lib/supabase";
import { getSupabaseClient } from "@/lib/supabase";
import { useAccountSwitcher } from "@/lib/useAccountSwitcher";

const BUBBLES = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  size: [8, 14, 10, 6, 12][i],
  top: [25, 55, 35, 70, 20][i],
  left: [15, 80, 50, 30, 70][i],
  delay: [0, 0.8, 0.4, 1.5, 0.2][i],
  duration: [4, 5, 3.5, 4.5, 4.2][i],
}));

export default function ResponsiveLogin({ user }) {
  const { webshop } = useContext(ThemeContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { registerAccount } = useAccountSwitcher();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingCharge] = useState(false);
  const [focused, setFocused] = useState(null);

  // MyProvider ya recibe isAddMode desde el layout (server) y no redirige.
  // Aquí lo leemos con useSearchParams (SSR-safe) para adaptar la UI del form.
  const isAddMode = searchParams.get("add") === "true";

  const storeName = webshop?.store?.name ?? "Roumenu";

  // Solo redirige si hay sesión activa Y no estamos en modo "añadir cuenta".
  // En modo add, MyProvider ya fue instruido para dejar pasar la ruta /login.
  useEffect(() => {
    if (user && !isAddMode) {
      router.replace("/");
      router.refresh();
    }
  }, [user, router, isAddMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authService.signIn(email, password);

      // Obtener la sesión real de Supabase para tener los tokens
      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session && data.user) {
        registerAccount(
          session,
          data.user,
          {
            name: data.user.user_metadata?.name ?? null,
            avatar: data.user.user_metadata?.avatar_url ?? null,
            store_name: data.sitioweb ?? null,
          },
          remember,
        );
      }

      window.location.assign("/");
    } catch (err) {
      console.error(err);
      toast.error("Error al iniciar sesión", {
        description: err.message || "Error inesperado.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingCharge) return <Loading />;

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-amber-700 to-black relative overflow-hidden">
      <motion.div
        aria-hidden
        animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-amber-950 blur-3xl"
      />
      <motion.div
        aria-hidden
        animate={{ y: [0, -25, 0], x: [0, 15, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-amber-950 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md bg-card rounded-[2rem] shadow-2xl overflow-hidden m-4 sm:m-6"
      >
        {/* Header blob */}
        <div className="relative h-48 sm:h-52 overflow-hidden">
          <svg
            aria-hidden
            viewBox="0 0 400 220"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
          >
            <defs>
              <linearGradient
                id="login-blob"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="oklch(26.6% 0.079 36.259)" />
                <stop offset="100%" stopColor="oklch(28.6% 0.066 53.813)" />
              </linearGradient>
            </defs>
            <path
              d="M0,0 L400,0 L400,140 C320,180 280,120 200,150 C120,180 60,140 0,170 Z"
              fill="url(#login-blob)"
            />
          </svg>

          {BUBBLES.map((b) => (
            <motion.span
              key={b.id}
              aria-hidden
              animate={{ y: [-6, 6, -6], opacity: [0.25, 0.55, 0.25] }}
              transition={{
                duration: b.duration,
                delay: b.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute rounded-full bg-white/40"
              style={{
                width: b.size,
                height: b.size,
                top: `${b.top}%`,
                left: `${b.left}%`,
              }}
            />
          ))}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="relative z-10 px-8 pt-6"
          >
            <p className="text-white/80 text-base sm:text-lg font-light tracking-wide">
              {isAddMode ? "Añadir otra cuenta" : "Bienvenido de vuelta,"}
            </p>
            <h1 className="text-white text-4xl sm:text-5xl font-bold italic leading-tight mt-1">
              Log In!
            </h1>
            <p className="text-white/70 text-xs mt-2 tracking-wide">
              {storeName}
            </p>
          </motion.div>
        </div>

        {/* Formulario */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="px-7 sm:px-9 pt-4 pb-8"
        >
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className={`block text-[10px] uppercase tracking-[0.18em] font-semibold transition-colors duration-200 ${
                  focused === "email"
                    ? "text-primary"
                    : "text-muted-foreground/80"
                }`}
              >
                Email Address
              </label>
              <div
                className={`relative flex items-center bg-secondary/60 rounded-full border transition-all duration-200 ${
                  focused === "email"
                    ? "border-primary ring-4 ring-primary/10"
                    : "border-border hover:border-border/80"
                }`}
              >
                <Mail
                  size={16}
                  className={`absolute left-4 transition-colors ${focused === "email" ? "text-primary" : "text-muted-foreground/60"}`}
                />
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
                  className="w-full bg-transparent rounded-full pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className={`block text-[10px] uppercase tracking-[0.18em] font-semibold transition-colors duration-200 ${
                  focused === "password"
                    ? "text-primary"
                    : "text-muted-foreground/80"
                }`}
              >
                Password
              </label>
              <div
                className={`relative flex items-center bg-secondary/60 rounded-full border transition-all duration-200 ${
                  focused === "password"
                    ? "border-primary ring-4 ring-primary/10"
                    : "border-border hover:border-border/80"
                }`}
              >
                <Lock
                  size={16}
                  className={`absolute left-4 transition-colors ${focused === "password" ? "text-primary" : "text-muted-foreground/60"}`}
                />
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
                  className="w-full bg-transparent rounded-full pl-11 pr-11 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <button
                  type="button"
                  onClick={() => setRemember((v) => !v)}
                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200 ${
                    remember
                      ? "bg-orange-800 border-amber-500"
                      : "bg-orange-200 border border-border"
                  }`}
                  aria-pressed={remember}
                  aria-label="Recordarme"
                >
                  <AnimatePresence>
                    {remember && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Check size={10} className="text-primary-foreground" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
                <span className="text-muted-foreground">
                  Recordarme
                  {remember && (
                    <span className="ml-1 text-amber-600 font-medium">
                      · guarda la cuenta
                    </span>
                  )}
                </span>
              </label>

              <Link
                href="/forgotPassword"
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              className={`w-full rounded-full py-3.5 px-6 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 mt-2 shadow-lg shadow-primary/30 ${
                loading
                  ? "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-orange-800 to-amber-500 text-white hover:shadow-xl hover:shadow-primary/40 cursor-pointer"
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
                      className="inline-block w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white"
                    />
                    Iniciando...
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {isAddMode ? "Añadir cuenta" : "Log in"}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>

          {!isAddMode && (
            <div className="mt-6 flex justify-center">
              <Link
                href="/createAccount"
                className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                ¿Primera vez aquí?{" "}
                <span className="text-primary font-medium">Crear cuenta →</span>
              </Link>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
