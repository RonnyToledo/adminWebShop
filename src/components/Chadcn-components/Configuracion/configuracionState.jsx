"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SelectStore, InputStore } from "./Input-Store";
import { MapPinned } from "lucide-react";

/**
 * ConfiguracionState - componente para seleccionar país / provincia / municipio
 * Props:
 *  - store: objeto con la configuración actual
 *  - setStore: setter (función) para actualizar store
 *  - country: array de países [{ name, isoCode, ... }, ...]
 */
export default function ConfiguracionState({ store, setStore, country }) {
  const [states, setStates] = useState([]); // antes: state
  const [cities, setCities] = useState([]); // antes: city
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Fetch de provincias/estados cuando cambia el país seleccionado
  useEffect(() => {
    if (!store?.country || !Array.isArray(country) || country.length === 0) {
      setStates([]);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    async function fetchStates() {
      try {
        setLoadingStates(true);

        const countryObj = country.find((c) => c?.name === store.country);
        if (!countryObj?.isoCode) {
          setStates([]);
          setCities([]);
          // opcional: limpiar la provincia y municipio si país inválido
          setStore((prev) => ({ ...prev, Provincia: "", municipio: "" }));
          return;
        }

        const base = process.env.NEXT_PUBLIC_PATH ?? ""; // si usas un prefijo, ok; si no, queda ""
        const url = `${base}/api/filter/state?country=${encodeURIComponent(
          countryObj.isoCode
        )}`;

        const resp = await fetch(url, { signal });
        if (!resp.ok) {
          console.error("fetch states failed", resp.status);
          setStates([]);
          return;
        }

        const data = await resp.json();
        setStates(Array.isArray(data) ? data : []);

        // Si no hay valor de Provincia en store, asigno el primero de la lista (si existe)
        setStore((prev) => ({
          ...prev,
          Provincia:
            prev.Provincia || (Array.isArray(data) && data[0]?.name) || "",
          // no tocamos municipio aquí; lo dejamos como está o ya vacío si cambiaste país
        }));
      } catch (err) {
        if (err.name === "AbortError") {
          // fetch cancelado, no hacer nada
        } else {
          console.error("Error fetching states:", err);
        }
      } finally {
        setLoadingStates(false);
      }
    }

    fetchStates();

    return () => {
      controller.abort();
    };
  }, [store?.country, country, setStore]);

  // Fetch de ciudades cuando cambia la provincia/estado o el país
  useEffect(() => {
    if (
      !store?.country ||
      !store?.Provincia ||
      !Array.isArray(country) ||
      country.length === 0 ||
      !Array.isArray(states) ||
      states.length === 0
    ) {
      setCities([]);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    async function fetchCities() {
      try {
        setLoadingCities(true);

        const countryObj = country.find((c) => c?.name === store.country);
        const stateObj = states.find((s) => s?.name === store.Provincia);

        if (!countryObj?.isoCode || !stateObj?.isoCode) {
          setCities([]);
          setStore((prev) => ({ ...prev, municipio: "" }));
          return;
        }

        const base = process.env.NEXT_PUBLIC_PATH ?? "";
        const url = `${base}/api/filter/city?country=${encodeURIComponent(
          countryObj.isoCode
        )}&state=${encodeURIComponent(stateObj.isoCode)}`;

        const resp = await fetch(url, { signal });
        if (!resp.ok) {
          console.error("fetch cities failed", resp.status);
          setCities([]);
          return;
        }

        const data = await resp.json();
        setCities(Array.isArray(data) ? data : []);

        setStore((prev) => ({
          ...prev,
          municipio: prev.municipio || (Array.isArray(data) && data[0]) || "",
        }));
      } catch (err) {
        if (err.name === "AbortError") {
          // ignore
        } else {
          console.error("Error fetching cities:", err);
        }
      } finally {
        setLoadingCities(false);
      }
    }

    fetchCities();

    return () => {
      controller.abort();
    };
  }, [store?.country, store?.Provincia, country, states, setStore]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location</CardTitle>
        <CardDescription>
          Set your business location and delivery area
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <SelectStore
            array={country}
            onSelectChange={(value) =>
              setStore((prev) => ({
                ...prev,
                country: value,
                Provincia: "",
                municipio: "",
              }))
            }
            placeholder={"Seleccione su pais"}
            status={store?.country}
            value={"name"}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="province">Estado</Label>
          <SelectStore
            array={states}
            onSelectChange={(value) =>
              setStore((prev) => ({ ...prev, Provincia: value, municipio: "" }))
            }
            placeholder={"Seleccione su provincia"}
            status={store?.Provincia}
            value={"name"}
            loading={loadingStates}
            disabled={!store?.country || states.length === 0}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Ciudad</Label>
          <SelectStore
            array={cities}
            onSelectChange={(value) =>
              setStore((prev) => ({ ...prev, municipio: value }))
            }
            placeholder={"Seleccione su municipio"}
            status={store?.municipio}
            value={"name"}
            loading={loadingCities}
            disabled={
              !store?.country || !store?.Provincia || cities.length === 0
            }
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
  );
}
