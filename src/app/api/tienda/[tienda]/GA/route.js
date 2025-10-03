import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { GoogleAuth } from "google-auth-library";
import { NextResponse } from "next/server";

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

// Configura autenticación con Google Auth
const auth = new GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
});

const analyticsDataClient = new BetaAnalyticsDataClient({ auth });

export async function GET(request, { params }) {
  const tienda = (await params).tienda;

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
            value: `/t/${tienda}`,
          },
        },
      },
    });

    const [response1] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dimensions: [{ name: "pagePath" }, { name: "hour" }, { name: "date" }],
      metrics: [{ name: "sessions" }],
      dateRanges: [{ startDate: "365daysAgo", endDate: "today" }],
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

    // Formatea los datos de Analytics (solo entradas EXACTAS a /t/{tienda} para este dataset)
    const formattedData = formatAnalyticsDataByDate(response, tienda);
    const convertedData = convertirDatos(formattedData);

    const finishData = {
      calcularPromedioVisitasPorDia:
        calcularPromedioVisitasPorDia(convertedData),
      countEntriesInLast90Days: countEntriesInLast90Days(convertedData),
      countEntriesInLast7Days: countEntriesInLast7Days(convertedData),
      filterDatesInLast30Days: filterDatesInLast30Days(convertedData).length,
      contarVisitasPorHora: contarVisitasPorHora(convertedData),
      promedioVisitasPorMes: promedioVisitasPorMes(convertedData),
      cant: convertedData.length,
      visitasProductos: getProductVisits(response1),
    };
    return NextResponse.json(finishData, {
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

// -----------------------------
// Helpers y funciones corregidas
// -----------------------------

// Formatea rows de Analytics en un objeto { fechaYYYYMMDD: [{pagePath, hour, sessions}, ...], ... }
// Nota: asumimos que response.rows existe y tiene dimensionValues/metricValues
function formatAnalyticsDataByDate(data, tienda) {
  if (!data?.rows) return {};

  return data.rows.reduce((acc, row) => {
    const dimensionValues = row.dimensionValues || [];
    const metricValues = row.metricValues || [];

    const pagePath = (dimensionValues[0] && dimensionValues[0].value) || "";
    const hour = (dimensionValues[1] && dimensionValues[1].value) || "00";
    const date = (dimensionValues[2] && dimensionValues[2].value) || ""; // formato YYYYMMDD
    const sessions = parseInt(
      (metricValues[0] && metricValues[0].value) || "0",
      10
    );

    if (!date) return acc;

    // Aquí agrupamos por fecha solo las entradas EXACTAS a /t/{tienda}
    // Si quieres incluir subpaths, cambia la condición.
    if (pagePath === `/t/${tienda}`) {
      if (!acc[date]) acc[date] = [];
      acc[date].push({ pagePath, hour, sessions });
    }

    return acc;
  }, {});
}

// convertirDatos: crea un array con un objeto por sesión (simula eventos)
// Corrige ids duplicadas usando un contador global y parsing correcto de fecha ISO.
function convertirDatos(datos) {
  const resultado = [];
  let globalId = 0;

  Object.entries(datos).forEach(([fecha, items]) => {
    // fecha viene en formato YYYYMMDD -> lo convertimos a YYYY-MM-DD
    const fechaISOBase = `${fecha.slice(0, 4)}-${fecha.slice(
      4,
      6
    )}-${fecha.slice(6, 8)}`;

    items.forEach(({ pagePath, hour, sessions }) => {
      const horaPadded = hour.toString().padStart(2, "0");
      // creamos un ISO datetime (sin zona explícita): YYYY-MM-DDTHH:00:00
      const fechaHora = `${fechaISOBase}T${horaPadded}:00:00`;

      for (let i = 0; i < sessions; i++) {
        resultado.push({
          id: String(globalId++), // id único
          uid: "a",
          desc: [],
          created_at: fechaHora,
          events: "inicio",
          tienda: pagePath.split("/t/")[1] || null,
        });
      }
    });
  });

  return resultado;
}

// Util: transforma "YYYY-MM-DD" a mismo formato (mantengo para compatibilidad)
function convertDateToMonthDay(dateString) {
  // si dateString ya está en formato YYYY-MM-DD devolvemos igual
  return dateString;
}

// Helper: formatea un objeto Date a "YYYY-MM-DD" usando la hora LOCAL
function formatDateLocal(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Helper: parsea una cadena "YYYY-MM-DD" y devuelve un Date en hora LOCAL (medianoche local)
function parseDateOnly(dateString) {
  const [y, m, day] = dateString.split("-").map(Number);
  return new Date(y, m - 1, day); // Date(year, monthIndex, day) en local
}

// Cuenta entradas por cada uno de los últimos 90 días (incluye hoy)
// entries: array con created_at en formato "YYYY-MM-DDTHH:MM:SS" o "YYYY-MM-DD..."
function countEntriesInLast90Days(entries) {
  const counts = {};
  const today = new Date();
  // Empezamos 89 días atrás para tener 90 días incluyendo hoy
  const start = new Date(today);
  start.setDate(start.getDate() - 89);

  // Inicializar contador para cada fecha usando formato local
  for (let i = 0; i < 90; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = formatDateLocal(d);
    counts[key] = 0;
  }

  // Contar las entradas, parseando solo la parte YYYY-MM-DD
  entries.forEach((entry) => {
    if (!entry || !entry.created_at) return;
    const datePart = entry.created_at.split("T")[0]; // toma la parte de fecha
    if (!datePart) return;
    // Normalizar la fecha con parseDateOnly -> formatDateLocal (evita problemas de parsing)
    const entryDate = parseDateOnly(datePart);
    const key = formatDateLocal(entryDate);
    if (counts[key] !== undefined) counts[key] += 1;
  });

  // Devolver ordenado cronológicamente
  return Object.keys(counts)
    .sort()
    .map((date) => ({ date, count: counts[date] }));
}

// Cuenta entradas por cada uno de los últimos 7 días (incluye hoy)
function countEntriesInLast7Days(entries) {
  const counts = {};
  const today = new Date();
  // Empezamos 6 días atrás para tener 7 días incluyendo hoy
  const start = new Date(today);
  start.setDate(start.getDate() - 6);

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = formatDateLocal(d);
    counts[key] = 0;
  }

  entries.forEach((entry) => {
    if (!entry || !entry.created_at) return;
    const datePart = entry.created_at.split("T")[0];
    if (!datePart) return;
    const entryDate = parseDateOnly(datePart);
    const key = formatDateLocal(entryDate);
    if (counts[key] !== undefined) counts[key] += 1;
  });

  return Object.keys(counts)
    .sort()
    .map((date) => ({ date, count: counts[date] }));
}

// Filtra entradas en los últimos 30 días (incluye hoy). Asegúrate que entry.created_at use 'T' separator.
const filterDatesInLast30Days = (entries) => {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 29); // 30 días incluyendo hoy

  return entries.filter((entry) => {
    const created = entry.created_at || "";
    const datePart = created.split("T")[0]; // usar 'T' (ISO)
    if (!datePart) return false;
    const entryDate = new Date(datePart + "T00:00:00"); // comienzo del día
    return (
      entryDate >= new Date(start.toISOString().split("T")[0] + "T00:00:00") &&
      entryDate <= new Date(today.toISOString().split("T")[0] + "T23:59:59")
    );
  });
};

// Filtra entradas en los últimos 7 días (incluye hoy)
const filterDatesInLast7Days = (entries) => {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 6); // 7 días incluyendo hoy

  return entries.filter((entry) => {
    const created = entry.created_at || "";
    const datePart = created.split("T")[0];
    if (!datePart) return false;
    const entryDate = new Date(datePart + "T00:00:00");
    return (
      entryDate >= new Date(start.toISOString().split("T")[0] + "T00:00:00") &&
      entryDate <= new Date(today.toISOString().split("T")[0] + "T23:59:59")
    );
  });
};

