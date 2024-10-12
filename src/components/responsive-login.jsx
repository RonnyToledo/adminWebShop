"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supa";

export function ResponsiveLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    LlamadaApi(false, null); // Esto llamará a la función LlamadaApi() con el proveedor de Google
  };

  const handleGoogleLogin = async () => {
    const { user, session, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          process.env.NEXT_PUBLIC_REDIRECT_URL || "http://localhost:4000/admin",
      },
    });
    token: session.access_token;
    LlamadaApi(true, token); // Esto llamará a la función LlamadaApi() con el proveedor de Google
  };
  const LlamadaApi = async (value, token) => {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: value ? null : email,
        password: value ? null : password,
        provider: value ? "google" : null,
        token: value ? token : null,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      // Manejar la sesión o redirigir al dashboard
      router.push("/admin");
    } else {
      // Mostrar el error
      setError(data.error);
      console.error(data.error);
    }
  };
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Welcome message */}
      <div className="hidden md:block bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 text-white p-8 flex-1 flex items-center justify-center">
        <h1 className="text-4xl md:text-6xl font-bold text-center">
          Welcome Back!
        </h1>
      </div>
      {/* Right side - Login form */}
      <div className="bg-white p-8 flex-1 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Login
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Welcome back! Please login to your account.
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                  placeholder="username@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/*   <div className="flex items-center justify-between">
             
              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-purple-600 hover:text-purple-500"
                >
                  Forgot password?
                </a>
              </div>
            </div> */}

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Iniciar Sesion
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  O continuar con
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
            >
              <svg
                className="mr-2 h-4 w-4"
                aria-hidden="true"
                focusable="false"
                data-prefix="fab"
                data-icon="google"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                ></path>
              </svg>
              Login with Google
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
