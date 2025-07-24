"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
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
import { Building2, Mail, Phone, Loader2 } from "lucide-react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import provinciasData from "@/components/json/Site.json";
import { supabase } from "@/lib/supa";
import axios from "axios";

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

export function CrearClienteComponent() {
  const [municipios, setMunicipios] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  async function fetchUserSession() {
    try {
      const res = await fetch("/api/login");
      const data = await res.json();
      if (res.ok && data?.user?.id) {
        return data.user.id;
      } else {
        console.log("Usuario no encontrado o error en la respuesta:", data);
        router.push("/");
      }
    } catch (error) {
      console.error("Error al obtener la sesión del usuario:", error);
      router.push("/");
    }
  }

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
    console.log(values);
    const formData = new FormData();
    const sitioweb = capitalizeAndRemoveSpaces(values.name);
    const user = await fetchUserSession();
    const { data: Sitios, error } = await supabase
      .from("Sitios")
      .select("*")
      .eq("sitioweb", sitioweb); // Filtra los registros donde 'sitioweb' sea igual al valor
    // Verifica si hubo un error en la consulta
    if (error) {
      console.error("Error al consultar Supabase:", error);
    } else {
      // Verifica si 'Sitios' tiene algún elemento (es decir, si el valor existe en 'sitioweb')
      if (Sitios.length == 0) {
        formData.append("user", user);
        Object.entries(values).forEach(([key, value]) => {
          formData.append(key, value);
        });
        try {
          console.log("a");
          const result = await axios.post(`/api/tienda/`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          if (result.status == 200) {
            toast({
              title:
                "Éxito al crear su tienda, Pida a los administradores q aprueben su solicitud para empezar a trabajar",
              description: result.success,
            });
            form.reset();
            router.replace("/");
          }
        } catch (error) {
          toast({
            title: "Error",
            description:
              error.message || "Ocurrió un error al crear el cliente",
            variant: "destructive",
          });
        } finally {
          setIsSubmitting(false);
        }
      } else {
        toast({
          title: "Error",
          description: "Este Sitio ya existe",
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
    }
  }

  return (
    <main className="p-4 space-y-4 flex">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-5 text-center">
          Crear Nuevo Cliente
        </h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Negocio</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Ingrese el nombre del negocio"
                        {...field}
                      />
                      <Building2
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={20}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="Provincia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provincia</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleProvinciaChange(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={field.value} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {provincias.map((obj, ind) => (
                        <SelectItem key={ind} value={obj.nombre}>
                          {obj.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="municipio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Municipio</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={municipios.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={field.value} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {municipios.map((municipio, index) => (
                        <SelectItem key={index} value={municipio}>
                          {municipio}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="moneda_default"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={field.value} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CUP">CUP - Peso Cubano</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="USD">
                        USD - Dolar Estadounidense
                      </SelectItem>
                      <SelectItem value="MLC">
                        MLC - Moneda Libremente Convertible
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="email"
                        placeholder="ejemplo@correo.com"
                        {...field}
                      />
                      <Mail
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={20}
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
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <PhoneInput
                      country={"cu"} // Puedes establecer un país por defecto (por ejemplo, "us" para Estados Unidos)
                      value={field.value}
                      onChange={field.onChange}
                      inputProps={{
                        name: "phone",
                        required: true,
                        autoFocus: true,
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Crear Cliente"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </main>
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
