"use client";
import React, { useContext, useState, useEffect } from "react";
import Link from "next/link";
import navLinks from "@/components/json/link.json"; // ruta donde esté guardado el JSON
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
import ListIcon from "@mui/icons-material/List";
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
  const { webshop } = useContext(ThemeContext);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const Log_Out = async () => {
    const res = await fetch("/api/login", { method: "DELETE" });
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

    // Obtener el ícono de iconMap o usar un ícono predeterminado
    const Icon = iconMap[link.icon] || HomeRoundedIcon;

    return link.separator ? (
      <Separator key={index} />
    ) : (
      <TooltipProvider key={index}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={link.href}
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

    // Obtener el ícono de iconMap o usar un ícono predeterminado
    const Icon = iconMap[link.icon] || HomeRoundedIcon;

    return link.separator ? (
      <Separator key={index} />
    ) : (
      <TooltipProvider key={index}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={link.href}
              className="flex items-center rounded-lg text-gray-500 px-1 gap-2 py-2 transition-all hover:text-gray-700 dark:text-gray-50 dark:hover:text-gray-50"
              onClick={
                link.action === "Log_Out"
                  ? () => {
                      Log_Out();
                      setIsOpen(false);
                    }
                  : () => setIsOpen(false)
              }
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
    <>
      <div className="flex sticky top-0 w-full flex-col bg-muted/40 z-[10]">
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
          <nav className="flex flex-col items-center gap-2 px-2 sm:py-5">
            {navLinks.map((link, index) => renderLink(link, index))}
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
                <SheetHeader>
                  <SheetTitle>Administracion</SheetTitle>
                  <SheetDescription>
                    Edite su tienda a su gusto{" "}
                  </SheetDescription>
                </SheetHeader>
                <nav className="grid gap-2 text-lg font-medium">
                  {navLinks.map((link, index) => renderLinkNav(link, index))}
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
async function fetchUserSession() {
  try {
    const res = await fetch("/api/login");
    const data = await res.json();
    if (res.ok && data?.user?.id) {
      return data;
    } else {
    }
  } catch (error) {
    console.error("Error al obtener la sesión del usuario:", error);
  }
}
