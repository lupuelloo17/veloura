import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Service-role Supabase client for webhook writes (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

// Read raw body for Stripe signature verification
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return }

  const sig     = req.headers['stripe-signature']
  const secret  = process.env.STRIPE_WEBHOOK_SECRET
  const rawBody = await getRawBody(req)

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch (err) {
    console.error('[stripe-webhook] signature error:', err.message)
    res.status(400).json({ error: `Webhook signature failed: ${err.message}` })
    return
  }

  console.log('[stripe-webhook] event:', event.type)

  try {
    switch (event.type) {

      // ── Suscripción activada ──────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object
        const { clinicaId } = session.metadata ?? {}
        if (!clinicaId) break

        await supabaseAdmin
          .from('clinicas')
          .update({
            plan_activo:               true,
            stripe_customer_id:        session.customer,
            stripe_subscription_id:    session.subscription,
            stripe_subscription_status: 'active',
            fecha_renovacion:          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('id', clinicaId)

        console.log('[stripe-webhook] plan activated for clinica:', clinicaId)
        break
      }

      // ── Pago fallido ──────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const customerId = invoice.customer

        await supabaseAdmin
          .from('clinicas')
          .update({ stripe_subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId)

        console.log('[stripe-webhook] payment failed for customer:', customerId)
        break
      }

      // ── Suscripción cancelada ─────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const customerId = sub.customer

        await supabaseAdmin
          .from('clinicas')
          .update({
            plan_activo:               false,
            stripe_subscription_status: 'canceled',
          })
          .eq('stripe_customer_id', customerId)

        console.log('[stripe-webhook] subscription canceled for customer:', customerId)
        break
      }

      // ── Suscripción renovada correctamente ────────────────────────
      case 'invoice.paid': {
        const invoice = event.data.object
        const customerId = invoice.customer
        const periodEnd  = invoice.lines?.data?.[0]?.period?.end

        await supabaseAdmin
          .from('clinicas')
          .update({
            stripe_subscription_status: 'active',
            plan_activo:                true,
            ...(periodEnd ? { fecha_renovacion: new Date(periodEnd * 1000).toISOString() } : {}),
          })
          .eq('stripe_customer_id', customerId)

        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('[stripe-webhook] handler error:', err.message)
    res.status(500).json({ error: err.message })
    return
  }

  res.status(200).json({ received: true })
}
