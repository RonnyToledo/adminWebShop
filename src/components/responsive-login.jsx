"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supa";
import { motion } from "framer-motion";
import IllustrationLogin from "./icons/IllustrationLogin";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export function ResponsiveLogin({ user }) {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user !== undefined) {
      router.push("/admin");
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleApiCall(false, null);
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_REDIRECT_URL}`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setError("Error al iniciar sesión con Google");
      console.error(error);
    }
  };

  const handleApiCall = async (isGoogleLogin, token) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: isGoogleLogin ? null : email,
          password: isGoogleLogin ? null : password,
          provider: isGoogleLogin ? "google" : "email",
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
            <Link href="/createAccount" className="text-gray-600 text-xs mt-5">
              Eres nuevo??
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
