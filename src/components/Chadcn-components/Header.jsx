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
  console.log(store);
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

// Componentes auxiliares

const ImageUpload = ({ image, onChange }) => {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        <Label htmlFor="cover-photo">Cover Photo</Label>
        <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
          <div className="space-y-1 text-center">
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <label className="relative cursor-pointer bg-white font-medium text-indigo-600 hover:text-indigo-500">
              <span>Subir una imagen</span>
              <Input
                className="sr-only"
                id="cover-photo"
                name="cover-photo"
                type="file"
                onChange={(e) => onChange(e.target.files[0])}
              />
            </label>
            <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
          </div>
        </div>
      </div>
      {image && (
        <Image
          alt="Logo"
          className="rounded-xl mx-auto my-1"
          height={200}
          width={150}
          src={image || URL.createObjectURL(image)}
        />
      )}
    </div>
  );
};

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

const HorarioControl = ({ horario, onHorarioChange }) => (
  <div className="space-y-4">
    <Label className="text-lg">Horarios de Trabajo</Label>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-2">
      {horario.map((obj, ind) => (
        <HorarioItem
          key={ind}
          dia={obj.dia}
          horario={obj}
          onHorarioChange={(updated) => {
            const newHorario = [...horario];
            newHorario[ind] = updated;
            onHorarioChange(newHorario);
          }}
        />
      ))}
    </div>
  </div>
);

const HorarioItem = ({ dia, horario, onHorarioChange }) => (
  <div className="border p-3">
    <Label className="block font-medium text-gray-700">{dia}</Label>
    <RadioGroup defaultValue={getHorarioDefault(horario)}>
      <RadioOption
        label="24 Horas"
        value="option-one"
        onClick={() => onHorarioChange({ dia, cierre: 24, apertura: 0 })}
      />
      <RadioOption
        label="Cerrado"
        value="option-two"
        onClick={() => onHorarioChange({ dia, cierre: 0, apertura: 0 })}
      />
      <RadioOption
        label="Custom"
        value="option-three"
        onClick={() => onHorarioChange({ dia, cierre: 23, apertura: 1 })}
      />
    </RadioGroup>
    {horario.apertura !== 0 && (
      <HorarioTimeSelector
        dia={dia}
        horario={horario}
        onHorarioChange={onHorarioChange}
      />
    )}
  </div>
);

const HorarioTimeSelector = ({ dia, horario, onHorarioChange }) => (
  <div className="grid grid-cols-2 gap-4 p-5">
    <TimeInput
      label="Opening Time"
      value={formatTime(horario.apertura)}
      onChange={(time) =>
        onHorarioChange({ dia, cierre: horario.cierre, apertura: time })
      }
    />
    <TimeInput
      label="Closing Time"
      value={formatTime(horario.cierre)}
      onChange={(time) =>
        onHorarioChange({ dia, cierre: time, apertura: horario.apertura })
      }
    />
  </div>
);

const RadioOption = ({ label, value, onClick }) => (
  <div className="flex items-center space-x-2 p-3">
    <RadioGroupItem value={value} onClick={onClick} />
    <Label>{label}</Label>
  </div>
);

const TimeInput = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Input
      type="time"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value.split(":")[0], 10))}
    />
  </div>
);

// Utilidades
const hasPendingChanges = (data, store) =>
  JSON.stringify(data) !== JSON.stringify(store);
const getHorarioDefault = ({ apertura, cierre }) =>
  cierre === 0 && apertura === 0
    ? "option-two"
    : cierre === 24
    ? "option-one"
    : "option-three";
const formatTime = (time) => (time >= 10 ? `${time}:00` : `0${time}:00`);

const UploadIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
