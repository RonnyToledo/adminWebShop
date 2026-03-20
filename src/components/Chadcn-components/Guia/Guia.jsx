"use client";
import Link from "next/link";
import React, { useContext } from "react";
import { sileo } from "sileo";
import QrCode from "@/components/Chadcn-components/Guia/QRcode";
import { ThemeContext } from "@/context/useContext";
import { Copy, ArrowRight, ExternalLink } from "lucide-react";
import dataCards from "@/components/json/card.json";

// ─── GuideCard ────────────────────────────────────────────────────────────────
const GuideCard = ({ title, description, steps, link, buttonText }) => (
  <div className="bg-background border border-border rounded-xl p-5 flex flex-col gap-4 hover:border-primary/30 transition-colors">
    <div>
      <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>

    {steps?.length > 0 && (
      <div className="space-y-2">
        <p className="text-[11px] text-muted-foreground uppercase tracking-[0.1em] font-medium">
          Pasos
        </p>
        <ol className="space-y-1.5">
          {steps.map((step, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-xs text-muted-foreground"
            >
              <span className="text-[10px] font-mono text-primary/70 bg-primary/10 rounded px-1.5 py-0.5 shrink-0 mt-0.5 leading-tight">
                {String(i + 1).padStart(2, "0")}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    )}

    {link && (
      <Link
        href={link}
        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mt-auto pt-1 border-t border-border"
      >
        {buttonText}
        <ArrowRight size={11} />
      </Link>
    )}
  </div>
);

// ─── Guia ─────────────────────────────────────────────────────────────────────
export default function Guia() {
  const { webshop } = useContext(ThemeContext);
  const storeUrl = `https://roumenu.vercel.app/t/${webshop?.store?.sitioweb}`;

  const copyToClipboard = (text) => {
    if (navigator?.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => sileo.info({ title: "URL copiada al portapapeles" }))
        .catch((err) =>
          sileo.error({ title: "Error al copiar", description: err.message }),
        );
    }
  };

  return (
    <div className="p-6 space-y-10 max-w-5xl mx-auto">
      {/* ── Sección URL / QR ───────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <p className="text-[11px] text-primary uppercase tracking-[0.18em] font-medium mb-1">
            Tu tienda online
          </p>
          <h1 className="text-2xl font-normal text-foreground italic">
            Sitio web
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* URL card */}
          <div className="bg-secondary/40 border border-border rounded-xl p-5 space-y-4">
            <p className="text-xs text-muted-foreground">
              Comparte este enlace con tus clientes
            </p>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-background border border-border rounded-xl px-4 py-3 overflow-hidden">
                <p className="text-sm font-mono text-foreground truncate">
                  {storeUrl}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(storeUrl)}
                className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors shrink-0"
                title="Copiar URL"
              >
                <Copy size={14} />
              </button>
              <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors shrink-0"
                title="Abrir tienda"
              >
                <ExternalLink size={14} />
              </a>
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-[11px] text-muted-foreground">
                Tienda:{" "}
                <span className="font-medium text-foreground">
                  {webshop?.store?.name ?? "—"}
                </span>
              </p>
            </div>
          </div>

          {/* QR card */}
          <div className="bg-secondary/40 border border-border rounded-xl p-5 flex flex-col items-center justify-center gap-3">
            <p className="text-xs text-muted-foreground text-center">
              Código QR — escanea para acceder
            </p>
            <QrCode
              value2={webshop?.store?.sitioweb}
              name={webshop?.store?.name}
            />
          </div>
        </div>
      </section>

      {/* ── Sección funcionalidades ─────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <p className="text-[11px] text-primary uppercase tracking-[0.18em] font-medium mb-1">
            Documentación
          </p>
          <h2 className="text-2xl font-normal text-foreground italic">
            Funcionalidades clave
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Descubre cómo funcionan las principales herramientas de tu panel de
            administración.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {dataCards.map((card, i) => (
            <GuideCard key={i} {...card} />
          ))}
        </div>
      </section>
    </div>
  );
}
