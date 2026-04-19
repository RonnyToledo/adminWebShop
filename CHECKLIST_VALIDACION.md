# ✅ Checklist de Validación - Reintentos API

## 1. Verificar que los Archivos se Importan Correctamente

En DevTools Console, ejecuta:
```javascript
// Debería estar disponible el apiClient
console.log("apiClient disponible:", typeof window.__apiClient !== 'undefined');
```

## 2. Verificar Logs de Reintentos

### Crear un producto (o cualquier acción que use API):
1. Abre DevTools (F12)
2. Ve a Console
3. Busca logs que comiencen con:
   - `[API]` - Muestra solicitudes
   - `[Axios Retry]` - Muestra reintentos

**Expected Output:**
```
[API] POST /api/tienda/SITIOWEB/products
[API] ✓ 200 /api/tienda/SITIOWEB/products
```

Si hay error temporal:
```
[API] POST /api/tienda/SITIOWEB/products
[Axios Retry] Reintentando 1/3 para POST /api/tienda/SITIOWEB/products en 1000ms
[API] POST /api/tienda/SITIOWEB/products (reintento)
[API] ✓ 200 /api/tienda/SITIOWEB/products
```

## 3. Probar Cada Módulo

### ✅ Productos
- [ ] Crear producto
- [ ] Actualizar producto
- [ ] Eliminar producto
- **Esperar**: Éxito sin necesidad de reintentar manualmente

### ✅ Categorías
- [ ] Crear categoría
- [ ] Editar categoría
- [ ] Eliminar categoría
- **Esperar**: Éxito automático

### ✅ Órdenes
- [ ] Marcar como visto
- [ ] Actualizar estado
- [ ] Eliminar orden
- **Esperar**: Éxito sin problemas

### ✅ Códigos de Descuento
- [ ] Crear código
- [ ] Eliminar código
- **Esperar**: Operación exitosa

### ✅ Blog
- [ ] Crear post
- [ ] Usar IA para optimizar
- **Esperar**: Éxito a primera

### ✅ Configuración Tienda
- [ ] Actualizar datos tienda
- **Esperar**: Cambios guardados sin error

## 4. Simular Error Temporal (Avanzado)

En DevTools Console:
```javascript
// Interceptar una request para simular fallo
const originalFetch = fetch;
let attempt = 0;
window.fetch = function(...args) {
  if (args[0].includes('/api/tienda') && attempt === 0) {
    attempt++;
    return Promise.reject(new Error('Simulated network error'));
  }
  attempt = 0;
  return originalFetch.apply(this, args);
};

// Ahora intenta crear algo - debe reintentar automáticamente
```

**Expected**: Verás error en primer intento, pero se reintentará y funcionará ✅

## 5. Verificar Cookies de Sesión

En DevTools → Application → Cookies:
- [ ] Cookie `sb-*` (sesión Supabase)
- [ ] Debería actualizarse en cada navegación

## 6. Rendimiento

**Network tab (DevTools)**:
- [ ] Primera solicitud: ~0ms-200ms (normal)
- [ ] Con reintentos: +1s-7s (espera exponencial)
- [ ] Sin timeout: máx 30 segundos

## 7. Monitorear por 48 Horas

Después de los cambios:
- [ ] Sin errores "a primera"
- [ ] API calls funcionan consistentemente
- [ ] Usuarios no reportan problemas

---

## 🐛 Si Algo Falla

### "No aparecen logs [API]"
```
❌ Problema: apiClient no se está importando
✅ Solución: Verifica que imports digan "apiClient" no "axios"
```

### "Sigue fallando a la primera"
```
❌ Problema: Caché del navegador o código viejo
✅ Solución: 
  - Limpia cache (Ctrl+Shift+Del en Chrome)
  - Força refresh (Ctrl+F5)
  - Verifica Console por errores de import
```

### "Reintentos infinitos"
```
❌ Problema: API retornando error persistente (no temporal)
✅ Solución:
  - Verifica Network tab por status code real
  - Si es 401/403, problema de autenticación
  - Si es 5XX, problema del servidor
```

### "Sesión no sincroniza"
```
❌ Problema: Middleware no ejecutándose
✅ Solución:
  - Verifica que middleware.js está activo
  - Verifica que las cookies se envían (withCredentials: true)
  - Verifica que env vars de Supabase son correctas
```

---

## 📞 Soporte

Si después de implementar los cambios aún tienes problemas:
1. Comparte logs de DevTools Console
2. Especifica qué API falla (categoría, productos, etc)
3. Verifica que tous los 14 archivos fueron actualizados
