import { GoogleAuth } from "google-auth-library";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";

// Si en tu proyecto ya tienes un cliente de Supabase compartido (ej. en
// @/lib/supabase), reemplaza esto por un import de ese cliente en vez de
// crear uno nuevo aquí.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

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

// Reutiliza el cliente autenticado entre invocaciones del proceso en vez de
// volver a autenticar en cada cache-miss.
let cachedClientPromise = null;
function getAuthClient() {
  if (!cachedClientPromise) {
    cachedClientPromise = auth.getClient();
  }
  return cachedClientPromise;
}

// Los blogs se crean desde el módulo central y pertenecen a una tienda vía
// `blogs.ui_store`, sin importar si se visitan por /t/[tienda]/blog/[id] o
// por la ruta global /blog/[id]. NOTA: asumo que `tienda` (el param de la
// URL /t/[tienda]) es el mismo valor que `Sitios.UUID` = `blogs.ui_store`.
// Si en tu app `tienda` es en realidad un slug distinto al UUID, resuelve
// primero el UUID de la tienda y pásalo aquí en vez de `tienda` directo.
async function getStoreBlogIds(tienda) {
  const { data, error } = await supabase
    .from("blogs")
    .select("id, slug")
    .eq("ui_store", tienda);

  if (error) {
    console.error("Error obteniendo blogs de la tienda:", error.message);
    return { ids: new Set(), slugs: new Set() };
  }

  return {
    ids: new Set((data || []).map((b) => String(b.id))),
    slugs: new Set((data || []).map((b) => b.slug).filter(Boolean)),
  };
}

