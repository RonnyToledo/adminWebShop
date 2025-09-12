// SecondaryImagesManager.jsx (fragmento completo adaptado)
"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Plus, GripVertical } from "lucide-react";
import { logoApp } from "@/utils/image";

// util: compara arrays de strings (orden y contenido)
function arraysEqual(a = [], b = []) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export default function SecondaryImagesManager({
  initialImages = [],
  onChange,
  onChangeClean,
  maxImages = 3,
}) {
  const normalize = (arr) => {
    const copy = Array.isArray(arr) ? arr.slice(0, maxImages) : [];
    while (copy.length < maxImages) copy.push(logoApp);
    return copy;
  };

  // inicializa con logoApp por defecto
  const [images, setImages] = useState(() => normalize(initialImages));

  const fileInputRefs = useRef([]);
  const draggedIndexRef = useRef(null);
  const [draggedImage, setDraggedImage] = useState(null);
  const createdBlobUrlsRef = useRef(new Set());

  // evita notificar al padre en la primera renderización
  const mountedRef = useRef(false);

  // prevInitial para evitar sincronizaciones innecesarias
  const prevInitialRef = useRef(null);

  // Notificar al padre cuando images cambie (pero NO en mount)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (typeof onChange === "function") onChange(images);
    if (typeof onChangeClean === "function")
      onChangeClean(images.filter(Boolean));
  }, [images, onChange, onChangeClean]);

  // Solo sincronizamos initialImages si cambia realmente
  useEffect(() => {
    const norm = normalize(initialImages);
    if (!arraysEqual(prevInitialRef.current, norm)) {
      prevInitialRef.current = norm;
      // solo actualizamos el estado interno si difiere
      setImages((cur) => (arraysEqual(cur, norm) ? cur : norm));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialImages]);

  // cleanup blobs
  useEffect(() => {
    return () => {
      createdBlobUrlsRef.current.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch (_) {}
      });
      createdBlobUrlsRef.current.clear();
    };
  }, []);

  // ... (resto de handlers igual que tenías)
  const handleDragStart = (index) => (e) => {
    draggedIndexRef.current = index;
    setDraggedImage(index);
    if (e.dataTransfer) e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dtIndex = e.dataTransfer ? e.dataTransfer.getData("text/plain") : "";
    const from =
      draggedIndexRef.current !== null && draggedIndexRef.current !== undefined
        ? draggedIndexRef.current
        : dtIndex
        ? Number(dtIndex)
        : null;

    if (from === null || from === undefined || Number.isNaN(from)) {
      setDraggedImage(null);
      draggedIndexRef.current = null;
      return;
    }
    if (from === dropIndex) {
      setDraggedImage(null);
      draggedIndexRef.current = null;
      return;
    }

    setImages((prev) => {
      // snapshot previo (para comparar blobs que desaparecen)
      const prevArray = Array.isArray(prev) ? [...prev] : [];

      // movimiento: removemos el elemento 'from' y lo insertamos en dropIndex
      const next = [...prevArray];
      const [moved] = next.splice(from, 1);

      // si el origen está antes del destino, el índice de inserción baja en 1
      const insertIndex = from < dropIndex ? dropIndex - 1 : dropIndex;
      next.splice(insertIndex, 0, moved);

      // --- manejar revocación de blob: URLs que desaparecen ---
      // detectamos blobs "propios" (creados con URL.createObjectURL y guardados en el ref)
      const prevBlobs = new Set(
        prevArray.filter(
          (v) =>
            typeof v === "string" &&
            v.startsWith("blob:") &&
            createdBlobUrlsRef.current.has(v)
        )
      );
      const nextBlobs = new Set(
        next.filter((v) => typeof v === "string" && v.startsWith("blob:"))
      );

      for (const b of prevBlobs) {
        if (!nextBlobs.has(b)) {
          // si el blob ya no existe en el array final, lo revocamos y lo eliminamos del set
          try {
            URL.revokeObjectURL(b);
          } catch (_) {}
          createdBlobUrlsRef.current.delete(b);
        }
      }

      return next;
    });

    setDraggedImage(null);
    draggedIndexRef.current = null;
  };

  const handleImageUpload = (index, file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);

    const prev = images[index];
    if (
      prev &&
      prev.startsWith &&
      prev.startsWith("blob:") &&
      createdBlobUrlsRef.current.has(prev)
    ) {
      try {
        URL.revokeObjectURL(prev);
      } catch (_) {}
      createdBlobUrlsRef.current.delete(prev);
    }

    createdBlobUrlsRef.current.add(url);
    setImages((prev) => {
      const next = [...prev];
      next[index] = url;
      return next;
    });

    const input = fileInputRefs.current[index];
    if (input) input.value = "";
  };

  const handleImageRemove = (index) => {
    setImages((prev) => {
      const next = [...prev];
      const prevUrl = next[index];
      if (
        prevUrl &&
        prevUrl.startsWith &&
        prevUrl.startsWith("blob:") &&
        createdBlobUrlsRef.current.has(prevUrl)
      ) {
        try {
          URL.revokeObjectURL(prevUrl);
        } catch (_) {}
        createdBlobUrlsRef.current.delete(prevUrl);
      }
      next[index] = logoApp; // o "" según prefieras
      return next;
    });
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-4">
        {images.map((img, index) => (
          <div
            key={index}
            draggable
            onDragStart={handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className={`relative group cursor-move transition-all duration-300 ${
              draggedImage === index ? "scale-105 rotate-2 z-10" : ""
            }`}
          >
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors duration-300">
              {img ? (
                <div className="relative w-full h-full">
                  <Image
                    src={img}
                    alt={`Product ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => fileInputRefs.current[index]?.click()}
                        className="bg-white/90 hover:bg-white h-8 w-8 p-0"
                      >
                        <Upload className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={img == logoApp}
                        onClick={() => handleImageRemove(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/90 rounded p-1">
                      <GripVertical className="w-3 h-3 text-gray-600" />
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                  onClick={() => fileInputRefs.current[index]?.click()}
                >
                  <Plus className="w-8 h-8 text-gray-400 mb-1" />
                  <p className="text-xs text-gray-600 text-center">
                    Subir imagen {index + 1}
                  </p>
                </div>
              )}
            </div>

            <input
              ref={(el) => (fileInputRefs.current[index] = el)}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files && e.target.files[0];
                if (file) handleImageUpload(index, file);
              }}
            />

            <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
              {index + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
