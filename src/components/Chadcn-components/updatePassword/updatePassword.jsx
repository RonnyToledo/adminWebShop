"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supa";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Coffee,
  Check,
  X,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

// ─── Partículas — mismas que login/register ───────────────────────────────────
const PARTICLES = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  size: [6, 10, 8, 5, 12, 7][i],
  top: [15, 70, 40, 85, 25, 60][i],
  left: [10, 20, 75, 55, 88, 40][i],
  delay: [0, 1.2, 0.6, 2.1, 0.3, 1.7][i],
  duration: [4, 5.5, 3.8, 6, 4.5, 5][i],
}));

// ─── Reglas de contraseña ─────────────────────────────────────────────────────
const PW_RULES = [
  { id: "len", label: "Mínimo 8 caracteres", test: (v) => v.length >= 8 },
  { id: "upper", label: "Una mayúscula", test: (v) => /[A-Z]/.test(v) },
  { id: "lower", label: "Una minúscula", test: (v) => /[a-z]/.test(v) },
  { id: "number", label: "Un número", test: (v) => /[0-9]/.test(v) },
  {
    id: "special",
    label: "Un carácter especial",
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

export default function UpdatePassword() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focused, setFocused] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordTimer = useRef(null);
  const confirmTimer = useRef(null);

  // Reglas en tiempo real
  const pwRules = PW_RULES.map((r) => ({ ...r, ok: r.test(password) }));
  const pwStarted = password.length > 0;
  const pwsMatch = password.length > 0 && password === confirmPassword;

  useEffect(() => {
    async function initSessionFromUrl() {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (access_token && refresh_token) {
        const {
          data: { session },
          error: setErrorSession,
        } = await supabase.auth.setSession({ access_token, refresh_token });
        if (setErrorSession || !session) {
          setError("No se pudo iniciar sesión con los tokens proporcionados.");
          return;
        }
        setUser(session.user);
      } else {
        const {
          data: { user: existingUser },
        } = await supabase.auth.getUser();
        if (existingUser) setUser(existingUser);
        else router.replace("/login");
      }
    }

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUser(user);
    }

    loadUser();
    initSessionFromUrl();

    return () => {
      clearTimeout(passwordTimer.current);
      clearTimeout(confirmTimer.current);
    };
  }, [router]);

  // Toggle con auto-ocultar a los 3s
  const togglePassword = () => {
    setShowPassword(true);
    clearTimeout(passwordTimer.current);
    passwordTimer.current = setTimeout(() => setShowPassword(false), 3000);
  };
  const toggleConfirm = () => {
    setShowConfirm(true);
    clearTimeout(confirmTimer.current);
    confirmTimer.current = setTimeout(() => setShowConfirm(false), 3000);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(null);

    const pwErr = PW_RULES.find((r) => !r.test(password));
    if (pwErr) {
      setError(pwErr.label + ".");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/"), 1800);
    }
  };

  // Estado de carga inicial (sin user aún)
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="inline-block w-5 h-5 rounded-full border-2 border-border border-t-primary"
            style={{ display: "block" }}
          />
          <span className="text-sm text-muted-foreground italic">
            Verificando sesión...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex overflow-hidden relative">
      {/* Textura sutil */}
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
          transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[11px] text-primary uppercase tracking-[0.18em] mb-5 font-medium">
            Seguridad de cuenta
          </p>
          <h2 className="text-[40px] font-normal leading-[1.15] text-foreground italic m-0">
            Protege
            <br />
            <span className="text-primary">tu acceso</span>
            <br />
            con una clave segura.
          </h2>
        </motion.div>

        {/* Tips de seguridad */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="space-y-3"
        >
          {[
            "Mínimo 8 caracteres",
            "Combina letras y números",
            "Usa caracteres especiales",
          ].map((tip) => (
            <div key={tip} className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <ShieldCheck size={11} className="text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">{tip}</span>
            </div>
          ))}
        </motion.div>

        <p className="text-xs text-muted-foreground/50 m-0">
          © {new Date().getFullYear()} Roumenu
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
          {/* Logo mobile */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Coffee size={15} className="text-primary-foreground" />
            </div>
            <span className="text-foreground text-sm font-medium">Roumenu</span>
          </div>

          {/* Encabezado */}
          <div className="mb-9">
            <h1 className="text-2xl font-normal text-foreground italic mb-2 leading-tight">
              Nueva contraseña
            </h1>
            <p className="text-sm text-muted-foreground">
              {user?.email ?? "Elige una contraseña segura para tu cuenta"}
            </p>
          </div>

          {/* Estado de éxito */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Check size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Contraseña actualizada
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Redirigiendo...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-5 flex items-center gap-2.5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20"
              >
                <X size={14} className="text-destructive shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Formulario */}
          <form onSubmit={handleUpdate} className="space-y-5">
            {/* Nueva contraseña */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className={`block text-[11px] uppercase tracking-[0.12em] font-medium transition-colors duration-200 ${
                  focused === "password"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                  placeholder="••••••••"
                  required
                  className={`w-full bg-secondary/50 rounded-xl px-4 py-3.5 pr-12 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border transition-all duration-200 ${
                    focused === "password"
                      ? "border-primary ring-2 ring-primary/10"
                      : "border-border hover:border-border/60"
                  }`}
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Reglas en tiempo real */}
              <AnimatePresence>
                {pwStarted && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-2">
                      {pwRules.map((r) => (
                        <div key={r.id} className="flex items-center gap-1.5">
                          <div
                            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 ${
                              r.ok ? "bg-primary/20" : "bg-muted"
                            }`}
                          >
                            {r.ok ? (
                              <Check size={8} className="text-primary" />
                            ) : (
                              <X
                                size={8}
                                className="text-muted-foreground/50"
                              />
                            )}
                          </div>
                          <span
                            className={`text-[10px] transition-colors duration-200 ${
                              r.ok ? "text-primary" : "text-muted-foreground/60"
                            }`}
                          >
                            {r.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Confirmar contraseña */}
            <div className="space-y-2">
              <label
                htmlFor="confirm"
                className={`block text-[11px] uppercase tracking-[0.12em] font-medium transition-colors duration-200 ${
                  focused === "confirm"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocused("confirm")}
                  onBlur={() => setFocused(null)}
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                  placeholder="••••••••"
                  required
                  className={`w-full bg-secondary/50 rounded-xl px-4 py-3.5 pr-12 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border transition-all duration-200 ${
                    focused === "confirm"
                      ? "border-primary ring-2 ring-primary/10"
                      : confirmPassword.length > 0
                        ? pwsMatch
                          ? "border-primary/50"
                          : "border-destructive/50"
                        : "border-border hover:border-border/60"
                  }`}
                />
                <button
                  type="button"
                  onClick={toggleConfirm}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Indicador de coincidencia */}
              {confirmPassword.length > 0 && (
                <p
                  className={`text-[11px] transition-colors duration-200 ${
                    pwsMatch ? "text-primary" : "text-destructive/70"
                  }`}
                >
                  {pwsMatch
                    ? "✓ Las contraseñas coinciden"
                    : "Las contraseñas no coinciden"}
                </p>
              )}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading || success}
              whileHover={{ scale: loading || success ? 1 : 1.02 }}
              whileTap={{ scale: loading || success ? 1 : 0.98 }}
              className={`w-full rounded-xl py-3.5 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 mt-1 ${
                loading || success
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
                    Guardando...
                  </motion.span>
                ) : success ? (
                  <motion.span
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Check size={15} />
                    Guardado
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    Guardar contraseña
                    <ArrowRight size={15} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>

          {/* Link volver */}
          <div className="mt-8 pt-6 border-t border-border flex justify-center">
            <Link
              href="/login"
              className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              ← Volver al inicio de sesión
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
