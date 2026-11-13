"use client";
// ─── AppSidebar.jsx ───────────────────────────────────────────────────────────
// Igual al original, con dos cambios:
//  1. El footer de usuario es reemplazado por <AccountSwitcher />
//  2. handleSignOut se pasa como prop a AccountSwitcher

import React, { useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import navLinks from "@/components/json/link.json";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import PreviewRoundedIcon from "@mui/icons-material/PreviewRounded";
import DatasetLinkedRoundedIcon from "@mui/icons-material/DatasetLinkedRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import AppRegistrationRoundedIcon from "@mui/icons-material/AppRegistrationRounded";
import ExtensionOffRoundedIcon from "@mui/icons-material/ExtensionOffRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import ColorLensRoundedIcon from "@mui/icons-material/ColorLensRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import ChecklistIcon from "@mui/icons-material/Checklist";
import AppSettingsAltRoundedIcon from "@mui/icons-material/AppSettingsAltRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import AlignHorizontalLeftRoundedIcon from "@mui/icons-material/AlignHorizontalLeftRounded";
import BarChartIcon from "@mui/icons-material/BarChart";
import ListIcon from "@mui/icons-material/List";
import AddCardIcon from "@mui/icons-material/AddCard";
import EditIcon from "@mui/icons-material/Edit";
import GroupIcon from "@mui/icons-material/Group";
import BookIcon from "@mui/icons-material/Book";
import { Settings, Eye, X } from "lucide-react";
import { authService } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { can, NAV_PERMISSIONS } from "@/lib/permissions";
import AccountSwitcher from "@/components/AccountSwitcher";

const iconMap = {
  ChecklistIcon,
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
  const storeRole = webshop?.store_role ?? "owner";

  useEffect(() => {
    setActiveItem(pathname);
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      document.cookie = "sb-access-token=; path=/; max-age=0";
      document.cookie = "sb-refresh-token=; path=/; max-age=0";
      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push("/login");
    } catch (error) {
      console.error("[handleSignOut] Error:", error);
      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push("/login");
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) onClose?.();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const filteredNavLinks = navLinks
    .map((section) => {
      const requiredAction = NAV_PERMISSIONS[section.group ?? ""] ?? "read";
      if (!can(storeRole, requiredAction)) return null;
      const links = section.links.filter(
        (item) => !item.requiredAction || can(storeRole, item.requiredAction),
      );
      return links.length ? { ...section, links } : null;
    })
    .filter(Boolean);

  return (
    <>
      {/* Overlay móvil */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 top-14 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed bottom-0 left-0 top-14 z-[49] flex h-[calc(100dvh-3.5rem)] w-[220px] shrink-0 flex-col lg:sticky lg:top-14",
          "bg-slate-50 border-r border-slate-200",
          "transform transition-transform duration-300 ease-in-out lg:transform-none",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {filteredNavLinks.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.group && (
                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {section.group}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.links.map((item) => {
                  const Icon = iconMap[item.icon] || HomeRoundedIcon;
                  const isActive =
                    activeItem === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => {
                          setActiveItem(item.href);
                          onClose?.();
                        }}
                        className={cn(
                          "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                          isActive
                            ? "bg-slate-700 text-white shadow-sm shadow-slate-300"
                            : "text-slate-500 hover:bg-slate-200 hover:text-slate-800",
                        )}
                      >
                        <Icon
                          className={cn(
                            "shrink-0",
                            isActive ? "text-white" : "text-slate-400",
                          )}
                          style={{ fontSize: 18 }}
                        />
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className={cn(
                              "ml-auto px-2 py-0.5 text-[10px] font-semibold rounded-full",
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-slate-200 text-slate-600",
                            )}
                          >
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

        {/* ── Footer con AccountSwitcher (reemplaza la fila de usuario original) ── */}
        <div className="sticky lg:static bottom-0 p-3 border-t border-slate-200 bg-slate-50">
          <AccountSwitcher webshop={webshop} onSignOut={handleSignOut} />
        </div>
      </aside>
    </>
  );
}
