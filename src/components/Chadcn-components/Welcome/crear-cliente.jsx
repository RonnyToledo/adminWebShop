"use client";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Building2,
  Mail,
  Loader2,
  MapPin,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import "react-phone-input-2/lib/style.css";
import { isValidPhoneNumber } from "libphonenumber-js";
import Loading from "../../component/loading";
import { Switch } from "@/components/ui/switch";
import style from "./style.module.css";

/* ------------------ validation schema ------------------ */
/* guardamos country por nombre (tal como pediste) */
const formSchema = z.object({
  name: z.string().min(1, "El nombre del negocio es requerido"),
  country: z.string().min(1, "El país es requerido"), // name
  Provincia: z.string().min(1, "La provincia es requerida"), // name
  municipio: z.string().min(1, "El municipio es requerido"), // name
  stock: z.boolean(),
  moneda_default: z.enum(["USD", "EURO", "MLC", "CUP"]),
  email: z.string().email("Email inválido"),
  cell: z
    .string()
    .min(10, "El número de teléfono debe tener al menos 10 dígitos"),
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
      .min(3, "La moneda es requerida")
      .max(4, "Máximo 4 caracteres")
      .regex(
        /^[A-Z]{1,4}$/,
        "Solo letras mayúsculas (A-Z), sin espacios, máximo 4"
      ),
    stock: z.boolean(),
  }),
  z.object({
    email: z.string().email("Email inválido"),
    cell: z
      .string()
      .min(10, "El número de teléfono debe tener al menos 10 dígitos"),
  }),
];

