"use client";
import React, { useContext, useState } from "react";
import Link from "next/link";
import navLinks from "@/components/json/link.json"; // ruta donde esté guardado el JSON
import dataCards from "@/components/json/card.json";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { usePathname, useRouter } from "next/navigation";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import PreviewRoundedIcon from "@mui/icons-material/PreviewRounded";
import DatasetLinkedRoundedIcon from "@mui/icons-material/DatasetLinked";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import AppRegistrationRoundedIcon from "@mui/icons-material/AppRegistrationRounded";
import ExtensionOffRoundedIcon from "@mui/icons-material/ExtensionOffRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import ColorLensRoundedIcon from "@mui/icons-material/ColorLensRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import AppSettingsAltRoundedIcon from "@mui/icons-material/AppSettingsAltRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import AlignHorizontalLeftRoundedIcon from "@mui/icons-material/AlignHorizontalLeftRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ListIcon from "@mui/icons-material/List";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "../ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  SheetTrigger,
  SheetContent,
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import data from "@/components/json/card.json";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

const iconMap = {
  HomeRoundedIcon,
  PreviewRoundedIcon,
  DatasetLinkedRoundedIcon,
  CategoryRoundedIcon,
  AddCircleRoundedIcon,
  ListIcon,
  AppRegistrationRoundedIcon,
  ExtensionOffRoundedIcon,
  EditNoteRoundedIcon,
  ColorLensRoundedIcon,
  AttachMoneyRoundedIcon,
  AppSettingsAltRoundedIcon,
  LogoutRoundedIcon,
  AlignHorizontalLeftRoundedIcon,
};

export default function HeaderAdmin({ ThemeContext }) {
  const { toast } = useToast();
  const { webshop } = useContext(ThemeContext);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const Log_Out = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_PATH}/api/login`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/");
      } else {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Error Cerrando Sesion",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        variant: "destructive",
        description: `error: ${error.message}`,
      });
      console.error("Error en la respuesta:", error);
    }
  };

  const renderLink = (link, index) => {
    if (
      link.condition &&
      ((link.condition.plan &&
        !link.condition.plan.includes(webshop.store?.plan)) ||
        (link.condition.theme && !webshop.store?.theme) ||
        (link.condition.CodePromo && !webshop.store?.CodePromo))
    ) {
      return null;
    }

    const Icon = iconMap[link.icon] || HomeRoundedIcon;

    return link.separator ? (
      <Separator key={index} />
    ) : (
      <TooltipProvider key={index}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={link.href || pathname}
              className="flex items-center rounded-lg text-gray-500 px-1 py-2 transition-all hover:text-gray-700 dark:text-gray-50 dark:hover:text-gray-50"
              onClick={link.action === "Log_Out" ? Log_Out : null}
            >
              <Icon />
              <span className="sr-only">{link.label}</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{link.label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderLinkNav = (link, index) => {
    if (
      link.condition &&
      ((link.condition.plan &&
        !link.condition.plan.includes(webshop.store?.plan)) ||
        (link.condition.theme && !webshop.store?.theme) ||
        (link.condition.CodePromo && !webshop.store?.CodePromo))
    ) {
      return null;
    }

    const Icon = iconMap[link.icon] || HomeRoundedIcon;

    return link.separator ? (
      <Separator key={index} />
    ) : (
      <TooltipProvider key={index}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={link.href || pathname}
              className="flex items-center rounded-lg text-gray-500 px-1 gap-2 py-2 transition-all hover:text-gray-700 dark:text-gray-50 dark:hover:text-gray-50"
              onClick={() => {
                if (link.action === "Log_Out") {
                  Log_Out();
                }
                setIsOpen(false);
              }}
            >
              <Icon />
              <span>{link.label}</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{link.label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const pathParts = pathname.split("/").filter((part) => part);
  const breadcrumbs = pathParts.map((part, index) => {
    const href = "/" + pathParts.slice(0, index + 1).join("/");
    return { href, label: part };
  });

  return (
    <div className="flex sticky top-0 w-full flex-col bg-muted/40 z-[10]">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col items-center gap-2 px-2 sm:py-5">
          {navLinks.map(renderLink)}
        </nav>
      </aside>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky flex justify-between top-0 z-30 h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <div className="flex items-center gap-4">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="sm:hidden">
                  <AlignHorizontalLeftRoundedIcon />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sm:max-w-xs">
                <SheetHeader>
                  <SheetTitle>Administración</SheetTitle>
                  <SheetDescription>
                    Edite su tienda a su gusto
                  </SheetDescription>
                </SheetHeader>
                <nav className="grid gap-2 text-lg font-medium">
                  {navLinks.map(renderLinkNav)}
                </nav>
              </SheetContent>
            </Sheet>
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
                  <DialogTitle>Edit profile</DialogTitle>
                  <DialogDescription></DialogDescription>
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
    "/admin/category/[uid]": "Category UID",
    "/admin/category": "Category",
    "/admin/codeDiscount": "Code Discount",
    "/admin/configuracion/domicilios": "Configuración Domicilios",
    "/admin/guia": "Guía",
    "/admin/configuracion": "Configuracion",
    "/admin/header": "Header",
    "/admin/newProduct": "New Product",
    "/admin/orders": "Orders",
    "/admin/products/[specific]": "Product Specific",
    "/admin/products": "Products",
    "/admin": "Dashboard",
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
