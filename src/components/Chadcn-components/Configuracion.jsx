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
  Roboto,
  Oswald,
  Inter,
  Open_Sans,
  Playfair_Display,
  Merriweather,
  Poppins,
  Montserrat,
  Lato,
  Sevillana,
} from "next/font/google";
import { FromData } from "../globalFunction/fromData";

const roboto = Roboto({ subsets: ["latin"], weight: "400" });
const oswald = Oswald({ subsets: ["latin"], weight: "700" });
const open_Sans = Open_Sans({ subsets: ["latin"], weight: "400" });
const playfair_Display = Playfair_Display({
  subsets: ["latin"],
  weight: "400",
});
const merriweather = Merriweather({ subsets: ["latin"], weight: "400" });
const inter = Inter({ subsets: ["latin"], weight: "400" });
const poppins = Poppins({ subsets: ["latin"], weight: "400" });
const montserrat = Montserrat({ subsets: ["latin"], weight: "400" });
const lato = Lato({ subsets: ["latin"], weight: "400" });
const sevillana = Sevillana({ subsets: ["latin"], weight: "400" });

const fonts = [
  { name: "Roboto", clase: roboto.className },
  { name: "Oswald", clase: oswald.className },
  { name: "Inter", clase: inter.className },
  { name: "Open_Sans", clase: open_Sans.className },
  { name: "Playfair_Display", clase: playfair_Display.className },
  { name: "Merriweather", clase: merriweather.className },
  { name: "Poppins", clase: poppins.className },
  { name: "Montserrat", clase: montserrat.className },
  { name: "Lato", clase: lato.className },
  { name: "Sevillana", clase: sevillana.className },
];

