import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { GoogleAuth } from "google-auth-library";
import { NextResponse } from "next/server";

const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
const propertyId = process.env.NEXT_PUBLIC_GA_PROPERTY_ID;

// Cache en memoria con TTL
const storeCache = {};
const cacheTTL = 60 * 60 * 1000; // 1 hora en milisegundos

// Configura autenticación con Google Auth
const auth = new GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
});

const analyticsDataClient = new BetaAnalyticsDataClient({ auth });

export async function GET(request, { params }) {
  const tienda = params.tienda;

  // Verificar si los datos están en caché y si no han expirado
  if (storeCache[tienda] && !isCacheExpired(storeCache[tienda].timestamp)) {
    console.log(`Datos en caché para la tienda: ${tienda}`);
    return NextResponse.json(storeCache[tienda].data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

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
    const formattedData = formatAnalyticsDataByDate(response, tienda);
    const convertedData = convertirDatos(formattedData);

    // Almacena los datos en caché con el timestamp actual
    storeCache[tienda] = {
      data: convertedData,
      timestamp: Date.now(),
    };

    return NextResponse.json(convertedData, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
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
          "Cache-Control": "no-store",
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

// Función para verificar si el caché ha expirado
function isCacheExpired(timestamp) {
  return Date.now() - timestamp > cacheTTL;
}
