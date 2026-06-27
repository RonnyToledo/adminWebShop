"use client";

import axios from "axios";
import { setupAxiosRetry } from "./axiosRetry";

// Crear instancia de axios con defaults
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  timeout: 30000, // 30 segundos
  withCredentials: true, // Incluir cookies
});

// Configurar reintentos automáticos
setupAxiosRetry(apiClient);

// Interceptor para manejar FormData y logs
apiClient.interceptors.request.use((config) => {
  // Si es FormData, dejar que axios establezca el Content-Type automáticamente
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  } else if (config.data && typeof config.data === "object") {
    // Para objetos planos, establecer JSON
    config.headers["Content-Type"] = "application/json";
  }
  
  console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    console.debug(`[API] ✓ ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(
      `[API] ✗ ${error.response?.status || "Error"} ${error.config?.url}`,
      error.message
    );
    return Promise.reject(error);
  }
);

export default apiClient;
