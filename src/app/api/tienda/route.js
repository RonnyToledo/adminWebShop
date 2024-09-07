import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

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
  comentario: "[]",
  moneda: '[{"valor":1,"moneda":"CUP"}]',
  moneda_default: '{"signo":"CUP","valor":1,"moneda":"CUP"}',
  variable: "t",
  categoria: "[]",
  local: false,
  envios: "[]",
  municipio: "",
  tipo: "",
  plan: "basic",
  font: "Poppins",
  color: "rgb(23, 37, 84)",
  login: true,
};

export async function GET() {
  const supabase = createClient();
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
  const supabase = createClient();
  const data = await request.formData();
  const { data: tienda1 } = await supabase.from("Sitios").select("*");
  console.log(data.get("name"));
  const NewStore = {
    ...datos,
    id: tienda1.length + 1,
    name: data.get("name"),
    sitioweb: data.get("sitioweb"),
    Provincia: data.get("Provincia"),
    municipio: data.get("municipio"),
    moneda: data.get("moneda"),
    moneda_default: data.get("moneda_default"),
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
const capitalizeAndRemoveSpaces = (inputString) => {
  // Capitaliza cada palabra y elimina espacios en blanco
  return inputString
    .split(" ") // Divide el string en palabras
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitaliza cada palabra
    .join("") // Une las palabras sin espacios
    .replace(/\s+/g, ""); // Elimina espacios en blanco
};
