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
import axios from "axios";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supa";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Calendar, Percent } from "lucide-react";
import { toast } from "sonner";

export function Marketing({ ThemeContext }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [discounts, setDiscounts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setloading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setDiscounts(webshop?.code);
  }, [webshop]);

  const [newDiscount, setNewDiscount] = useState({
    code: "",
    discount: 0,
    expiresAt: "",
  });
  const handleAddDiscount = async () => {
    // Validación rápida
    if (!newDiscount.code || !newDiscount.expiresAt) {
      toast.error("Faltan campos: código o fecha de expiración");
      return;
    }

    setloading(true);

    try {
      const formData = new FormData();
      formData.append("code", newDiscount.code);
      formData.append("discount", newDiscount.discount || 0);
      formData.append("expiresAt", newDiscount.expiresAt);
      formData.append("uid", webshop?.store?.UUID);

      // Crea la promesa axios (no await aquí)
      const postPromise = axios.post(
        `/api/tienda/${webshop?.store?.sitioweb}/discountCode`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // toast.promise espera la promesa y muestra estados
      const res = toast.promise(postPromise, {
        loading: "Guardando descuento...",
        success: (response) => {
          // Actualiza el estado con la respuesta (usar updater para seguridad)
          setDiscounts((prev) => [...prev, ...response.data]);
          // Puedes devolver el texto que quieres que muestre el toast en success
          return "Tarea Ejecutada — Información actualizada";
        },
        error: (err) => {
          // Puedes devolver un mensaje de error que se mostrará en el toast
          // Logging más detallado se hace en el catch
          return "Error al guardar el descuento";
        },
      });

      // Opcional: usar res si necesitas más procesamiento
    } catch (error) {
      // Manejo detallado de errores (igual que antes)
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
      // (Opcional) mostrar un toast extra con más detalle
      // toast.error("No se pudo guardar el descuento. Revisa la consola.");
    } finally {
      // limpiar formulario y estado de loading siempre
      setNewDiscount({ code: "", discount: 0, expiresAt: "" });
      setloading(false);
    }
  };
  // Maneja eliminar descuento (usa toast.promise)
  const handleRemoveDiscount = async (id) => {
    try {
      const deletePromise = axios.delete(
        `/api/tienda/${webshop?.store?.sitioweb}/discountCode?id=${id}`
      );

      toast.promise(deletePromise, {
        loading: "Eliminando descuento...",
        success: (res) => {
          // Actualiza estado de forma segura
          setDiscounts((prev) => prev.filter((d) => d.id !== id));

          return "Codigo Eliminado";
        },
        error: (err) => {
          console.error("Error en request removeDiscount:", err);
          return "Error al eliminar el descuento";
        },
      });
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
    // Creamos una promesa que rechaza si supabase devuelve error
    const supaPromise = new Promise(async (resolve, reject) => {
      try {
        const { data, error } = await supabase
          .from("Sitios")
          .update({ marketing: value })
          .eq("UUID", webshop?.store?.UUID);
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      } catch (err) {
        reject(err);
      }
    });

    try {
      toast.promise(supaPromise, {
        loading: value ? "Activando marketing..." : "Desactivando marketing...",
        success: (data) => {
          // data es lo devuelto por supabase (array con el registro actualizado)
          setWebshop((prev) => ({
            ...prev,
            store: { ...prev.store, marketing: value },
          }));

          return "Actualizacion exitosa";
        },
        error: (err) => {
          console.error("Error en request handleSwitch:", err);
          return "Error al actualizar la configuración";
        },
      });
    } catch (error) {
      // Aquí ya se imprimió en error: pero puedes agregar logs adicionales
      console.error("Error catch handleSwitch:", error);
    }
  };
  useEffect(() => {
    setFiltered(
      searchTerm !== ""
        ? discounts.filter((code) =>
            code.code.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : discounts
    );
  }, [discounts, searchTerm]);

  const isExpired = (date, diferencia) =>
    new Date(date) <
    new Date().setDate(new Date().getDate() + (diferencia || 0));

  const getStatusBadge = (code) => {
    if (isExpired(code.expiresAt, 0))
      return <Badge variant="destructive">Expirado</Badge>;
    return (
      <Badge variant="default" className="bg-green-500">
        Activo
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Códigos de Descuento</h1>
          <p className="text-muted-foreground">
            Gestiona los códigos de descuento para tus clientes
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="system-toggle">Sistema</Label>
            <Switch
              id="system-toggle"
              checked={webshop?.store?.marketing}
              onCheckedChange={handleSwitch}
            />
            <span
              className={`text-sm ${
                webshop?.store?.marketing ? "text-green-600" : "text-red-600"
              }`}
            >
              {webshop?.store?.marketing ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Códigos Activos
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(discounts || []).filter((obj) => !isExpired(obj.expiresAt, 0))
                .length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              de {(discounts || []).length || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Próximos a Expirar
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(discounts || []).filter((obj) => isExpired(obj.expiresAt, 7))
                .length || 0}
            </div>
            <p className="text-xs text-muted-foreground">en 7 días</p>
          </CardContent>
        </Card>

        {/*<Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Uso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">promedio</p>
          </CardContent>
        </Card>*/}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar códigos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!webshop?.store?.marketing}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Código
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Código</DialogTitle>
              <DialogDescription>
                Configura un nuevo código de descuento para tus clientes.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  placeholder="ej. WELCOME20"
                  value={newDiscount.code}
                  onChange={(e) =>
                    setNewDiscount({
                      ...newDiscount,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="discount">Descuento</Label>
                  <div className="relative flex items-center">
                    <Input
                      id="discount"
                      type="number"
                      placeholder="20"
                      value={newDiscount.discount}
                      onChange={(e) =>
                        setNewDiscount({
                          ...newDiscount,
                          discount: e.target.value,
                        })
                      }
                    />
                    <div className="absolute right-2">%</div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expires">Fecha de Expiración</Label>
                  <Input
                    id="expires"
                    type="date"
                    value={newDiscount.expiresAt}
                    onChange={(e) =>
                      setNewDiscount({
                        ...newDiscount,
                        expiresAt: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button disabled={loading} onClick={handleAddDiscount}>
                Agregar codigo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Códigos</CardTitle>
          <CardDescription>
            {(filtered || []).length} código
            {(filtered || []).length !== 1 ? "s" : ""} encontrado
            {(filtered || []).length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descuento</TableHead>
                <TableHead>Expira</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(filtered || []).map((code) => (
                <TableRow key={code.id}>
                  <TableCell className="font-mono font-medium">
                    <div className="flex items-center space-x-2">
                      <span>{code.code}</span>
                    </div>
                  </TableCell>
                  <TableCell>{`${code.discount}%`}</TableCell>

                  <TableCell>
                    <span
                      className={
                        isExpired(code.expiresAt, 0) ? "text-red-600" : ""
                      }
                    >
                      {new Date(code.expiresAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(code)}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!webshop?.store?.marketing}
                      onClick={() => handleRemoveDiscount(discount.id)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
