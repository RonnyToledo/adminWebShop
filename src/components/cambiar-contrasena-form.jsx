"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supa";

export default function CambiarContrasenaForm() {
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams(); // Obtener parámetros de la URL
  let access_token; // Extraer el token
  let refresh_token; // Extraer el token

  if (typeof window !== "undefined" && window.location.hash) {
    const hash = window.location.hash.substring(1); // Elimina el '#' del inicio
    const params = new URLSearchParams(hash);

    access_token = params.get("access_token");
    refresh_token = params.get("refresh_token");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setExito(false);
    setEnviando(true);

    // Validación básica
    if (nuevaContrasena !== confirmarContrasena) {
      setError("Las contraseñas nuevas no coinciden");
      setEnviando(false);
      return;
    }
    if (nuevaContrasena.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres");
      setEnviando(false);
      return;
    }
    try {
      // Actualizar el token en el cliente de Supabase
      const { error: authError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (authError) {
        console.error(authError);
        throw new Error(authError);
      }

      // Cambiar la contraseña
      const { error: passwordError } = await supabase.auth.updateUser({
        password: nuevaContrasena,
      });

      if (passwordError) {
        throw passwordError;
      } else {
        router.push("/");
      }
    } catch (error) {
      setError(`Error: ${error.message}`);
    } finally {
      setEnviando(false);
    }

    setExito(true);
    setEnviando(false);
    setNuevaContrasena("");
    setConfirmarContrasena("");
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Cambiar tu contraseña</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nueva-contrasena">Nueva contraseña</Label>
            <Input
              id="nueva-contrasena"
              type="password"
              value={nuevaContrasena}
              onChange={(e) => setNuevaContrasena(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmar-contrasena">
              Confirmar nueva contraseña
            </Label>
            <Input
              id="confirmar-contrasena"
              type="password"
              value={confirmarContrasena}
              onChange={(e) => setConfirmarContrasena(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="flex items-center text-red-500">
              <AlertCircle className="mr-2 h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          {exito && (
            <div className="flex items-center text-green-500">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              <span>Contraseña cambiada con éxito</span>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando ? "Cambiando..." : "Cambiar contraseña"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
