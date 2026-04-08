"use client";
import { useContext, useEffect, useState } from "react";
import { ThemeContext } from "@/context/useContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  Plus,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Phone,
  Mail,
  MessageCircle,
  Share2,
  BookUser,
} from "lucide-react";
import { FromData } from "@/components/globalFunction/fromData";
import { sileo } from "sileo";
import PlanGuard from "../Planes/PlanGuard";

// ─── Mapas de iconos / etiquetas ─────────────────────────────────────────────

const RED_META = {
  insta: { icon: Instagram, label: "Instagram", placeholder: "@usuario" },
  face: { icon: Facebook, label: "Facebook", placeholder: "@usuario" },
  twitter: { icon: Twitter, label: "Twitter / X", placeholder: "@usuario" },
  linkenid: { icon: Linkedin, label: "LinkedIn", placeholder: "@usuario" },
};

const CONTACT_META = {
  wa: { icon: MessageCircle, label: "WhatsApp", placeholder: "Ej: 5355xxxxxx" },
  cell: { icon: Phone, label: "Teléfono", placeholder: "Ej: +53 5xxxxxxx" },
  mail: { icon: Mail, label: "Email", placeholder: "correo@ejemplo.com" },
};

const MAX_ITEMS = 3;

// ─── Item de lista ────────────────────────────────────────────────────────────

