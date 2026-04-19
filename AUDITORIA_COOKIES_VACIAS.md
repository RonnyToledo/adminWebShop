# 🔍 AUDITORÍA DE SESIÓN: Cookies Vacías y Sincronización

## El Problema: "Vacío Existente en Cookies"

**Escenario:** Usuario recarga la página. Las cookies existen pero Supabase las considera inválidas.

```
Browser tiene:
├─ sb-access-token (expirado o inválido)
├─ sb-refresh-token (inválido o revocado)
└─ Esperaría login automático

Servidor responde:
├─ Cookies no pueden renovarse
├─ getUser() retorna null
└─ Pero las cookies PERMANECEN en navegador
```

---

## 🚨 PUNTOS VULNERABLES IDENTIFICADOS

### 1. **Middleware: No Limpia Cookies Inválidas**

**Archivo:** `src/middleware.js`

**Problema:**

```javascript
try {
  await getSessionWithRetry(supabase);
} catch (error) {
  // ⚠️ Solo log, continúa
  console.error("Middleware: Error sincronizando sesión:", error);
}
return res; // Retorna con cookies INTACTAS
```

Si `getSession()` falla 3 veces, ¿qué pasa?

- ✅ Middleware NO bloquea (bien)
- ✅ Request continúa (bien)
- ❌ Pero cookies INVÁLIDAS se propagan intactas
- ❌ Usuario puede tener cookies pero estar deslogueado

**Impacto:** Confusión en cliente sobre estado de sesión

---

### 2. **Layout: No Valida Consistencia Cookies-JWT**

**Archivo:** `src/app/layout.js`

**Problema:**

```javascript
const userData = await getServerUser(); // Retorna null si JWT inválido

// Si userData es null:
// ✓ Se pasa user=null al Provider
// ✓ Provider redirige a /login
// ✓ Cookies siguen ahí (intactas)

// ← El cliente verá cookies en DevTools pero estará en /login
// ← Esto es confuso pero "correcto" técnicamente
```

**Impacto:** Experiencia confusa para debugging

---

### 3. **MyProvider: No Limpia Cookies en Contexto**

**Archivo:** `src/context/useContext.js`

**Problema:**

```javascript
// En el Provider:
useEffect(() => {
  if (user) isLogin.current = true;
  handleUserValidation();
}, [user]);

// Si user cambia de truthy a falsy:
// ✓ Se ejecuta handleUserValidation()
// ✓ Se redirige a /login
// ❌ Pero NO limpia las cookies del navegador
// ❌ Cookies permanecen como "fantasma"
```

**Impacto:** Cookies obsoletas en navegador

---

### 4. **Route DELETE /api/login: Sin Limpieza Fallida**

**Archivo:** `src/app/api/login/route.js`

**Problema:**

```javascript
export async function DELETE() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return errorResponse("SERVER_ERROR", ...);
      // ← Pero las cookies PUEDEN NO LIMPIARSE
    }
    // Supabase automáticamente limpia cookies
  } catch (err) {
    // ← Si hay excepción, cookies quedan INTACTAS
    return errorResponse("SERVER_ERROR", ...);
  }
}

// Resultado: Si DELETE falla, cookies permanecen
```

**Impacto:** Logout incompleto

---

### 5. **getServerUser: No Diferencia "Sin JWT" de "JWT Inválido"**

**Archivo:** `src/lib/server-auth.js`

**Problema:**

```javascript
export async function getServerUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null; // ← Mismo resultado para ambos
    return { ...user };
  } catch {
    return null;
  }
}

// No diferencia:
// 1. "No hay JWT" (esperado en primer acceso)
// 2. "JWT inválido pero cookies existen" (problema)
// 3. "Timeout en getUser" (error temporal)
```

**Impacto:** No se puede actuar sobre problemas específicos

---

### 6. **Contexto: Sin Sincronización de Estado de Cookies**

**Archivo:** `src/context/useContext.js`

**Problema:**

```javascript
// El contexto NO tiene mecanismo para:
// 1. Detectar que cookies son inválidas
// 2. Limpiarlas proactivamente
// 3. Sincronizar con estado real en servidor

// Solo depende del prop 'user' que viene del layout
// Si el layout se renderiza con user=null pero cookies existen:
// → Contexto NO sabe que hay cookies fantasma
```

