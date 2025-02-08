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

export async function POST(request, { params }) {
  await LogUser();

  console.log("a");
  const { data: codeDiscount, error1 } = await supabase
    .from("codeDiscount")
    .select("*");
  console.log(codeDiscount);
  if (error1) {
    console.log(error1);
    return NextResponse.json({ message: error1.message }, { status: 401 });
  }
  if (!codeDiscount || !Array.isArray(codeDiscount)) {
    console.log("No data returned from Supabase");
    return NextResponse.json({ message: "No data found" }, { status: 404 });
  }
  const arrayOfNumbers = codeDiscount.map((obj) => obj.id);
  const data1 = await request.formData();
  const { data: tienda, error } = await supabase
    .from("codeDiscount")
    .insert([
      {
        id: findFirstMissingValue(arrayOfNumbers),
        code: data1.get("code"),
        discount: data1.get("discount"),
        expiresAt: new Date(data1.get("expiresAt")),
        storeID: data1.get("uid"),
      },
    ])
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
  return NextResponse.json(tienda);
}
export async function DELETE(request, { params }) {
  await LogUser();

  const url = new URL(request.url);
  const id = url.searchParams.get("id"); // Obtener el ID desde los parámetros de consulta
  const { error } = await supabase.from("codeDiscount").delete().eq("id", id); // Asegúrate de especificar el campo correcto
  if (error) {
    console.log(error);
    return NextResponse.json({ message: error.message }, { status: 401 });
  }
  return NextResponse.json({ message: "Código eliminado" });
}

function findFirstMissingValue(arr) {
  let i = 0; // Iniciar desde 0
  while (true) {
    if (!arr.includes(i)) {
      return i; // Retorna el primer valor que no está en el array
    }
    i++; // Incrementar el valor a verificar
  }
}
