"use client";

import React, { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { PostBasicInfo } from "./post-basic-info";
import { PostContentEditor } from "./post-content-editor";
import { ThemeContext } from "@/context/useContext";
import { toast } from "sonner";
import axios from "axios";

export function CreatePostForm() {
  const router = useRouter();
  const { webshop, setWebshop } = useContext(ThemeContext);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    imageUrl: "",
    author: "Admin",
    published: false,
  });

  const handleBasicInfoComplete = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleContentComplete = async (content) => {
    try {
      const form = new FormData();
      form.append("ui_store", webshop?.store?.UUID);
      form.append("slug", formData.slug);
      form.append("title", formData.title);
      form.append("description", content);
      form.append("abstract", formData.excerpt);
      form.append("image", formData.imageUrl);

      const postPromise = axios.post(
        `/api/tienda/${webshop?.store?.sitioweb}/post`,
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      toast.promise(postPromise, {
        loading: "Subiendo Post",
        success: (response) => {
          // Actualiza el estado con la respuesta (usar updater para seguridad)
          setWebshop({
            ...webshop,
            store: {
              ...webshop?.store,

              blogs: [...webshop?.store?.blogs, response.data.data],
            },
          });
          router.push("/blog");
          // Puedes devolver el texto que quieres que muestre el toast en success
          return "Tarea Ejecutada — Información actualizada";
        },
        error: (err) => {
          console.error(err);
          // Puedes devolver un mensaje de error que se mostrará en el toast
          // Logging más detallado se hace en el catch
          return "Error al guardar el post";
        },
      });
    } catch (error) {
      console.error("Error al crear post:", error);
      throw error;
    }
  };
  console.log(formData);
  return (
    <div>
      {step === 1 && (
        <PostBasicInfo
          initialData={formData}
          onComplete={handleBasicInfoComplete}
        />
      )}
      {step === 2 && (
        <PostContentEditor
          initialContent={formData.content}
          onBack={handleBack}
          onComplete={handleContentComplete}
        />
      )}
    </div>
  );
}
