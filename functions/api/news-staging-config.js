const stagingUrl = 'https://asrkcguvzscgtysnivsq.supabase.co'
const previewHost = /^[a-z0-9-]+\.styrian-bastards-website\.pages\.dev$/

function publicKeyStatus(value) {
  if (value === undefined || value === null) return 'binding-not-available'
  if (typeof value !== 'string') return 'binding-is-not-text'
  const key = value.trim()
  if (!key) return 'binding-is-empty'
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return 'ready'
  if (key.startsWith('sb_secret_')) return 'secret-key-rejected'
  const parts = key.split('.')
  if (parts.length !== 3) return 'invalid-key-format'
  try {
    const encoded = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')))
    if (payload.role !== 'anon') return 'non-public-role-rejected'
    if (payload.ref !== 'asrkcguvzscgtysnivsq') return 'wrong-staging-project'
    return 'ready'
  } catch {
    return 'invalid-key-format'
  }
}

export async function onRequest({ request, env }, fetcher = fetch) {
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
    let value = env.STB_NEWS_STAGING_PUBLISHABLE_KEY
    let source = 'preview-binding'
    if (value === undefined || value === null) {
      try {
        const response = await fetcher(`${stagingUrl}/functions/v1/news-preview-config`, { signal: AbortSignal.timeout(8000), cache: 'no-store' })
        if (response.ok) {
          const config = await response.json()
          if (config.url === stagingUrl && publicKeyStatus(config.key) === 'ready') { value = config.key; source = 'staging-endpoint' }
        }
      } catch { /* Missing staging endpoint must not suppress V1 or fall back to production. */ }
    }
    const status = publicKeyStatus(value)
    if (status === 'ready') {
      const key = value.trim()
      const config = JSON.stringify({ url: stagingUrl, key }).replace(/</g, '\\u003c')
      body = `document.documentElement.dataset.newsStagingConfigStatus = 'ready';\ndocument.documentElement.dataset.newsStagingConfigSource = ${JSON.stringify(source)};\nwindow.STB_V2_PRESS_STAGING_CONFIG = ${config};\n`
    } else {
      body = `document.documentElement.dataset.newsStagingConfigStatus = ${JSON.stringify(status)};\n`
    }
  }
  return new Response(request.method === 'HEAD' ? null : body, { headers })
}
