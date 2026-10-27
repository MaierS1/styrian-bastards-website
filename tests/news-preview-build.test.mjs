import test from 'node:test'
import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
const build=readFileSync(new URL('../scripts/build.js',import.meta.url),'utf8')
const jwt=role=>'eyJhbGciOiJub25lIn0.'+Buffer.from(JSON.stringify({role,ref:'asrkcguvzscgtysnivsq'})).toString('base64url')+'.signature'
function check(env) {
 const dir=mkdtempSync(join(tmpdir(),'news-build-')); mkdirSync(join(dir,'scripts'))
 writeFileSync(join(dir,'scripts','build.js'),build);writeFileSync(join(dir,'news-staging-config.js'),'// empty\n')
 const result=spawnSync(process.execPath,[join(dir,'scripts','build.js')],{env:{...process.env,...env},encoding:'utf8'})
 const contents=readFileSync(join(dir,'dist','news-staging-config.js'),'utf8')
 rmSync(dir,{recursive:true,force:true})
 return {status:result.status,contents,stderr:result.stderr}
}
const preview={CF_PAGES:'1',CF_PAGES_BRANCH:'codex/news-homepage-staging-20261027'}
test('only designated preview emits staging public config',()=>{
 const r=check({...preview,STB_NEWS_STAGING_PUBLISHABLE_KEY:jwt('anon')})
 assert.equal(r.status,0);assert.match(r.contents,/asrkcguvzscgtysnivsq/);assert.match(r.contents,/STB_V2_PRESS_STAGING_CONFIG/)
})
test('other branches and production do not embed staging configuration',()=>{
 for(const branch of ['main','another-preview']) {
 const r=check({...preview,CF_PAGES_BRANCH:branch,STB_NEWS_STAGING_PUBLISHABLE_KEY:jwt('anon')})
 assert.equal(r.status,0);assert.doesNotMatch(r.contents,/asrkcguvzscgtysnivsq/)
 }
})
test('privileged or wrong-project legacy keys fail build',()=>{
 for(const key of [jwt('service_role'),'invalid-token','eyJhbGciOiJub25lIn0.'+Buffer.from(JSON.stringify({role:'anon',ref:'wrong-project'})).toString('base64url')+'.signature']) {
 const r=check({...preview,STB_NEWS_STAGING_PUBLISHABLE_KEY:key})
 assert.notEqual(r.status,0);assert.doesNotMatch(r.stderr,new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')))
 }
})
test('missing preview key leaves the config empty',()=>{
 const r=check({...preview,STB_NEWS_STAGING_PUBLISHABLE_KEY:''})
 assert.equal(r.status,0);assert.doesNotMatch(r.contents,/asrkcguvzscgtysnivsq/)
})
