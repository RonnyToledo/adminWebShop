"use client";
import React from "react";

import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { SheetTrigger, SheetContent, Sheet } from "@/components/ui/sheet";
import { useState, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Separator } from "../ui/separator";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import AppRegistrationRoundedIcon from "@mui/icons-material/AppRegistrationRounded";
import ExtensionOffRoundedIcon from "@mui/icons-material/ExtensionOffRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import DatasetLinkedRoundedIcon from "@mui/icons-material/DatasetLinkedRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import ColorLensRoundedIcon from "@mui/icons-material/ColorLensRounded";
import AppSettingsAltRoundedIcon from "@mui/icons-material/AppSettingsAltRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import AlignHorizontalLeftRoundedIcon from "@mui/icons-material/AlignHorizontalLeftRounded";
import PreviewRoundedIcon from "@mui/icons-material/PreviewRounded";

export default function HeaderAdmin({ ThemeContext }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const Log_Out = async () => {
    const res = await fetch("/api/login", {
      method: "DELETE",
    });

    if (res.ok) {
      // Redirigir al usuario a la página de inicio o login
      router.replace("/");
    } else {
      const data = await res.json();
      console.error("Error al cerrar sesión:", data.error);
    }
  };

  const pathParts = pathname.split("/").filter((part) => part);
  const breadcrumbs = pathParts.map((part, index) => {
    const href = "/" + pathParts.slice(0, index + 1).join("/");
    return { href, label: part };
  });

  return (
    <>
      <div className="flex sticky top-0 w-full flex-col bg-muted/40 z-[10]">
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
          <nav className="flex flex-col items-center gap-2 px-2 sm:py-5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    className="flex items-center rounded-lg  text-gray-500 px-1 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    href="/admin/"
                    onClick={() => setIsOpen(false)}
                  >
                    <HomeRoundedIcon />
                    <span className="sr-only">Inicio</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Inicio</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {(webshop.store?.plan == "pro" ||
              webshop.store?.plan == "custom") && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/admin/guia"
                      className="flex items-center rounded-lg  text-gray-500 px-1 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    >
                      <PreviewRoundedIcon />
                      <span className="sr-only">Guia</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">Guia</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin/link"
                    className="flex items-center rounded-lg  text-gray-500 px-1 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                  >
                    <DatasetLinkedRoundedIcon />
                    <span className="sr-only">Enlaces</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Enlaces</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Separator />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin/category"
                    className="flex items-center rounded-lg  text-gray-500 px-1 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                  >
                    <CategoryRoundedIcon />
                    <span className="sr-only">Editar Categoria</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Editar Categoria</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    className="flex items-center rounded-lg  text-gray-500 px-1 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    href="/admin/newProduct"
                  >
                    <AddCircleRoundedIcon />
                    <span className="sr-only"> Nuevo Producto</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right"> Nuevo Producto</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin/products"
                    className="flex items-center rounded-lg  text-gray-500 px-1 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                  >
                    <AppRegistrationRoundedIcon />
                    <span className="sr-only"> Editar Productos</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right"> Editar Productos</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin/productsOffStock"
                    className="flex items-center rounded-lg  text-gray-500 px-1 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                  >
                    <ExtensionOffRoundedIcon />
                    <span className="sr-only">Productos Agotados</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Productos Agotados</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Separator />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin/header"
                    className="flex items-center rounded-lg  text-gray-500 px-1 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                  >
                    <EditNoteRoundedIcon />
                    <span className="sr-only">Editar Info</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Editar Info</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {webshop.store?.plan == "a" && webshop.store?.theme && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/admin/theme"
                      className="flex items-center rounded-lg  text-gray-500 px-1 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    >
                      <ColorLensRoundedIcon />
                      <span className="sr-only">Temas</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right"> Editar Temas</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {webshop.store?.plan == "custom" && webshop.store?.CodePromo && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/admin/codeDiscount"
                      className="flex items-center rounded-lg  text-gray-500 px-1 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    >
                      <AttachMoneyRoundedIcon />
                      <span className="sr-only">Marketing</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">Marketing</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </nav>
          <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin/configuracion"
                    className="flex items-center rounded-lg  text-gray-500 px-1 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                  >
                    <AppSettingsAltRoundedIcon />
                    <span className="sr-only">Configuracion</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/"
                    className="flex items-center rounded-lg  text-gray-500 px-1 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    onClick={Log_Out}
                  >
                    <LogoutRoundedIcon />
                    <span className="sr-only">Cerrar Session</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Cerrar Session</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </nav>
        </aside>
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  onClick={() => setIsOpen(true)}
                  size="icon"
                  variant="outline"
                  className="sm:hidden"
                >
                  <AlignHorizontalLeftRoundedIcon />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sm:max-w-xs">
                <nav className="grid gap-2 text-lg font-medium">
                  <Link
                    className="flex items-center gap-3 rounded-lg  text-gray-500 px-3 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    href="/admin/"
                    onClick={() => setIsOpen(false)}
                  >
                    <HomeRoundedIcon />
                    Inicio
                  </Link>
                  {(webshop.store?.plan == "pro" ||
                    webshop.store?.plan == "custom") && (
                    <Link
                      href="/admin/guia"
                      className="flex items-center gap-3 rounded-lg  text-gray-500 px-3 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                      onClick={() => setIsOpen(false)}
                    >
                      <PreviewRoundedIcon />
                      Guia
                    </Link>
                  )}
                  <Link
                    href="/admin/link"
                    className="flex items-center gap-3 rounded-lg  text-gray-500 px-3 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <DatasetLinkedRoundedIcon />
                    Enlaces
                  </Link>
                  <Separator />
                  <Link
                    href="/admin/category"
                    className="flex items-center gap-3 rounded-lg  text-gray-500 px-3 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <CategoryRoundedIcon />
                    Editar Categoria
                  </Link>
                  <Link
                    className="flex items-center gap-3 rounded-lg  text-gray-500 px-3 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    href="/admin/newProduct"
                    onClick={() => setIsOpen(false)}
                  >
                    <AddCircleRoundedIcon />
                    Nuevo Producto
                  </Link>
                  <Link
                    href="/admin/products"
                    className="flex items-center gap-3 rounded-lg  text-gray-500 px-3 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <AppRegistrationRoundedIcon />
                    Editar Productos
                  </Link>

                  <Link
                    href="/admin/productsOffStock"
                    className="flex items-center gap-3 rounded-lg  text-gray-500 px-3 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <ExtensionOffRoundedIcon />
                    Productos Agotados
                  </Link>
                  <Separator />
                  <Link
                    href="/admin/header"
                    className="flex items-center gap-3 rounded-lg  text-gray-500 px-3 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <EditNoteRoundedIcon />
                    Editar Info
                  </Link>
                  {webshop.store?.plan == "custom" &&
                    webshop.store?.CodePromo && (
                      <Link
                        href="/admin/codeDiscount"
                        className="flex items-center gap-3 rounded-lg  text-gray-500 px-3 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                        onClick={() => setIsOpen(false)}
                      >
                        <AttachMoneyRoundedIcon />
                        Marketing
                      </Link>
                    )}
                  <Link
                    href="/admin/configuracion"
                    className="flex items-center gap-3 rounded-lg  text-gray-500 px-3 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <AppSettingsAltRoundedIcon />
                    Configuracion
                  </Link>
                  {webshop.store?.plan == "a" && webshop.store?.theme && (
                    <Link
                      href="/admin/theme"
                      className="flex items-center gap-3 rounded-lg  text-gray-500 px-3 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                      onClick={() => setIsOpen(false)}
                    >
                      <ColorLensRoundedIcon />
                      Temas
                    </Link>
                  )}
                  <Separator />

                  <Link
                    href="/"
                    className="flex items-center gap-3 rounded-lg  text-gray-500 px-3 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    onClick={Log_Out}
                  >
                    <LogoutRoundedIcon />
                    Cerrar Sesion
                  </Link>
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
                          className="capitalize truncate  max-w-20"
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
          </header>
        </div>
      </div>
    </>
  );
}
