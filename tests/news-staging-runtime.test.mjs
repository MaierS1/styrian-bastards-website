import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const source = await readFile(new URL('../functions/api/news-staging-config.js', import.meta.url), 'utf8')
const { onRequest } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))

const preview = 'https://codex-news-homepage-staging.styrian-bastards-website.pages.dev/api/news-staging-config'
const call = (url = preview, key = 'sb_publishable_fixture', method = 'GET') => onRequest({
  request: new Request(url, { method }),
  env: { STB_NEWS_STAGING_PUBLISHABLE_KEY: key },
})
const jwt = payload => `fixture.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.fixture`

test('preview exposes only the fixed staging target and public key without caching', async () => {
  const response = call()
  const body = await response.text()
  assert.match(body, /https:\/\/asrkcguvzscgtysnivsq\.supabase\.co/)
  assert.match(body, /sb_publishable_fixture/)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(response.headers.get('cross-origin-resource-policy'), 'same-origin')
})
test('production, project root and unrelated hosts never expose configuration', async () => {
  for (const host of ['www.styrian-bastards.at', 'styrian-bastards.at', 'styrian-bastards-website.pages.dev', 'evil.example', 'test.styrian-bastards-website.pages.dev.evil.example']) {
    assert.doesNotMatch(await call(`https://${host}/api/news-staging-config`).text(), /STB_V2_PRESS_STAGING_CONFIG|sb_publishable_fixture/)
  }
})
test('missing, privileged, malformed and wrong-project legacy keys are withheld', async () => {
  for (const key of ['', 'sb_secret_fixture', 'invalid', jwt({role:'service_role', ref:'asrkcguvzscgtysnivsq'}), jwt({role:'anon', ref:'other'})]) {
    assert.doesNotMatch(await call(preview, key).text(), /window\.STB_V2_PRESS_STAGING_CONFIG/)
  }
  assert.match(await call(preview, jwt({role:'anon',ref:'asrkcguvzscgtysnivsq'})).text(), /window\.STB_V2_PRESS_STAGING_CONFIG/)
})
test('HEAD has no body and writes are rejected', async () => {
  assert.equal(await call(preview, 'sb_publishable_fixture', 'HEAD').text(), '')
  assert.equal(call(preview, 'sb_publishable_fixture', 'POST').status, 405)
})

test('returned JavaScript exposes a safe DOM status and only configures a ready preview', async () => {
  const { runInNewContext } = await import('node:vm')
  for (const [key, expected] of [['sb_publishable_fixture', 'ready'], ['', 'missing-or-invalid-preview-key']]) {
    const sandbox = { document: { documentElement: { dataset: {} } }, window: {} }
    runInNewContext(await call(preview, key).text(), sandbox)
    assert.equal(sandbox.document.documentElement.dataset.newsStagingConfigStatus, expected)
    assert.equal(Boolean(sandbox.window.STB_V2_PRESS_STAGING_CONFIG), expected === 'ready')
  }
})
