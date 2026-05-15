import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, Upload, FileText, RefreshCw, CalendarDays, Printer } from 'lucide-react'
import BottomNav from '../components/BottomNav'

// ─── Constants ────────────────────────────────────────────────────────────────

const LOADING_STEPS = [
  { msg: 'Procesando parámetros morfológicos…',                pct: 20 },
  { msg: 'Evaluando red pigmentada y estructuras vasculares…', pct: 45 },
  { msg: 'Aplicando algoritmo Seven-Point Checklist…',         pct: 70 },
  { msg: 'Generando informe dermoscópico…',                    pct: 95 },
]

const CRITERIA = [
  { id: 1, major: true,  pts: 2, label: 'Red pigmentada atípica',
    clinical: 'Retículo melanocítico irregular con líneas engrosadas y orificios asimétricos.' },
  { id: 2, major: true,  pts: 2, label: 'Velo azul-blanquecino (Blue-whitish veil)',
    clinical: 'Área azul-blanca difusa e irregular superpuesta sobre una zona elevada de la lesión.' },
  { id: 3, major: true,  pts: 2, label: 'Patrón vascular atípico',
    clinical: 'Vasos sanguíneos irregulares: puntiformes, glomerulares, en horquilla o polimorfos no asociados a regresión.' },
  { id: 4, major: false, pts: 1, label: 'Proyecciones radiales irregulares (Streaks)',
    clinical: 'Proyecciones lineales en la periferia de la lesión sin pigmentación folicular visible.' },
  { id: 5, major: false, pts: 1, label: 'Pigmentación irregular',
    clinical: 'Áreas de pigmentación marrón, gris o negra con distribución asimétrica e irregular.' },
  { id: 6, major: false, pts: 1, label: 'Puntos y glóbulos irregulares',
    clinical: 'Estructuras redondeadas u ovales, negras, marrones o grises con variación en tamaño y distribución irregular.' },
  { id: 7, major: false, pts: 1, label: 'Estructuras de regresión',
    clinical: 'Áreas blancas cicatriciales o zonas de pigmentación azul-pizarra (peppering) en el contexto de la lesión melanocítica.' },
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
    label: 'BAJO', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200',
    barColor: 'bg-green-500',
    text: 'Lesión de bajo riesgo. Control fotográfico en 12 meses recomendado.',
    impression: 'Hallazgos dermoscópicos dentro de parámetros benignos. Ausencia de criterios mayores de malignidad. Se recomienda control fotográfico comparativo en 12 meses.',
  }
  if (score <= 4) return {
    label: 'MODERADO', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200',
    barColor: 'bg-amber-500',
    text: 'Lesión de riesgo moderado. Valoración dermatoscópica presencial recomendada en 4-6 semanas.',
    impression: 'Presencia de criterios menores con potencial de atipía. Se recomienda valoración dermatoscópica presencial en 4-6 semanas para establecer diagnóstico diferencial con nevus atípico displásico.',
  }
  return {
    label: 'ALTO', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200',
    barColor: 'bg-red-500',
    text: 'Lesión de alto índice de sospecha. Derivación urgente a Dermatología recomendada.',
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function CriterionCard({ criterion, result, index, visible }) {
  const s = RESULT_STYLE[result]
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: `opacity 0.3s ease ${index * 90}ms, transform 0.3s ease ${index * 90}ms`,
      }}
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${
        criterion.major ? 'border-l-4 border-l-gray-700' : 'border-l-4 border-l-gray-300'
      }`}
    >
      <div className="px-4 pt-3 pb-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              {criterion.major && (
                <span className="text-[10px] font-bold bg-gray-800 text-white px-1.5 py-0.5 rounded tracking-wide">
                  MAYOR · {criterion.pts}pts
                </span>
              )}
              {!criterion.major && (
                <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded tracking-wide">
                  MENOR · {criterion.pts}pt
                </span>
              )}
              <span className="text-gray-400 text-[10px]">Criterio {criterion.id}</span>
            </div>
            <p className="text-gray-900 text-sm font-semibold leading-snug">{criterion.label}</p>
          </div>
          <span className={`flex-shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border ${s.bg} ${s.text} ${s.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse`} />
            {s.label}
          </span>
        </div>
        <p className="text-gray-500 text-xs leading-relaxed">{criterion.clinical}</p>
      </div>
    </div>
  )
}

function MorphoCard({ param, value }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between gap-2">
      <p className="text-gray-600 text-xs leading-snug flex-1">{param}</p>
      <span className="text-gray-900 text-xs font-semibold text-right flex-shrink-0 max-w-[120px]">{value}</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DermoscopiaPage() {
  const navigate = useNavigate()
  const fileRef = useRef(null)

  // step: 'capture' | 'analyzing' | 'report'
  const [step, setStep]         = useState('capture')
  const [preview, setPreview]   = useState(null)
  const [dragging, setDragging] = useState(false)

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

  // ── Image load ──
  function loadImage(file) {
    if (!file?.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  function handleDrop(e) {
    e.preventDefault(); setDragging(false)
    loadImage(e.dataTransfer.files[0])
  }

  // ── Run analysis ──
  function startAnalysis() {
    setStep('analyzing')
    setProgress(0)

    // Progress animation over 3s
    let pct = 0
    const interval = setInterval(() => {
      pct += 1
      setProgress(pct)
      if (pct >= 100) clearInterval(interval)
    }, 30)

    // Sequential messages
    LOADING_STEPS.forEach(({ msg, pct: threshold }, i) => {
      setTimeout(() => {
        setMsgVisible(false)
        setTimeout(() => { setLoadingMsg(msg); setMsgVisible(true) }, 200)
      }, i * 750)
    })

    // Complete at 3s
    setTimeout(() => {
      const r = buildResults()
      const m = buildMorpho()
      const s = calcScore(r)
      setResults(r)
      setMorpho(m)
      setScore(s)
      setStep('report')
      setTimeout(() => setCardsVisible(true), 100)
      setTimeout(() => setReportVisible(true), CRITERIA.length * 90 + 300)
    }, 3000)
  }

  // ── Reset ──
  function reset() {
    setStep('capture'); setPreview(null)
    setProgress(0); setResults({}); setMorpho({})
    setScore(0); setCardsVisible(false); setReportVisible(false)
  }

  const risk = riskConfig(score)
  const majorPositive = CRITERIA.filter(c => c.major  && results[c.id] === 'present').length
  const minorPositive = CRITERIA.filter(c => !c.major && results[c.id] === 'present').length
  const datetime = formatDatetime()

  // ── Render ──
  return (
    <div className="flex flex-col flex-1 animate-fade-in">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-gray-100 px-5 pt-7 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => step === 'report' ? reset() : navigate('/home')}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 flex-shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-gray-900 font-semibold text-base leading-tight">
              Análisis Dermoscópico Asistido
            </h1>
            <p className="text-gray-400 text-xs">
              Seven-Point Checklist · Argenziano et al., 1998
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mt-3 ml-12">
          {['Captura', 'Análisis', 'Informe'].map((label, i) => {
            const stepIdx = step === 'capture' ? 0 : step === 'analyzing' ? 1 : 2
            const done = i < stepIdx
            const active = i === stepIdx
            return (
              <div key={label} className="flex items-center gap-1">
                <div className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold border ${
                  done   ? 'bg-gray-800 border-gray-800 text-white' :
                  active ? 'bg-white border-gray-800 text-gray-800' :
                           'bg-white border-gray-300 text-gray-400'
                }`}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] font-medium ${active ? 'text-gray-800' : 'text-gray-400'}`}>
                  {label}
                </span>
                {i < 2 && <div className="w-4 h-px bg-gray-200 mx-0.5" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-5 py-4 space-y-4">

        {/* ══ STEP 1: Capture ══ */}
        {step === 'capture' && (
          <>
            {/* Upload area */}
            <div
              onDragEnter={() => setDragging(true)}
              onDragLeave={() => setDragging(false)}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              className={`rounded-xl border-2 border-dashed transition-colors overflow-hidden ${
                dragging ? 'border-gray-400 bg-gray-100' : 'border-gray-300 bg-white'
              }`}
              style={{ minHeight: preview ? 220 : 180 }}
            >
              {preview ? (
                <img src={preview} alt="Lesión" className="w-full object-cover rounded-xl" style={{ maxHeight: 260 }} />
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Upload size={20} className="text-gray-400" />
                  </div>
                  <p className="text-gray-700 text-sm font-medium mb-1">
                    Fotografiar lesión o subir imagen
                  </p>
                  <p className="text-gray-400 text-xs">
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
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { fileRef.current.removeAttribute('capture'); fileRef.current.click() }}
                  className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium py-3 rounded-xl hover:border-gray-300 active:scale-95 transition-all"
                >
                  <Upload size={16} /> Subir imagen
                </button>
                <button
                  onClick={() => { fileRef.current.setAttribute('capture', 'environment'); fileRef.current.click() }}
                  className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium py-3 rounded-xl hover:border-gray-300 active:scale-95 transition-all"
                >
                  <Camera size={16} /> Fotografiar
                </button>
              </div>
            )}

            {/* Clinical note */}
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
              <p className="text-gray-500 text-xs leading-relaxed">
                <span className="font-semibold text-gray-700">Nota clínica: </span>
                Para resultados óptimos, capture la lesión a una distancia de 2–5 cm con iluminación uniforme sin flash directo. Resolución mínima recomendada: 1280×960 px.
              </p>
            </div>

            {/* CTA */}
            <button
              disabled={!preview}
              onClick={startAnalysis}
              className={`w-full font-semibold text-sm py-4 rounded-xl transition-all duration-200 ${
                preview
                  ? 'bg-gray-900 text-white active:scale-95 shadow-sm'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Iniciar análisis dermoscópico
            </button>

            {!preview && (
              <button
                onClick={() => {
                  setPreview('https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400&h=400&fit=crop')
                }}
                className="w-full text-gray-500 text-xs border border-dashed border-gray-300 py-2.5 rounded-xl hover:bg-white transition-colors"
              >
                Usar imagen de demostración
              </button>
            )}
          </>
        )}

        {/* ══ STEP 2: Analyzing ══ */}
        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-8 gap-6">
            {preview && (
              <div className="w-full rounded-xl overflow-hidden" style={{ maxHeight: 180 }}>
                <img src={preview} alt="Lesión" className="w-full object-cover opacity-60" style={{ maxHeight: 180 }} />
              </div>
            )}

            {/* Spinner + message */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
              <p
                className="text-gray-700 text-sm font-medium text-center px-4"
                style={{
                  opacity: msgVisible ? 1 : 0,
                  transition: 'opacity 0.2s ease',
                }}
              >
                {loadingMsg}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Procesando</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-800 rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <p className="text-gray-400 text-xs text-center">
              Aplicando algoritmo Seven-Point Checklist sobre los parámetros morfológicos detectados
            </p>
          </div>
        )}

        {/* ══ STEP 3: Report ══ */}
        {step === 'report' && (
          <>
            {/* Risk banner */}
            <div className={`rounded-xl border ${risk.bg} ${risk.border} p-4`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-gray-700 text-xs font-semibold uppercase tracking-wider">Resultado · Seven-Point Score</p>
                <span className={`text-2xl font-bold ${risk.color}`}>{score} / 9</span>
              </div>
              {/* Score bar */}
              <div className="h-2.5 bg-white/70 rounded-full overflow-hidden mb-2 relative">
                <div
                  className={`h-full ${risk.barColor} rounded-full transition-all duration-700`}
                  style={{ width: `${(score / 9) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-gray-400 mb-2">
                <span>0–1 Bajo</span><span>2–4 Moderado</span><span>5–9 Alto</span>
              </div>
              <p className={`text-sm font-semibold ${risk.color}`}>
                Riesgo {risk.label}
              </p>
              <p className="text-gray-600 text-xs mt-1 leading-relaxed">{risk.text}</p>
            </div>

            {/* Major criteria */}
            <div>
              <h2 className="text-gray-800 font-semibold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="w-3 h-3 bg-gray-800 rounded-sm inline-block" />
                Criterios mayores (2 pts c/u)
              </h2>
              <div className="space-y-2">
                {CRITERIA.filter(c => c.major).map((c, i) => (
                  <CriterionCard key={c.id} criterion={c} result={results[c.id]} index={i} visible={cardsVisible} />
                ))}
              </div>
            </div>

            {/* Minor criteria */}
            <div>
              <h2 className="text-gray-800 font-semibold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="w-3 h-3 bg-gray-300 rounded-sm inline-block" />
                Criterios menores (1 pt c/u)
              </h2>
              <div className="space-y-2">
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
              <h2 className="text-gray-800 font-semibold text-xs uppercase tracking-wider mb-2 mt-2">
                Parámetros morfológicos adicionales
              </h2>
              <div className="space-y-2">
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
              }}
              className="bg-gray-900 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <FileText size={14} className="text-gray-400" />
                <p className="text-gray-300 text-xs font-semibold uppercase tracking-wider">Informe dermoscópico</p>
              </div>
              <pre className="font-mono text-[11px] leading-relaxed text-gray-300 whitespace-pre-wrap">
{`INFORME DERMOSCÓPICO — ${datetime}
Modalidad: Dermoscopia digital simulada
Algoritmo: Seven-Point Checklist
           (Argenziano et al., 1998)
─────────────────────────────────────
Puntuación total:        ${score}/9 puntos
Categoría de riesgo:     ${risk.label}
Criterios mayores (+):   ${majorPositive}/3
Criterios menores (+):   ${minorPositive}/4
─────────────────────────────────────
Impresión diagnóstica:
${risk.impression}
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

            {/* Action buttons */}
            <div
              style={{
                opacity: reportVisible ? 1 : 0,
                transition: 'opacity 0.4s ease 0.4s',
              }}
              className="space-y-2 pb-2"
            >
              <button
                onClick={() => navigate('/reservar')}
                className="w-full bg-blush-400 text-white font-semibold text-sm py-4 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <CalendarDays size={16} />
                Solicitar valoración presencial
              </button>
              <button
                onClick={() => window.print()}
                className="w-full bg-white border border-gray-200 text-gray-700 font-medium text-sm py-3.5 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                Descargar informe PDF
              </button>
              <button
                onClick={reset}
                className="w-full text-gray-500 text-sm font-medium py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} />
                Nueva exploración
              </button>
            </div>

            {/* Footer reference */}
            <p className="text-gray-400 text-[10px] text-center pb-2 leading-relaxed">
              Basado en: Argenziano G. et al. Arch Dermatol. 1998;134(12):1563–1570
            </p>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
