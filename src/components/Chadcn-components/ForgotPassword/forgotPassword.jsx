"use client";

import React, { useState } from "react";
import { ArrowRight, Coffee, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supa";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/updatePassword` },
    );

    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage(
        "Si existe una cuenta con ese correo, recibirás un enlace para restablecer la contraseña.",
      );
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-[2rem] border border-border bg-card p-7 shadow-2xl sm:p-9">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Coffee className="size-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              RouAdmin
            </p>
            <h1 className="text-2xl font-semibold text-foreground">
              Recuperar contraseña
            </h1>
          </div>
        </div>

        <p className="mb-6 text-sm leading-6 text-muted-foreground">
          Escribe tu correo y te enviaremos un enlace seguro para crear una
          nueva contraseña.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label
            className="block text-sm font-medium text-foreground"
            htmlFor="email"
          >
            Correo electrónico
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-full border border-border bg-background py-3 pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              placeholder="tu@email.com"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-emerald-600">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Lock className="size-4" />
            {loading ? "Enviando..." : "Enviar enlace"}
            {!loading && <ArrowRight className="size-4" />}
          </button>
        </form>

        <Link
          href="/login"
          className="mt-6 block text-center text-sm text-muted-foreground transition hover:text-primary"
        >
          Volver a iniciar sesión
        </Link>
      </section>
    </main>
  );
}
