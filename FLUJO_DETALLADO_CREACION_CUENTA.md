# 📊 Flujo Completo de Creación de Cuenta y Carga de Datos

## 🔄 Diagrama del Flujo

```
PASO 1: CREAR CUENTA
─────────────────────────────────────────────────────────────────
  1. Usuario llenar formulario en /createAccount
  2. performSignup() enviado
     ├─ uploadImageToServer() [OPCIONAL]
     └─ axios.put("/api/login", {email, password, metadata})
  3. /api/login (PUT)
     ├─ supabase.auth.signUp({email, password, options: {data: metadata}})
     └─ Retorna: {userId, user, session}
  4. Client recibe respuesta
  5. router.push("/login") ◄─ REDIRIGE A LOGIN

  ✅ PUNTO CLAVE: ¿Se guardaron las COOKIES aquí?
     Si no → habrá problema más adelante


PASO 2: USUARIO ACCEDE A /login
─────────────────────────────────────────────────────────────────
  1. Usuario ve formulario de login
  2. Usuario ingresa email y contraseña
  3. handleLogin() enviado
     └─ axios.post("/api/login", {email, password})
  4. /api/login (POST)
     ├─ supabase.auth.signInWithPassword({email, password})
     ├─ Resultado: session, user, authData
     └─ makeClient() CONFIGURA LAS COOKIES
  5. Respuesta al cliente con {userId, user, session}
  6. Client recibe respuesta
  7. router.push("/") ◄─ REDIRIGE AL DASHBOARD

  ✅ PUNTO CLAVE: ¿Las cookies se guardaron correctamente?
     Si no → el layout no verá al usuario autenticado


PASO 3: MIDDLEWARE PROCESA LA SOLICITUD
─────────────────────────────────────────────────────────────────
  1. Cliente solicita / (GET)
  2. MIDDLEWARE.JS se ejecuta en el servidor
  3. middleware()
     ├─ supabase.auth.getSession() [RETRY 3x]
     ├─ Si no hay sesión
     │  └─ LIMPIAR COOKIES: sb-access-token, sb-refresh-token
     └─ Retorna NextResponse() con cookies actualizadas
  4. Request continúa con cookies refrescadas

  ⚠️ LOGS ESPERADOS EN SERVIDOR:
     "getSession failed after retries: ..." (si falla)
     O (silencio si es exitoso)


PASO 4: LAYOUT.JS SE EJECUTA EN EL SERVIDOR
─────────────────────────────────────────────────────────────────
  1. /app/layout.js se renderiza (SERVER COMPONENT)
  2. console.log("[Layout.js] 🚀 Renderizando layout del servidor")
  3. await getServerUser()
     ├─ console.log("[getServerUser] 🔐 Iniciando validación...")
     ├─ createServerClient() ← crea cliente con cookies
     ├─ supabase.auth.getUser() ← verifica JWT en cookies
     ├─ console.log("[getServerUser] 📊 Resultado de getUser()...")
     └─ Retorna: {userId, user, error, errorType}
  4. console.log("[Layout.js] 📋 userData obtenido...")
  5. SI userId existe:
     └─ await initializeData(userId)
        ├─ console.log("[initializeData] 🔍 Iniciando...")
        ├─ fetchStoreData(userId) ← consulta Supabase
        ├─ console.log("[initializeData] 📊 Respuesta...")
        ├─ Parsear datos (horario, categorías, envíos, etc)
        ├─ console.log("[initializeData] ✅ Store obtenido...")
        └─ Retorna: {store, ga, products, events, code, user}
  6. Pasar userData y data al MyProvider (CONTEXT)
  7. Renderizar HTML con datos

  ✅ LOGS ESPERADOS:
     [Layout.js] 🚀 Renderizando...
     [getServerUser] 🔐 Iniciando...
     [getServerUser] ✔️ Cliente Supabase creado
     [getServerUser] 📊 Resultado de getUser(): {hasUser, userId, error}
     [Layout.js] 📋 userData obtenido: {userId, error, errorType}
     ✅ [Layout.js] Usuario autenticado: {userId}
     [Layout.js] 🔄 Iniciando carga de datos...
     [initializeData] 🔍 Iniciando para userId...
     [initializeData] 🌐 Obteniendo datos de store...
     [initializeData] 📊 Respuesta de fetchStoreData...
     [Layout.js] ✔️ Datos cargados: true/false


PASO 5: CONTEXT (CLIENTE) PROCESA DATOS
─────────────────────────────────────────────────────────────────
  1. MyProvider recibe {user, data}
  2. console.log(data) ← VE TODOS LOS DATOS
  3. useState(data || initialState)
  4. useEffect dependiendo de {user}
  5. handleUserValidation()
     ├─ Si NO user → router.push("/login")
     ├─ Si user.role === "user" → router.push("/welcome")
     └─ Si user y data → setWebshop(data)
  6. Renderizar children (page.js del dashboard)

  ✅ LOGS ESPERADOS EN BROWSER CONSOLE:
     data object completo (con store, products, ga, etc)
```

