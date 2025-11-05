"use client";

import React, { useContext, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trash2,
  Edit2,
  Plus,
  MapPin,
  DollarSign,
  GripVertical,
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
function DraggableZoneItem({ zone, index, onEdit, onDelete, onToggleStatus }) {
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
          className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
            snapshot.isDragging ? "opacity-50 bg-muted shadow-lg" : ""
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              {...provided.dragHandleProps}
              className="flex items-center justify-center w-6 h-6 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{zone.lugar}</h3>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {zone.precio === 0 ? "Gratis" : Number(zone.precio).toFixed(2)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive bg-transparent"
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
                      Esta acción no se puede deshacer. La zona "{zone.lugar}"
                      será eliminada permanentemente.
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
        </div>
      )}
    </Draggable>
  );
}

function DroppableZonesList({ zones, onDelete, onToggleStatus }) {
  return (
    <Droppable droppableId="zones-list" key={`zones`}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="space-y-3"
          key={"zones"}
        >
          {zones.map((zone, index) => (
            <DraggableZoneItem
              key={index}
              zone={zone}
              index={index}
              onDelete={onDelete}
              onToggleStatus={onToggleStatus}
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
  const [deliveryZones, setDeliveryZones] = useState([
    {
      name: "Local",
      precio: 0,
    },
  ]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    lugar: "",
    precio: "",
  });

  useEffect(() => {
    setDeliveryZones(webshop?.store?.envios);
  }, [webshop.store]);
  const handleDragEnd = (result) => {
    const { source, destination } = result;

    // Si no hay destino (drop fuera), salir
    if (!destination) return;

    // Si no cambió la posición, salir
    if (
      source.index === destination.index &&
      source.droppableId === destination.droppableId
    ) {
      return;
    }

    setDeliveryZones((prev) => {
      // copia defensiva
      const items = Array.from(prev);

      // validar índices
      if (
        source.index < 0 ||
        source.index >= items.length ||
        destination.index < 0 ||
        destination.index > items.length
      ) {
        console.warn("handleDragEnd: índices fuera de rango", {
          source,
          destination,
          length: items.length,
        });
        return prev; // no modificar
      }

      const [moved] = items.splice(source.index, 1);
      if (!moved) {
        console.warn("handleDragEnd: no se encontró elemento para mover", {
          sourceIndex: source.index,
        });
        return prev;
      }

      items.splice(destination.index, 0, moved);
      return items;
    });
  };

  const resetForm = () => {
    setFormData({ lugar: "", precio: "" });
  };

  const handleAddZone = () => {
    if (!formData.lugar) {
      return;
    }

    const newZone = {
      lugar: formData.lugar,
      precio: Number.parseFloat(formData.precio),
    };

    setDeliveryZones([...deliveryZones, newZone]);
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleDeleteZone = (lugar) => {
    setDeliveryZones((zones) => zones.filter((zone) => zone.lugar !== lugar));
  };

  const toggleZoneStatus = (id) => {
    setDeliveryZones((zones) =>
      zones.map((zone) =>
        zone.id === id ? { ...zone, isActive: !zone.isActive } : zone
      )
    );
  };
  return (
    <FromData
      ThemeContext={ThemeContext}
      store={{ ...webshop.store, envios: deliveryZones }}
    >
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="space-y-6 p-4">
          {/* Header with Add Button */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-2xl font-semibold">Zonas de Delivery</h2>
                <h2 className="text-base text-slate-500">
                  *El local como zona de entrega, se activa desde configuracion
                </h2>
              </div>
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Zona
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar Nueva Zona de Delivery</DialogTitle>
                  <DialogDescription>
                    Configura una nueva zona de entrega con su precio
                    correspondiente.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="zone-name">Nombre de la Zona</Label>
                    <Input
                      id="zone-name"
                      placeholder="Ej: Centro, Vedado, etc."
                      value={formData.lugar}
                      onChange={(e) =>
                        setFormData({ ...formData, lugar: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid  gap-4">
                    <div>
                      <Label htmlFor="zone-precio">Precio</Label>
                      <Input
                        id="zone-precio"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.precio}
                        onChange={(e) =>
                          setFormData({ ...formData, precio: e.target.value })
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
                  <Button
                    onClick={handleAddZone}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Agregar Zona
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Zonas
                    </p>
                    <p className="text-2xl font-bold">{deliveryZones.length}</p>
                  </div>
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Precio Promedio
                    </p>
                    <p className="text-2xl font-bold">
                      {deliveryZones.length > 0
                        ? (
                            deliveryZones.reduce(
                              (sum, zone) => sum + zone.precio,
                              0
                            ) / deliveryZones.length
                          ).toFixed(2)
                        : "0.00"}{" "}
                      CUP
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-secondary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Delivery Zones List */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Zonas de Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              {deliveryZones.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No hay zonas de delivery configuradas
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Agrega tu primera zona para comenzar
                  </p>
                </div>
              ) : (
                <DroppableZonesList
                  zones={deliveryZones}
                  onDelete={handleDeleteZone}
                  onToggleStatus={toggleZoneStatus}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </DragDropContext>
    </FromData>
  );
}
