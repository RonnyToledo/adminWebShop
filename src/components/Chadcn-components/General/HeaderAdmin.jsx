"use client";
import React, { useContext, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import dataCards from "@/components/json/card.json";
import navLinks from "@/components/json/link.json";
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
import { Bell, HelpCircle, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supa";
import { can, NAV_PERMISSIONS } from "@/lib/permissions";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

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
  if (/^\/analytics\/new$/.test(pathname))
    return { name: "Nuevo reporte", group: "ANALÍTICAS" };

  const titles = {
    "/": { name: `${greeting}${name ? ", " + name : ""} 👋`, group: "INICIO" },
    "/newProduct": { name: "Crear Producto", group: "PRODUCTOS" },
    "/products": { name: "Todos los productos", group: "PRODUCTOS" },
    "/category": { name: "Categorías", group: "PRODUCTOS" },
    "/blog": { name: "Blog", group: "CONTENIDO" },
    "/blog/new": { name: "Crear entrada del blog", group: "CONTENIDO" },
    "/orders": { name: "Pedidos", group: "ANALÍTICAS" },
    "/ventas": { name: "Ventas", group: "ANALÍTICAS" },
    "/analytics": { name: "Analíticas", group: "ANALÍTICAS" },
    "/codeDiscount": { name: "Códigos de descuento", group: "MARKETING" },
    "/notifications": { name: "Notificaciones", group: "CONFIGURACIÓN" },
    "/configuracion": { name: "Configuración", group: "CONFIGURACIÓN" },
    "/social": { name: "Redes sociales", group: "CONFIGURACIÓN" },
    "/theme": { name: "Personalización", group: "CONFIGURACIÓN" },
    "/planes": { name: "Tu plan", group: "CONFIGURACIÓN" },
    "/team": { name: "Equipo", group: "EQUIPO" },
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [databaseResults, setDatabaseResults] = useState({
    products: [],
    categories: [],
  });
  const [searchingDatabase, setSearchingDatabase] = useState(false);
  const [databaseSearchError, setDatabaseSearchError] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const storeRole = webshop?.store_role ?? "owner";

  const title = useMemo(
    () => getDynamicTitle(pathname, webshop),
    [pathname, webshop],
  );
  const guideCard = useMemo(
    () =>
      dataCards.find(({ route }) => {
        const pattern = route
          .split("/")
          .map((segment) =>
            segment.startsWith("[") && segment.endsWith("]")
              ? "[^/]+"
              : segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          )
          .join("/");
        return new RegExp(`^${pattern}$`).test(pathname);
      }),
    [pathname],
  );
  useEffect(() => {
    setSearchOpen(false);
    setSearchQuery("");
  }, [pathname]);

  const searchableSections = useMemo(
    () =>
      navLinks
        .map((section) => {
          const requiredAction = NAV_PERMISSIONS[section.group ?? ""] ?? "read";
          if (!can(storeRole, requiredAction)) return null;
          const links = section.links.filter(
            (item) =>
              !item.requiredAction || can(storeRole, item.requiredAction),
          );
          return links.length ? { ...section, links } : null;
        })
        .filter(Boolean),
    [storeRole],
  );
  const navigateFromSearch = (href) => {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(href);
  };
  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

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

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    const storeId = webshop?.store?.UUID;
    if (query.length < 2 || !storeId || !can(storeRole, "write")) {
      setDatabaseResults({ products: [], categories: [] });
      setSearchingDatabase(false);
      setDatabaseSearchError("");
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setSearchingDatabase(true);
      setDatabaseSearchError("");
      try {
        const params = new URLSearchParams({ q: query, storeId });
        const response = await fetch(`/api/admin/search?${params}`, {
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(
            result.message || "No se pudo completar la búsqueda.",
          );
        }
        setDatabaseResults({
          products: result.products ?? [],
          categories: result.categories ?? [],
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          setDatabaseResults({ products: [], categories: [] });
          setDatabaseSearchError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) setSearchingDatabase(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [searchQuery, storeRole, webshop?.store?.UUID]);

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

      {/* Center: navigation search */}
      <div className="hidden md:flex items-center gap-3 flex-1 max-w-xl">
        <Button
          variant="ghost"
          className="relative flex-1 justify-start h-9 bg-slate-100 border border-slate-200 text-sm font-normal text-slate-500 hover:bg-slate-200"
          onClick={() => setSearchOpen(true)}
          aria-label="Buscar secciones"
        >
          <Search className="mr-2 h-4 w-4" />
          Buscar una sección...
          <kbd className="absolute right-3 text-[10px] font-medium text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
            Ctrl K
          </kbd>
        </Button>
        <CommandDialog
          open={searchOpen}
          onOpenChange={setSearchOpen}
          className="max-h-[80vh]"
        >
          <CommandInput
            placeholder="Buscar secciones, productos o categorías..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-[calc(80vh-3.5rem)] overflow-y-auto">
            {searchQuery.trim().length < 2 ? (
              <>
                <CommandEmpty>Escribe al menos 2 caracteres.</CommandEmpty>
                {searchableSections.map((section) => (
                  <CommandGroup key={section.group} heading={section.group}>
                    {section.links.map((item) => (
                      <CommandItem
                        key={item.href}
                        value={`${item.label} ${section.group}`}
                        onSelect={() => navigateFromSearch(item.href)}
                      >
                        {item.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </>
            ) : (
              <>
                {databaseSearchError ? (
                  <p
                    role="alert"
                    className="px-4 py-3 text-sm text-destructive"
                  >
                    {databaseSearchError}
                  </p>
                ) : null}
                {searchingDatabase ? (
                  <p
                    role="status"
                    className="px-4 py-3 text-sm text-muted-foreground"
                  >
                    Buscando en productos y categorías...
                  </p>
                ) : null}
                {searchableSections.map((section) => (
                  <CommandGroup key={section.group} heading={section.group}>
                    {section.links.map((item) => (
                      <CommandItem
                        key={item.href}
                        value={`${item.label} ${section.group}`}
                        onSelect={() => navigateFromSearch(item.href)}
                      >
                        {item.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
                {databaseResults.products.length ? (
                  <CommandGroup heading="Productos">
                    {databaseResults.products.map((product) => (
                      <CommandItem
                        key={product.productId}
                        value={`${product.title} producto`}
                        onSelect={() =>
                          navigateFromSearch(
                            `/products/${encodeURIComponent(product.productId)}`,
                          )
                        }
                      >
                        {product.title}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}
                {databaseResults.categories.length ? (
                  <CommandGroup heading="Categorías">
                    {databaseResults.categories.map((category) => (
                      <CommandItem
                        key={category.id}
                        value={`${category.name} categoría`}
                        onSelect={() =>
                          navigateFromSearch(
                            `/category/${encodeURIComponent(category.id)}`,
                          )
                        }
                      >
                        {category.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}
                {!searchingDatabase &&
                !databaseSearchError &&
                !databaseResults.products.length &&
                !databaseResults.categories.length &&
                !searchableSections.some((section) =>
                  section.links.some((item) =>
                    `${item.label} ${section.group}`
                      .toLowerCase()
                      .includes(searchQuery.trim().toLowerCase()),
                  ),
                ) ? (
                  <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                ) : null}
              </>
            )}
          </CommandList>
        </CommandDialog>
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
              aria-label="Ayuda sobre esta página"
              title="Ayuda sobre esta página"
            >
              <HelpCircle className="w-4.5 h-4.5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ayuda de la sección</DialogTitle>
              <DialogDescription>
                Instrucciones y pasos para usar esta parte del panel.
              </DialogDescription>
            </DialogHeader>
            {guideCard ? (
              <GuideCard {...guideCard} />
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Aún no hay una guía específica para esta pantalla. Consulta la
                  guía general del panel para ver las instrucciones disponibles.
                </p>
                <Button asChild>
                  <Link href="/guia">Abrir guía del panel</Link>
                </Button>
              </div>
            )}
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
