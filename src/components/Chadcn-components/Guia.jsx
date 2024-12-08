"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  Card,
} from "@/components/ui/card";
import React, { useEffect, useState, useContext } from "react";
import { Input } from "@/components/ui/input";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import QrCode from "@/components/Chadcn-components/QRcode";
import { ThemeContext } from "@/context/useContext";
import { CopyIcon } from "lucide-react";

const GuideCard = ({ title, description, steps, link, buttonText }) => {
  return (
    <div className="grid  w-full overflow-hidden ">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <h3 className="text-lg font-semibold">Pasos a seguir</h3>
              <ul className="list-disc space-y-2 pl-6 text-gray-500 dark:text-gray-400">
                {steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>
            <Link href={link}>
              <Button>{buttonText}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function Guia() {
  const { toast } = useToast();
  const { webshop, setWebshop } = useContext(ThemeContext);

  const copyToClipboard = (text) => {
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
    }
  };
  const cardsData = [
    {
      title: "Agregar/Eliminar categorías",
      description: "Organiza tus productos en categorías.",
      steps: [
        "Crea nuevas categorías",
        "Elimina las que no uses",
        "Cada categoría muestra los productos asignados",
        "Organiza el orden tocando la categoría, se desplaza al final de la lista",
        "Guarda los cambios antes de salir",
      ],
      link: "/admin/category",
      buttonText: "Editar categorías",
    },
    {
      title: "Crear producto",
      description: "Aprende a crear nuevos productos en tu tienda.",
      steps: [
        "Selecciona una imagen",
        "Ingresa todos los campos solicitados",
        "Selecciona una categoría",
        "Indica si es especial de la casa",
        "Selecciona si el producto tiene rebaja porcentual",
      ],
      link: "/admin/newProduct",
      buttonText: "Crear producto",
    },
    {
      title: "Editar producto",
      description: "Actualiza la información de tus productos existentes.",
      steps: [
        "Selecciona el producto a editar",
        "El icono de ojo indica si es visible para los clientes",
        "El icono de estrella indica si es especial de la casa",
        "El icono de pantalla indica si está agotado",
        "Las imágenes no se editan",
        "Actualiza la categoría del producto",
      ],
      link: "/admin/products",
      buttonText: "Editar producto",
    },
    {
      title: "Editar perfil",
      description: "Personaliza tu perfil de administrador.",
      steps: [
        "Actualiza tu información de negocio",
        "Cambia el poster de Bienvenida",
        "Selecciona los horarios de trabajo",
      ],
      link: "/admin/header",
      buttonText: "Editar perfil",
    },
    {
      title: "Configurar perfil",
      description: "Personaliza tu perfil de administrador.",
      steps: [
        "Actualiza tu número de teléfono",
        "Rectifica tu email",
        "Añade tu Instagram de negocio",
        "Indica la provincia sede de tu negocio",
        "Activa si tienes local de trabajo, domicilio y turnos reservados",
        "Identifica la moneda aceptada y sus tipos de cambio",
      ],
      link: "/admin/configuracion",
      buttonText: "Configurar perfil",
    },
  ];

  return (
    <div className="grid min-h-screen w-full overflow-hidden">
      <div className="flex flex-col w-full">
        <main className="flex flex-1 flex-col gap-8 p-6">
          <h1 className="text-2xl font-bold">Sitio web</h1>
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <div className="flex items-center space-x-2 justify-center">
              <Input
                className="max-w-xs text-sm font-medium"
                readOnly
                type="text"
                value={`https://randh-menu.vercel.app/${webshop.store.variable}/${webshop.store.sitioweb}`}
              />
              <Button
                onClick={() =>
                  copyToClipboard(
                    `https://randh-menu.vercel.app/${webshop.store.variable}/${webshop.store.sitioweb}`
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
                value={webshop.store.variable}
                value2={webshop.store.sitioweb}
                name={webshop.store.name}
              />
            </div>
          </div>
        </main>
        <main className="flex flex-1 flex-col gap-8 p-6">
          <div className="grid gap-6">
            <div className="grid gap-2">
              <h1 className="text-2xl font-bold">Funcionalidades clave</h1>
              <p className="text-gray-500 dark:text-gray-400">
                Descubre cómo funcionan las principales funcionalidades de tu
                panel de administración.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cardsData.map((card, index) => (
                <GuideCard key={index} {...card} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
