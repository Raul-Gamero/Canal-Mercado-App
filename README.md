# Canal Mercado - Plataforma de Reportes de Campañas Publicitarias

Una plataforma web moderna para centralizar y gestionar reportes de campañas publicitarias de múltiples mercados y centros comerciales.

## 🚀 Características

- **Autenticación con Supabase Auth** - Sistema de roles (Admin, Cliente, Mercado)
- **Dashboard Interactivo** - Métricas en tiempo real con gráficos
- **Gestión de Campañas** - Seguimiento completo de campañas publicitarias
- **Reportes Exportables** - Generación de PDF y Excel
- **Control de Acceso por Roles** - Cada usuario ve solo lo que le corresponde
- **API Integrada** - Edge Functions para consumir APIs externas
- **Diseño Responsivo** - Interfaz moderna con TailwindCSS

## 🛠️ Tecnologías

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Gráficos**: Recharts
- **Exportación**: jsPDF, xlsx
- **Autenticación**: Supabase Auth UI

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- Git

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd Canal-Mercado-App
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Configurar Supabase

#### 4.1 Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Copia la URL y las claves del proyecto

#### 4.2 Ejecutar el Schema de Base de Datos

1. Ve a la sección SQL Editor en tu proyecto de Supabase
2. Copia y ejecuta el contenido del archivo `supabase-schema.sql`
3. Esto creará todas las tablas, políticas RLS y datos de ejemplo

#### 4.3 Configurar Edge Functions

1. Instala Supabase CLI:
```bash
npm install -g supabase
```

2. Inicia sesión en Supabase:
```bash
supabase login
```

3. Enlaza tu proyecto:
```bash
supabase link --project-ref your-project-ref
```

4. Despliega la Edge Function:
```bash
supabase functions deploy insert-playback
```

### 5. Ejecutar el Proyecto

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🗄️ Estructura de la Base de Datos

### Tablas Principales

- **`markets`** - Mercados y centros comerciales
- **`devices`** - Dispositivos (TVs, cámaras) por mercado
- **`campaigns`** - Campañas publicitarias
- **`playbacks`** - Registro de reproducciones
- **`audiences`** - Datos de audiencia (futuro)
- **`reports`** - Reportes generados
- **`user_roles`** - Roles y permisos de usuarios

### Políticas de Seguridad (RLS)

- **Admin**: Acceso completo a todas las funcionalidades
- **Cliente**: Solo ve sus propias campañas y reportes
- **Mercado**: Solo ve dispositivos y campañas de su centro

## 👥 Roles de Usuario

### Admin
- Gestión completa de mercados, dispositivos y campañas
- Acceso a todos los reportes y métricas
- Administración de usuarios y roles

### Cliente
- Visualización de sus campañas activas
- Generación de reportes de sus campañas
- Métricas de rendimiento

### Mercado
- Gestión de dispositivos del centro
- Monitoreo de campañas en sus pantallas
- Reportes de reproducciones

## 📊 Funcionalidades

### Dashboard
- Métricas en tiempo real
- Gráficos de rendimiento
- Resumen de campañas activas
- Estadísticas por mercado

### Gestión de Campañas
- Lista de campañas con filtros
- Estado de campañas (Activa, Pendiente, Finalizada)
- Detalles de fechas y clientes

### Generación de Reportes
- Exportación a PDF con tablas formateadas
- Exportación a Excel con múltiples hojas
- Filtros por fecha y mercado
- Resúmenes estadísticos

### API y Integraciones
- Edge Function para insertar datos de reproducción
- Endpoint para consumir APIs externas
- Scripts de prueba para datos mock

## 🔧 Uso de la API

### Insertar Datos de Reproducción

```bash
curl -X POST https://your-project.supabase.co/functions/v1/insert-playback \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_id": "uuid-campaign",
    "device_id": "uuid-device",
    "date": "2024-06-15",
    "time": "10:00:00",
    "duration": 30
  }'
```

### Script de Prueba

```bash
# Insertar datos de prueba
node scripts/insert-mock-playbacks.js

# Insertar datos aleatorios
node scripts/insert-mock-playbacks.js --random 20
```

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Despliega automáticamente

### Otros Proveedores

- **Netlify**: Similar a Vercel
- **Railway**: Para aplicaciones full-stack
- **DigitalOcean App Platform**: Para control total

## 🔒 Seguridad

- **Row Level Security (RLS)** habilitado en todas las tablas
- **Políticas de acceso** basadas en roles de usuario
- **Autenticación JWT** con Supabase Auth
- **Validación de datos** en Edge Functions

## 📱 Características Responsivas

- Diseño mobile-first
- Navegación adaptativa
- Tablas con scroll horizontal en móviles
- Gráficos responsivos

## 🧪 Testing

### Datos de Prueba

El schema incluye datos de ejemplo:
- 3 mercados de prueba
- 4 dispositivos (TVs y cámaras)
- 3 campañas de ejemplo
- 5 reproducciones de prueba

### Usuarios de Prueba

Crea usuarios manualmente en Supabase Auth y asígnales roles en la tabla `user_roles`.

## 🐛 Solución de Problemas

### Error de Conexión a Supabase
- Verifica las variables de entorno
- Confirma que el proyecto esté activo
- Revisa las políticas RLS

### Error de Autenticación
- Verifica la configuración de Supabase Auth
- Confirma que el usuario tenga un rol asignado
- Revisa las políticas de la tabla `user_roles`

### Error en Edge Functions
- Verifica que la función esté desplegada
- Revisa los logs en Supabase Dashboard
- Confirma las variables de entorno

## 📈 Roadmap

- [ ] Dashboard de métricas avanzadas
- [ ] Integración con APIs de terceros
- [ ] Sistema de notificaciones
- [ ] Reportes automáticos por email
- [ ] API REST completa
- [ ] Aplicación móvil
- [ ] Análisis de audiencia en tiempo real

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Documentación**: [Wiki del Proyecto](https://github.com/your-repo/wiki)
- **Email**: soporte@canalmercado.com

## 🙏 Agradecimientos

- [Supabase](https://supabase.com) por la infraestructura backend
- [Next.js](https://nextjs.org) por el framework frontend
- [TailwindCSS](https://tailwindcss.com) por el sistema de diseño
- [Recharts](https://recharts.org) por las librerías de gráficos

---

**Desarrollado con ❤️ para la industria publicitaria digital**
