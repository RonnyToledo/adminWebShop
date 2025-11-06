"use client";
import React, { useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import navLinks from "@/components/json/link.json"; // ruta donde esté guardado el JSON
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
import BarChartIcon from "@mui/icons-material/BarChart";
import ListIcon from "@mui/icons-material/List";
import AddCardIcon from "@mui/icons-material/AddCard";
import EditIcon from "@mui/icons-material/Edit";
import GroupIcon from "@mui/icons-material/Group";
import Image from "next/image";
import { ChevronUp, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {logoApp} from "@/utils/image"
import { logOut } from "@/components/globalFunction/loginFunction";
import { Settings, Eye } from "lucide-react";

const iconMap = {
  HomeRoundedIcon,
  PreviewRoundedIcon,
  EditIcon,
  DatasetLinkedRoundedIcon,
  CategoryRoundedIcon,
  BarChartIcon,
  AddCardIcon,
  AddCircleRoundedIcon,
  ListIcon,
  GroupIcon,
  AppRegistrationRoundedIcon,
  ExtensionOffRoundedIcon,
  EditNoteRoundedIcon,
  ColorLensRoundedIcon,
  AttachMoneyRoundedIcon,
  AppSettingsAltRoundedIcon,
  Settings,
  Eye,
  LogoutRoundedIcon,
  AlignHorizontalLeftRoundedIcon,
};

export default function AppSidebar({ ThemeContext }) {
  const { webshop } = useContext(ThemeContext);
  const pathname = usePathname();
  const router = useRouter();

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
    return (
      <SidebarMenuItem
        key={index}
        className="flex flex-row items-center justify-center"
      >
        <SidebarMenuButton
          asChild
          tooltip={link.label}
          className="p-1 h-fit group-data-[collapsible=icon]:!p-1"
        >
          <Link
            href={link.href || pathname}
            className="p-0 flex items-center rounded-lg text-slate-500 gap-2 transition-all hover:text-slate-700 "
          >
            <Icon className="size-6" />
            <span>{link.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-12">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm">
              <div>
                <Link href="/">
                  <Image
                    width={50}
                    height={50}
                    src={logoApp}
                    alt={webshop?.store?.name || "Store Image"}
                    className="object-cover aspect-square rounded-lg"
                  />
                </Link>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">rouAdmin</span>
                <span className="truncate text-xs">
                  {" "}
                  by <Link href="https://roudev.vercel.app">rouDev</Link>
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navLinks.map((link, index) => {
          {
            return link.separator ? (
              <Separator key={index} />
            ) : (
              <SidebarGroup key={index} className="p-1">
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1">
                    {link.links.map(renderLinkNav)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          }
        })}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={
                        webshop?.user?.image ||
                        "https://res.cloudinary.com/dbgnyc842/image/upload/v1753625183/Identidades/%C3%8Dcono-de-usuario-minimalista-en-gris_z11vpk.jpg"
                      }
                      alt={webshop?.user?.name}
                    />
                    <AvatarFallback className="rounded-lg">
                      {webshop?.user?.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {webshop?.user?.name}
                    </span>
                    <span className="truncate text-xs">
                      {webshop?.user?.email}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={() => router.push("/guia")}>
                  <PreviewRoundedIcon className="mr-2 h-4 w-4" />
                  <span>Guia</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => router.push("/configuracion")}>
                  <AppSettingsAltRoundedIcon className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => logOut(router)}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
