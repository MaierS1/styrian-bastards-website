const stagingUrl = 'https://asrkcguvzscgtysnivsq.supabase.co'
const previewHost = /^[a-z0-9-]+\.styrian-bastards-website\.pages\.dev$/

function isPublicStagingKey(key) {
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true
  const parts = key.split('.')
  if (parts.length !== 3) return false
  try {
    const encoded = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')))
    return payload.role === 'anon' && payload.ref === 'asrkcguvzscgtysnivsq'
  } catch {
    return false
  }
}

export function onRequest({ request, env }) {
  const headers = {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Cross-Origin-Resource-Policy': 'same-origin',
  }
  if (!['GET', 'HEAD'].includes(request.method)) {
    return new Response(null, { status: 405, headers: { ...headers, Allow: 'GET, HEAD' } })
  }
  let body = "document.documentElement.dataset.newsStagingConfigStatus = 'unavailable-host';\n"
  const host = new URL(request.url).hostname.toLowerCase()
  if (previewHost.test(host)) {
    const key = String(env.STB_NEWS_STAGING_PUBLISHABLE_KEY || '').trim()
    if (key && isPublicStagingKey(key)) {
      const config = JSON.stringify({ url: stagingUrl, key }).replace(/</g, '\\u003c')
      body = `document.documentElement.dataset.newsStagingConfigStatus = 'ready';\nwindow.STB_V2_PRESS_STAGING_CONFIG = ${config};\n`
    } else {
      body = "document.documentElement.dataset.newsStagingConfigStatus = 'missing-or-invalid-preview-key';\n"
    }
  }
  return new Response(request.method === 'HEAD' ? null : body, { headers })
}
