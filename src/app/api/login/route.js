import { supabase } from "@/lib/supa";
import { NextResponse } from "next/server";
import { serialize } from "cookie";

// Obtener la sesión almacenada
export async function GET(req) {
  const cookie = req.cookies.get("sb-access-token");

  if (!cookie) {
    return NextResponse.json(
      { error: "No hay sesión activa" },
      { status: 401 }
    );
  }

  // Parsear el valor de la cookie (ya que es un JSON stringificado)
  const parsedCookie = JSON.parse(cookie.value);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(parsedCookie.access_token);

  if (user) {
    return NextResponse.json({ user }, { status: 200 });
  } else if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  } else {
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}

// Iniciar sesión con email/password o Google
export async function POST(req) {
  const { email, password, provider, token } = await req.json();
  let data, error;

  if (provider === "google") {
    ({ data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token,
      options: {
        redirectTo:
          process.env.NEXT_PUBLIC_REDIRECT_URL || "http://localhost:4000/admin",
      },
    }));
  } else {
    ({ data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    }));
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (!data.session) {
    return NextResponse.json(
      { error: "No se pudo obtener la sesión" },
      { status: 500 }
    );
  }

  // Crear la cookie utilizando serialize
  const cookieString = serialize(
    "sb-access-token",
    JSON.stringify({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    }
  );

  const response = NextResponse.json({
    session: data.session,
  });
  response.headers.append("Set-Cookie", cookieString); // Establecer la cookie en la respuesta

  return response;
}

// Cerrar sesión
export async function DELETE(req) {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  // Limpiar la cookie de la sesión
  const cookieString = serialize("sb-access-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: -1, // Expira la cookie
    path: "/",
  });

  const response = NextResponse.json({ message: "Logout exitoso" });
  response.headers.append("Set-Cookie", cookieString); // Establecer la cookie vacía para eliminarla

  return response;
}
