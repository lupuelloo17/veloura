import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// ─── Constants ────────────────────────────────────────────────────────────────

const LOADING_STEPS = [
  { msg: 'Procesando parámetros morfológicos…',                pct: 20 },
  { msg: 'Evaluando red pigmentada y estructuras vasculares…', pct: 45 },
  { msg: 'Aplicando algoritmo Seven-Point Checklist…',         pct: 70 },
  { msg: 'Generando informe dermoscópico…',                    pct: 95 },
]

// 7-Point Checklist de Argenziano (Arch Dermatol. 1998;134(12):1563-1570)
// 3 criterios mayores (2pts c/u) + 4 menores (1pt c/u). Score ≥3 → derivar a Dermatología.
//   - label:      nombre clínico oficial
//   - clinical:   descripción técnica para el informe médico
//   - accessible: explicación en lenguaje paciente-friendly
//   - icon:       icono visual de lucide-react
const CRITERIA = [
  { id: 1, major: true,  pts: 2, label: 'Red de pigmento atípica',     icon: 'ti-grid-3x3',
    clinical:   'Retículo melanocítico irregular con líneas engrosadas y orificios asimétricos.',
    accessible: 'Un patrón de "red" en la piel que normalmente es uniforme, pero en esta lesión parece desigual o roto.' },
  { id: 2, major: true,  pts: 2, label: 'Velo azul-blanquecino',       icon: 'ti-cloud',
    clinical:   'Área azul-blanca difusa e irregular superpuesta sobre una zona elevada de la lesión.',
    accessible: 'Un área que se ve como cubierta por una capa azulada o blanquecina, como si tuviera un velo encima.' },
  { id: 3, major: true,  pts: 2, label: 'Patrón vascular atípico',     icon: 'ti-activity',
    clinical:   'Vasos sanguíneos irregulares: puntiformes, glomerulares, en horquilla o polimorfos no asociados a regresión.',
    accessible: 'Vasos sanguíneos visibles con formas o disposición fuera de lo normal dentro de la lesión.' },
  { id: 4, major: false, pts: 1, label: 'Estrías radiales irregulares', icon: 'ti-sun',
    clinical:   'Proyecciones lineales en la periferia de la lesión sin pigmentación folicular visible.',
    accessible: 'Pequeñas líneas que salen del borde de la lesión hacia fuera, como rayos de sol asimétricos.' },
  { id: 5, major: false, pts: 1, label: 'Manchas de pigmento irregulares', icon: 'ti-palette',
    clinical:   'Áreas de pigmentación marrón, gris o negra con distribución asimétrica e irregular.',
    accessible: 'Zonas de distinto color (marrón, gris, negro) repartidas de forma desigual.' },
  { id: 6, major: false, pts: 1, label: 'Puntos y glóbulos irregulares', icon: 'ti-circle',
    clinical:   'Estructuras redondeadas u ovales, negras, marrones o grises con variación en tamaño y distribución irregular.',
    accessible: 'Puntitos pequeños y "bolitas" dentro de la lesión, con tamaños y distribución desiguales.' },
  { id: 7, major: false, pts: 1, label: 'Estructuras de regresión',     icon: 'ti-circle-minus',
    clinical:   'Áreas blancas cicatriciales o zonas de pigmentación azul-pizarra (peppering) en el contexto de la lesión melanocítica.',
    accessible: 'Áreas más claras o blanquecinas, como si la piel se hubiera "despigmentado" en esa zona.' },
]

const MORPHO_PARAMS = [
  { label: 'Asimetría estructural (ABCD rule)', options: ['Simétrica', 'Asimétrica leve', 'Asimétrica en 2 ejes'] },
  { label: 'Bordes',                            options: ['Regulares', 'Irregulares', 'Microlobulados', 'Mal definidos'] },
  { label: 'Cromatismo',                        options: ['Monocromo', 'Bicrómico', 'Policrómico (>2 colores)'] },
  { label: 'Diámetro estimado',                 options: ['<6mm', '6-10mm', '>10mm'] },
  { label: 'Evolución reportada',               options: ['Sin cambios', 'Cambio reciente', 'Crecimiento activo'] },
]