export default function Configuracion({ ThemeContext }) {
  const provincias = provinciasData.provincias;
  const { webshop } = useContext(ThemeContext);
  const [newAregados, setNewAgregados] = useState({
    moneda: "",
    valor: 0,
  });
  const newForm = useRef(null);
  const [store, setStore] = useState({
    comentario: [],
    categoria: [],
    moneda: [],
    moneda_default: {},
    horario: [],
    envios: [],
  });

  useEffect(() => {
    setStore(webshop.store);
  }, [webshop]);

  function MonedaDefault(value) {
    const [h] = store.moneda.filter((obj) => obj.moneda == value);
    setStore({
      ...store,
      moneda_default: h,
      moneda: store.moneda.map((obj) => {
        return {
          ...obj,
          valor: redondearAMultiploDe5(obj.valor / h.valor),
        };
      }),
    });
  }

  return (
    <main className="container mx-auto my-8 px-4 sm:px-6 lg:px-8">
      <FromData store={store} ThemeContext={ThemeContext}>
        <div className="border rounded-2x p-5">
          <InputStore
            name={"Tarjeta Bancaria"}
            object={store}
            value={"tarjeta"}
            action={setStore}
            type={"text"}
          />

          <p className="text-xs text-muted-foreground mt-1">
            *Comercio Electronico y pagos por transferenica Bancaria
          </p>
        </div>
        <div className="border rounded-2x p-5">
          <SelectStore
            title={"Fuente"}
            array={fonts}
            onSelectChange={(value) =>
              setStore({
                ...store,
                font: value,
              })
            }
            placeholder={store.font}
            value={"name"}
          />

          <p className="text-xs text-muted-foreground mt-1">
            *Seleccione una fuente
          </p>
        </div>
        <div className="border rounded-2x p-5">
          <InputStore
            name={"Numero de telefono"}
            object={store}
            value={"cell"}
            action={setStore}
            type={"number"}
          />
          <InputStore
            name={"Email"}
            object={store}
            value={"email"}
            action={setStore}
            type={"email"}
          />
        </div>
        <div className="border rounded-2x p-5">
          <SelectStore
            title={"Provincia"}
            array={provincias}
            onSelectChange={(value) => {
              setStore({
                ...store,
                Provincia: value,
                municipio: provincias.filter((env) => env.nombre == value)[0]
                  ?.municipios[0],
              });
            }} // cambio aquí
            placeholder={store.Provincia}
            value={"nombre"}
          />
          <SelectStore
            title={"Municipio"}
            array={
              provincias.filter((env) => env.nombre == store.Provincia)[0]
                ?.municipios
            }
            onSelectChange={(value) => {
              setStore({
                ...store,
                municipio: value,
                envios: value
                  ? provincias.filter((obj) => obj.nombre == store.Provincia)
                  : [{ nombre: "", municipios: [] }],
              });
            }} // cambio aquí
            placeholder={store.municipio}
            value={""}
          />
          <InputStore
            name={"Direccion"}
            object={store}
            value={"direccion"}
            action={setStore}
            type={"text"}
          />
          <p className="text-xs text-muted-foreground mt-1">
            *Seleccione su ubicacion
          </p>
        </div>
        <div className="border rounded-2x p-5">
          <InputStore
            name={"Instagram"}
            object={store}
            value={"insta"}
            action={setStore}
            type={"text"}
          />

          <p className="text-xs text-muted-foreground mt-1">
            *URL de su cuenta Ej: https://www.instagram.com/r-and-h.menu
          </p>
        </div>
        <div className="border rounded-2x p-5">
          <SwitchStore
            name={"local"}
            object={store}
            title={"Local de Trabajo"}
            funcion={setStore}
          />

          <p className="text-xs text-muted-foreground mt-1">
            *Indique si dispone de un local para recibir personal
          </p>
        </div>
        <div className="border rounded-2x p-5">
          <SwitchStore
            name={"act_tf"}
            object={store}
            title={"Transferencias"}
            funcion={setStore}
          />

          <p className="text-xs text-muted-foreground mt-1">
            *Va a estar recibiendo transferencias bancarias
          </p>
        </div>
        <div className="border rounded-2x p-5">
          <div className="  flex justify-between">
            <SwitchStore
              name={"domicilio"}
              object={store}
              title={"Permite Domicilio"}
              funcion={setStore}
            />
            {store.domicilio ? (
              <div className="max-w-max max-h-max">
                <Link
                  className={`border p-1 text-center`}
                  href={`/admin/configuracion/domicilios`}
                >
                  Definir Domicilios
                </Link>
              </div>
            ) : (
              <></>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            *Guarde los cambios antes de ajustar los domicilio
          </p>
        </div>
        <div className="border rounded-2x p-5">
          <SwitchStore
            name={"reservas"}
            object={store}
            title={"Permite Reservaciones"}
            funcion={setStore}
          />
          <p className="text-xs text-muted-foreground mt-1">
            *Indique si los clientes le pueden enviar reservacion
          </p>
        </div>
        <div className="border rounded-2x p-5">
          <SelectStore
            title={"Seleccione la moneda por defecto"}
            array={store.moneda}
            onSelectChange={MonedaDefault} // cambio aquí
            placeholder={store.moneda_default.moneda}
            value={"moneda"}
          />

          <p className="text-xs text-muted-foreground mt-1">
            *Seleccione la moneda de venta de sus productos
          </p>
        </div>
        <div className="border rounded-lg p-5">
          <Label htmlFor="current" className="text-lg">
            Precio de cambio
          </Label>
          {store.moneda
            .filter((obj) => obj.moneda !== store.moneda_default.moneda)
            .map((obj, ind) => (
              <div key={ind} className="space-y-3">
                <Label htmlFor="currency-1" className="mr-2">
                  {obj.moneda}
                </Label>
                <div className="grid grid-cols-4">
                  <Input
                    id="currency-1"
                    className="col-span-3"
                    type="number"
                    value={obj.valor}
                    onChange={(e) => {
                      const h = store.moneda;
                      h[ind] = {
                        valor: Number(e.target.value),
                        moneda: obj.moneda,
                      };
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
                        moneda: store.moneda.filter(
                          (fil) => fil.moneda != obj.moneda
                        ),
                      });
                    }}
                  >
                    <TrashIcon className="h-5 w-5" />
                    <span className="sr-only">Eliminar </span>
                  </Button>
                </div>
              </div>
            ))}
          <form
            ref={newForm}
            className="space-x-6 flex flex-cols items-center justify-between mt-3"
          >
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
                required
                value={newAregados.moneda}
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
                required
                value={newAregados.valor}
                type="number"
                onChange={(e) =>
                  setNewAgregados({
                    ...newAregados,
                    valor: e.target.value,
                  })
                }
              />
            </div>
            <Button
              variant="outline m-1 p-1"
              className="w-16"
              onClick={(e) => {
                e.preventDefault();
                setStore({
                  ...store,
                  moneda: Array.from(new Set([...store?.moneda, newAregados])),
                });
                setNewAgregados({ moneda: "", valor: 0 });
              }}
            >
              <PlusIcon className="h-5 w-5" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-1">
            *Elija el cambio al q recibe las diferentes monedas, para
            desactivarlas, darle valor de 0
          </p>
        </div>
      </FromData>
      <ConfimationOut action={hasPendingChanges(store, webshop.store)} />
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
