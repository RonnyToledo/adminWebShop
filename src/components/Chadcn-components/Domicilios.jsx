"use client";
import React from "react";
import {
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectContent,
  Select,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "../ui/input";
import { useState, useEffect, useContext } from "react";
import provinciasData from "@/components/json/Site.json";
import { FromData } from "../globalFunction/fromData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Domicilios({ ThemeContext }) {
  const provincias = provinciasData.provincias;
  const { webshop } = useContext(ThemeContext);

  const [store, setStore] = useState({
    comentario: [],
    categoria: [],
    moneda: [],
    moneda_default: {},
    horario: [],
    envios: [],
  });

  useEffect(() => {
    setStore(webshop?.store);
  }, [webshop.store]);

  return (
    <main className="container mx-auto my-8 px-4 sm:px-6 lg:px-8">
      <FromData store={store} ThemeContext={ThemeContext}>
        <div className="mb-5 space-y-4">
          {store?.domicilio &&
            provincias.filter(
              (bbb) =>
                !store?.envios.map((ccc) => ccc.nombre).includes(bbb.nombre)
            ).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Provincias y Municipios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="select-provincia">
                        Seleccionar Provincia
                      </Label>
                      <Select
                        onValueChange={(value) => {
                          const [a] = provincias.filter(
                            (aaa) => value == aaa.nombre
                          );
                          setStore({
                            ...store,
                            envios: [...store?.envios, a],
                          });
                        }}
                      >
                        <SelectTrigger id="select-provincia">
                          <SelectValue placeholder="Selecciona una provincia" />
                        </SelectTrigger>
                        <SelectContent>
                          {provincias
                            .filter(
                              (bbb) =>
                                !store?.envios
                                  .map((ccc) => ccc.nombre)
                                  .includes(bbb.nombre)
                            )
                            .map((ddd, index3) => (
                              <SelectItem key={index3} value={ddd.nombre}>
                                {ddd.nombre}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {store?.envios.map((obj, ind) => (
              <Card key={ind} className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-bold">
                    {obj.nombre}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();

                      setStore({
                        ...store,
                        envios: store?.envios.filter(
                          (fil) => fil.nombre != obj.nombre
                        ),
                      });
                    }}
                    aria-label={`Eliminar provincia ${obj.nombre}`}
                    className="text-red-700"
                  >
                    <TrashIcon className="h-4 w-4 text-red-700" />
                  </Button>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="grid grid-cols-5 gap-2  p-2">
                    <h3 className="text-lg font-semibold mb-2 col-span-2">
                      Municipios
                    </h3>
                    <h3 className="text-lg font-semibold mb-2 col-span-2">
                      Envio ($)
                    </h3>
                  </div>
                  {obj.municipios.length > 0 ? (
                    <ul className="space-y-2 ">
                      {obj.municipios.map((obj1, index) => (
                        <li
                          key={index}
                          className="grid grid-cols-5 gap-2 bg-secondary rounded-md p-2 "
                        >
                          <span className="col-span-2 line-clamp-2">
                            {obj1.name}
                          </span>
                          <Input
                            className="col-span-2"
                            value={obj1.price}
                            type="number"
                            onChange={(e) => {
                              const a = store?.envios[ind].municipios.find(
                                (fil) => fil.name != obj1.name
                              );
                              setStore({
                                ...store,
                                envios: store?.envios.map((env) =>
                                  env.nombre === obj.nombre
                                    ? {
                                        ...env,
                                        municipios: env.municipios.map((muni) =>
                                          muni.name == obj1.name
                                            ? { ...muni, price: e.target.value }
                                            : muni
                                        ),
                                      }
                                    : env
                                ),
                              });
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.preventDefault();
                              const a = store?.envios[ind].municipios.filter(
                                (fil) => fil.name != obj1.name
                              );

                              setStore({
                                ...store,
                                envios: store?.envios.map((env) =>
                                  env.nombre === obj.nombre
                                    ? {
                                        ...env,
                                        municipios: env.municipios.map((muni) =>
                                          muni.name == obj1.name
                                            ? { ...muni, name: a }
                                            : muni
                                        ),
                                      }
                                    : env
                                ),
                              });
                            }}
                            aria-label={`Eliminar municipio ${obj1}`}
                            className="text-red-700"
                          >
                            <TrashIcon className="h-4 w-4 text-red-700" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">
                      No hay municipios agregados.
                    </p>
                  )}
                  {provincias
                    .filter((env) => env.nombre == obj.nombre)[0]
                    .municipios.filter(
                      (elemento) =>
                        !obj.municipios
                          .map((obj) => obj.name)
                          .includes(elemento)
                    ).length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="select-municipio">
                        Seleccionar Municipio
                      </Label>
                      <Select
                        onValueChange={(value) => {
                          const a = [...obj.municipios, value];
                          setStore({
                            ...store,
                            envios: store?.envios.map((env) =>
                              env.nombre === obj.nombre
                                ? { ...env, municipios: a }
                                : env
                            ),
                          });
                        }}
                      >
                        <SelectTrigger id="select-municipio">
                          <SelectValue placeholder="Selecciona un municipio" />
                        </SelectTrigger>
                        <SelectContent>
                          {provincias
                            .filter((env) => env.nombre == obj.nombre)[0]
                            .municipios.filter(
                              (elemento) => !obj.municipios.includes(elemento)
                            )
                            .map((mun, index2) => (
                              <SelectItem value={mun} key={index2}>
                                {mun}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </FromData>
    </main>
  );
}

function ArrowLeftIcon(props) {
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
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
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

function XIcon(props) {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
