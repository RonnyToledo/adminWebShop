"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supa";
import { motion } from "framer-motion";
import IllustrationLogin from "./icons/IllustrationLogin";
import { User, Lock, Eye, EyeOff } from "lucide-react";

async function fetchUserSession() {
  try {
    const res = await fetch("/api/login");
    const data = await res.json();
    if (res.ok && data?.user?.id) {
      return data;
    } else {
      console.log("Usuario no encontrado o error en la respuesta:", data);
    }
  } catch (error) {
    console.error("Error al obtener la sesión del usuario:", error);
  }
}

export function ResponsiveLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function UserFetch() {
      const userId = await fetchUserSession();
      if (userId?.user?.id) {
        router.push("/admin");
        return;
      }
    }
    UserFetch();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleApiCall(false, null);
  };

  const handleGoogleLogin = async () => {
    try {
      const { user, session, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      console.log("a");
      if (error) throw error;
      await handleApiCall(true, session.access_token);
    } catch (error) {
      setError("Error al iniciar sesión con Google");
      console.error(error);
    }
  };

  const handleApiCall = async (isGoogleLogin, token) => {
    setLoading(true);
    setError(null);
    console.log(email, password, token, isGoogleLogin);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: isGoogleLogin ? null : email,
          password: isGoogleLogin ? null : password,
          provider: isGoogleLogin ? "google" : null,
          token: isGoogleLogin ? token : null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/admin");
      } else {
        setError(data.error || "Error al iniciar sesión");
        console.error("Error en la respuesta:", data);
      }
    } catch (error) {
      setError("Error al conectar con el servidor");
      console.error(error);
    } finally {
      setLoading(false);
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
          <div className="flex justify-center mb-8">
            <IllustrationLogin />
          </div>

          <h1 className="text-2xl font-bold text-slate-800 mb-2">Login</h1>
          <p className="text-slate-600 mb-8">Please sign in to continue.</p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  type="text"
                  className="w-full bg-slate-50 pl-12 pr-4 py-3 rounded-xl border border-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  id="username"
                  name="username"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="username@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-slate-50 pl-12 pr-12 py-3 rounded-xl border border-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              {loading ? "Iniciando..." : "Iniciar"}
            </Button>
          </form>
          <div className="inline-flex items-center justify-center w-full">
            <hr className="w-64 h-px my-8 bg-gray-200 border-0 dark:bg-gray-700" />
            <span className="absolute px-3 font-medium text-gray-900 -translate-x-1/2 bg-white left-1/2 dark:text-white dark:bg-gray-900">
              or
            </span>
            <hr className="w-64 h-px my-8 bg-gray-200 border-0 dark:bg-gray-700" />
          </div>
          <Button
            variant="outline"
            className="flex w-full py-3 rounded-xl hover:bg-gray-300 transition-colors font-medium"
            onClick={handleGoogleLogin}
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Inciar con Google
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
