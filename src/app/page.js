"use client";

import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supa";

export default function usePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  // Manejador de cambios de sesión
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push("/admin");
      }
    });
  }, [router]);

  // Maneja el inicio de sesión con correo y contraseña
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (data?.session) {
      router.push("/admin");
    }

    if (error) {
      toast({
        variant: "destructive",
        title: "Error de Inicio de Sesión",
        description: `Error: ${error.message}`,
      });
    }
  };

  // Maneja el inicio de sesión con Google
  const handleGoogleLogin = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error de Google Sign-In",
        description: `Error: ${error.message}`,
      });
    }
  };

  return (
    <div
      className="flex justify-center items-center"
      style={{ minHeight: "100vh" }}
    >
      <div className="p-10" style={{ maxWidth: "400px" }}>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Iniciar sesión</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Ingresa tu correo electrónico para acceder a tu cuenta
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                placeholder="ejemplo@dominio.com"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Iniciando..." : "Iniciar sesión"}
            </Button>
          </form>

          <Button
            className="w-full"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <ChromeIcon className="mr-2 h-4 w-4" />
            {loading ? "Iniciando..." : "Iniciar sesión con Google"}
          </Button>

          <div className="flex justify-end">
            <Link className="text-sm underline" href="#">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de icono de Google
function ChromeIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="21.17" x2="12" y1="8" y2="8" />
      <line x1="3.95" x2="8.54" y1="6.06" y2="14" />
      <line x1="10.88" x2="15.46" y1="21.94" y2="14" />
    </svg>
  );
}
