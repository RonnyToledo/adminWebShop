"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ImagePlus, Upload } from "lucide-react";
import { ImageUploadWithProps } from "../../component/ImageDND";
import { ImageUpload } from "./image-upload";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Crea y libera el blob URL (antes se creaba uno nuevo en cada render).
function useObjectUrl(file) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}

// Card individual "pieza" (logo o banner) con el tema de UploadFrame:
// eyebrow + título, badge de proporción, marco punteado con ícono/preview,
// y footer con el detalle recomendado.
function UploadPiece({
  campo,
  setStore,
  previewSrc,
  eyebrow,
  title,
  ratio,
  placeholderText,
  footerDetail,
  square = false,
}) {
  return (
    <ImageUploadWithProps setImageNew={setStore} campo={campo}>
      <div
        className={`rounded-2xl border border-border bg-card overflow-hidden ${square ? "w-full max-w-[16rem]" : ""}`}
      >
        <div className="flex items-start justify-between px-4 pt-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {eyebrow}
            </p>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          </div>
          <span className="text-[11px] text-muted-foreground border border-border rounded-full px-2 py-0.5 shrink-0">
            {ratio}
          </span>
        </div>

        <div
          className={`group relative mx-4 mt-3 mb-3 overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-colors ${
            square ? "aspect-square" : "aspect-[3/1]"
          }`}
        >
          {previewSrc ? (
            <Image
              src={previewSrc}
              alt={`Vista previa de ${title.toLowerCase()}`}
              fill
              className="object-cover "
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center px-4">
              <span className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground">
                <ImagePlus size={18} strokeWidth={1.5} />
              </span>
              <strong className="text-xs font-medium text-foreground">
                Arrastra o selecciona
              </strong>
              <small className="text-[11px] text-muted-foreground">
                {placeholderText}
              </small>
            </div>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute bottom-2 right-2 rounded-full bg-black/50 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                  <ImageUpload
                    onImageSelect={(file) =>
                      setStore((prev) => ({ ...prev, [campo]: file }))
                    }
                    variant="cover"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cambiar {title.toLowerCase()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center pointer-events-none">
            <Upload size={12} />
          </span>
        </div>

        <div className="flex items-center justify-between px-4 pb-3 text-[11px] text-muted-foreground border-t border-border/60 pt-2">
          <span>Área recomendada</span>
          <span className="font-medium">{footerDetail}</span>
        </div>
      </div>
    </ImageUploadWithProps>
  );
}

export default function ProfileHeader({ store, setStore }) {
  const bannerSrc = useObjectUrl(store?.bannerNew) ?? (store?.banner || null);
  const avatarSrc =
    useObjectUrl(store?.urlPosterNew) ?? (store?.urlPoster || null);

  return (
    <div className="w-full mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-[14rem_minmax(0,1fr)] items-start gap-4">
        <UploadPiece
          campo="urlPosterNew"
          setStore={setStore}
          previewSrc={avatarSrc}
          eyebrow="Identidad"
          title="Logo principal"
          ratio="1:1"
          placeholderText="Cuadrado · 400 × 400 px"
          footerDetail="PNG · fondo transparente"
          square
        />
        <UploadPiece
          campo="bannerNew"
          setStore={setStore}
          previewSrc={bannerSrc}
          eyebrow="Presencia"
          title="Banner de portada"
          ratio="3:1"
          placeholderText="Horizontal · 1200 × 400 px"
          footerDetail="JPG / PNG · alta resolución"
        />
      </div>
    </div>
  );
}
