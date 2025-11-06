"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PostBasicInfo } from "./post-basic-info";
import { PostContentEditor } from "./post-content-editor";

export function CreatePostForm() {
  const router = useRouter();
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
    const finalData = { ...formData, content };

    try {
      // Aquí iría la llamada a la API para guardar en Supabase
      console.log("Post creado:", finalData);

      // Redirigir al blog
      router.push("/blog");
    } catch (error) {
      console.error("Error al crear post:", error);
      throw error;
    }
  };

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
