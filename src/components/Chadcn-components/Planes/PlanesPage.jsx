"use client";
import { useContext, useState } from "react";
import { ThemeContext } from "@/context/useContext";
import { usePlan, PLAN_CONFIG } from "@/hooks/usePlan";
import {
  Check,
  Crown,
  Zap,
  Clock,
  AlertTriangle,
  Loader2,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sileo } from "sileo";
import axios from "axios";

// ─── Icono por plan ───────────────────────────────────────────────────────────
const PLAN_ICON = {
  trial: <Clock size={16} />,
  basico: <Zap size={16} />,
  pro: <Crown size={16} />,
};

// ─── Card de un plan ─────────────────────────────────────────────────────────
function PlanCard({
  planId,
  config,
  isCurrent,
  onActivar,
  loading,
  adminMode,
  sitioUUID,
}) {
  const isUnlimited = config.max_productos === -1;

  const features = [
    {
      label: `${isUnlimited ? "Ilimitados" : config.max_productos} productos`,
      active: true,
    },
    { label: "Marketing y descuentos", active: config.marketing },
    { label: "Control de stock", active: config.stocks },
    { label: "Envíos a domicilio", active: config.domicilio },
    { label: "Carrito de compras", active: config.carrito ?? true },
    { label: "Soporte prioritario", active: config.soporte_prioritario },
  ];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`relative flex flex-col rounded-2xl border p-6 gap-4 transition-all ${
        isCurrent
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-background hover:border-primary/30"
      }`}
    >
      {/* Badge actual */}
      {isCurrent && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-medium bg-primary text-primary-foreground px-3 py-0.5 rounded-full">
          Plan actual
        </span>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${config.bg} ${config.color}`}
          >
            {PLAN_ICON[planId]}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {config.nombre}
            </p>
            <p className={`text-[11px] font-medium ${config.color}`}>
              {planId === "trial"
                ? "Gratis"
                : `$${config.precio_mensual ?? "—"}/mes`}
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-2 flex-1">
        {features.map(({ label, active }) => (
          <li key={label} className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                active
                  ? "bg-primary/15 text-primary"
                  : "bg-secondary text-muted-foreground/40"
              }`}
            >
              <Check size={10} />
            </div>
            <span
              className={`text-xs ${active ? "text-foreground" : "text-muted-foreground/50 line-through"}`}
            >
              {label}
            </span>
          </li>
        ))}
      </ul>

      {/* Botón — solo en modo admin */}
      {adminMode && !isCurrent && (
        <button
          onClick={() => onActivar(sitioUUID, planId)}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 text-xs py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 font-medium"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : null}
          Activar {config.nombre}
        </button>
      )}
    </motion.div>
  );
}

