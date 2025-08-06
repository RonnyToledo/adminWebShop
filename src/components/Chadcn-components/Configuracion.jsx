"use client";
import React from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import provinciasData from "@/components/json/Site.json";
import { useState, useEffect, useRef, useContext } from "react";
import ConfimationOut from "../globalFunction/confimationOut";
import { InputStore, SelectStore, SwitchStore } from "./Input-Store";
import {
  MapPin,
  Instagram,
  Phone,
  Mail,
  Building2,
  MapPinned,
  Wallet,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FromData } from "../globalFunction/fromData";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import ProfileHeader from "../profile-header";
import WeeklyAvailability from "../WeeklyAvailability";
import { Textarea } from "../ui/textarea";

export default function Configuracion({ ThemeContext }) {
  const provincias = provinciasData.provincias;
  const { toast } = useToast();
  const { webshop } = useContext(ThemeContext);
  const [newAregados, setNewAgregados] = useState({
    moneda: "",
    valor: 0,
  });
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
  }, [webshop]);

  function MonedaDefault(value) {
    const [h] = store?.moneda.filter((obj) => obj.moneda == value);
    setStore({
      ...store,
      moneda_default: h,
      moneda: store?.moneda.map((obj) => {
        return {
          ...obj,
          valor: redondearAMultiploDe5(obj.valor / h.valor),
        };
      }),
    });
  }
  function AddRate() {
    if (newAregados.moneda && newAregados.valor) {
      setStore({
        ...store,
        moneda: Array.from(new Set([...store?.moneda, newAregados])),
      });
      setNewAgregados({ moneda: "", valor: 0 });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Faltan datos",
      });
    }
  }

  return (
    <main className="container mx-auto my-8 px-4 sm:px-6 lg:px-8">
      <FromData store={store} ThemeContext={ThemeContext}>
        <Card>
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
                setStore({
                  ...object,
                  parrrafo: e.target.value,
                })
              }
            />
          </div>
          <div className="mx-6">
            <WeeklyAvailability
              horario={store?.horario || []}
              onHorarioChange={(horario) =>
                setStore({
                  ...object,
                  horario: horario,
                })
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
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>
                Set your business location and delivery area
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="province">Province</Label>
                <SelectStore
                  title={"Provincia"}
                  array={provincias}
                  icon={<Building2 className="w-4 h-4 mr-2" />}
                  onSelectChange={(value) => {
                    setStore({
                      ...store,
                      Provincia: value,
                      municipio: provincias.filter(
                        (env) => env.nombre == value
                      )[0]?.municipios[0],
                    });
                  }} // cambio aquí
                  placeholder={store?.Provincia}
                  value={"nombre"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="municipality">Municipality</Label>
                <SelectStore
                  title={"Municipio"}
                  disabled={store?.Provincia ? false : true}
                  array={
                    provincias.filter(
                      (env) => env.nombre == store?.Provincia
                    )[0]?.municipios
                  }
                  icon={<MapPin className="w-4 h-4 mr-2" />}
                  onSelectChange={(value) => {
                    setStore({
                      ...store,
                      municipio: value,
                      envios: value
                        ? provincias.filter(
                            (obj) => obj.nombre == store?.Provincia
                          )
                        : [{ nombre: "", municipios: [] }],
                    });
                  }}
                  placeholder={store?.municipio}
                  value={""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="flex items-center space-x-2">
                  <MapPinned className="w-4 h-4 text-muted-foreground" />
                  <InputStore
                    name={"Direccion"}
                    object={store}
                    value={store?.direccion}
                    action={setStore}
                    type={"text"}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
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
                    title={"Local de Trabajo"}
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
                    title={"Transferencias"}
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
                      title={"Permite Domicilio"}
                      funcion={setStore}
                    />
                  </div>
                  {store?.domicilio ? (
                    <div className="w-full flex justify-center max-h-max">
                      <Button type="link" variant="outline">
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

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultCurrency">Default Currency</Label>
                  <SelectStore
                    title={"Seleccione la moneda por defecto"}
                    array={store?.moneda}
                    icon={<Wallet className="w-4 h-4 mr-2" />}
                    onSelectChange={MonedaDefault} // cambio aquí
                    placeholder={store?.moneda_default.moneda}
                    value={"moneda"}
                  />
                  <p className="text-sm text-muted-foreground">
                    Select the default currency for your products
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {store?.moneda
                    .filter(
                      (obj) => obj.moneda !== store?.moneda_default.moneda
                    )
                    .map((obj, ind) => (
                      <div className="space-y-2" key={ind}>
                        <Label htmlFor="exchangeRateUSD">{`${obj.moneda} Rate`}</Label>
                        <div className="flex">
                          <Input
                            id="title"
                            name="title"
                            required
                            type="number"
                            value={obj.valor}
                            onChange={(e) => {
                              const h = store?.moneda.map((mon) =>
                                mon.moneda == obj.moneda
                                  ? {
                                      valor: Number(e.target.value),
                                      moneda: obj.moneda,
                                    }
                                  : mon
                              );
                              setStore({ ...store, moneda: h });
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.preventDefault();

                              setStore({
                                ...store,
                                moneda: store?.moneda.filter(
                                  (fil) => fil.moneda != obj.moneda
                                ),
                              });
                            }}
                          >
                            <TrashIcon className="h-5 w-5 text-red-700" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="m-1 p-1 col-span-2">
                        Agregar Moneda
                        <PlusIcon className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Agregar moneda</DialogTitle>
                        <DialogDescription></DialogDescription>
                      </DialogHeader>
                      <div className="space-x-6 flex flex-cols items-center justify-between mt-3">
                        <div>
                          <Label
                            htmlFor="new-subcategory"
                            className="text-base font-medium"
                          >
                            Moneda
                          </Label>
                          <Input
                            id="title"
                            name="title"
                            value={newAregados?.moneda}
                            type="text"
                            onChange={(e) =>
                              setNewAgregados({
                                ...newAregados,
                                moneda: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="new-subcategory"
                            className="text-base font-medium"
                          >
                            Tasa
                          </Label>
                          <Input
                            id="value"
                            name="value"
                            value={newAregados?.valor}
                            type="number"
                            onChange={(e) =>
                              setNewAgregados({
                                ...newAregados,
                                valor: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" onClick={AddRate}>
                          Save changes
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
