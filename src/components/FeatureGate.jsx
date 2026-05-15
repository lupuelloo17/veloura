import { useNavigate, useParams } from 'react-router-dom'
import { Lock, ArrowUpRight } from 'lucide-react'
import { useClinic } from '../contexts/ClinicContext'
import { FEATURE_LABELS, PLANES } from '../config/planes'

const UPGRADE_TO = { esencial: 'premium', premium: 'elite' }

/**
 * Wraps content that requires a specific plan feature.
 * If the clinic's plan does not include the feature, renders a lock UI.
 *
 * Usage:
 *   <FeatureGate feature="dermoscopia_ia">
 *     <DermoscopiaSection />
 *   </FeatureGate>
 */
export default function FeatureGate({ feature, children }) {
  const { hasFeature, clinica, plan } = useClinic()
  const { slug } = useParams()
  const navigate = useNavigate()

  if (hasFeature(feature)) return children

  const currentPlan = clinica?.plan ?? 'esencial'
  const nextPlan    = UPGRADE_TO[currentPlan]
  const nextConfig  = nextPlan ? PLANES[nextPlan] : null
  const featureLabel = FEATURE_LABELS[feature] ?? feature

  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 flex flex-col items-center text-center gap-3">
      <div className="w-12 h-12 bg-white rounded-full border border-gray-200 flex items-center justify-center shadow-sm">
        <Lock size={20} className="text-gray-400" />
      </div>
      <div>
        <p className="text-gray-800 font-semibold text-sm">{featureLabel}</p>
        <p className="text-gray-500 text-xs mt-1 leading-relaxed">
          Esta función no está incluida en tu{' '}
          <span className="font-semibold">{plan?.nombre ?? 'plan actual'}</span>.
        </p>
      </div>
      {nextConfig && (
        <button
          onClick={() => navigate(`/clinica/${slug}/upgrade`)}
          className="flex items-center gap-1.5 bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl active:scale-95 transition-transform"
        >
          Disponible en {nextConfig.nombre}
          <ArrowUpRight size={13} />
        </button>
      )}
      {!nextConfig && (
        <p className="text-gray-400 text-xs">Contacta con soporte para más información.</p>
      )}
    </div>
  )
}
