"use client";
import React, { useContext, useEffect } from "react";
import { ThemeContext } from "@/context/useContext";
import { ProductManagementSystem } from "./product-management-system";
import { Button } from "@/components/ui/button";
import CatalogImporter from "../NewProduct/CatalogImporter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { FileUp, Plus, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

export default function GeneralProducts({ initialData }) {
  const { setWebshop } = useContext(ThemeContext);
  const router = useRouter();

  useEffect(() => {
    if (!initialData) return;
    setWebshop((previous) => ({
      ...previous,
      ...initialData,
      store: { ...previous.store, ...(initialData.store ?? {}) },
    }));
  }, [initialData, setWebshop]);
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
        {/* Header editorial consistente con el resto del sistema */}

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest text-primary">
              CATÁLOGO
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Gestión de productos
            </h1>
            <p className="text-sm text-muted-foreground">
              Organiza tu catálogo por categorías y mantén tu inventario al día.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={"/category"}>
                <SlidersHorizontal className="mr-2 size-4" /> Editar categorías
              </Link>
            </Button>
            <Button asChild>
              <Link href={"/newProduct"}>
                <Plus className="mr-2 size-4" /> Crear producto
              </Link>
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="hidden shadow-md md:flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                >
                  <FileUp className="mr-2 size-4" /> Importar
                </Button>
              </DialogTrigger>

              <DialogContent className=" max-w-4xl">
                <DialogHeader>
                  <DialogTitle> Importar catálogo</DialogTitle>
                  <DialogDescription>
                    Carga productos masivamente desde Excel o CSV.
                  </DialogDescription>
                </DialogHeader>
                <CatalogImporter />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <ProductManagementSystem />
      </div>
    </div>
  );
}
