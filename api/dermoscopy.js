/**
 * api/dermoscopy.js
 *
 * POST /api/dermoscopy
 *
 * Analiza una imagen dermatológica usando Claude (visión multimodal) y devuelve
 * un diagnóstico estructurado en JSON.
 *
 * ── Request ─────────────────────────────────────────────────────────────────
 * Headers:
 *   Authorization: Bearer <supabase_access_token>
 *   Content-Type:  application/json
 *
 * Body (JSON):
 *   {
 *     image:      string   // imagen en Base64 (sin prefijo data:…;base64,)
 *     media_type: string   // "image/jpeg" | "image/png" | "image/webp" | "image/gif"
 *     contexto?:  string   // texto libre: síntomas, zona del cuerpo, historial (opcional)
 *   }
 *
 * ── Response 200 ────────────────────────────────────────────────────────────
 *   {
 *     tipo_piel:                 string
 *     diagnostico_preliminar:    string
 *     severidad_porcentaje:      number   // 0–100
 *     alertas_detectadas:        string[]
 *     recomendaciones_tratamiento: string[]
 *     confianza:                 "alta" | "media" | "baja"
 *     requiere_atencion_urgente: boolean
 *   }
 *
 * ── Límites ──────────────────────────────────────────────────────────────────
 * Vercel impone 4.5 MB de payload por defecto.
 * Una imagen JPEG de 3 MB en Base64 ocupa ~4 MB → usar compresión en el cliente
 * antes de enviar (canvas.toBlob con quality 0.75 suele ser suficiente).
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

// ── Allowed media types (Claude vision) ──────────────────────────────────────
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// ── Modelo Claude optimizado para visión + costo ──────────────────────────────
// claude-sonnet-4-6 ofrece la mejor relación calidad/costo para análisis médico.
const CLAUDE_MODEL = 'claude-sonnet-4-6'

// ── System prompt del dermatólogo ─────────────────────────────────────────────
const SYSTEM_PROMPT = `Eres un dermatólogo especialista en dermoscopia con más de 20 años de experiencia clínica. Tu rol es analizar imágenes dermatológicas y proporcionar evaluaciones precisas y estructuradas.

INSTRUCCIONES ESTRICTAS:
1. Analiza la imagen provista con rigor clínico aplicando criterios dermoscópicos estándar (regla ABCDE, Seven-Point Checklist, patrón de red pigmentada, estructuras vasculares, criterios globales).
2. Responde ÚNICAMENTE con un objeto JSON válido. No incluyas texto antes ni después del JSON. No incluyas comentarios, markdown ni bloques de código.
3. Todos los campos son obligatorios.
4. El campo "severidad_porcentaje" debe ser un número entero entre 0 y 100 donde 0 = sin hallazgos y 100 = máxima severidad/urgencia.
5. Los arrays deben contener entre 1 y 5 elementos concisos.
6. Si la imagen no es una lesión dermatológica o no permite un análisis adecuado, igual devuelve el JSON con "diagnostico_preliminar" explicando la limitación y "severidad_porcentaje": 0.
7. AVISO LEGAL: Siempre incluye en "recomendaciones_tratamiento" como último elemento: "Consultar con un dermatólogo certificado para confirmación diagnóstica."

FORMATO DE RESPUESTA (JSON exacto):
{
  "tipo_piel": "<descripción del tipo/fototipo de piel observado>",
  "diagnostico_preliminar": "<diagnóstico o impresión clínica principal>",
  "severidad_porcentaje": <0-100>,
  "alertas_detectadas": ["<alerta 1>", "<alerta 2>"],
  "recomendaciones_tratamiento": ["<recomendación 1>", "...", "Consultar con un dermatólogo certificado para confirmación diagnóstica."],
  "confianza": "<alta|media|baja>",
  "requiere_atencion_urgente": <true|false>
}`

// ── Body parser (compatible con vercel dev y producción) ──────────────────────
function parseBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body)
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', chunk => { raw += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')) } catch (e) {
        reject(new Error('Body JSON inválido'))
      }
    })
    req.on('error', reject)
  })
}

// ── CORS helper ───────────────────────────────────────────────────────────────
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin',  process.env.VITE_APP_URL || '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

// ── Auth: verifica el JWT de Supabase ─────────────────────────────────────────
async function verifySupabaseToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) {
    throw Object.assign(new Error('Token de autenticación requerido'), { status: 401 })
  }
  const token = authHeader.slice(7)

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) {
    throw Object.assign(new Error('Token inválido o expirado'), { status: 401 })
  }
  return data.user
}

// ── Validación del body ───────────────────────────────────────────────────────
function validateBody(body) {
  const { image, media_type } = body ?? {}

  if (!image || typeof image !== 'string') {
    throw Object.assign(
      new Error('Campo "image" requerido (Base64 string sin prefijo data:)'),
      { status: 400 }
    )
  }
  if (!media_type || !ALLOWED_TYPES.includes(media_type)) {
    throw Object.assign(
      new Error(`Campo "media_type" inválido. Valores permitidos: ${ALLOWED_TYPES.join(', ')}`),
      { status: 400 }
    )
  }

  // Estimación de tamaño (Base64 → ~75% del tamaño original)
  const estimatedBytes = (image.length * 3) / 4
  if (estimatedBytes > 5 * 1024 * 1024) {
    throw Object.assign(
      new Error('Imagen demasiado grande. Máximo 5 MB antes de codificar en Base64.'),
      { status: 413 }
    )
  }

  return { image, media_type, contexto: body.contexto ?? '' }
}

// ── Llamada a Claude ──────────────────────────────────────────────────────────
async function analyzeWithClaude({ image, media_type, contexto }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw Object.assign(new Error('ANTHROPIC_API_KEY no configurada en el servidor'), { status: 500 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // Construir el contenido del mensaje del usuario
  const userContent = [
    {
      type: 'image',
      source: {
        type:       'base64',
        media_type: media_type,
        data:       image,
      },
    },
  ]

  // Si el paciente proporcionó contexto clínico, añadirlo como texto
  if (contexto?.trim()) {
    userContent.push({
      type: 'text',
      text: `Contexto clínico adicional proporcionado por el paciente:\n${contexto.trim()}`,
    })
  }

  userContent.push({
    type: 'text',
    text: 'Analiza esta imagen dermatológica y devuelve tu evaluación en el formato JSON especificado.',
  })

  const message = await anthropic.messages.create({
    model:      CLAUDE_MODEL,
    max_tokens: 1024,
    system:     SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: userContent },
    ],
  })

  // Extraer el texto de la respuesta
  const rawText = message.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('')
    .trim()

  // Intentar parsear JSON — Claude puede envolver en ```json ... ``` a veces
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw Object.assign(
      new Error('La IA no devolvió un JSON válido. Intenta de nuevo.'),
      { status: 502 }
    )
  }

  const result = JSON.parse(jsonMatch[0])

  // Validar que los campos obligatorios estén presentes
  const requiredFields = [
    'tipo_piel',
    'diagnostico_preliminar',
    'severidad_porcentaje',
    'alertas_detectadas',
    'recomendaciones_tratamiento',
    'confianza',
    'requiere_atencion_urgente',
  ]
  for (const field of requiredFields) {
    if (!(field in result)) {
      throw Object.assign(
        new Error(`Campo "${field}" faltante en la respuesta de la IA.`),
        { status: 502 }
      )
    }
  }

  // Normalizar tipos
  result.severidad_porcentaje    = Math.min(100, Math.max(0, Number(result.severidad_porcentaje) || 0))
  result.requiere_atencion_urgente = Boolean(result.requiere_atencion_urgente)
  result.alertas_detectadas        = Array.isArray(result.alertas_detectadas)        ? result.alertas_detectadas        : []
  result.recomendaciones_tratamiento = Array.isArray(result.recomendaciones_tratamiento) ? result.recomendaciones_tratamiento : []

  return result
}

// ── Handler principal ─────────────────────────────────────────────────────────
export default async function handler(req, res) {
  setCors(res)

  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido. Usa POST.' }); return
  }

  try {
    // 1. Autenticar
    const user = await verifySupabaseToken(req.headers['authorization'])

    // 2. Parsear y validar body
    const body = await parseBody(req)
    const { image, media_type, contexto } = validateBody(body)

    // 3. Analizar con Claude
    const analysis = await analyzeWithClaude({ image, media_type, contexto })

    // 4. Responder con metadatos útiles para el frontend
    res.status(200).json({
      success:   true,
      user_id:   user.id,
      modelo:    CLAUDE_MODEL,
      analisis:  analysis,
    })

  } catch (err) {
    const status  = err.status ?? 500
    const message = err.message ?? 'Error interno del servidor'

    console.error(`[dermoscopy] ${status} — ${message}`)
    if (status === 500) console.error(err)

    res.status(status).json({ error: message })
  }
}
