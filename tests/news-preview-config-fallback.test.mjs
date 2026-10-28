import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const source=await readFile(new URL('../functions/api/news-staging-config.js',import.meta.url),'utf8')
const {onRequest}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
const preview='https://codex-news-homepage-staging.styrian-bastards-website.pages.dev/api/news-staging-config'
const staging='https://asrkcguvzscgtysnivsq.supabase.co'
const key=payload=>`fixture.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.fixture`
const publicKey=key({role:'anon',ref:'asrkcguvzscgtysnivsq'})
const call=(env={},fetcher=async()=>new Response(null,{status:503}),url=preview,method='GET')=>onRequest({request:new Request(url,{method}),env},fetcher)
test('existing preview binding takes precedence without network access',async()=>{
 const response=await call({STB_NEWS_STAGING_PUBLISHABLE_KEY:publicKey},()=>{throw Error('unexpected network')});const body=await response.text()
 assert.match(body,/preview-binding/);assert.match(body,/ready/);assert.equal(response.headers.get('cache-control'),'no-store')
})
test('missing binding uses only the fixed public staging endpoint',async()=>{
 const calls=[];const response=await call({},async(url)=>{calls.push(url);return Response.json({url:staging,key:publicKey})});const body=await response.text()
 assert.deepEqual(calls,[staging+'/functions/v1/news-preview-config']);assert.match(body,/staging-endpoint/);assert.match(body,/window.STB_V2_PRESS_STAGING_CONFIG/)
})
test('foreign endpoint project or privileged key never configures preview',async()=>{
 for(const data of [{url:'https://yktioliukcrrccrfwxad.supabase.co',key:publicKey},{url:staging,key:'sb_secret_fixture'},{url:staging,key:key({role:'service_role',ref:'asrkcguvzscgtysnivsq'})}]){
  assert.doesNotMatch(await (await call({},async()=>Response.json(data))).text(),/window.STB_V2_PRESS_STAGING_CONFIG/)
 }
})
test('invalid existing binding is rejected rather than silently replaced',async()=>{
 const response=await call({STB_NEWS_STAGING_PUBLISHABLE_KEY:'sb_secret_fixture'},()=>{throw Error('unexpected network')})
 assert.match(await response.text(),/secret-key-rejected/)
})
test('production and unrelated hosts neither fetch nor expose staging config',async()=>{
 for(const host of ['styrian-bastards.at','www.styrian-bastards.at','styrian-bastards-website.pages.dev','evil.example']){
  const response=await call({},()=>{throw Error('unexpected network')},`https://${host}/api/news-staging-config`)
  assert.match(await response.text(),/unavailable-host/)
 }
})
test('missing source fails closed, HEAD empty and writes denied',async()=>{
 assert.match(await (await call()).text(),/binding-not-available/)
 assert.equal(await (await call({},undefined,preview,'HEAD')).text(),'')
 assert.equal((await call({},undefined,preview,'POST')).status,405)
})
