# Estado del Proyecto — GlowAI

> Última actualización: 2026-05-17

---

## 1. Pantallas / Rutas

### Públicas
| Ruta | Componente | Notas |
|------|-----------|-------|
| `/` | `LandingPage` | Página de marketing |
| `/precios` | `PreciosPage` | Planes + integración Stripe |
| `/pago-exitoso` | `PagoExitosoPage` | Callback post-pago Stripe |
| `/politica-privacidad` | `PoliticaPrivacidadPage` | |
| `/registro/:slug` | `RegistroPacientePage` | Registro en 3 pasos con selector de médico |
| `/bienvenida` | `WelcomePage` | Entrada amistosa (conservada) |
| `/login` | `LoginPage` | Login con redirect por rol + demo Sofía Restrepo |
| `/demo` | `DemoPage` | Modo demo con datos mock |

### Portal clínica — Staff (requiere rol admin/medico/recepcion)
| Ruta | Componente | Rol |
|------|-----------|-----|
| `/clinica/:slug/dashboard` | `DashboardPage` | admin, medico, recepcion |
| `/clinica/:slug/pacientes` | `PacientesPage` | admin, medico, recepcion |
| `/clinica/:slug/paciente/:id` | `PacienteDetallePage` | admin, medico, recepcion |
| `/clinica/:slug/agenda` | `AgendaPage` | admin, medico, recepcion |
| `/clinica/:slug/analisis` | `AnalisisClinicaPage` | admin, medico, recepcion |
| `/clinica/:slug/configuracion` | `ConfiguracionPage` | solo admin |

### Portal clínica — Paciente (requiere rol paciente)
| Ruta | Componente | Notas |
|------|-----------|-------|
| `/clinica/:slug/mi-perfil` | `MiPerfilPage` | Home del paciente: próxima cita, evolución, protocolo, datos |
| `/clinica/:slug/mi-perfil/citas` | `MisCitasPacientePage` | Catálogo de tratamientos + historial de citas |
| `/clinica/:slug/analisis` | `MisAnalisisPage` | Análisis dermoscópicos propios |
| `/clinica/:slug/dermoscopia` | `DermoscopiaPage` (embedded) | 7-Point Checklist Argenziano, guardado real |

### Legacy (redirigen)
| Ruta | Destino |
|------|---------|
| `/home`, `/reservar`, `/historial`, `/skin-check` | `/login` |
| `/analisis` | `/login` |
| `/dermoscopia` | `/clinica/:slug/dermoscopia` (paciente) o `/login` |

---

## 2. Tablas en Supabase

| Tabla | Descripción |
|-------|-------------|
| `clinicas` | Multi-tenant: slug, plan, Stripe IDs, configuración, whatsapp |
| `usuarios` | Usuarios autenticados con rol (admin/medico/recepcion/paciente) |
| `medicos` | Catálogo de médicos por clínica (tabla legacy, pre-auth) |
| `pacientes` | Ficha del paciente: datos, tipo piel, alergias, RGPD, riesgo |
| `citas` | Citas con estado, tratamiento y médico asignado |
| `sesiones` | Sesiones de tratamiento con fotos antes/después |
| `analisis_dermoscopicos` | Análisis con criterios 7-Point, imagen y nivel de riesgo |
| `tratamientos` | Catálogo de tratamientos por clínica (nombre, duración, precio, color) |
| `protocolos` | Protocolos personalizados por paciente (pasos + productos) |

### Storage buckets
| Bucket | Acceso | Uso |
|--------|--------|-----|
| `avatares` | Público (lectura) | Fotos de perfil de pacientes |
| `evoluciones` | Privado (scope por clínica) | Fotos antes/después en sesiones |
| `analisis` | Privado (scope por clínica) | Imágenes de análisis dermoscópicos |

### RPCs / funciones SQL
| Función | Acceso | Uso |
|---------|--------|-----|
| `get_medicos_clinica(slug)` | anon + authenticated | Lista médicos activos para el registro público |

---

## 3. Funcionalidades completadas

### Arquitectura
- [x] Multi-tenant por slug de clínica
- [x] Auth con roles: `admin`, `medico`, `recepcion`, `paciente`
- [x] RLS granular por rol (paciente ve solo lo suyo; médico ve solo sus pacientes asignados)
- [x] `RequireRole` + `RoleHomeRedirect` en rutas del cliente
- [x] Redirect automático al portal correcto según rol al hacer login
- [x] Service Worker con cache bumpeado (v3)

### Portal paciente
- [x] Registro en 3 pasos (datos personales → condiciones → médico asignado)
- [x] Selector de médico: auto-asignar o elegir de la lista pública
- [x] `MiPerfilPage`: próxima cita, evolución fotográfica, protocolo, datos editables, bottom nav propia
- [x] `MisCitasPacientePage`: catálogo de tratamientos + historial
- [x] `MisAnalisisPage`: lista de análisis dermoscópicos del paciente
- [x] Dermoscopia integrada en el portal (`/clinica/:slug/dermoscopia`)
  - 7-Point Checklist de Argenziano con iconos visuales y lenguaje accesible
  - Guardado real a Supabase Storage (bucket `analisis`) + tabla `analisis_dermoscopicos`
- [x] Cuenta demo paciente Sofía Restrepo en `LoginPage`

