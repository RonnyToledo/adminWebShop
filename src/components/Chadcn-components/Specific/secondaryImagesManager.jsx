// SecondaryImagesManager.jsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Upload, Trash2, Plus, GripVertical } from "lucide-react";
import { logoApp } from "@/utils/image";

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

  const [images, setImages] = useState(() => normalize(initialImages));
  const fileInputRefs = useRef([]);
  const draggedIndexRef = useRef(null);
  const [draggedImage, setDraggedImage] = useState(null);
  const createdBlobUrlsRef = useRef(new Set());
  const mountedRef = useRef(false);
  const prevInitialRef = useRef(null);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (typeof onChange === "function") onChange(images);
    if (typeof onChangeClean === "function")
      onChangeClean(images.filter(Boolean));
  }, [images, onChange, onChangeClean]);

  useEffect(() => {
    const norm = normalize(initialImages);
    if (!arraysEqual(prevInitialRef.current, norm)) {
      prevInitialRef.current = norm;
      setImages((cur) => (arraysEqual(cur, norm) ? cur : norm));
    }
  }, [initialImages]);

  useEffect(
    () => () => {
      createdBlobUrlsRef.current.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch (_) {}
      });
      createdBlobUrlsRef.current.clear();
    },
    [],
  );

  const handleDragStart = (index) => (e) => {
    draggedIndexRef.current = index;
    setDraggedImage(index);
    if (e.dataTransfer) e.dataTransfer.setData("text/plain", String(index));
  };
  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dtIndex = e.dataTransfer ? e.dataTransfer.getData("text/plain") : "";
    const from =
      draggedIndexRef.current !== null
        ? draggedIndexRef.current
        : dtIndex
          ? Number(dtIndex)
          : null;
    if (from === null || Number.isNaN(from) || from === dropIndex) {
      setDraggedImage(null);
      draggedIndexRef.current = null;
      return;
    }
    setImages((prev) => {
      const next = [...(Array.isArray(prev) ? prev : [])];
      const [moved] = next.splice(from, 1);
      const insertIndex = from < dropIndex ? dropIndex - 1 : dropIndex;
      next.splice(insertIndex, 0, moved);
      const prevBlobs = new Set(
        prev.filter(
          (v) =>
            typeof v === "string" &&
            v.startsWith("blob:") &&
            createdBlobUrlsRef.current.has(v),
        ),
      );
      const nextBlobs = new Set(
        next.filter((v) => typeof v === "string" && v.startsWith("blob:")),
      );
      for (const b of prevBlobs) {
        if (!nextBlobs.has(b)) {
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
    if (prev?.startsWith?.("blob:") && createdBlobUrlsRef.current.has(prev)) {
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
        prevUrl?.startsWith?.("blob:") &&
        createdBlobUrlsRef.current.has(prevUrl)
      ) {
        try {
          URL.revokeObjectURL(prevUrl);
        } catch (_) {}
        createdBlobUrlsRef.current.delete(prevUrl);
      }
      next[index] = logoApp;
      return next;
    });
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {images.map((img, index) => (
        <div
          key={index}
          draggable
          onDragStart={handleDragStart(index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
          className={`relative group cursor-move transition-all duration-200 ${draggedImage === index ? "scale-105 opacity-70" : ""}`}
        >
          {/* Badge número */}
          <div className="absolute -top-2 -left-2 z-10 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-medium">
            {index + 1}
          </div>

          <div
            className={`aspect-square rounded-xl overflow-hidden border-2 transition-colors duration-200 ${
              draggedImage === index
                ? "border-primary"
                : "border-border hover:border-primary/40"
            } bg-secondary`}
          >
            {img && img !== logoApp ? (
              <div className="relative w-full h-full">
                <Image
                  src={img}
                  alt={`Imagen ${index + 1}`}
                  fill
                  className="object-cover"
                />

                {/* Overlay en hover */}
                <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[index]?.click()}
                    className="w-8 h-8 rounded-lg bg-background/90 flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <Upload size={13} className="text-foreground" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleImageRemove(index)}
                    className="w-8 h-8 rounded-lg bg-destructive/90 flex items-center justify-center hover:bg-destructive transition-colors"
                  >
                    <Trash2 size={13} className="text-white" />
                  </button>
                </div>

                {/* Grip */}
                <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-background/80 rounded p-0.5">
                    <GripVertical size={11} className="text-muted-foreground" />
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRefs.current[index]?.click()}
                className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
              >
                <Plus size={20} />
                <span className="text-[10px]">Imagen {index + 1}</span>
              </button>
            )}
          </div>

          <input
            ref={(el) => (fileInputRefs.current[index] = el)}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(index, file);
            }}
          />
        </div>
      ))}
    </div>
  );
}
