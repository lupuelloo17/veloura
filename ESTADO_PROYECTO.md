# GlowAI — Estado del Proyecto
> Última actualización: 15 mayo 2026 · Versión 1.0

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite 5 + Tailwind CSS 3 |
| Routing | React Router DOM 6 |
| Iconos | Lucide React |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth (mock local sin credenciales) |
| Deploy | Vercel |
| Repo | https://github.com/lupuelloo17/glowai |

---

## Pantallas implementadas

### App paciente (rutas públicas)

| Ruta | Pantalla | Estado |
|---|---|---|
| `/` | Bienvenida — Clínica Lumière, botón "Acceder" | ✅ |
| `/home` | Dashboard paciente — cita próxima, métricas de piel, acciones rápidas, disclaimer flotante | ✅ |
| `/analisis` | Análisis facial IA — upload foto, simulación de escaneo, zonas detectadas, tratamientos | ✅ |
| `/reservar` | Reserva de cita — selección de tratamiento, calendario semanal, horario, confirmación | ✅ |
| `/historial` | Historial de visitas — gráfico de evolución, sesiones con fotos y valoraciones | ✅ |
| `/skin-check` | Dermoscopia básica — Seven-Point Checklist simplificado | ✅ |
| `/dermoscopia` | Dermoscopia completa — 3 pasos, 7 criterios, parámetros morfológicos, informe clínico, protocolo cosmecéutico | ✅ |
| `/login` | Login con email/password — demo accounts accesibles desde la UI | ✅ |
| `/demo` | Menú demo — acceso directo a cada vista sin credenciales | ✅ |

### Panel clínica (rutas protegidas `/clinica/:slug/*`)

| Ruta | Pantalla | Estado |
|---|---|---|
| `/clinica/:slug/dashboard` | Dashboard admin — stats, equipo, alertas, análisis | ✅ |
| `/clinica/:slug/dashboard` | Dashboard médico — sus pacientes, citas del día, acceso IA | ✅ |
| `/clinica/:slug/pacientes` | Lista de pacientes — búsqueda, filtro por riesgo | ✅ |
| `/clinica/:slug/paciente/:id` | Ficha de paciente — tabs Info / Sesiones / Análisis | ✅ |
| `/clinica/:slug/analisis` | Análisis dermoscópicos — lista con filtro, alertas de alto riesgo | ✅ |

---

## Tablas de base de datos (Supabase)

| Tabla | Columnas clave | RLS |
|---|---|---|
| `clinicas` | id, nombre, slug, color_primario, plan, plan_activo, max_pacientes, max_medicos | ✅ |
| `usuarios` | id (→ auth.users), clinica_id, nombre, rol (admin/medico/recepcion) | ✅ |
| `medicos` | id, clinica_id, nombre, especialidad, email, activo | ✅ |
| `pacientes` | id, clinica_id, medico_id, nombre, apellido, email, foto_perfil_url | ✅ |
| `sesiones` | id, paciente_id, clinica_id, medico_id, tipo_tratamiento, fecha, notas, fotos_antes[], fotos_despues[] | ✅ |
| `analisis_dermoscopicos` | id, paciente_id, clinica_id, criterios (jsonb), puntuacion_total, nivel_riesgo | ✅ |

Migraciones en `supabase/migrations/001_init.sql` y `002_seed.sql`.
Row Level Security activo: cada clínica solo accede a sus propios datos via `clinica_id = auth.jwt() ->> 'clinica_id'`.

---

## Sistema de autenticación y roles

### Flujo
1. Usuario accede a `/login` o `/demo`
2. Login con email/password → Supabase Auth (o mock local sin `.env`)
3. JWT contiene `clinica_id` y `rol` como custom claims
4. `RequireAuth` bloquea rutas `/clinica/:slug/*` sin sesión activa
5. `DashboardPage` lee el rol y renderiza `AdminDashboardPage` o `MedicoDashboardPage`

### Roles

| Rol | Email demo | Ve |
|---|---|---|
| `admin` | admin@lumiere.com | Stats completas, equipo médico, alertas, configuración, ingresos |
| `medico` | dra.garcia@lumiere.com | Solo sus pacientes, sus citas, análisis propios |

### Modo demo
- `/demo` activa sesión sin contraseña con `loginAsDemo(rol)`
- Banner amarillo persistente en todas las páginas
- Botón "Salir ×" limpia sesión y regresa a `/demo`

---

## Funcionalidades por plan

