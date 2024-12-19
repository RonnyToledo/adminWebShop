import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { GoogleAuth } from "google-auth-library";
import { NextResponse } from "next/server";

const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
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

    // Formatea los datos de Analytics
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

function convertDateToMonthDay(dateString) {
  const parts = dateString.split("-");
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  return `${year}-${month}-${day}`;
}

function countEntriesInLast90Days(entries) {
  const counts = {};
  const currentDate = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(currentDate.getDate() - 92);
  thirtyDaysAgo.setDate(currentDate.getDate() - 1);

  // Inicializar el contador para cada uno de los últimos 30 días
  for (let i = 0; i <= 90; i++) {
    const date = new Date(thirtyDaysAgo);
    date.setDate(thirtyDaysAgo.getDate() + i);
    const dateString = date.toISOString().split("T")[0];
    counts[dateString] = 0;
  }
  // Contar las entradas por fecha
  entries.forEach((entry) => {
    const date = entry.created_at.split("T")[0];
    if (counts[date] != undefined) {
      counts[date] += 1;
    }
  });

  // Convertir el objeto counts en un arreglo de objetos
  const result = Object.keys(counts).map((date) => ({
    date: convertDateToMonthDay(date),
    count: counts[date],
  }));

  return result;
}
function countEntriesInLast7Days(entries) {
  const counts = {};
  const currentDate = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(currentDate.getDate() - 7);

  // Inicializar el contador para cada uno de los últimos 7 días
  for (let i = 0; i < 7; i++) {
    const date = new Date(sevenDaysAgo);
    date.setDate(sevenDaysAgo.getDate() + i);
    const dateString = date.toISOString().split("T")[0];
    counts[dateString] = 0;
  }

  // Contar las entradas por fecha
  entries.forEach((entry) => {
    const date = entry.created_at.split("T")[0]; // Asegúrate de que entries tenga este formato
    if (counts[date] !== undefined) {
      counts[date] += 1;
    }
  });

  // Convertir el objeto counts en un arreglo de objetos
  const result = Object.keys(counts).map((date) => ({
    date: convertDateToMonthDay(date),
    count: counts[date],
  }));

  return result;
}

const filterDatesInLast30Days = (entries) => {
  const currentDate = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(currentDate.getDate() - 32);
  currentDate.setDate(currentDate.getDate() - 2);
  return entries.filter((entry) => {
    const entryDate = new Date(entry.created_at.split(" ")[0]);
    return entryDate >= thirtyDaysAgo && entryDate <= currentDate;
  });
};

const filterDatesInLast7Days = (entries) => {
  const currentDate = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(currentDate.getDate() - 7);

  return entries.filter((entry) => {
    const entryDate = new Date(entry.created_at.split(" ")[0]);
    return entryDate >= sevenDaysAgo && entryDate <= currentDate;
  });
};

function contarVisitasPorHora(fechaArray) {
  // Inicializar un array para contar las visitas por hora
  const contadorHoras = Array(24).fill(0); // Array para 24 horas, inicializado en 0

  // Recorrer el arreglo de fechas
  fechaArray.forEach((fecha) => {
    const date = new Date(fecha.created_at);
    const hora = date.getHours(); // Extraer la hora (0-23)

    // Incrementar el contador para la hora correspondiente
    contadorHoras[hora] += 1;
  });

  // Crear un array para devolver resultados en el formato requerido
  const resultado = contadorHoras.map((cantidad, index) => ({
    hora: `${index < 10 ? "0" : ""}${index}:00`, // Formato HH:00
    cantidad: cantidad,
  }));

  return resultado;
}
function promedioVisitasPorMes(fechaArray) {
  const contadorMeses = {};

  // Recorrer el arreglo de fechas
  fechaArray.forEach((fecha) => {
    const date = new Date(fecha.created_at);
    const mes = date.toLocaleString("default", { month: "long" }); // Obtener el nombre del mes
    const anio = date.getFullYear(); // Obtener el año

    // Crear una clave única para el mes y el año
    const claveMes = `${mes} ${anio}`;

    // Contar las ocurrencias de cada mes
    contadorMeses[claveMes] = (contadorMeses[claveMes] || 0) + 1;
  });

  // Calcular el promedio
  const totalMeses = Object.keys(contadorMeses).length; // Total de meses únicos
  const totalOcurrencias = Object.values(contadorMeses).reduce(
    (acc, curr) => acc + curr,
    0
  ); // Total de ocurrencias

  const promedio = totalOcurrencias / totalMeses;
  // Devolver el objeto con las ocurrencias por mes y el promedio
  return {
    contadorMeses,
    promedio: Number.isNaN(promedio) ? 0 : promedio, // Evitar NaN si no hay fechas
  };
}

// Función para calcular visitas promedio por día
function calcularPromedioVisitasPorDia(datos) {
  // Agrupar las visitas por fecha
  const visitasPorDia = datos.reduce((acc, visita) => {
    const fecha = visita.created_at.split("T")[0]; // Obtener solo la fecha
    if (!acc[fecha]) {
      acc[fecha] = 0;
    }
    acc[fecha] += 1; // Incrementar la cantidad de visitas para esa fecha
    return acc;
  }, {});

  // Calcular el total de visitas y el número de días
  const totalVisitas = Object.values(visitasPorDia).reduce(
    (acc, visitas) => acc + visitas,
    0
  );
  const numeroDeDias = Object.keys(visitasPorDia).length;

  // Calcular el promedio
  const promedio = totalVisitas / numeroDeDias;

  return { visitasPorDia, promedio };
}
function getProductVisits(response) {
  const productVisits = {};

  response.rows.forEach((row) => {
    // Extraer el `pagePath` y la cantidad de sesiones
    const pagePath = row.dimensionValues[0].value;
    const sessions = parseInt(row.metricValues[0].value, 10);

    // Extraer el `productId` de la ruta
    const productId = pagePath.split("/products/")[1];

    // Sumar las sesiones al total del `productId`
    if (productVisits[productId]) {
      productVisits[productId] += sessions;
    } else {
      productVisits[productId] = sessions;
    }
  });

  return productVisits;
}
