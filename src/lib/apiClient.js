"use client";

import axios from "axios";
import { setupAxiosRetry } from "./axiosRetry";

// Crear instancia de axios con defaults
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  timeout: 30000, // 30 segundos
  withCredentials: true, // Incluir cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Configurar reintentos automáticos
setupAxiosRetry(apiClient);

// Interceptor para logs de debug
apiClient.interceptors.request.use((config) => {
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
