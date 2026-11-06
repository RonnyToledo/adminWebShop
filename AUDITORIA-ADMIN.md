# Auditoría funcional y UX del Admin

## Alcance y método

Se recorrieron Inicio, Productos, Marketing, Analíticas, Ventas, Pedidos, Diseño/Tema, Contacto/Redes, Planes, Blog, Equipo y Configuración en el Admin local (`localhost:4001`), contrastando los flujos con su código. También se revisaron las guías de Inicio y navegación entre secciones.

Se abrieron formularios de producto, descuento y publicación de blog sin enviarlos. En Pedidos se abrió el diálogo de eliminación y se canceló. No se crearon, confirmaron ni eliminaron registros. No se hicieron cambios irreversibles.

## Hallazgos

### A-01 — Inicio no renderizaba por un formateador inexistente

- **Prioridad:** Alta
- **Página:** Inicio
- **Comportamiento actual observado:** la página fallaba con `ReferenceError: formatCUP is not defined`.
- **Comportamiento esperado:** Inicio debe cargar y presentar importes con la moneda correspondiente.
- **Causa:** el componente definía `formatAmount`, pero llamaba a `formatCUP` en las métricas de ingresos y zonas de envío.
- **Mejora aplicada:** se sustituyeron las llamadas por el helper existente `formatAmount` en [DashboardHome.jsx](./src/components/Chadcn-components/Home/DashboardHome.jsx).
- **Estado/evidencia:** corregido y comprobado en el navegador; se vieron 28 productos, 18 pedidos y 102.040 CUP, sin error de renderizado. La acción “Ver tienda” de esta tarjeta también se convirtió en un enlace funcional.

### A-02 — Ventas consultaba una columna inexistente

- **Prioridad:** Alta
- **Página:** Ventas
- **Comportamiento actual observado antes del arreglo:** la carga fallaba por `Sitios.Provincia`, y los importes podían quedar ocultos o aparentar estar vacíos.
- **Comportamiento esperado:** cargar pedidos y mostrar el error de consulta si la fuente de datos falla.
- **Causa:** `fetchSalesData` solicitaba una columna que no existe en la tabla `Sitios`; el estado de error tampoco era suficientemente visible.
- **Mejora aplicada:** se eliminó `Provincia` de la consulta y se mejoró el estado de error en [supabaseApi.js](./src/lib/supabaseApi.js), [VentasDashboard.jsx](./src/components/Chadcn-components/Ventas/VentasDashboard.jsx) y [ventas/page.js](./src/app/ventas/page.js).
- **Estado/evidencia:** corregido y comprobado en el navegador; Ventas cargó 18 pedidos y 102.040 CUP.

### A-03 — El borrado de pedidos necesitaba confirmación y un resultado fiable

- **Prioridad:** Alta
- **Página:** Pedidos
- **Comportamiento anterior en código:** se podía iniciar el borrado sin confirmación y un fallo del RPC podía terminar comunicado como éxito.
- **Comportamiento esperado:** confirmar una acción irreversible y devolver un error explícito si la operación de base de datos falla.
- **Causa:** faltaban confirmación en la interfaz y comprobación del resultado del RPC en el endpoint.
- **Mejora aplicada:** se añadió diálogo de confirmación, mensajes de error y respuesta HTTP fallida cuando falla el RPC en [pedidos-table.jsx](./src/components/Chadcn-components/Orders/pedidos-table.jsx) y [route.js](./src/app/api/tienda/[tienda]/checkOrders/route.js).
- **Estado/evidencia:** se abrió el diálogo y se canceló; los 18 pedidos permanecieron intactos. No se ejecutó el borrado ni se simuló un fallo del RPC.

### A-04 — El guardado de productos podía quedar bloqueado o repetirse

