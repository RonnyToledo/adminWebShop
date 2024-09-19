"use client";
import React, { useEffect } from "react";
import { LogOut, Unlink2, CircleArrowOutUpRight } from "lucide-react";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  File,
  Home,
  LineChart,
  ListFilter,
  MoreHorizontal,
  Package,
  Package2,
  PanelLeft,
  PlusCircle,
  Palette,
  Search,
  CircleOff,
  Settings,
  ShoppingCart,
  Users2,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { SheetTrigger, SheetContent, Sheet } from "@/components/ui/sheet";
import { useState, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supa";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Separator } from "../ui/separator";
import Welcome from "../component/welcome";

export default function HeaderAdmin({ ThemeContext }) {
  const { webshop, setWebshop } = useContext(ThemeContext);
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const Log_Out = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert(error);
    } else {
      router.replace("/");
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
          <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
            <Link
              href="#"
              className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
            >
              <Package2 className="h-4 w-4 transition-all group-hover:scale-110" />
              <span className="sr-only">Acme Inc</span>
            </Link>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    className="flex items-center gap-3 rounded-lg  text-gray-500 px-3 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    href="/admin/"
                    onClick={() => setIsOpen(false)}
                  >
                    <Home className="h-5 w-5" />
                    <span className="sr-only">Inicio</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Inicio</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {webshop.store.plan == "pro" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/admin/guia"
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                    >
                      <CatIcon className="h-4 w-4" />
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                  >
                    <Unlink2 className="h-4 w-4" />
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                  >
                    <CatIcon className="h-4 w-4" />
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
                    className="flex items-center gap-3 rounded-lg  text-gray-500 px-3 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    href="/admin/newProduct"
                  >
                    <PlusIcon className="h-4 w-4" />
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                  >
                    <PackageIcon className="h-4 w-4" />
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                  >
                    <CircleOff className="h-4 w-4" />
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                  >
                    <HeadingIcon className="h-4 w-4" />
                    <span className="sr-only">Editar Info</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Editar Info</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin/theme"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                  >
                    <Palette className="h-4 w-4" />
                    <span className="sr-only">Temas</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right"> Editar Temas</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </nav>
          <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin/configuracion"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                  >
                    <SettingsIcon className="h-4 w-4" />
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                    onClick={Log_Out}
                  >
                    <LogOut className="h-4 w-4" />
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
                  <PanelLeft className="h-5 w-5" />
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
                    <Home className="h-5 w-5" />
                    Inicio
                  </Link>
                  {webshop.store.plan == "pro" && (
                    <Link
                      href="/admin/guia"
                      className="flex items-center gap-3 rounded-lg  text-gray-500 px-3 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                      onClick={() => setIsOpen(false)}
                    >
                      <CatIcon className="h-4 w-4" />
                      Guia
                    </Link>
                  )}
                  <Link
                    href="/admin/link"
                    className="flex items-center gap-3 rounded-lg  text-gray-500 px-3 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <Unlink2 className="h-4 w-4" />
                    Enlaces
                  </Link>
                  <Separator />
                  <Link
                    href="/admin/category"
                    className="flex items-center gap-3 rounded-lg  text-gray-500 px-3 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <CatIcon className="h-4 w-4" />
                    Editar Categoria
                  </Link>
                  <Link
                    className="flex items-center gap-3 rounded-lg  text-gray-500 px-3 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    href="/admin/newProduct"
                    onClick={() => setIsOpen(false)}
                  >
                    <PlusIcon className="h-4 w-4" />
                    Nuevo Producto
                  </Link>
                  <Link
                    href="/admin/products"
                    className="flex items-center gap-3 rounded-lg  text-gray-500 px-3 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <PackageIcon className="h-4 w-4" />
                    Editar Productos
                  </Link>

                  <Link
                    href="/admin/productsOffStock"
                    className="flex items-center gap-3 rounded-lg  text-gray-500 px-3 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <CircleOff className="h-4 w-4" />
                    Productos Agotados
                  </Link>
                  <Separator />
                  <Link
                    href="/admin/header"
                    className="flex items-center gap-3 rounded-lg  text-gray-500 px-3 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <HeadingIcon className="h-4 w-4" />
                    Editar Info
                  </Link>
                  <Link
                    href="/admin/configuracion"
                    className="flex items-center gap-3 rounded-lg  text-gray-500 px-3 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <SettingsIcon className="h-4 w-4" />
                    Configuracion
                  </Link>
                  <Link
                    href="/admin/theme"
                    className="flex items-center gap-3 rounded-lg  text-gray-500 px-3 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <Palette className="h-4 w-4" />
                    Temas
                  </Link>
                  <Separator />

                  <Link
                    href="/"
                    className="flex items-center gap-3 rounded-lg  text-gray-500 px-3 py-2 transition-all hover:text-gray-700  dark:text-gray-50 dark:hover:text-gray-50"
                    onClick={Log_Out}
                  >
                    <LogOut className="h-4 w-4" />
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

function CatIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z" />
      <path d="M8 14v.5" />
      <path d="M16 14v.5" />
      <path d="M11.25 16.25h1.5L12 17l-.75-.75Z" />
    </svg>
  );
}

function HeadingIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 12h12" />
      <path d="M6 20V4" />
      <path d="M18 20V4" />
    </svg>
  );
}

function HomeIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function MenuIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function Package2Icon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
      <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
      <path d="M12 3v6" />
    </svg>
  );
}

function PackageIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function PlusIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function SettingsIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
