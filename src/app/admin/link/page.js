"use client";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import QrCode from "@/components/Chadcn-components/QRcode";

export default function usePage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [shop, setShop] = useState({
    comentario: [],
    categoria: [],
    moneda: [],
  });

  useEffect(() => {
    const Tabla = async () => {
      await supabase.auth.onAuthStateChange((event, session) => {
        supabase
          .from("Sitios")
          .select("*")
          .eq("Editor", session?.user.id || null)
          .then((res) => {
            const [a] = res.data;
            setShop(a);
          });
      });
    };
    Tabla();
  }, [supabase]);

  const copyToClipboard = (text) => {
    console.log(text);
    if (navigator?.clipboard) {
      try {
        navigator.clipboard.writeText(text);
        toast({
          title: "Alerta",
          description: "Texto copiado al portpapeles",
          action: (
            <ToastAction altText="Goto schedule to undo">Cerrar</ToastAction>
          ),
        });
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Alerta",
          description: "Error al copiar texto: " + err,
          action: (
            <ToastAction altText="Goto schedule to undo">Cerrar</ToastAction>
          ),
        });
      }
    } else {
      console.log("Error al abrir el clipboard");
    }
  };
  return (
    <div className="grid min-h-screen w-full overflow-hidden ">
      <div className="flex flex-col w-full">
        <main className="flex flex-1 flex-col gap-8 p-6">
          {shop.variable && (
            <>
              <h1 className="text-2xl font-bold">Sitio web</h1>
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <div className="flex items-center space-x-2 justify-center">
                  <Input
                    className="max-w-xs text-sm font-medium"
                    readOnly
                    type="text"
                    value={`https://rh-menu.vercel.app/${shop.variable}/${shop.sitioweb}`}
                  />
                  <Button
                    onClick={() =>
                      copyToClipboard(
                        `https://rh-menu.vercel.app/${shop.variable}/${shop.sitioweb}`
                      )
                    }
                    size="icon"
                    variant="ghost"
                  >
                    <CopyIcon className="h-4 w-4" />
                    <span className="sr-only">Copy URL</span>
                  </Button>
                </div>
                <div className="flex items-center space-x-2 justify-center">
                  <QrCode
                    value={shop.variable}
                    value2={shop.sitioWeb}
                    name={shop.name}
                  />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function CopyIcon(props) {
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
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}
