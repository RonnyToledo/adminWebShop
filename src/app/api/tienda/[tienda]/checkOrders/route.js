import { NextResponse } from "next/server";
import { supabase } from "@/lib/supa";
import { cookies } from "next/headers"; // Importar cookies desde headers

const LogUser = async () => {
  const cookie = cookies().get("sb-access-token");
  if (!cookie) {
    return NextResponse.json(
      { message: "No se encontró la cookie de sesión" },
      { status: 401 }
    );
  }
  const parsedCookie = JSON.parse(cookie.value);
  // Establecer la sesión con los tokens de la cookie
  const { data: session, error: errorS } = await supabase.auth.setSession({
    access_token: parsedCookie.access_token,
    refresh_token: parsedCookie.refresh_token,
  });
};

export async function POST(request, { params }) {
  await LogUser();

  try {
    const body = await request.json(); // Obtener el cuerpo de la solicitud
    const { uids } = body;
    if (!Array.isArray(uids) || uids.length === 0) {
      return new Response(
        JSON.stringify({
          error: "El cuerpo debe incluir un array de uids válido",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Actualizar los registros en la tabla Events
    const { data, error } = await supabase
      .from("Events")
      .update({ visto: true }) // Cambiar 'visto' a true
      .in("UID_Venta", uids)
      .select(); // Filtrar por los uids dados

    if (error) {
      console.error(error.message);
      throw error;
    }

    return new Response(
      JSON.stringify({ message: "Registros actualizados exitosamente", data }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
