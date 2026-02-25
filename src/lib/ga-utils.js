import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { GoogleAuth } from "google-auth-library";
import { unstable_cache } from "next/cache";

const credentials = {
  type: process.env.TYPE,
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY,
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
  universe_domain: process.env.UNIVERSE_DOMAIN,
};

const propertyId = process.env.NEXT_PUBLIC_GA_PROPERTY_ID;

const auth = new GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
});

const analyticsDataClient = new BetaAnalyticsDataClient({ auth });

export async function fetchGAData(tienda) {
  return unstable_cache(
    async () => {
      try {
        console.info(`Fetching GA data for tienda: ${tienda}`);
        const [response] = await analyticsDataClient.runReport({
          property: `properties/${propertyId}`,
          dimensions: [
            { name: "pagePath" },
            { name: "hour" },
            { name: "date" },
          ],
          metrics: [{ name: "sessions" }],
          dateRanges: [{ startDate: "90daysAgo", endDate: "today" }],
          dimensionFilter: {
            filter: {
              fieldName: "pagePath",
              stringFilter: {
                matchType: "BEGINS_WITH",
                value: `/t/${tienda}`,
              },
            },
          },
        });

        const [response1] = await analyticsDataClient.runReport({
          property: `properties/${propertyId}`,
          dimensions: [
            { name: "pagePath" },
            { name: "hour" },
            { name: "date" },
          ],
          metrics: [{ name: "sessions" }],
          dateRanges: [{ startDate: "90daysAgo", endDate: "today" }],
          dimensionFilter: {
            filter: {
              fieldName: "pagePath",
              stringFilter: {
                matchType: "BEGINS_WITH",
                value: `/t/${tienda}/products/`,
              },
            },
          },
        });

        const rows = response.rows || [];
        const tiendaPath = `/t/${tienda}`;

        // Filtrar rows para la tienda principal (exacta)
        const mainRows = rows.filter(
          (row) => row.dimensionValues[0].value === tiendaPath,
        );

        const totalSessions = mainRows.reduce(
          (acc, row) => acc + parseInt(row.metricValues[0].value, 10),
          0,
        );

        return {
          calcularPromedioVisitasPorDia:
            calcularPromedioVisitasPorDiaOptimizado(mainRows),
          countEntriesInLast90Days: countEntriesInLastNDaysOptimizado(
            mainRows,
            90,
          ),
          countEntriesInLast7Days: countEntriesInLastNDaysOptimizado(
            mainRows,
            7,
          ),
          filterDatesInLast30Days: countTotalSessionsInLastNDays(mainRows, 30),
          contarVisitasPorHora: contarVisitasPorHoraOptimizado(mainRows),
          promedioVisitasPorMes: promedioVisitasPorMesOptimizado(mainRows),
          cant: totalSessions,
          visitasProductos: getProductVisitsOptimizado(response1),
        };
      } catch (error) {
        console.error("Error al ejecutar el reporte GA:", error);
        return {
          error: error.message,
          cant: 0,
          visitasProductos: {},
        };
      }
    },
    [`ga-data-${tienda}`],
    { revalidate: 3600, tags: [`ga-${tienda}`] },
  )();
}

// Helpers optimizados

function formatDateLocal(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function countEntriesInLastNDaysOptimizado(rows, n) {
  const counts = {};
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - (n - 1));

  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    counts[formatDateLocal(d)] = 0;
  }

  rows.forEach((row) => {
    const dateStr = row.dimensionValues[2].value;
    const sessions = parseInt(row.metricValues[0].value, 10);
    const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    if (counts[formattedDate] !== undefined) {
      counts[formattedDate] += sessions;
    }
  });

  return Object.keys(counts)
    .sort()
    .map((date) => ({ date, count: counts[date] }));
}

function countTotalSessionsInLastNDays(rows, n) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - (n - 1));
  start.setHours(0, 0, 0, 0);

  let total = 0;
  rows.forEach((row) => {
    const dateStr = row.dimensionValues[2].value;
    const sessions = parseInt(row.metricValues[0].value, 10);
    const entryDate = new Date(
      `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T00:00:00`,
    );
    if (entryDate >= start) {
      total += sessions;
    }
  });
  return total;
}

function contarVisitasPorHoraOptimizado(rows) {
  const contadorHoras = Array(24).fill(0);
  rows.forEach((row) => {
    const hour = parseInt(row.dimensionValues[1].value, 10);
    const sessions = parseInt(row.metricValues[0].value, 10);
    if (hour >= 0 && hour < 24) {
      contadorHoras[hour] += sessions;
    }
  });

  return contadorHoras.map((cantidad, index) => ({
    hora: `${index < 10 ? "0" : ""}${index}:00`,
    cantidad,
  }));
}

function promedioVisitasPorMesOptimizado(rows) {
  const contadorMeses = {};
  rows.forEach((row) => {
    const dateStr = row.dimensionValues[2].value;
    const sessions = parseInt(row.metricValues[0].value, 10);
    const date = new Date(
      `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T00:00:00`,
    );
    const mes = date.toLocaleString("default", { month: "long" });
    const anio = date.getFullYear();
    const claveMes = `${mes} ${anio}`;
    contadorMeses[claveMes] = (contadorMeses[claveMes] || 0) + sessions;
  });

  const totalMeses = Object.keys(contadorMeses).length || 0;
  const totalSessions = Object.values(contadorMeses).reduce(
    (acc, curr) => acc + curr,
    0,
  );
  const promedio = totalMeses === 0 ? 0 : totalSessions / totalMeses;

  return { contadorMeses, promedio: isNaN(promedio) ? 0 : promedio };
}

function calcularPromedioVisitasPorDiaOptimizado(rows) {
  const visitasPorDia = {};
  rows.forEach((row) => {
    const dateStr = row.dimensionValues[2].value;
    const sessions = parseInt(row.metricValues[0].value, 10);
    const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    visitasPorDia[formattedDate] =
      (visitasPorDia[formattedDate] || 0) + sessions;
  });

  const totalSessions = Object.values(visitasPorDia).reduce(
    (acc, v) => acc + v,
    0,
  );
  const numeroDeDias = Object.keys(visitasPorDia).length || 0;
  const promedio = numeroDeDias === 0 ? 0 : totalSessions / numeroDeDias;

  return { visitasPorDia, promedio };
}

function getProductVisitsOptimizado(response) {
  const productVisits = {};
  if (!response?.rows) return productVisits;

  response.rows.forEach((row) => {
    const pagePath = row.dimensionValues[0].value || "";
    const sessions = parseInt(row.metricValues[0].value, 10);
    const parts = pagePath.split("/products/");
    if (parts.length > 1) {
      const productId = parts[1].split(/[/?#]/)[0];
      productVisits[productId] = (productVisits[productId] || 0) + sessions;
    }
  });

  return productVisits;
}
