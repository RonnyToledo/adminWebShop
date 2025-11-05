"use client";

import React, { useContext, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import IllustrationLogin from "../../icons/IllustrationLogin";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Loading from "../../component/loading";
import { logIn } from "@/components/globalFunction/loginFunction";
import { ThemeContext } from "@/context/useContext";

export function ResponsiveLogin({ user }) {
  const { webshop } = useContext(ThemeContext);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loadingCharge, setLoadingCharge] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user !== undefined) {
      router.push("/");
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    try {
      await logIn(email, password);
      // Esperar un poco para que se guarde la cookie
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Recargar la página completamente para que el servidor valide la sesión
      setLoadingCharge(true);
      router.refresh();

      // Pequeño delay para asegurar que se actualizó la cookie
    } catch (error) {
      console.error(error.message);
      toast.error(error.message);
    }
    setLoading(false);
  };

  if (loadingCharge) {
    return <Loading />;
  }
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
            <Link href="/createAccount" className="text-slate-600 text-xs mt-5">
              Eres nuevo??
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