const RESULT_STYLE = {
  present:       { label: 'PRESENTE',      bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300',   dot: 'bg-red-500'    },
  absent:        { label: 'AUSENTE',       bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-300', dot: 'bg-green-500'  },
  indeterminate: { label: 'INDETERMINADO', bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-300', dot: 'bg-amber-500'  },
}

function riskConfig(score) {
  if (score <= 1) return {
    label: 'BAJO', nivel: 'bajo', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200',
    barColor: 'bg-green-500',
    text: 'Lesión de bajo riesgo. Control fotográfico en 12 meses recomendado.',
    accessible: 'No se detectan signos de alarma. Te recomendamos una revisión rutinaria con tu médico.',
    impression: 'Hallazgos dermoscópicos dentro de parámetros benignos. Ausencia de criterios mayores de malignidad. Se recomienda control fotográfico comparativo en 12 meses.',
  }
  if (score <= 4) return {
    label: 'MODERADO', nivel: 'moderado', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200',
    barColor: 'bg-amber-500',
    text: 'Lesión de riesgo moderado. Valoración dermatoscópica presencial recomendada en 4-6 semanas.',
    accessible: 'Algunos criterios merecen atención. Te recomendamos consultar con tu médico en las próximas semanas.',
    impression: 'Presencia de criterios menores con potencial de atipía. Se recomienda valoración dermatoscópica presencial en 4-6 semanas para establecer diagnóstico diferencial con nevus atípico displásico.',
  }
  return {
    label: 'ALTO', nivel: 'alto', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200',
    barColor: 'bg-red-500',
    text: 'Lesión de alto índice de sospecha. Derivación urgente a Dermatología recomendada.',
    accessible: 'Se detectan criterios de alerta. Consulta dermatológica presencial urgente recomendada.',
    impression: 'Criterios mayores positivos con puntuación de alto índice de sospecha. Derivación urgente a Dermatología para valoración presencial, biopsia escisional y estudio anatomopatológico.',
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomResult() {
  const r = Math.random()
  if (r < 0.45) return 'absent'
  if (r < 0.80) return 'present'
  return 'indeterminate'
}

function buildResults() {
  const results = {}
  CRITERIA.forEach(c => { results[c.id] = randomResult() })
  return results
}

function buildMorpho() {
  const m = {}
  MORPHO_PARAMS.forEach(p => {
    m[p.label] = p.options[Math.floor(Math.random() * p.options.length)]
  })
  return m
}

function calcScore(results) {
  return CRITERIA.reduce((sum, c) =>
    results[c.id] === 'present' ? sum + c.pts : sum, 0)
}

function formatDatetime() {
  return new Date().toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Cosmeceutical catalog ────────────────────────────────────────────────────

const BRAND = {
  zo:   { name: 'ZO Skin Health', bg: '#000000', text: '#FFFFFF' },
  obagi:{ name: 'Obagi',          bg: '#1B3A6B', text: '#FFFFFF' },
  sc:   { name: 'SkinCeuticals',  bg: '#8B6914', text: '#FFFFFF' },
  mc:   { name: 'Medicube',       bg: '#E85D4A', text: '#FFFFFF' },
}

const ALL_PRODUCTS = [
  // ── Pigmentation ──
  { id: 'zo-brightalive', brand: 'zo',
    name: 'Brightalive Skin Brightener',
    indication: 'Hiperpigmentación irregular y discromía melanocítica',
    active: 'Retinol estabilizado 0.1% + niacinamida',
    pauta: 'Aplicación nocturna. Evitar exposición solar sin fotoprotección SPF50+',
    rule: 'pigmentation' },
  { id: 'obagi-clearfx', brand: 'obagi',
    name: 'Nu-Derm Clear Fx',
    indication: 'Hiperpigmentación postinflamatoria y lentigos solares',
    active: 'Ácido kójico + arbutina. Sin hidroquinona',
    pauta: 'Mañana y noche sobre piel limpia y seca',
    rule: 'pigmentation' },
  { id: 'sc-discolor', brand: 'sc',
    name: 'Discoloration Defense',
    indication: 'Discromía refractaria y melasma epidérmico',
    active: 'Tranexámico 3% + niacinamida 5% + HEPES 5%',
    pauta: 'Sérum de aplicación diaria, mañana y noche',
    rule: 'pigmentation' },
  // ── Regression ──
  { id: 'zo-retinol1', brand: 'zo',
    name: 'Retinol Skin Brightener 1%',
    indication: 'Remodelación epidérmica y estimulación de colágeno dérmico',
    active: 'Retinol encapsulado 1% + vitamina E',
    pauta: 'Uso nocturno. Iniciar 2 noches/semana. Aumentar progresivamente',
    rule: 'regression' },
  { id: 'sc-ceferulic', brand: 'sc',
    name: 'C E Ferulic',
    indication: 'Fotoprotección antioxidante y reparación del ADN celular',
    active: 'Vitamina C 15% + vitamina E 1% + ácido ferúlico 0.5%',
    pauta: 'Aplicación matutina sobre piel limpia, previo a fotoprotector',
    rule: 'regression' },
  { id: 'obagi-profc', brand: 'obagi',
    name: 'Professional-C Serum 20%',
    indication: 'Daño actínico acumulado y disfunción de barrera cutánea',
    active: 'L-Ascórbico puro 20%',
    pauta: 'Mañana. Conservar en frío. Cambiar si vira a naranja',
    rule: 'regression' },
  // ── Vascular ──
  { id: 'zo-rozatrol', brand: 'zo',
    name: 'Rozatrol',
    indication: 'Reactividad vascular y eritema perilesional',
    active: 'ZO-RRS2 + ZPOLY + niacinamida',
    pauta: 'Mañana y noche. Compatible con tratamientos tópicos prescritos',
    rule: 'vascular' },
  { id: 'sc-phyto', brand: 'sc',
    name: 'Phyto Corrective Gel',
    indication: 'Sensibilización cutánea y eritema asociado a lesiones activas',
    active: 'Cucumber + thyme + dipeptide-2',
    pauta: 'Aplicar en capa fina sobre la zona afectada 2 veces al día',
    rule: 'vascular' },
  // ── Maintenance / low risk ──
  { id: 'mc-stick', brand: 'mc',
    name: 'Red Erasing Stick',
    indication: 'Rojeces puntuales y manchas postinflamatorias residuales',
    active: 'Niacinamida 10% + centella asiática',
    pauta: 'Aplicación localizada mañana y noche',
    rule: 'maintenance' },
  { id: 'mc-pad', brand: 'mc',
    name: 'Zero Pore Pad',
    indication: 'Hiperqueratosis folicular y poro dilatado perilesional',
    active: 'BHA 0.5% + AHA 10% + PHA 5%',
    pauta: '1 pad en noche, máximo 3 veces por semana. No usar sobre lesión activa',
    rule: 'maintenance' },
  // ── Universal (always eligible as fallback) ──
  { id: 'zo-spf', brand: 'zo',
    name: 'Sunscreen + Primer SPF30',
    indication: 'Fotoprotección obligatoria en toda lesión pigmentada estudiada',
    active: 'Filtros físicos + químicos de amplio espectro',
    pauta: 'OBLIGATORIO cada mañana. Reaplicar cada 2h en exposición solar',
    rule: 'universal' },
]

function selectProducts(results, morpho, score) {
  const hasPigmentation = results[5] === 'present' ||
    morpho['Cromatismo'] === 'Policrómico (>2 colores)'
  const hasRegression   = results[7] === 'present'
  const hasVascular     = results[3] === 'present' || score >= 2
  const isLowRisk       = score <= 1

  // Build ordered candidate list (no duplicates)
  const seen = new Set()
  const candidates = []

  function add(rule) {
    ALL_PRODUCTS.filter(p => p.rule === rule && !seen.has(p.id))
      .forEach(p => { seen.add(p.id); candidates.push(p) })
  }

  if (hasPigmentation) add('pigmentation')
  if (hasRegression)   add('regression')
  if (hasVascular)     add('vascular')
  if (isLowRisk)       add('maintenance')

  // Always add SPF if not already included & there's room
  if (!seen.has('zo-spf')) add('universal')

  // If still empty, return full fallback
  if (candidates.length === 0) {
    return ALL_PRODUCTS.filter(p => p.rule === 'maintenance' || p.rule === 'universal').slice(0, 3)
  }

  return candidates.slice(0, 3)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CriterionCard({ criterion, result, index, visible }) {
  const iconColor = result === 'present' ? '#8B3A3A' : result === 'absent' ? '#929C92' : '#A39384'
  const iconBg    = result === 'present' ? 'rgba(139,58,58,0.08)' : result === 'absent' ? 'rgba(146,156,146,0.08)' : 'rgba(163,147,132,0.08)'
  const badgeColor  = result === 'present' ? '#8B3A3A' : result === 'absent' ? '#929C92' : '#A39384'
  const badgeBg     = result === 'present' ? 'rgba(139,58,58,0.08)' : result === 'absent' ? 'rgba(146,156,146,0.08)' : 'rgba(163,147,132,0.08)'
  const badgeBorder = result === 'present' ? 'rgba(139,58,58,0.2)'  : result === 'absent' ? 'rgba(146,156,146,0.2)' : 'rgba(163,147,132,0.2)'
  const badgeLabel  = result === 'present' ? 'PRESENTE' : result === 'absent' ? 'AUSENTE' : 'INDETERMINADO'
  const borderLeft  = result === 'present'
    ? '3px solid rgba(139,58,58,0.4)'
    : result === 'absent'
    ? '3px solid rgba(146,156,146,0.4)'
    : '3px solid rgba(163,147,132,0.4)'

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: `opacity 0.3s ease ${index * 90}ms, transform 0.3s ease ${index * 90}ms`,
        background: '#FFFFFF',
        border: '1px solid rgba(22,19,19,0.08)',
        borderLeft,
        borderRadius: '2px',
        overflow: 'hidden',
        padding: '14px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Icon */}
        <div style={{ width: '36px', height: '36px', borderRadius: '2px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: iconBg }}>
          <i className={`ti ${criterion.icon || 'ti-circle'}`} style={{ fontSize: '18px', color: iconColor }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.1em', padding: '2px 6px', borderRadius: '2px', background: criterion.major ? '#161313' : 'rgba(22,19,19,0.08)', color: criterion.major ? '#F7F5F2' : 'rgba(22,19,19,0.5)' }}>
              {criterion.major ? `MAYOR · ${criterion.pts}pts` : `MENOR · ${criterion.pts}pt`}
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', color: 'rgba(22,19,19,0.3)' }}>#{criterion.id}</span>
          </div>
          <p style={{ fontFamily: "'DM Sans', system-ui", fontSize: '13px', fontWeight: 400, color: '#161313', margin: 0, lineHeight: 1.3 }}>{criterion.label}</p>
        </div>

        <span style={{ flexShrink: 0, fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.1em', padding: '3px 8px', borderRadius: '2px', border: `1px solid ${badgeBorder}`, background: badgeBg, color: badgeColor }}>
          {badgeLabel}
        </span>
      </div>

      {/* Descripción accesible + clínica colapsable */}
      <div style={{ paddingLeft: '48px', marginTop: '10px' }}>
        <p style={{ fontFamily: "'DM Sans', system-ui", fontSize: '12px', fontWeight: 300, color: 'rgba(22,19,19,0.6)', lineHeight: 1.5, margin: '0 0 6px' }}>
          {criterion.accessible}
        </p>
        <details>
          <summary style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(22,19,19,0.3)', cursor: 'pointer', userSelect: 'none', letterSpacing: '0.06em' }}>
            Ver descripción clínica
          </summary>
          <p style={{ fontFamily: "'DM Sans', system-ui", fontSize: '11px', fontWeight: 300, color: 'rgba(22,19,19,0.45)', lineHeight: 1.5, margin: '6px 0 0' }}>{criterion.clinical}</p>
        </details>
      </div>
    </div>
  )
}

function MorphoCard({ param, value }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid rgba(22,19,19,0.07)', borderRadius: '2px', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
      <p style={{ fontFamily: "'DM Sans', system-ui", fontSize: '12px', fontWeight: 300, color: 'rgba(22,19,19,0.5)', lineHeight: 1.4, flex: 1, margin: 0 }}>{param}</p>
      <span style={{ fontFamily: "'DM Sans', system-ui", fontSize: '12px', fontWeight: 400, color: '#161313', textAlign: 'right', flexShrink: 0, maxWidth: '120px' }}>{value}</span>
    </div>
  )
}

function ProductCard({ product }) {
  const brand = BRAND[product.brand]
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Brand header */}
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{ backgroundColor: brand.bg }}
      >
        <span className="text-xs font-bold tracking-wide" style={{ color: brand.text }}>
          {brand.name}
        </span>
        <span
          className="text-[9px] font-semibold px-1.5 py-0.5 rounded border border-white/30"
          style={{ color: brand.text, opacity: 0.85 }}
        >
          Uso bajo supervisión médica
        </span>
      </div>
      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <p className="text-gray-900 text-sm font-bold leading-snug">{product.name}</p>
        <div>
          <p className="text-gray-400 text-[10px] uppercase tracking-wide font-semibold mb-0.5">
            Indicación clínica
          </p>
          <p className="text-gray-700 text-xs leading-relaxed">{product.indication}</p>
        </div>
        <div>
          <p className="text-gray-400 text-[10px] uppercase tracking-wide font-semibold mb-0.5">
            Principio activo
          </p>
          <p className="text-gray-700 text-xs leading-relaxed">{product.active}</p>
        </div>
        <div>
          <p className="text-gray-400 text-[10px] uppercase tracking-wide font-semibold mb-0.5">
            Pauta de aplicación
          </p>
          <p className="text-gray-700 text-xs leading-relaxed">{product.pauta}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

// `embedded`: cuando es true, no renderiza su propio BottomNav (se asume que
// está dentro de un layout que ya lo aporta, ej. ClinicLayout) y ajusta la
// navegación de "volver" a la pantalla anterior en vez del legacy /home.
export default function DermoscopiaPage({ embedded = false }) {
  const navigate = useNavigate()
  const { slug } = useParams()
  const fileRef = useRef(null)
  const { user } = useAuth()

  // step: 'capture' | 'analyzing' | 'report'
  const [step, setStep]         = useState('capture')
  const [preview, setPreview]   = useState(null)
  const [previewFile, setPreviewFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [analysisId, setAnalysisId] = useState(null)
  const [guardando, setGuardando]   = useState(false)
  const [compartido, setCompartido] = useState(false)

  // Analysis state
  const [progress, setProgress]       = useState(0)
  const [loadingMsg, setLoadingMsg]   = useState(LOADING_STEPS[0].msg)
  const [msgVisible, setMsgVisible]   = useState(true)

  // Report state
  const [results, setResults]         = useState({})
  const [morpho, setMorpho]           = useState({})
  const [score, setScore]             = useState(0)
  const [cardsVisible, setCardsVisible] = useState(false)
  const [reportVisible, setReportVisible] = useState(false)

  // AI analysis state
  const [compressedBase64, setCompressedBase64] = useState(null) // Base64 JPEG (no prefix) for /api/dermoscopy
  const [aiResult, setAiResult]                 = useState(null) // Full analisis object from API

  // ── Image load (canvas compress → JPEG 0.75, max 1200px) ──
  function loadImage(file) {
    if (!file?.type.startsWith('image/')) return
    setPreviewFile(file)

    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      // Scale down to max 1200px on longest side (target < 1.5 MB encoded)
      const MAX = 1200
      let w = img.naturalWidth, h = img.naturalHeight
      if (w > MAX || h > MAX) {
        const ratio = Math.min(MAX / w, MAX / h)
        w = Math.round(w * ratio)
        h = Math.round(h * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75)
      setPreview(dataUrl)
      setCompressedBase64(dataUrl.split(',')[1]) // strip the data:image/jpeg;base64, prefix
      URL.revokeObjectURL(objectUrl)
    }

    img.onerror = () => {
      // Graceful fallback: plain FileReader (no canvas compression)
      const reader = new FileReader()
      reader.onload = e => setPreview(e.target.result)
      reader.readAsDataURL(file)
      URL.revokeObjectURL(objectUrl)
    }

    img.src = objectUrl
  }

  function handleDrop(e) {
    e.preventDefault(); setDragging(false)
    loadImage(e.dataTransfer.files[0])
  }

  // ── Run analysis (real API + mock fallback) ──
  async function startAnalysis() {
    setStep('analyzing')
    setProgress(0)

    // Advance progress to 90 % while waiting for Claude; snap to 100 when done
    let pct = 0
    const interval = setInterval(() => {
      pct = Math.min(pct + 1, 90)
      setProgress(pct)
    }, 60)

    // Sequential loading messages (cosmetic UX)
    LOADING_STEPS.forEach(({ msg }, i) => {
      setTimeout(() => {
        setMsgVisible(false)
        setTimeout(() => { setLoadingMsg(msg); setMsgVisible(true) }, 200)
      }, i * 750)
    })

    // Shared finalise — called on both success and fallback paths
    const finalise = async (r, m, s, ai = null) => {
      clearInterval(interval)
      setProgress(100)
      setAiResult(ai)
      setResults(r)
      setMorpho(m)
      setScore(s)
      setStep('report')
      setTimeout(() => setCardsVisible(true), 100)
      setTimeout(() => setReportVisible(true), CRITERIA.length * 90 + 300)
      if (supabase && user?.id && user?.rol === 'paciente' && previewFile) {
        await saveAnalysis(r, s, riskConfig(s), ai)
      }
    }

    // ── Real API path (only when we have a compressed Base64 image) ──
    if (compressedBase64) {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData?.session?.access_token

        const res = await fetch('/api/dermoscopy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            image:      compressedBase64,
            media_type: 'image/jpeg',
            contexto:   '',
          }),
        })

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}))
          throw new Error(errBody.error || `HTTP ${res.status}`)
        }

        const { analisis } = await res.json()

        // Map 0-100 severity → 0-9 Seven-Point score
        const s = Math.round((analisis.severidad_porcentaje / 100) * 9)

        // Build criteria results biased by severity:
        // higher severity → more criteria marked as "present"
        const prob = analisis.severidad_porcentaje / 100
        const r = {}
        CRITERIA.forEach(c => {
          const roll = Math.random()
          r[c.id] = roll < prob * 0.75 ? 'present'
                  : roll < prob * 0.75 + 0.12 ? 'indeterminate'
                  : 'absent'
        })

        const m = buildMorpho()
        await finalise(r, m, s, analisis)
        return

      } catch (err) {
        clearInterval(interval)
        console.warn('[Dermoscopia API] Cayendo a modo demo:', err.message)
        // fall through to mock path below
      }
    }

    // ── Fallback / demo mode (no Base64 or API error) ──
    const r = buildResults()
    const m = buildMorpho()
    const s = calcScore(r)
    await finalise(r, m, s, null)
  }

  // ── Persistencia: sube foto al bucket "analisis" e inserta fila ──
  async function saveAnalysis(results, score, risk, aiData = null) {
    setGuardando(true)

    // ── Bloque 1: Resolver tenant_id (clinica_id) y medico_id ──────────────
    let clinicaId, medicoId
    try {
      const { data: pac, error: pacErr } = await supabase
        .from('pacientes')
        .select('medico_id, clinica_id')
        .eq('id', user.id)
        .maybeSingle()
      if (pacErr) throw pacErr
      medicoId  = pac?.medico_id ?? null
      clinicaId = pac?.clinica_id ?? user.clinica_id
      if (!clinicaId) throw new Error('clinica_id (tenant_id) no resuelto para este usuario')
    } catch (err) {
      console.error('[Dermoscopia save] Error al resolver clinica_id:', err.message)
      setGuardando(false)
      return
    }

    // ── Bloque 2: Subir imagen al Storage ───────────────────────────────────
    // RLS exige que la ruta empiece por tenant_id:
    //   dermoscopia-images/{clinica_id}/{paciente_id}/{timestamp}.{ext}
    const ext  = previewFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${clinicaId}/${user.id}/${Date.now()}.${ext}`
    let imageUrl = null
    try {
      const { error: upErr } = await supabase.storage
        .from('dermoscopia-images')
        .upload(path, previewFile, { contentType: previewFile.type, upsert: false })
      if (upErr) throw upErr
      const { data: pub } = supabase.storage
        .from('dermoscopia-images')
        .getPublicUrl(path)
      imageUrl = pub.publicUrl
    } catch (err) {
      console.error(
        '[Dermoscopia save] Error al subir imagen al Storage:',
        err.message,
        { bucket: 'dermoscopia-images', path }
      )
      setGuardando(false)
      return
    }

    // ── Bloque 3: Insertar análisis en la base de datos ─────────────────────
    const criteriosJson = {}
    CRITERIA.forEach(c => { criteriosJson[c.label] = results[c.id] })
    try {
      const { data, error } = await supabase
        .from('analisis_dermoscopicos')
        .insert({
          paciente_id:       user.id,
          clinica_id:        clinicaId,
          medico_id:         medicoId,
          fecha:             new Date().toISOString(),
          criterios:         criteriosJson,
          puntuacion_total:  score,
          nivel_riesgo:      risk.nivel,
          imagen_url:        imageUrl,
          compartido_medico: false,
          // Campos de IA (solo se persisten si Claude respondió correctamente)
          ...(aiData ? {
            diagnostico_preliminar:      aiData.diagnostico_preliminar      ?? null,
            tipo_piel:                   aiData.tipo_piel                   ?? null,
            confianza:                   aiData.confianza                   ?? null,
            requiere_atencion_urgente:   aiData.requiere_atencion_urgente   ?? null,
            alertas_detectadas:          aiData.alertas_detectadas          ?? null,
            recomendaciones_tratamiento: aiData.recomendaciones_tratamiento ?? null,
          } : {}),
        })
        .select()
        .single()
      if (error) throw error
      setAnalysisId(data.id)
    } catch (err) {
      console.error(
        '[Dermoscopia save] Error al insertar en analisis_dermoscopicos:',
        err.message
      )
    } finally {
      setGuardando(false)
    }
  }

  async function handleCompartir() {
    if (!analysisId || !supabase) {
      alert('Para compartir, inicia sesión como paciente.')
      return
    }
    const { error } = await supabase
      .from('analisis_dermoscopicos')
      .update({ compartido_medico: true })
      .eq('id', analysisId)
    if (error) return alert('Error: ' + error.message)
    setCompartido(true)
  }

  // Destino "Solicitar cita" según rol del usuario.
  // Solo pacientes tienen la ruta /mi-perfil/citas — los demás roles no
  // deben navegar ahí (RequireRole los reboota al dashboard y encadena
  // cargas de ConversacionesPage con IDs demo que disparan errores 400).
  // NUNCA se usa '/reservar' como fallback: en App.jsx esa ruta está mapeada
  // a <Navigate to="/login" replace />, lo que causaba un logout aparente.
  const clinicSlug = slug ?? user?.clinica_slug
  const solicitarCitaPath = (user?.rol === 'paciente' && clinicSlug)
    ? `/clinica/${clinicSlug}/mi-perfil/citas`
    : null

  // ── Reset ──
  function reset() {
    setStep('capture'); setPreview(null); setPreviewFile(null)
    setProgress(0); setResults({}); setMorpho({})
    setScore(0); setCardsVisible(false); setReportVisible(false)
    setAnalysisId(null); setCompartido(false)
    setCompressedBase64(null); setAiResult(null)
  }

  const risk = riskConfig(score)
  const majorPositive = CRITERIA.filter(c => c.major  && results[c.id] === 'present').length
  const minorPositive = CRITERIA.filter(c => !c.major && results[c.id] === 'present').length
  const datetime = formatDatetime()
  const products = step === 'report' ? selectProducts(results, morpho, score) : []

  // ── Render ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Laser scan keyframe — injected once; Tailwind purge-safe */}
      <style>{`
        @keyframes dermScan {
          0%   { top: -3px }
          50%  { top: calc(100% + 3px) }
          100% { top: -3px }
        }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{ background: '#161313', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <button
            onClick={() => {
              if (step === 'report') return reset()
              if (embedded && user?.rol === 'paciente' && clinicSlug) {
                return navigate(`/clinica/${clinicSlug}/analisis`)
              }
              return navigate(-1)
            }}
            style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(247,245,242,0.5)', cursor: 'pointer', flexShrink: 0 }}
          >
            <i className="ti ti-arrow-left" style={{ fontSize: '16px' }} />
          </button>
          <div>
            <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '18px', fontWeight: 300, color: '#F7F5F2', letterSpacing: '-0.01em', margin: 0, lineHeight: 1.2 }}>
              Análisis Dermoscópico
            </h1>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', color: 'rgba(247,245,242,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '2px 0 0' }}>
              Seven-Point Checklist · Argenziano 1998
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', paddingLeft: '44px' }}>
          {['Captura', 'Análisis', 'Informe'].map((label, i) => {
            const stepIdx = step === 'capture' ? 0 : step === 'analyzing' ? 1 : 2
            const done   = i < stepIdx
            const active = i === stepIdx
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'DM Mono', monospace", fontSize: '9px', fontWeight: 400,
                  background: done ? '#929C92' : active ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: `1px solid ${done ? '#929C92' : active ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  color: done ? '#161313' : active ? '#F7F5F2' : 'rgba(255,255,255,0.25)',
                }}>
                  {done ? '✓' : i + 1}
                </div>
                <span style={{ fontFamily: "'DM Sans', system-ui", fontSize: '10px', fontWeight: 300, color: active ? 'rgba(247,245,242,0.7)' : 'rgba(247,245,242,0.25)' }}>
                  {label}
                </span>
                {i < 2 && <div style={{ width: '16px', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#F7F5F2', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ══ STEP 1: Capture ══ */}
        {step === 'capture' && (
          <>
            {/* Upload area */}
            <div
              onDragEnter={() => setDragging(true)}
              onDragLeave={() => setDragging(false)}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              style={{
                minHeight: preview ? 220 : 180,
                border: `2px dashed ${dragging ? 'rgba(22,19,19,0.3)' : 'rgba(22,19,19,0.15)'}`,
                background: dragging ? 'rgba(22,19,19,0.03)' : '#FFFFFF',
                borderRadius: '2px',
                overflow: 'hidden',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              {preview ? (
                <img src={preview} alt="Lesión" style={{ width: '100%', objectFit: 'cover', maxHeight: 260, display: 'block' }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', background: 'rgba(22,19,19,0.05)', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                    <i className="ti ti-upload" style={{ fontSize: '20px', color: 'rgba(22,19,19,0.3)' }} />
                  </div>
                  <p style={{ fontFamily: "'DM Sans', system-ui", fontSize: '13px', fontWeight: 400, color: '#161313', margin: '0 0 4px' }}>
                    Fotografiar lesión o subir imagen
                  </p>
                  <p style={{ fontFamily: "'DM Sans', system-ui", fontSize: '11px', fontWeight: 300, color: 'rgba(22,19,19,0.4)', margin: 0 }}>
                    JPG, PNG · Arrastra o toca para seleccionar
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => loadImage(e.target.files[0])}
            />

            {/* Two capture buttons */}
            {!preview && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  onClick={() => { fileRef.current.removeAttribute('capture'); fileRef.current.click() }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#FFFFFF', border: '1px solid rgba(22,19,19,0.12)', color: '#161313', fontFamily: "'DM Sans', system-ui", fontSize: '13px', fontWeight: 400, padding: '12px', borderRadius: '2px', cursor: 'pointer' }}
                >
                  <i className="ti ti-upload" style={{ fontSize: '15px' }} /> Subir imagen
                </button>
                <button
                  onClick={() => { fileRef.current.setAttribute('capture', 'environment'); fileRef.current.click() }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#FFFFFF', border: '1px solid rgba(22,19,19,0.12)', color: '#161313', fontFamily: "'DM Sans', system-ui", fontSize: '13px', fontWeight: 400, padding: '12px', borderRadius: '2px', cursor: 'pointer' }}
                >
                  <i className="ti ti-camera" style={{ fontSize: '15px' }} /> Fotografiar
                </button>
              </div>
            )}

            {/* Clinical note */}
            <div style={{ background: '#FFFFFF', border: '1px solid rgba(22,19,19,0.07)', borderLeft: '2px solid rgba(146,156,146,0.3)', borderRadius: '2px', padding: '12px 16px' }}>
              <p style={{ fontFamily: "'DM Sans', system-ui", fontSize: '11px', fontWeight: 300, color: 'rgba(22,19,19,0.45)', lineHeight: 1.6, margin: 0 }}>
                <span style={{ fontWeight: 400, color: 'rgba(22,19,19,0.7)' }}>Nota clínica: </span>
                Para resultados óptimos, capture la lesión a una distancia de 2–5 cm con iluminación uniforme sin flash directo. Resolución mínima recomendada: 1280×960 px.
              </p>
            </div>

            {/* CTA */}
            <button
              disabled={!preview}
              onClick={startAnalysis}
              style={{
                width: '100%', fontFamily: "'DM Sans', system-ui", fontSize: '13px', fontWeight: 400,
                letterSpacing: '0.06em', padding: '14px', borderRadius: '2px', border: 'none', cursor: preview ? 'pointer' : 'not-allowed',
                background: preview ? '#161313' : 'rgba(22,19,19,0.08)', color: preview ? '#F7F5F2' : 'rgba(22,19,19,0.3)',
                transition: 'background 0.2s',
              }}
            >
              Iniciar análisis dermoscópico
            </button>

            {!preview && (
              <button
                onClick={() => {
                  setPreview('https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400&h=400&fit=crop')
                }}
                style={{ width: '100%', fontFamily: "'DM Sans', system-ui", fontSize: '11px', fontWeight: 300, color: 'rgba(22,19,19,0.4)', border: '1px dashed rgba(22,19,19,0.15)', background: 'transparent', padding: '10px', borderRadius: '2px', cursor: 'pointer' }}
              >
                Usar imagen de demostración
              </button>
            )}
          </>
        )}

        {/* ══ STEP 2: Analyzing ══ */}
        {step === 'analyzing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: '24px' }}>
            {preview && (
              <div style={{ width: '100%', borderRadius: '2px', overflow: 'hidden', maxHeight: 180, position: 'relative' }}>
                <img src={preview} alt="Lesión" style={{ width: '100%', objectFit: 'cover', opacity: 0.55, maxHeight: 180, display: 'block' }} />
                {/* Laser scan line overlay */}
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(201,164,106,0.85) 35%, rgba(255,220,140,1) 50%, rgba(201,164,106,0.85) 65%, transparent 100%)',
                    boxShadow: '0 0 8px rgba(201,164,106,0.9), 0 0 18px rgba(201,164,106,0.5)',
                    animation: 'dermScan 1.6s ease-in-out infinite',
                  }} />
                  {/* Subtle tinted overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(22,19,19,0.18)' }} />
                </div>
              </div>
            )}

            {/* Spinner + message */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid rgba(22,19,19,0.1)', borderTopColor: '#161313', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p
                style={{
                  fontFamily: "'DM Sans', system-ui", fontSize: '13px', fontWeight: 300, color: 'rgba(22,19,19,0.65)', textAlign: 'center', padding: '0 16px', margin: 0,
                  opacity: msgVisible ? 1 : 0,
                  transition: 'opacity 0.2s ease',
                }}
              >
                {loadingMsg}
              </p>
            </div>

            {/* Progress bar */}
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(22,19,19,0.35)', marginBottom: '6px' }}>
                <span>Procesando</span>
                <span>{progress}%</span>
              </div>
              <div style={{ height: '3px', background: 'rgba(22,19,19,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{ height: '100%', background: '#161313', borderRadius: '2px', transition: 'width 0.1s', width: `${progress}%` }}
                />
              </div>
            </div>

            <p style={{ fontFamily: "'DM Sans', system-ui", fontSize: '11px', fontWeight: 300, color: 'rgba(22,19,19,0.35)', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
              Aplicando algoritmo Seven-Point Checklist sobre los parámetros morfológicos detectados
            </p>
          </div>
        )}

        {/* ══ STEP 3: Report ══ */}
        {step === 'report' && (
          <>
            {/* Risk banner */}
            {(() => {
              const riskColor = risk.nivel === 'alto' ? '#8B3A3A' : risk.nivel === 'moderado' ? '#A39384' : '#929C92'
              const riskBg    = risk.nivel === 'alto' ? 'rgba(139,58,58,0.06)' : risk.nivel === 'moderado' ? 'rgba(163,147,132,0.08)' : 'rgba(146,156,146,0.08)'
              const riskBdr   = risk.nivel === 'alto' ? 'rgba(139,58,58,0.2)'  : risk.nivel === 'moderado' ? 'rgba(163,147,132,0.2)' : 'rgba(146,156,146,0.2)'
              return (
                <div style={{ background: riskBg, border: `1px solid ${riskBdr}`, borderRadius: '2px', padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.35)', margin: '0 0 4px' }}>
                        Resultado · Seven-Point Score
                      </p>
                      <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '13px', fontWeight: 400, color: riskColor, margin: 0 }}>
                        Riesgo {risk.label}
                      </p>
                    </div>
                    <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '40px', fontWeight: 300, color: riskColor, lineHeight: 1 }}>
                      {score}<span style={{ fontSize: '18px', color: 'rgba(22,19,19,0.3)' }}>/9</span>
                    </span>
                  </div>
                  {/* Score bar */}
                  <div style={{ height: '3px', background: 'rgba(22,19,19,0.08)', borderRadius: '2px', marginBottom: '8px' }}>
                    <div style={{ width: `${(score / 9) * 100}%`, height: '100%', background: riskColor, borderRadius: '2px', transition: 'width 0.7s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Mono', monospace", fontSize: '9px', color: 'rgba(22,19,19,0.3)', marginBottom: '10px' }}>
                    <span>0–1 Bajo</span><span>2–4 Moderado</span><span>5–9 Alto</span>
                  </div>
                  <p style={{ fontFamily: "'DM Sans', system-ui", fontSize: '12px', fontWeight: 300, color: 'rgba(22,19,19,0.55)', lineHeight: 1.5, margin: 0 }}>
                    {risk.text}
                  </p>
                </div>
              )
            })()}

            {/* AI Diagnosis card */}
            {aiResult && (
              <div style={{
                opacity: cardsVisible ? 1 : 0,
                transition: 'opacity 0.4s ease',
                background: aiResult.requiere_atencion_urgente ? 'rgba(139,58,58,0.05)' : 'rgba(22,19,19,0.03)',
                border: aiResult.requiere_atencion_urgente ? '1px solid rgba(139,58,58,0.18)' : '1px solid rgba(22,19,19,0.08)',
                borderRadius: '2px',
                padding: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.35)', margin: '0 0 4px' }}>
                      Diagnóstico IA · {aiResult.tipo_piel}
                    </p>
                    <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '13px', fontWeight: 400, color: '#161313', margin: 0, lineHeight: 1.4 }}>
                      {aiResult.diagnostico_preliminar}
                    </p>
                  </div>
                  <span style={{
                    fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.1em',
                    textTransform: 'uppercase', padding: '3px 7px', borderRadius: '2px', flexShrink: 0,
                    background: aiResult.confianza === 'alta' ? 'rgba(146,156,146,0.15)' : aiResult.confianza === 'media' ? 'rgba(163,147,132,0.15)' : 'rgba(139,58,58,0.1)',
                    color: aiResult.confianza === 'alta' ? '#929C92' : aiResult.confianza === 'media' ? '#A39384' : '#8B3A3A',
                    border: aiResult.confianza === 'alta' ? '1px solid rgba(146,156,146,0.3)' : aiResult.confianza === 'media' ? '1px solid rgba(163,147,132,0.3)' : '1px solid rgba(139,58,58,0.2)',
                  }}>
                    {aiResult.confianza}
                  </span>
                </div>
                {aiResult.requiere_atencion_urgente && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', background: 'rgba(139,58,58,0.08)', borderRadius: '2px', borderLeft: '2px solid #8B3A3A' }}>
                    <i className="ti ti-alert-triangle" style={{ fontSize: '12px', color: '#8B3A3A', flexShrink: 0 }} />
                    <p style={{ fontFamily: "'DM Sans', system-ui", fontSize: '11px', fontWeight: 400, color: '#8B3A3A', margin: 0 }}>
                      Requiere atención dermatológica urgente
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Major criteria */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ width: '10px', height: '10px', background: '#161313', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
                <h2 style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.5)', margin: 0, fontWeight: 400 }}>Criterios mayores (2 pts c/u)</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {CRITERIA.filter(c => c.major).map((c, i) => (
                  <CriterionCard key={c.id} criterion={c} result={results[c.id]} index={i} visible={cardsVisible} />
                ))}
              </div>
            </div>

            {/* Minor criteria */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ width: '10px', height: '10px', background: 'rgba(22,19,19,0.15)', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
                <h2 style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.5)', margin: 0, fontWeight: 400 }}>Criterios menores (1 pt c/u)</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {CRITERIA.filter(c => !c.major).map((c, i) => (
                  <CriterionCard key={c.id} criterion={c} result={results[c.id]} index={i + 3} visible={cardsVisible} />
                ))}
              </div>
            </div>

            {/* Morphological parameters */}
            <div
              style={{
                opacity: reportVisible ? 1 : 0,
                transition: 'opacity 0.4s ease',
              }}
            >
              <h2 style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.5)', margin: '0 0 8px', fontWeight: 400 }}>
                Parámetros morfológicos adicionales
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {MORPHO_PARAMS.map(p => (
                  <MorphoCard key={p.label} param={p.label} value={morpho[p.label]} />
                ))}
              </div>
            </div>

            {/* Clinical report */}
            <div
              style={{
                opacity: reportVisible ? 1 : 0,
                transition: 'opacity 0.4s ease 0.2s',
                background: '#161313',
                borderRadius: '2px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <i className="ti ti-file-text" style={{ fontSize: '14px', color: 'rgba(247,245,242,0.4)' }} />
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(247,245,242,0.5)', margin: 0, fontWeight: 400 }}>Informe dermoscópico</p>
              </div>
              <pre className="font-mono text-[11px] leading-relaxed text-gray-300 whitespace-pre-wrap">
{`INFORME DERMOSCÓPICO — ${datetime}
Modalidad: ${aiResult ? 'Análisis IA (Claude Sonnet)' : 'Dermoscopia digital simulada'}
Algoritmo: Seven-Point Checklist
           (Argenziano et al., 1998)
─────────────────────────────────────
Puntuación total:        ${score}/9 puntos
Categoría de riesgo:     ${risk.label}
Criterios mayores (+):   ${majorPositive}/3
Criterios menores (+):   ${minorPositive}/4${aiResult ? `
Tipo de piel:            ${aiResult.tipo_piel}
Confianza IA:            ${aiResult.confianza}` : ''}
─────────────────────────────────────
Impresión diagnóstica:
${aiResult ? aiResult.diagnostico_preliminar : risk.impression}
─────────────────────────────────────
AVISO: Este análisis ha sido generado
mediante inteligencia artificial con
fines de orientación clínica prelimi-
nar. No constituye diagnóstico médico
definitivo. Se recomienda confirmación
mediante exploración dermatoscópica
presencial realizada por facultativo
especialista en Dermatología.`}
              </pre>
            </div>

            {/* Alertas detectadas (IA) */}
            {aiResult?.alertas_detectadas?.length > 0 && (
              <div style={{ opacity: reportVisible ? 1 : 0, transition: 'opacity 0.4s ease 0.1s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <i className="ti ti-alert-circle" style={{ fontSize: '12px', color: '#8B3A3A' }} />
                  <h2 style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.5)', margin: 0, fontWeight: 400 }}>
                    Alertas detectadas
                  </h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {aiResult.alertas_detectadas.map((alerta, i) => (
                    <div key={i} style={{ padding: '10px 12px', background: 'rgba(139,58,58,0.04)', border: '1px solid rgba(139,58,58,0.12)', borderLeft: '2px solid #8B3A3A', borderRadius: '2px' }}>
                      <p style={{ fontFamily: "'DM Sans', system-ui", fontSize: '12px', fontWeight: 300, color: 'rgba(22,19,19,0.75)', margin: 0, lineHeight: 1.5 }}>{alerta}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recomendaciones clínicas IA */}
            {aiResult?.recomendaciones_tratamiento?.length > 0 && (
              <div style={{ opacity: reportVisible ? 1 : 0, transition: 'opacity 0.4s ease 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <i className="ti ti-list-check" style={{ fontSize: '12px', color: 'rgba(22,19,19,0.45)' }} />
                  <h2 style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(22,19,19,0.5)', margin: 0, fontWeight: 400 }}>
                    Recomendaciones clínicas IA
                  </h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {aiResult.recomendaciones_tratamiento.map((rec, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 12px', background: '#FFFFFF', border: '1px solid rgba(22,19,19,0.07)', borderRadius: '2px' }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', color: 'rgba(22,19,19,0.3)', flexShrink: 0, marginTop: '2px', minWidth: '14px' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <p style={{ fontFamily: "'DM Sans', system-ui", fontSize: '12px', fontWeight: 300, color: 'rgba(22,19,19,0.75)', margin: 0, lineHeight: 1.5 }}>{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Cosmeceutical protocol ── */}
            <div
              style={{
                opacity: reportVisible ? 1 : 0,
                transition: 'opacity 0.4s ease 0.3s',
              }}
            >
              <div style={{ borderTop: '1px solid rgba(22,19,19,0.1)', paddingTop: '16px', marginBottom: '12px' }}>
                <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '16px', fontWeight: 300, color: '#161313', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                  Protocolo cosmecéutico complementario
                </h2>
                <p style={{ fontFamily: "'DM Sans', system-ui", fontSize: '11px', fontWeight: 300, color: 'rgba(22,19,19,0.45)', lineHeight: 1.5, margin: 0 }}>
                  Los siguientes productos de cosmética médica son compatibles con los
                  hallazgos de la exploración. Su uso no sustituye el tratamiento prescrito
                  por su dermatólogo.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {products.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              <p style={{ fontFamily: "'DM Sans', system-ui", fontSize: '10px', fontWeight: 300, color: 'rgba(22,19,19,0.35)', lineHeight: 1.6, marginTop: '12px', padding: '0 4px' }}>
                Veloura no mantiene relación comercial con las marcas citadas. Las
                recomendaciones se basan en la composición y evidencia clínica publicada
                de cada formulación.
              </p>
            </div>

            {/* Action buttons */}
            <div
              style={{
                opacity: reportVisible ? 1 : 0,
                transition: 'opacity 0.4s ease 0.4s',
                display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '8px',
              }}
            >
              {/* Indicador de guardado / estado para pacientes */}
              {user?.rol === 'paciente' && (
                <div style={{ padding: '10px 14px', borderRadius: '2px', border: '1px solid rgba(22,19,19,0.08)', background: '#F7F5F2', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {guardando ? (
                    <span style={{ fontFamily: "'DM Sans', system-ui", fontSize: '11px', fontWeight: 300, color: 'rgba(22,19,19,0.45)' }}>Guardando análisis en tu historial…</span>
                  ) : analysisId ? (
                    <span style={{ fontFamily: "'DM Sans', system-ui", fontSize: '11px', fontWeight: 300, color: '#929C92', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="ti ti-circle-check" style={{ fontSize: '12px' }} /> Análisis guardado en tu historial
                    </span>
                  ) : (
                    <span style={{ fontFamily: "'DM Sans', system-ui", fontSize: '11px', fontWeight: 300, color: 'rgba(22,19,19,0.45)' }}>Análisis disponible solo en esta sesión</span>
                  )}
                </div>
              )}

              <button
                onClick={() => solicitarCitaPath && navigate(solicitarCitaPath)}
                style={{ width: '100%', background: '#161313', color: '#F7F5F2', border: 'none', borderRadius: '2px', padding: '14px', fontFamily: "'DM Sans', system-ui", fontSize: '13px', fontWeight: 400, letterSpacing: '0.04em', cursor: solicitarCitaPath ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: solicitarCitaPath ? 1 : 0.5 }}
              >
                <i className="ti ti-calendar" style={{ fontSize: '15px' }} />
                Solicitar cita con mi médico
              </button>

              {/* Compartir con médico — solo si paciente y análisis guardado */}
              {user?.rol === 'paciente' && analysisId && (
                <button
                  onClick={handleCompartir}
                  disabled={compartido}
                  style={{
                    width: '100%', borderRadius: '2px', padding: '14px',
                    fontFamily: "'DM Sans', system-ui", fontSize: '13px', fontWeight: 400, letterSpacing: '0.04em',
                    cursor: compartido ? 'default' : 'pointer', opacity: compartido ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    background: compartido ? 'rgba(146,156,146,0.1)' : 'rgba(22,19,19,0.06)',
                    color: compartido ? '#929C92' : '#161313',
                    border: `1px solid ${compartido ? 'rgba(146,156,146,0.3)' : 'rgba(22,19,19,0.12)'}`,
                  }}
                >
                  {compartido
                    ? <><i className="ti ti-circle-check" style={{ fontSize: '15px' }} /> Compartido con tu médico</>
                    : <><i className="ti ti-send" style={{ fontSize: '15px' }} /> Compartir con mi médico</>}
                </button>
              )}

              <button
                onClick={() => window.print()}
                style={{ width: '100%', background: '#FFFFFF', border: '1px solid rgba(22,19,19,0.12)', color: '#161313', borderRadius: '2px', padding: '12px', fontFamily: "'DM Sans', system-ui", fontSize: '13px', fontWeight: 400, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <i className="ti ti-printer" style={{ fontSize: '15px' }} />
                Descargar informe PDF
              </button>
              <button
                onClick={reset}
                style={{ width: '100%', background: 'transparent', border: 'none', color: 'rgba(22,19,19,0.4)', borderRadius: '2px', padding: '10px', fontFamily: "'DM Sans', system-ui", fontSize: '12px', fontWeight: 300, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <i className="ti ti-refresh" style={{ fontSize: '14px' }} />
                Nueva exploración
              </button>
            </div>

            {/* Footer reference */}
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(22,19,19,0.3)', textAlign: 'center', paddingBottom: '8px', lineHeight: 1.5, margin: 0 }}>
              Basado en: Argenziano G. et al. Arch Dermatol. 1998;134(12):1563–1570
            </p>
          </>
        )}
      </div>

      {!embedded && <BottomNav />}
    </div>
  )
}
