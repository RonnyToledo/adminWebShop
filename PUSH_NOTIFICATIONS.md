# Notificaciones push de RouAdmin

En `/notifications`, cada usuario autenticado puede activar Web Push para este navegador y enviar una prueba a su propia cuenta. El Service Worker está en `public/sw.js`. Los avisos que se crean al aprobar solicitudes, aprobar owners, transferir tiendas o agregar miembros existentes también se envían a las suscripciones de la cuenta destinataria.

## Requisitos

1. Ejecuta en el proyecto Supabase compartido `rouMenu/scripts/migrations/20261111_cart_push_reminders.sql`. Además de la tabla de recordatorios de carrito, prepara `push_subscriptions.endpoint`, su índice único y las políticas RLS para que cada usuario gestione su propia suscripción.
2. Configura en el entorno server-side de Admin:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
3. Configura `NEXT_PUBLIC_VAPID_PUBLIC_KEY` también como variable de build del cliente Admin.
4. Genera un nuevo par VAPID y elimina/revoca cualquier clave privada previa guardada con prefijo `NEXT_PUBLIC_` o incluida en el código. Nunca publiques la clave privada.

Para comprobar la entrega, inicia sesión, abre `/notifications`, activa el dispositivo y usa **Enviar prueba**. La prueba apunta al `user_id` de la sesión autenticada; solo los administradores globales pueden dirigir avisos a otra cuenta o hacer un broadcast.
