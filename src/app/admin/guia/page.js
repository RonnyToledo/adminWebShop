import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  Card,
} from "@/components/ui/card";
import React from "react";

export default function page() {
  return (
    <div className="grid min-h-screen w-full overflow-hidden ">
      <div className="flex flex-col w-full">
        <main className="flex flex-1 flex-col gap-8 p-6">
          <div className="grid gap-6">
            <div className="grid gap-2">
              <h1 className="text-2xl font-bold">Funcionalidades clave</h1>
              <p className="text-gray-500 dark:text-gray-400">
                Descubre cómo funcionan las principales funcionalidades de tu
                panel de administración.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Agregar/Eliminar categorías</CardTitle>
                  <CardDescription>
                    Organiza tus productos en categorías.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <h3 className="text-lg font-semibold">Pasos a seguir</h3>
                      <ul className="list-disc space-y-2 pl-6 text-gray-500 dark:text-gray-400">
                        <li>Crea nuevas categorías</li>
                        <li>Elimina las que no uses</li>
                        <li>Cada categoria dice los productos asignados</li>
                        <li>
                          Organiza el orden de las categorías tocando la
                          categoria, se dezplasa al final de la lista
                        </li>
                        <li>Guarda los cambios hechos antes de salir</li>
                      </ul>
                    </div>
                    <Link href="/admin/category">
                      <Button>Editar categorías</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Crear producto</CardTitle>
                  <CardDescription>
                    Aprende a crear nuevos productos en tu tienda.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <h3 className="text-lg font-semibold">Pasos a seguir</h3>
                      <ul className="list-disc space-y-2 pl-6 text-gray-500 dark:text-gray-400">
                        <li>Selecciona una imagen</li>
                        <li>Ingresa todos los campos q se te piden</li>
                        <li>Selecciona una categoria</li>
                        <li>Indique si es especial de la casa</li>
                        <li>
                          Seleccione si el producto tiene rebaja porcentual
                        </li>
                      </ul>
                    </div>
                    <Link href="/admin/newProduct">
                      <Button>Crear producto</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Editar producto</CardTitle>
                  <CardDescription>
                    Actualiza la información de tus productos existentes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <h3 className="text-lg font-semibold">Pasos a seguir</h3>
                      <ul className="list-disc space-y-2 pl-6 text-gray-500 dark:text-gray-400">
                        <li>Selecciona el producto a editar</li>
                        <li>
                          El icono de ojo refiere a q el producto sea visible
                          para los clientes
                        </li>
                        <li>
                          El icono de estrella refiere a q el producto es
                          especial de la casa
                        </li>
                        <li>
                          El icono de pantalla refiere a q el producto se
                          encuentra agotado
                        </li>
                        <li>Las imagenes no se editan</li>
                        <li>Actualiza la categoria del producto</li>
                      </ul>
                    </div>
                    <Link href="/admin/products">
                      <Button>Editar producto</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Editar perfil</CardTitle>
                  <CardDescription>
                    Personaliza tu perfil de administrador.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <h3 className="text-lg font-semibold">Pasos a seguir</h3>
                      <ul className="list-disc space-y-2 pl-6 text-gray-500 dark:text-gray-400">
                        <li>Actualiza tu información de negocio</li>
                        <li>Cambia el poster de Bienvenida</li>
                        <li>Selecciona los horarios de trabajo</li>
                      </ul>
                    </div>
                    <Link href="/admin/header">
                      <Button>Editar perfil</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Configurar perfil</CardTitle>
                  <CardDescription>
                    Personaliza tu perfil de administrador.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <h3 className="text-lg font-semibold">Pasos a seguir</h3>
                      <ul className="list-disc space-y-2 pl-6 text-gray-500 dark:text-gray-400">
                        <li>Actualiza tu numero de telefono</li>
                        <li>Rectifica tu email</li>
                        <li>Añade tu instagram de negocio</li>
                        <li>Indica la provincia sede de tu negocio</li>
                        <li>
                          Activa si tienes local de trabajo, si haces domicilio
                          y si aceptas turnos reservados
                        </li>
                        <li>
                          Indetifica que tipo de moneda es la q aceptas y los
                          cambios q tienes
                        </li>
                      </ul>
                    </div>
                    <Link href="/admin/configuracion">
                      <Button>Configurar perfil</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
