// utils/ga-client.js
import { BetaAnalyticsDataClient } from "@google-analytics/data";

function tryParseJsonSafe(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error("❌ Error parseando JSON:", e.message);
    return null;
  }
}

function decodeBase64IfNeeded(b64) {
  try {
    const raw = Buffer.from(b64, "base64").toString("utf8");
    return raw;
  } catch (e) {
    console.error("❌ Error decodificando Base64:", e.message);
    return null;
  }
}

export function getServiceAccountCredentials() {
  console.log("\n🔍 ===== DIAGNÓSTICO DE CREDENCIALES =====");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("Todas las variables de entorno disponibles:");
  console.log(
    Object.keys(process.env).filter(
      (key) => key.includes("GOOGLE") || key.includes("GA")
    )
  );

  // 1) Preferimos GOOGLE_SERVICE_ACCOUNT_JSON (raw JSON)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    console.log("✅ GOOGLE_SERVICE_ACCOUNT_JSON existe");
    let raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    console.log("Primeros 100 caracteres:", raw.substring(0, 100));
    console.log("Longitud total:", raw.length);

    // Si viene envuelta en comillas por error, intentar limpiar
    if (raw.startsWith("'") && raw.endsWith("'")) {
      console.log("⚠️  Removiendo comillas simples");
      raw = raw.slice(1, -1);
    }
    if (raw.startsWith('"') && raw.endsWith('"')) {
      console.log("⚠️  Removiendo comillas dobles");
      raw = raw.slice(1, -1);
    }

    // Reemplaza escapados de newline si los hay
    raw = raw.replace(/\\n/g, "\n");

    const parsed = tryParseJsonSafe(raw);
    if (parsed) {
      console.log("✅ JSON parseado correctamente");
      console.log("client_email:", parsed.client_email);
      console.log("project_id:", parsed.project_id);
      console.log(
        "private_key (primeros 50 chars):",
        parsed.private_key?.substring(0, 50)
      );
      return parsed;
    }

    // Si no parsea, intentar decodificar base64
    console.log("⚠️  No se pudo parsear como JSON, intentando Base64...");
    const maybeDecoded = decodeBase64IfNeeded(raw);
    if (maybeDecoded) {
      const parsed2 = tryParseJsonSafe(maybeDecoded.replace(/\\n/g, "\n"));
      if (parsed2) {
        console.log("✅ JSON parseado desde Base64");
        console.log("client_email:", parsed2.client_email);
        return parsed2;
      }
    }
  } else {
    console.log("❌ GOOGLE_SERVICE_ACCOUNT_JSON NO existe");
  }

  // 2) Si viene en base64 explícita
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64) {
    console.log("✅ GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 existe");
    const decoded = decodeBase64IfNeeded(
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64
    );
    if (decoded) {
      const parsed = tryParseJsonSafe(decoded.replace(/\\n/g, "\n"));
      if (parsed) {
        console.log("✅ Credenciales cargadas desde Base64");
        return parsed;
      }
    }
  } else {
    console.log("❌ GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 NO existe");
  }

  // 3) Variables separadas (fallback)
  if (process.env.GA_CLIENT_EMAIL && process.env.GA_PRIVATE_KEY) {
    console.log(
      "✅ Usando variables separadas (GA_CLIENT_EMAIL + GA_PRIVATE_KEY)"
    );
    return {
      type: "service_account",
      client_email: process.env.GA_CLIENT_EMAIL,
      private_key: process.env.GA_PRIVATE_KEY.replace(/\\n/g, "\n"),
      project_id: process.env.PROJECT_ID || process.env.GCP_PROJECT_ID,
    };
  } else {
    console.log("❌ Variables separadas NO disponibles");
    console.log("GA_CLIENT_EMAIL existe:", !!process.env.GA_CLIENT_EMAIL);
    console.log("GA_PRIVATE_KEY existe:", !!process.env.GA_PRIVATE_KEY);
  }

  // 4) Fallback null -> deja que la librería use GOOGLE_APPLICATION_CREDENTIALS en disco
  console.log("❌ No se encontraron credenciales válidas");
  console.log("===== FIN DIAGNÓSTICO =====\n");
  return null;
}

export function createAnalyticsClient() {
  const credentials = getServiceAccountCredentials();
  if (credentials) {
    console.log("✅ Creando cliente con credenciales explícitas");
    return new BetaAnalyticsDataClient({ credentials });
  } else {
    console.log(
      "⚠️  Creando cliente sin credenciales (fallback a GOOGLE_APPLICATION_CREDENTIALS)"
    );
    return new BetaAnalyticsDataClient(); // usará GOOGLE_APPLICATION_CREDENTIALS en disco
  }
}
