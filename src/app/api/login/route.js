import { supabase } from "@/lib/supa";
import { NextResponse } from "next/server";
import { serialize } from "cookie";

// Función para crear una cookie de sesión
function createSessionCookie(session) {
  return serialize(
    "sb-access-token",
    JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    }
  );
}

// Función para eliminar la cookie de sesión
function clearSessionCookie() {
  return serialize("sb-access-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: -1, // Expira la cookie
    path: "/",
  });
}

// Función para renovar el access_token si ha expirado
async function refreshAccessTokenIfNeeded(cookieValue) {
  if (process.env.NODE_ENV !== "production") {
    console.log("Revisando si el access_token necesita ser renovado...");
  }

  const parsedCookie = JSON.parse(cookieValue);
  const { access_token, refresh_token } = parsedCookie;

  const { data: user, error } = await supabase.auth.getUser(access_token);

  if (error) {
    console.log("El access_token ha expirado, intentando renovar...");

    const { data, error: refreshError } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (refreshError || !data.session) {
      console.error("Error al renovar el access_token:", refreshError?.message);
      return { error: refreshError?.message || "Sesión inválida" };
    }

    console.log("access_token renovado exitosamente.");
    const newCookieString = createSessionCookie(data.session);

    return { newAccessToken: data.session.access_token, newCookieString };
  }

  console.log("El access_token sigue siendo válido.");
  return { newAccessToken: access_token };
}

// Endpoint para obtener la sesión almacenada
export async function GET(req) {
  console.log("Procesando GET /api/login");

  const cookie = req.cookies.get("sb-access-token");

  if (!cookie) {
    console.warn("No hay sesión activa.");
    return NextResponse.json(
      { error: "No hay sesión activa" },
      { status: 401 }
    );
  }

  const { newAccessToken, newCookieString, error } =
    await refreshAccessTokenIfNeeded(cookie.value);

  if (error) {
    console.error("Error durante la renovación del access_token:", error);
    return NextResponse.json({ error }, { status: 401 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser(newAccessToken);

  console.log("Sesión encontrada para el usuario:", user);

  const response = NextResponse.json({ user }, { status: 200 });

  if (newCookieString) {
    response.headers.append("Set-Cookie", newCookieString);
  }

  return response;
}

// Endpoint para iniciar sesión con email/password o Google
export async function POST(req) {
  console.log("Procesando POST /api/login");

  const { email, password, provider, token } = await req.json();

  if (!provider) {
    return NextResponse.json(
      { error: "El proveedor es obligatorio" },
      { status: 400 }
    );
  }

  if (provider === "google" && !token) {
    return NextResponse.json(
      { error: "El token es obligatorio para Google" },
      { status: 400 }
    );
  }

  if (provider === "email" && (!email || !password)) {
    return NextResponse.json(
      { error: "El email y password son obligatorios" },
      { status: 400 }
    );
  }

  let data, error;

  if (provider === "google") {
    console.log("Intentando login con Google...", token);
    ({ data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token,
    }));
  } else {
    console.log("Intentando login con email y password...");
    ({ data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    }));
  }

  if (error) {
    console.error("Error durante el inicio de sesión:", error.message);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (!data.session) {
    console.error("No se pudo obtener la sesión después del login.");
    return NextResponse.json(
      { error: "No se pudo obtener la sesión" },
      { status: 500 }
    );
  }

  console.log("Sesión obtenida correctamente:", data.session);

  const cookieString = createSessionCookie(data.session);

  const response = NextResponse.json({ session: data.session });
  response.headers.append("Set-Cookie", cookieString);

  return response;
}

// Endpoint para cerrar sesión
export async function DELETE(req) {
  console.log("Procesando DELETE /api/login");

  const cookie = req.cookies.get("sb-access-token");

  if (!cookie) {
    return NextResponse.json(
      { error: "No hay sesión activa para cerrar" },
      { status: 401 }
    );
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error al cerrar sesión:", error.message);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  console.log("Sesión cerrada exitosamente.");
  const cookieString = clearSessionCookie();

  const response = NextResponse.json({ message: "Logout exitoso" });
  response.headers.append("Set-Cookie", cookieString);

  return response;
}
