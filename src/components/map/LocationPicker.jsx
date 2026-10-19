"use client";

import { useRef, useState } from "react";
import Map, { Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { LocateFixed, Loader2, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";
const MAP_WORKER_URL = "/maplibre/maplibre-gl-worker.mjs";
const DEFAULT_CENTER = { latitude: 21.8, longitude: -79.5 };

export default function LocationPicker({ value, onChange }) {
  const mapRef = useRef(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const latitude = Number.isFinite(value?.latitude) ? value.latitude : null;
  const longitude = Number.isFinite(value?.longitude) ? value.longitude : null;
  const hasLocation = latitude !== null && longitude !== null;

  function updateLocation(next, zoom = 16) {
    setLocationError("");
    onChange(next);
    mapRef.current?.flyTo({
      center: [next.longitude, next.latitude],
      zoom,
      duration: 650,
    });
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationError("Este navegador no permite obtener la ubicación.");
      return;
    }

    setLocationError("");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        updateLocation(
          { latitude: coords.latitude, longitude: coords.longitude },
          16,
        );
      },
      (error) => {
        setLocating(false);
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? "Permite el acceso a la ubicación en tu navegador e inténtalo de nuevo."
            : error.code === error.TIMEOUT
              ? "La solicitud de ubicación tardó demasiado. Inténtalo de nuevo."
              : "No se pudo obtener la ubicación actual.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative h-64 overflow-hidden rounded-lg border border-border">
        <Map
          ref={mapRef}
          initialViewState={{
            latitude: latitude ?? DEFAULT_CENTER.latitude,
            longitude: longitude ?? DEFAULT_CENTER.longitude,
            zoom: hasLocation ? 15 : 5.5,
          }}
          mapStyle={MAP_STYLE}
          workerUrl={MAP_WORKER_URL}
          dragRotate={false}
          attributionControl={{ compact: true }}
          style={{ width: "100%", height: "100%" }}
          onClick={({ lngLat }) =>
            updateLocation({ latitude: lngLat.lat, longitude: lngLat.lng })
          }
        >
          {hasLocation && (
            <Marker
              latitude={latitude}
              longitude={longitude}
              anchor="bottom"
              draggable
              onDragEnd={({ lngLat }) =>
                onChange({ latitude: lngLat.lat, longitude: lngLat.lng })
              }
            >
              <MapPin className="size-9 fill-primary text-primary drop-shadow-md" />
            </Marker>
          )}
        </Map>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Usar mi ubicación actual"
          title="Usar mi ubicación actual"
          disabled={locating}
          onClick={useCurrentLocation}
          className="absolute bottom-3 right-3 z-10 bg-background/95 shadow-sm"
        >
          {locating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LocateFixed className="size-4" />
          )}
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {hasLocation
            ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            : "Haz clic en el mapa para marcar la ubicación"}
        </span>
        {hasLocation && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
            className="h-7 px-2 text-muted-foreground"
          >
            <Trash2 className="mr-1.5 size-3.5" />
            Quitar ubicación
          </Button>
        )}
      </div>
      {locationError && (
        <p role="status" className="text-xs text-destructive">
          {locationError}
        </p>
      )}
    </div>
  );
}