### Portal staff
- [x] Dashboard con KPIs y citas del día
- [x] Lista de pacientes con buscador y filtros
- [x] Detalle de paciente con historial de sesiones
- [x] Agenda con vista de citas
- [x] Página de análisis clínicos (vista staff)
- [x] Configuración de clínica (perfil, tratamientos, notificaciones, número WhatsApp)

### Drawers / modales
- [x] `NuevaCitaDrawer` — agendar nueva cita
- [x] `NuevaSesionDrawer` — registrar sesión de tratamiento
- [x] `NuevoPacienteDrawer` — crear paciente desde staff
- [x] `CitaDetallePanel` — panel lateral de detalle de cita
- [x] `EscribirClinicaDrawer` — contacto vía mailto
- [x] `SolicitarCitaDrawer` — solicitar cita desde portal paciente

### Infraestructura / UI
- [x] `RecordatoriosBanner` — alertas de citas próximas (2h y 24h)
- [x] `FeatureGate` — bloqueo de funciones según plan de la clínica
- [x] `DemoBanner` — indicador de modo demo
- [x] Campos Stripe en tabla `clinicas` (customer_id, subscription_id, status)
- [x] 13 migraciones SQL aplicadas y documentadas

---

## 4. Funcionalidades pendientes

### Alta prioridad
- [ ] **WhatsApp de bienvenida al registrar paciente** — marcado como TODO en `RegistroPacientePage`, requiere Twilio o similar
- [ ] **Recordatorios reales por WhatsApp/email** — `recordatorios.js` genera la UI pero no envía mensajes
- [ ] **Webhook Stripe** — campos en DB listos, pero no hay backend que procese eventos de suscripción/pago
- [ ] **Flujo de pago completo** — `PreciosPage` muestra planes pero el checkout no cierra en producción

### Media prioridad
- [ ] **`MedicoDashboardPage`** — archivo existe (`src/pages/clinica/MedicoDashboardPage.jsx`) pero no está rutado
- [ ] **`AdminDashboardPage`** — archivo existe (`src/pages/clinica/AdminDashboardPage.jsx`) pero no está rutado
- [ ] **Subida de fotos antes/después en sesiones** — columnas `fotos_antes`/`fotos_despues` en DB, UI pendiente
- [ ] **Gestión de protocolos por el staff** — tabla `protocolos` lista; UI del médico para crear/editar pendiente
- [ ] **Reseteo de contraseña** — no hay flujo de recuperación de clave implementado

### Baja prioridad
- [ ] **Notificaciones push** — SW registrado pero sin Push API conectada
- [ ] **Análisis IA de imagen de piel** — actualmente es checklist manual; sin modelo de visión integrado
- [ ] **Soporte multi-idioma** — UI completamente en español, sin i18n
- [ ] **Exportar historial / PDF** — sin ninguna funcionalidad de exportación de datos

---

## 5. Bugs conocidos

| # | Descripción | Archivo | Impacto |
|---|-------------|---------|---------|
| 1 | `MOCK_NOW` hardcodeado al `2026-05-15T08:30:00` — los recordatorios no funcionan en fechas reales | `src/services/recordatorios.js:3` | Alto en producción |
| 2 | `src/data/pacientes.js` contiene datos hardcodeados de "Valentina" — archivo legacy no eliminado | `src/data/pacientes.js` | Confusión / datos sucios |
| 3 | `src/screens/` contiene `BookingScreen`, `AnalysisScreen`, `WelcomeScreen` sin importar en ningún lugar | `src/screens/` | Código muerto |
| 4 | WhatsApp de bienvenida al registrarse solo hace `console.log`, no envía nada | `src/pages/RegistroPacientePage.jsx` | Paciente no recibe aviso |
| 5 | RLS de `tratamientos` usa subquery a `usuarios` (patrón antiguo) — puede causar recursión como en migración 008 | `supabase/migrations/006_configuracion.sql` | Potencial error 500 en Supabase |
| 6 | `MedicoDashboardPage` y `AdminDashboardPage` existen pero no están en el router — inaccesibles | `src/App.jsx` | Funcionalidad invisible |
| 7 | El SDK de `stripe` (server-side) está importado desde el cliente — debería moverse a una Edge Function | `package.json` | Riesgo de seguridad |

---

## 6. Dependencias externas conectadas

| Servicio | Estado | Uso |
|----------|--------|-----|
| **Supabase** | Activo | Auth, PostgreSQL, Storage (3 buckets), RLS, RPCs |
| **Stripe** | Parcial | Campos en DB y UI de precios listos; webhook backend pendiente |
| **Vercel** | Activo | Hosting y CI/CD automático desde rama `main` |
| **Twilio / WhatsApp** | Pendiente | Mencionado como TODO en código; sin integración real |
| **Email (SMTP/Resend)** | Pendiente | Sin integración; el drawer de contacto usa `mailto:` |

### Paquetes npm relevantes
| Paquete | Versión | Uso |
|---------|---------|-----|
| `@supabase/supabase-js` | ^2.45.4 | Cliente Supabase |
| `@stripe/stripe-js` | ^9.5.0 | Stripe frontend |
| `stripe` | ^22.1.1 | Stripe SDK (mover a Edge Function) |
| `react-router-dom` | ^6.26.2 | Routing |
| `lucide-react` | ^0.441.0 | Iconografía |
| `tailwindcss` | ^3.4.11 | Estilos |
| `vite` | ^5.4.3 | Bundler |
