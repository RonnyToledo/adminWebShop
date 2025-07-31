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
  console.log(parsedCookie.access_token, parsedCookie.refresh_token);
  // Establecer la sesión con los tokens de la cookie
  const { data: session, error: errorS } = await supabase.auth.setSession({
    access_token: parsedCookie.access_token,
    refresh_token: parsedCookie.refresh_token,
  });
};

export async function GET() {
  await LogUser();

  const { data: tienda } = await supabase.from("Sitios").select("*");
  const a = tienda.map((obj) => {
    return {
      ...obj,
      categoria: JSON.parse(obj.categoria),
      moneda: JSON.parse(obj.moneda),
      moneda_default: JSON.parse(obj.moneda_default),
      horario: JSON.parse(obj.horario),
      comentario: JSON.parse(obj.comentario),
      envios: JSON.parse(obj.envios),
    };
  });
  const response = NextResponse.json(a);

  // Establecer cabeceras para deshabilitar el caché
  response.headers.set("Cache-Control", "no-store");

  return response;
}
const datos = {
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
  reservas: true,
  moneda: '[{"valor":1,"moneda":"CUP"}]',
  moneda_default: '{"signo":"CUP","valor":1,"moneda":"CUP"}',
  variable: "t",
  categoria: "[]",
  local: true,
  envios: "[]",
  municipio: "",
  tipo: "",
  plan: "basic",
  font: "Poppins",
  login: true,
  active: true,
};
export async function POST(request, { params }) {
  await LogUser();
  const data = await request.formData();

  const payload = {
    _name: data.get("name") || datos.name,
    _provincia: data.get("Provincia") || datos.Provincia,
    _municipio: data.get("municipio") || datos.municipio,
    _editor: data.get("user"), // debe ser UUID
    _email: data.get("email") || datos.email,
    _cell: data.get("cell"),
    _urlposter: datos.urlPoster,
    _parrrafo: datos.parrrafo,
    _horario: datos.horario, // JSON.stringify(...)
    _act_tf: datos.act_tf,
    _insta: datos.insta,
    _domicilio: datos.domicilio,
    _reservas: datos.reservas,
    _moneda: JSON.stringify(Moneda(data.get("moneda")).moneda) || datos.moneda, // JSON.stringify(...)
    _moneda_default:
      JSON.stringify(Moneda(data.get("name")).moneda) || datos.moneda_default, // JSON.stringify(...)
    _local: datos.local,
    _envios: datos.envios, // JSON.stringify(...)
    _tipo: datos.tipo,
    _plan: datos.plan,
    _font: datos.font,
    _login: datos.login,
    _active: datos.active,
  };

  const { data: tienda, error } = await supabase.rpc("create_sitio", payload);

  if (error) {
    console.log(error);
    return NextResponse.json(
      { message: error.message },
      {
        status: 401,
      }
    );
  }

  return NextResponse.json({ message: "Tienda creada" });
}
const Moneda = (inputString) => {
  return {
    moneda: [{ valor: 1, moneda: inputString }],
    moneda_default: { valor: 1, moneda: inputString },
  };
};
const capitalizeAndRemoveSpaces = (inputString) => {
  // Capitaliza cada palabra y elimina espacios en blanco
  return inputString
    .split(" ") // Divide el string en palabras
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitaliza cada palabra
    .join("") // Une las palabras sin espacios
    .replace(/[^a-zA-Z0-9]/g, ""); // Elimina espacios en blanco
};