// ─── Vista del usuario: su plan actual + barra de uso ────────────────────────
function VistaUsuario() {
  const {
    plan,
    config,
    diasRestantes,
    vencido,
    productosActuales,
    usoPct,
    puedeAgregarProducto,
  } = usePlan();

  return (
    <div className="space-y-6">
      {/* Banner de alerta */}
      <AnimatePresence>
        {(vencido || (diasRestantes !== null && diasRestantes <= 3)) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${
              vencido
                ? "bg-destructive/10 border-destructive/30 text-destructive"
                : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-400"
            }`}
          >
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <p className="text-sm">
              {vencido
                ? "Tu plan ha vencido. Contacta al soporte para renovarlo."
                : `Tu plan vence en ${diasRestantes} día${diasRestantes !== 1 ? "s" : ""}. Contacta al soporte para renovarlo.`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plan actual */}
      <div
        className={`flex items-center justify-between px-5 py-4 rounded-2xl border ${config.bg} border-border`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center bg-background/80 ${config.color}`}
          >
            {PLAN_ICON[plan]}
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.12em]">
              Plan activo
            </p>
            <p className={`text-lg font-medium ${config.color}`}>
              {config.nombre}
            </p>
          </div>
        </div>
        {diasRestantes !== null && (
          <div className="text-right">
            <p className="text-2xl font-medium text-foreground tabular-nums">
              {diasRestantes}
            </p>
            <p className="text-[11px] text-muted-foreground">días restantes</p>
          </div>
        )}
      </div>

      {/* Uso de productos */}
      <div className="bg-background border border-border rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.12em]">
            Productos
          </p>
          <p className="text-sm font-medium text-foreground tabular-nums">
            {productosActuales}
            {config.max_productos !== -1 && ` / ${config.max_productos}`}
            {config.max_productos === -1 && " / ∞"}
          </p>
        </div>
        {config.max_productos !== -1 && (
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${usoPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full ${usoPct >= 90 ? "bg-destructive" : usoPct >= 70 ? "bg-amber-500" : "bg-primary"}`}
            />
          </div>
        )}
        {!puedeAgregarProducto && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <Lock size={11} />
            Límite de productos alcanzado — contacta al soporte para ampliar
          </div>
        )}
      </div>

      {/* Features del plan actual */}
      <div className="bg-background border border-border rounded-xl p-5 space-y-3">
        <p className="text-[11px] text-muted-foreground uppercase tracking-[0.12em]">
          Incluido en tu plan
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { label: "Marketing y descuentos", active: config.marketing },
            { label: "Control de stock", active: config.stocks },
            { label: "Envíos a domicilio", active: config.domicilio },
            { label: "Carrito de compras", active: true },
            { label: "Analitycs y Ventas", active: config.analitycs },
            { label: "Temas y Social", active: config.theme },
            {
              label: "Soporte prioritario",
              active: config.soporte_prioritario,
            },
          ].map(({ label, active }) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "bg-secondary text-muted-foreground/40"
                }`}
              >
                <Check size={10} />
              </div>
              <span
                className={`text-xs ${active ? "text-foreground" : "text-muted-foreground/50"}`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Para cambiar de plan o renovar, contacta al soporte por WhatsApp.
      </p>
    </div>
  );
}

// ─── Vista admin: gestión de planes de UNA tienda ────────────────────────────
function VistaAdmin({ sitioUUID, planActual }) {
  const [loading, setLoading] = useState(false);
  const [notas, setNotas] = useState("");

  const activarPlan = async (uuid, planId) => {
    setLoading(true);
    const promise = axios.post("/api/admin/planes", {
      sitio_uuid: uuid,
      plan: planId,
      notas: notas || undefined,
    });
    sileo.promise(promise, {
      loading: { title: `Activando plan ${PLAN_CONFIG[planId]?.nombre}...` },
      success: () => {
        setLoading(false);
        return { title: "Plan activado correctamente" };
      },
      error: (err) => {
        setLoading(false);
        return {
          title: "Error",
          description: err?.response?.data?.error ?? err?.message,
        };
      },
    });
  };

  return (
    <div className="space-y-5">
      {/* Notas opcionales */}
      <div className="space-y-1.5">
        <label className="text-[11px] text-muted-foreground uppercase tracking-[0.12em]">
          Nota interna (opcional)
        </label>
        <textarea
          rows={2}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Ej: Pago recibido por transferencia..."
          className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none transition-all"
        />
      </div>

      {/* Cards de planes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.entries(PLAN_CONFIG).map(([planId, config]) => (
          <PlanCard
            key={planId}
            planId={planId}
            config={config}
            isCurrent={planActual === planId}
            onActivar={activarPlan}
            loading={loading}
            adminMode
            sitioUUID={sitioUUID}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Página principal — detecta si es admin o usuario ────────────────────────
export default function PlanesPage({ adminMode = false, sitioUUID = null }) {
  const { webshop } = useContext(ThemeContext);
  const { plan } = usePlan();

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <p className="text-[11px] text-primary uppercase tracking-[0.18em] font-medium mb-1">
          {adminMode ? "Gestión" : "Cuenta"}
        </p>
        <h1 className="text-2xl font-normal text-foreground italic">
          {adminMode ? "Gestionar plan" : "Mi plan"}
        </h1>
        {adminMode && sitioUUID && (
          <p className="text-sm text-muted-foreground mt-0.5">
            Tienda:{" "}
            <code className="font-mono text-xs bg-secondary px-2 py-0.5 rounded">
              {sitioUUID.substring(0, 12)}...
            </code>
          </p>
        )}
      </div>

      {adminMode ? (
        <VistaAdmin
          sitioUUID={sitioUUID ?? webshop?.store?.UUID}
          planActual={plan}
        />
      ) : (
        <VistaUsuario />
      )}
    </div>
  );
}