// Contar visitas por hora (0-23)
function contarVisitasPorHora(fechaArray) {
  const contadorHoras = Array(24).fill(0);

  fechaArray.forEach((fecha) => {
    // created_at es ISO -> new Date lo parsea
    const d = new Date(fecha.created_at);
    if (!isNaN(d.getTime())) {
      const hora = d.getHours();
      contadorHoras[hora] += 1;
    }
  });

  return contadorHoras.map((cantidad, index) => ({
    hora: `${index < 10 ? "0" : ""}${index}:00`,
    cantidad,
  }));
}

// Promedio visitas por mes
function promedioVisitasPorMes(fechaArray) {
  const contadorMeses = {};

  fechaArray.forEach((fecha) => {
    const d = new Date(fecha.created_at);
    if (isNaN(d.getTime())) return;
    // Formato "mes año" en idioma por defecto del runtime (puede salir en inglés si el server está en EN)
    const mes = d.toLocaleString("default", { month: "long" });
    const anio = d.getFullYear();
    const claveMes = `${mes} ${anio}`;
    contadorMeses[claveMes] = (contadorMeses[claveMes] || 0) + 1;
  });

  const totalMeses = Object.keys(contadorMeses).length || 0;
  const totalOcurrencias = Object.values(contadorMeses).reduce(
    (acc, curr) => acc + curr,
    0
  );
  const promedio = totalMeses === 0 ? 0 : totalOcurrencias / totalMeses;

  return {
    contadorMeses,
    promedio: Number.isNaN(promedio) ? 0 : promedio,
  };
}

// Calcula promedio visitas por día (agrupado)
function calcularPromedioVisitasPorDia(datos) {
  const visitasPorDia = datos.reduce((acc, visita) => {
    const fecha = (visita.created_at || "").split("T")[0];
    if (!fecha) return acc;
    if (!acc[fecha]) acc[fecha] = 0;
    acc[fecha] += 1;
    return acc;
  }, {});

  const totalVisitas = Object.values(visitasPorDia).reduce(
    (acc, v) => acc + v,
    0
  );
  const numeroDeDias = Object.keys(visitasPorDia).length || 0;
  const promedio = numeroDeDias === 0 ? 0 : totalVisitas / numeroDeDias;

  return { visitasPorDia, promedio };
}

// Obtiene visitas por producto a partir del response de GA (response.rows)
function getProductVisits(response) {
  const productVisits = {};
  if (!response?.rows) return productVisits;

  response.rows.forEach((row) => {
    const pagePath =
      (row.dimensionValues &&
        row.dimensionValues[0] &&
        row.dimensionValues[0].value) ||
      "";
    const sessions = parseInt(
      (row.metricValues && row.metricValues[0] && row.metricValues[0].value) ||
        "0",
      10
    );

    // Extraer productId (todo lo que venga después de /products/)
    const parts = pagePath.split("/products/");
    if (parts.length > 1) {
      const productId = parts[1].split(/[/?#]/)[0]; // toma solo el primer segmento
      productVisits[productId] = (productVisits[productId] || 0) + sessions;
    }
  });

  return productVisits;
}
