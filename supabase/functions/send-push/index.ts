// Egy értesítést pushként kiküld a címzett összes eszközére.
// A DB trigger hívja (pg_net) { id }-val. Idempotens: a pushed_at jelölés miatt
// egy értesítés legfeljebb egyszer megy ki, ezért nem kell JWT.
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
let configured = false

Deno.serve(async (req) => {
  const { id } = await req.json().catch(() => ({}))
  if (typeof id !== 'string') return new Response('bad request', { status: 400 })

  const { data: n } = await db
    .from('notifications')
    .update({ pushed_at: new Date().toISOString() })
    .eq('id', id)
    .is('pushed_at', null)
    .select('user_id, payload')
    .maybeSingle()
  if (!n) return new Response('skip')

  if (!configured) {
    const { data, error } = await db.rpc('get_push_config')
    if (error) throw error
    webpush.setVapidDetails('https://botondjani.github.io/banda', data.vapid_public, data.vapid_private)
    configured = true
  }

  const { data: subs = [] } = await db.from('push_subscriptions').select('endpoint, p256dh, auth').eq('user_id', n.user_id)
  const results = await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(n.payload), { TTL: 86400 })
        return 'sent'
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode
        // lejárt / visszavont feliratkozás
        if (status === 404 || status === 410) await db.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
        console.error('push failed', status, String(e))
        return `failed ${status}`
      }
    }),
  )
  return Response.json(results)
})
