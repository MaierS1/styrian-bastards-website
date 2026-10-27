const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const dist = path.join(root, 'dist')
const excluded = new Set(['.git', '.github', '.gitignore', 'dist', 'node_modules', 'package.json', 'scripts'])

function shouldSkip(entry) {
  return excluded.has(entry) || entry.endsWith('.log')
}

function copyRecursive(source, target) {
  const stat = fs.statSync(source)

  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true })
    for (const entry of fs.readdirSync(source)) {
      if (shouldSkip(entry)) continue
      copyRecursive(path.join(source, entry), path.join(target, entry))
    }
    return
  }

  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.copyFileSync(source, target)
}

fs.rmSync(dist, { recursive: true, force: true })
fs.mkdirSync(dist, { recursive: true })

for (const entry of fs.readdirSync(root)) {
  if (shouldSkip(entry)) continue
  copyRecursive(path.join(root, entry), path.join(dist, entry))
}

console.log(`Built static site into ${dist}`)


const isNewsStaging = process.env.CF_PAGES === '1' && process.env.CF_PAGES_BRANCH === 'codex/news-homepage-staging-20261027'
const stagingUrl = 'https://asrkcguvzscgtysnivsq.supabase.co'
const stagingPublicKey = process.env.STB_NEWS_STAGING_PUBLISHABLE_KEY?.trim()
if (isNewsStaging && stagingPublicKey) {
  // This is a browser-safe publishable key. No service-role or secret keys may be used.
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(stagingPublicKey)) {
    const parts = stagingPublicKey.split('.')
    let payload = {}
    try { payload = JSON.parse(Buffer.from(parts[1] || '', 'base64url').toString('utf8')) } catch { /* invalid key */ }
    if (parts.length !== 3 || payload.role !== 'anon' || payload.ref !== 'asrkcguvzscgtysnivsq') throw new Error('Invalid staging publishable key')
  }
  const config = JSON.stringify({url: stagingUrl, key: stagingPublicKey}).replace(/</g, '\\u003c')
  fs.writeFileSync(path.join(dist, 'news-staging-config.js'), 'window.STB_V2_PRESS_STAGING_CONFIG = ' + config + ';\n')
}
