import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Shield } from 'lucide-react'

const BRAND = '#D4537E'

export default function PoliticaPrivacidadPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-10">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={16} style={{ color: BRAND }} />
            <h1 className="text-gray-900 font-bold text-base">Política de Privacidad</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-8 text-gray-700">

        {/* Intro */}
        <div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
            style={{ backgroundColor: BRAND + '15', color: BRAND }}
          >
            <Shield size={11} /> RGPD · Reglamento UE 2016/679
          </div>
          <h2 className="text-gray-900 font-bold text-xl mb-2">
            POLÍTICA DE PRIVACIDAD — GLOWAI
          </h2>
          <p className="text-sm text-gray-500">Última actualización: mayo de 2026</p>
        </div>

        <Section title="1. Responsable del tratamiento">
          <Field label="Nombre" value="[Nombre de la clínica]" />
          <Field label="CIF" value="[CIF de la clínica]" />
          <Field label="Dirección" value="[Dirección de la clínica]" />
          <Field label="Email de contacto" value="[email@clinica.es]" />
          <p className="text-sm mt-3 leading-relaxed">
            La clínica, en adelante «el Responsable», determina los fines y medios del
            tratamiento de sus datos personales a través de la plataforma Veloura.
          </p>
        </Section>

        <Section title="2. Finalidad del tratamiento">
          <p className="text-sm leading-relaxed">
            Sus datos personales son tratados con las siguientes finalidades:
          </p>
          <ul className="text-sm space-y-1.5 mt-2 list-disc pl-5">
            <li>Gestión del historial clínico estético y seguimiento de tratamientos.</li>
            <li>Programación y gestión de citas médicas.</li>
            <li>Envío de recordatorios de cita por WhatsApp o SMS.</li>
            <li>Comunicaciones comerciales, solo si ha prestado su consentimiento expreso.</li>
          </ul>
        </Section>

        <Section title="3. Base jurídica">
          <ul className="text-sm space-y-2 list-disc pl-5">
            <li>
              <strong>Consentimiento del interesado</strong> (Art. 6.1.a RGPD) para el
              tratamiento de datos generales y el envío de comunicaciones comerciales.
            </li>
            <li>
              <strong>Ejecución de contrato de servicios sanitarios</strong> (Art. 6.1.b RGPD)
              para la gestión de citas y el historial clínico.
            </li>
          </ul>
        </Section>

        <Section title="4. Datos de salud">
          <div
            className="rounded-xl p-4 text-sm leading-relaxed"
            style={{ backgroundColor: BRAND + '10', borderLeft: `3px solid ${BRAND}` }}
          >
            Sus datos de salud son una categoría especial de datos conforme al{' '}
            <strong>Art. 9 RGPD</strong>. Son tratados exclusivamente bajo su{' '}
            <strong>consentimiento explícito</strong> (Art. 9.2.a RGPD) con la finalidad
            de gestión del historial clínico estético. Nunca serán cedidos a terceros
            sin su consentimiento, salvo obligación legal.
          </div>
        </Section>

        <Section title="5. Conservación de los datos">
          <p className="text-sm leading-relaxed">
            Sus datos se conservarán durante la vigencia de la relación contractual y,
            una vez finalizada, durante{' '}
            <strong>5 años adicionales</strong> conforme a la{' '}
            <strong>Ley 41/2002, de 14 de noviembre, de Autonomía del Paciente</strong>{' '}
            y normativa aplicable en materia de responsabilidad civil.
          </p>
          <p className="text-sm leading-relaxed mt-2">
            Los datos de comunicaciones comerciales se suprimirán en el momento en que
            retire su consentimiento.
          </p>
        </Section>

        <Section title="6. Derechos del interesado">
          <p className="text-sm leading-relaxed mb-3">
            Puede ejercer en cualquier momento los siguientes derechos enviando un
            escrito a <strong>[email@clinica.es]</strong>, adjuntando copia de su DNI o NIE:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { derecho: 'Acceso', desc: 'Conocer qué datos tratamos' },
              { derecho: 'Rectificación', desc: 'Corregir datos inexactos' },
              { derecho: 'Supresión', desc: 'Solicitar la eliminación' },
              { derecho: 'Portabilidad', desc: 'Recibir sus datos en formato digital' },
              { derecho: 'Oposición', desc: 'Oponerse al tratamiento' },
              { derecho: 'Limitación', desc: 'Restringir el uso de sus datos' },
            ].map(({ derecho, desc }) => (
              <div key={derecho} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-bold text-gray-800">{derecho}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="7. Autoridad de control">
          <p className="text-sm leading-relaxed">
            Si considera que el tratamiento de sus datos no es conforme a la normativa
            vigente, puede presentar una reclamación ante la{' '}
            <strong>Agencia Española de Protección de Datos (AEPD)</strong>:
          </p>
          <div className="mt-2 bg-gray-50 rounded-xl px-4 py-3 text-sm">
            <p className="font-semibold text-gray-800">www.aepd.es</p>
            <p className="text-gray-500 text-xs mt-0.5">C/ Jorge Juan 6, 28001 Madrid</p>
          </div>
        </Section>

        {/* Footer */}
        <div className="border-t border-gray-100 pt-6 text-center">
          <p className="text-xs text-gray-400">
            Veloura · Valencia, España · contacto@veloura.app
          </p>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-gray-900 font-bold text-base mb-3">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div className="flex items-baseline gap-2 py-1 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-28 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-700 font-medium">{value}</span>
    </div>
  )
}
