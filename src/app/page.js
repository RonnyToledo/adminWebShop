"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supa";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

export default function usePage() {
  const router = useRouter();

  // Manejador de cambios de sesión
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.replace("/admin");
      }
    });
  }, [router]);

  useEffect(() => {
    console.log("Mounted loginPAge");
    return () => {
      console.log("Unmounting loginPAge");
    };
  }, []);
  return (
    <div
      className="flex justify-center items-center"
      style={{ minHeight: "100vh" }}
    >
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }} // Estilo predeterminado, puedes cambiarlo
        providers={["google"]} // Proveedores de OAuth opcionales
        redirectTo="http://localhost:3000/admin"
        localization={{
          variables: {
            sign_up: {
              email_label: "Correo Electrónico",
              password_label: "Contraseña",
              button_label: "Registrarse",
              social_provider_text: "Regístrate con {{provider}}",
              link_text: "¿Ya tienes una cuenta? Inicia sesión",
            },
            sign_in: {
              email_label: "Correo Electrónico",
              password_label: "Contraseña",
              button_label: "Iniciar sesión",
              social_provider_text: "Inicia sesión con {{provider}}",
              link_text: "¿No tienes una cuenta? Regístrate",
            },
            forgotten_password: {
              link_text: "¿Olvidaste tu contraseña?",
            },
            magic_link: {
              email_input_label: "Correo Electrónico",
              button_label: "Enviar enlace mágico",
              link_text: "Envía un enlace mágico a tu correo",
            },
            verify_otp: {
              email_input_label: "Correo Electrónico",
              button_label: "Verificar OTP",
              link_text: "Verifica tu código OTP",
            },
          },
        }}
      />
    </div>
  );
}
