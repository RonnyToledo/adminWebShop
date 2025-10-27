import { NextResponse } from "next/server";
import { supabase } from "@/lib/supa";
import { cookies } from "next/headers"; // Importar cookies desde headers

const LogUser = async () => {
  const cookie = (await cookies()).get("sb-access-token");
  if (!cookie) {
    return NextResponse.json(
      { message: "No se encontró la cookie de sesión" },
      { status: 401 }
    );
  }
  const parsedCookie = JSON.parse(cookie.value);
  if (parsedCookie.access_token && parsedCookie.refresh_token)
    console.info("Token recividos");
  else console.error("Token no encontrado");
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

    const { data, error } = await supabase.rpc("mark_events_visto_true", {
      p_uids: uids,
    });

    if (error) {
      console.error("RPC error", error);
    } else {
      console.info("Resultado");
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
export async function PUT(request, { params }) {
  await LogUser();

  try {
    const body = await request.json(); // la misma estructura que pasas ahora

    // Asegurarnos desc como objeto json (no string)
    let safeDesc = body.desc;
    if (typeof safeDesc === "string") {
      try {
        safeDesc = JSON.parse(safeDesc);
      } catch (err) {
        throw new Error("El campo desc no es un JSON válido.");
      }
    }
    const paramsRpc = {
      p_uid: body.uid,
      p_events: body.events,
      p_desc: safeDesc,
      p_uid_venta: body.UID_Venta,
      p_nombre: body.nombre,
      p_phonenumber: Number(body.phonenumber) || 0,
      p_descripcion: body.descripcion || "",
      p_created_at: body.created_at || new Date().toISOString(),
    };
    console.log(paramsRpc);

    const { data, error } = await supabase.rpc(
      "update_event_adjust_stock",
      paramsRpc
    );

    if (error) {
      console.error("RPC error:", error);
      throw new Error(error.message || JSON.stringify(error));
    }

    return new Response(
      JSON.stringify({ message: "Evento actualizado y stock ajustado", data }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("PUT handler error:", error);
    return new Response(JSON.stringify({ error: error.message || error }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
export async function DELETE(request) {
  await LogUser();

  try {
    const body = await request.text();
    console.info("Cuerpo recibido (DELETE):", body);

    if (!body) {
      throw new Error("El cuerpo de la solicitud está vacío.");
    }

    const parsedBody = JSON.parse(body);
    const { uid } = parsedBody; // uid = UID_Venta

    if (!uid) {
      throw new Error("No se proporcionó uid (UID_Venta).");
    }

    const supabase = createClient();

    const { data, error } = await supabase.rpc("rollback_order_and_restock", {
      p_uid_venta: uid,
    });

    if (error) {
      console.error("Error RPC rollback_order_and_restock:", error);
      throw error;
    }

    // data es JSON: aseguramos obtener los campos
    const result = data;
    const restockPerformed = result?.restock_performed === true;
    const message = restockPerformed
      ? "Pedido eliminado y stock restaurado."
      : `Pedido eliminado. No se realizó restock: ${
          result?.message || "motivo desconocido"
        }`;

    return new Response(JSON.stringify({ message, result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("DELETE handler error:", error);
    return new Response(JSON.stringify({ error: error.message || error }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
