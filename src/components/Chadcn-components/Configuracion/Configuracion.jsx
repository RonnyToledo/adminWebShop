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
  Phone,
  Mail,
  Loader2,
  BadgeCheck,
  AlertCircle,
  Sparkles,
  Trash2,
  Store,
  Clock,
  Coins,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CARD_CLASS,
  CardHeading,
  SectionHeading,
  SectionNav,
  SettingRow,
} from "./section-primitives";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { FromData } from "@/components/globalFunction/fromData";
import ProfileHeader from "./profile-header";
import WeeklySchedule from "./WeeklySchedule";
import { Textarea } from "@/components/ui/textarea";
import ConfiguracionState from "./configuracionState";
import TransferOwnership from "./TransferOwnership";
import { toast } from "sonner";
import axios from "axios";
import { buildImprovementPrompt } from "./TextIAModel";
import { usePlan } from "@/hooks/usePlan";
import { VscSymbolProperty } from "react-icons/vsc";
import { IoIosCheckmarkCircle, IoIosWarning } from "react-icons/io";
import { MdContacts } from "react-icons/md";

export default function Configuracion({ ThemeContext, country, initialData }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [newAgregados] = useState({ moneda: "", valor: 0 });
  const [store, setStore] = useState({
    comentario: [],
    categoria: [],
    monedas: [],
    horarios: [],
    envios: [],
    ...(initialData?.store ?? {}),
  });
  const { config } = usePlan();

  useEffect(() => {
    if (!initialData) return;
    setWebshop((previous) => ({
      ...previous,
      ...initialData,
      store: { ...previous.store, ...(initialData.store ?? {}) },
    }));
  }, [initialData, setWebshop]);

  useEffect(() => {
    if (webshop?.store) {
      setStore((previous) => ({
        ...previous,
        ...webshop.store,
        monedas: Array.isArray(webshop.store.monedas)
          ? webshop.store.monedas
          : [],
      }));
    }
  }, [webshop?.store]);

  const selectedIdStr = useMemo(
    () =>
      String(
        store?.monedas?.find((m) => m.defecto)?.id ??
          store?.monedas?.[0]?.id ??
          "",
      ),
    [store?.monedas],
  );

  const [localNew, setLocalNew] = useState({
    nombre: newAgregados?.moneda ?? "",
    valor: String(newAgregados?.valor ?? ""),
  });

  function setDefaultById(id) {
    const updated = (store?.monedas || []).map((m) => ({
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
      toast.error("Error al eliminar moneda", {
        description: "No puedes eliminar la moneda por defecto",
      });
      return;
    }
    if (filtered.length === 0) {
      toast.error("Error al eliminar moneda", {
        description: "No te puedes quedar sin monedas",
      });
      return;
    }
    if (
      webshop?.products.filter((prod) => prod.default_moneda == id).length > 0
    ) {
      toast.error("Error al eliminar moneda", {
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
      toast.error("Error al agregar moneda", {
        description: "Faltan datos o valor inválido",
      });
      return;
    }
    if (store?.monedas.some((obj) => obj.nombre == nombre)) {
      toast.error("Error al agregar moneda", {
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

  const defaultMonedaName =
    store?.monedas?.find((m) => m.defecto)?.nombre ?? "CUP";

  const resumen = [
    { label: "productos activos", value: productosActivos },
    { label: "agotados", value: productosAgotados },
    { label: "categorías", value: totalCategorias },
    { label: "monedas", value: store?.monedas?.length ?? 0 },
  ];

  const operaciones = [
    {
      key: "carrito",
      label: "Carrito de compras",
      desc: "Permitir carrito en el catálogo",
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
  ].filter(Boolean);

  return (
    <main className="container mx-auto my-8 p-0">
      <FromData store={store} ThemeContext={ThemeContext}>
        <div className="min-w-0 space-y-10">
          {/* ── Encabezado + resumen ─────────────────────────────────────── */}
          <header className="space-y-3 px-4 sm:px-6 lg:px-8 ">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Configuración
                </h1>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  {store?.name ?? "Mi tienda"}
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        store?.active ? "bg-foreground" : "bg-destructive",
                      )}
                    />
                    {store?.active ? "Activa" : "Inactiva"}
                  </span>
                </p>
              </div>
              {hasPending && (
                <div
                  role="status"
                  className="flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-sm text-foreground"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Cambios sin guardar
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              {resumen.map(({ label, value }) => (
                <span key={label}>
                  <span className="font-semibold text-foreground">{value}</span>{" "}
                  {label}
                </span>
              ))}
            </div>
          </header>

          <SectionNav sections={SECTIONS} />
          <div className="px-4 sm:px-6 lg:px-8">
            {/* ── 1. Operación: lo que se toca con más frecuencia ──────────── */}
            <section id="operacion" className="scroll-mt-20 space-y-4">
              <SectionHeading
                title="Operación"
                description="Cómo recibes pedidos, cobras y atiendes cada día"
                icon={VscSymbolProperty}
              />
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Operaciones */}
                <Card className={cn(CARD_CLASS, "min-w-0")}>
                  <CardHeading
                    icon={Settings2}
                    title="Operaciones del negocio"
                    description="Carrito, stock, local y delivery"
                  />
                  <CardContent className="space-y-3">
                    {operaciones.map(({ key, label, desc }) => (
                      <SettingRow
                        key={key}
                        htmlFor={`switch-${key}`}
                        label={label}
                        description={desc}
                        control={
                          <SwitchStore
                            name={store?.[key]}
                            object={store}
                            title={key}
                            funcion={setStore}
                          />
                        }
                      />
                    ))}

                    {config.domicilio && (
                      <SettingRow
                        htmlFor="switch-domicilio"
                        label="Servicio de delivery"
                        description={
                          <>
                            Activar entregas a domicilio
                            {store?.envios?.length > 0 && (
                              <span className="ml-1 font-medium text-foreground">
                                · {store.envios.length} zona
                                {store.envios.length !== 1 ? "s" : ""}
                              </span>
                            )}
                          </>
                        }
                        control={
                          <SwitchStore
                            name={store?.domicilio}
                            object={store}
                            title="domicilio"
                            funcion={setStore}
                          />
                        }
                        footer={
                          store?.domicilio && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <Link href="/configuracion/domicilios">
                                Gestionar zonas de envío →
                              </Link>
                            </Button>
                          )
                        }
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Horario */}
                <Card className={cn(CARD_CLASS, "min-w-0")}>
                  <CardHeading
                    icon={Clock}
                    title="Horario semanal"
                    description="Turnos de atención por día; un día sin turnos figura como cerrado"
                  />
                  <CardContent>
                    <WeeklySchedule
                      horario={store?.horarios || []}
                      onHorarioChange={(horarios) =>
                        setStore((prev) => ({ ...prev, horarios }))
                      }
                    />
                  </CardContent>
                </Card>

                {/* Monedas */}
                <Card className={cn(CARD_CLASS, "min-w-0 lg:col-span-2")}>
                  <CardHeading
                    icon={Coins}
                    title="Monedas"
                    description={`Moneda por defecto y tasas de cambio respecto a ${defaultMonedaName}`}
                  />
                  <CardContent className="space-y-5">
                    <RadioGroup
                      value={selectedIdStr}
                      onValueChange={(val) => {
                        const id = Number(val);
                        if (!isNaN(id)) setDefaultById(id);
                      }}
                      className="grid gap-1.5 md:grid-cols-2"
                    >
                      {store?.monedas?.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No hay monedas configuradas
                        </p>
                      ) : (
                        store?.monedas?.map((m) => (
                          <div
                            key={m.id}
                            className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 transition-colors hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <RadioGroupItem
                                value={String(m.id)}
                                id={`mon-${m.id}`}
                              />
                              <div className="flex flex-col">
                                <Label
                                  htmlFor={`mon-${m.id}`}
                                  className="text-sm font-medium"
                                >
                                  {m.nombre}
                                </Label>
                                {m.defecto && (
                                  <span className="text-xs text-muted-foreground">
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
                                  aria-label={`Tasa de ${m.nombre}`}
                                  className="w-32 text-right"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => deleteMoneda(m.id)}
                                aria-label={`Eliminar moneda ${m.nombre}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </RadioGroup>

                    <div className="space-y-3 border-t border-border pt-4">
                      <Label>Agregar moneda</Label>
                      <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-[1fr_1fr_auto] md:max-w-xl">
                        <div>
                          <Label
                            htmlFor="new-moneda-codigo"
                            className="mb-1 block text-xs text-muted-foreground"
                          >
                            Código
                          </Label>
                          <Input
                            id="new-moneda-codigo"
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
                          <Label
                            htmlFor="new-moneda-tasa"
                            className="mb-1 block text-xs text-muted-foreground"
                          >
                            Tasa ({defaultMonedaName})
                          </Label>
                          <Input
                            id="new-moneda-tasa"
                            type="number"
                            value={localNew.valor}
                            onChange={(e) =>
                              setLocalNew((s) => ({
                                ...s,
                                valor: e.target.value,
                              }))
                            }
                            placeholder="470"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={handleAddLocal}
                          className="col-span-2 sm:col-span-1"
                        >
                          Agregar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* ── 2. Identidad: se configura una vez y se retoca poco ──────── */}
            <section id="identidad" className="scroll-mt-20 space-y-4">
              <SectionHeading
                title="Identidad"
                description="Lo primero que ven tus clientes en el catálogo"
                icon={IoIosCheckmarkCircle}
              />
              <Card className={CARD_CLASS}>
                <CardHeading
                  icon={Store}
                  title="Perfil de la tienda"
                  description="Logo, portada, nombre y textos públicos"
                />
                <CardContent className="space-y-5">
                  <ProfileHeader store={store} setStore={setStore} />

                  <div className="space-y-2">
                    <Label htmlFor="storeName">Nombre de la tienda</Label>
                    <InputStore
                      name="storeName"
                      object={store}
                      value="name"
                      action={setStore}
                      type="text"
                    />
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    <TextAreaInput
                      label="Mensaje de bienvenida"
                      value={store?.parrrafo || ""}
                      onChange={(value) =>
                        setStore((prev) => ({ ...prev, parrrafo: value }))
                      }
                      keyWords="parrrafo"
                    />
                    <TextAreaInput
                      label="Historia del negocio"
                      value={store?.history || ""}
                      onChange={(value) =>
                        setStore((prev) => ({ ...prev, history: value }))
                      }
                      keyWords="history"
                    />
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* ── 3. Contacto y ubicación ──────────────────────────────────── */}
            <section id="contacto" className="scroll-mt-20 space-y-4">
              <SectionHeading
                title="Contacto y ubicación"
                description="Cómo te encuentran y te escriben"
                icon={MdContacts}
              />
              <div className="space-y-4">
                <Card className={CARD_CLASS}>
                  <CardHeading
                    icon={Phone}
                    title="Información de contacto"
                    description="Teléfono, correo y redes sociales del negocio"
                  />
                  <CardContent className="grid gap-5 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Teléfono</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <InputStore
                          name="phoneNumber"
                          object={store}
                          value="cell"
                          action={setStore}
                          type="tel"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Número visible para pedidos y contacto con clientes
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <InputStore
                          name="email"
                          object={store}
                          value="email"
                          action={setStore}
                          type="text"
                        />
                      </div>
                    </div>

                    {store?.redes?.length > 0 && (
                      <div className="space-y-1.5 border-t border-border pt-3 md:border-t-0 md:pt-0">
                        <p className="text-xs font-medium text-muted-foreground">
                          Redes configuradas
                        </p>
                        {store.redes.map((red) => {
                          const user = String(red.user ?? "");
                          return (
                            <div
                              key={red.tipo}
                              className="flex items-center gap-2 text-sm text-foreground"
                            >
                              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                              <span className="capitalize">{red.tipo}</span>
                              <span className="truncate text-muted-foreground">
                                {user.startsWith("@") ? user : `@${user}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <ConfiguracionState
                  store={store}
                  setStore={setStore}
                  country={country}
                />
              </div>
            </section>

            {/* ── 4. Zona crítica: irreversible, siempre al final ──────────── */}
            <section id="avanzado" className="scroll-mt-20 space-y-4">
              <SectionHeading
                title="Zona crítica"
                description="Acciones que no se pueden deshacer"
                icon={IoIosWarning}
              />
              <TransferOwnership store={store} />
            </section>
          </div>
        </div>
      </FromData>
      <ConfirmationOut action={hasPending} />
    </main>
  );
}

const SECTIONS = [
  { id: "operacion", label: "Operación", icon: VscSymbolProperty },
  { id: "identidad", label: "Identidad", icon: IoIosCheckmarkCircle },
  { id: "contacto", label: "Contacto y ubicación", icon: MdContacts },
  { id: "avanzado", label: "Zona crítica", icon: IoIosWarning },
];

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

  async function GeminiUpdated(val) {
    setStatus("loading");
    try {
      const formData = new FormData();
      const text = buildImprovementPrompt({
        exists: !!val,
        textType: keyWords,
        paragraph: val,
      });
      formData.append("text", text);
      const postPromise = axios.post(`/api/gemini`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.promise(postPromise, {
        loading: "Optimizando texto con IA...",
        success: (response) => {
          onChange(response.data.result);
          return {
            message: "Texto actualizado",
            description: "El contenido fue mejorado con IA",
          };
        },
        error: (err) => {
          console.error(err);
          return {
            message: "Error al optimizar",
            description: "No se pudo optimizar el contenido.",
          };
        },
      });
      // toast.promise no devuelve una promesa: esperamos la petición real
      await postPromise.catch(() => {});
    } catch (error) {
      console.error(error);
    } finally {
      setStatus("time");
      toast.info("Servicio de IA", {
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
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : (
          <Sparkles className="w-4 h-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
};