function ItemRow({
  meta,
  primaryText,
  secondaryText,
  onRemove,
  isDefault = false,
}) {
  const Icon = meta?.icon ?? Phone;
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border hover:bg-muted/40 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {primaryText}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {secondaryText}
          </p>
        </div>
      </div>
      {isDefault ? (
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
          Por defecto
        </span>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// ─── Formulario de agregar ────────────────────────────────────────────────────

function AddForm({
  title,
  selectOptions,
  fields,
  formData,
  setFormData,
  onAdd,
  limit,
  currentCount,
}) {
  const atLimit = currentCount >= limit;
  return (
    <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <div className="space-y-3">
        <Select
          value={formData.tipo || ""}
          onValueChange={(v) => setFormData({ ...formData, tipo: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona tipo" />
          </SelectTrigger>
          <SelectContent>
            {selectOptions.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {fields.map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-1">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <Input
              placeholder={placeholder}
              value={formData[key] || ""}
              onChange={(e) =>
                setFormData({ ...formData, [key]: e.target.value })
              }
            />
          </div>
        ))}

        <Button
          type="button"
          onClick={onAdd}
          disabled={atLimit}
          className="w-full gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Agregar
          {atLimit && (
            <span className="text-xs opacity-70">(límite {limit})</span>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function SocialContactPage() {
  const { webshop } = useContext(ThemeContext);
  const [redes, setRedes] = useState([]);
  const [contacto, setContacto] = useState([]);
  const [newRed, setNewRed] = useState({});
  const [newContact, setNewContact] = useState({});

  useEffect(() => {
    setRedes(webshop?.store?.redes || []);
    setContacto(webshop?.store?.contacto || []);
  }, [webshop?.store?.redes, webshop?.store?.contacto]);

  function addRed() {
    if (!newRed.tipo || !newRed.url || !newRed.user) {
      sileo.error({ title: "Error", description: "Completa todos los campos" });
      return;
    }
    if (redes.length >= MAX_ITEMS) {
      sileo.error({
        title: "Límite alcanzado",
        description: `Máximo ${MAX_ITEMS} redes sociales`,
      });
      return;
    }
    setRedes([...redes, newRed]);
    setNewRed({});
  }

  function addContact() {
    if (!newContact.tipo || !newContact.url) {
      sileo.error({ title: "Error", description: "Completa todos los campos" });
      return;
    }
    if (contacto.length >= MAX_ITEMS) {
      sileo.error({
        title: "Límite alcanzado",
        description: `Máximo ${MAX_ITEMS} contactos`,
      });
      return;
    }
    setContacto([...contacto, newContact]);
    setNewContact({});
  }

  const removeRed = (i) => setRedes(redes.filter((_, idx) => idx !== i));
  const removeContact = (i) =>
    setContacto(contacto.filter((_, idx) => idx !== i));

  // Contactos por defecto del log (email y cell de store)
  const defaultContacts = [
    webshop?.store?.email && { tipo: "mail", url: webshop.store.email },
    webshop?.store?.cell && { tipo: "wa", url: String(webshop.store.cell) },
  ].filter(Boolean);

  return (
    <PlanGuard feature="theme">
      <main className="container mx-auto my-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <FromData
          store={{ ...webshop?.store, redes, contacto }}
          ThemeContext={ThemeContext}
        >
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Redes y contacto
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Hasta {MAX_ITEMS} redes sociales y {MAX_ITEMS} métodos de contacto
              adicionales
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* ── Redes sociales ─────────────────────────────────────────── */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Redes sociales</CardTitle>
                  <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {redes.length}/{MAX_ITEMS}
                  </span>
                </div>
                <CardDescription>
                  Perfiles que se mostrarán en tu tienda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AddForm
                  title="Agregar red social"
                  selectOptions={Object.entries(RED_META).map(([k, v]) => ({
                    value: k,
                    label: v.label,
                  }))}
                  fields={[
                    {
                      key: "user",
                      label: "Usuario",
                      placeholder:
                        RED_META[newRed.tipo]?.placeholder ?? "@usuario",
                    },
                    {
                      key: "url",
                      label: "URL completa",
                      placeholder: "https://...",
                    },
                  ]}
                  formData={newRed}
                  setFormData={setNewRed}
                  onAdd={addRed}
                  limit={MAX_ITEMS}
                  currentCount={redes.length}
                />

                {/* Lista */}
                <div className="space-y-2">
                  {redes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Sin redes configuradas
                    </p>
                  ) : (
                    redes.map((red, i) => (
                      <ItemRow
                        key={i}
                        meta={RED_META[red.tipo]}
                        primaryText={RED_META[red.tipo]?.label ?? red.tipo}
                        secondaryText={red.user}
                        onRemove={() => removeRed(i)}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ── Contacto ───────────────────────────────────────────────── */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <BookUser className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Contacto</CardTitle>
                  <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {contacto.length}/{MAX_ITEMS}
                  </span>
                </div>
                <CardDescription>
                  Métodos de contacto adicionales visibles en tu tienda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contactos por defecto del log */}
                {defaultContacts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Contactos del perfil (siempre activos)
                    </p>
                    {defaultContacts.map((c, i) => (
                      <ItemRow
                        key={i}
                        meta={CONTACT_META[c.tipo]}
                        primaryText={CONTACT_META[c.tipo]?.label ?? c.tipo}
                        secondaryText={c.url}
                        isDefault
                      />
                    ))}
                  </div>
                )}

                <AddForm
                  title="Agregar contacto"
                  selectOptions={Object.entries(CONTACT_META).map(([k, v]) => ({
                    value: k,
                    label: v.label,
                  }))}
                  fields={[
                    {
                      key: "url",
                      label: "URL / número / email",
                      placeholder:
                        CONTACT_META[newContact.tipo]?.placeholder ??
                        "Valor de contacto",
                    },
                  ]}
                  formData={newContact}
                  setFormData={setNewContact}
                  onAdd={addContact}
                  limit={MAX_ITEMS}
                  currentCount={contacto.length}
                />

                {/* Lista */}
                <div className="space-y-2">
                  {contacto.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Sin contactos adicionales
                    </p>
                  ) : (
                    contacto.map((c, i) => (
                      <ItemRow
                        key={i}
                        meta={CONTACT_META[c.tipo]}
                        primaryText={CONTACT_META[c.tipo]?.label ?? c.tipo}
                        secondaryText={c.url}
                        onRemove={() => removeContact(i)}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </FromData>
      </main>
    </PlanGuard>
  );
}
