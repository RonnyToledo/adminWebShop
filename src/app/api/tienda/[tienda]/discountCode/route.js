import { NextResponse } from "next/server";
import { supabase } from "@/lib/supa";
import { LogUser } from "@/lib/logUser";

export async function POST(request, { params }) {
  const log = await LogUser();
  if (!log.ok) {
    return NextResponse.json(
      { message: log.message, detail: log.detail || null },
      { status: log.status },
    );
  }

  const { data: codeDiscount, error1 } = await supabase
    .from("codeDiscount")
    .select("*");
  if (error1) {
    console.error(error1);
    return NextResponse.json({ message: error1.message }, { status: 401 });
  }
  if (!codeDiscount || !Array.isArray(codeDiscount)) {
    console.error("No data returned from Supabase");
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
    console.error(error);

    return NextResponse.json(
      { message: error },
      {
        status: 401,
      },
    );
  }
  return NextResponse.json(tienda);
}
export async function DELETE(request, { params }) {
  const log = await LogUser();
  if (!log.ok) {
    return NextResponse.json(
      { message: log.message, detail: log.detail || null },
      { status: log.status },
    );
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id"); // Obtener el ID desde los parámetros de consulta
  const { error } = await supabase.from("codeDiscount").delete().eq("id", id); // Asegúrate de especificar el campo correcto
  if (error) {
    console.error(error);
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
