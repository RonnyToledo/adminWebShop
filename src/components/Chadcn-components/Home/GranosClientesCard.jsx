import { progresoHaciaNextNivel } from "@/utils/granos";

export function GranosClientesCard({ clientes = [] }) {
  if (!clientes.length) return null;

  const top = [...clientes].sort((a, b) => b.granos - a.granos).slice(0, 5);

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground">Clientes fieles</h3>
        <span className="text-xs text-muted-foreground">por granos</span>
      </div>

      <div className="space-y-0">
        {top.map((c) => {
          const progreso = progresoHaciaNextNivel(c.granos);
          const iniciales = (c.nombre || "?")[0].toUpperCase();

          return (
            <div
              key={c.telefono}
              className="flex items-center gap-3 py-2.5 border-b border-border last:border-0 last:pb-0"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
                style={{ background: c.nivel.bg, color: c.nivel.text }}
              >
                {iniciales}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground truncate">
                    {c.nombre}
                  </span>
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: c.nivel.bg, color: c.nivel.text }}
                  >
                    {c.nivel.nombre}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1 flex-1 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progreso}%`,
                        background: c.nivel.color,
                      }}
                    />
                  </div>
                  {c.siguiente && (
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {c.siguiente.nombre} en {c.siguiente.min - c.granos}
                    </span>
                  )}
                  {!c.siguiente && (
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      tope
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-foreground">
                  {c.granos.toLocaleString("es-CU")}
                </p>
                <p className="text-[10px] text-muted-foreground">granos</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