| Feature | Esencial (990K COP) | Premium (1.99M COP) | Élite (3.49M COP) |
|---|---|---|---|
| Gestión de citas | ✅ | ✅ | ✅ |
| Historial fotográfico | ✅ | ✅ | ✅ |
| Protocolos de tratamiento | ✅ | ✅ | ✅ |
| Dashboard clínico | ✅ | ✅ | ✅ |
| Dermoscopia IA | ❌ | ✅ | ✅ |
| Recomendaciones cosmecéuticas | ❌ | ✅ | ✅ |
| Supervisión remota | ❌ | ✅ | ✅ |
| Alertas de abandono | ❌ | ✅ | ✅ |
| Multi-sede | ❌ | ❌ | ✅ |
| Límite pacientes | 100 | 300 | ∞ |
| Límite médicos | 1 | 4 | ∞ |

`FeatureGate` bloquea automáticamente el acceso mostrando un candado con opción de upgrade al plan siguiente.

---

## Personalización white-label

- `color_primario` de la clínica se inyecta como `--color-brand` CSS variable al cargar
- Navs, badges, avatares y botones usan el color de marca de cada clínica
- Logo configurable via `logo_url` en tabla `clinicas`
- Acceso por slug: `/clinica/clinica-lumiere/dashboard`, `/clinica/derma-bogota/dashboard`...

---

## Datos de prueba (seed)

**Clínica:** Clínica Lumière · slug: `clinica-lumiere` · plan: Premium · color: `#C8A882`

**Usuarios:**
- `admin@lumiere.com` / `demo1234` → rol admin
- `dra.garcia@lumiere.com` / `demo1234` → rol médico, Medicina Estética

**Pacientes:** Valentina Morales · Sofía Restrepo (con fotos, sesiones y análisis)

---

## Pendiente de construir

### Alta prioridad
- [ ] Conectar Supabase real (crear `.env`, ejecutar migraciones, `create-demo-users.js`)
- [ ] Subida real de imágenes a Supabase Storage (actualmente solo FileReader local)
- [ ] Página `/clinica/:slug/citas` — calendario completo de agenda
- [ ] Notificaciones push / email recordatorio de cita
- [ ] Exportación real a PDF del informe dermoscópico (actualmente `window.print()`)

### Media prioridad
- [ ] Página `/clinica/:slug/upgrade` — comparador de planes con Stripe
- [ ] Registro de nuevos pacientes con formulario completo
- [ ] Edición de fichas de paciente
- [ ] Supervisión remota (videollamada o chat con especialista)
- [ ] Panel multi-sede para plan Élite

### Baja prioridad
- [ ] App móvil nativa (React Native / Expo)
- [ ] Integración con dermoscopio físico vía API
- [ ] Motor de IA real para análisis dermoscópico (actualmente simulado)
- [ ] Analíticas avanzadas y reportes exportables

---

## URLs del proyecto

| Entorno | URL |
|---|---|
| Repositorio | https://github.com/lupuelloo17/glowai |
| Dev local | http://localhost:3000 |
| Producción (Vercel) | *(pendiente de deploy en Vercel)* |
| Demo directa | http://localhost:3000/demo |
| Login | http://localhost:3000/login |
| Dashboard admin | http://localhost:3000/clinica/clinica-lumiere/dashboard |

---

## Estructura de archivos clave

```
glowai/
├── src/
│   ├── App.jsx                          # Rutas + shells + RequireAuth
│   ├── contexts/
│   │   ├── AuthContext.jsx              # Auth, roles, modo demo
│   │   └── ClinicContext.jsx            # Datos de clínica + CSS vars
│   ├── config/
│   │   └── planes.js                    # Definición de planes y features
│   ├── lib/
│   │   └── supabase.js                  # Cliente Supabase (null si sin .env)
│   ├── components/
│   │   ├── BottomNav.jsx                # Nav paciente
│   │   ├── ClinicNav.jsx                # Nav clínica con color dinámico
│   │   ├── DemoBanner.jsx               # Banner amarillo modo demo
│   │   └── FeatureGate.jsx              # Control de acceso por plan
│   └── pages/
│       ├── LoginPage.jsx
│       ├── DemoPage.jsx
│       ├── DermoscopiaPage.jsx          # Pantalla principal dermoscopia
│       └── clinica/
│           ├── AdminDashboardPage.jsx
│           ├── MedicoDashboardPage.jsx
│           ├── PacientesPage.jsx
│           ├── PacienteDetallePage.jsx
│           └── AnalisisClinicaPage.jsx
├── supabase/
│   ├── migrations/
│   │   ├── 001_init.sql                 # Esquema + RLS
│   │   └── 002_seed.sql                 # Datos demo
│   └── create-demo-users.js             # Script para crear usuarios Auth
├── vercel.json                          # Rewrite para SPA routing
└── .env.example                         # Plantilla de variables de entorno
```
