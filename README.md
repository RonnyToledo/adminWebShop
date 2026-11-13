# RouAdmin

**RouAdmin** es el sistema administrativo de RouMenu. Permite a propietarios y miembros autorizados gestionar la operación de sus negocios desde una interfaz web centralizada.

Forma parte del ecosistema **RouDev**:

- Catálogo público: [roumenu.vercel.app](https://roumenu.vercel.app)
- Panel administrativo: [rouadmin.vercel.app](https://rouadmin.vercel.app)

## Funcionalidades principales

- Gestión de productos, categorías e imágenes.
- Administración de pedidos y operaciones de venta.
- Configuración del negocio y su catálogo.
- Gestión de inventario y existencias, según el plan y la configuración de la tienda.
- Administración de miembros y permisos de acceso.
- Herramientas de análisis y utilidades para la operación.
- Integración con servicios de Supabase y Cloudinary.
- Experiencias de mapas y visualización de ubicaciones.
- Funcionalidades asistidas por inteligencia artificial.

## Stack tecnológico

- Next.js 16 — App Router
- React 19
- JavaScript / TypeScript
- Tailwind CSS
- Material UI, Radix UI y componentes reutilizables
- Supabase — autenticación, base de datos y servicios
- Cloudinary — gestión de recursos multimedia
- MapLibre GL y React Map GL — mapas
- Recharts — visualización de datos
- Framer Motion — animaciones

## Requisitos

- Node.js compatible con Next.js 16.
- npm.
- Proyecto de Supabase configurado.
- Credenciales de los servicios externos que se utilicen en el entorno.

## Configuración local

1. Clona el repositorio:

   ```bash
   git clone https://github.com/RonnyToledo/adminWebShop.git
   cd adminWebShop
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Crea un archivo `.env.local` en la raíz:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```

   Completa los valores desde la configuración de tu proyecto Supabase. Otras integraciones pueden requerir variables adicionales; consulta los módulos correspondientes antes de habilitarlas.

4. Inicia el entorno de desarrollo:

   ```bash
   npm run dev
   ```

   El script configurado inicia Next.js con Webpack en el puerto **4001**: [http://localhost:4001](http://localhost:4001).

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Desarrollo en el puerto 4001 |
| `npm run build` | Compila la aplicación para producción |
| `npm run start` | Inicia el servidor de producción |
| `npm run lint` | Ejecuta ESLint |

Los scripts `predev` y `prebuild` preparan el worker de MapLibre antes de iniciar o compilar la aplicación.

## Seguridad

- No publiques archivos `.env` ni credenciales privadas.
- No incluyas claves `service_role` de Supabase en el navegador.
- Configura las políticas RLS de Supabase para controlar el acceso a los datos.
- Mantén las credenciales de producción en las variables de entorno del proveedor de despliegue.

## Ecosistema

RouAdmin trabaja junto con RouMenu: el panel administra la información que se presenta en los catálogos públicos de cada negocio.

## Autor

**Ronny Toledo Ramos** · [GitHub](https://github.com/RonnyToledo) · [RouDev](https://roudev.vercel.app)
