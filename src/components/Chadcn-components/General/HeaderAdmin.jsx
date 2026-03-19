"use client";
import React, { useContext } from "react";
import Link from "next/link";
import dataCards from "@/components/json/card.json";
import { usePathname } from "next/navigation";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import { Bell, HelpCircle, Pencil, Phone, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const GuideCard = ({ title, description, steps, link, buttonText }) => {
  return (
    <div className="grid  w-full overflow-hidden ">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[50vh] relative flex items-center">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <h3 className="text-lg font-semibold">Pasos a seguir</h3>
                <ul className="list-disc space-y-2 pl-6 text-slate-500 dark:text-slate-400">
                  {steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
            <ScrollBar />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default function HeaderAdmin({
  title = "Bienvenido",
  phoneNumber = "+53 52489105",
  ThemeContext,
  onMenuClick,
}) {
  const { webshop } = useContext(ThemeContext);
  const pathname = usePathname();

  const pathParts = pathname.split("/").filter((part) => part);
  const breadcrumbs = pathParts.map((part, index) => {
    const href = "/" + pathParts.slice(0, index + 1).join("/");
    return { href, label: part };
  });
  console.log(webshop);
  return (
    <header className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-border bg-card/50">
      <div className="flex items-center gap-3 lg:gap-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0"
          onClick={onMenuClick}
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {pathname === "/" ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground text-sm">
                {webshop.store?.name ?? ""}
              </span>
              <button className="p-1 hover:bg-secondary rounded transition-colors">
                <Pencil className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((obj, ind) => (
                  <div key={ind} className="flex items-center">
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link
                          href={obj.href}
                          className="capitalize truncate max-w-20"
                        >
                          {obj.label}
                        </Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="w-4 h-4" />
          <span>Tienes preguntas?</span>
          <a
            href={`tel:${phoneNumber}`}
            className="text-primary hover:underline font-medium"
          >
            {phoneNumber}
          </a>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <HelpCircle className="w-5 h-5" />
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
                .filter((obj) => obj.llave == identifyRoute(pathname))
                .map((card, index) => (
                  <GuideCard key={index} {...card} />
                ))}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
const identifyRoute = (pathname) => {
  // Define un mapa de identificadores
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

  // Encuentra la ruta dinámica con regex
  const matchedRoute = Object.keys(routeMap).find((route) => {
    const routeRegex = new RegExp(
      `^${route
        .replace(/\[.*?\]/g, "([^/]+)") // Reemplaza `[param]` por un patrón dinámico
        .replace(/\//g, "\\/")}$`,
    );
    return routeRegex.test(pathname);
  });

  return routeMap[matchedRoute] || "Unknown Route";
};
