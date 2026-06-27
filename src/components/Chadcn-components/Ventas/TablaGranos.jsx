import { progresoHaciaNextNivel } from "@/utils/granos";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function TablaGranos({ clientes = [] }) {
  if (!clientes.length) return null;

  const sorted = [...clientes].sort((a, b) => b.granos - a.granos);

  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="p-5 pb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">
            Clientes y granos acumulados
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            identificados por teléfono · anónimos y logueados fusionados
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          {sorted.length} clientes
        </span>
      </div>

      <ScrollArea className="h-72">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead className="text-center">Compras</TableHead>
              <TableHead className="text-right">Total gastado</TableHead>
              <TableHead className="text-right">Granos</TableHead>
              <TableHead>Progreso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((c) => {
              const progreso = progresoHaciaNextNivel(c.granos);
              const iniciales = (c.nombre || "?")[0].toUpperCase();

              return (
                <TableRow key={c.telefono}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0"
                        style={{ background: c.nivel.bg, color: c.nivel.text }}
                      >
                        {iniciales}
                      </div>
                      <span className="font-medium">{c.nombre}</span>
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {c.telefono}
                  </TableCell>

                  <TableCell>
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: c.nivel.bg, color: c.nivel.text }}
                    >
                      {c.nivel.nombre}
                    </span>
                  </TableCell>

                  <TableCell className="text-center">{c.compras}</TableCell>

                  <TableCell className="text-right text-muted-foreground">
                    {c.totalGastado.toLocaleString("es-CU")} CUP
                  </TableCell>

                  <TableCell className="text-right font-medium">
                    {c.granos.toLocaleString("es-CU")}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${progreso}%`,
                            background: c.nivel.color,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-7">
                        {progreso}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
