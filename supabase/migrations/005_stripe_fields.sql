-- ═══════════════════════════════════════════════════════════════════
--  GlowAI — Añadir campos Stripe a la tabla clinicas
--  Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

alter table clinicas add column if not exists stripe_customer_id         text;
alter table clinicas add column if not exists stripe_subscription_id     text;
alter table clinicas add column if not exists stripe_subscription_status text default 'inactive';

create index if not exists clinicas_stripe_customer_idx on clinicas(stripe_customer_id);
