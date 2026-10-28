import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
const source = await readFile(new URL('../functions/api/news-staging-config.js', import.meta.url), 'utf8')
const { onRequest } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))
const preview='https://codex-news-homepage-staging.styrian-bastards-website.pages.dev/api/news-staging-config'
const jwt=payload=>`fixture.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.fixture`
const call=value=>onRequest({request:new Request(preview),env:{STB_NEWS_STAGING_PUBLISHABLE_KEY:value}},async()=>new Response(null,{status:503}))
test('safe diagnostics retain exact rejection causes and never return rejected values',async()=>{
 const cases=[[undefined,'binding-not-available'],[123,'binding-is-not-text'],['','binding-is-empty'],['sb_secret_fixture','secret-key-rejected'],['malformed_fixture','invalid-key-format'],[jwt({role:'service_role',ref:'asrkcguvzscgtysnivsq'}),'non-public-role-rejected'],[jwt({role:'anon',ref:'other'}),'wrong-staging-project']]
 for(const [value,expected] of cases){const response=await call(value);const body=await response.text();assert.ok(body.includes(expected));assert.doesNotMatch(body,/window.STB_V2_PRESS_STAGING_CONFIG/);if(typeof value==='string'&&value)assert.ok(!body.includes(value))}
})
test('returned script executes and only configures validated ready binding',async()=>{
 for(const [value,ready] of [[jwt({role:'anon',ref:'asrkcguvzscgtysnivsq'}),true],['',false]]){
 const sandbox={document:{documentElement:{dataset:{}}},window:{}};runInNewContext(await (await call(value)).text(),sandbox)
 assert.equal(Boolean(sandbox.window.STB_V2_PRESS_STAGING_CONFIG),ready);assert.equal(sandbox.document.documentElement.dataset.newsStagingConfigStatus,ready?'ready':'binding-is-empty')
 }
})