---

## 🚨 Posibles Puntos de Falla

### Problema 1: No hay cookies después de signUp (PUT)

```
SÍNTOMA: En POST /login, getServerUser() retorna NO_USER
CAUSA: signUp() no estableció cookies
SOLUCIÓN: Revisar si Supabase está configurado para auto-confirmar emails
```

### Problema 2: No hay cookies después de signIn (POST)

```
SÍNTOMA: En PASO 3, middleware dice "Cookies inválidas"
CAUSA: makeClient() no guardó las cookies correctamente
SOLUCIÓN: Verificar que cookies están siendo retornadas correctamente en PUT /api/login
```

### Problema 3: getServerUser() retorna NO_USER en PASO 4

```
SÍNTOMA: NO ves los logs "[Layout.js] ✅ Usuario autenticado"
CAUSA: Las cookies no llegaron al servidor
SOLUCIÓN:
  1. Verificar en DevTools → Application → Cookies que sb-* existan
  2. Revisar si las cookies son de sesión (ojo con SameSite)
  3. Comprobar si el middleware está limpiando las cookies incorrectamente
```

### Problema 4: fetchStoreData() retorna error

```
SÍNTOMA: Ves "[initializeData] ❌ Error fetching store data"
CAUSA: El usuario no tiene tienda asociada EN LA BD
SOLUCIÓN: Verificar que al crear usuario, se crea una tienda por defecto
```

### Problema 5: initializeData() tira excepción

```
SÍNTOMA: Ves "[initializeData] 🔴 Excepción capturada"
CAUSA: Error en parsing de datos (JSON.parse, etc)
SOLUCIÓN: Revisar qué datos retorna fetchStoreData() son inválidos
```

---

## 🎯 Orden de Verificación

```
1️⃣ ¿Ves [Layout.js] 🚀 en terminal?
   NO  → El layout no se renderiza (error crítico)
   SÍ  → Continuar

2️⃣ ¿Ves [getServerUser] ✅ Usuario autenticado?
   NO  → Ver qué error retorna getServerUser()
   SÍ  → Continuar

3️⃣ ¿Ves [Layout.js] 🔄 Iniciando carga de datos?
   NO  → No hay userId (ver paso 2️⃣)
   SÍ  → Continuar

4️⃣ ¿Ves [initializeData] ✔️ Store obtenido?
   NO  → fetchStoreData() retorna error (ver BD)
   SÍ  → Continuar

5️⃣ ¿Ves [Layout.js] ✔️ Datos cargados?
   NO  → Error en parsing (ver console del servidor)
   SÍ  → Datos deberían estar disponibles en el contexto
```

---

## 💡 Tips Importantes

- **Dónde ver los logs**: SOLO en terminal de `npm run dev`, NO en browser
- **Por qué**: El layout es un Server Component, sus logs van al servidor
- **Cookies**: Puedes verificarlas en DevTools sin necesidad de ver logs
- **Timing**: Entre PUT (crear) y POST (login) pueden haber segundos/minutos
- **Email**: Si Supabase requiere confirmación de email, el flujo falla

---

## 📝 Checklist Rápido

```
DESPUÉS DE CREAR CUENTA:
[ ] Verificar en DevTools que sb-access-token y sb-refresh-token existen
[ ] En /login, ver logs "[getServerUser]" en terminal

DESPUÉS DE LOGINEAR:
[ ] Verificar cookies se siguen mostrando
[ ] Ver logs "[Layout.js]" y "[initializeData]" en terminal
[ ] Verificar en DevTools → Application → Storage que hay datos
[ ] NO ver errores en console del browser
```

---

## 🔧 Debugging Manual

Si NO ves los logs esperados, intenta:

```javascript
// En createAccount.jsx, después de axios.put("/api/login")
const response = await axios.put("/api/login", {...});
console.log("Respuesta de signUp:", response.data);

// En login page, después de axios.post("/api/login")
const response = await axios.post("/api/login", {...});
console.log("Respuesta de login:", response.data);

// En browser DevTools
// Ver si las cookies tienen los valores correctos
document.cookie.split("; ").forEach(c => console.log(c));
```
