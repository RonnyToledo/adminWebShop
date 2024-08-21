import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { GoogleAuth } from "google-auth-library";
import fs from "fs";
import { NextResponse } from "next/server";

const keyFile =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  process.env.NEXT_PUBLIC_GOOGLE_APPLICATION_CREDENTIALS;
const auth = new GoogleAuth({
  keyFile,
  scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
});

const analyticsDataClient = new BetaAnalyticsDataClient({ auth });

export async function GET(request, { params }) {
  const propertyId = process.env.NEXT_PUBLIC_GA_PROPERTY_ID; // Reemplaza con tu ID de propiedad de GA4

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dimensions: [{ name: "pagePath" }, { name: "hour" }, { name: "date" }],
      metrics: [{ name: "sessions" }],
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
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

    function formatAnalyticsDataByDate(data, tienda) {
      const formattedData = {};

      data.rows.forEach((row) => {
        const pagePath = row.dimensionValues[0].value;
        const hour = row.dimensionValues[1].value;
        const date = row.dimensionValues[2].value;
        const sessions = row.metricValues[0].value;

        if (pagePath === `/t/${tienda}`) {
          if (!formattedData[date]) {
            formattedData[date] = [];
          }

          const formattedRow = {
            pagePath,
            hour,
            sessions,
          };

          formattedData[date].push(formattedRow);
        }
      });

      return formattedData;
    }
    const formattedData = formatAnalyticsDataByDate(response, params.tienda);
    const newDatos = convertirDatos(formattedData);
    return NextResponse.json(newDatos);
  } catch (error) {
    console.error("Error running report:", error);
    return NextResponse.json(
      { message: error },
      {
        status: 401,
      }
    );
  }
}

function convertirDatos(datos) {
  const resultado = [];

  for (const fecha in datos) {
    if (datos.hasOwnProperty(fecha)) {
      datos[fecha].forEach((item) => {
        const fechaHora = `${fecha.slice(0, 4)}-${fecha.slice(
          4,
          6
        )}-${fecha.slice(6, 8)}T${item.hour.padStart(2, "0")}:00:00`;
        for (let i = 0; i < item.sessions; i++) {
          resultado.push({
            id: i,
            uid: "a",
            desc: [],
            created_at: fechaHora,
            events: "inicio",
            tienda: item.pagePath.split("/t/")[1],
          });
        }
      });
    }
  }

  return resultado;
}
