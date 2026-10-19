"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CARD_CLASS, CardHeading } from "./section-primitives";
import { Label } from "@/components/ui/label";
import { SelectStore, InputStore } from "./Input-Store";
import { MapPinned, MapPin } from "lucide-react";
import { resolveByCodeOrName } from "@/utils/resolveLocation";
import LocationPicker from "@/components/map/LocationPicker";

const getCountryIso = (c) => c?.isoCode ?? c?.countryCode ?? c?.code ?? "";
const getRegionIso = (s) => s?.isoCode ?? s?.code ?? "";
const getLabel = (obj) => obj?.name ?? obj?.label ?? "";

const canonicalize = (value) => {
  const raw = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .trim()
    .toLowerCase();

  if (!raw) return "";
  if (/^\d+$/.test(raw)) return String(Number(raw));
  return raw;
};

const matchesLocationValue = (actual, expected) => {
  const left = canonicalize(actual);
  const right = canonicalize(expected);
  return !!left && !!right && left === right;
};

export default function ConfiguracionState({ store, setStore, country }) {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const selectedCountry = useMemo(() => {
    return (
      resolveByCodeOrName(country, store?.regions?.country_code, {
        getCode: getCountryIso,
        getName: getLabel,
      }) ??
      resolveByCodeOrName(country, store?.country, {
        getCode: getCountryIso,
        getName: getLabel,
      })
    );
  }, [country, store?.regions?.country_code, store?.country]);

  const selectedCountryIso = getCountryIso(selectedCountry); // ya no hardcodees "CU"
  const selectedCountryLabel = selectedCountry?.name || store?.country || "";

  const regionCode = store?.regions?.region_code ?? store?.region ?? "";
  const selectedState = useMemo(() => {
    return (
      resolveByCodeOrName(states, store?.regions?.region_code, {
        getCode: getRegionIso,
        getName: getLabel,
      }) ??
      resolveByCodeOrName(states, store?.region, {
        getCode: getRegionIso,
        getName: getLabel,
      })
    );
  }, [states, store?.regions?.region_code, store?.region]);

  const provinciaLabel = selectedState?.name || store?.region || "";

  // ── NUEVO: auto-sanar el shape viejo (country/region como nombre) ──────────
  useEffect(() => {
    if (!selectedCountry || store?.regions?.country_code) return;
    setStore((prev) => ({
      ...prev,
      regions: {
        ...(prev.regions || {}),
        country_code: getCountryIso(selectedCountry),
        // FIX: heredar el region_code legacy (prev.region) cuando regions.region_code
        // todavía no existe. Antes esto quedaba en "" y rompía el fetch de estados
        // en el primer render tras un reload (donde solo llega prev.region).
        region_code: prev.regions?.region_code ?? prev.region ?? "",
      },
    }));
  }, [selectedCountry, store?.regions?.country_code, setStore]);

  // Provincias / estados cuando cambia el país
  useEffect(() => {
    if (
      !selectedCountryIso ||
      !Array.isArray(country) ||
      country.length === 0
    ) {
      setStates([]);
      setCities([]);
      return;
    }

    const controller = new AbortController();

    async function fetchStates() {
      try {
        setLoadingStates(true);

        const base = process.env.NEXT_PUBLIC_PATH ?? "";
        const resp = await fetch(
          `${base}/api/filter/state?country=${encodeURIComponent(selectedCountryIso)}`,
          { signal: controller.signal },
        );

        if (!resp.ok) {
          setStates([]);
          return;
        }

        const data = await resp.json();
        const list = Array.isArray(data) ? data : [];

        setStates(list);

        setStore((prev) => {
          const savedRegionCode =
            prev.regions?.region_code ?? prev.region ?? "";
          const match = resolveByCodeOrName(list, savedRegionCode, {
            getCode: getRegionIso,
            getName: getLabel,
          });

          const resolvedCode = match
            ? getRegionIso(match)
            : savedRegionCode || "";

          return {
            ...prev,
            country: selectedCountry?.name ?? prev.country ?? "",
            region: resolvedCode,
            regions: {
              ...(prev.regions || {}),
              country_code: selectedCountryIso,
              region_code: resolvedCode,
            },
            municipio: prev.municipio,
          };
        });
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.error("Error fetching states:", err);
        }
      } finally {
        setLoadingStates(false);
      }
    }

    fetchStates();
    return () => controller.abort();
  }, [selectedCountry?.name, selectedCountryIso, country, setStore]);

  // Municipios / ciudades cuando cambia la provincia
  useEffect(() => {
    if (
      !selectedCountryIso ||
      !regionCode ||
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

        const stateObj = states.find((s) =>
          matchesLocationValue(getRegionIso(s), regionCode),
        );
        if (!stateObj) {
          setCities([]);
          setStore((prev) => ({ ...prev, municipio: "" }));
          return;
        }

        const base = process.env.NEXT_PUBLIC_PATH ?? "";
        const url = `${base}/api/filter/city?country=${encodeURIComponent(
          selectedCountryIso,
        )}&state=${encodeURIComponent(getRegionIso(stateObj))}`;

        const resp = await fetch(url, { signal: controller.signal });
        if (!resp.ok) {
          setCities([]);
          return;
        }

        const data = await resp.json();
        const list = Array.isArray(data) ? data : [];

        setCities(list);
        setStore((prev) => ({
          ...prev,
          municipio: prev.municipio || list[0]?.name || "",
        }));
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.error("Error fetching cities:", err);
        }
      } finally {
        setLoadingCities(false);
      }
    }

    fetchCities();
    return () => controller.abort();
  }, [selectedCountryIso, regionCode, states, setStore]);

  const ubicacionActual = [
    store?.municipio,
    selectedState?.name,
    selectedCountry?.name,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Card className={CARD_CLASS}>
      <CardHeading
        icon={MapPin}
        title="Ubicación"
        description="País, provincia y municipio del negocio"
      >
        {ubicacionActual && (
          <div className="mt-1 flex w-fit items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground">
            <MapPinned className="h-3 w-3 shrink-0" />
            {ubicacionActual}
          </div>
        )}
      </CardHeading>

      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="country">País</Label>
            <SelectStore
              array={country}
              onSelectChange={(value) =>
                setStore((prev) => ({
                  ...prev,
                  regions: {
                    ...(prev.regions || {}),
                    country_code: value,
                    region_code: "",
                  },
                  country:
                    country.find((item) => getCountryIso(item) === value)
                      ?.name ?? "",
                  region: "",
                  municipio: "",
                }))
              }
              placeholder="Seleccione su país"
              status={selectedCountryLabel}
              value="isoCode"
              show="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="province">Provincia / Estado</Label>
            <SelectStore
              array={states}
              onSelectChange={(value) =>
                setStore((prev) => ({
                  ...prev,
                  regions: {
                    ...(prev.regions || {}),

                    region_code: value,
                  },
                  region: value,
                  municipio: "",
                }))
              }
              placeholder="Seleccione su provincia"
              status={provinciaLabel}
              value="isoCode"
              show="name"
              loading={loadingStates}
              disabled={!selectedCountryIso || states.length === 0}
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
              show="name"
              loading={loadingCities}
              disabled={
                !selectedCountryIso || !regionCode || cities.length === 0
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <div className="flex items-center gap-2">
              <MapPinned className="w-4 h-4 text-muted-foreground shrink-0" />
              <InputStore
                name="address"
                object={store}
                value="direccion"
                action={setStore}
                type="text"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="block">Ubicación en el mapa</Label>
          <LocationPicker
            value={store?.ubicacion ?? null}
            onChange={(ubicacion) =>
              setStore((prev) => ({ ...prev, ubicacion }))
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
