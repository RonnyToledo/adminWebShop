import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supa";
import { parseISO, differenceInDays, addDays } from "date-fns";

// ============================================
// CONSTANTES
// ============================================
const SESSION_COOKIE_NAME = "sb-access-token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 días
const GRACE_PERIOD_DAYS = 30;

// ============================================
// UTILIDADES DE COOKIES
// ============================================
function createSessionCookie(session) {
  return {
    name: SESSION_COOKIE_NAME,
    value: JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    }),
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
    },
  };
}

function clearSessionCookie() {
  return {
    name: SESSION_COOKIE_NAME,
    value: "",
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: -1,
      path: "/",
      sameSite: "lax",
    },
  };
}

// ============================================
// UTILIDADES DE VALIDACIÓN DE FECHAS
// ============================================
function isOlderThan30Days(dateString) {
  const start = new Date(dateString);
  const now = new Date();
  const diffMs = now - start;
  const THIRTY_DAYS_MS = GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
  return diffMs > THIRTY_DAYS_MS;
}

function isDateInPast(dateString) {
  const inputDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate < today;
}

function diasRestantesPara30(date) {
  const fechaInicial = typeof date === "string" ? parseISO(date) : date;
  const fechaObjetivo = addDays(fechaInicial, GRACE_PERIOD_DAYS);
  const hoy = new Date();
  const dias = differenceInDays(fechaObjetivo, hoy);
  return dias > 0 ? dias : 0;
}

// ============================================
// GESTIÓN DE TOKENS
// ============================================
async function refreshAccessTokenIfNeeded(cookieValue) {
  try {
    const parsedCookie = JSON.parse(cookieValue);
    const { access_token, refresh_token } = parsedCookie;

    // Verificar si el token es válido
    const { data: user, error } = await supabase.auth.getUser(access_token);

    if (error) {
      console.info("Access token expirado, renovando...");

      // Intentar renovar con refresh token
      const { data, error: refreshError } = await supabase.auth.refreshSession({
        refresh_token,
      });

      if (refreshError || !data.session) {
        return {
          error: refreshError?.message || "Sesión inválida",
          needsReauth: true,
        };
      }

      console.info("Access token renovado exitosamente");
      return {
        newAccessToken: data.session.access_token,
        newCookie: createSessionCookie(data.session),
        user: data.user,
      };
    }

    return { newAccessToken: access_token, user: user.user };
  } catch (err) {
    console.error("Error al renovar token:", err);
    return { error: "Error al procesar sesión", needsReauth: true };
  }
}

// ============================================
// VALIDACIONES DE USUARIO
// ============================================
async function validateUserAccess(userId) {
  try {
    // Consultas en paralelo para mejor rendimiento
    const [sitiosResult, userResult] = await Promise.all([
      supabase.from("Sitios").select("vence").eq("Editor", userId).single(),
      supabase.from("user").select("role").eq("id", userId).single(),
    ]);

    // Validar role
    if (userResult.error) {
      return {
        isValid: false,
        error: "Error al verificar permisos de usuario",
      };
    }

    if (userResult.data?.role === "user") {
      return {
        isValid: false,
        error:
          "No tiene acceso a este servicio. Contacte a los desarrolladores",
        statusCode: 403,
      };
    }

    // Validar fecha de vencimiento
    if (sitiosResult.error) {
      return {
        isValid: false,
        error: "Error al verificar estado del sitio",
      };
    }

    if (sitiosResult.data?.vence && isDateInPast(sitiosResult.data.vence)) {
      const diasRestantes = diasRestantesPara30(sitiosResult.data.vence);

      if (isOlderThan30Days(sitiosResult.data.vence)) {
        return {
          isValid: false,
          error: "Su catálogo y administrador están inactivos",
          statusCode: 403,
        };
      } else {
        return {
          isValid: false,
          error: `Administrador inactivo. Su catálogo funcionará por ${diasRestantes} días más`,
          statusCode: 403,
        };
      }
    }

    return { isValid: true };
  } catch (err) {
    console.error("Error en validación de acceso:", err);
    return {
      isValid: false,
      error: "Error al validar permisos",
    };
  }
}

