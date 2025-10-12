"use client";
import React from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useContext, useMemo } from "react";
import ConfimationOut from "@/components/globalFunction/confimationOut";
import { InputStore, SwitchStore } from "./Input-Store";
import { Instagram, Phone, Mail } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FromData } from "@/components/globalFunction/fromData";
import ProfileHeader from "./profile-header";
import WeeklyAvailability from "@/components/Chadcn-components/Configuracion/WeeklyAvailability";
import { Textarea } from "@/components/ui/textarea";
import ConfiguracionState from "./configuracionState";
import { toast } from "sonner";

export default function Configuracion({ ThemeContext, country }) {
  const { webshop } = useContext(ThemeContext);
  const [newAgregados, setNewAgregados] = useState({
    moneda: "",
    valor: 0,
  });
  const [store, setStore] = useState({
    comentario: [],
    categoria: [],
    monedas: [],
    horario: [],
    envios: [],
  });

  useEffect(() => {
    setStore(webshop?.store);
  }, [webshop.store]);
  // value for RadioGroup must be string; keep derived selectedId string
  const selectedIdStr = useMemo(
    () =>
      String(
        store?.monedas.find((m) => m.defecto)?.id ?? store?.monedas[0]?.id ?? ""
      ),
    [store?.monedas]
  );

  const [localNew, setLocalNew] = useState({
    nombre: newAgregados?.moneda ?? "",
    valor: String(newAgregados?.valor ?? ""),
  });

  function setDefaultById(id) {
    const updated = (webshop?.store?.monedas || []).map((m) => ({
      ...m,
      defecto: m.id === id,
    }));
    setStore({ ...(store ?? {}), monedas: updated });
  }

  function updateValor(id, raw) {
    const valor = Number(raw) || 0;
    const updated = (store?.monedas || []).map((m) =>
      m.id === id ? { ...m, valor } : m
    );
    setStore({ ...(store ?? {}), monedas: updated });
  }

  function deleteMoneda(id) {
    const filtered = (store?.monedas || []).filter((m) => m.id !== id);

    if ((store?.monedas || []).find((m) => m.id == id)?.defecto) {
      toast.error("No puedes eliminar la moneda por defecto");
      return;
    }
    if (filtered.length === 0) {
      toast.error("No te puedes quedar sin monedas");
      return;
    }
    if (
      webshop?.products.filter((prod) => prod.default_moneda == id).length > 0
    ) {
      toast.error("Estas vendiendo productos en esta moneda");
      return;
    }
    // if we removed the defecto one, ensure first becomes defecto
    const hadDefectoRemoved = store?.monedas.some(
      (m) => m.id === id && m.defecto
    );
    let normalized = filtered;

    if (
      hadDefectoRemoved &&
      normalized.length > 0 &&
      !normalized.some((m) => m.defecto)
    ) {
      normalized = normalized.map((m, i) => ({ ...m, defecto: i === 0 }));
    }
    setStore({ ...(store ?? {}), monedas: normalized });
  }

  function handleAddLocal() {
    const nombre = (localNew.nombre || "").trim();
    const valor = Number(localNew.valor || 0);
    if (!nombre || !isFinite(valor) || valor <= 0) {
      toast.error("Faltan datos");
      return;
    }

    if (store?.monedas.some((obj) => obj.nombre == nombre)) {
      toast.error("Ya existe dicha moneda");
      return;
    }

    // uso en tu código:
    const newId = getFirstAvailableId(store?.monedas ?? []);
    const newMon = {
      id: newId,
      nombre,
      valor,
      ui_store: store?.UUID ?? undefined,
      defecto: store?.monedas.length === 0, // if first currency, set as default
    };

    const updated = [...(store?.monedas || []), newMon];
    // ensure only one defecto
    const normalized = updated.map((m, i) => ({
      ...m,
      defecto: m.defecto ? true : i === 0 && !updated.some((x) => x.defecto),
    }));
    setStore({ ...(store ?? {}), monedas: normalized });
    // reset local form
    setLocalNew({ nombre: "", valor: "" });
  }

  return (
    <main className="container mx-auto my-8 px-4 sm:px-6 lg:px-8">
      <FromData store={store} ThemeContext={ThemeContext}>
        <Card className="space-y-2">
          <ProfileHeader store={store} setStore={setStore} />
          <div className="mx-6">
            <Label htmlFor="email">Nombre de la tienda</Label>
            <InputStore
              name={"Nombre del negocio"}
              object={store}
              value={store?.name}
              action={setStore}
              type={"text"}
            />
          </div>
          <div className="mx-6">
            <TextAreaInput
              label="Mensaje de Bienvenida"
              value={store?.parrrafo || ""}
              onChange={(e) =>
                setStore((prev) => ({
                  ...prev,
                  parrrafo: e.target.value,
                }))
              }
            />
          </div>
          <div className="mx-6">
            <TextAreaInput
              label="Cuenta tu historia al cliente"
              value={store?.history || ""}
              onChange={(e) =>
                setStore((prev) => ({
                  ...prev,
                  history: e.target.value,
                }))
              }
            />
          </div>
          <div className="mx-6">
            <WeeklyAvailability
              horario={store?.horario || []}
              onHorarioChange={(horario) =>
                setStore((prev) => ({
                  ...prev,
                  horario: horario,
                }))
              }
            />
          </div>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Add your business contact details and social media
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />

                  <InputStore
                    name={"Numero de telefono"}
                    object={store}
                    value={store?.cell}
                    action={setStore}
                    type={"number"}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Phone number for orders and customer contact
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <InputStore
                    name={"Email"}
                    object={store}
                    value={store?.email}
                    action={setStore}
                    type={"text"}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram Profile</Label>
                <div className="flex items-center space-x-2">
                  <Instagram className="w-4 h-4 text-muted-foreground" />
                  <InputStore
                    name={"Instagram"}
                    object={store}
                    value={store?.insta}
                    action={setStore}
                    type={"text"}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <ConfiguracionState
            store={store}
            setStore={setStore}
            country={country}
          />

          <Card>
            <CardHeader>
              <CardTitle>Business Settings</CardTitle>
              <CardDescription>
                Configure your business operations and payment options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Carrito</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir el uso de carrito de compras en el catalogo
                    </p>
                  </div>
                  <SwitchStore
                    name={store?.carrito}
                    object={store}
                    title={"carrito"}
                    funcion={setStore}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Bank Transfers</Label>
                    <p className="text-sm text-muted-foreground">
                      Accept bank transfers as payment method
                    </p>
                  </div>
                  <SwitchStore
                    name={store?.act_tf}
                    object={store}
                    title={"act_tf"}
                    funcion={setStore}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Stock</Label>
                    <p className="text-sm text-muted-foreground">
                      Manejar disponibilidad de productos desde la plataforma
                    </p>
                  </div>
                  <SwitchStore
                    name={store?.stocks}
                    object={store}
                    title={"stocks"}
                    funcion={setStore}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">
                      Local para recogidas de productos
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      En caso de no tener habilitado esta opcion y no tener
                      entregas a domicilio, el sistema contara como si tuviera
                      uno
                    </p>
                  </div>
                  <SwitchStore
                    name={store?.local}
                    object={store}
                    title={"local"}
                    funcion={setStore}
                  />
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between ">
                    <div className="space-y-0.5">
                      <Label className="text-base">Delivery Service</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable delivery service for your customers
                      </p>
                    </div>
                    <SwitchStore
                      name={store?.domicilio}
                      object={store}
                      title={"domicilio"}
                      funcion={setStore}
                    />
                  </div>
                  {store?.domicilio ? (
                    <div className="w-full flex justify-center max-h-max">
                      <Button type="button" variant="link">
                        <Link href={`/configuracion/domicilios`}>
                          Definir Domicilios
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <></>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Currency Settings</CardTitle>
              <CardDescription>Configure your payment options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="mb-2">Default Currency</Label>

                  <RadioGroup
                    value={selectedIdStr}
                    onValueChange={(val) => {
                      const id = Number(val);
                      if (!isNaN(id)) setDefaultById(id);
                    }}
                    className="space-y-2"
                  >
                    {store?.monedas.length === 0 ? (
                      <div className="text-sm text-muted-foreground">
                        No currencies defined
                      </div>
                    ) : (
                      store?.monedas.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem
                              value={String(m.id)}
                              id={`mon-${m.id}`}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {m.nombre}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {m.defecto ? "Default" : ""}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={m.valor}
                              onChange={(e) =>
                                updateValor(m.id, e.target.value)
                              }
                              className="w-28"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.preventDefault();
                                deleteMoneda(m.id);
                              }}
                              aria-label={`Eliminar moneda ${m.nombre}`}
                            >
                              🗑
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </RadioGroup>

                  <p className="text-sm text-muted-foreground mt-2">
                    Select the default currency for your products
                  </p>
                </div>

                {/* inline add currency */}
                <div className="pt-4 border-t">
                  <Label className="mb-2">Agregar Moneda</Label>
                  <div className="grid grid-cols-3 gap-3 items-end">
                    <div className="flex-1">
                      <Label className="text-sm">Moneda</Label>
                      <Input
                        value={localNew.nombre}
                        maxLength={4}
                        minLength={2}
                        pattern="[A-Za-z]{4}"
                        title="Debe contener exactamente 4 letras"
                        onChange={(e) =>
                          setLocalNew((s) => ({
                            ...s,
                            nombre: e.target.value.toLocaleUpperCase(),
                          }))
                        }
                        placeholder="Ej. USD"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Tasa</Label>
                      <Input
                        type="number"
                        value={localNew.valor}
                        onChange={(e) =>
                          setLocalNew((s) => ({ ...s, valor: e.target.value }))
                        }
                        placeholder="Ej. 370"
                      />
                    </div>

                    <div>
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddLocal();
                        }}
                      >
                        Agregar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </FromData>
      <ConfimationOut action={hasPendingChanges(store, webshop?.store)} />
    </main>
  );
}
function redondearAMultiploDe5(valor) {
  if (valor < 5) {
    // Redondear a 6 decimales si el valor es menor que 5
    return parseFloat(valor.toFixed(6));
  } else {
    // Redondear al múltiplo de 5 más cercano
    return Math.round(valor / 5) * 5;
  }
}

function PlusIcon(props) {
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
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function TrashIcon(props) {
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
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
// Utilidad y helpers
const hasPendingChanges = (data, store) => {
  return JSON.stringify(data) !== JSON.stringify(store);
};
const TextInput = ({ label, value, onChange }) => (
  <div className="space-y-2 mt-4">
    <Label>{label}</Label>
    <Input type="text" value={value} onChange={onChange} />
  </div>
);

const TextAreaInput = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Textarea value={value} rows={5} onChange={onChange} />
  </div>
);
function getFirstAvailableId(monedas) {
  const used = new Set((monedas || []).map((m) => Number(m.id)));
  let candidate = 1;
  while (used.has(candidate)) candidate++;
  return candidate;
}
