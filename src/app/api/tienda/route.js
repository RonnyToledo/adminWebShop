import { NextResponse } from "next/server";
import { requireRouteUser } from "@/lib/route-handler-auth";

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

// ── FIX: FormData siempre manda strings. Antes se hacía
// `const stocks = data.get("stock") || datos.stock` y se pasaba tal cual al
// RPC. Cuando el switch estaba en `false`, `data.get("stock")` devolvía el
// STRING "false", que es truthy en JS (`"false" || x` nunca cae al fallback,
// y si el RPC espera boolean, "false" como texto probablemente se guarda
// como truthy). Este helper normaliza cualquier variante ("true"/"false",
// "1"/"0", boolean real, undefined) a un boolean real antes de mandarlo.
const toBooleanOrDefault = (v, fallback = false) => {
  if (v == null) return fallback;
  if (typeof v === "boolean") return v;
  const s = String(v).trim().toLowerCase();
  if (s === "true" || s === "1" || s === "on") return true;
  if (s === "false" || s === "0" || s === "off" || s === "") return false;
  return fallback;
};

async function getAuthenticatedSupabase() {
  const { supabase } = await requireRouteUser();
  return supabase;
}

export async function GET() {
  try {
    const supabase = await getAuthenticatedSupabase();
    const { data: tienda, error } = await supabase.from("Sitios").select("*");
    if (error)
      return NextResponse.json({ message: error.message }, { status: 500 });

    const a = (tienda || []).map((obj) => {
      return {
        ...obj,
        categoria: parseJSONOr(obj.categoria, null),
        comentario: parseJSONOr(obj.comentario, null),
        envios: parseJSONOr(obj.envios, null),
      };
    });

    const response = NextResponse.json(a);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Error" },
      { status: 500 },
    );
  }
}

const datos = {
  name: "",
  sitioweb: "",
  urlPoster: "",
  parrrafo: "",
  Editor: "",
  insta: "https://www.instagram.com/",
  domicilio: true,
  variable: "t",
  envios: "[]",
  municipio: "",
  stock: false, // ← FIX: agregado default explícito (antes no existía en `datos`)
  tipo: "",
  login: true,
  active: true,
};

export async function POST(request) {
  try {
    const supabase = await getAuthenticatedSupabase();
    const data = await request.formData();

    const name = data.get("name") || datos.name;
    const country = data.get("country") || datos.country; // ISO code del país
    const region = data.get("region") || datos.region; // ISO code (regions.region_code)
    const municipio = data.get("municipio") || datos.municipio; // nombre libre
    const editor = data.get("user") || datos.Editor;
    const email = data.get("email") || datos.email || "";

    // ── FIX: antes `stocks` quedaba como string "true"/"false" (truthy
    // siempre) porque FormData no tipa. Ahora se normaliza a boolean real.
    const stocks = toBooleanOrDefault(data.get("stock"), datos.stock);

    const rawCell = data.get("cell");
    const cell = toIntegerOrNull(rawCell);

    const enviosInput = data.get("envios") || datos.envios;

    const payload = {
      _name: name,
      _country: country,
      _region: region,
      _municipio: municipio,
      _editor: editor,
      _email: email,
      _stocks: stocks,
      _cell: cell,
      _urlposter: datos.urlPoster,
      _parrrafo: data.get("parrrafo") || datos.parrrafo,
      _domicilio: datos.domicilio,
      _envios: parseJSONOr(enviosInput, []),
      _tipo: data.get("tipo") || datos.tipo,
      _login: datos.login,
      _active: datos.active,
    };

    const { data: tienda, error } = await supabase
      .rpc("create_sitio", payload)
      .single();

    if (error) {
      console.error("RPC create_sitio error:", error);
      return NextResponse.json(
        { message: error.message, detail: error },
        { status: 400 },
      );
    }
    const { error: errorMoneda } = await supabase.from("monedas").insert({
      nombre: data.get("moneda_default"),
      valor: 1,
      defecto: true,
      ui_store: tienda.UUID,
    });
    if (errorMoneda) {
      console.error("Error al crear la moneda:", errorMoneda);
      return NextResponse.json(
        { message: errorMoneda.message, detail: errorMoneda },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { message: "Tienda creada", tienda },
      { status: 201 },
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { message: "Error inesperado o no autenticado", detail: String(err) },
      { status: 500 },
    );
  }
}
