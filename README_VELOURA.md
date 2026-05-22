# Veloura — Estado del Proyecto y Handoff para Cowork/Claude Code

## URL Producción
https://veloura-estetica.vercel.app

## Credenciales de prueba
- `ana@lumiere.com / demo1234` → paciente ✅ (usar esta)
- `dra.garcia@lumiere.com / demo1234` → médico
- `admin@lumiere.com / demo1234` → admin

---

## Stack
- React 18 + Vite + Tailwind CSS
- Supabase (PostgreSQL + Realtime + Storage)
- Stripe (pagos)
- Vercel (deploy automático desde GitHub)
- Claude API (Glow + dermoscopia)

---

## 🔴 ERRORES ACTIVOS — PRIORIDAD INMEDIATA

### ERROR 1: ClinicNav badge desplazado (CRÍTICO)
**Archivo:** `src/components/ClinicNav.jsx`
**Síntoma:** El badge de mensajes no leídos (número rojo/carbón) se superpone al label de texto "Chat" en la navegación inferior, desplazando visualmente el tab.
**Causa:** El `position: absolute` del badge está referenciado al contenedor del tab completo en lugar del contenedor del icono.
**Fix requerido:**
```
Estructura correcta del tab:
  button (tab contenedor — position: relative)
    div (icono wrapper — position: relative, display: inline-flex)
      i (icono Tabler)
      span (badge — position: absolute, top: -4px, right: -6px) ← SOLO aquí
    span (label texto — fuera del div del icono)
    div (punto sage 3x3px — SOLO si tab activo)
```
**Importante:** No cambiar lógica de rutas, roles ni colores. Solo estructura JSX.

### ERROR 2: Doctor muestra "?" en MiRutinaPage
**Archivo:** `src/hooks/useRoutine.js`
**Síntoma:** El chip del doctor muestra "?" e "Especialista" en lugar del nombre real.
**Causa:** `pacientes.medico_id` apunta a `usuarios.id` (b86eb3bb...) pero el hook busca ese ID directamente en `medicos`, donde el ID es diferente (a8df813f...).
**Fix requerido (mismo patrón que useChat.js):**
```javascript
// Paso 1: buscar email en usuarios
const { data: usuariosMedicos } = await supabase
  .from('usuarios')
  .select('id, email')
  .in('id', medicoIds)

// Paso 2: buscar médico por email en medicos
const emails = (usuariosMedicos || []).map(u => u.email).filter(Boolean)
const { data: medicosData } = await supabase
  .from('medicos')
  .select('id, nombre, foto, especialidad, email')
  .in('email', emails)

// Paso 3: mapear por usuario_id
usuariosMedicos.forEach(u => {
  const medico = medicosData.find(m => m.email === u.email)
  if (medico) medicosMap[u.id] = medico
})
```

---

## ✅ COMPLETADO — No tocar

### Base de datos (Supabase)
Nuevas tablas creadas y funcionando:
- `mensajes` — Realtime activo ✅
- `evoluciones` — +4 columnas (fase, zona_corporal, es_visible_para_paciente, storage_path) ✅
- `rutinas_paciente` + `pasos_rutina` ✅
- `catalogo_productos` + `marcas_productos` + `categorias_productos` ✅
- `transacciones_financieras` + `facturas` + `puntos_fidelizacion` ✅
- RLS aplicado en todas ✅

### Archivos nuevos creados
```
src/hooks/useEvolution.js        ✅ Upload Storage + CRUD evoluciones
src/hooks/useChat.js             ✅ Realtime bidireccional
src/hooks/useRoutine.js          ✅ Rutinas + pasos (tiene bug del médico)
src/components/evolution/
  EvolutionUploader.jsx          ✅
  BeforeAfterSlider.jsx          ✅
src/components/chat/
  ChatWindow.jsx                 ✅
  ChatInput.jsx                  ✅
  MessageBubble.jsx              ✅
src/components/routines/
  RoutineStepItem.jsx            ✅ (pendiente rediseño editorial)
src/pages/paciente/
  MiEvolucionPage.jsx            ✅ (pendiente rediseño editorial)
  MisMensajesPage.jsx            ✅ (pendiente rediseño editorial)
  MiRutinaPage.jsx               ✅ REDISEÑADA — editorial premium
  MisDatosPage.jsx               ✅ (pendiente rediseño editorial)
src/styles/veloura-design-system.css  ✅ Design System editorial v1.0
src/lib/theme.js                 ✅ applyClinicTheme() dinámico
```

