"use client";
import React from "react";
import { useState, useContext, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";

const color = [
  { name: "Gris", color: "rgb(17, 24, 37)" },
  { name: "Rojo", color: "rgb(127, 29, 29)" },
  { name: "Azul", color: "rgb(23, 37, 84)" },
  { name: "Naranja", color: "rgb(124, 45, 18)" },
  { name: "Verde", color: "rgb(20, 83, 45)" },
  { name: "Morado", color: "rgb(46, 16, 101)" },
  { name: "Rosado", color: "rgb(131, 24, 67)" },
];

export default function Theme({ ThemeContext }) {
  const { webshop, setwebshop } = useContext(ThemeContext);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState("rgb(17, 24, 37)");

  console.log(webshop);
  console.log(webshop.store.color);
  console.log(selectedTheme);
  useEffect(() => {
    setSelectedTheme(webshop.store.color);
  }, [webshop]);

  const handleTheme = async (e) => {
    e.preventDefault();
    setDownloading(true);
    const formData = new FormData();
    formData.append("color", selectedTheme);
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
          description: "Informacion Actualizada",
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
      setwebshop({
        ...webshop,
        store: { ...webshop.store, color: selectedTheme },
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-background rounded-lg shadow-lg">
      <form onSubmit={handleTheme}>
        <h2 className="text-2xl font-bold mb-4">Theme Settings</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {color.map((theme) => (
            <div
              key={theme.name}
              className={`border rounded-lg cursor-pointer transition-all ${
                selectedTheme === theme.color
                  ? "border-primary ring-2 ring-primary"
                  : "border-gray-300 hover:border-primary"
              }`}
              onClick={() => setSelectedTheme(theme.color)}
            >
              <div className="relative p-3">
                <div className="border p-1">
                  <nav className=" flex justify-center items-center">
                    <div className="rounded-lg border bg-white text-gray-800 text-xs w-2/3 flex justify-center text-center px-1">
                      WebShop
                    </div>
                  </nav>
                  <div className=" bg-white overflow-hidden mt-2">
                    <nav className="px-1 text-gray-800 text-xs">WebShop</nav>
                    <Image
                      alt={webshop.store.name ? webshop.store.name : "Store"}
                      src={
                        webshop.store.urlPoster
                          ? webshop.store.urlPoster
                          : "https://res.cloudinary.com/dbgnyc842/image/upload/v1725399957/xmlctujxukncr5eurliu.png"
                      }
                      width={40}
                      height={40}
                      className="w-full h-28 rounded-lg bg-center object-cover p-1"
                    />
                    <p className="text-gray-800 text-xs line-clamp-2 overflow-hidden px-1">
                      Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                      Tempore itaque vel aliquam necessitatibus obcaecati
                      accusantium voluptate quaerat iure vero esse!
                    </p>
                  </div>
                  <div className=" bg-white mt-2">
                    <nav className="px-1 text-gray-800 text-xs">Categoria</nav>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ">
                      {webshop.products.filter((obj) => obj.image).length >=
                      2 ? (
                        <Products
                          array={webshop.products
                            .filter((obj) => obj.image)
                            .slice(0, 2)}
                          color={theme.color}
                        />
                      ) : (
                        <Products
                          array={webshop.products.slice(0, 2)}
                          color={theme.color}
                        />
                      )}
                    </div>
                  </div>
                </div>
                {selectedTheme === theme.name && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs">
                    Selected
                  </div>
                )}
              </div>
              <div className="py-2 px-4 flex justify-between items-center">
                <h3 className="text-lg font-medium">{theme.name}</h3>
                <div
                  className="rounded-full h-5 w-5"
                  style={{ backgroundColor: theme.color }}
                ></div>
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
