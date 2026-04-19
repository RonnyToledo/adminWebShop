"use client";
import React, { useContext, useMemo } from "react";
import { FeatureCard } from "./dashborad/feature-card";
import { StatsCard } from "./dashborad/stats-card";
import { QuickActionCard } from "./dashborad/quick-action-card";
import { OnboardingProgress } from "./dashborad/onboarding-progress";
import {
  Package,
  Store,
  CreditCard,
  ClipboardCheck,
  Globe,
  Link2,
  ShoppingCart,
  Users,
  TrendingUp,
  Coffee,
} from "lucide-react";
import { ThemeContext } from "@/context/useContext";
import {
  getDisplayPrice,
  getTotalStock,
  isMultiVariant,
} from "@/utils/variants";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCUP(n, monedaDefault) {
  if (!n && n !== 0) return "—";
  return n.toLocaleString("es-CU") + " " + monedaDefault;
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `Hace ${Math.round(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.round(diff / 3600)} horas`;
  if (diff < 172800) return "Ayer";
  return new Date(dateStr).toLocaleDateString("es-CU", {
    day: "2-digit",
    month: "short",
  });
}

function buildOnboardingSteps(store, products, events) {
  return [
    { id: "1", title: "Agregar productos", completed: products.length > 0 },
    {
      id: "2",
      title: "Configurar tienda",
      completed: !!(store.banner && store.name && store.history),
    },
    {
      id: "3",
      title: "Configurar pagos",
      completed: store.monedas?.length > 0,
    },
    { id: "4", title: "Publicar tienda", completed: store.active === true },
  ];
}

function buildRecentActivity(products, events, monedaDefault) {
  const latestProducts = [...products]
    .sort((a, b) => new Date(b.modified) - new Date(a.modified))
    .slice(0, 2)
    .map((p) => ({
      icon: Package,
      title: `${p.title} agregado`,
      time: timeAgo(p.modified),
      // Precio desde variantes
      price: formatCUP(getDisplayPrice(p), monedaDefault),
    }));

  const latestOrders = [...events]
    .filter((e) => e.events === "compra")
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 2)
    .map((e) => ({
      icon: ShoppingCart,
      title: `Nuevo pedido · ${e.nombre}`,
      time: timeAgo(e.created_at),
      price: formatCUP(e.desc?.total, monedaDefault),
    }));

  return [...latestOrders, ...latestProducts].slice(0, 4);
}

// ─── DashboardHome ────────────────────────────────────────────────────────────