### Design System aprobado
**Paleta:** Sage editorial
- Carbon: `#161313`
- Sage light: `#C9D3CA`
- Sage mid: `#929C92`
- Taupe: `#A39384`
- Page: `#F7F5F2`

**Tipografía:**
- Display/títulos: Cormorant Garamond (300, 400, italic)
- Body/UI: DM Sans (300, 400, 500)

**Estilo:** Editorial minimalista. Hero oscuro (#161313), contenido en crema (#F7F5F2), números tipográficos grandes, líneas en lugar de tarjetas con borde.

**Referencia visual:** MiRutinaPage.jsx — este es el componente modelo. Todos los demás deben seguir este mismo patrón.

---

## ⏳ FASE 2 — Pendiente (en orden de prioridad)

### 1. MiEvolucionPage.jsx — Rediseño editorial
Mismo patrón que MiRutinaPage. Mantener lógica de useEvolution hook.
- Hero oscuro con "Mi Evolución" en Cormorant Garamond + *Fotográfica* en cursiva sage
- 3 tabs minimalistas: Comparador / Galería / Subir foto
- BeforeAfterSlider mantiene su diseño actual
- EvolutionUploader: fondo crema, zona de drop con borde 1px, sin colores llamativos

### 2. MisMensajesPage.jsx — Rediseño editorial
- Header oscuro con nombre del médico
- Burbujas: mensajes propios en #161313 con texto sage, recibidos en blanco con texto carbon
- ChatInput: fondo crema, borde 1px, botón envío en carbon
- Timestamps en sage-mid 10px

### 3. MisDatosPage.jsx — Rediseño editorial
- Sin hero oscuro (es formulario, va en crema)
- Campos con estilo vl-input
- Labels en eyebrow style (uppercase, letterSpacing)
- Botones con vl-btn-primary y vl-btn-secondary

### 4. MiPerfilPage.jsx (Inicio del paciente)
Actualmente tiene diseño azul corporativo viejo.
- Cambiar gradiente de header por hero carbón editorial
- Tarjetas de resumen en estilo vl-card (borde 1px, sin sombra)
- Próxima cita, tratamientos activos en tipografía DM Sans

---

## Rutas del paciente (todas funcionando)
```
/clinica/clinica-lumiere-Spa/mi-perfil           → Inicio
/clinica/clinica-lumiere-Spa/mi-perfil/evolucion → Mi Evolución
/clinica/clinica-lumiere-Spa/mi-perfil/rutina    → Mi Rutina ✅ rediseñada
/clinica/clinica-lumiere-Spa/mi-perfil/chat      → Mensajes
/clinica/clinica-lumiere-Spa/mi-perfil/datos     → Mis Datos
```

## IDs importantes (Supabase)
```
clinica_id: 152512fc-10b4-4f39-92cc-a57f8b711659
paciente Ana: 3c63c892-56cf-416f-a641-a6de54a0d124
medico Dra. García (medicos.id): a8df813f-bb21-44ba-836d-dbb9697bd940
medico Dra. García (usuarios.id): b86eb3bb-dadf-455a-8def-08548519b99b
rutina Ana: 45064a79-354a-4e34-aa45-6c67ddd2b0a5
```

---

## Para Cowork/Claude Code — instrucciones de continuidad

1. Primero arregla los 2 errores activos (nav badge + doctor nombre)
2. Luego implementa Fase 2 en el orden listado arriba
3. Usa MiRutinaPage.jsx como referencia visual para todos los rediseños
4. No tocar lógica de negocio, hooks ni contextos — solo estilos
5. Commit tras cada página completada
