"use client";

import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supa";
import { motion } from "framer-motion";
import { ImageUpload } from "../Configuracion/image-upload";
import { toast } from "sonner";
import Image from "next/image";
import { logoApp } from "@/utils/image";
import axios from "axios";

/** Helpers */
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Error reading file"));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });

// simple client-side resize/compress using canvas (returns Blob)
const compressImage = async (file, maxWidth = 1024, quality = 0.8) => {
  if (!file.type.startsWith("image/")) return file;
  const img = await new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const i = new Image();
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
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return await new Promise((resolve) =>
    canvas.toBlob(
      (blob) => {
        if (!blob) resolve(file);
        else resolve(new File([blob], file.name, { type: file.type }));
      },
      file.type,
      quality
    )
  );
};

async function fetchUserSession() {
  try {
    const res = await fetch("/api/login");
    if (!res.ok) return null;
    const data = await res.json();
    // intenta adaptarte a la forma que devuelve tu /api/login
    // usa data?.user?.id ó data?.user?.user?.id según tu API
    return data?.user?.id || data?.user?.user?.id || null;
  } catch (error) {
    console.error("Error al obtener la sesión del usuario:", error);
    return null;
  }
}

export default function CreateAccount() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [avatarUrlInput, setAvatarUrlInput] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const previewUrlRef = useRef(null);

  useEffect(() => {
    async function UserFetch() {
      const userId = await fetchUserSession();
      if (userId) {
        router.push("/");
      }
    }
    UserFetch();
  }, [router]);

  useEffect(() => {
    // cleanup preview on unmount
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  const validatePassword = (pw) => {
    if (!pw || pw.length < 8)
      return "La contraseña debe tener al menos 8 caracteres.";
    if (!/[A-Z]/.test(pw))
      return "La contraseña debe contener al menos una letra mayúscula.";
    if (!/[a-z]/.test(pw))
      return "La contraseña debe contener al menos una letra minúscula.";
    if (!/[0-9]/.test(pw))
      return "La contraseña debe contener al menos un número.";
    if (!/[^A-Za-z0-9]/.test(pw))
      return "La contraseña debe contener al menos un carácter especial.";
    return null;
  };

  const handleAvatarFileChange = async (incoming) => {
    // ImageUpload podría pasar directamente el File o un event; nos adaptamos
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

    // limitar tamaño máximo (ej. 2MB). Puedes ajustar.
    const MAX_SIZE_BYTES = 2 * 1024 * 1024;
    let fileToUse = file;
    if (file.size > MAX_SIZE_BYTES) {
      // intentar comprimir
      try {
        const compressed = await compressImage(file, 1024, 0.75);
        if (compressed.size < file.size) fileToUse = compressed;
      } catch (err) {
        console.warn("No se pudo comprimir la imagen:", err);
      }
    }

    setAvatarFile(fileToUse);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    const objUrl = URL.createObjectURL(fileToUse);
    previewUrlRef.current = objUrl;
    setAvatarPreview(objUrl);
    setAvatarUrlInput("");
  };

  // sube el archivo a /api/uploadImage (usa FormData correctamente)
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
      console.warn("Error subiendo archivo al servidor:", err);
      // si la subida falla, devolvemos null y el flujo puede intentar base64 si es pequeño
      return null;
    }
  };

  // Intentos con backoff para signUp
  const signUpWithRetries = async (payload, attempts = 3) => {
    let lastErr = null;
    for (let i = 0; i < attempts; i++) {
      try {
        const { data, error } = await supabase.auth.signUp(payload);
        if (error) throw error;
        return { data, error: null };
      } catch (err) {
        lastErr = err;
        // si es error no-retry, romper (p.e. validation)
        const msg = String(err?.message || err);
        // reintentar solo para errores de red/timeout
        if (
          /timeout|504|network|ECONNABORTED|AuthRetryableFetchError/i.test(
            msg
          ) &&
          i < attempts - 1
        ) {
          await new Promise((r) => setTimeout(r, 500 * (i + 1)));
          continue;
        } else {
          throw err;
        }
      }
    }
    throw lastErr;
  };

  const performSignup = async () => {
    // validaciones cliente
    if (!email) throw new Error("Ingresa un email válido.");
    if (!name || name.trim().length < 2) throw new Error("Ingresa tu nombre.");
    const pwErr = validatePassword(password);
    if (pwErr) throw new Error(pwErr);

    let imagePayload = null;

    // 1) Prioridad: URL pegada por el usuario
    if (avatarUrlInput && avatarUrlInput.trim()) {
      imagePayload = avatarUrlInput.trim();
    } else if (avatarFile) {
      // 2) Intentar subir a bucket vía /api/uploadImage
      const uploaded = await uploadImageToServer(avatarFile);
      if (uploaded) {
        imagePayload = uploaded;
      } else {
        // 3) Si la subida falló y el archivo es pequeño (<200KB), convertir a base64
        const SMALL_LIMIT = 200 * 1024;
        if (avatarFile.size <= SMALL_LIMIT) {
          try {
            const b64 = await fileToBase64(avatarFile);
            imagePayload = b64; // ten en cuenta el tamaño
          } catch (err) {
            console.warn("No se pudo convertir a base64:", err);
          }
        } else {
          // Si no podemos subir y es grande, avisamos al usuario
          throw new Error(
            "No se pudo subir la imagen. Intenta con otra imagen o pega una URL."
          );
        }
      }
    }

    // NO loggear contraseñas!!
    console.info("Creando cuenta para:", email);

    // Preparar payload según supabase-js v2
    const payload = {
      email,
      password,
      options: {
        data: {
          full_name: name,
          ...(imagePayload
            ? { avatar_url: imagePayload, picture: imagePayload }
            : {}),
        },
      },
    };

    // Intentar signUp con reintentos ante timeouts transitorios
    const { data, error } = await signUpWithRetries(payload, 3);
    if (error) throw error;

    const userId = data?.user?.id ?? null;
    if (!userId) {
      return {
        userId: null,
        message: imagePayload
          ? "Revisa tu correo para confirmar la cuenta. (La imagen se añadió a los metadatos.)"
          : "Revisa tu correo para confirmar la cuenta.",
      };
    }
    return {
      userId,
      message: imagePayload
        ? "Cuenta creada correctamente. Imagen incluida en metadata."
        : "Cuenta creada correctamente.",
    };
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const promise = performSignup();
      toast.promise(promise, {
        loading: "Creando cuenta...",
        success: (res) => {
          const msg = res?.message ?? "Cuenta creada correctamente.";
          if (res?.userId) {
            router.push("/");
          }
          return msg;
        },
        error: (err) => {
          const msg =
            err?.message ??
            err?.error_description ??
            "Error al crear la cuenta. Revisa la consola y logs del servidor.";
          console.error("Signup error:", err);
          return `${msg}`;
        },
      });
    } catch (error) {
      toast.error(error.message || "Error inesperado al crear la cuenta.");
      console.error("handleSignup error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_REDIRECT_URL}/updatePassword`,
        },
      });
      if (error) throw error;
    } catch (err) {
      toast.error("Error al iniciar sesión con Google");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white rounded-3xl shadow-xl p-8"
        >
          <h1 className="text-2xl font-bold text-slate-800 mb-4 text-center">
            Crear cuenta
          </h1>
          <div className="flex justify-center mb-4">
            <div className="relative w-24 h-24 rounded-full bg-white p-1 shadow-lg group">
              <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden">
                <Image
                  id={`login-img`}
                  src={avatarPreview || logoApp}
                  alt={"login-img"}
                  className="w-full h-full object-cover"
                  width={100}
                  height={100}
                />
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <ImageUpload onImageSelect={handleAvatarFileChange} />
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Nombre completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border px-3 py-2"
                placeholder="Tu nombre"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border px-3 py-2"
                placeholder="correo@ejemplo.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border px-3 py-2 pr-20"
                  placeholder="Contraseña segura"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate-600"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Mínimo 8 caracteres, incluye mayúscula, minúscula, número y
                carácter especial.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full py-3 rounded-xl"
              disabled={loading}
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>

            <div className="text-center text-sm text-slate-600 mt-2">o</div>

            <Button
              variant="outline"
              className="flex w-full py-3 rounded-xl hover:bg-gray-300 transition-colors font-medium"
              onClick={handleGoogleLogin}
              type="button"
            >
              {/* icon */}
              Iniciar con Google
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
