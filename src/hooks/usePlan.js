// hooks/usePlan.js
// ─── Hook central de planes — úsalo en cualquier componente del admin ─────────
"use client";
import { useContext, useMemo } from "react";
import { ThemeContext } from "@/context/useContext";

// Configuración local — espejo de plan_config en DB.
// Solo se usa para UI (badges, textos). La lógica real vive en DB.
const PLAN_CONFIG = {
  trial: {
    nombre: "Prueba gratuita",
    color: "text-muted-foreground",
    bg: "bg-secondary",
    max_productos: 10,
    marketing: false,
    analitycs: false,
    theme: false,
    stocks: false,
    domicilio: false,
    soporte_prioritario: false,
  },
  basico: {
    nombre: "Básico",
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    max_productos: 50,
    marketing: true,
    analitycs: false,
    theme: false,
    stocks: false,
    domicilio: true,
    soporte_prioritario: false,
  },
  pro: {
    nombre: "Pro",
    color: "text-primary",
    bg: "bg-primary/10",
    max_productos: -1,
    marketing: true,
    analitycs: true,
    theme: true,
    stocks: true,
    domicilio: true,
    soporte_prioritario: true,
  },
  anual: {
    nombre: "Anual",
    color: "text-primary",
    bg: "bg-primary/10",
    max_productos: -1,
    marketing: true,
    analitycs: true,
    theme: true,

    stocks: true,
    domicilio: true,
    soporte_prioritario: true,
  },
};

export function usePlan() {
  const { webshop } = useContext(ThemeContext);

  return useMemo(() => {
    const plan = webshop?.store?.plan ?? "trial";
    const plan_vence = webshop?.store?.plan_vence ?? null;
    const config = PLAN_CONFIG[plan] ?? PLAN_CONFIG.trial;

    // Calcular días restantes
    const diasRestantes = plan_vence
      ? Math.max(0, Math.ceil((new Date(plan_vence) - Date.now()) / 86_400_000))
      : null;

    const vencido = plan_vence ? new Date(plan_vence) < new Date() : false;

    // Cuántos productos tiene actualmente
    const productosActuales = webshop?.products?.length ?? 0;

    // ¿Puede agregar más productos?
    const puedeAgregarProducto =
      config.max_productos === -1 || productosActuales < config.max_productos;

    // Porcentaje de uso de productos (para la barra de progreso)
    const usoPct =
      config.max_productos === -1
        ? 0
        : Math.min(
            100,
            Math.round((productosActuales / config.max_productos) * 100),
          );

    return {
      plan,
      config,
      diasRestantes,
      vencido,
      productosActuales,
      puedeAgregarProducto,
      usoPct,
      // Shortcuts de features
      tieneMarketing: webshop?.store?.marketing ?? config.marketing,
      tieneStocks: webshop?.store?.stocks ?? config.stocks,
      tieneDomicilio: webshop?.store?.domicilio ?? config.domicilio,
      tieneSoportePrioritario: config.soporte_prioritario,
      tieneAnalitycs: webshop?.store?.analitycs ?? config.analitycs,
      esPro: plan === "pro",
      esTrial: plan === "trial",
    };
  }, [
    webshop?.store?.plan,
    webshop?.store?.plan_vence,
    webshop?.products?.length,
    webshop?.store,
  ]);
}

// ─── PLAN_CONFIG exportado para la página de pricing ─────────────────────────
export { PLAN_CONFIG };
