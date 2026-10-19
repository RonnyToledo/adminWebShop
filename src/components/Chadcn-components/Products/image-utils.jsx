"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { toast } from "sonner";

export const MAX_IMAGE_MB = 10;

// data: → archivo elegido desde el ordenador convertido a una URL de datos
const isLocalSrc = (src) => src.startsWith("blob:") || src.startsWith("data:");

// ── URL de datos para un File/Blob local ───────────────────────────────────
// FileReader evita problemas de ciclo de vida de URL.createObjectURL en SSR
// y durante los montajes dobles de React StrictMode.
export function useObjectUrl(file) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }

    if (typeof Blob === "undefined" || !(file instanceof Blob)) {
      setUrl(null);
      return;
    }

    const reader = new FileReader();
    let active = true;

    reader.onload = () => {
      if (active && typeof reader.result === "string") {
        setUrl(reader.result);
      }
    };
    reader.onerror = () => {
      if (!active) return;
      setUrl(null);
      toast.error("No se pudo mostrar la vista previa", {
        description: "El archivo seleccionado no es una imagen válida.",
      });
    };
    reader.readAsDataURL(file);

    return () => {
      active = false;
      reader.abort();
    };
  }, [file]);

  return url;
}

// ── Validación con feedback (toast) ────────────────────────────────────────
// Devuelve true si el archivo es válido; si no, avisa al usuario.
export function validateImageFile(file) {
  if (!file?.type?.startsWith("image/")) {
    toast.error("Archivo no válido", {
      description: "Solo se permiten imágenes (PNG, JPG, WEBP...).",
    });
    return false;
  }
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    toast.error("La imagen es demasiado pesada", {
      description: `El máximo es ${MAX_IMAGE_MB}MB y esta pesa ${(file.size / 1024 / 1024).toFixed(1)}MB.`,
    });
    return false;
  }
  return true;
}

// ── Imagen de producto ─────────────────────────────────────────────────────
// - Vista previa local (blob:/data:) → <img> nativo. next/image no puede
//   optimizar esas URLs (dependen del navegador, no del servidor), así que se
//   evita por completo.
// - URL remota → next/image, como antes.
// - Si la carga falla se muestra un placeholder (y un toast si era local).
// El padre debe ser `relative` con tamaño definido (ej. aspect-square).
function ProductImageInner({ src, alt, sizes, className = "object-cover" }) {
  const [failed, setFailed] = useState(false);
  const local = typeof src === "string" && isLocalSrc(src);

  const handleError = () => {
    setFailed(true);
    if (local) {
      toast.error("No se pudo mostrar la vista previa", {
        description:
          "El navegador no pudo leer ese archivo. Probá con otra imagen.",
      });
    }
  };

  if (failed) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-secondary text-muted-foreground">
        <ImageOff size={18} />
        <span className="text-[11px]">No se pudo cargar</span>
      </div>
    );
  }

  return local ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={handleError}
      className={`absolute inset-0 h-full w-full ${className}`}
    />
  ) : (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      onError={handleError}
      className={className}
    />
  );
}

// `key={src}` reinicia el estado de error cuando cambia la imagen.
export function ProductImage(props) {
  return <ProductImageInner key={props.src} {...props} />;
}
