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
    if (res.ok && data?.user?.user?.id) {
      return data;
    } else {
      console.info("Usuario no encontrado o error en la respuesta");
    }
  } catch (error) {
    console.error("Error al obtener la sesión del usuario:", error);
  }
}

export default function CreateAccount() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function UserFetch() {
      const userId = await fetchUserSession();
      if (userId?.user?.user?.id) {
        router.push("/");
        return;
      }
    }
    UserFetch();
  }, [router]);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_REDIRECT_URL}/updatePassword`,
        },
      });
      if (error) throw error;
      console.info("Redireccionando para completar el inicio de sesión...");
    } catch (error) {
      setError("Error al iniciar sesión con Google");
      console.error(error);
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

          <h1 className="text-2xl font-bold text-slate-800 mb-2 text-center">
            Crear cuenta
          </h1>

          <Button
            variant="outline"
            className="flex w-full py-3 rounded-xl hover:bg-gray-300 mt-10 transition-colors font-medium"
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