async function runReport(token, body) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GA API error ${res.status}: ${err}`);
  }
  return res.json();
}

export async function fetchGAData(tienda) {
  return unstable_cache(
    async () => {
      try {
        const client = await getAuthClient();
        const { token } = await client.getAccessToken();

        const tiendaPath = `/t/${tienda}`;

        // Blogs que pertenecen a esta tienda (por id numérico o slug), para
        // poder filtrar las visitas que entran por la ruta global /blog/.
        const { ids: storeBlogIds, slugs: storeBlogSlugs } =
          await getStoreBlogIds(tienda);
        const belongsToStoreBlog = (identifier) =>
          storeBlogIds.has(identifier) || storeBlogSlugs.has(identifier);

        // 1) Un único request cubre página principal + productos + blog de
        // la tienda (antes eran dos llamadas con el mismo BEGINS_WITH). Se
        // separan en el cliente.
        const pathReport = runReport(token, {
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
              stringFilter: { matchType: "BEGINS_WITH", value: tiendaPath },
            },
          },
          limit: 100000,
        });

        // 2) Reporte de engagement/adquisición, acotado SOLO a la página
        // raíz de la tienda (sin desglosar por pagePath/hora) para no
        // disparar la cardinalidad con dispositivo + canal.
        const engagementReport = runReport(token, {
          dimensions: [
            { name: "date" },
            { name: "deviceCategory" },
            { name: "sessionDefaultChannelGroup" },
          ],
          metrics: [
            { name: "sessions" },
            { name: "activeUsers" },
            { name: "newUsers" },
            { name: "averageSessionDuration" },
            { name: "bounceRate" },
          ],
          dateRanges: [{ startDate: "90daysAgo", endDate: "today" }],
          dimensionFilter: {
            filter: {
              fieldName: "pagePath",
              stringFilter: { matchType: "EXACT", value: tiendaPath },
            },
          },
          limit: 10000,
        });

        // 3) La ruta global /blog/[id] NO cuelga de /t/${tienda}, así que
        // necesita su propio request; luego se filtra en el cliente contra
        // los blog_id/slug que sí pertenecen a esta tienda.
        const globalBlogReport = runReport(token, {
          dimensions: [{ name: "pagePath" }, { name: "date" }],
          metrics: [{ name: "sessions" }],
          dateRanges: [{ startDate: "90daysAgo", endDate: "today" }],
          dimensionFilter: {
            filter: {
              fieldName: "pagePath",
              stringFilter: { matchType: "BEGINS_WITH", value: "/blog/" },
            },
          },
          limit: 100000,
        });

        const [response, engagement, globalBlog] = await Promise.all([
          pathReport,
          engagementReport,
          globalBlogReport,
        ]);

        const rows = response.rows || [];
        const mainRows = rows.filter(
          (row) => row.dimensionValues[0].value === tiendaPath,
        );
        const productRows = rows.filter((row) => {
          const path = row.dimensionValues[0].value;
          return (
            path.startsWith(`${tiendaPath}/products/`) ||
            path.startsWith(`${tiendaPath}/producto/`)
          );
        });
        const blogRowsStore = rows.filter((row) =>
          row.dimensionValues[0].value.startsWith(`${tiendaPath}/blog/`),
        );
        const blogRowsGlobal = (globalBlog.rows || []).filter((row) => {
          const identifier = extractSegmentAfter(
            row.dimensionValues[0].value,
            "/blog/",
          );
          return identifier && belongsToStoreBlog(identifier);
        });

        const engagementRows = engagement.rows || [];
        const totalSessions = sumMetric(mainRows, 0);

        // "Hoy" se calcula a partir de la fecha máxima que realmente vino en
        // los datos, no de la hora del servidor: evita desfases cuando el
        // servidor y la propiedad de GA están en husos horarios distintos.
        const referenceDate = getMaxDate(mainRows);

        return {
          calcularPromedioVisitasPorDia:
            calcularPromedioVisitasPorDia(mainRows),
          countEntriesInLast90Days: countEntriesInLastNDays(
            mainRows,
            90,
            referenceDate,
          ),
          countEntriesInLast7Days: countEntriesInLastNDays(
            mainRows,
            7,
            referenceDate,
          ),
          filterDatesInLast30Days: countTotalSessionsInLastNDays(
            mainRows,
            30,
            referenceDate,
          ),
          contarVisitasPorHora: contarVisitasPorHora(mainRows),
          promedioVisitasPorMes: promedioVisitasPorMes(mainRows),
          cant: totalSessions,
          visitasProductos: getProductVisits(productRows),
          visitasBlog: getBlogVisits(blogRowsStore, blogRowsGlobal, tiendaPath),

          // --- Métricas nuevas ---
          usuarios: {
            activos: sumMetric(engagementRows, 1),
            nuevos: sumMetric(engagementRows, 2),
          },
          duracionPromedioSesionSeg: averageMetric(engagementRows, 3),
          tasaRebote: averageMetric(engagementRows, 4),
          visitasPorDispositivo: groupByDimension(engagementRows, 1, 0),
          visitasPorCanal: groupByDimension(engagementRows, 2, 0),
        };
      } catch (error) {
        console.error("Error:", error.message);
        return {
          error: error.message,
          cant: 0,
          visitasProductos: {},
          visitasBlog: {},
          usuarios: { activos: 0, nuevos: 0 },
          duracionPromedioSesionSeg: 0,
          tasaRebote: 0,
          visitasPorDispositivo: {},
          visitasPorCanal: {},
        };
      }
    },
    [`ga-data-${tienda}`],
    { revalidate: 3600, tags: [`ga-${tienda}`] },
  )();
}

// ---------------- Helpers ----------------

function formatDateLocal(d) {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseGADate(dateStr) {
  return new Date(
    `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T00:00:00Z`,
  );
}

function getMaxDate(rows) {
  let max = null;
  rows.forEach((row) => {
    const d = parseGADate(row.dimensionValues[2].value);
    if (!max || d > max) max = d;
  });
  return max || new Date();
}

function sumMetric(rows, metricIndex) {
  return rows.reduce(
    (acc, row) =>
      acc + (parseInt(row.metricValues[metricIndex]?.value, 10) || 0),
    0,
  );
}

function averageMetric(rows, metricIndex) {
  if (!rows.length) return 0;
  const total = rows.reduce(
    (acc, row) => acc + (parseFloat(row.metricValues[metricIndex]?.value) || 0),
    0,
  );
  return total / rows.length;
}

// Agrupa sesiones (u otra métrica) por un valor de dimensión, ej. dispositivo o canal.
function groupByDimension(rows, dimensionIndex, metricIndex) {
  const grouped = {};
  rows.forEach((row) => {
    const key = row.dimensionValues[dimensionIndex]?.value || "(sin dato)";
    const value = parseInt(row.metricValues[metricIndex]?.value, 10) || 0;
    grouped[key] = (grouped[key] || 0) + value;
  });
  return grouped;
}

function countEntriesInLastNDays(rows, n, referenceDate = new Date()) {
  const counts = {};
  const start = new Date(referenceDate);
  start.setUTCDate(start.getUTCDate() - (n - 1));

  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    counts[formatDateLocal(d)] = 0;
  }

  rows.forEach((row) => {
    const dateStr = row.dimensionValues[2].value;
    const sessions = parseInt(row.metricValues[0].value, 10);
    const formattedDate = formatDateLocal(parseGADate(dateStr));
    if (counts[formattedDate] !== undefined) {
      counts[formattedDate] += sessions;
    }
  });

  return Object.keys(counts)
    .sort()
    .map((date) => ({ date, count: counts[date] }));
}

function countTotalSessionsInLastNDays(rows, n, referenceDate = new Date()) {
  const start = new Date(referenceDate);
  start.setUTCDate(start.getUTCDate() - (n - 1));

  let total = 0;
  rows.forEach((row) => {
    const entryDate = parseGADate(row.dimensionValues[2].value);
    const sessions = parseInt(row.metricValues[0].value, 10);
    if (entryDate >= start) {
      total += sessions;
    }
  });
  return total;
}

function contarVisitasPorHora(rows) {
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

const MES_FORMATTER = new Intl.DateTimeFormat("es-ES", {
  month: "long",
  year: "numeric",
});

function promedioVisitasPorMes(rows) {
  // Clave ISO (YYYY-MM) para poder ordenar cronológicamente; la etiqueta en
  // español se guarda aparte y ya no depende del locale del servidor.
  const contadorMeses = {};
  rows.forEach((row) => {
    const dateStr = row.dimensionValues[2].value;
    const sessions = parseInt(row.metricValues[0].value, 10);
    const claveIso = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}`;
    contadorMeses[claveIso] = (contadorMeses[claveIso] || 0) + sessions;
  });

  const clavesOrdenadas = Object.keys(contadorMeses).sort();
  const porMes = clavesOrdenadas.map((clave) => {
    const [anio, mes] = clave.split("-");
    const etiqueta = MES_FORMATTER.format(new Date(Date.UTC(anio, mes - 1, 1)));
    return { clave, etiqueta, sessions: contadorMeses[clave] };
  });

  const totalMeses = clavesOrdenadas.length;
  const totalSessions = Object.values(contadorMeses).reduce(
    (acc, curr) => acc + curr,
    0,
  );
  const promedio = totalMeses === 0 ? 0 : totalSessions / totalMeses;

  return { porMes, promedio: isNaN(promedio) ? 0 : promedio };
}

