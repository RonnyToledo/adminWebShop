"use client";
import React from "react";
import { useState } from "react";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import axios from "axios";
import {
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectGroup,
  SelectContent,
  Select,
} from "@/components/ui/select";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { supabase } from "@/lib/supa";
import { useRouter } from "next/navigation";
import provinciasData from "@/components/json/Site.json";

export default function MultiStepForm() {
  const provincias = provinciasData.provincias;
  const [step, setStep] = useState(1); // Controlar la página actual del formulario
  const [downloading, setDownloading] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombreNegocio: "",
    Provincia: "",
    municipio: "",
    moneda: "",
    email: "",
    cell: "",
  });
  const { toast } = useToast();
  const [errors, setErrors] = useState({});

  // Función para validar el formulario en cada paso
  const validateStep = () => {
    let newErrors = {};
    if (step === 2 && !formData.nombreNegocio) {
      newErrors.nombreNegocio = "El nombre del negocio es requerido";
      Message("Error", "El nombre del negocio es requerido");
    } else if (step === 3 && !formData.Provincia) {
      newErrors.provincia = "La provincia es requerida";
      Message("Error", "La provincia es requerida");
    }
    if (step === 4 && !formData.municipio) {
      newErrors.municipio = "El municipio es requerido";
      Message("Error", "El municipio es requerido");
    }
    if (step === 5 && !formData.moneda) {
      newErrors.moneda = "La moneda es requerida";
      Message("Error", "La moneda es requerida");
    }
    if (step === 6) {
      if (!formData.email) {
        newErrors.email = "El email es requerido";
        Message("Error", "El email es requerido");
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "El email no es válido";
        Message("Error", "El email no es válido");
      }
      if (!formData.cell) {
        newErrors.telefono = "El número de teléfono es requerido";
        Message("Error", "El número de teléfono es requerido");
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Retorna true si no hay errores
  };

  // Función para manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setErrors({
      ...errors,
      [name]: "", // Limpiar error cuando el usuario empieza a llenar el campo
    });
  };

  // Función para avanzar al siguiente paso con validación
  const nextStep = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  // Función para retroceder al paso anterior
  const prevStep = () => {
    setStep(step - 1);
  };
  function Message(title, message) {
    toast({
      title: title,
      description: message,
    });
  }
  async function fetchUserSession() {
    try {
      const res = await fetch("/api/login");
      const data = await res.json();
      if (res.ok && data?.user?.id) {
        return data.user.id;
      } else {
        console.info("Usuario no encontrado o error en la respuesta");
        router.push("/");
      }
    } catch (error) {
      console.error("Error al obtener la sesión del usuario:", error);
      router.push("/");
    }
  }

  const handleSubmit = async () => {
    setDownloading(true);
    const form = new FormData();
    const user = await fetchUserSession();
    form.append("user", user);
    form.append("name", formData.nombreNegocio);
    form.append("sitioweb", capitalizeAndRemoveSpaces(formData.nombreNegocio));
    form.append("Provincia", formData.Provincia);
    form.append("municipio", formData.municipio);
    form.append("moneda", JSON.stringify(Moneda(formData.moneda).moneda));
    form.append(
      "moneda_default",
      JSON.stringify(Moneda(formData.moneda).moneda_default)
    );
    form.append("email", formData.email);
    form.append("cell", formData.cell);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_PATH}/api/tienda/`,
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (res.status == 200) {
        toast({
          title: "Tarea Ejecutada",
          description: "Tienda Creada",
          action: (
            <ToastAction altText="Goto schedule to undo">Cerrar</ToastAction>
          ),
        });
      }
    } catch (error) {
      if (error.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        console.error("Error en la respuesta:", error.response.data);
        console.error("Código de estado:", error.response.status);
        console.error("Encabezados:", error.response.headers);
      } else if (error.request) {
        // No se recibió ninguna respuesta del servidor
        console.error("No se recibió respuesta:", error.request);
      } else {
        // Algo ocurrió al configurar la solicitud
        console.error(
          "Error en la configuración de la solicitud:",
          error.message
        );
      }
      toast({
        title: "Error",
        variant: "destructive",
        description: "No se crear su Tienda Online.",
      });
    } finally {
      setDownloading(false);
      router.replace("/");
    }
  };
  // Renderizar diferentes pasos del formulario
  switch (step) {
    case 1:
      return (
        <div className="p-4 top-0 left-0 flex flex-col items-center justify-center min-w-[100dvw] min-h-[100dvh] bg-[#f3f4f6] dark:bg-[#1e293b] text-[#334155] dark:text-[#f1f5f9]">
          <div className="max-w-md w-full px-6 py-8 bg-white dark:bg-[#0f172a] rounded-lg shadow-lg">
            <div className="flex items-center justify-center mb-6">
              <ComputerIcon className="h-12 w-12" />
              <h1 className="text-2xl font-bold ml-4">Bienvenido a RH-Menu</h1>
            </div>
            <p className="mb-6 text-lg">
              ¡Hola! Estamos encantados de tenerte aquí. Vamos a configurar tu
              cuenta y personalizar la apariencia de tienda online.
            </p>

            <div className="flex gap-4  mt-4">
              <Button className="w-full" onClick={nextStep}>
                <UserIcon className="mr-2 h-5 w-5" />
                Empezar
              </Button>
            </div>
          </div>
        </div>
      );
    case 2:
      return (
        <div className="p-4 top-0 left-0 flex flex-col items-center justify-center min-w-[100dvw] min-h-[100dvh] bg-[#f3f4f6] dark:bg-[#1e293b] text-[#334155] dark:text-[#f1f5f9]">
          <div className="max-w-md w-full px-6 py-8 bg-white dark:bg-[#0f172a] rounded-lg shadow-lg">
            <div className="flex items-center justify-center mb-6">
              <ComputerIcon className="h-12 w-12" />
              <h1 className="text-2xl font-bold ml-4">
                Registro de Negocio - Paso 1
              </h1>
            </div>
            <div className="border rounded-2x p-5">
              <div className="space-y-2">
                <Label htmlFor="bank-card">Nombre de su Negocio</Label>
                <Input
                  type="text"
                  name="nombreNegocio"
                  value={formData.nombreNegocio}
                  onChange={handleChange}
                  required
                />
              </div>

              <p className="text-xs text-muted-foreground mt-1">
                *Este Campo es obligatorio
              </p>
            </div>

            <div className="flex gap-4  mt-4">
              <Button className="w-full" onClick={prevStep}>
                <UserIcon className="mr-2 h-5 w-5" />
                Anterior
              </Button>
              <Button className="w-full" onClick={nextStep}>
                <UserIcon className="mr-2 h-5 w-5" />
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      );
    case 3:
      return (
        <div className="p-4 top-0 left-0 flex flex-col items-center justify-center min-w-[100dvw] min-h-[100dvh] bg-[#f3f4f6] dark:bg-[#1e293b] text-[#334155] dark:text-[#f1f5f9]">
          <div className="max-w-md w-full px-6 py-8 bg-white dark:bg-[#0f172a] rounded-lg shadow-lg">
            <div className="flex items-center justify-center mb-6">
              <ComputerIcon className="h-12 w-12" />
              <h1 className="text-2xl font-bold ml-4">
                Registro de Negocio - Paso 2
              </h1>
            </div>
            <div className="border rounded-2x p-5">
              <div className="space-y-2">
                <Label htmlFor="region">Provincia</Label>

                <Select
                  id="category"
                  name="category"
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      Provincia: value,
                      municipio: provincias.filter(
                        (env) => env.nombre == value
                      )[0]?.municipios[0],
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccione su Provincia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {provincias.map((obj, ind) => (
                        <SelectItem key={ind} value={obj.nombre}>
                          {obj.nombre}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                *Seleccione su ubicacion
              </p>
            </div>
            <div className="flex gap-4 mt-4">
              <Button className="w-full" onClick={prevStep}>
                <UserIcon className="mr-2 h-5 w-5" />
                Anterior
              </Button>
              <Button className="w-full" onClick={nextStep}>
                <UserIcon className="mr-2 h-5 w-5" />
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      );
    case 4:
      return (
        <div className="p-4 top-0 left-0 flex flex-col items-center justify-center min-w-[100dvw] min-h-[100dvh] bg-[#f3f4f6] dark:bg-[#1e293b] text-[#334155] dark:text-[#f1f5f9]">
          <div className="max-w-md w-full px-6 py-8 bg-white dark:bg-[#0f172a] rounded-lg shadow-lg">
            <div className="flex items-center justify-center mb-6">
              <ComputerIcon className="h-12 w-12" />
              <h1 className="text-2xl font-bold ml-4">
                Registro de Negocio - Paso 4
              </h1>
            </div>
            <div className="border rounded-2x p-5">
              <div className="space-y-2">
                <Label htmlFor="region">Municipio</Label>

                <Select
                  id="category"
                  name="category"
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      municipio: value,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccione su municipio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {provincias
                        .filter((env) => env.nombre == formData?.Provincia)[0]
                        ?.municipios.map((mun, index2) => (
                          <SelectItem value={mun} key={index2}>
                            {mun}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                *Seleccione su ubicacion
              </p>
            </div>
            <div className="flex gap-4 mt-4">
              <Button className="w-full" onClick={prevStep}>
                <UserIcon className="mr-2 h-5 w-5" />
                Anterior
              </Button>
              <Button className="w-full" onClick={nextStep}>
                <UserIcon className="mr-2 h-5 w-5" />
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      );
    case 5:
      return (
        <div className="p-4 top-0 left-0 flex flex-col items-center justify-center min-w-[100dvw] min-h-[100dvh] bg-[#f3f4f6] dark:bg-[#1e293b] text-[#334155] dark:text-[#f1f5f9]">
          <div className="max-w-md w-full px-6 py-8 bg-white dark:bg-[#0f172a] rounded-lg shadow-lg">
            <div className="flex items-center justify-center mb-6">
              <ComputerIcon className="h-12 w-12" />
              <h1 className="text-2xl font-bold ml-4">
                Registro de Negocio - Paso 4
              </h1>
            </div>
            <div className="border rounded-2x p-5">
              <div className="space-y-2">
                <Label htmlFor="region">Moneda</Label>

                <Select
                  id="category"
                  name="category"
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      moneda: value,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccione su municipio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {["CUP", "USD", "EURO", "MLC", "CAD"].map(
                        (mun, index2) => (
                          <SelectItem value={mun} key={index2}>
                            {mun}
                          </SelectItem>
                        )
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                *Seleccione su moneda de ventas
              </p>
            </div>
            <div className="flex gap-4 mt-4">
              <Button className="w-full" onClick={prevStep}>
                <UserIcon className="mr-2 h-5 w-5" />
                Anterior
              </Button>
              <Button className="w-full" onClick={nextStep}>
                <UserIcon className="mr-2 h-5 w-5" />
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      );
    case 6:
      return (
        <div className="p-4 top-0 left-0 flex flex-col items-center justify-center min-w-[100dvw] min-h-[100dvh] bg-[#f3f4f6] dark:bg-[#1e293b] text-[#334155] dark:text-[#f1f5f9]">
          <div className="max-w-md w-full px-6 py-8 bg-white dark:bg-[#0f172a] rounded-lg shadow-lg">
            <div className="flex items-center justify-center mb-6">
              <ComputerIcon className="h-12 w-12" />
              <h1 className="text-2xl font-bold ml-4">
                Registro de Negocio - Paso 5
              </h1>
            </div>
            <div className="border rounded-2x p-5">
              <div className="space-y-2">
                <Label htmlFor="bank-card">Email</Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank-card">Numero de telefono</Label>
                <InputOTP
                  maxLength={8}
                  name="telefono"
                  value={formData.telefono}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      cell: value,
                    })
                  }
                  required
                  className="flex justify-center items-center"
                >
                  <InputOTPGroup className="flex justify-around items-center">
                    <InputOTPSlot className="w-7" index={0} />
                    <InputOTPSlot className="w-7" index={1} />
                    <InputOTPSlot className="w-7" index={2} />
                    <InputOTPSlot className="w-7" index={3} />
                    <InputOTPSlot className="w-7" index={4} />
                    <InputOTPSlot className="w-7" index={5} />
                    <InputOTPSlot className="w-7" index={6} />
                    <InputOTPSlot className="w-7" index={7} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <div className="flex gap-4  mt-4">
              <Button className="w-full" onClick={prevStep}>
                <UserIcon className="mr-2 h-5 w-5" />
                Anterior
              </Button>
              <Button className="w-full" onClick={nextStep}>
                <UserIcon className="mr-2 h-5 w-5" />
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      );

    case 7:
      return (
        <div className="p-4 top-0 left-0 flex flex-col items-center justify-center min-w-[100dvw] min-h-[100dvh] bg-[#f3f4f6] dark:bg-[#1e293b] text-[#334155] dark:text-[#f1f5f9]">
          <div className="max-w-md w-full px-6 py-8 bg-white dark:bg-[#0f172a] rounded-lg shadow-lg">
            <div className="flex items-center justify-center mb-6">
              <ComputerIcon className="h-12 w-12" />
              <h1 className="text-2xl font-bold ml-4">Ya casi terminamos</h1>
            </div>
            <p className="mb-6 text-lg">
              Haga click en Terminar para configurar los ajustes finales
            </p>

            <div className="flex gap-4  mt-4">
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={downloading}
              >
                <UserIcon className="mr-2 h-5 w-5" />
                {downloading ? "Configurando..." : "Terminar"}
              </Button>
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
}
const capitalizeAndRemoveSpaces = (inputString) => {
  // Capitaliza cada palabra y elimina espacios en blanco
  return inputString
    .split(" ") // Divide el string en palabras
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitaliza cada palabra
    .join("") // Une las palabras sin espacios
    .replace(/[^a-zA-Z0-9]/g, ""); // Elimina espacios en blanco
};
const Moneda = (inputString) => {
  return {
    moneda: [{ valor: 1, moneda: inputString }],
    moneda_default: { valor: 1, moneda: inputString },
  };
};
function ComputerIcon(props) {
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
      <rect width="14" height="8" x="5" y="2" rx="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" />
      <path d="M6 18h2" />
      <path d="M12 18h6" />
    </svg>
  );
}

function PaletteIcon(props) {
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
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function UserIcon(props) {
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
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
