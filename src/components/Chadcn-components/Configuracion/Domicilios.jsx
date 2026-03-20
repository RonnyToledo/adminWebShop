"use client";

import React, { useContext, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Trash2,
  Plus,
  MapPin,
  DollarSign,
  GripVertical,
  TrendingUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FromData } from "@/components/globalFunction/fromData";

function DraggableZoneItem({ zone, index, onDelete }) {
  return (
    <Draggable
      draggableId={`zone-${index}`}
      index={index}
      key={`zone-${index}`}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex items-center justify-between p-4 border rounded-xl hover:bg-muted/40 transition-colors ${
            snapshot.isDragging ? "opacity-60 shadow-md bg-muted" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              {...provided.dragHandleProps}
              className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 shrink-0">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm text-foreground">
                {zone.lugar}
              </p>
              <p className="text-xs text-muted-foreground">
                {zone.precio === 0
                  ? "Entrega gratuita"
                  : `${zone.precio.toFixed(2)} CUP`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-semibold ${zone.precio === 0 ? "text-green-600" : "text-foreground"}`}
            >
              {zone.precio === 0
                ? "Gratis"
                : `${Number(zone.precio).toLocaleString("es-CU")} CUP`}
            </span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    ¿Eliminar zona de delivery?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    La zona <strong>"{zone.lugar}"</strong> será eliminada
                    permanentemente. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(zone.lugar)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </Draggable>
  );
}

function DroppableZonesList({ zones, onDelete }) {
  return (
    <Droppable droppableId="zones-list">
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="space-y-2"
        >
          {zones.map((zone, index) => (
            <DraggableZoneItem
              key={index}
              zone={zone}
              index={index}
              onDelete={onDelete}
            />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}

export default function Domicilios({ ThemeContext }) {
  const { webshop } = useContext(ThemeContext);
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ lugar: "", precio: "" });

  useEffect(() => {
    setDeliveryZones(webshop?.store?.envios ?? []);
  }, [webshop.store]);

  const precioPromedio =
    deliveryZones.length > 0
      ? deliveryZones.reduce((sum, z) => sum + z.precio, 0) /
        deliveryZones.length
      : 0;
  const precioMax =
    deliveryZones.length > 0
      ? Math.max(...deliveryZones.map((z) => z.precio))
      : 0;

  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (
      source.index === destination.index &&
      source.droppableId === destination.droppableId
    )
      return;
    setDeliveryZones((prev) => {
      const items = Array.from(prev);
      if (
        source.index < 0 ||
        source.index >= items.length ||
        destination.index < 0 ||
        destination.index > items.length
      )
        return prev;
      const [moved] = items.splice(source.index, 1);
      if (!moved) return prev;
      items.splice(destination.index, 0, moved);
      return items;
    });
  };

  const resetForm = () => setFormData({ lugar: "", precio: "" });

  const handleAddZone = () => {
    if (!formData.lugar) return;
    const newZone = {
      lugar: formData.lugar,
      precio: parseFloat(formData.precio) || 0,
    };
    setDeliveryZones([...deliveryZones, newZone]);
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleDeleteZone = (lugar) => {
    setDeliveryZones((zones) => zones.filter((z) => z.lugar !== lugar));
  };

  return (
    <FromData
      ThemeContext={ThemeContext}
      store={{ ...webshop.store, envios: deliveryZones }}
    >
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="space-y-6 p-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Zonas de Delivery
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Arrastra para reordenar · El local se activa desde Configuración
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 gap-2">
                  <Plus className="h-4 w-4" />
                  Agregar zona
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva zona de delivery</DialogTitle>
                  <DialogDescription>
                    Configura el nombre y precio de entrega para esta zona.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="zone-name">Nombre de la zona</Label>
                    <Input
                      id="zone-name"
                      placeholder="Ej: Vedado, Centro Habana..."
                      value={formData.lugar}
                      onChange={(e) =>
                        setFormData({ ...formData, lugar: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zone-precio">Precio (CUP)</Label>
                    <Input
                      id="zone-precio"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={formData.precio}
                      onChange={(e) =>
                        setFormData({ ...formData, precio: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Deja en 0 para entrega gratuita
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setIsAddDialogOpen(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleAddZone} disabled={!formData.lugar}>
                    Agregar zona
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats derivadas de los datos reales */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total zonas</p>
                  <p className="text-2xl font-bold mt-0.5">
                    {deliveryZones.length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Precio promedio
                  </p>
                  <p className="text-2xl font-bold mt-0.5">
                    {precioPromedio.toLocaleString("es-CU", {
                      maximumFractionDigits: 0,
                    })}{" "}
                    CUP
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Precio máximo</p>
                  <p className="text-2xl font-bold mt-0.5">
                    {precioMax.toLocaleString("es-CU")} CUP
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Lista de zonas</CardTitle>
              <CardDescription>
                {deliveryZones.length === 0
                  ? "No hay zonas configuradas"
                  : `${deliveryZones.length} zona${deliveryZones.length !== 1 ? "s" : ""} · Arrastra para reordenar`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deliveryZones.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground">
                    Sin zonas configuradas
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Agrega tu primera zona para comenzar
                  </p>
                </div>
              ) : (
                <DroppableZonesList
                  zones={deliveryZones}
                  onDelete={handleDeleteZone}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </DragDropContext>
    </FromData>
  );
}
