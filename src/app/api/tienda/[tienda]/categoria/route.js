import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function POST(request, { params }) {
  const supabase = createClient();
  const data = await request.formData();
  const { data: tienda, error } = await supabase
    .from("Sitios")
    .update([
      {
        categoria: data.get("categoria"),
      },
    ])
    .select()
    .eq("sitioweb", params.tienda);

  if (error) {
    console.log(error);
    return NextResponse.json(
      { message: error },
      {
        status: 401,
      }
    );
  }

  const products = JSON.parse(data.get("products"));
  async function updateProducts(obj) {
    const { data: productResponse, error1 } = await supabase
      .from("Products")
      .update([
        {
          caja: obj.caja,
        },
      ])
      .select()
      .eq("productId", obj.productId);
    if (error1) {
      console.log(error1);
      return NextResponse.json(
        { message: error },
        {
          status: 401,
        }
      );
    }
  }

  products.map((obj) => {
    updateProducts(obj);
  });

  return NextResponse.json({ message: "Producto creado" });
}
