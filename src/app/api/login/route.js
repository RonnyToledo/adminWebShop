import { supabase } from "@/lib/supa";
import { NextResponse } from "next/server";
import { serialize } from "cookie";

// Función para renovar el access_token si ha expirado
async function refreshAccessTokenIfNeeded(cookieValue) {
  console.log("Revisando si el access_token necesita ser renovado...");

  const parsedCookie = JSON.parse(cookieValue);
  const { access_token, refresh_token } = parsedCookie;

  // Verificar si el access_token es válido
  const { data: user, error } = await supabase.auth.getUser(access_token);

  if (error) {
    console.log("El access_token ha expirado, intentando renovar...");

    // Si el access_token ha expirado, usar el refresh_token para renovarlo
    const { data, error: refreshError } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (refreshError) {
      console.error("Error al renovar el access_token:", refreshError.message);
      return { error: refreshError.message };
    }

    console.log("access_token renovado exitosamente.");

    // Crear una nueva cookie con el nuevo access_token y refresh_token
    const newCookieString = serialize(
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
  console.log("Datos recibidos en el cuerpo:", { email, provider });

  let data, error;

  if (provider === "google") {
    console.log("Intentando login con Google...");
    ({ data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token,
      options: {
        redirectTo:
          process.env.NEXT_PUBLIC_REDIRECT_URL || "http://localhost:4000/admin",
      },
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
  response.headers.append("Set-Cookie", cookieString);

  return response;
}

// Endpoint para cerrar sesión
export async function DELETE(req) {
  console.log("Procesando DELETE /api/login");

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error al cerrar sesión:", error.message);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  console.log("Sesión cerrada exitosamente.");

  const cookieString = serialize("sb-access-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: -1, // Expira la cookie
    path: "/",
  });

  const response = NextResponse.json({ message: "Logout exitoso" });
  response.headers.append("Set-Cookie", cookieString);

  return response;
}