/* ------------------ main component ------------------ */
export function CrearClienteComponent({
  user,
  countries = [{ name: "Cuba", isoCode: "CU" }],
}) {
  const router = useRouter();
  const [states, setStates] = useState([]); // estados/provincias desde API
  const [municipios, setMunicipios] = useState([]); // ciudades desde API
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [slideDirection, setSlideDirection] = useState("right");
  const [currentStep, setCurrentStep] = useState(0);

  const [defaultCountryIso, setDefaultCountryIso] = useState(
    process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE ||
      countries[0]?.isoCode ||
      "CU"
  );
  const [selectedCountryIso, setSelectedCountryIso] =
    useState(defaultCountryIso);
  const defaultCountryName =
    (countries.find((c) => c.isoCode === defaultCountryIso) || countries[0])
      ?.name ||
    countries[0]?.name ||
    "";
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      country: defaultCountryName, // guardamos name
      Provincia: "",
      municipio: "",
      moneda_default: "CUP",
      email: user?.email || user?.email || "",
      cell: "",
      stock: false,
    },
  });

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  /* ------------------ Helpers: normalizar respuestas ------------------ */
  const normalizeStatesResponse = (data) => {
    // Esperamos array de objetos { name, isoCode, ... } o array-of-arrays fallback
    if (!Array.isArray(data)) return [];
    if (Array.isArray(data[0])) {
      // ejemplo: [ ["Prov name", "CU", "09", ...], ... ] -> map a objetos
      return data.map((arr) => ({
        name: arr[0],
        isoCode: arr[2] ?? undefined,
      }));
    }
    if (typeof data[0] === "object" && data[0] !== null) {
      return data.map((o) => ({
        name: o.name || o.nombre || String(o),
        isoCode: o.isoCode || o.code || o.codigo,
      }));
    }
    // fallback strings
    return data.map((s) => ({ name: String(s), isoCode: undefined }));
  };

  const normalizeCitiesResponseToNames = (data) => {
    if (!Array.isArray(data)) return [];
    if (Array.isArray(data[0])) {
      // [ ["Municipio", "CU", "09", lat, lon], ... ]
      return data.map((it) => String(it[0]));
    }
    if (typeof data[0] === "object" && data[0] !== null) {
      return data.map((it) => it.name || it.nombre || JSON.stringify(it));
    }
    // array de strings
    return data.filter((it) => typeof it === "string").map((s) => String(s));
  };

  /* ------------------ Fetch states (provincias) por country isoCode ------------------ */
  const fetchStates = async (countryIso, signal) => {
    if (!countryIso) {
      setStates([]);
      return;
    }
    setLoadingStates(true);
    try {
      const base = process.env.NEXT_PUBLIC_PATH ?? "";
      const url = `${base}/api/filter/state?country=${encodeURIComponent(
        countryIso
      )}`;
      const resp = await fetch(url, { signal });
      if (!resp.ok) {
        console.warn("fetch states failed", resp.status);
        setStates([]);
        return;
      }
      const data = await resp.json();
      const normalized = normalizeStatesResponse(data);
      setStates(normalized);

      // Si no hay Provincia seleccionado en form, asignar el primero (por nombre)
      const currentProvincia = form.getValues("Provincia");
      if (!currentProvincia && normalized.length > 0) {
        form.setValue("Provincia", normalized[0].name);
      }
    } catch (err) {
      if (err.name !== "AbortError")
        console.error("Error fetching states:", err);
      setStates([]);
    } finally {
      setLoadingStates(false);
    }
  };

  /* ------------------ Fetch cities (municipios) por countryIso + stateIso (obtenido desde states por name) */
  const fetchCities = async (countryIso, provinceName, signal) => {
    if (!countryIso || !provinceName) {
      setMunicipios([]);
      return;
    }
    setLoadingCities(true);
    try {
      // buscar isoCode de la provincia seleccionada dentro de states (porque guardamos solo name en form)
      const provObj = states.find((s) => s.name === provinceName);
      const stateParam = provObj?.isoCode ?? provinceName; // si no hay isoCode, enviamos nombre (fallback)

      const base = process.env.NEXT_PUBLIC_PATH ?? "";
      const url = `${base}/api/filter/city?country=${encodeURIComponent(
        countryIso
      )}&state=${encodeURIComponent(stateParam)}`;

      const resp = await fetch(url, { signal });
      if (!resp.ok) {
        console.warn("fetch cities failed", resp.status);
        setMunicipios([]);
        return;
      }
      const data = await resp.json();
      const names = normalizeCitiesResponseToNames(data);
      setMunicipios(names);

      // Si no hay municipio seleccionado en form, asignar el primero
      if (!form.getValues("municipio") && names.length > 0) {
        form.setValue("municipio", names[0]);
      }
    } catch (err) {
      if (err.name !== "AbortError")
        console.error("Error fetching cities:", err);
      setMunicipios([]);
    } finally {
      setLoadingCities(false);
    }
  };

  /* ------------------ selectedCountryIso: estado local que usamos para llamar APIs ------------------ */

  /* cada vez que cambie selectedCountryIso -> fetch states */
  useEffect(() => {
    const controller = new AbortController();
    fetchStates(selectedCountryIso, controller.signal);
    // reset provincia/municipio when country changed
    form.setValue("Provincia", "");
    form.setValue("municipio", "");
    setMunicipios([]);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountryIso]);

  /* cuando cambie Provincia (guardada por name) y selectedCountryIso -> fetch cities */
  const watchedProvincia = form.watch("Provincia");
  useEffect(() => {
    const controller = new AbortController();
    fetchCities(selectedCountryIso, watchedProvincia, controller.signal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => controller.abort();
  }, [selectedCountryIso, watchedProvincia]);

  /* ------------------ submit y navegación ------------------ */

  async function onSubmit(values) {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("user", user?.id || user?.user.id || "");
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value);
    });
    try {
      if (!isValidPhoneNumber(`+${values.cell}`)) {
        throw new Error("Numero no valido");
      }
      const result = await axios.post(`/api/tienda/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (result.status === 200 || result.status === 201) {
        toast(`Éxito al crear su tienda, ya puede empezar a trabajar
          ${result?.data?.success || ""}`);
        window.location.replace("/");
        form.reset();
        setLoadingGeneral(true);
        setCurrentStep(0);
      }
    } catch (error) {
      toast.error(error?.message || "Ocurrió un error al crear el cliente");
    } finally {
      setIsSubmitting(false);
    }
  }

  const validateCurrentStep = async () => {
    const currentValues = form.getValues();
    const stepSchema = stepSchemas[currentStep];
    try {
      stepSchema.parse(currentValues);
      return true;
    } catch (err) {
      Object.keys(stepSchema.shape).forEach((field) => form.trigger(field));
      return false;
    }
  };
  const nextStep = async () => {
    const ok = await validateCurrentStep();
    if (ok && currentStep < 3) {
      setSlideDirection("right");
      setCurrentStep(currentStep + 1);
    }
  };
  const prevStep = () => {
    if (currentStep > 0) {
      setSlideDirection("left");
      setCurrentStep(currentStep - 1);
    }
  };

  /* ------------------ UI render: Step 1 usa APIs (states + cities) ------------------ */
  const formSteps = [
    {
      icon: Building2,
      title: "Información del Negocio",
      description: "Ingrese el nombre de su negocio",
    },
    {
      icon: MapPin,
      title: "Ubicación",
      description: "Seleccione su país, provincia y municipio",
    },
    {
      icon: DollarSign,
      title: "Moneda",
      description: "Elija la moneda principal de su negocio",
    },
    {
      icon: Mail,
      title: "Contacto",
      description: "Proporcione su información de contacto",
    },
  ];
  if (loadingGeneral) {
    return <Loading />;
  }
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="group">
                  <FormLabel className="text-slate-700 font-medium text-lg">
                    Nombre del Negocio
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Ingrese el nombre del negocio"
                        className="pl-12 h-14 border-2 border-slate-200 focus:border-slate-500 text-lg"
                        {...field}
                      />
                      <Building2
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                        size={24}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            {/* COUNTRY SELECT: valores son isoCode, pero en el form guardamos el name */}
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem className="group">
                  <FormLabel className="text-slate-700 font-medium text-lg">
                    País
                  </FormLabel>
                  <Select
                    onValueChange={(iso) => {
                      const c = countries.find((x) => x.isoCode === iso);
                      const name = c ? c.name : iso;
                      field.onChange(name); // guardar name en el form
                      setSelectedCountryIso(iso); // usado para llamar APIs
                      // resetear provincia/municipio
                      form.setValue("Provincia", "");
                      form.setValue("municipio", "");
                      setMunicipios([]);
                      setStates([]);
                    }}
                    value={selectedCountryIso}
                  >
                    <FormControl>
                      <SelectTrigger className="h-14">
                        <SelectValue
                          placeholder={field.value || "Seleccione país"}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.isoCode} value={c.isoCode}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* PROVINCIA SELECT (states fetched) */}
            <FormField
              control={form.control}
              name="Provincia"
              render={({ field }) => (
                <FormItem className="group">
                  <FormLabel className="text-slate-700 font-medium text-lg">
                    Provincia
                  </FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value); // guardamos name
                      form.setValue("municipio", ""); // limpiamos municipio para recargar
                    }}
                    value={field.value}
                    disabled={loadingStates || states.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger className="h-14">
                        <SelectValue
                          placeholder={
                            field.value ||
                            (loadingStates
                              ? "Cargando..."
                              : "Seleccione provincia")
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {states.map((s, i) => (
                        <SelectItem key={i} value={s.name}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* MUNICIPIO SELECT (cities fetched) */}
            <FormField
              control={form.control}
              name="municipio"
              render={({ field }) => (
                <FormItem className="group">
                  <FormLabel className="text-slate-700 font-medium text-lg">
                    Municipio
                  </FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value)}
                    value={field.value}
                    disabled={loadingCities || municipios.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger className="h-14">
                        <SelectValue
                          placeholder={
                            field.value ||
                            (loadingCities
                              ? "Cargando..."
                              : "Seleccione municipio")
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {municipios.map((m, idx) => (
                        <SelectItem key={idx} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
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
              render={({ field }) => (
                <FormItem className="group">
                  <FormLabel className="text-slate-700 font-medium text-lg">
                    Moneda Principal (siglas)
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Ej: CUP, USD, MLC"
                        className="pl-12 h-14 border-2 border-slate-200 text-lg"
                        {...field}
                        maxLength={4}
                        onInput={(e) => {
                          const target = e.target;
                          const cleaned = (target.value || "")
                            .replace(/[^A-Za-z]/g, "")
                            .toUpperCase()
                            .slice(0, 4);
                          target.value = cleaned;
                          field.onChange(cleaned);
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const paste =
                            (e.clipboardData || window.clipboardData).getData(
                              "text"
                            ) || "";
                          const cleaned = paste
                            .replace(/[^A-Za-z]/g, "")
                            .toUpperCase()
                            .slice(0, 4);
                          field.onChange(cleaned);
                          if (e.target) e.target.value = cleaned;
                        }}
                        onBlur={(e) => {
                          const v = (e.target.value || "")
                            .replace(/[^A-Za-z]/g, "")
                            .toUpperCase()
                            .slice(0, 4);
                          field.onBlur();
                          field.onChange(v);
                        }}
                      />
                      <Building2
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                        size={24}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel className="text-slate-700 font-medium text-lg">
                    Usar control de inventario para la disponibilidad de
                    productos (stock){" "}
                  </FormLabel>
                  <FormControl>
                    <Switch {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="group">
                  <FormLabel className="text-slate-700 font-medium text-lg">
                    Email
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="email"
                        placeholder="ejemplo@correo.com"
                        className="pl-12 h-14 border-2 border-slate-200 text-lg"
                        {...field}
                        readOnly={!!user?.email || !!user?.user.email}
                      />
                      <Mail
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                        size={24}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cell"
              render={({ field }) => (
                <FormItem className="group">
                  <FormLabel className="text-slate-700 font-medium text-lg">
                    Teléfono
                  </FormLabel>
                  <FormControl>
                    <div className="phone-input-container">
                      <PhoneInput
                        country={selectedCountryIso.toLocaleLowerCase()}
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
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      default:
        return null;
    }
  };

  /* ------------------ RENDER principal (igual estructura que tenías) ------------------ */
  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-700 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Crear Nuevo Cliente
          </h1>
          <p className="text-slate-600">
            Complete la información para registrar su negocio
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {formSteps.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  index < currentStep
                    ? "bg-green-600 text-white"
                    : index === currentStep
                    ? "bg-slate-700 text-white scale-110"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <step.icon className="w-6 h-6" />
                )}
              </div>
              <span className="text-xs mt-2 text-slate-600 hidden sm:block text-center max-w-20">
                {step.title}
              </span>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-slate-700 h-2 rounded-full"
              style={{
                width: `${((currentStep + 1) / formSteps.length) * 100}%`,
              }}
            ></div>
          </div>
          <div className="text-center mt-2 text-sm text-slate-600">
            Paso {currentStep + 1} de {formSteps.length}
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-lg border border-slate-200 bg-white min-h-[400px]">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl text-slate-800 flex items-center justify-center gap-3">
              {(() => {
                const IconComponent = formSteps[currentStep].icon;
                return <IconComponent className="w-8 h-8 text-slate-700" />;
              })()}
              {formSteps[currentStep].title}
            </CardTitle>
            <CardDescription className="text-lg">
              {formSteps[currentStep].description}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div
                  key={currentStep}
                  className={`animate-in ${
                    slideDirection === "right"
                      ? "slide-in-from-right-5"
                      : "slide-in-from-left-5"
                  } duration-500`}
                >
                  {renderStepContent()}
                </div>

                <div className="flex justify-between pt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="h-12 px-6 border-2 border-slate-300"
                  >
                    {" "}
                    <ArrowLeft className="mr-2 h-5 w-5" /> Anterior{" "}
                  </Button>

                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="h-12 px-6 bg-slate-700 text-white"
                    >
                      {" "}
                      Siguiente <ArrowRight className="ml-2 h-5 w-5" />{" "}
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="h-12 px-6 bg-green-600 text-white"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                          Creando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-5 w-5" /> Crear Cliente
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-500 text-sm">
          <p>¿Necesita ayuda? Contacte a nuestro equipo de soporte</p>
        </div>
      </div>
    </div>
  );
}
