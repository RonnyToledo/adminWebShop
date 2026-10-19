"use client";
import React, { useContext, useEffect, useState, useMemo } from "react";
import dataCards from "@/components/json/card.json";
import { usePathname, useRouter } from "next/navigation";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  Card,
} from "@/components/ui/card";
import { ArrowLeft, Bell, HelpCircle, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supa";

// ─── Generador de títulos dinámicos ──────────────────────────────────────────
function getDynamicTitle(pathname, webshop) {
  const hour = new Date().getHours();
  const name = webshop?.user?.name ?? "";

  const greeting =
    hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  if (/^\/products\/[^/]+$/.test(pathname))
    return { name: "Detalle del producto", group: "PRODUCTOS" };
  if (/^\/category\/[^/]+$/.test(pathname))
    return { name: "Detalle de categoría", group: "PRODUCTOS" };
  if (/^\/orders\/[^/]+$/.test(pathname))
    return { name: "Detalle del pedido", group: "ANALÍTICAS" };
  if (/^\/analitycs\/new$/.test(pathname))
    return { name: "Nuevo reporte", group: "ANALÍTICAS" };

  const titles = {
    "/": { name: `${greeting}${name ? ", " + name : ""} 👋`, group: "INICIO" },
    "/newProduct": { name: "Crear Producto", group: "PRODUCTOS" },
    "/products": { name: "Todos los productos", group: "PRODUCTOS" },
    "/category": { name: "Categorías", group: "PRODUCTOS" },
    "/orders": { name: "Pedidos", group: "ANALÍTICAS" },
    "/ventas": { name: "Ventas", group: "ANALÍTICAS" },
    "/analitycs": { name: "Analíticas", group: "ANALÍTICAS" },
    "/codeDiscount": { name: "Códigos de descuento", group: "ANALÍTICAS" },
    "/notifications": { name: "Notificaciones", group: "CONFIGURACION" },
    "/configuracion": { name: "Configuración", group: "CONFIGURACIÓN" },
    "/social": { name: "Redes sociales", group: "CONFIGURACION" },
    "/theme": { name: "Personalización", group: "CONFIGURACIÓN" },
    "/planes": { name: "Tu plan", group: "CONFIGURACIÓN" },
  };

  return (
    titles[pathname] ?? {
      name: "Panel de administración",
      group: "CONFIGURACIÓN",
    }
  );
}

// ─── GuideCard ────────────────────────────────────────────────────────────────
const GuideCard = ({ title, description, steps }) => (
  <div className="grid w-full overflow-hidden">
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[50vh]">
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold">Pasos a seguir</h3>
            <ul className="list-disc space-y-2 pl-6 text-slate-500">
              {steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          </div>
          <ScrollBar />
        </ScrollArea>
      </CardContent>
    </Card>
  </div>
);

// ─── HeaderAdmin ──────────────────────────────────────────────────────────────
export default function HeaderAdmin({ ThemeContext, onMenuClick }) {
  const { webshop } = useContext(ThemeContext);
  const [notificaciones, setNotificaciones] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const title = useMemo(
    () => getDynamicTitle(pathname, webshop),
    [pathname, webshop],
  );

  // Cargar notificaciones pendientes
  useEffect(() => {
    if (!webshop?.user?.id) return;
    let channel;

    const loadNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from("Notification")
          .select("id")
          .eq("userID", webshop.user.id)
          .eq("visto", false);
        if (error) throw error;
        setNotificaciones((data?.length ?? 0) > 0);
      } catch (error) {
        console.error("Error cargando notificaciones:", error);
      }
    };

    loadNotifications();

    channel = supabase
      .channel(`notifications-${webshop.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Notification",
          filter: `userID=eq.${webshop.user.id}`,
        },
        async () => await loadNotifications(),
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [webshop?.user?.id]);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-2 px-3 py-2 h-14 border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm sm:gap-4 sm:px-6">
      {/* Left: menu + title */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className=" text-slate-500 hover:bg-slate-200"
          onClick={onMenuClick}
          aria-label="Abrir menu"
        >
          <Menu size={18} />
        </Button>
        <div className="flex lg:hidden h-6 w-px bg-[#e7eaf0]" />
        <div>
          <p className="text-xs font-medium text-[#98a2b3]">
            <span className="hidden md:inline-block">ADMINISTRADOR</span>
            <span className="inline-block md:hidden">...</span>/ {title.group}
          </p>
          <h1 className="text-sm font-semibold">{title.name}</h1>
        </div>
      </div>

      {/* Center: Search + filters */}
      <div className="hidden md:flex items-center gap-3 flex-1 max-w-xl">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9 h-9 bg-slate-100 border-slate-200 text-sm placeholder:text-slate-400 focus-visible:ring-slate-400"
            placeholder="Search"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
            ⌘ K
          </kbd>
        </div>
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Bell */}
        <Button
          variant="ghost"
          size="icon"
          className="relative w-9 h-9 rounded-xl hover:bg-slate-200 text-slate-500"
          onClick={() => router.push("/notifications")}
        >
          <Bell className="w-4.5 h-4.5" />
          {notificaciones && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-slate-500 rounded-full ring-2 ring-slate-50" />
          )}
        </Button>

        {/* Help */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-xl hover:bg-slate-200 text-slate-500"
            >
              <HelpCircle className="w-4.5 h-4.5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Info</DialogTitle>
              <DialogDescription>
                Panel de información sobre la pantalla
              </DialogDescription>
            </DialogHeader>
            {dataCards
              .filter((obj) => obj.llave === identifyRoute(pathname))
              .map((card, index) => (
                <GuideCard key={index} {...card} />
              ))}
          </DialogContent>
        </Dialog>

        {/* Divider */}
        <div className="hidden md:flex w-px h-6 bg-slate-200" />

        {/* User chip */}
        <div className="hidden md:flex items-center gap-2.5 pl-1 backdrop-blur-xl">
          <Avatar className="w-8 h-8 ring-2 ring-slate-200">
            <AvatarImage
              src={webshop?.user?.image || ""}
              alt={webshop?.user?.name || "Usuario"}
            />
            <AvatarFallback className="bg-slate-200 text-slate-700 text-xs font-bold">
              {webshop?.user?.name
                ? webshop.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-semibold text-slate-800 truncate max-w-[100px]">
              {webshop?.user?.name?.split(" ")[0] || "Usuario"}
            </p>
            <p className="text-[11px] text-slate-500 capitalize">
              {webshop?.store_role ?? "Manager"}
            </p>
          </div>
          {/* Online dot */}
          <div className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
        </div>
      </div>
    </header>
  );
}

// ─── identifyRoute ────────────────────────────────────────────────────────────
const identifyRoute = (pathname) => {
  const routeMap = {
    "/category/[uid]": "Category UID",
    "/category": "Category",
    "/codeDiscount": "Code Discount",
    "/configuracion/domicilios": "Configuración Domicilios",
    "/guia": "Guía",
    "/configuracion": "Configuracion",
    "/newProduct": "New Product",
    "/orders": "Orders",
    "/products/[specific]": "Product Specific",
    "/products": "Products",
    "/": "Dashboard",
  };
  const matchedRoute = Object.keys(routeMap).find((route) => {
    const routeRegex = new RegExp(
      `^${route.replace(/\[.*?\]/g, "([^/]+)").replace(/\//g, "\\/")}$`,
    );
    return routeRegex.test(pathname);
  });
  return routeMap[matchedRoute] || "Unknown Route";
};
