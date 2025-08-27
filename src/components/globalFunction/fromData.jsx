"use client";
import React, { useRef, useState, useContext } from "react";
import axios from "axios";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "../ui/button";

export function FromData({ children, store, ThemeContext }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();
  const form = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setDownloading(true);
    const formData = new FormData();
    Object.keys(store).forEach((key) => {
      const value = store[key];
      if (value instanceof File || value instanceof Blob) {
        // Si es un archivo, lo añadimos directamente sin convertirlo a string
        formData.append(key, value);
      } else if (typeof value === "object" && value !== null) {
        // Si es un objeto, lo convertimos a JSON
        formData.append(key, JSON.stringify(value));
      } else {
        // Si es otro tipo de dato, lo convertimos a string
        formData.append(key, String(value));
      }
    });
    try {
      const res = await axios.put(`/api/tienda/${store.sitioweb}/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (res.status == 200) {
        toast({
          title: "Tarea Ejecutada",
          description: "Informacion Actualizada",
          action: (
            <ToastAction altText="Goto schedule to undo">Cerrar</ToastAction>
          ),
        });
        setWebshop({ ...webshop, store });
        form.current.reset();
      }
    } catch (error) {
      console.error("Error al enviar el comentario:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la configuracion.",
      });
    } finally {
      setDownloading(false);
    }
  }
  return (
    <form
      ref={form}
      className="grid gap-6 min-h-screen"
      onSubmit={handleSubmit}
    >
      {children}
      <div className="backdrop-blur-sm p-2 flex justify-center sticky bottom-0">
        <Button
          type="submit"
          className={`bg-black hover:bg-indigo-700 text-white w-1/2 font-medium py-2 px-4 rounded-3xl ${
            downloading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={downloading}
        >
          {downloading ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