- **Prioridad:** Alta
- **Página:** Productos / Nuevo producto
- **Comportamiento anterior en código:** el bloqueo del guardado podía activarse antes de completar la validación y no había una exclusión fiable ante doble envío.
- **Comportamiento esperado:** validar primero, permitir corregir datos inválidos y aceptar como máximo un envío en curso.
- **Mejora aplicada:** se reordenó la validación y se añadió un cerrojo de envío en [NewProduct.jsx](./src/components/Chadcn-components/NewProduct/NewProduct.jsx).
- **Estado/evidencia:** código corregido; el formulario vacío mostró campos requeridos y el botón Guardar deshabilitado. No se envió un producto de prueba.

### A-05 — Marketing podía limpiar el formulario antes de confirmar el guardado

- **Prioridad:** Media
- **Página:** Marketing / códigos de descuento
- **Comportamiento anterior en código:** el formulario podía cerrarse y perder sus valores antes de recibir la respuesta del servidor.
- **Comportamiento esperado:** esperar la respuesta; limpiar/cerrar solo al guardar correctamente y conservar los datos si hay error.
- **Mejora aplicada:** se espera la operación, se mantiene el formulario ante error y se impiden envíos duplicados en [marketing.jsx](./src/components/Chadcn-components/codeDiscount/marketing.jsx).
- **Estado/evidencia:** corrección de código compilada; no se creó un descuento para evitar modificar datos.

### A-06 — Configuración podía avisar de cambios inexistentes

- **Prioridad:** Media
- **Página:** Configuración
- **Comportamiento anterior:** la comparación con el estado inicial podía producir una advertencia falsa de cambios sin guardar.
- **Comportamiento esperado:** advertir solo cuando los valores actuales difieran realmente del último estado guardado.
- **Mejora aplicada:** comparación estable contra un baseline en [Configuracion.jsx](./src/components/Chadcn-components/Configuracion/Configuracion.jsx).
- **Estado/evidencia:** corregido; abrir Configuración sin editar no mostró la advertencia.

### A-07 — Planes mostraba un conteo de productos incorrecto

- **Prioridad:** Media
- **Página:** Planes
- **Comportamiento anterior observado:** el panel podía mostrar cero productos pese a que Productos tenía artículos.
- **Comportamiento esperado:** mostrar un conteo exacto y los errores de consulta, no un cero engañoso.
- **Mejora aplicada:** consulta con conteo exacto y manejo visible de errores en [supabaseApi.js](./src/lib/supabaseApi.js), [usePlan.js](./src/hooks/usePlan.js), [PlanesPage.jsx](./src/components/Chadcn-components/Planes/PlanesPage.jsx) y [page.js](./src/app/planes/page.js).
- **Estado/evidencia:** la interfaz mostró 28 productos y el límite correspondiente.

### A-08 — Los importes de monedas distintas no deben sumarse

- **Prioridad:** Media
- **Página:** Ventas e Inicio
- **Comportamiento anterior en código:** las métricas podían agregar importes sin separar monedas.
- **Comportamiento esperado:** comparar y sumar únicamente valores de la misma moneda, identificándola en cada cifra.
- **Mejora aplicada:** agrupación por moneda en Inicio y filtro/etiqueta de moneda en Ventas.
- **Estado/evidencia:** implementado y compilado. Los datos visibles de esta tienda fueron CUP; no había una muestra de pedidos en dos monedas para probar el caso mixto en el navegador.

### A-09 — Equipo necesitaba errores explícitos y confirmación de baja

- **Prioridad:** Media
- **Página:** Equipo
- **Comportamiento anterior en código:** algunos errores de carga/gestión no se comunicaban con claridad y la baja de un miembro no pedía confirmación.
- **Comportamiento esperado:** informar fallos y pedir confirmación antes de retirar un miembro.
- **Mejora aplicada:** manejo explícito de errores y confirmación en [TeamPage.jsx](./src/components/Chadcn-components/Team/TeamPage.jsx).
- **Estado/evidencia:** corregido en código; no se retiró ningún miembro durante la revisión.

