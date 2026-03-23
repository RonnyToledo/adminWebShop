"use client";
import React, { useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BookIcon from "@mui/icons-material/Book";
import { logoApp } from "@/utils/image";
import { Settings, Eye, ChevronDown, X } from "lucide-react";
import { authService } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const iconMap = {
  HomeRoundedIcon,
  PreviewRoundedIcon,
  EditIcon,
  DatasetLinkedRoundedIcon,
  CategoryRoundedIcon,
  BarChartIcon,
  BookIcon,
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

export default function AppSidebar({ ThemeContext, isOpen, onClose }) {
  const [activeItem, setActiveItem] = useState("/");
  const { webshop } = useContext(ThemeContext);
  const pathname = usePathname();
  const router = useRouter();
  const handleSignOut = async () => {
    try {
      await authService.signOut();
      router.refresh();
      await new Promise((resolve) => setTimeout(resolve, 500));

      router.push("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose?.();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleNavClick = (href) => {
    setActiveItem(href);
    onClose?.();
  };

  return (
    <>
      <div className="sticky top-0 h-fit z-[50]">
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed top-0 lg:static inset-y-0 left-0 z-[51] flex flex-col h-screen w-72 lg:w-64 bg-sidebar border-r border-sidebar-border",
            "transform transition-transform duration-300 ease-in-out lg:transform-none",
            isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
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
            <div>
              <h1 className="font-semibold text-sidebar-foreground">
                Roumenu - Admin
              </h1>
              <p className="text-xs text-muted-foreground">
                by <Link href="https://roudev.vercel.app">rouDev</Link>
              </p>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors"
              aria-label="Cerrar menu"
            >
              <X className="w-5 h-5 text-sidebar-foreground" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {navLinks.map((section, sectionIndex) => (
              <div
                key={sectionIndex}
                className={cn(
                  sectionIndex > 0 &&
                    "mt-4 pt-4 border-t border-sidebar-border/50",
                )}
              >
                {section.group && (
                  <h3 className="px-3 mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {section.group}
                  </h3>
                )}
                <ul className="space-y-1">
                  {section.links.map((item) => {
                    const Icon = iconMap[item.icon] || HomeRoundedIcon;
                    const isActive = activeItem === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setActiveItem(item.href)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-primary font-medium"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-4 h-4",
                              isActive && "text-primary",
                            )}
                          />
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-3 border-t border-sidebar-border">
            <button
              onClick={() => handleSignOut()}
              className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors"
            >
              <Avatar className="w-9 h-9">
                <AvatarImage
                  src={
                    webshop?.user?.image ||
                    "https://res.cloudinary.com/dbgnyc842/image/upload/v1753625183/Identidades/%C3%8Dcono-de-usuario-minimalista-en-gris_z11vpk.jpg"
                  }
                  alt={webshop?.user?.name}
                />
                <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
                  {webshop?.user?.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {webshop?.user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {webshop?.user?.email}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
