import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

export function ImageUpload({ onImageSelect, variant = "avatar" }) {
  const inputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  return (
    <>
      <input
        type="file"
        ref={inputRef}
        onChange={handleImageChange}
        accept="image/*"
        className="hidden"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`
        group relative overflow-hidden rounded-full
        ${variant === "cover" ? "w-8 h-8" : "w-full h-full"}
      `}
        onClick={() => inputRef.current?.click()}
      >
        <Camera className="w-4 h-4" />
        <span className="sr-only">Cambiar imagen</span>
      </Button>
    </>
  );
}
