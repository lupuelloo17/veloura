# Veloura — La plataforma inteligente para clínicas estéticas

Aplicación SaaS para clínicas de medicina estética. Gestión de pacientes,
agenda, análisis dermoscópicos asistidos, protocolos de tratamiento y portal
del paciente con histórico clínico personalizado.

---

## 🌐 Demo en vivo

**👉 [Abrir Veloura en producción](https://glowai-41ucc1lwe-lupufu-s-projects.vercel.app)**

> Si la URL queda obsoleta (Vercel emite una URL nueva por cada deploy), busca
> la actual en **[Vercel Dashboard → veloura → Production Deployment](https://vercel.com/lupufu-s-projects/veloura)**.
> Cuando el dominio `veloura.app` esté conectado, esta URL será fija.

### Cuentas de demostración

Tres perfiles preconfigurados, todos con contraseña `demo1234`:

| Rol | Email | Qué ve |
|---|---|---|
| 👤 Administrador | `admin@lumiere.com` | Panel completo: estadísticas, equipo médico, alertas, configuración, ingresos |
| 🩺 Médica | `dra.garcia@lumiere.com` | Sus pacientes asignados, su agenda, análisis y protocolos propios |
| 💆 Paciente | `paciente@lumiere.com` | Portal personal: próxima cita, evolución, análisis, protocolo, datos editables |

Al hacer login, el sistema redirige automáticamente al portal correspondiente
según el rol del usuario.

---

## 🎨 Brand

| Elemento | Valor |
|---|---|
| Gold primario | `#C9A46A` |
| Negro carbón | `#2D2A26` |
| Crema fondo | `#F7F3EE` |
| Blanco | `#FFFFFF` |

Tagline: *La plataforma inteligente para clínicas estéticas.*

---

## 🏗️ Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite 5 + Tailwind CSS 3 |
| Routing | React Router DOM 6 (con guardas por rol) |
| Iconos | Lucide React |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth con sync automático de claims (`raw_app_meta_data`) |
| Storage | Supabase Storage: 4 buckets (`avatares`, `evoluciones`, `analisis`, `logos`) |
| Pagos | Stripe Checkout |
| Deploy | Vercel (auto-deploy desde `main`) |

---

## 🔐 Seguridad por rol

Defensa en profundidad combinando:

1. **Guardas de ruta en el cliente** (`RequireRole` en `src/App.jsx`): un paciente
   que intenta entrar a `/dashboard` es redirigido a `/mi-perfil` y viceversa.
2. **RLS en Supabase** (`supabase/migrations/011_role_based_rls.sql` y siguientes):
   las policies usan `CASE` sobre el claim `rol` del JWT:
   - `paciente`  → sólo sus propias filas (`id = auth.uid()` o `paciente_id = auth.uid()`)
   - `admin` / `recepcion` → toda la clínica
   - `medico` → sólo pacientes y datos donde está asignado como médico

Aunque alguien manipule URLs o llame Supabase directo desde la consola del
navegador con su access token, **no puede leer datos ajenos**.

---

## 🚀 Setup local

```bash
git clone https://github.com/lupuelloo17/veloura.git
cd veloura
npm install
cp .env.example .env
# Edita .env con tus credenciales de Supabase y Stripe
npm run dev
```

La app arranca en `http://localhost:5173/`.

### Variables de entorno

```bash
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_STRIPE_PUBLISHABLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
VITE_STRIPE_PRICE_ESENCIAL=...
VITE_STRIPE_PRICE_PREMIUM=...
VITE_STRIPE_PRICE_ELITE=...
VITE_APP_URL=http://localhost:5173
```

### Inicialización de la base de datos

Ejecuta las migraciones en orden desde `supabase/migrations/`:

1. `001_init.sql` — esquema base (clinicas, pacientes, sesiones, análisis)
2. `002_seed.sql` ... `015_medicos_extras_logos_bucket.sql` — features y RLS
3. `016_rls_admin_clinicas_tratamientos.sql` — última policy admin
4. `seeds/demo_paciente.sql` — paciente demo (Sofía Restrepo) opcional

En Supabase Authentication → Providers → Email, **desactiva "Confirm email"**
para que las cuentas demo funcionen sin verificación.

---

## 📁 Estructura

```
veloura/
├── src/
│   ├── App.jsx                       # Rutas + RequireAuth/RequireRole + shells
│   ├── contexts/
│   │   ├── AuthContext.jsx           # Supabase Auth + fallback mock
│   │   ├── ClinicContext.jsx         # Datos de clínica + CSS vars de marca
│   │   └── CitasContext.jsx          # Citas y tratamientos
│   ├── pages/
│   │   ├── LandingPage.jsx           # Marketing (/)
│   │   ├── LoginPage.jsx             # Login con redirect por rol
│   │   ├── RegistroPacientePage.jsx  # Registro 3 pasos + selector médico
│   │   ├── DermoscopiaPage.jsx       # 7-Point Checklist Argenziano
│   │   └── clinica/
│   │       ├── AdminDashboardPage.jsx
│   │       ├── MedicoDashboardPage.jsx
│   │       ├── MiPerfilPage.jsx      # Portal paciente
│   │       ├── MisCitasPacientePage.jsx
│   │       ├── MisAnalisisPage.jsx
│   │       ├── PacientesPage.jsx
│   │       └── ConfiguracionPage.jsx
│   └── components/
│       ├── ClinicNav.jsx             # Bottom nav (cambia por rol)
│       ├── SolicitarCitaDrawer.jsx
│       ├── NuevaSesionDrawer.jsx
│       └── EscribirClinicaDrawer.jsx
├── supabase/
│   ├── migrations/                   # 16 migraciones SQL versionadas
│   └── seeds/demo_paciente.sql       # Sofía Restrepo + datos demo
└── public/sw.js                      # Service Worker con cache versionado
```

---

## 📋 Funcionalidades principales

### Para administrador
- Dashboard con KPIs (pacientes, sesiones/mes, análisis IA, ingresos estimados)
- Gestión del equipo médico
- Alertas (abandono, renovación de plan, capacidad)
- Configuración de clínica (identidad, equipo, catálogo, notificaciones, suscripción)
- Acceso al portal Stripe de gestión de suscripción

### Para médico
- Sus pacientes asignados (con `medico_id` en `pacientes`)
- Agenda con citas del día
- Análisis dermoscópicos de sus pacientes
- Histórico clínico (sesiones, fotos antes/después, protocolos)

### Para paciente
- Registro 3 pasos (Cuenta → Perfil con foto → Ficha de piel + RGPD)
- Portal `/mi-perfil` con secciones: próxima cita, evolución, análisis,
  protocolo activo (pasos checkable + productos cosmecéuticos), datos editables
- Solicitar cita desde catálogo de tratamientos de la clínica
- Análisis dermoscópico personal (7-Point Checklist) con guardado a Storage
- Compartir análisis con el médico asignado
- Escribir a la clínica vía mailto

---

## 📄 Licencia

Software propietario. Todos los derechos reservados.