### A-10 — Permisos de analíticas de tráfico siguen dependiendo de Supabase

- **Prioridad:** Media
- **Página:** Analíticas
- **Comportamiento observado:** en una revisión anterior se reportó `permission denied for table store_traffic_daily`. En esta pasada la página cargó y mostró cero visitas, sin reproducir el error.
- **Comportamiento esperado:** si el usuario no puede leer los datos, indicar el error; si puede leerlos y no hay registros, indicar claramente que no hay datos.
- **Causa/alcance:** el error citado anteriormente no se reprodujo en esta auditoría. El código actual no consulta `store_traffic_daily`; las métricas de visitas vienen de Google Analytics mediante [ga-utils.js](./src/lib/ga-utils.js).
- **Mejora aplicada:** los fallos de Google Analytics ya no se presentan como ceros exitosos: [supabaseApi.js](./src/lib/supabaseApi.js) propaga el error y [page.js](./src/app/analytics/page.js) lo muestra en una alerta.
- **Pendiente externo:** si reaparece literalmente `permission denied for table store_traffic_daily`, identificar primero qué servicio/versión está ejecutando esa consulta; no se cambiaron políticas ni permisos de Supabase sin una consulta actual verificable.

### A-11 — El campo “Search” del encabezado parece decorativo

- **Prioridad:** Baja
- **Página:** encabezado global
- **Comportamiento antes del cambio:** el campo mostraba `Search` y el atajo `⌘ K`, pero no ejecutaba búsquedas ni navegación.
- **Comportamiento esperado:** ofrecer búsqueda funcional o retirar el campo y el atajo hasta implementarlos.
- **Mejora aplicada:** se convirtió en una paleta de navegación/búsqueda. Navega a secciones y consulta en Supabase Productos y Categorías de la tienda activa; el resultado abre su ruta existente de edición. Requiere permiso de escritura, limita los resultados y funciona con `Ctrl+K` y `Cmd+K`.
- **Implementación:** [HeaderAdmin.jsx](./src/components/Chadcn-components/General/HeaderAdmin.jsx), [route.js](./src/app/api/admin/search/route.js), [command.jsx](./src/components/ui/command.jsx). El endpoint valida sesión, membresía activa/propiedad legacy, tienda seleccionada y rol antes de consultar por `storeId`.
- **Estado/evidencia:** la búsqueda devolvió productos y categorías de Supabase con HTTP 200, y las rutas de edición existentes se comprobaron previamente. Se simplificó la selección de resultados para que la propia opción de `cmdk` cierre el diálogo y navegue, evitando enlaces anidados y temporizadores. ESLint dirigido y `npm run build` pasan. No se pudo repetir la interacción final en el navegador local: durante la comprobación el servidor de desarrollo seguía compilando y los clics sobre el encabezado agotaron el tiempo de espera.

### A-13 — Catálogo y búsqueda global pueden organizarse mejor sin fusionar todas las páginas

- **Prioridad:** Media
- **Página:** navegación del Admin
- **Observación:** existen rutas propias para productos y categorías, pero [link.json](./src/components/json/link.json) no presenta Categorías en la navegación. Los detalles de producto y categoría ya tienen rutas específicas.
- **Recomendación:** conservar páginas separadas para administrar entidades distintas y sus detalles; agrupar Productos y Categorías bajo “Catálogo”. Mantener Pedidos separado de Analíticas/Ventas y Configuración organizada por tareas. No conviene concentrar todo en una sola página.
- **Mejora aplicada:** Productos y Categorías ahora están agrupados bajo “Catálogo”; Blog se encuentra bajo “Contenido”. Se conservan las rutas independientes de listado y edición.
- **Estado:** redistribución verificada en la navegación del Admin; las búsquedas de productos y categorías devolvieron datos reales y abrieron las rutas de detalle comprobadas anteriormente. Se mantienen independientes las páginas de listado y edición.

