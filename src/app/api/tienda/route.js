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
  active: false,
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

export async function POST(request, { params }) {
  await LogUser();

  const data = await request.formData();
  const { data: tienda1 } = await supabase.from("Sitios").select("*");

  const NewStore = {
    ...datos,
    id: tienda1.length + 1,
    name: data.get("name"),
    sitioweb: capitalizeAndRemoveSpaces(data.get("name")),
    Provincia: data.get("Provincia"),
    municipio: data.get("municipio"),
    moneda: JSON.stringify(Moneda(data.get("moneda")).moneda),
    moneda_default: JSON.stringify(Moneda(data.get("name")).moneda),
    Editor: data.get("user"),
    email: data.get("email"),
    cell: data.get("cell"),
  };
  const { data: tienda, error } = await supabase
    .from("Sitios")
    .insert([NewStore])
    .select();

  if (error) {
    console.log(error);
    return NextResponse.json(
      { message: error },
      {
        status: 401,
      }
    );
  }

  return NextResponse.json({ message: "Producto creado" });
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
