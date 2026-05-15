import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', chunk => { raw += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')) } catch (e) { reject(e) }
    })
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.VITE_APP_URL || '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }

  try {
    const { customerId, clinicaSlug } = await parseBody(req)

    if (!customerId) {
      res.status(400).json({ error: 'customerId is required' })
      return
    }

    const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173'

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/clinica/${clinicaSlug || 'clinica-lumiere'}/dashboard`,
    })

    res.status(200).json({ url: portalSession.url })
  } catch (err) {
    console.error('[create-portal-session]', err.message)
    res.status(500).json({ error: err.message })
  }
}
