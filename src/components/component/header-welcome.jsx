"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";

async function fetchUserSession() {
  try {
    const res = await fetch("/api/login");
    const data = await res.json();
    if (res.ok && data?.user?.id) {
      return data.user.id;
    } else {
      console.log("Usuario no encontrado o error en la respuesta:", data);
      return null;
    }
  } catch (error) {
    console.error("Error al obtener la sesión del usuario:", error);
    return null;
  }
}

export default function HeaderWelcome({ children }) {
  const router = useRouter();

  useEffect(() => {
    async function checkUserSession() {
      const userId = await fetchUserSession();
      if (!userId) {
        router.push("/");
      }
    }

    checkUserSession();
  }, [router]);

  return (
    <main>
      {children}
      <Toaster />
    </main>
  );
}