**Impacto:** Sin forma de sincronizar estado

---

## ✅ SOLUCIONES PROPUESTAS

### **Solución 1: Middleware con Limpieza Activa**

```javascript
// Antes: Solo logs, continúa
try {
  await getSessionWithRetry(supabase);
} catch (error) {
  // Después: Detecta y marca como inválidas
  res.cookies.delete("sb-access-token");
  res.cookies.delete("sb-refresh-token");
  // ← Limpia cookies en response
}
```

---

### **Solución 2: Layout con Validación Consistente**

```javascript
// Después de getServerUser():
const userData = await getServerUser();

// Si userData es null pero hay cookies:
if (!userData && hasCookies(req)) {
  // Señal: Cookies inválidas
  // Instruy al cliente a limpiarlas
  // Agregúe header: X-Clear-Cookies
}
```

---

### **Solución 3: Contexto Global con Sincronización**

```javascript
// En MyProvider:
useEffect(() => {
  if (!user && isLogin.current) {
    // Usuario desconectado
    // Limpiar cookies del cliente
    if (typeof window !== "undefined") {
      document.cookie = "sb-access-token=; path=/; max-age=0";
      document.cookie = "sb-refresh-token=; path=/; max-age=0";
    }
  }
  isLogin.current = !!user;
}, [user]);
```

---

### **Solución 4: DELETE Endpoint con Limpieza Fallida**

```javascript
// En DELETE /api/login:
export async function DELETE() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    // Intenta limpiar cookies desde servidor de todas formas
    const response = errorResponse("LOGOUT_INCOMPLETE", ...);
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    return response;
  }

  // Éxito
  return successResponse("Logout exitoso");
}
```

---

### **Solución 5: getServerUser Mejorado**

```javascript
// Diferencia casos específicos:
export async function getServerUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      // Diferencia: JWT inválido vs timeout
      if (error.message.includes("timeout")) {
        return { error: "TIMEOUT", user: null };
      } else if (error.message.includes("invalid")) {
        return { error: "INVALID_JWT", user: null };
      }
    }

    return { error: null, user: user ?? null };
  } catch (err) {
    return { error: "FETCH_ERROR", user: null };
  }
}
```

---

### **Solución 6: Hook de Sincronización de Cookies**

```javascript
// Nuevo archivo: src/hooks/useSessionSync.js
export function useSessionSync() {
  useEffect(() => {
    // Valida cada 5 minutos si cookies son aún válidas
    const interval = setInterval(async () => {
      const response = await fetch("/api/login", {
        credentials: "include",
      });

      if (!response.ok) {
        // Cookies inválidas, limpiarlas
        document.cookie = "sb-access-token=; path=/; max-age=0";
        document.cookie = "sb-refresh-token=; path=/; max-age=0";
      }
    }, 5 * 60_000); // 5 minutos

    return () => clearInterval(interval);
  }, []);
}
```

---

## 🎯 ORDEN DE PRIORIDAD DE SOLUCIONES

| Prioridad | Solución                    | Impacto                | Dificultad |
| --------- | --------------------------- | ---------------------- | ---------- |
| **1**     | Middleware con limpieza     | Evita cookies fantasma | ⭐ Bajo    |
| **2**     | DELETE mejorado             | Logout consistente     | ⭐ Bajo    |
| **3**     | getServerUser diferenciador | Debugging mejor        | ⭐ Bajo    |
| **4**     | Contexto con limpieza       | Sincronización cliente | ⭐⭐ Medio |
| **5**     | Hook de sincronización      | Validación periódica   | ⭐⭐ Medio |
| **6**     | Layout con header           | Señalización de estado | ⭐ Bajo    |

---

## 📊 IMPACTO DE IMPLEMENTAR TODAS

**Antes:**

- Cookies pueden quedar "fantasma"
- Usuario confundido en estado de sesión
- Logout incompleto
- Sin forma de limpiar desde cliente

**Después:**

- ✅ Cookies siempre consistentes con JWT
- ✅ Limpieza automática en middleware
- ✅ Sincronización periódica
- ✅ Logout garantizado
- ✅ Estados de error diferenciados