// ============================================
// MANEJADORES DE RESPUESTA
// ============================================
async function handleCookieUpdate(cookieStore, newCookie) {
  if (newCookie) {
    cookieStore.set(newCookie.name, newCookie.value, newCookie.options);
  }
}

async function clearSessionAndSignOut(cookieStore) {
  await supabase.auth.signOut();
  const clearCookie = clearSessionCookie();
  cookieStore.delete(clearCookie.name);
}

// ============================================
// ENDPOINTS
// ============================================

// GET: Obtener la sesión activa
export async function GET(req) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!cookie) {
    return NextResponse.json(
      { error: "No hay sesión activa" },
      { status: 401 }
    );
  }

  const { newAccessToken, newCookie, error, needsReauth, user } =
    await refreshAccessTokenIfNeeded(cookie.value);

  if (error) {
    if (needsReauth) {
      await clearSessionAndSignOut(cookieStore);
    }
    return NextResponse.json({ error }, { status: 401 });
  }

  const response = NextResponse.json({ user }, { status: 200 });

  if (newCookie) {
    await handleCookieUpdate(cookieStore, newCookie);
  }

  return response;
}

// DELETE: Cerrar sesión
export async function DELETE(req) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!cookie) {
    return NextResponse.json(
      { error: "No hay sesión activa para cerrar" },
      { status: 401 }
    );
  }

  try {
    await clearSessionAndSignOut(cookieStore);
    return NextResponse.json({ message: "Sesión cerrada exitosamente" });
  } catch (err) {
    console.error("Error al cerrar sesión:", err);
    return NextResponse.json(
      { error: "Error al cerrar sesión" },
      { status: 500 }
    );
  }
}

// POST: Iniciar sesión
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json(
      { error: "Datos de entrada inválidos" },
      { status: 400 }
    );
  }

  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email y contraseña son requeridos" },
      { status: 400 }
    );
  }

  try {
    // Autenticar usuario
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

    // Validar acceso del usuario
    const validation = await validateUserAccess(session.user.id);

    if (!validation.isValid) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: validation.error },
        { status: validation.statusCode || 403 }
      );
    }

    // Crear y guardar cookie de sesión
    const sessionCookie = createSessionCookie(session.session);
    const cookieStore = await cookies();
    cookieStore.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.options
    );

    return NextResponse.json(
      {
        message: "Autenticación exitosa",
        user: session.user,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error en autenticación:", err);
    return NextResponse.json(
      { error: "Error en el proceso de autenticación" },
      { status: 500 }
    );
  }
}

// PUT: Registrar nuevo usuario
export async function PUT(req) {
  let data;
  try {
    data = await req.formData();
  } catch (e) {
    console.error("Error al parsear FormData:", e);
    return NextResponse.json(
      { error: "Datos de formulario inválidos" },
      { status: 400 }
    );
  }

  const email = data.get("email");
  const full_name = data.get("name");
  const password = data.get("password");
  const image = data.get("image");

  // Validación de campos requeridos
  if (!email || !password || !full_name) {
    console.error("Campos faltantes:", { email, password, full_name });
    return NextResponse.json(
      { error: "Email, contraseña y nombre son requeridos" },
      { status: 400 }
    );
  }

  const payload = {
    email,
    password,
    options: {
      data: {
        full_name,
        ...(image ? { avatar_url: image, picture: image } : {}),
      },
    },
  };

  try {
    const { data: signUpData, error } = await supabase.auth.signUp(payload);

    if (error) {
      console.error("Error en registro:", error);
      return NextResponse.json(
        { error: `Error al crear cuenta: ${error.message}` },
        { status: 400 }
      );
    }

    // Limpiar sesión automática creada por signUp
    await supabase.auth.signOut();

    return NextResponse.json(
      { message: "Cuenta creada exitosamente" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error de red con Supabase:", err);
    return NextResponse.json(
      { error: "No se pudo conectar con el servidor. Intente más tarde." },
      { status: 502 }
    );
  }
}