### A-12 — El botón de ayuda podía abrir un diálogo vacío y no era accesible por nombre

- **Prioridad:** Media
- **Página:** cabecera global
- **Comportamiento observado:** el botón abre un diálogo. En Inicio, su contenido se limitaba al título “Info” y el texto genérico “Panel de información sobre la pantalla”; no ofrecía pasos ni un enlace de ayuda. El control de solo icono tampoco tenía nombre accesible.
- **Comportamiento esperado:** mostrar ayuda contextual para la página actual, o una alternativa clara cuando no exista una guía específica; el botón debe tener una etiqueta accesible.
- **Causa:** el componente mantenía un mapa manual de rutas incompleto y buscaba una llave interna de `card.json`. Inicio no tenía una tarjeta “Dashboard”; además, varias páginas sí documentadas no estaban en el mapa manual.
- **Mejora aplicada:** se obtiene la ayuda directamente de la ruta definida en cada tarjeta, se muestra una alternativa enlazada a la guía general si no hay coincidencia y se añadió nombre accesible al botón en [HeaderAdmin.jsx](./src/components/Chadcn-components/General/HeaderAdmin.jsx).
- **Estado/evidencia:** después del cambio, el navegador muestra en Inicio el mensaje alternativo y el enlace “Abrir guía del panel”; el botón expone el nombre accesible “Ayuda sobre esta página”. Corrección compilada y comprobada.

## Aspectos que funcionaron durante la revisión

- La navegación incluye acceso a Pedidos y títulos/rutas actualizados.
- El asistente de Inicio enlaza con las tareas aplicables; la tienda de prueba mostraba 4 de 4 pasos completados.
- El formulario de producto señala los campos requeridos y no permite enviar el formulario vacío.
- El diálogo de eliminación de pedidos permite cancelar antes de una acción irreversible.
- Las cifras de Inicio y Ventas coincidieron en 18 pedidos y 102.040 CUP.

## Observaciones de la tienda pública y correcciones

En la tienda local `/t/eclipse`, una recarga controlada confirmó el desajuste de hidratación de `<relative-time>`: el atributo `datetime` variaba entre SSR e hidratación porque se calculaba con la hora actual en ambos lados. Se difirió el render de ese elemento hasta montar el cliente en [Hours-TIme.jsx](../rouMenu/src/components/catalogo_UI/General/Hours-TIme.jsx).

La respuesta 404 se identificó como el avatar de reserva de Cloudinary que ya no existe. Se reemplazó por un SVG local en [image.js](../rouMenu/src/lib/core/image.js) y [user-placeholder.svg](../rouMenu/public/images/user-placeholder.svg). Los avisos de calidad de imagen se debían a que `AppImage` solicita calidad 85 y Next.js solo tenía 75 permitido; se añadió 85 a `images.qualities` en [next.config.ts](../rouMenu/next.config.ts). Tras estos cambios, una recarga controlada no registró respuestas HTTP fallidas ni errores de consola.

En la recarga controlada tampoco se observaron errores de Google Analytics; no se alteró su configuración ni credenciales porque no se reprodujo un fallo actual.

## Validación

- `adminWebShop npm run build`: correcto.
- `adminWebShop npx eslint` sobre los archivos JS/JSX modificados: correcto.
- `adminWebShop npm run lint`: correcto, sin errores; quedan 11 advertencias en distintos archivos (imágenes, dependencias de hooks y accesibilidad). La configuración cubre ahora `.jsx`; ESLint dirigido a los archivos JSX modificados también pasó sin advertencias.
- `rouMenu npm run build`: compilación y TypeScript finalizaron, pero la generación de rutas se detuvo porque falta `supabaseKey` al inicializar `/api/subscribe-push`. No se leyó ni modificó ningún secreto o archivo de entorno.
- No se generaron datos de prueba ni se ejecutaron operaciones destructivas.
