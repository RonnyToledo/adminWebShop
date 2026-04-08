// components/PlanGuard.jsx
// ─── Bloquea acceso a features según el plan activo ──────────────────────────
// Uso:
//   <PlanGuard feature="marketing">
//     <MarketingPage />
//   </PlanGuard>
//
//   <PlanGuard feature="productos" requirePro>
//     <BulkImport />
//   </PlanGuard>

"use client";
import { usePlan } from "@/hooks/usePlan";
import { Lock, Crown, ArrowRight } from "lucide-react";
import Link from "next/link";

const FEATURE_LABELS = {
  marketing: "Marketing y descuentos",
  stocks: "Control de stock",
  domicilio: "Envíos a domicilio",
  soporte_prioritario: "Soporte prioritario",
  productos: "Límite de productos alcanzado",
  analitycs: "Analitycs y Ventas",
  theme: "Personalización de tienda y Social",
};

const FEATURE_PLAN_MINIMO = {
  marketing: "basico",
  domicilio: "basico",
  stocks: "pro",
  soporte_prioritario: "pro",
  analitycs: "pro",
  theme: "pro",
};

export default function PlanGuard({ feature, requirePro = false, children }) {
  const { plan, config, puedeAgregarProducto, vencido } = usePlan();
  // Plan vencido — bloquear todo
  if (vencido) {
    return (
      <FeatureLocked
        titulo="Plan vencido"
        descripcion="Tu plan ha expirado. Contacta al soporte para renovarlo."
        planMinimo={null}
      />
    );
  }

  // Feature de productos
  if (feature === "productos" && !puedeAgregarProducto) {
    return (
      <FeatureLocked
        titulo="Límite de productos alcanzado"
        descripcion={`Tu plan ${config.nombre} permite hasta ${config.max_productos} productos.`}
        planMinimo="pro"
      />
    );
  }

  // Feature booleana
  if (feature && feature !== "productos") {
    const tieneFeature = config[feature] ?? false;
    if (!tieneFeature) {
      return (
        <FeatureLocked
          titulo={`${FEATURE_LABELS[feature] ?? feature} no disponible`}
          descripcion={`Esta función requiere el plan ${FEATURE_PLAN_MINIMO[feature] ?? "Pro"} o superior.`}
          planMinimo={FEATURE_PLAN_MINIMO[feature] ?? "pro"}
        />
      );
    }
  }

  // requirePro explícito
  if (requirePro && plan !== "pro") {
    return (
      <FeatureLocked
        titulo="Función exclusiva Pro"
        descripcion="Esta función está disponible únicamente en el plan Pro."
        planMinimo="pro"
      />
    );
  }

  return children;
}

function FeatureLocked({ titulo, descripcion, planMinimo }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 px-4 text-center">
      <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
        {planMinimo === "pro" ? (
          <Crown size={22} className="text-primary" />
        ) : (
          <Lock size={22} className="text-muted-foreground" />
        )}
      </div>
      <div>
        <p className="font-medium text-foreground">{titulo}</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          {descripcion}
        </p>
      </div>
      <Link
        href="/planes"
        className="flex items-center gap-1.5 text-xs text-primary hover:underline transition-colors"
      >
        Ver mi plan <ArrowRight size={11} />
      </Link>
    </div>
  );
}
