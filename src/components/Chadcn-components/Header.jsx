"use client";
import React, { useState, useEffect, useContext } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "../ui/label";
import Image from "next/image";
import ConfimationOut from "../globalFunction/confimationOut";
import { FromData } from "../globalFunction/fromData";
import ProfileHeader from "../profile-header";
import WeeklyAvailability from "../WeeklyAvailability";

export default function Header({ ThemeContext }) {
  const { webshop } = useContext(ThemeContext);
  const [store, setStore] = useState({
    comentario: [],
    categoria: [],
    moneda: [],
    horario: [],
  });

  useEffect(() => setStore(webshop.store), [webshop]);

  const handleChange = (field, value) =>
    setStore((prev) => {
      return { ...prev, [field]: value };
    });
  return (
    <main>
      <FromData store={store} ThemeContext={ThemeContext}>
        <ProfileHeader store={store} setStore={setStore} />
        <div className="mx-6">
          <TextInput
            label="Nombre del negocio"
            value={store.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </div>
        <div className="mx-6">
          <TextAreaInput
            label="Mensaje de Bienvenida"
            value={store.parrrafo}
            onChange={(e) => handleChange("parrrafo", e.target.value)}
          />
        </div>
        <div className="mx-6">
          <WeeklyAvailability
            horario={store.horario}
            onHorarioChange={(horario) => handleChange("horario", horario)}
          />
        </div>
      </FromData>
      <ConfimationOut action={hasPendingChanges(store, webshop.store)} />
    </main>
  );
}

const TextInput = ({ label, value, onChange }) => (
  <div className="space-y-2 mt-4">
    <Label>{label}</Label>
    <Input type="text" value={value} onChange={onChange} />
  </div>
);

const TextAreaInput = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Textarea value={value} rows={5} onChange={onChange} />
  </div>
);

// Utilidades
const hasPendingChanges = (data, store) =>
  JSON.stringify(data) !== JSON.stringify(store);
