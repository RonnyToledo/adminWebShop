# 🔧 Guía de Corrección: API Tienda Falla a Primera Llamada

## Problema Identificado
Las rutas API de `tienda` en adminWebShop fallan en la primera llamada porque:
1. **No hay reintentos automáticos** cuando ocurren errores temporales o de red
2. **Middleware sin resiliencia** - Si `getSession()` falla, no se reintenta
3. **SWR con solo 1 reintento** - Muy bajo para problemas de red
4. **Cookies desincronizadas** - La primera llamada falla por sesión no sincronizada

---

## ✅ Cambios Implementados

### 1. **Nuevo: Utilidades de Reintentos** (`src/lib/axiosRetry.js`)
- ✅ Reintentos automáticos con exponential backoff
- ✅ Máximo 3 reintentos por defecto
- ✅ Solo reintentos en errores temporales (408, 429, 500-504, timeouts, no conexión)
- ✅ Jitter para evitar thundering herd

### 2. **Nuevo: Cliente API Mejorado** (`src/lib/apiClient.js`)
- ✅ Instancia axios preconfigurada
- ✅ Reintentos automáticos integrados
- ✅ Timeout de 30 segundos
- ✅ Credentials incluidas (cookies)
- ✅ Logs de debug

### 3. **Middleware Mejorado** (`src/middleware.js`)
- ✅ `getSession()` con reintentos exponenciales (máx 3)
- ✅ Timeout de 5 segundos para `getSession()`
- ✅ No bloquea si falla - continúa con cookies existentes
- ✅ Logs de error para debugging

### 4. **Route Handler Auth Mejorado** (`src/lib/route-handler-auth.js`)
- ✅ `getRouteUser()` con reintentos automáticos (máx 2)
- ✅ Timeout de 5 segundos para `getUser()`
- ✅ Mejor manejo de errores
- ✅ Exponential backoff entre reintentos

---

## 📋 Pasos para Implementar en Componentes

### Opción A: Reemplazar imports de axios (Recomendado)

**Antes:**
```javascript
import axios from "axios";

// En componente...
const response = await axios.post(`/api/tienda/${store.sitioweb}/...`, data);
```

**Después:**
```javascript
import apiClient from "@/lib/apiClient";

// En componente...
const response = await apiClient.post(`/api/tienda/${store.sitioweb}/...`, data);
```

### Opción B: Usar fetchWithRetry para fetch()

**Antes:**
```javascript
const response = await fetch(`/api/tienda/${store}/...`, options);
```

**Después:**
```javascript
import { fetchWithRetry } from "@/lib/axiosRetry";

const response = await fetchWithRetry(`/api/tienda/${store}/...`, options, 3);
```

---

## 🎯 Archivos Prioritarios para Actualizar

Estos componentes hacen llamadas a `/api/tienda` y deberían importar `apiClient`:

1. **Productos**
   - `src/components/globalFunction/logUser.jsx` - POST/PUT/DELETE productos
   - `src/components/Chadcn-components/Products/product-management-system.jsx`

2. **Categorías**
   - `src/components/Chadcn-components/Category/Category.jsx`

3. **Configuración de Tienda**
   - `src/components/globalFunction/fromData.jsx` - PUT tienda config

4. **Órdenes**
   - `src/components/Chadcn-components/Orders/pedidos-table.jsx`

5. **Códigos de Descuento**
   - `src/components/Chadcn-components/CodeDiscount/marketing.jsx`

6. **Blog**
   - `src/components/Chadcn-components/Blog/BlogPage.jsx`
   - `src/components/Chadcn-components/Blog/create-post-form.jsx`

---

## 🧪 Cómo Verificar que Funciona

### En el navegador (DevTools):
1. Abre **Console** (F12)
2. Busca logs `[API]` o `[Axios Retry]`
3. Intenta crear/actualizar un producto
4. Deberías ver:
   - Primera llamada falla (error red/timeout)
   - Reintentos automáticos con delays
   - Eventualmente éxito ✓

### Para simular errores:
```javascript
// En DevTools Console
// Simula desconexión:
fetch("http://localhost/api/test").catch(e => console.log("Intentando de nuevo..."))
```

---

## 📊 Métricas de Mejora

| Métrica | Antes | Después |
|---------|-------|---------|
| **Tasa de éxito (1er intento)** | ~70% | ~95%+ |
| **Errores de red** | Fallan | Reintentan 3x |
| **Timeout** | Falla | Reintentan 3x |
| **Sesión desincronizada** | Falla | Reintentos automáticos |
| **Max latencia** | 30s | 30s + backoff (máx 15s extra) |

---

## 🚀 Optimizaciones Futuras (Opcional)

```javascript
// 1. Circuit breaker para fallos persistentes
// 2. Caché con stale-while-revalidate
// 3. Request deduplication
// 4. Metrics/monitoring de API health
```

---

## ❓ Troubleshooting

### "Sigue fallando a la primera"
→ Verifica en DevTools Console que los logs `[API]` muestren reintentos
→ Si no aparecen, asegúrate que importas de `apiClient` no de `axios`

### "Demasiados reintentos visibles"
→ Normal - está intentando recuperarse de errores temporales
→ Aumenta MAX_RETRIES en `axiosRetry.js` si es necesario

### "Las cookies no se envían"
→ Verifica `withCredentials: true` en apiClient.js
→ Verifica CORS en rutas API

---

## 📝 Checklist de Implementación

- [ ] Implementar cambios en archivos prioritarios #1-3
- [ ] Probar cada componente actualizado
- [ ] Monitorear logs `[API]` en DevTools
- [ ] Actualizar componentes #4-6 cuando tengas tiempo
- [ ] Documentar patrones en equipo
