import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import {readFileSync} from 'node:fs'

const source = readFileSync(new URL('../presse.js', import.meta.url), 'utf8')
class Node {
  constructor(tag){ this.tag=tag;this.children=[];this.textContent='';this.classList={add(){}} }
  appendChild(n){this.children.push(n);return n}
  remove(){}
  set innerHTML(v){this.children=[]}
}
const textOf=n=>n.textContent+' '+n.children.map(textOf).join(' ')
const linksOf=n=>[...(n.href?[n.href]:[]),...n.children.flatMap(linksOf)]
const news={id:'123',slug:'test-neu',title:'STAGING-TEST News',teaser:'Kurz',body:'<script>unsafe</script>',published_at:'2026-10-27T12:00:00Z',cover_media_id:'11111111-1111-4111-8111-111111111111'}
const press={id:'321',slug:'presse-alt',title:'V2 Presse',teaser:'Alt',content_html:'Inhalt',published_at:'2026-10-26T12:00:00Z'}
const legacy={id:'abc',slug:'v1-alt',title:'V1 Beitrag',summary:'V1',publication_date:'2026-10-25'}
async function render({url='https://preview.example/presse.html?v2preview=1',fail=[],emptyDetail=false,noStaging=false}={}) {
 const loc=new URL(url), root=new Node('root'), calls=[]
 const mockFetch=async (url,options)=>{calls.push(String(url)); const name=String(url).split('/').at(-1)
  if(fail.includes(name)) throw Error('simulated outage')
  let data=name==='get_public_media_items'?[legacy]:name==='get_public_press'?[press]:name==='news_public_feed_v2'?[news]:name==='news_public_item'?(emptyDetail?[]:[news]):[]
  return {ok:true,json:async()=>data}
 }
 const context={window:{location:loc,STB_V2_PRESS_ENABLED:true,STB_V2_SHOP_PUBLISHABLE_KEY:'public-test-key',STB_V2_PRESS_STAGING_CONFIG:noStaging?undefined:{url:'https://asrkcguvzscgtysnivsq.supabase.co',key:'staging-test-key'}},document:{getElementById:()=>root,createElement:t=>new Node(t),createTextNode:t=>{const n=new Node('#text');n.textContent=t;return n}},fetch:mockFetch,URLSearchParams,Intl,Date,console:{warn(){}}}
 vm.runInNewContext(source,context)
 for(let i=0;i<12;i++)await new Promise(resolve=>setImmediate(resolve))
 return {root,calls}
}
test('all three sources show and the news link retains its source and preview',async()=>{
 const {root,calls}=await render()
 assert.match(textOf(root),/V1 Beitrag/);assert.match(textOf(root),/V2 Presse/);assert.match(textOf(root),/STAGING-TEST News/)
 assert.ok(linksOf(root).some(h=>h.includes('source=v2-news')&&h.includes('v2preview=1')))
 assert.ok(calls.some(c=>c.includes('asrkcguvzscgtysnivsq.supabase.co/rest/v1/rpc/news_public_feed_v2')))
})
test('news failure does not suppress V1 or V2 press',async()=>{
 const {root}=await render({fail:['news_public_feed_v2']})
 assert.match(textOf(root),/V1 Beitrag/);assert.match(textOf(root),/V2 Presse/)
})
test('press failure does not suppress V1 or V2 news',async()=>{
 const {root}=await render({fail:['get_public_press']})
 assert.match(textOf(root),/V1 Beitrag/);assert.match(textOf(root),/STAGING-TEST News/)
})
test('news detail uses safe text nodes and image is linked to publication gateway',async()=>{
 const {root,calls}=await render({url:'https://preview.example/presse.html?source=v2-news&slug=test-neu&v2preview=1'})
 assert.match(textOf(root),/<script>unsafe<\/script>/);assert.ok(calls.some(c=>c.endsWith('/news_public_item')))
 const img=(function walk(n){return n.tag==='img'?n:n.children.map(walk).find(Boolean)})(root)
 assert.match(img.src,/news-public-image\?id=/)
})
test('archived or missing news detail renders not found',async()=>{
 const {root}=await render({url:'https://preview.example/presse.html?source=v2-news&slug=test-neu&v2preview=1',emptyDetail:true})
 assert.match(textOf(root),/Nicht gefunden/)
})
test('production host ignores staging override',async()=>{
 const {calls}=await render({url:'https://www.styrian-bastards.at/presse.html?v2preview=1'})
 assert.ok(calls.some(c=>c.includes('yktioliukcrrccrfwxad.supabase.co/rest/v1/rpc/news_public_feed_v2')))
 assert.ok(!calls.some(c=>c.includes('asrkcguvzscgtysnivsq.supabase.co')))
})

test('staging preview without staging configuration never queries production',async()=>{
 const {root,calls}=await render({noStaging:true})
 assert.match(textOf(root),/V1 Beitrag/)
 assert.ok(!calls.some(c=>c.includes('yktioliukcrrccrfwxad.supabase.co')))
})

test('Pages preview stays on staging without query parameter',async()=>{
 const {root,calls}=await render({url:'https://test.styrian-bastards-website.pages.dev/presse'})
 assert.ok(calls.some(c=>c.includes('asrkcguvzscgtysnivsq.supabase.co')))
 assert.ok(!calls.some(c=>c.includes('yktioliukcrrccrfwxad.supabase.co')))
 assert.ok(linksOf(root).some(h=>h.includes('source=v2-news')&&h.includes('v2preview=1')))
})
test('detail and not-found back links preserve preview configuration',async()=>{
 for (const emptyDetail of [false,true]) {
  const {root}=await render({url:'https://test.styrian-bastards-website.pages.dev/presse?source=v2-news&slug=test-neu',emptyDetail})
  assert.ok(linksOf(root).includes('/presse.html?v2preview=1'))
 }
})
