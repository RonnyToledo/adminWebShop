"use client";
import React from "react";
import { ImageUploadWithProps } from "../../component/ImageDND";
import { ImageUpload } from "./image-upload";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
import { logoApp } from "@/utils/image";

export default function ProfileHeader({ store, setStore }) {
  const handleCoverUpload = (file) => {
    setStore({ ...store, bannerNew: file });
  };

  const handleAvatarUpload = (file) => {
    setStore({ ...store, urlPosterNew: file });
  };

  return (
    <TooltipProvider>
      <div className="relative w-full max-w-2xl mx-auto mb-10">
        {/* Cover Photo */}
        <ImageUploadWithProps setImageNew={setStore} campo={"bannerNew"}>
          <div
            className="relative h-40 bg-gradient-to-br from-rose-200 to-rose-300 group"
            style={{
              width: "100%",
              backgroundImage: store?.bannerNew
                ? `url(${URL.createObjectURL(store.bannerNew)})`
                : store?.banner
                ? `url(${store.banner})`
                : `url(${logoApp})`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
          >
            {/* Cover Photo Edit Button - Now fixed */}
            <div className="absolute bottom-2 right-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-black/50 rounded-full p-1 text-white group-hover:text-black">
                    <ImageUpload
                      onImageSelect={handleCoverUpload}
                      variant="cover"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cambiar foto de portada</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </ImageUploadWithProps>

        {/* Profile Content */}

        <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          {/* Avatar */}
          <ImageUploadWithProps setImageNew={setStore} campo={"urlPosterNew"}>
            <div className="relative w-24 h-24 rounded-full bg-white p-1 shadow-lg group">
              <div className="w-full h-full rounded-full bg-rose-100 flex items-center justify-center overflow-hidden">
                <Image
                  src={
                    store?.urlPosterNew
                      ? URL.createObjectURL(store.urlPosterNew)
                      : store?.urlPoster || logoApp
                  }
                  alt="Profile"
                  className="w-full h-full object-cover"
                  width={100}
                  height={100}
                />

                {/* Avatar Edit Button */}
                <div className="absolute  inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <ImageUpload onImageSelect={handleAvatarUpload} />
                </div>
              </div>
            </div>
          </ImageUploadWithProps>
        </div>
      </div>
    </TooltipProvider>
  );
}
