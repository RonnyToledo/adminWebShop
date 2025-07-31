import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supa";
import { parseISO, differenceInDays, addDays } from "date-fns";

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
  console.log("GET /api/login called");
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
    console.log(error);
    return NextResponse.json({ error }, { status: 401 });
  }

  const { data: user } = await supabase.auth.getUser(newAccessToken);
  console.log("User de Supabase", user);

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
  try {
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
    console.log("session", session);

    if (error || !session) {
      return NextResponse.json(
        { error: error?.message || "Autenticación fallida" },
        { status: 401 }
      );
    }
    const { data, errorSitios } = await supabase
      .from("Sitios")
      .select("vence")
      .eq("Editor", session.user.id)
      .single();
    const { data: user, errorUser } = await supabase
      .from("user")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (errorSitios) {
      return NextResponse.json(
        { error: errorSitios?.message || "Autenticación fallida" },
        { status: 401 }
      );
    }
    if (errorUser) {
      return NextResponse.json(
        { error: errorUser?.message || "Autenticación fallida" },
        { status: 401 }
      );
    }
    if (user?.role === "user") {
      let message =
        "Error, usted no tiene acceso a este servicio, contacte con los desarrolladores";

      const { error } = await supabase.auth.signOut();
      if (error)
        return NextResponse.json({ message: "Error" }, { status: 403 });
      return NextResponse.json(
        {
          message,
        },
        { status: 403 }
      );
    }
    if (data?.vence && isDateInFuture(data?.vence)) {
      let message;
      if (isOlderThan30Days(data.vence)) {
        message = "Error, su catalogo y administrador estan inactivos";
      } else {
        message = `Error, administrador esta inactivo, su catalogo va a seguir funcionando los proximos ${diasRestantesPara30(
          data.vence
        )} dias`;
      }
      const { error } = await supabase.auth.signOut();
      if (error)
        return NextResponse.json({ message: "Error" }, { status: 403 });
      return NextResponse.json(
        {
          message,
        },
        { status: 403 }
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
  } catch (err) {
    // Captura errores de consulta
    return NextResponse.json(
      { error: err.message || "Error en validación de permisos" },
      { status: 401 }
    );
  }
}

export async function PUT(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    console.error("No se pudo parsear el JSON del body");
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  console.log("Body recibido en PUT /api/login:", body);
  const { email, password, name: full_name, image } = body;

  if (!email || !password || !full_name) {
    console.error("Faltan campos:", { email, password, full_name });
    return NextResponse.json(
      { error: "Todos los campos son requeridos" },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, image: image || "" },
      },
    });

    if (error) {
      console.error("Error detallado de Supabase.signUp:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("SignUp exitoso, user:", data.user);
    return NextResponse.json({ user: data.user }, { status: 200 });
  } catch (err) {
    console.error("Fallo de red al conectar con Supabase:", err);
    return NextResponse.json(
      { error: "No se pudo conectar con Supabase. Intenta más tarde." },
      { status: 502 }
    );
  }
}

function isOlderThan30Days(dateString) {
  const start = new Date(dateString);
  const now = new Date();
  // Calculamos la diferencia en milisegundos
  const diffMs = now - start;
  // 30 días ≈ 30 * 24h * 60m * 60s * 1000ms
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  return diffMs > THIRTY_DAYS_MS;
}
function isDateInFuture(dateString) {
  const inputDate = new Date(dateString);
  const today = new Date();
  // Ponemos hoy a las 00:00:00 para comparar sólo fechas
  today.setHours(0, 0, 0, 0);
  return inputDate < today;
}
function diasRestantesPara30(date) {
  const fechaInicial = typeof date === "string" ? parseISO(date) : date;
  const fechaObjetivo = addDays(fechaInicial, 30);
  const hoy = new Date();
  const dias = differenceInDays(fechaObjetivo, hoy);
  return dias > 0 ? dias : 0;
}