export default function DashboardHome() {
  const { webshop } = useContext(ThemeContext);
  const store = webshop?.store ?? {};
  const ga = webshop?.ga ?? {};
  const products = webshop?.products ?? [];
  const events = webshop?.events ?? [];
  const code = webshop?.code ?? [];

  const MonedaDefault =
    webshop?.store?.monedas?.find((m) => m.defecto)?.nombre ||
    webshop?.store?.monedas?.[0]?.nombre ||
    "CUP";

  // ── Métricas ──────────────────────────────────────────────────────────────

  const totalProductos = products.length;
  const totalPedidos = events.filter((e) => e.events === "compra").length;

  // Ingresos reales — siempre desde el total del evento (ya incluye variantes)
  const totalIngresos = events
    .filter((e) => e.events === "compra")
    .reduce((sum, e) => sum + (e.desc?.total ?? 0), 0);

  // Productos con stock (usando helper de variantes)
  const productosConStock = products.filter((p) => getTotalStock(p) > 0).length;
  const productosMulti = products.filter((p) => isMultiVariant(p)).length;

  const clientesUnicos = new Set(
    events.filter((e) => e.phonenumber).map((e) => String(e.phonenumber)),
  ).size;

  const meses = ga.promedioVisitasPorMes?.contadorMeses ?? {};
  const mesEntries = Object.entries(meses);
  const visitasCambio =
    mesEntries.length >= 2
      ? Math.round(
          ((mesEntries[mesEntries.length - 1][1] -
            mesEntries[mesEntries.length - 2][1]) /
            Math.max(mesEntries[mesEntries.length - 2][1], 1)) *
            100,
        )
      : 0;

  const topCode = [...code].sort((a, b) => b.visitas - a.visitas)[0];

  const newestProduct = useMemo(
    () =>
      [...products].sort(
        (a, b) => new Date(b.modified) - new Date(a.modified),
      )[0],
    [products],
  );

  const onboardingSteps = useMemo(
    () => buildOnboardingSteps(store, products, events),
    [store, products, events],
  );

  const recentActivity = useMemo(
    () => buildRecentActivity(products, events, MonedaDefault),
    [products, events],
  );

  const storeUrl = store.sitioweb
    ? `roumenu.vercel.app/t/${store.sitioweb}`
    : "—";

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* ── Stats ─────────────────────────────────────────────────── */}
            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Productos"
                  value={totalProductos}
                  // Sub-info: cuántos tienen variantes múltiples
                  change={productosMulti > 0 ? undefined : 8}
                  changeLabel={
                    productosMulti > 0
                      ? `${productosMulti} con variantes`
                      : "este mes"
                  }
                  icon={<Package className="w-5 h-5 text-primary" />}
                />
                <StatsCard
                  title="Pedidos"
                  value={totalPedidos}
                  change={totalPedidos > 0 ? 12 : 0}
                  changeLabel="esta semana"
                  icon={<ShoppingCart className="w-5 h-5 text-primary" />}
                />
                <StatsCard
                  title="Clientes únicos"
                  value={clientesUnicos || "—"}
                  change={clientesUnicos > 0 ? 5 : undefined}
                  changeLabel="nuevos"
                  icon={<Users className="w-5 h-5 text-primary" />}
                />
                <StatsCard
                  title="Ingresos totales"
                  value={formatCUP(totalIngresos, MonedaDefault)}
                  change={visitasCambio !== 0 ? visitasCambio : undefined}
                  changeLabel="vs. mes anterior"
                  icon={<TrendingUp className="w-5 h-5 text-primary" />}
                />
              </div>
            </section>

            {/* ── Main Grid ─────────────────────────────────────────────── */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FeatureCard
                    title={
                      newestProduct
                        ? `${newestProduct.title} agregado`
                        : "Producto agregado"
                    }
                    description={
                      newestProduct
                        ? `Precio: ${formatCUP(getDisplayPrice(newestProduct), MonedaDefault)}${isMultiVariant(newestProduct) ? " (desde)" : ""}. Puedes editarlo o agregar más.`
                        : "Tu producto ha sido agregado exitosamente."
                    }
                    actionLabel="Agregar más productos"
                    variant="success"
                    completed
                    image={
                      newestProduct?.image ||
                      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=200&fit=crop"
                    }
                    badge="Nuevo"
                  />
                  <FeatureCard
                    title="Edita tu tienda"
                    description={
                      store.history ||
                      "Personaliza la foto de portada, logo, nombre y descripción."
                    }
                    actionLabel="Editar"
                    variant="highlight"
                    icon={<Store className="w-5 h-5 text-primary" />}
                    image={
                      store.banner ||
                      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=200&fit=crop"
                    }
                  />
                </div>

                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    Acciones rápidas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <QuickActionCard
                      title="Método de pago"
                      actionLabel="Ver"
                      icon={<CreditCard className="w-4 h-4 text-primary" />}
                    />
                    <QuickActionCard
                      title="Revisar productos"
                      actionLabel={`${totalProductos} productos`}
                      icon={<ClipboardCheck className="w-4 h-4 text-primary" />}
                    />
                    <QuickActionCard
                      title="Guía del dominio"
                      actionLabel="Links"
                      actionHref={storeUrl}
                      external
                      icon={<Globe className="w-4 h-4 text-primary" />}
                    />
                  </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-foreground">
                      Actividad reciente
                    </h3>
                    <button className="text-xs text-primary hover:underline">
                      Ver todo
                    </button>
                  </div>
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Sin actividad registrada aún.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                            <item.icon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {item.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.time}
                            </p>
                          </div>
                          {item.price && (
                            <span className="text-sm font-medium text-primary">
                              {item.price}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {topCode && (
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Código promo activo
                        </p>
                        <p className="text-sm font-medium text-foreground font-mono">
                          {topCode.code}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Usos</p>
                        <p className="text-sm font-semibold text-primary">
                          {topCode.visitas}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <OnboardingProgress steps={onboardingSteps} />

                <div className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                      <Coffee className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {store.name ?? "Mi tienda"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {store.tipo ?? "Tienda online"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 text-sm">
                    <Link2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground truncate flex-1">
                      {storeUrl}
                    </span>
                    <button
                      onClick={() => navigator.clipboard?.writeText(storeUrl)}
                      className="text-primary text-xs hover:underline shrink-0"
                    >
                      Copiar
                    </button>
                  </div>

                  {/* Stock info */}
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      <span className="font-medium text-foreground">
                        {productosConStock}
                      </span>{" "}
                      con stock
                    </span>
                    {productosMulti > 0 && (
                      <span>
                        <span className="font-medium text-foreground">
                          {productosMulti}
                        </span>{" "}
                        con variantes
                      </span>
                    )}
                  </div>

                  {store.horario &&
                    (() => {
                      const dias = [
                        "Domingo",
                        "Lunes",
                        "Martes",
                        "Miercoles",
                        "Jueves",
                        "Viernes",
                        "Sabado",
                      ];
                      const hoy = store.horario.find(
                        (h) => h.dia === dias[new Date().getDay()],
                      );
                      const abierto =
                        hoy && (hoy.apertura !== 0 || hoy.cierre !== 0);
                      return hoy ? (
                        <p className="text-xs text-muted-foreground mt-2">
                          Hoy:{" "}
                          <span
                            className={
                              abierto
                                ? "text-success font-medium"
                                : "text-destructive font-medium"
                            }
                          >
                            {abierto
                              ? hoy.cierre === 24
                                ? "Abierto 24h"
                                : `${hoy.apertura}:00 – ${hoy.cierre}:00`
                              : "Cerrado"}
                          </span>
                        </p>
                      ) : null;
                    })()}

                  <button className="w-full mt-3 py-2.5 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                    Ver tienda
                  </button>
                </div>

                {store.envios?.length > 0 && (
                  <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-sm font-medium text-foreground mb-3">
                      Zonas de envío
                    </h3>
                    <div className="space-y-2">
                      {store.envios.map(({ lugar, precio }) => (
                        <div
                          key={lugar}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-muted-foreground">{lugar}</span>
                          <span className="font-medium text-foreground">
                            {formatCUP(precio, MonedaDefault)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-5">
                  <h3 className="font-semibold text-foreground mb-2">
                    ¿Necesitas ayuda?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Nuestro equipo está disponible para ayudarte.
                  </p>
                  {store.email && (
                    <p className="text-xs text-muted-foreground mb-3">
                      {store.email}
                    </p>
                  )}
                  <button className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                    Contactar soporte <span className="text-xs">→</span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
