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
import { MapPinned, MapPin } from "lucide-react";

/**
 * ConfiguracionState — selección de país / provincia / municipio + dirección
 * Props:
 *  - store:    objeto con la configuración actual
 *  - setStore: setter para actualizar store
 *  - country:  array de países [{ name, isoCode, ... }, ...]
 */
export default function ConfiguracionState({ store, setStore, country }) {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Fetch provincias cuando cambia el país
  useEffect(() => {
    if (!store?.country || !Array.isArray(country) || country.length === 0) {
      setStates([]);
      return;
    }
    const controller = new AbortController();
    async function fetchStates() {
      try {
        setLoadingStates(true);
        const countryObj = country.find((c) => c?.name === store.country);
        if (!countryObj?.isoCode) {
          setStates([]);
          setCities([]);
          setStore((prev) => ({ ...prev, Provincia: "", municipio: "" }));
          return;
        }
        const base = process.env.NEXT_PUBLIC_PATH ?? "";
        const resp = await fetch(
          `${base}/api/filter/state?country=${encodeURIComponent(countryObj.isoCode)}`,
          { signal: controller.signal },
        );
        if (!resp.ok) {
          setStates([]);
          return;
        }
        const data = await resp.json();
        setStates(Array.isArray(data) ? data : []);
        setStore((prev) => ({
          ...prev,
          Provincia:
            prev.Provincia || (Array.isArray(data) && data[0]?.name) || "",
        }));
      } catch (err) {
        if (err.name !== "AbortError")
          console.error("Error fetching states:", err);
      } finally {
        setLoadingStates(false);
      }
    }
    fetchStates();
    return () => controller.abort();
  }, [store?.country, country, setStore]);

  // Fetch ciudades cuando cambia la provincia
  useEffect(() => {
    if (
      !store?.country ||
      !store?.Provincia ||
      !Array.isArray(states) ||
      states.length === 0
    ) {
      setCities([]);
      return;
    }
    const controller = new AbortController();
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
        const resp = await fetch(
          `${base}/api/filter/city?country=${encodeURIComponent(countryObj.isoCode)}&state=${encodeURIComponent(stateObj.isoCode)}`,
          { signal: controller.signal },
        );
        if (!resp.ok) {
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
        if (err.name !== "AbortError")
          console.error("Error fetching cities:", err);
      } finally {
        setLoadingCities(false);
      }
    }
    fetchCities();
    return () => controller.abort();
  }, [store?.country, store?.Provincia, country, states, setStore]);

  // Resumen de ubicación actual (del log)
  const ubicacionActual = [store?.municipio, store?.Provincia, store?.country]
    .filter(Boolean)
    .join(", ");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <CardTitle>Ubicación</CardTitle>
        </div>
        <CardDescription>
          País, provincia y municipio del negocio
        </CardDescription>
        {/* Muestra la ubicación guardada actualmente */}
        {ubicacionActual && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5 mt-1 w-fit">
            <MapPinned className="w-3 h-3 shrink-0" />
            {ubicacionActual}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="country">País</Label>
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
            placeholder="Seleccione su país"
            status={store?.country}
            value="name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="province">Provincia / Estado</Label>
          <SelectStore
            array={states}
            onSelectChange={(value) =>
              setStore((prev) => ({ ...prev, Provincia: value, municipio: "" }))
            }
            placeholder="Seleccione su provincia"
            status={store?.Provincia}
            value="name"
            loading={loadingStates}
            disabled={!store?.country || states.length === 0}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Municipio / Ciudad</Label>
          <SelectStore
            array={cities}
            onSelectChange={(value) =>
              setStore((prev) => ({ ...prev, municipio: value }))
            }
            placeholder="Seleccione su municipio"
            status={store?.municipio}
            value="name"
            loading={loadingCities}
            disabled={
              !store?.country || !store?.Provincia || cities.length === 0
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Dirección</Label>
          <div className="flex items-center gap-2">
            <MapPinned className="w-4 h-4 text-muted-foreground shrink-0" />
            <InputStore
              name="Dirección"
              object={store}
              value={store?.direccion}
              action={setStore}
              type="text"
            />
          </div>
          {store?.ubicacion?.latitude && (
            <p className="text-xs text-muted-foreground">
              GPS: {store.ubicacion.latitude.toFixed(5)},{" "}
              {store.ubicacion.longitude.toFixed(5)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
