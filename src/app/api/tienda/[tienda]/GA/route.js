import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { GoogleAuth } from "google-auth-library";
import { NextResponse } from "next/server";

const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
const propertyId = process.env.NEXT_PUBLIC_GA_PROPERTY_ID; // ID de propiedad de GA4

// Configura autenticación con Google Auth
const auth = new GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
});

const analyticsDataClient = new BetaAnalyticsDataClient({ auth });

export async function GET(request, { params }) {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dimensions: [{ name: "pagePath" }, { name: "hour" }, { name: "date" }],
      metrics: [{ name: "sessions" }],
      dateRanges: [{ startDate: "365daysAgo", endDate: "today" }],
      dimensionFilter: {
        filter: {
          fieldName: "pagePath",
          stringFilter: {
            matchType: "BEGINS_WITH",
            value: `/t/${params.tienda}`,
          },
        },
      },
    });

    // Formatea los datos de Analytics
    const formattedData = formatAnalyticsDataByDate(response, params.tienda);
    const convertedData = convertirDatos(formattedData);

    return NextResponse.json(convertedData, {
      status: 200,
      headers: {
        "Cache-Control": "no-store", // Bloquea el almacenamiento en caché
      },
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
        headers: {
          "Cache-Control": "no-store", // Bloquea el almacenamiento en caché en caso de error también
        },
      }
    );
  }
}

// Función para formatear los datos de Analytics
function formatAnalyticsDataByDate(data, tienda) {
  return data.rows.reduce((acc, row) => {
    const [pagePath, hour, date] = row.dimensionValues.map((val) => val.value);
    const sessions = parseInt(row.metricValues[0].value, 10);

    if (pagePath === `/t/${tienda}`) {
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push({ pagePath, hour, sessions });
    }

    return acc;
  }, {});
}

// Convierte los datos a un formato específico
function convertirDatos(datos) {
  const resultado = [];

  Object.entries(datos).forEach(([fecha, items]) => {
    items.forEach(({ pagePath, hour, sessions }) => {
      const fechaHora = `${fecha.slice(0, 4)}-${fecha.slice(
        4,
        6
      )}-${fecha.slice(6, 8)}T${hour.padStart(2, "0")}:00:00`;

      for (let i = 0; i < sessions; i++) {
        resultado.push({
          id: i,
          uid: "a", // Este valor puede ser dinámico si es necesario
          desc: [],
          created_at: fechaHora,
          events: "inicio",
          tienda: pagePath.split("/t/")[1],
        });
      }
    });
  });

  return resultado;
}
