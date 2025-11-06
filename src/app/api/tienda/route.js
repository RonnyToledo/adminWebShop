import { NextResponse } from "next/server";
import { supabase } from "@/lib/supa";
import { cookies } from "next/headers";

const parseJSONOr = (value, fallback) => {
  if (value == null) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
};

const toIntegerOrNull = (v) => {
  if (v == null) return null;
  // acepta string o number
  const n =
    typeof v === "number" ? v : parseInt(String(v).replace(/\D/g, ""), 10);
  return Number.isNaN(n) ? null : n;
};

const LogUser = async () => {
  const cookie = (await cookies()).get("sb-access-token");
  if (!cookie) {
    return {
      ok: false,
      status: 401,
      message: "No se encontró la cookie de sesión",
    };
  }

  let parsedCookie;
  try {
    parsedCookie = JSON.parse(cookie.value);
  } catch (e) {
    return { ok: false, status: 400, message: "Cookie inválida" };
  }

  if (!parsedCookie.access_token || !parsedCookie.refresh_token) {
    return {
      ok: false,
      status: 401,
      message: "Token no encontrado en la cookie",
    };
  }

  // Establecer la sesión con los tokens de la cookie
  const { data: session, error: errorS } = await supabase.auth.setSession({
    access_token: parsedCookie.access_token,
    refresh_token: parsedCookie.refresh_token,
  });

  if (errorS)
    return {
      ok: false,
      status: 401,
      message: "Error al establecer la sesión",
      detail: errorS,
    };

  return { ok: true, session };
};

export async function GET() {
  const log = await LogUser();
  if (!log.ok) {
    return NextResponse.json(
      { message: log.message, detail: log.detail || null },
      { status: log.status }
    );
  }
  const { data: tienda, error } = await supabase.from("Sitios").select("*");
  if (error)
    return NextResponse.json({ message: error.message }, { status: 500 });

  const a = (tienda || []).map((obj) => {
    return {
      ...obj,
      categoria: parseJSONOr(obj.categoria, null),
      horario: parseJSONOr(obj.horario, null),
      comentario: parseJSONOr(obj.comentario, null),
      envios: parseJSONOr(obj.envios, null),
    };
  });

  const response = NextResponse.json(a);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

const datos = {
  name: "",
  sitioweb: "",
  urlPoster: "",
  parrrafo: "",
  horario:
    '[{"dia":"Domingo","cierre":23,"apertura":1},{"dia":"Lunes","cierre":0,"apertura":0},{"dia":"Martes","cierre":0,"apertura":0},{"dia":"Miercoles","cierre":2,"apertura":12},{"dia":"Jueves","cierre":2,"apertura":12},{"dia":"Viernes","cierre":2,"apertura":12},{"dia":"Sabado","cierre":2,"apertura":12}]',
  Editor: "",
  act_tf: true,
  insta: "https://www.instagram.com/",
  Provincia: "",
  domicilio: true,
  variable: "t",
  envios: "[]",
  municipio: "",
  country: "",
  tipo: "",
  login: true,
  active: true,
};

export async function POST(request, { params }) {
  const log = await LogUser();
  if (!log.ok) {
    return NextResponse.json(
      { message: log.message, detail: log.detail || null },
      { status: log.status }
    );
  }

  const data = await request.formData();

  const name = data.get("name") || datos.name;
  const country = data.get("country") || datos.country;
  const provincia = data.get("Provincia") || datos.Provincia;
  const municipio = data.get("municipio") || datos.municipio;
  const editor = data.get("user") || datos.Editor; // debe ser UUID
  const email = data.get("email") || datos.email;
  const stocks = data.get("stock") || datos.stock;

  // Convertir cell a integer o null (esto obliga a Postgres a elegir la firma con bigint)
  const rawCell = data.get("cell");
  const cell = toIntegerOrNull(rawCell);

  // preparar JSON como objetos (no strings). Si vienen del form, intentar parsear; si no, usar datos por defecto.
  const horarioInput = data.get("horario") || datos.horario;
  const enviosInput = data.get("envios") || datos.envios;

  const payload = {
    _name: name,
    _country: country,
    _provincia: provincia,
    _municipio: municipio,
    _editor: editor,
    _email: email,
    _stocks: stocks,
    _cell: cell, // number o null -> evita ambigüedad bigint/text
    _urlposter: datos.urlPoster,
    _parrrafo: data.get("parrrafo") || datos.parrrafo,
    _horario: parseJSONOr(horarioInput, parseJSONOr(datos.horario, [])),
    _act_tf: datos.act_tf,
    _insta: data.get("insta") || datos.insta,
    _domicilio: datos.domicilio,
    _envios: parseJSONOr(enviosInput, []), // array -> jsonb
    _tipo: data.get("tipo") || datos.tipo,
    _login: datos.login,
    _active: datos.active,
  };

  try {
    const { data: tienda, error } = await supabase
      .rpc("create_sitio", payload)
      .single();
    if (error) {
      console.error("RPC create_sitio error:", error);
      return NextResponse.json(
        { message: error.message, detail: error },
        { status: 400 }
      );
    }
    const { data: monedas, error: errorMoneda } = await supabase
      .from("monedas")
      .insert({
        nombre: data.get("moneda_default"),
        valor: 1,
        defecto: false,
        ui_store: tienda.UUID,
      });
    if (errorMoneda) {
      console.error("Error al crear la moneda:", errorMoneda);
      return NextResponse.json(
        { message: errorMoneda.message, detail: errorMoneda },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Tienda creada", tienda },
      { status: 201 }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { message: "Error inesperado", detail: String(err) },
      { status: 500 }
    );
  }
}
