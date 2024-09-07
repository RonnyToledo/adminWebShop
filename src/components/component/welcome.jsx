"use client";
import { Button } from "@/components/ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useState } from "react";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";

export default function Welcome({ user }) {
  const [nameBussines, setnameBussines] = useState("");
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDownloading(true);
    const formData = new FormData();
    formData.append("name", nameBussines);
    formData.append("user", user);
    try {
      const res = await axios.post(`/api/tienda/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (res.status == 200) {
        toast({
          title: "Tarea Ejecutada",
          description: "Tienda Creada",
          action: (
            <ToastAction altText="Goto schedule to undo">Cerrar</ToastAction>
          ),
        });
      }
    } catch (error) {
      console.error("Error al enviar el comentario:", error);
      toast({
        title: "Error",
        variant: "destructive",
        description: "No se pudo editar el tema.",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="absolute p-4 top-0 left-0 flex flex-col items-center justify-center min-w-[100dvw] min-h-[100dvh] bg-[#f3f4f6] dark:bg-[#1e293b] text-[#334155] dark:text-[#f1f5f9]">
      <div className="max-w-md w-full px-6 py-8 bg-white dark:bg-[#0f172a] rounded-lg shadow-lg">
        <div className="flex items-center justify-center mb-6">
          <ComputerIcon className="h-12 w-12" />
          <h1 className="text-2xl font-bold ml-4">Bienvenido a RH-Menu</h1>
        </div>
        <p className="mb-6 text-lg">
          ¡Hola! Estamos encantados de tenerte aquí. Vamos a configurar tu
          cuenta y personalizar la apariencia de tienda online.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="border rounded-2x p-5">
            <div className="space-y-2">
              <Label htmlFor="bank-card">Nombre de su Negocio</Label>
              <Input
                id="bank-card"
                value={nameBussines}
                placehoder="Nombre de su negocio"
                type="text"
                required
                onChange={(e) => setnameBussines(e.target.value)}
              />
            </div>

            <p className="text-xs text-muted-foreground mt-1">
              *Este Campo es obligatorio
            </p>
          </div>
          <div className="flex gap-4">
            <Button className="w-full" disabled={downloading}>
              <UserIcon className="mr-2 h-5 w-5" />

              {downloading ? "Configurando..." : " Configurar cuenta"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ComputerIcon(props) {
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
      <rect width="14" height="8" x="5" y="2" rx="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" />
      <path d="M6 18h2" />
      <path d="M12 18h6" />
    </svg>
  );
}

function PaletteIcon(props) {
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
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function UserIcon(props) {
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
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
