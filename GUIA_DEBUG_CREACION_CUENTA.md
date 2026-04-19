# 🔍 Guía de Debugging: Creación de Cuenta y Carga de Datos

## 📌 Problema

Después de crear una cuenta, los datos no se cargan correctamente en el dashboard y no se ven rastros de los logs en el layout.

---

## 🛠️ Cambios Implementados

### 1. Mejoras en Logs (layout.js)

Se agregaron logs detallados en el layout para rastrear cada paso:

```
[Layout.js] 🚀 Renderizando layout del servidor
[Layout.js] 📋 userData obtenido: { userId, error, errorType }
✅ [Layout.js] Usuario autenticado: {userId}
[Layout.js] 🔄 Iniciando carga de datos para userId: {userId}
[initializeData] 🌐 Obteniendo datos de store...
[initializeData] ✔️ Store obtenido, parseando datos...
```

### 2. Mejoras en Autenticación (server-auth.js)

Se agregaron logs para validar la sesión del servidor:

```
[getServerUser] 🔐 Iniciando validación de usuario del servidor...
[getServerUser] ✔️ Cliente Supabase creado
[getServerUser] 📊 Resultado de getUser(): { hasUser, userId, error }
[getServerUser] ✅ Usuario autenticado correctamente: {userId}
```

---

## 📊 Cómo Ver los Logs

### Opción 1: Terminal del Servidor (Recomendado)

1. Abre la terminal integrada en VS Code
2. Busca la salida del servidor Next.js
3. Crea una cuenta nueva y presiona F5 para refrescar
4. Busca los logs con los prefijos: `[Layout.js]`, `[getServerUser]`, `[initializeData]`

### Opción 2: Browser Console (Para logs de cliente)

1. Abre DevTools (F12)
2. Ve a la pestaña "Console"
3. Ten en cuenta que aquí solo verás logs de CLIENT components

### Opción 3: Logs en Servidor (Mejor rastreo)

Si ejecutas desde terminal:

```bash
npm run dev
```

Todos los logs `console.log` y `console.warn` en Server Components aparecerán en esta terminal.

---

## ✅ Pasos para Probar el Flujo Completo

1. **Limpiar cookies/sesión:**
   - Abre DevTools → Application → Cookies
   - Elimina todas las cookies de `sb-` (Supabase)
   - O cierra sesión manualmente

2. **Crear una cuenta:**
   - Navega a `/createAccount`
   - Llena el formulario con email, contraseña y nombre
   - Presiona crear cuenta

3. **Ver los logs en el servidor:**
   - Observa la terminal donde está ejecutándose `npm run dev`
   - Deberías ver logs de `[getServerUser]` validando la sesión

4. **Loginear:**
   - Navega a `/login`
   - Ingresa el email y contraseña que creaste
   - Verifica los logs nuevamente

5. **Verificar carga de datos:**
   - Una vez loguado, irá a `/`
   - Observa los logs de `[Layout.js]` y `[initializeData]`
   - Si ves `✅ Usuario autenticado`, la sesión está correcta
   - Si ves `[initializeData] 🌐 Obteniendo datos de store...`, los datos se están cargando

---

## 🔴 Posibles Problemas a Buscar en los Logs

### Problema 1: No hay usuario autenticado

```
⚠️ [Layout.js] Sin sesión: NO_USER
```

**Solución:** La sesión no se está propagando después del login. Verifica que las cookies se están guardando correctamente.

### Problema 2: Error de JWT

```
❌ Error: INVALID_JWT [...]
```

**Solución:** El token está expirado o es inválido. Probablemente hay un problema en el middleware.

### Problema 3: Error fetching store data

```
❌ Error fetching store data: [error message]
```

**Solución:** El usuario está autenticado pero no tiene una tienda asociada. Verifica la base de datos.

### Problema 4: Excepción en initializeData

```
🔴 Excepción capturada: { message: [...], stack: [...] }
```

**Solución:** Hay un error en el parsing de datos. Verifica que `fetchStoreData()` retorna datos válidos.

---

## 📝 Checklist de Validación

- [ ] ¿Ves los logs `[Layout.js]` en la terminal del servidor?
- [ ] ¿Aparece `✅ Usuario autenticado` después de loginear?
- [ ] ¿Se ejecuta `[initializeData]` cuando accedes a `/`?
- [ ] ¿Se cargan los datos de `fetchStoreData()`?
- [ ] ¿No hay errores en la consola del navegador?

---

## 🔧 Próximos Pasos

1. **Ejecuta el flujo completo** y documenta qué logs ves
2. **Busca errores específicos** en los logs y reporta cuál es el último log que ves antes de que falle
3. **Verifica las cookies** en DevTools para asegurar que se están guardando
4. **Revisa la base de datos** para confirmar que el usuario se creó correctamente

---

## 📞 Información Importante

- Los logs con 🚀, ✅, ⚠️, 🔴 son más fáciles de encontrar en la terminal
- Los prefijos `[Layout.js]`, `[getServerUser]`, `[initializeData]` ayudan a ubicar de dónde viene cada log
- Si no ves NINGÚN log de `[Layout.js]`, el layout no se está re-ejecutando como Server Component
