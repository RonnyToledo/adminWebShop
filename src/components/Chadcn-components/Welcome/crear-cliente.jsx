"use client";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { sileo } from "sileo";
import {
  Building2,
  Mail,
  MapPin,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  CheckCircle,
  Coffee,
  Check,
  Package,
} from "lucide-react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import axios from "axios";
import { isValidPhoneNumber } from "libphonenumber-js";
import Loading from "../../component/loading";
import { motion, AnimatePresence } from "framer-motion";
import style from "./style.module.css";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const formSchema = z.object({
  name: z.string().min(1, "El nombre del negocio es requerido"),
  country: z.string().min(1, "El país es requerido"),
  Provincia: z.string().min(1, "La provincia es requerida"),
  municipio: z.string().min(1, "El municipio es requerido"),
  stock: z.boolean(),
  moneda_default: z.enum(["USD", "EURO", "MLC", "CUP"]),
  email: z.string().email("Email inválido"),
  cell: z.string().min(10, "El número debe tener al menos 10 dígitos"),
});

const stepSchemas = [
  z.object({ name: z.string().min(1, "El nombre del negocio es requerido") }),
  z.object({
    country: z.string().min(1, "El país es requerido"),
    Provincia: z.string().min(1, "La provincia es requerida"),
    municipio: z.string().min(1, "El municipio es requerido"),
  }),
  z.object({
    moneda_default: z
      .string()
      .min(3)
      .max(4)
      .regex(/^[A-Z]{1,4}$/, "Solo letras mayúsculas, máximo 4"),
    stock: z.boolean(),
  }),
  z.object({
    email: z.string().email("Email inválido"),
    cell: z.string().min(10, "El número debe tener al menos 10 dígitos"),
  }),
];

// ─── Pasos ────────────────────────────────────────────────────────────────────

const STEPS = [
  { icon: Building2, title: "Negocio", description: "Nombre de tu negocio" },
  {
    icon: MapPin,
    title: "Ubicación",
    description: "País, provincia y municipio",
  },
  {
    icon: DollarSign,
    title: "Moneda",
    description: "Moneda principal e inventario",
  },
  { icon: Mail, title: "Contacto", description: "Email y número de teléfono" },
];

// ─── Partículas ───────────────────────────────────────────────────────────────

