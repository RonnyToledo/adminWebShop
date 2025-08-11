"use client";
import React, { useContext, useState } from "react";
import Link from "next/link";
import dataCards from "@/components/json/card.json";
import { usePathname, useRouter } from "next/navigation";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "../ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
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

export default function HeaderAdmin({ ThemeContext }) {
  const pathname = usePathname();

  const pathParts = pathname.split("/").filter((part) => part);
  const breadcrumbs = pathParts.map((part, index) => {
    const href = "/" + pathParts.slice(0, index + 1).join("/");
    return { href, label: part };
  });

  return (
    <div className="flex sticky top-0 w-full flex-col backdrop-blur-lg z-[10]">
      <div className="flex flex-col sm:gap-4 p-2">
        <header className="sticky flex justify-between top-0 z-30 h-14 items-center gap-4 border-b sm:static sm:h-auto sm:border-0 backdrop-blur-lg ">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            {pathname === "/" ? (
              <div className=" mx-auto  items-end gap-0 md:gap-2 grid grid-cols-1 md:grid-cols-2">
                <h1 className="text-base md:text-2xl font-semibold text-gray-900">
                  Bienvenido
                </h1>
                <div className="text-xs md:text-sm text-gray-600">
                  Tienes preguntas?
                  <Link
                    href={"https://wa.me/5352489105"}
                    className="text-blue-600 hover:underline"
                  >
                    <span className="font-medium">+53 52489105</span>
                  </Link>
                </div>
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
          <div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full p-2">
                  <InfoOutlinedIcon />
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
        </header>
      </div>
    </div>
  );
}

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
                <ul className="list-disc space-y-2 pl-6 text-gray-500 dark:text-gray-400">
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
const identifyRoute = (pathname) => {
  // Define un mapa de identificadores
  const routeMap = {
    "/category/[uid]": "Category UID",
    "/category": "Category",
    "/codeDiscount": "Code Discount",
    "/configuracion/domicilios": "Configuración Domicilios",
    "/guia": "Guía",
    "/configuracion": "Configuracion",
    "/header": "Header",
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
        .replace(/\//g, "\\/")}$`
    );
    return routeRegex.test(pathname);
  });

  return routeMap[matchedRoute] || "Unknown Route";
};
