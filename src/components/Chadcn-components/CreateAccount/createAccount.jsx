"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supa";
import { motion, AnimatePresence } from "framer-motion";
import { ImageUpload } from "../Configuracion/image-upload";
import { sileo } from "sileo";
import Image from "next/image";
import { logoApp } from "@/utils/image";
import axios from "axios";
import { Eye, EyeOff, ArrowRight, Coffee, Check, X } from "lucide-react";
import Link from "next/link";

// ─── Helpers (sin cambios) ────────────────────────────────────────────────────

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

const PARTICLES = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  size: [5, 9, 7, 4, 11][i],
  top: [20, 65, 45, 80, 30][i],
  left: [12, 25, 70, 50, 85][i],
  delay: [0.2, 1.4, 0.7, 2.0, 0.5][i],
  duration: [4.2, 5.2, 3.9, 5.8, 4.6][i],
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

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const previewUrlRef = useRef(null);

  // Reglas de contraseña en tiempo real
  const pwRules = PW_RULES.map((r) => ({ ...r, ok: r.test(password) }));
  const pwStarted = password.length > 0;

  useEffect(() => {
    fetchUserSession().then((id) => {
      if (id) router.push("/");
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
        headers: { "Content-Type": "multipart/form-data" },
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

    let imagePayload = null;
    if (avatarFile) {
      const uploaded = await uploadImageToServer(avatarFile);
      if (uploaded) {
        imagePayload = uploaded;
      } else if (avatarFile.size <= 200 * 1024) {
        try {
          imagePayload = await fileToBase64(avatarFile);
        } catch (err) {
          console.warn("No se pudo convertir a base64:", err);
        }
      } else {
        throw new Error(
          "No se pudo subir la imagen. Intenta con otra o pega una URL.",
        );
      }
    }

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("name", name);
    if (imagePayload) formData.append("image", imagePayload);

    const res = await axios.put("api/login", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (!res?.data) throw new Error("No se recibió respuesta del servidor.");
    if (res.status === 200 || res.status === 201) router.push("/login");
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const promise = performSignup();
      sileo.promise(promise, {
        loading: { title: "Creando cuenta..." },
        success: (res) => {
          if (res?.userId) router.push("/");
          return {
            title: "Cuenta creada",
            description: res?.message ?? "Cuenta creada correctamente.",
          };
        },
        error: (err) => {
          console.error("Signup error:", err);
          return {
            title: "Error al crear cuenta",
            description: err?.message ?? "Error al crear la cuenta.",
          };
        },
      });
    } catch (error) {
      sileo.error({
        title: "Error al crear cuenta",
        description: error.message || "Error inesperado.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_DEPLOYMENT}/updatePassword`,
        },
      });
      if (error) throw error;
    } catch (err) {
      sileo.error({
        title: "Error con Google",
        description: err.message || "Error inesperado.",
      });
    }
  };

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
            Crea tu tienda
          </p>
          <h2 className="text-[40px] font-normal leading-[1.15] text-foreground italic m-0">
            Empieza a<br />
            <span className="text-primary">vender</span>
            <br />
            hoy mismo.
          </h2>
        </motion.div>

        {/* Beneficios */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="space-y-3"
        >
          {[
            "Catálogo online en minutos",
            "Pedidos y pagos integrados",
            "Tu tienda, tu marca",
          ].map((txt) => (
            <div key={txt} className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <Check size={11} className="text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">{txt}</span>
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
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Coffee size={15} className="text-primary-foreground" />
            </div>
            <span className="text-foreground text-sm font-medium">Roumenu</span>
          </div>

          {/* Encabezado */}
          <div className="mb-8">
            <h1 className="text-2xl font-normal text-foreground italic mb-2 leading-tight">
              Crea tu cuenta
            </h1>
            <p className="text-sm text-muted-foreground">
              Únete y empieza a gestionar tu tienda
            </p>
          </div>

          {/* Avatar */}
          <div className="flex justify-center mb-7">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border bg-secondary">
                <Image
                  src={avatarPreview || logoApp}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  width={80}
                  height={80}
                />
              </div>
              {/* Overlay de edición */}
              <div className="absolute inset-0 rounded-full bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ImageUpload onImageSelect={handleAvatarFileChange} />
              </div>
              {/* Badge indicador */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                <span className="text-primary-foreground text-[10px] font-bold">
                  +
                </span>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSignup} className="space-y-4" noValidate>
            {/* Nombre */}
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className={`block text-[11px] uppercase tracking-[0.12em] font-medium transition-colors duration-200 ${
                  focused === "name" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Nombre completo
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocused("name")}
                onBlur={() => setFocused(null)}
                placeholder="Tu nombre"
                required
                className={`w-full bg-secondary/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border transition-all duration-200 ${
                  focused === "name"
                    ? "border-primary ring-2 ring-primary/10"
                    : "border-border hover:border-border/60"
                }`}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className={`block text-[11px] uppercase tracking-[0.12em] font-medium transition-colors duration-200 ${
                  focused === "email" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                placeholder="correo@ejemplo.com"
                required
                className={`w-full bg-secondary/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border transition-all duration-200 ${
                  focused === "email"
                    ? "border-primary ring-2 ring-primary/10"
                    : "border-border hover:border-border/60"
                }`}
              />
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
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
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  placeholder="••••••••"
                  required
                  className={`w-full bg-secondary/50 rounded-xl px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border transition-all duration-200 ${
                    focused === "password"
                      ? "border-primary ring-2 ring-primary/10"
                      : "border-border hover:border-border/60"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
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

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className={`w-full rounded-xl py-3.5 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 mt-1 ${
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
                    Creando cuenta...
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    Crear cuenta
                    <ArrowRight size={15} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">o</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full rounded-xl py-3 px-6 text-sm font-medium border border-border bg-transparent text-foreground hover:bg-secondary/60 transition-colors flex items-center justify-center gap-2.5"
            >
              {/* SVG Google icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continuar con Google
            </button>
          </form>

          {/* Link login */}
          <div className="mt-7 pt-6 border-t border-border flex justify-center">
            <Link
              href="/login"
              className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              ¿Ya tienes cuenta? Inicia sesión →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
