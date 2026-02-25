import { NextResponse } from "next/server";
import { fetchGAData } from "@/lib/ga-utils";

export async function GET(request, { params }) {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "http://localhost:4000");
  headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  const tienda = (await params).tienda;

  try {
    const finishData = await fetchGAData(tienda);
    return NextResponse.json(finishData, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error al ejecutar el reporte:", error);
    return NextResponse.json(
      {
        message: "Error al ejecutar el reporte de Analytics",
        error: error.message,
      },
      {
        status: 500,
        headers,
      },
    );
  }
}
