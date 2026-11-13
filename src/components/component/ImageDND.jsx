import React, { useCallback } from "react";
import { DndContext, useDroppable } from "@dnd-kit/core";
import { toast } from "sonner";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

function selectImage(files, setImageNew) {
  const file = files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    toast.error("Selecciona un archivo de imagen válido.");
    return;
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    toast.error("La imagen debe pesar 10 MB o menos.");
    return;
  }
  setImageNew(file);
}

// ─── Zona de drop interna ─────────────────────────────────────────────────────
function DroppableZone({ children, onFileDrop }) {
  const { setNodeRef } = useDroppable({ id: "image-dropzone" });

  return (
    <div
      ref={setNodeRef}
      className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md"
      style={{
        border: "2px dashed #ccc",
        padding: "20px",
        textAlign: "center",
        cursor: "pointer",
      }}
      onDrop={(e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFileDrop(files);
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ImageUploadDrag({ setImageNew }) {
  const handleDrop = useCallback(
    (acceptedFiles) => {
      selectImage(acceptedFiles, setImageNew);
    },
    [setImageNew],
  );

  return (
    <DndContext>
      <DroppableZone onFileDrop={handleDrop}>
        <div className="space-y-1 text-center">
          <CloudUploadIcon className="mx-auto h-12 w-12 text-slate-400" />
          <div className="flex flex-col text-sm text-slate-600 dark:text-slate-400">
            <label
              className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
              htmlFor="images"
            >
              <span>Subir archivos</span>
              <input
                className="sr-only"
                id="images"
                name="images"
                type="file"
                onChange={(e) => {
                  selectImage(Array.from(e.target.files ?? []), setImageNew);
                  e.target.value = "";
                }}
                accept="image/*"
                style={{ display: "none" }}
              />
            </label>
            <p className="pl-1">o arrastrar y soltar</p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            PNG, JPG, GIF hasta 10MB
          </p>
          <p className="text-xs text-muted-foreground mt-1">*Opcional</p>
        </div>
      </DroppableZone>
    </DndContext>
  );
}

function CloudUploadIcon(props) {
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
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M12 12v9" />
      <path d="m16 16-4-4-4 4" />
    </svg>
  );
}

// ─── Variante con campo dinámico ──────────────────────────────────────────────
function DroppableZoneWithProps({ children, onFileDrop }) {
  const { setNodeRef } = useDroppable({ id: "image-dropzone-props" });

  return (
    <div
      ref={setNodeRef}
      onDrop={(e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFileDrop(files);
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}

export function ImageUploadWithProps({ setImageNew, campo, children }) {
  const handleDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Selecciona un archivo de imagen válido.");
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        toast.error("La imagen debe pesar 10 MB o menos.");
        return;
      }
      setImageNew((prev) => ({ ...prev, [campo]: file }));
    },
    [setImageNew, campo],
  );

  return (
    <DndContext>
      <DroppableZoneWithProps onFileDrop={handleDrop}>
        {children}
      </DroppableZoneWithProps>
    </DndContext>
  );
}
