"use client";

import React, { useEffect, useState, useContext } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import "@github/relative-time-element";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle } from "lucide-react";
import axios from "axios";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supa";

export function Marketing({ ThemeContext }) {
  const { toast } = useToast();
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setloading] = useState(false);

  useEffect(() => {
    setDiscounts(webshop.code);
  }, [webshop]);

  const [newDiscount, setNewDiscount] = useState({
    code: "",
    discount: 0,
    expiresAt: "",
  });
  const handleAddDiscount = async () => {
    try {
      setloading(true);
      if (newDiscount.code && newDiscount.discount && newDiscount.expiresAt) {
        const formData = new FormData();
        formData.append("code", newDiscount.code);
        formData.append("discount", newDiscount.discount);
        formData.append("expiresAt", newDiscount.expiresAt);
        formData.append("uid", webshop.store.UUID);

        const res = await axios.post(
          `/api/tienda/${webshop.store.sitioweb}/discountCode`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        if (res.status === 200) {
          toast({
            title: "Tarea Ejecutada",
            description: "Información actualizada",
            action: <ToastAction altText="Cerrar">Cerrar</ToastAction>,
          });
          setDiscounts([...discounts, ...res.data]);
        }
      } else {
        new Error("Faltan campos");
      }
    } catch (error) {
      if (error.response) {
        console.error(
          "Error en la respuesta del servidor:",
          error.response.data
        );
        console.error("Estado:", error.response.status);
      } else if (error.request) {
        console.error("No se recibió respuesta:", error.request);
      } else {
        console.error("Error al configurar la solicitud:", error.message);
      }
    } finally {
      setNewDiscount({ code: "", discount: 0, expiresAt: "" });
      setloading(false);
    }
  };
  const handleRemoveDiscount = async (id) => {
    try {
      const res = await axios.delete(
        `/api/tienda/${webshop.store.sitioweb}/discountCode?id=${id}`
      );
      if (res.status === 200) {
        toast({
          title: "Tarea Ejecutada",
          description: "Información actualizada",
          action: <ToastAction altText="Cerrar">Cerrar</ToastAction>,
        });
        setDiscounts(discounts.filter((d) => d.id !== id));
      }
    } catch (error) {
      if (error.response) {
        console.error(
          "Error en la respuesta del servidor:",
          error.response.data
        );
        console.error("Estado:", error.response.status);
      } else if (error.request) {
        console.error("No se recibió respuesta:", error.request);
      } else {
        console.error("Error al configurar la solicitud:", error.message);
      }
    }
  };
  const handleSwitch = async (value) => {
    try {
      const { data, error } = await supabase
        .from("Sitios")
        .update({ marketing: value })
        .eq("UUID", webshop.store.UUID);
      if (error) {
        console.error(error);
      } else {
        setWebshop({
          ...webshop,
          store: { ...webshop.store, marketing: value },
        });
      }
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-start gap-4 items-center mb-6">
        <span>Activar/Descativar Codigos de Descuento</span>
        <Switch
          id="transfers"
          checked={webshop.store.marketing}
          onCheckedChange={handleSwitch}
        />
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Discount Codes</h1>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              disabled={!webshop.store.marketing}
              size="sm"
              className="h-8 gap-1"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Code
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Agergar nuevo codigo de Descuento</DialogTitle>
              <DialogDescription>
                Agrega las caracteristicas del codigo de descuento
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Input
                type="text"
                placeholder="Discount code"
                value={newDiscount.code}
                onChange={(e) =>
                  setNewDiscount({
                    ...newDiscount,
                    code: e.target.value.toUpperCase(),
                  })
                }
              />
              <Input
                type="number"
                placeholder="Discount %"
                value={newDiscount.discount}
                onChange={(e) =>
                  setNewDiscount({ ...newDiscount, discount: e.target.value })
                }
              />
              <Input
                type="date"
                placeholder="Expires at"
                value={newDiscount.expiresAt}
                onChange={(e) =>
                  setNewDiscount({ ...newDiscount, expiresAt: e.target.value })
                }
              />
            </div>
            <DialogFooter>
              <Button disabled={loading} onClick={handleAddDiscount}>
                {loading ? "Agregando..." : "Agregar codigo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead className="hidden md:table-cell">Discount</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {discounts.map((discount) => (
            <TableRow key={discount.id}>
              <TableCell>{discount.code}</TableCell>
              <TableCell className="hidden md:table-cell">
                {discount.discount}%
              </TableCell>

              <TableCell>
                <relative-time
                  lang="es"
                  datetime={discount.expiresAt}
                  no-title
                ></relative-time>
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!webshop.store.marketing}
                  onClick={() => handleRemoveDiscount(discount.id)}
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
