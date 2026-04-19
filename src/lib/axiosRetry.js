import axios from "axios";

const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1s

/**
 * Exponential backoff delay calculator
 * @param {number} retryCount - Número de reintentos
 * @returns {number} Delay en ms
 */
function getRetryDelay(retryCount) {
  const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount - 1);
  // Agregar jitter (±20%)
  const jitter = delay * 0.2 * (Math.random() - 0.5);
  return Math.round(delay + jitter);
}

/**
 * Determina si un error puede ser reintentado
 */
function isRetryableError(error) {
  // Timeout o error de red
  if (error.code === "ECONNABORTED" || error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
    return true;
  }

  // Status codes retryables
  if (error.response && RETRYABLE_STATUS_CODES.includes(error.response.status)) {
    return true;
  }

  // Sin respuesta (problemas de conexión)
  if (!error.response) {
    return true;
  }

  return false;
}

/**
 * Configura axios con reintentos automáticos
 * @param {AxiosInstance} axiosInstance - Instancia de axios a configurar
 */
export function setupAxiosRetry(axiosInstance = axios) {
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config;

      // Inicializar contador de reintentos
      if (!config.__retryCount) {
        config.__retryCount = 0;
      }

      // Verificar si debemos reintentar
      if (config.__retryCount < MAX_RETRIES && isRetryableError(error)) {
        config.__retryCount += 1;
        const delay = getRetryDelay(config.__retryCount);

        console.warn(
          `[Axios Retry] Reintentando ${config.__retryCount}/${MAX_RETRIES} para ${config.method?.toUpperCase()} ${config.url} en ${delay}ms`
        );

        // Esperar antes de reintentar
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Reintentar
        return axiosInstance(config);
      }

      return Promise.reject(error);
    }
  );
}

/**
 * Wrapper para fetch con reintentos
 */
export async function fetchWithRetry(
  url,
  options = {},
  maxRetries = MAX_RETRIES
) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      if (!response.ok && attempt < maxRetries) {
        // Si es retryable, continuar
        if (RETRYABLE_STATUS_CODES.includes(response.status)) {
          const delay = getRetryDelay(attempt);
          console.warn(
            `[Fetch Retry] Reintentando ${attempt}/${maxRetries} para ${options.method || "GET"} ${url} en ${delay}ms`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      return response;
    } catch (error) {
      lastError = error;

      // Si es retryable y no es el último intento
      if (attempt < maxRetries && isRetryableError(error)) {
        const delay = getRetryDelay(attempt);
        console.warn(
          `[Fetch Retry] Reintentando ${attempt}/${maxRetries} para ${options.method || "GET"} ${url} en ${delay}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Si es el último intento, lanzar error
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Falló después de múltiples reintentos");
}
