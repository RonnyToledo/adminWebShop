import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supa";

// Crear una cookie de sesión
function createSessionCookie(session) {
  return {
    name: "sb-access-token",
    value: JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    }),
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    },
  };
}

// Eliminar una cookie de sesión
function clearSessionCookie() {
  return {
    name: "sb-access-token",
    value: "",
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: -1, // Expira la cookie
      path: "/",
    },
  };
}

// Renovar el access_token si ha expirado
async function refreshAccessTokenIfNeeded(cookieValue) {
  const parsedCookie = JSON.parse(cookieValue);
  const { access_token, refresh_token } = parsedCookie;

  const { data: user, error } = await supabase.auth.getUser(access_token);

  if (error) {
    console.log("El access_token ha expirado, intentando renovar...");

    const { data, error: refreshError } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (refreshError || !data.session) {
      return { error: refreshError?.message || "Sesión inválida" };
    }

    console.log("access_token renovado exitosamente.");
    const newCookie = createSessionCookie(data.session);
    return { newAccessToken: data.session.access_token, newCookie };
  }

  return { newAccessToken: access_token };
}

// GET: Obtener la sesión almacenada
export async function GET(req) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("sb-access-token");

  if (!cookie) {
    return NextResponse.json(
      { error: "No hay sesión activa" },
      { status: 401 }
    );
  }

  const { newAccessToken, newCookie, error } = await refreshAccessTokenIfNeeded(
    cookie.value
  );

  if (error) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { data: user } = await supabase.auth.getUser(newAccessToken);

  const response = NextResponse.json({ user }, { status: 200 });

  if (newCookie) {
    cookieStore.set(newCookie.name, newCookie.value, newCookie.options);
  }

  return response;
}

// DELETE: Cerrar sesión
export async function DELETE(req) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("sb-access-token");

  if (!cookie) {
    return NextResponse.json(
      { error: "No hay sesión activa para cerrar" },
      { status: 401 }
    );
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const clearCookie = clearSessionCookie();
  cookieStore.delete(clearCookie.name);

  return NextResponse.json({ message: "Logout exitoso" });
}

// POST: Iniciar sesión
export async function POST(req) {
  const body = await req.json(); // Obtener datos del body (email, password, etc.)

  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email y contraseña son requeridos" },
      { status: 400 }
    );
  }

  // Intentar autenticar al usuario
  const { data: session, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !session) {
    return NextResponse.json(
      { error: error?.message || "Autenticación fallida" },
      { status: 401 }
    );
  }

  // Crear la cookie de sesión
  const sessionCookie = createSessionCookie(session.session);

  const cookieStore = await cookies();
  cookieStore.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.options
  );

  return NextResponse.json(
    { message: "Autenticación exitosa", user: session.user },
    { status: 200 }
  );
}
