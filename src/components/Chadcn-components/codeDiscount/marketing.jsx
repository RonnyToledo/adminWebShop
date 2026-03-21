"use client";
import React, { useEffect, useState, useContext } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import "@github/relative-time-element";
import axios from "axios";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supa";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Calendar, Percent, Trash2 } from "lucide-react";
import { sileo } from "sileo";
import { motion } from "framer-motion";

export function Marketing({ ThemeContext }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [discounts, setDiscounts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [focused, setFocused] = useState(null);
  const [newDiscount, setNewDiscount] = useState({
    code: "",
    discount: 0,
    expiresAt: "",
  });

  useEffect(() => {
    setDiscounts(webshop?.code || []);
  }, [webshop]);
  useEffect(() => {
    setFiltered(
      searchTerm !== ""
        ? discounts.filter((c) =>
            c.code.toLowerCase().includes(searchTerm.toLowerCase()),
          )
        : discounts,
    );
  }, [discounts, searchTerm]);

  const isExpired = (date, diff = 0) =>
    new Date(date) < new Date().setDate(new Date().getDate() + diff);

  const handleAddDiscount = async () => {
    if (!newDiscount.code || !newDiscount.expiresAt) {
      sileo.error({
        title: "Faltan campos",
        description: "Código y fecha de expiración son requeridos",
      });
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("code", newDiscount.code);
      formData.append("discount", newDiscount.discount || 0);
      formData.append("expiresAt", newDiscount.expiresAt);
      formData.append("uid", webshop?.store?.UUID);
      const postPromise = axios.post(
        `/api/tienda/${webshop?.store?.sitioweb}/discountCode`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      sileo.promise(postPromise, {
        loading: { title: "Guardando código..." },
        success: (response) => {
          setDiscounts((prev) => [...prev, ...response.data]);
          return { title: "Código creado" };
        },
        error: () => ({ title: "Error al guardar" }),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setNewDiscount({ code: "", discount: 0, expiresAt: "" });
      setLoading(false);
      setIsAddDialogOpen(false);
    }
  };

  const handleRemoveDiscount = async (id) => {
    const deletePromise = axios.delete(
      `/api/tienda/${webshop?.store?.sitioweb}/discountCode?id=${id}`,
    );
    sileo.promise(deletePromise, {
      loading: { title: "Eliminando..." },
      success: () => {
        setDiscounts((prev) => prev.filter((d) => d.id !== id));
        return { title: "Código eliminado" };
      },
      error: (err) => ({ title: "Error", description: err?.message }),
    });
  };

  const handleSwitch = async (value) => {
    const supaPromise = new Promise(async (resolve, reject) => {
      try {
        const { data, error } = await supabase
          .from("Sitios")
          .update({ marketing: value })
          .eq("UUID", webshop?.store?.UUID);
        if (error) reject(error);
        else resolve(data);
      } catch (err) {
        reject(err);
      }
    });
    sileo.promise(supaPromise, {
      loading: { title: value ? "Activando marketing..." : "Desactivando..." },
      success: () => {
        setWebshop((prev) => ({
          ...prev,
          store: { ...prev.store, marketing: value },
        }));
        return { title: "Actualizado" };
      },
      error: (err) => ({ title: "Error", description: err?.message }),
    });
  };

  const activeCount = (discounts || []).filter(
    (c) => !isExpired(c.expiresAt, 0),
  ).length;
  const expiringCount = (discounts || []).filter((c) =>
    isExpired(c.expiresAt, 7),
  ).length;

  const baseInput =
    "w-full bg-secondary/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border transition-all duration-200";
  const focusClass = (id) =>
    focused === id
      ? "border-primary ring-2 ring-primary/10"
      : "border-border hover:border-border/60";

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] text-primary uppercase tracking-[0.18em] font-medium mb-1">
            Ventas
          </p>
          <h1 className="text-2xl font-normal text-foreground italic">
            Códigos de descuento
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Toggle marketing */}
          <div className="flex items-center gap-2.5">
            <Label className="text-xs text-muted-foreground">Sistema</Label>
            <Switch
              checked={!!webshop?.store?.marketing}
              onCheckedChange={handleSwitch}
            />
            <span
              className={`text-xs font-medium ${webshop?.store?.marketing ? "text-primary" : "text-destructive"}`}
            >
              {webshop?.store?.marketing ? "Activo" : "Inactivo"}
            </span>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <button
                disabled={!webshop?.store?.marketing}
                className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={14} /> Agregar código
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo código de descuento</DialogTitle>
                <DialogDescription>
                  Configura un código para tus clientes.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    className={`block text-[11px] uppercase tracking-[0.12em] font-medium transition-colors ${focused === "code" ? "text-primary" : "text-muted-foreground"}`}
                  >
                    Código
                  </label>
                  <input
                    placeholder="WELCOME20"
                    value={newDiscount.code}
                    onFocus={() => setFocused("code")}
                    onBlur={() => setFocused(null)}
                    onChange={(e) =>
                      setNewDiscount({
                        ...newDiscount,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className={`${baseInput} ${focusClass("code")} font-mono tracking-widest`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] text-muted-foreground uppercase tracking-[0.12em] font-medium">
                      Descuento (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="20"
                        value={newDiscount.discount}
                        onChange={(e) =>
                          setNewDiscount({
                            ...newDiscount,
                            discount: e.target.value,
                          })
                        }
                        className={`${baseInput} ${focusClass("disc")} pr-8`}
                        onFocus={() => setFocused("disc")}
                        onBlur={() => setFocused(null)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] text-muted-foreground uppercase tracking-[0.12em] font-medium">
                      Expira
                    </label>
                    <input
                      type="date"
                      value={newDiscount.expiresAt}
                      onChange={(e) =>
                        setNewDiscount({
                          ...newDiscount,
                          expiresAt: e.target.value,
                        })
                      }
                      className={`${baseInput} ${focusClass("exp")}`}
                      onFocus={() => setFocused("exp")}
                      onBlur={() => setFocused(null)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <button
                  onClick={() => setIsAddDialogOpen(false)}
                  className="text-sm px-4 py-2 rounded-xl border border-border text-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={loading}
                  onClick={handleAddDiscount}
                  className="text-sm px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? "Creando..." : "Crear código"}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          {
            label: "Códigos activos",
            value: activeCount,
            icon: Percent,
            sub: `de ${discounts.length} total`,
          },
          {
            label: "Próximos a expirar",
            value: expiringCount,
            icon: Calendar,
            sub: "en 7 días",
          },
          {
            label: "Usos totales",
            value: discounts.reduce((s, c) => s + (c.visitas || 0), 0),
            icon: Percent,
            sub: "histórico",
          },
        ].map(({ label, value, icon: Icon, sub }) => (
          <div
            key={label}
            className="bg-secondary/40 border border-border rounded-xl px-4 py-3"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.08em]">
                {label}
              </p>
              <Icon size={13} className="text-muted-foreground/60" />
            </div>
            <p className="text-xl font-medium text-foreground tabular-nums">
              {value}
            </p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <div className="relative max-w-xs">
        <Search
          size={13}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          placeholder="Buscar códigos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-secondary/50 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
        />
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Lista de códigos
          </CardTitle>
          <CardDescription>
            {(filtered || []).length} código{filtered?.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                {["Código", "Descuento", "Expira", "Estado", "Usos", ""].map(
                  (h) => (
                    <TableHead
                      key={h}
                      className="text-[11px] text-muted-foreground uppercase tracking-[0.08em]"
                    >
                      {h}
                    </TableHead>
                  ),
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(filtered || []).map((code) => (
                <TableRow
                  key={code.id}
                  className="border-border/50 hover:bg-secondary/20 transition-colors"
                >
                  <TableCell>
                    <span className="font-mono text-sm font-medium text-foreground bg-secondary px-2 py-0.5 rounded">
                      {code.code}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{code.discount}%</TableCell>
                  <TableCell>
                    <span
                      className={`text-sm ${isExpired(code.expiresAt, 0) ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {new Date(code.expiresAt).toLocaleDateString("es-ES")}
                    </span>
                  </TableCell>
                  <TableCell>
                    {isExpired(code.expiresAt, 0) ? (
                      <Badge variant="destructive">Expirado</Badge>
                    ) : (
                      <Badge className="bg-primary/15 text-primary border-0">
                        Activo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground tabular-nums">
                    {code.visitas}
                  </TableCell>
                  <TableCell>
                    <button
                      disabled={!webshop?.store?.marketing}
                      onClick={() => handleRemoveDiscount(code.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={13} />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
