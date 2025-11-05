"use client";
import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supa";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff } from "lucide-react";

export default function UpdatePassword() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const passwordTimer = useRef(null);
  const confirmTimer = useRef(null);

  // 1. Al montar, extraemos tokens de la URL y autenticamos al usuario
  useEffect(() => {
    async function initSessionFromUrl() {
      // Chequear fragmento en URL
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (access_token && refresh_token) {
        // Establecer sesión manualmente
        const {
          data: { session },
          error: setErrorSession,
        } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (setErrorSession || !session) {
          console.error("Error al establecer sesión:", setErrorSession);
          setError("No se pudo iniciar sesión con los tokens proporcionados.");
          return;
        }
        setUser(session.user);
      } else {
        // Intentar leer sesión existente
        const {
          data: { user: existingUser },
        } = await supabase.auth.getUser();
        if (existingUser) {
          setUser(existingUser);
        } else {
          router.replace("/login");
        }
      }
    }
    async function loadUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) {
        console.error("Error obtener session de google", error);
      } else {
        console.info("Session obtenida de google", user);
      }
    }
    loadUser();
    initSessionFromUrl();

    // Limpiar timers al desmontar
    return () => {
      clearTimeout(passwordTimer.current);
      clearTimeout(confirmTimer.current);
    };
  }, [router]);

  const togglePasswordVisibility = () => {
    // Mostrar solo 3 segundos
    setShowPassword(true);
    clearTimeout(passwordTimer.current);
    passwordTimer.current = setTimeout(() => {
      setShowPassword(false);
    }, 3000);
  };

  const toggleConfirmVisibility = () => {
    setShowConfirm(true);
    clearTimeout(confirmTimer.current);
    confirmTimer.current = setTimeout(() => {
      setShowConfirm(false);
    }, 3000);
  };

  // 2. Submit para actualizar contraseña
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
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
      router.push("/");
    }
  };

  // 3. Mostrar loader mientras carga user
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Cargando...</p>
      </div>
    );
  }

  // 4. UI para update password
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md"
      >
        <h1 className="text-2xl font-bold text-slate-800 mb-6 text-center">
          Establecer nueva contraseña
        </h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="relative">
            <Input
              className="w-full bg-slate-50 pl-12 pr-12 py-3 rounded-xl border border-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              type={showPassword ? "text" : "password"}
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
            />
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            {showPassword ? (
              <EyeOff
                className="absolute right-3 top-3 cursor-pointer"
                onClick={() => setShowPassword(false)}
              />
            ) : (
              <Eye
                className="absolute right-3 top-3 cursor-pointer"
                onClick={() => setShowPassword(true)}
              />
            )}
          </div>

          <div className="relative ">
            <Input
              className="w-full bg-slate-50 pl-12 pr-12 py-3 rounded-xl border border-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              type={showConfirm ? "text" : "password"}
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
            />
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            {showConfirm ? (
              <EyeOff
                className="absolute right-3 top-3 cursor-pointer"
                onClick={() => setShowConfirm(false)}
              />
            ) : (
              <Eye
                className="absolute right-3 top-3 cursor-pointer"
                onClick={() => setShowConfirm(true)}
              />
            )}
          </div>

          <Button
            type="submit"
            className="w-full py-3"
            variant="ghost"
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar contraseña"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
