"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { ImageUpload } from "../Configuracion/image-upload";
import { toast } from "sonner";
import Image from "next/image";
import { logoAdmin } from "@/utils/image";
import axios from "axios";
import { Eye, EyeOff, Check, X, User, Mail, Lock } from "lucide-react";
import Link from "next/link";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Error reading file"));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });

const compressImage = async (file, maxWidth = 1024, quality = 0.8) => {
  if (!file.type.startsWith("image/")) return file;
  const img = await new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const i = new window.Image();
    i.onload = () => {
      URL.revokeObjectURL(url);
      res(i);
    };
    i.onerror = rej;
    i.src = url;
  });
  const scale = Math.min(1, maxWidth / img.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  return await new Promise((resolve) =>
    canvas.toBlob(
      (blob) =>
        resolve(blob ? new File([blob], file.name, { type: file.type }) : file),
      file.type,
      quality,
    ),
  );
};

async function fetchUserSession() {
  try {
    const res = await fetch("/api/login");
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user?.id || data?.user?.user?.id || null;
  } catch (error) {
    console.error("Error al obtener la sesión del usuario:", error);
    return null;
  }
}

// ─── Reglas de contraseña ─────────────────────────────────────────────────────

const PW_RULES = [
  { id: "len", label: "Mínimo 8 caracteres", test: (v) => v.length >= 8 },
  { id: "upper", label: "Una letra mayúscula", test: (v) => /[A-Z]/.test(v) },
  { id: "lower", label: "Una letra minúscula", test: (v) => /[a-z]/.test(v) },
  { id: "number", label: "Un número", test: (v) => /[0-9]/.test(v) },
  {
    id: "special",
    label: "Un carácter especial",
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

const validatePassword = (pw) => {
  for (const rule of PW_RULES) {
    if (!rule.test(pw)) return rule.label + ".";
  }
  return null;
};

const BUBBLES = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  size: [8, 14, 10, 6, 12][i],
  top: [25, 55, 35, 70, 20][i],
  left: [15, 80, 50, 30, 70][i],
  delay: [0.2, 1.0, 0.5, 1.6, 0.3][i],
  duration: [4.2, 5.2, 3.9, 4.8, 4.4][i],
}));

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CreateAccount() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const previewUrlRef = useRef(null);

  // Reglas de contraseña en tiempo real
  const pwRules = PW_RULES.map((r) => ({ ...r, ok: r.test(password) }));
  const pwStarted = password.length > 0;

  useEffect(() => {
    fetchUserSession().then((id) => {
      if (id) router.refresh();
    });
  }, [router]);

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  const handleAvatarFileChange = async (incoming) => {
    const file = incoming?.target ? incoming.target.files?.[0] : incoming;
    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(null);
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      return;
    }
    const MAX_SIZE = 2 * 1024 * 1024;
    let fileToUse = file;
    if (file.size > MAX_SIZE) {
      try {
        const c = await compressImage(file, 1024, 0.75);
        if (c.size < file.size) fileToUse = c;
      } catch (err) {
        console.warn("No se pudo comprimir:", err);
      }
    }
    setAvatarFile(fileToUse);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    const url = URL.createObjectURL(fileToUse);
    previewUrlRef.current = url;
    setAvatarPreview(url);
  };

  const uploadImageToServer = async (file) => {
    if (!file) return null;
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await axios.post("/api/uploadImage", form, {
        timeout: 20000,
      });
      return res?.data?.secure_url || res?.data?.url || null;
    } catch (err) {
      console.warn("Error subiendo imagen:", err);
      return null;
    }
  };

  const performSignup = async () => {
    if (!email) throw new Error("Ingresa un email válido.");
    if (!name || name.trim().length < 2) throw new Error("Ingresa tu nombre.");
    const pwErr = validatePassword(password);
    if (pwErr) throw new Error(pwErr);
    if (!acceptTerms)
      throw new Error("Debes aceptar la política y los términos.");

    let avatarUrl = null;
    if (avatarFile) {
      const uploaded = await uploadImageToServer(avatarFile);
      if (uploaded) {
        avatarUrl = uploaded;
      } else if (avatarFile.size <= 200 * 1024) {
        try {
          avatarUrl = await fileToBase64(avatarFile);
        } catch (err) {
          console.warn("No se pudo convertir a base64:", err);
        }
      } else {
        throw new Error("No se pudo subir la imagen. Intenta con otra.");
      }
    }

    const res = await axios.put("/api/login", {
      email,
      password,
      metadata: {
        full_name: name.trim(),
        ...(avatarUrl ? { avatar_url: avatarUrl, picture: avatarUrl } : {}),
      },
    });

    if (!res?.data) throw new Error("No se recibió respuesta del servidor.");
    if (res.status === 200 || res.status === 201) router.push("/");
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const promise = performSignup();
      toast.promise(promise, {
        loading: "Creando cuenta...",
        success: (res) => {
          if (res?.userId) router.push("/");
          return (
            "Cuenta creada",
            {
              description: res?.message ?? "Cuenta creada correctamente.",
            }
          );
        },
        error: (err) => {
          console.error("Signup error:", err);
          return (
            "Error al crear cuenta",
            {
              description:
                err.message + ": " + err.response?.data?.error ??
                "Error al crear la cuenta.",
            }
          );
        },
      });
    } catch (error) {
      toast.error("Error al crear cuenta", {
        description:
          error.message + ": " + error.response?.data?.error ||
          "Error inesperado.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    try {
      await authService.signInWithGoogle("/");
    } catch (err) {
      toast.error("Error con Google", {
        description: err.message || "Error inesperado.",
      });
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-950 via-slate-700 to-slate-950 relative overflow-hidden">
      {/* Glows ambientales del fondo */}
      <motion.div
        aria-hidden
        animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-slate-900 blur-3xl"
      />
      <motion.div
        aria-hidden
        animate={{ y: [0, -25, 0], x: [0, 15, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-slate-900 blur-3xl"
      />

      {/* ── Card principal ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md bg-card rounded-[2rem] shadow-2xl overflow-hidden"
      >
        {/* Header con blob/curva gradiente */}
        <div className="relative h-44 sm:h-48 overflow-hidden">
          <svg
            aria-hidden
            viewBox="0 0 400 200"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
          >
            <defs>
              <linearGradient
                id="signup-blob"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
            </defs>
            <path
              d="M0,0 L400,0 L400,130 C320,170 260,110 200,140 C140,170 70,130 0,160 Z"
              fill="url(#signup-blob)"
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
            className="relative z-10 px-8 pt-8"
          >
            <p className="text-white/80 text-base sm:text-lg font-light tracking-wide">
              Hola,
            </p>
            <h1 className="text-white text-4xl sm:text-5xl font-bold italic leading-tight mt-1">
              Sign Up!
            </h1>
          </motion.div>
        </div>

        {/* Formulario */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="px-7 sm:px-9 pt-2 pb-7"
        >
          {/* Avatar — flotando sobre la curva */}
          <div className="flex justify-center -mt-12 mb-4">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-card bg-secondary shadow-lg">
                <Image
                  src={avatarPreview || logoAdmin}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  width={80}
                  height={80}
                />
              </div>
              <div className="absolute inset-0 rounded-full bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ImageUpload onImageSelect={handleAvatarFileChange} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary border-2 border-card flex items-center justify-center">
                <span className="text-primary-foreground text-[11px] font-bold leading-none">
                  +
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4" noValidate>
            {/* Nombre */}
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className={`block text-[10px] uppercase tracking-[0.18em] font-semibold transition-colors duration-200 ${
                  focused === "name"
                    ? "text-primary"
                    : "text-muted-foreground/80"
                }`}
              >
                User Name
              </label>
              <div
                className={`relative flex items-center bg-secondary/60 rounded-full border transition-all duration-200 ${
                  focused === "name"
                    ? "border-primary ring-4 ring-primary/10"
                    : "border-border hover:border-border/80"
                }`}
              >
                <User
                  size={16}
                  className={`absolute left-4 transition-colors ${
                    focused === "name"
                      ? "text-primary"
                      : "text-muted-foreground/60"
                  }`}
                />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                  placeholder="Tu nombre"
                  required
                  className="w-full bg-transparent rounded-full pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
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
                  className={`absolute left-4 transition-colors ${
                    focused === "email"
                      ? "text-primary"
                      : "text-muted-foreground/60"
                  }`}
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  placeholder="correo@ejemplo.com"
                  required
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
                  className={`absolute left-4 transition-colors ${
                    focused === "password"
                      ? "text-primary"
                      : "text-muted-foreground/60"
                  }`}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  placeholder="Enter password"
                  required
                  className="w-full bg-transparent rounded-full pl-11 pr-11 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-4 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Indicador de reglas en tiempo real */}
              <AnimatePresence>
                {pwStarted && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-2 px-1">
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

            {/* Términos */}
            <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
              <button
                type="button"
                onClick={() => setAcceptTerms((v) => !v)}
                className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ${
                  acceptTerms
                    ? "bg-slate-700 border-slate-500"
                    : "bg-slate-200 border border-border"
                }`}
                aria-pressed={acceptTerms}
                aria-label="Aceptar términos"
              >
                <AnimatePresence>
                  {acceptTerms && (
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
              <span className="text-xs text-muted-foreground">
                Acepto la política y los términos
              </span>
            </label>

            {/* Submit pill */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              className={`w-full rounded-full py-3.5 px-6 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 mt-2 shadow-lg shadow-primary/30 ${
                loading
                  ? "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-slate-800 to-slate-600 text-white hover:shadow-xl hover:shadow-primary/40 cursor-pointer"
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
                    Creando cuenta...
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Sign up
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>

          {/* Iconos sociales */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <motion.button
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || loadingGoogle}
              aria-label="Google"
              className="w-10 h-10 rounded-full bg-[#EA4335] text-white flex items-center justify-center shadow-md hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingGoogle ? (
                <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M21.35 11.1H12v3.2h5.35c-.5 2.4-2.55 3.7-5.35 3.7-3.25 0-5.9-2.65-5.9-5.9s2.65-5.9 5.9-5.9c1.45 0 2.75.5 3.8 1.5L18.1 5.3C16.45 3.85 14.35 3 12 3 6.95 3 3 6.95 3 12s3.95 9 9 9c4.45 0 8.5-3.25 8.5-9 0-.45-.05-.9-.15-1.4z" />
                </svg>
              )}
            </motion.button>
          </div>

          {/* Link login */}
          <div className="mt-5 flex justify-center">
            <Link
              href="/login"
              className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              ¿Ya tienes cuenta?{" "}
              <span className="text-primary font-medium">Inicia sesión →</span>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
