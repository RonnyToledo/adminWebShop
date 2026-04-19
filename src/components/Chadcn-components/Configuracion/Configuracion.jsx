"use client";
import React from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useContext, useMemo } from "react";
import ConfirmationOut from "@/components/globalFunction/confirmationOut";
import { InputStore, SwitchStore } from "./Input-Store";
import {
  Instagram,
  Phone,
  Mail,
  Loader2,
  BadgeCheck,
  AlertCircle,
} from "lucide-react";
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
import { sileo } from "sileo";
import axios from "axios";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { buildImprovementPrompt } from "./TextIAModel";
import { usePlan } from "@/hooks/usePlan";

export default function Configuracion({ ThemeContext, country }) {
  const { webshop } = useContext(ThemeContext);
  const [newAgregados, setNewAgregados] = useState({ moneda: "", valor: 0 });
  const [store, setStore] = useState({
    comentario: [],
    categoria: [],
    monedas: [],
    horario: [],
    envios: [],
  });
  const { config } = usePlan();

  useEffect(() => {
    setStore(webshop?.store);
  }, [webshop.store]);

  const selectedIdStr = useMemo(
    () =>
      String(
        store?.monedas.find((m) => m.defecto)?.id ??
          store?.monedas[0]?.id ??
          "",
      ),
    [store?.monedas],
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
      m.id === id ? { ...m, valor } : m,
    );
    setStore({ ...(store ?? {}), monedas: updated });
  }

  function deleteMoneda(id) {
    const filtered = (store?.monedas || []).filter((m) => m.id !== id);
    if ((store?.monedas || []).find((m) => m.id == id)?.defecto) {
      sileo.error({
        title: "Error al eliminar moneda",
        description: "No puedes eliminar la moneda por defecto",
      });
      return;
    }
    if (filtered.length === 0) {
      sileo.error({
        title: "Error al eliminar moneda",
        description: "No te puedes quedar sin monedas",
      });
      return;
    }
    if (
      webshop?.products.filter((prod) => prod.default_moneda == id).length > 0
    ) {
      sileo.error({
        title: "Error al eliminar moneda",
        description: "Estás vendiendo productos en esta moneda",
      });
      return;
    }
    const hadDefectoRemoved = store?.monedas.some(
      (m) => m.id === id && m.defecto,
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
      sileo.error({
        title: "Error al agregar moneda",
        description: "Faltan datos o valor inválido",
      });
      return;
    }
    if (store?.monedas.some((obj) => obj.nombre == nombre)) {
      sileo.error({
        title: "Error al agregar moneda",
        description: "Ya existe dicha moneda",
      });
      return;
    }
    const newId = getFirstAvailableId(store?.monedas ?? []);
    const newMon = {
      id: newId,
      nombre,
      valor,
      ui_store: store?.UUID ?? undefined,
      defecto: store?.monedas.length === 0,
    };
    const updated = [...(store?.monedas || []), newMon];
    const normalized = updated.map((m, i) => ({
      ...m,
      defecto: m.defecto ? true : i === 0 && !updated.some((x) => x.defecto),
    }));
    setStore({ ...(store ?? {}), monedas: normalized });
    setLocalNew({ nombre: "", valor: "" });
  }

  // Métricas derivadas del log para mostrar contexto en la UI
  const productosActivos =
    webshop?.products?.filter((p) => p.visible && !p.agotado).length ?? 0;
  const productosAgotados =
    webshop?.products?.filter((p) => p.agotado).length ?? 0;
  const totalCategorias = store?.categoria?.length ?? 0;
  const hasPending = hasPendingChanges(store, webshop?.store);

  return (
    <main className="container mx-auto my-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <FromData store={store} ThemeContext={ThemeContext}>
        {/* ── Encabezado de sección ─────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Configuración
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {store?.name ?? "Mi tienda"} ·{" "}
              <span
                className={
                  store?.active ? "text-green-600" : "text-destructive"
                }
              >
                {store?.active ? "Activa" : "Inactiva"}
              </span>
            </p>
          </div>
          {hasPending && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Cambios sin guardar
            </div>
          )}
        </div>

        {/* ── Resumen rápido del log ────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Productos activos", value: productosActivos },
            { label: "Agotados", value: productosAgotados },
            { label: "Categorías", value: totalCategorias },
            { label: "Monedas", value: store?.monedas?.length ?? 0 },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-muted/40 rounded-xl border border-border px-4 py-3"
            >
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-semibold text-foreground mt-0.5">
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Perfil + textos ──────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Perfil de la tienda</CardTitle>
            <CardDescription>
              Foto de portada, logo, nombre y descripción pública
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ProfileHeader store={store} setStore={setStore} />

            <div className="space-y-2">
              <Label htmlFor="storeName">Nombre de la tienda</Label>
              <InputStore
                name={"Nombre del negocio"}
                object={store}
                value={store?.name}
                action={setStore}
                type={"text"}
              />
            </div>

            <TextAreaInput
              label="Mensaje de bienvenida"
              value={store?.parrrafo || ""}
              onChange={(value) =>
                setStore((prev) => ({ ...prev, parrrafo: value }))
              }
              keyWords={"parrrafo"}
            />

            <TextAreaInput
              label="Historia del negocio"
              value={store?.history || ""}
              onChange={(value) =>
                setStore((prev) => ({ ...prev, history: value }))
              }
              keyWords={"history"}
            />

            <div>
              <Label className="mb-2 block">Horario semanal</Label>
              <WeeklyAvailability
                horario={store?.horario || []}
                onHorarioChange={(horario) =>
                  setStore((prev) => ({ ...prev, horario }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Grid de cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contacto */}
          <Card>
            <CardHeader>
              <CardTitle>Información de contacto</CardTitle>
              <CardDescription>
                Teléfono, correo y redes sociales del negocio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Teléfono</Label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <InputStore
                    name={"Número de teléfono"}
                    object={store}
                    value={store?.cell}
                    action={setStore}
                    type={"number"}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Número visible para pedidos y contacto con clientes
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
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
                <Label htmlFor="instagram">Instagram</Label>
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-muted-foreground shrink-0" />
                  <InputStore
                    name={"Instagram"}
                    object={store}
                    value={store?.insta}
                    action={setStore}
                    type={"text"}
                  />
                </div>
              </div>

              {/* Redes detectadas del log */}
              {store?.redes?.length > 0 && (
                <div className="pt-2 border-t space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Redes configuradas
                  </p>
                  {store.redes.map((red) => (
                    <div
                      key={red.tipo}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="capitalize">{red.tipo}</span>
                      <span className="text-muted-foreground truncate">
                        @{red.user}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ubicación */}
          <ConfiguracionState
            store={store}
            setStore={setStore}
            country={country}
          />

          {/* Configuración de operaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Operaciones del negocio</CardTitle>
              <CardDescription>
                Carrito, pagos, stock, local y delivery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  key: "carrito",
                  label: "Carrito de compras",
                  desc: "Permitir carrito en el catálogo",
                },
                {
                  key: "act_tf",
                  label: "Transferencias bancarias",
                  desc: "Aceptar transferencias como método de pago",
                },
                config.stocks && {
                  key: "stocks",
                  label: "Control de stock",
                  desc: "Manejar disponibilidad de productos desde la plataforma",
                },
                {
                  key: "local",
                  label: "Recogida en local",
                  desc: "Activar el local como punto de recogida",
                },
              ]
                .filter(Boolean)
                .map(({ key, label, desc }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg border px-4 py-3 gap-4"
                  >
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <Label className="text-sm font-medium">{label}</Label>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <SwitchStore
                      name={store?.[key]}
                      object={store}
                      title={key}
                      funcion={setStore}
                    />
                  </div>
                ))}

              {/* Delivery con enlace condicional */}
              {config.domicilio && (
                <div className="rounded-lg border px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5 flex-1">
                      <Label className="text-sm font-medium">
                        Servicio de delivery
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Activar entregas a domicilio
                        {store?.envios?.length > 0 && (
                          <span className="ml-1 text-primary font-medium">
                            · {store.envios.length} zona
                            {store.envios.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </p>
                    </div>
                    <SwitchStore
                      name={store?.domicilio}
                      object={store}
                      title={"domicilio"}
                      funcion={setStore}
                    />
                  </div>
                  {store?.domicilio && (
                    <div className="pt-1">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <Link href="/configuracion/domicilios">
                          Gestionar zonas de envío →
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monedas */}
          <Card>
            <CardHeader>
              <CardTitle>Monedas</CardTitle>
              <CardDescription>
                Configura las monedas y tasas de cambio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Moneda por defecto</Label>
                <RadioGroup
                  value={selectedIdStr}
                  onValueChange={(val) => {
                    const id = Number(val);
                    if (!isNaN(id)) setDefaultById(id);
                  }}
                  className="space-y-1"
                >
                  {store?.monedas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay monedas configuradas
                    </p>
                  ) : (
                    store?.monedas.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg border hover:bg-muted/50 transition-colors"
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
                            {m.defecto && (
                              <span className="text-xs text-primary font-medium">
                                Por defecto
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Input
                              type="number"
                              value={m.valor}
                              onChange={(e) =>
                                updateValor(m.id, e.target.value)
                              }
                              className="w-28 pr-8 text-right"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                              CUP
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.preventDefault();
                              deleteMoneda(m.id);
                            }}
                            aria-label={`Eliminar moneda ${m.nombre}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
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
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  Los valores son tasas de cambio relativas al CUP
                </p>
              </div>

              {/* Agregar moneda */}
              <div className="pt-4 border-t space-y-3">
                <Label>Agregar moneda</Label>
                <div className="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Código
                    </Label>
                    <Input
                      value={localNew.nombre}
                      maxLength={4}
                      minLength={2}
                      onChange={(e) =>
                        setLocalNew((s) => ({
                          ...s,
                          nombre: e.target.value.toLocaleUpperCase(),
                        }))
                      }
                      placeholder="USD"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Tasa (CUP)
                    </Label>
                    <Input
                      type="number"
                      value={localNew.valor}
                      onChange={(e) =>
                        setLocalNew((s) => ({ ...s, valor: e.target.value }))
                      }
                      placeholder="470"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddLocal();
                    }}
                    className="w-full"
                  >
                    Agregar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </FromData>
      <ConfirmationOut action={hasPendingChanges(store, webshop?.store)} />
    </main>
  );
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

const hasPendingChanges = (data, store) =>
  JSON.stringify(data) !== JSON.stringify(store);

function getFirstAvailableId(monedas) {
  const used = new Set((monedas || []).map((m) => Number(m.id)));
  let candidate = 1;
  while (used.has(candidate)) candidate++;
  return candidate;
}

// ─── TextAreaInput con IA ─────────────────────────────────────────────────────

const TextAreaInput = ({ label, value, onChange, keyWords }) => {
  const [status, setStatus] = useState("run");

  useEffect(() => {
    if (status === "time") {
      const t = setTimeout(() => setStatus("run"), 1000 * 60);
      return () => clearTimeout(t);
    }
  }, [status]);

  function GeminiUpdated(val) {
    setStatus("loading");
    try {
      const formData = new FormData();
      const text = buildImprovementPrompt(!!val, keyWords, val);
      formData.append("text", text);
      const postPromise = axios.post(`/api/gemini`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      sileo.promise(postPromise, {
        loading: { title: "Optimizando texto con IA..." },
        success: (response) => {
          onChange(response.data.result);
          return {
            title: "Texto actualizado",
            description: "El contenido fue mejorado con IA",
          };
        },
        error: (err) => {
          console.error(err);
          return {
            title: "Error al optimizar",
            description: "No se pudo optimizar el contenido.",
          };
        },
      });
    } catch (error) {
      console.error(error);
    } finally {
      setStatus("time");
      sileo.info({
        title: "Servicio de IA",
        description: "Podrás volver a usar la IA en 1 minuto",
      });
    }
  }

  return (
    <div className="relative space-y-2">
      <Label>{label}</Label>
      <Textarea
        value={value}
        rows={5}
        onChange={(e) => onChange(e.target.value)}
        className="pr-12"
      />
      <Button
        type="button"
        variant="ghost"
        className="absolute bottom-1.5 right-1.5 p-2 h-auto"
        size="sm"
        disabled={status !== "run"}
        onClick={() => GeminiUpdated(value)}
        title={
          status === "time"
            ? "Espera 1 minuto para volver a usar la IA"
            : "Mejorar con IA"
        }
      >
        {status === "loading" ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
        ) : (
          <AutoAwesomeIcon sx={{ fontSize: 18 }} className="text-slate-500" />
        )}
      </Button>
    </div>
  );
};