function calcularPromedioVisitasPorDia(rows) {
  const visitasPorDia = {};
  rows.forEach((row) => {
    const dateStr = row.dimensionValues[2].value;
    const sessions = parseInt(row.metricValues[0].value, 10);
    const formattedDate = formatDateLocal(parseGADate(dateStr));
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

// Extrae el segmento de la URL justo después de `marker`, cortando en el
// siguiente "/", "?" o "#". Ej: extractSegmentAfter("/t/x/blog/9-hola?a=1", "/blog/") -> "9-hola"
function extractSegmentAfter(pagePath, marker) {
  const idx = pagePath.indexOf(marker);
  if (idx === -1) return null;
  const rest = pagePath.slice(idx + marker.length);
  const segment = rest.split(/[/?#]/)[0];
  return segment || null;
}

function getProductVisits(rows) {
  const productVisits = {};
  rows.forEach((row) => {
    const pagePath = row.dimensionValues[0].value || "";
    const sessions = parseInt(row.metricValues[0].value, 10);
    // Soporta ambos patrones de ruta: /products/ (plural) y /producto/ (singular).
    const productId =
      extractSegmentAfter(pagePath, "/products/") ??
      extractSegmentAfter(pagePath, "/producto/");
    if (productId) {
      productVisits[productId] = (productVisits[productId] || 0) + sessions;
    }
  });
  return productVisits;
}

// Combina las visitas de blog que entran por /t/[tienda]/blog/[id] con las
// que entran por la ruta global /blog/[id] (ya pre-filtradas para que solo
// incluyan blog_id/slug que pertenecen a esta tienda).
function getBlogVisits(storeRows, globalRows, tiendaPath) {
  const visitas = {};
  const add = (rows, marker) => {
    rows.forEach((row) => {
      const identifier = extractSegmentAfter(
        row.dimensionValues[0].value,
        marker,
      );
      if (!identifier) return;
      const sessions = parseInt(row.metricValues[0].value, 10) || 0;
      visitas[identifier] = (visitas[identifier] || 0) + sessions;
    });
  };

  add(storeRows, `${tiendaPath}/blog/`);
  add(globalRows, "/blog/");

  return visitas;
}
