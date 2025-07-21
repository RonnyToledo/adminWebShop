"use client";
import React, { useContext, useState, useEffect, useRef } from "react";
import { ThemeContext } from "@/context/useContext";
import { useRouter, usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";

export default function ConfimationOut({ action }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingRoute, setPendingRoute] = useState(null);
  const router = useRouter();
  const pathname = usePathname();
  // Manejar cambios de ruta para confirmar si hay cambios pendientes
  useEffect(() => {
    const handleRouteChangeStart = (url) => {
      if (url !== pathname && action) {
        setPendingRoute(url);
        setIsDialogOpen(true);
        return false;
      }
      return true;
    };

    const handleBeforeUnload = (e) => {
      if (action) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    const originalPush = router.push;
    router.push = async (url) => {
      if (handleRouteChangeStart(url)) {
        return originalPush(url);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      router.push = originalPush; // Restaurar el push original al desmontar el componente
    };
  }, [webshop, action]);

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setPendingRoute(null);
  };

  const handleConfirmLeave = () => {
    setIsDialogOpen(false);
    if (pendingRoute) {
      router.replace(pendingRoute);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent>
        <DialogTitle>Cambios sin guardar</DialogTitle>
        <DialogDescription>
          Tienes cambios sin guardar. ¿Estás seguro de que quieres salir sin
          guardar?
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={handleDialogClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirmLeave}>
            Salir sin guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
