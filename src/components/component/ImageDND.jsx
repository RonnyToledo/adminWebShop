import React, { useCallback } from "react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";

export default function ImageUploadDrag({ setImageNew, imageNew }) {
  const handleDrop = useCallback(
    (acceptedFiles) => {
      // Aquí puedes manejar los archivos aceptados
      setImageNew(acceptedFiles[0]);
    },
    [setImageNew]
  );

  const onDragEnd = (result) => {
    // Manejar el final del drag and drop si es necesario
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="image-dropzone">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md"
            style={{
              border: "2px dashed #ccc",
              padding: "20px",
              textAlign: "center",
              cursor: "pointer",
            }}
            onDrop={(event) => {
              event.preventDefault();
              const files = Array.from(event.dataTransfer.files);
              const imageFiles = files.filter((file) =>
                file.type.startsWith("image/")
              );
              handleDrop(imageFiles);
            }}
            onDragOver={(event) => event.preventDefault()}
          >
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
                    onChange={(e) => setImageNew(e.target.files[0])}
                    accept="image/*"
                    style={{ display: "none" }} // Ocultar el input
                  />
                </label>
                <p className="pl-1">o arrastrar y soltar</p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PNG, JPG, GIF hasta 10MB
              </p>
              <p className="text-xs text-muted-foreground mt-1">*Opcional</p>
            </div>
          </div>
        )}
      </Droppable>
    </DragDropContext>
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
export function ImageUploadWithProps({ setImageNew, campo, children }) {
  const handleDrop = useCallback(
    (acceptedFiles) => {
      // Aquí puedes manejar los archivos aceptados
      setImageNew((prev) => ({ ...prev, [campo]: acceptedFiles[0] }));
    },
    [setImageNew, campo]
  );

  const onDragEnd = (result) => {
    // Manejar el final del drag and drop si es necesario
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="image-dropzone">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            onDrop={(event) => {
              event.preventDefault();
              const files = Array.from(event.dataTransfer.files);
              const imageFiles = files.filter((file) =>
                file.type.startsWith("image/")
              );
              handleDrop(imageFiles);
            }}
            onDragOver={(event) => event.preventDefault()}
          >
            {children}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