const PARTICLES = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  size: [6, 10, 8, 5, 12, 7][i],
  top: [15, 70, 40, 85, 25, 60][i],
  left: [10, 20, 75, 55, 88, 40][i],
  delay: [0, 1.2, 0.6, 2.1, 0.3, 1.7][i],
  duration: [4, 5.5, 3.8, 6, 4.5, 5][i],
}));

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function FieldInput({ id, label, focused, setFocused, error, children }) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className={`block text-[11px] uppercase tracking-[0.12em] font-medium transition-colors duration-200 ${
          focused === id ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CrearClienteComponent({
  user,
  countries = [{ name: "Cuba", isoCode: "CU" }],
}) {
  const router = useRouter();

  const [states, setStates] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [slideDir, setSlideDir] = useState(1); // 1 = forward, -1 = backward
  const [focused, setFocused] = useState(null);

  const defaultCountryIso =
    process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE ||
    countries[0]?.isoCode ||
    "CU";
  const [selectedCountryIso, setSelectedCountryIso] =
    useState(defaultCountryIso);
  const defaultCountryName =
    (countries.find((c) => c.isoCode === defaultCountryIso) || countries[0])
      ?.name || "";

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      country: defaultCountryName,
      Provincia: "",
      municipio: "",
      moneda_default: "CUP",
      email: user?.email || "",
      cell: "",
      stock: false,
    },
  });

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  // ── Normalizers (sin cambios) ───────────────────────────────────────────────

  const normalizeStates = (data) => {
    if (!Array.isArray(data)) return [];
    if (Array.isArray(data[0]))
      return data.map((a) => ({ name: a[0], isoCode: a[2] }));
    if (typeof data[0] === "object")
      return data.map((o) => ({
        name: o.name || o.nombre || String(o),
        isoCode: o.isoCode || o.code,
      }));
    return data.map((s) => ({ name: String(s) }));
  };

  const normalizeCities = (data) => {
    if (!Array.isArray(data)) return [];
    if (Array.isArray(data[0])) return data.map((a) => String(a[0]));
    if (typeof data[0] === "object")
      return data.map((o) => o.name || o.nombre || JSON.stringify(o));
    return data.filter((s) => typeof s === "string");
  };

  // ── Fetchers ────────────────────────────────────────────────────────────────

  const fetchStates = async (iso, signal) => {
    if (!iso) {
      setStates([]);
      return;
    }
    setLoadingStates(true);
    try {
      const base = process.env.NEXT_PUBLIC_PATH ?? "";
      const res = await fetch(
        `${base}/api/filter/state?country=${encodeURIComponent(iso)}`,
        { signal },
      );
      if (!res.ok) {
        setStates([]);
        return;
      }
      const norm = normalizeStates(await res.json());
      setStates(norm);
      if (!form.getValues("Provincia") && norm.length > 0)
        form.setValue("Provincia", norm[0].name);
    } catch (e) {
      if (e.name !== "AbortError") setStates([]);
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchCities = async (iso, prov, signal) => {
    if (!iso || !prov) {
      setMunicipios([]);
      return;
    }
    setLoadingCities(true);
    try {
      const base = process.env.NEXT_PUBLIC_PATH ?? "";
      const provObj = states.find((s) => s.name === prov);
      const stateParam = provObj?.isoCode ?? prov;
      const res = await fetch(
        `${base}/api/filter/city?country=${encodeURIComponent(iso)}&state=${encodeURIComponent(stateParam)}`,
        { signal },
      );
      if (!res.ok) {
        setMunicipios([]);
        return;
      }
      const names = normalizeCities(await res.json());
      setMunicipios(names);
      if (!form.getValues("municipio") && names.length > 0)
        form.setValue("municipio", names[0]);
    } catch (e) {
      if (e.name !== "AbortError") setMunicipios([]);
    } finally {
      setLoadingCities(false);
    }
  };

  useEffect(() => {
    const ctrl = new AbortController();
    fetchStates(selectedCountryIso, ctrl.signal);
    form.setValue("Provincia", "");
    form.setValue("municipio", "");
    setMunicipios([]);
    setStates([]);
    return () => ctrl.abort();
  }, [selectedCountryIso]);

  const watchedProvincia = form.watch("Provincia");
  useEffect(() => {
    const ctrl = new AbortController();
    fetchCities(selectedCountryIso, watchedProvincia, ctrl.signal);
    return () => ctrl.abort();
  }, [selectedCountryIso, watchedProvincia]);

  // ── Submit / navegación ─────────────────────────────────────────────────────

  async function onSubmit(values) {
    setIsSubmitting(true);
    const fd = new FormData();
    fd.append("user", user?.id || user?.user?.id || "");
    Object.entries(values).forEach(([k, v]) => fd.append(k, v));
    try {
      if (!isValidPhoneNumber(`+${values.cell}`))
        throw new Error("Número no válido");
      const res = await axios.post("/api/tienda/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.status === 200 || res.status === 201) {
        sileo.success({
          title: "Tienda creada",
          description: `Ya puedes empezar a trabajar ${res?.data?.success || ""}`,
        });
        window.location.replace("/");
        form.reset();
        setLoadingGeneral(true);
        setCurrentStep(0);
      }
    } catch (err) {
      sileo.error({
        title: "Error al crear tienda",
        description: err?.message || "Ocurrió un error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const validateStep = async () => {
    try {
      stepSchemas[currentStep].parse(form.getValues());
      return true;
    } catch {
      Object.keys(stepSchemas[currentStep].shape).forEach((f) =>
        form.trigger(f),
      );
      return false;
    }
  };

  const nextStep = async () => {
    if ((await validateStep()) && currentStep < 3) {
      setSlideDir(1);
      setCurrentStep((s) => s + 1);
    }
  };
  const prevStep = () => {
    if (currentStep > 0) {
      setSlideDir(-1);
      setCurrentStep((s) => s - 1);
    }
  };

  if (loadingGeneral) return <Loading />;

  // ── Input nativo reutilizable ───────────────────────────────────────────────

  const baseInput = `w-full bg-secondary/50 rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border transition-all duration-200`;
  const focusedClass = (id) =>
    focused === id
      ? "border-primary ring-2 ring-primary/10"
      : "border-border hover:border-border/60";

  // ── Contenido por paso ──────────────────────────────────────────────────────

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <FormField
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <FieldInput
                id="name"
                label="Nombre del negocio"
                focused={focused}
                setFocused={setFocused}
                error={fieldState.error?.message}
              >
                <input
                  id="name"
                  placeholder="Ej: Coffe-Bar Eclipse"
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                  className={`${baseInput} ${focusedClass("name")}`}
                  {...field}
                />
              </FieldInput>
            )}
          />
        );

      case 1:
        return (
          <div className="space-y-5">
            {/* País */}
            <FormField
              control={form.control}
              name="country"
              render={({ field, fieldState }) => (
                <FieldInput
                  id="country"
                  label="País"
                  focused={focused}
                  setFocused={setFocused}
                  error={fieldState.error?.message}
                >
                  <Select
                    onValueChange={(iso) => {
                      const c = countries.find((x) => x.isoCode === iso);
                      field.onChange(c ? c.name : iso);
                      setSelectedCountryIso(iso);
                      form.setValue("Provincia", "");
                      form.setValue("municipio", "");
                      setMunicipios([]);
                      setStates([]);
                    }}
                    value={selectedCountryIso}
                  >
                    <SelectTrigger
                      className={`${baseInput} h-auto`}
                      onFocus={() => setFocused("country")}
                      onBlur={() => setFocused(null)}
                    >
                      <SelectValue
                        placeholder={field.value || "Seleccione país"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.isoCode} value={c.isoCode}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldInput>
              )}
            />

            {/* Provincia */}
            <FormField
              control={form.control}
              name="Provincia"
              render={({ field, fieldState }) => (
                <FieldInput
                  id="provincia"
                  label="Provincia"
                  focused={focused}
                  setFocused={setFocused}
                  error={fieldState.error?.message}
                >
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                      form.setValue("municipio", "");
                    }}
                    value={field.value}
                    disabled={loadingStates || states.length === 0}
                  >
                    <SelectTrigger
                      className={`${baseInput} h-auto`}
                      onFocus={() => setFocused("provincia")}
                      onBlur={() => setFocused(null)}
                    >
                      <SelectValue
                        placeholder={
                          loadingStates
                            ? "Cargando..."
                            : field.value || "Seleccione provincia"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((s, i) => (
                        <SelectItem key={i} value={s.name}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldInput>
              )}
            />

            {/* Municipio */}
            <FormField
              control={form.control}
              name="municipio"
              render={({ field, fieldState }) => (
                <FieldInput
                  id="municipio"
                  label="Municipio"
                  focused={focused}
                  setFocused={setFocused}
                  error={fieldState.error?.message}
                >
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loadingCities || municipios.length === 0}
                  >
                    <SelectTrigger
                      className={`${baseInput} h-auto`}
                      onFocus={() => setFocused("municipio")}
                      onBlur={() => setFocused(null)}
                    >
                      <SelectValue
                        placeholder={
                          loadingCities
                            ? "Cargando..."
                            : field.value || "Seleccione municipio"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {municipios.map((m, i) => (
                        <SelectItem key={i} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldInput>
              )}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="moneda_default"
              render={({ field, fieldState }) => (
                <FieldInput
                  id="moneda"
                  label="Moneda principal (siglas)"
                  focused={focused}
                  setFocused={setFocused}
                  error={fieldState.error?.message}
                >
                  <input
                    id="moneda"
                    placeholder="Ej: CUP, USD, MLC"
                    maxLength={4}
                    onFocus={() => setFocused("moneda")}
                    onBlur={() => {
                      setFocused(null);
                      field.onBlur();
                    }}
                    className={`${baseInput} ${focusedClass("moneda")} font-mono tracking-widest`}
                    {...field}
                    onInput={(e) => {
                      const v = e.target.value
                        .replace(/[^A-Za-z]/g, "")
                        .toUpperCase()
                        .slice(0, 4);
                      e.target.value = v;
                      field.onChange(v);
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const v = (e.clipboardData.getData("text") || "")
                        .replace(/[^A-Za-z]/g, "")
                        .toUpperCase()
                        .slice(0, 4);
                      field.onChange(v);
                      e.target.value = v;
                    }}
                  />
                </FieldInput>
              )}
            />

            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-secondary/30">
                  <div>
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Package size={14} className="text-primary" />
                      Control de inventario
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Gestiona la disponibilidad de productos por stock
                    </p>
                  </div>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <FieldInput
                  id="email"
                  label="Correo electrónico"
                  focused={focused}
                  setFocused={setFocused}
                  error={fieldState.error?.message}
                >
                  <input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                    readOnly={!!user?.email}
                    className={`${baseInput} ${focusedClass("email")} ${user?.email ? "opacity-60 cursor-not-allowed" : ""}`}
                    {...field}
                  />
                </FieldInput>
              )}
            />

            <FormField
              control={form.control}
              name="cell"
              render={({ field, fieldState }) => (
                <FieldInput
                  id="cell"
                  label="Teléfono"
                  focused={focused}
                  setFocused={setFocused}
                  error={fieldState.error?.message}
                >
                  <PhoneInput
                    country={selectedCountryIso.toLowerCase()}
                    value={field.value}
                    onChange={field.onChange}
                    inputProps={{
                      name: "phone",
                      required: true,
                      autoFocus: false,
                    }}
                    dropdownClass={style.dropdownClass}
                    inputClass={style.inputClass}
                    buttonClass={style.ButtonClass}
                  />
                </FieldInput>
              )}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex overflow-hidden relative">
      {/* Textura */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Panel izquierdo ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex flex-col justify-between flex-[0_0_38%] px-12 py-14 border-r border-border relative z-10"
      >
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            animate={{ y: [-8, 8, -8], opacity: [0.12, 0.35, 0.12] }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute rounded-full bg-primary pointer-events-none"
            style={{
              width: p.size,
              height: p.size,
              top: `${p.top}%`,
              left: `${p.left}%`,
            }}
          />
        ))}

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Coffee size={18} className="text-primary-foreground" />
          </div>
          <span className="text-foreground text-sm font-medium tracking-wide">
            Roumenu
          </span>
        </div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[11px] text-primary uppercase tracking-[0.18em] mb-5 font-medium">
            Nueva tienda
          </p>
          <h2 className="text-[36px] font-normal leading-[1.15] text-foreground italic m-0">
            Configura tu
            <br />
            <span className="text-primary">negocio</span>
            <br />
            en minutos.
          </h2>
        </motion.div>

        {/* Pasos como checklist lateral */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.8 }}
          className="space-y-3"
        >
          {STEPS.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                    done
                      ? "bg-primary/20"
                      : active
                        ? "bg-primary/30 ring-2 ring-primary/30"
                        : "bg-muted"
                  }`}
                >
                  {done ? (
                    <Check size={11} className="text-primary" />
                  ) : (
                    <step.icon
                      size={11}
                      className={
                        active ? "text-primary" : "text-muted-foreground/50"
                      }
                    />
                  )}
                </div>
                <span
                  className={`text-sm transition-colors duration-200 ${
                    done
                      ? "text-muted-foreground line-through"
                      : active
                        ? "text-foreground font-medium"
                        : "text-muted-foreground/50"
                  }`}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </motion.div>

        <p className="text-xs text-muted-foreground/50 m-0">
          © {new Date().getFullYear()} Roumenu
        </p>
      </motion.div>

      {/* ── Panel derecho — formulario ──────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* Logo mobile */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Coffee size={15} className="text-primary-foreground" />
            </div>
            <span className="text-foreground text-sm font-medium">Roumenu</span>
          </div>

          {/* Encabezado del paso */}
          <div className="mb-8">
            <p className="text-[11px] text-primary uppercase tracking-[0.18em] mb-2 font-medium">
              Paso {currentStep + 1} de {STEPS.length}
            </p>
            <h1 className="text-2xl font-normal text-foreground italic leading-tight mb-1">
              {STEPS[currentStep].title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {STEPS[currentStep].description}
            </p>
          </div>

          {/* Barra de progreso */}
          <div className="w-full h-0.5 bg-border rounded-full overflow-hidden mb-8">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{
                width: `${((currentStep + 1) / STEPS.length) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          {/* Contenido del paso con animación */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: slideDir * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: slideDir * -24 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="min-h-[240px]"
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>

              {/* Navegación */}
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
                <motion.button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  whileHover={{ scale: currentStep === 0 ? 1 : 1.02 }}
                  whileTap={{ scale: currentStep === 0 ? 1 : 0.98 }}
                  className={`flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl border transition-all duration-200 ${
                    currentStep === 0
                      ? "border-border text-muted-foreground/40 cursor-not-allowed"
                      : "border-border text-foreground hover:bg-secondary/60 cursor-pointer"
                  }`}
                >
                  <ArrowLeft size={15} />
                  Anterior
                </motion.button>

                {currentStep < STEPS.length - 1 ? (
                  <motion.button
                    type="button"
                    onClick={nextStep}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer font-medium"
                  >
                    Siguiente
                    <ArrowRight size={15} />
                  </motion.button>
                ) : (
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    className={`flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                      isSubmitting
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {isSubmitting ? (
                        <motion.span
                          key="sub"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="inline-block w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground"
                          />
                          Creando tienda...
                        </motion.span>
                      ) : (
                        <motion.span
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle size={15} />
                          Crear tienda
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                )}
              </div>
            </form>
          </Form>

          {/* Link ayuda */}
          <div className="mt-8 pt-6 border-t border-border flex justify-center">
            <span className="text-xs text-muted-foreground">
              ¿Necesitas ayuda?{" "}
              <a
                href="mailto:soporte@roumenu.com"
                className="text-primary hover:underline transition-colors"
              >
                Contacta soporte →
              </a>
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
