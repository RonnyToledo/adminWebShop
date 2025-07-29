"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supa";
import { motion } from "framer-motion";
import IllustrationLogin from "./icons/IllustrationLogin";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import ImageUpload from "./component/ImageDND";

async function fetchUserSession() {
  try {
    const res = await fetch("/api/login");
    const data = await res.json();
    if (res.ok && data?.user?.user?.id) {
      return data;
    } else {
      console.log("Usuario no encontrado o error en la respuesta:", data);
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
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleApiCall(false, null);
  };

  const handleCoverUpload = (file) => {
    setImage(file);
  };
  const handleApiCall = async () => {
    setLoading(true);
    setError(null);
    console.log(email, password);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: isGoogleLogin ? null : email,
          password: isGoogleLogin ? null : password,
          name,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/");
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

          <h1 className="text-2xl font-bold text-slate-800 mb-2 text-center">
            Crear cuenta
          </h1>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="bg-black/50 rounded-full p-1 text-white group-hover:text-black">
                <ImageUpload
                  onImageSelect={handleCoverUpload}
                  variant="cover"
                />
              </div>
              <Input
                type="text"
                placeholder="Nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                required
              />
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <User className="text-slate-400" />
              </span>
              <Input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <Lock className="text-slate-400" />
              </span>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="text-slate-400" />
                ) : (
                  <Eye className="text-slate-400" />
                )}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full py-3 rounded-xl mt-4 font-medium"
              disabled={loading}
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
