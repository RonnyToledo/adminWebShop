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
import { toast } from "@/components/ui/use-toast";
import {
  Building2,
  Mail,
  Phone,
  Loader2,
  MapPin,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import provinciasData from "@/components/json/Site.json";
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

const formSchema = z.object({
  name: z.string().min(1, "El nombre del negocio es requerido"),
  Provincia: z.string().min(1, "La provincia es requerida"),
  municipio: z.string().min(1, "El municipio es requerido"),
  moneda_default: z.enum(["USD", "EURO", "MLC", "CUP"]),
  email: z.string().email("Email inválido"),
  cell: z
    .string()
    .min(10, "El número de teléfono debe tener al menos 10 dígitos"),
});

const stepSchemas = [
  z.object({ name: z.string().min(1, "El nombre del negocio es requerido") }),
  z.object({
    Provincia: z.string().min(1, "La provincia es requerida"),
    municipio: z.string().min(1, "El municipio es requerido"),
  }),
  z.object({ moneda_default: z.enum(["USD", "EURO", "MLC", "CUP"]) }),
  z.object({
    email: z.string().email("Email inválido"),
    cell: z
      .string()
      .min(10, "El número de teléfono debe tener al menos 10 dígitos"),
  }),
];

export function CrearClienteComponent({ user }) {
  const [municipios, setMunicipios] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slideDirection, setSlideDirection] = useState("right");
  const [currentStep, setCurrentStep] = useState(0);
  const provincias = provinciasData.provincias;
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      Provincia: "La Habana",
      municipio: "Playa",
      moneda_default: "CUP",
      email: "",
      cell: "",
    },
  });

  useEffect(() => {
    if (!user || user == undefined) {
      router.push("/login");
    } else console.info("Welcome");
  }, [user, router]);

  const handleProvinciaChange = (provincia) => {
    const selectedProvincia = provincias.find((p) => p.nombre === provincia);
    setMunicipios(selectedProvincia ? selectedProvincia.municipios : []);
    form.setValue(
      "municipio",
      provincias.filter((env) => env.nombre == provincia)[0]?.municipios[0]
    ); // Reset municipio
  };
  async function onSubmit(values) {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("user", user);
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value);
    });
    try {
      if (isValidPhoneNumber(`+${values.cell}`) == false) {
        throw new Error(`Numero no valido`);
      }
      const result = await axios.post(`/api/tienda/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (result.status == 200) {
        toast({
          title: "Éxito al crear su tienda, ya puede eempezar a trabajar",
          description: result.success,
        });
        router.replace("/");
        form.reset();
        setCurrentStep(0);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al crear el cliente",
        variant: "destructive",
      });
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
    } catch (error) {
      // Trigger validation for current step fields
      const stepFields = Object.keys(stepSchema.shape);
      stepFields.forEach((field) => {
        form.trigger(field);
      });
      return false;
    }
  };
  const nextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < 3) {
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

  const formSteps = [
    {
      icon: Building2,
      title: "Información del Negocio",
      description: "Ingrese el nombre de su negocio",
    },
    {
      icon: MapPin,
      title: "Ubicación",
      description: "Seleccione su provincia y municipio",
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
                  <FormLabel className="text-gray-700 font-medium text-lg">
                    Nombre del Negocio
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Ingrese el nombre del negocio"
                        className="pl-12 h-14 border-2 border-gray-200 focus:border-slate-500 transition-all duration-300 group-hover:border-gray-300 text-lg"
                        {...field}
                      />
                      <Building2
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-slate-600 transition-colors duration-300"
                        size={24}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="animate-in slide-in-from-left-2 duration-300" />
                </FormItem>
              )}
            />
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="Provincia"
              render={({ field }) => (
                <FormItem className="group">
                  <FormLabel className="text-gray-700 font-medium text-lg">
                    Provincia
                  </FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleProvinciaChange(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-14 border-2 border-gray-200 focus:border-slate-500 transition-all duration-300 group-hover:border-gray-300 text-lg">
                        <SelectValue placeholder={field.value} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {provincias.map((obj, ind) => (
                        <SelectItem
                          key={ind}
                          value={obj.nombre}
                          className="hover:bg-slate-50 text-lg py-3"
                        >
                          {obj.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="animate-in slide-in-from-left-2 duration-300" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="municipio"
              render={({ field }) => (
                <FormItem className="group">
                  <FormLabel className="text-gray-700 font-medium text-lg">
                    Municipio
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={municipios.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger className="h-14 border-2 border-gray-200 focus:border-slate-500 transition-all duration-300 group-hover:border-gray-300 disabled:opacity-50 text-lg">
                        <SelectValue placeholder={field.value} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {municipios.map((municipio, index) => (
                        <SelectItem
                          key={index}
                          value={municipio}
                          className="hover:bg-slate-50 text-lg py-3"
                        >
                          {municipio}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="animate-in slide-in-from-left-2 duration-300" />
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
                  <FormLabel className="text-gray-700 font-medium text-lg">
                    Moneda Principal
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-14 border-2 border-gray-200 focus:border-slate-500 transition-all duration-300 group-hover:border-gray-300 text-lg">
                        <SelectValue placeholder={field.value} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem
                        value="CUP"
                        className="hover:bg-slate-50 text-lg py-3"
                      >
                        CUP - Peso Cubano
                      </SelectItem>
                      <SelectItem
                        value="EUR"
                        className="hover:bg-slate-50 text-lg py-3"
                      >
                        EUR - Euro
                      </SelectItem>
                      <SelectItem
                        value="USD"
                        className="hover:bg-slate-50 text-lg py-3"
                      >
                        USD - Dólar Estadounidense
                      </SelectItem>
                      <SelectItem
                        value="MLC"
                        className="hover:bg-slate-50 text-lg py-3"
                      >
                        MLC - Moneda Libremente Convertible
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="animate-in slide-in-from-left-2 duration-300" />
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
                  <FormLabel className="text-gray-700 font-medium text-lg">
                    Email
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="email"
                        placeholder="ejemplo@correo.com"
                        className="pl-12 h-14 border-2 border-gray-200 focus:border-slate-500 transition-all duration-300 group-hover:border-gray-300 text-lg"
                        {...field}
                      />
                      <Mail
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-slate-600 transition-colors duration-300"
                        size={24}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="animate-in slide-in-from-left-2 duration-300" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cell"
              render={({ field }) => (
                <FormItem className="group">
                  <FormLabel className="text-gray-700 font-medium text-lg">
                    Teléfono
                  </FormLabel>
                  <FormControl>
                    <div className="phone-input-container">
                      <PhoneInput
                        country={"cu"}
                        value={field.value}
                        onChange={field.onChange}
                        inputProps={{
                          name: "phone",
                          required: true,
                          autoFocus: false,
                        }}
                        containerStyle={{
                          height: "56px",
                        }}
                        inputStyle={{
                          height: "56px",
                          border: "2px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "18px",
                          transition: "all 0.3s ease",
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="animate-in slide-in-from-left-2 duration-300" />
                </FormItem>
              )}
            />
          </div>
        );

      default:
        return null;
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-in fade-in-0 duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-700 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Crear Nuevo Cliente
          </h1>
          <p className="text-gray-600">
            Complete la información para registrar su negocio
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8 animate-in slide-in-from-top-5 duration-700 delay-200">
          {formSteps.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                  index < currentStep
                    ? "bg-green-600 text-white shadow-lg"
                    : index === currentStep
                    ? "bg-slate-700 text-white shadow-lg scale-110"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <step.icon className="w-6 h-6" />
                )}
              </div>
              <span className="text-xs mt-2 text-gray-600 hidden sm:block text-center max-w-20">
                {step.title}
              </span>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-slate-700 h-2 rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${((currentStep + 1) / formSteps.length) * 100}%`,
              }}
            ></div>
          </div>
          <div className="text-center mt-2 text-sm text-gray-600">
            Paso {currentStep + 1} de {formSteps.length}
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-lg border border-gray-200 bg-white animate-in slide-in-from-bottom-5 duration-700 delay-300 min-h-[400px]">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl text-gray-800 flex items-center justify-center gap-3">
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
                {/* Step Content with Animation */}
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

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="h-12 px-6 border-2 border-gray-300 hover:border-slate-500 transition-all duration-300 bg-transparent"
                  >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Anterior
                  </Button>

                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="h-12 px-6 bg-slate-700 hover:bg-slate-800 text-white transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      Siguiente
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="h-12 px-6 bg-green-600 hover:bg-green-700 text-white transition-all duration-300 transform hover:scale-[1.02]"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-5 w-5" />
                          Crear Cliente
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
        <div className="text-center mt-8 text-gray-500 text-sm animate-in fade-in-0 duration-700 delay-500">
          <p>¿Necesita ayuda? Contacte a nuestro equipo de soporte</p>
        </div>
      </div>
    </div>
  );
}

const capitalizeAndRemoveSpaces = (inputString) => {
  // Capitaliza cada palabra y elimina espacios en blanco
  return inputString
    .split(" ") // Divide el string en palabras
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitaliza cada palabra
    .join("") // Une las palabras sin espacios
    .replace(/[^a-zA-Z0-9]/g, ""); // Elimina espacios en blanco
};
