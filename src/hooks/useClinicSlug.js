/**
 * useClinicSlug
 *
 * Returns the clinic slug for the current context. Tries sources in order:
 *   1. :slug URL param  — available inside /clinica/:slug/* routes
 *   2. user.clinica_slug — from AuthContext (set after login / DB enrichment)
 *
 * Returns null when neither source is available (unauthenticated or
 * user record not yet enriched). Callers should guard against null and
 * redirect to /login when needed.
 */
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function useClinicSlug() {
  const params = useParams();
  const { user } = useAuth();

  return params.slug ?? user?.clinica_slug ?? null;
}
