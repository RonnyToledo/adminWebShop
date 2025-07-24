"use client";
import React from "react";
import { useState, useContext, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { useRouter } from "next/navigation";

const color = [
  {
    name: "1",
    color:
      "https://res.cloudinary.com/dbgnyc842/image/upload/v1727838730/Coffe_react/fxibcmdmel49rqakmvmj.png",
  },
  {
    name: "2",
    color:
      "https://res.cloudinary.com/dbgnyc842/image/upload/v1727838730/Coffe_react/ue9duwrq2mll5izlsf7r.png",
  },
];

export default function Theme({ ThemeContext }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState("1");
  const router = useRouter();
  useEffect(() => {
    setSelectedTheme(webshop.store.color);
  }, [webshop]);

  const handleTheme = async (e) => {
    e.preventDefault();
    setDownloading(true);
    const formData = new FormData();
    formData.append("variable", selectedTheme == "1" ? "r" : "t");
    try {
      const res = await axios.put(
        `/api/tienda/${webshop.store.sitioweb}/theme`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (res.status == 200) {
        toast({
          title: "Tarea Ejecutada",
          description: "Su enlace de sitio web ha cambiado",
          action: (
            <ToastAction
              altText="Ir a la programación"
              onClick={() => router.push("/link")}
            >
              Ir a la web
            </ToastAction>
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
      setWebshop({
        ...webshop,
        store: { ...webshop.store, color: selectedTheme },
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-background rounded-lg shadow-lg">
      <form onSubmit={handleTheme}>
        <h2 className="text-2xl font-bold mb-4">Theme Settings</h2>
        <div className="grid grid-cols-2 gap-2">
          {color.map((theme) => (
            <div
              key={theme.name}
              className={`border rounded-lg cursor-pointer transition-all ${
                selectedTheme === theme.name
                  ? "border-primary ring-2 ring-primary"
                  : "border-gray-300 hover:border-primary"
              }`}
              onClick={() => setSelectedTheme(theme.name)}
            >
              <div className="relative p-3">
                <Image
                  src={theme.color}
                  alt={theme.name}
                  width={600}
                  height={1500}
                />
                {selectedTheme === theme.name && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs">
                    Selected
                  </div>
                )}
              </div>
              <div className="py-2 px-4 flex justify-between items-center">
                <h3 className="text-lg font-medium">{theme.name}</h3>
              </div>
            </div>
          ))}
        </div>
        <div
          className={`mt-6 flex justify-end sticky bottom-0 p-2 bg-white `}
          disabled={downloading}
        >
          <Button className="w-full sm:w-auto">
            {downloading ? "Guardando..." : "Apply Theme"}
          </Button>
        </div>
      </form>
    </div>
  );
}
function Products({ array, color }) {
  return (
    <>
      {array.map((prod, index) => (
        <div className="p-1" key={index}>
          <div className="relative rounded-lg overflow-hidden">
            <Image
              src={
                prod.image
                  ? prod.image
                  : "https://res.cloudinary.com/dbgnyc842/image/upload/v1725399957/xmlctujxukncr5eurliu.png"
              }
              alt={prod.title ? prod.title : "Product"}
              width={40}
              height={40}
              className="w-full h-20 bg-center object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-between p-1 md:p-2">
              <div className="flex justify-between text-white font-bold line-clamp-2 overflow-hidden  ">
                <div
                  className="rounded-sm px-1 max-w-max"
                  style={{
                    fontSize: "5px",
                    backgroundColor: color,
                  }}
                >
                  NEW
                </div>
                <div
                  className="rounded-sm px-1 max-w-max"
                  style={{
                    fontSize: "5px",
                    backgroundColor: color,
                  }}
                >
                  1.1
                </div>
              </div>
              <h6 className="px-1 text-white" style={{ fontSize: "8px" }}>
                Product
              </h6>
            </div>
          </div>
          <h6
            className="px-1 text-gray-800 flex w-full justify-end"
            style={{ fontSize: "8px" }}
          >
            $99.99
          </h6>
          <div
            className="text-xs rounded-sm text-white flex justify-center"
            style={{
              fontSize: "8px",
              backgroundColor: color,
            }}
          >
            Add to Cart
          </div>
        </div>
      ))}
    </>
  );
}
