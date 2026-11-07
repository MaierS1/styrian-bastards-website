import {PAGE,INSTAGRAM,publicPost,imageAllowed} from './feed.mjs';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, HEAD, OPTIONS','X-Content-Type-Options':'nosniff'};
const encoder=new TextEncoder();
const unhex=(s:string)=>Uint8Array.from(s.match(/../g)||[],x=>parseInt(x,16));
async function decrypt(envelope:string,secret:string,userId:string){const [version,iv,data]=envelope.split('.');if(version!=='v1'||!/^[a-f0-9]{24}$/.test(iv)||!/^[a-f0-9]+$/.test(data)||data.length%2)throw Error('authorization');const material=await crypto.subtle.importKey('raw',encoder.encode(secret),'HKDF',false,['deriveKey']);const key=await crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:encoder.encode('1010091565442873'),info:encoder.encode('stb-news-meta-connect-v1')},material,{name:'AES-GCM',length:256},false,['decrypt']);return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unhex(iv),additionalData:encoder.encode(userId)},key,unhex(data)));}
async function db(path:string){const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';const r=await fetch(Deno.env.get('SUPABASE_URL')+'/rest/v1/'+path,{headers:{apikey:key,Authorization:'Bearer '+key},signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('database');return r.json();}
async function graph(path:string,fields:string,token:string,limit?:number){const version=Deno.env.get('STB_META_GRAPH_VERSION')||'';if(!/^v\d+\.0$/.test(version))throw Error('configuration');const u=new URL('https://graph.facebook.com/'+version+'/'+path);u.searchParams.set('fields',fields);if(limit)u.searchParams.set('limit',String(limit));const r=await fetch(u,{method:'GET',redirect:'error',headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('provider');return r.json();}
type Feed={items:any[];channels:Record<string,string>;refreshed_at:string};
let snapshot:Feed|null=null,expires=0,pending:Promise<Feed>|null=null;
async function readFeed():Promise<Feed>{if(snapshot&&Date.now()<expires)return snapshot;if(pending)return pending;pending=(async()=>{
 const auth=await db('news_meta_authorizations?select=user_id,token_ciphertext,expires_at&page_id=eq.'+PAGE+'&instagram_id=eq.'+INSTAGRAM+'&connection_status=eq.healthy&order=updated_at.desc&limit=1');
 const a=auth?.[0];if(!a||Date.parse(a.expires_at)<=Date.now())throw Error('authorization');
 const userToken=await decrypt(a.token_ciphertext,Deno.env.get('STB_META_APP_SECRET')||'',a.user_id);
 const page=await graph(PAGE,'id,access_token,instagram_business_account',userToken);
 if(page.id!==PAGE||page.instagram_business_account?.id!==INSTAGRAM||!page.access_token)throw Error('assets');
 const results=await Promise.allSettled([graph(PAGE+'/published_posts','id,message,story,created_time,permalink_url,full_picture,is_published,is_hidden,attachments{title,description,media,subattachments}',page.access_token,6),graph(INSTAGRAM+'/media','id,caption,media_type,media_url,thumbnail_url,permalink,timestamp',page.access_token,6)]);
 // Archived V2 test publications must not reappear via the provider feed.
 const archived=await db('news_publications?select=provider_post_id,news_posts!inner(status)&news_posts.status=eq.archived&provider_post_id=not.is.null&limit=100');
 const blocked=new Set(archived.map((x:any)=>x.provider_post_id));
 const items:any[]=[],channels:Record<string,string>={};
 for(let i=0;i<2;i++){const channel=i===0?'facebook':'instagram',r=results[i];channels[channel]=r.status==='fulfilled'?'ok':'unavailable';if(r.status!=='fulfilled')continue;for(const row of r.value.data||[]){if(blocked.has(row.id))continue;const p=publicPost(row,channel);if(p)items.push(p);}}
 if(Object.values(channels).every(x=>x==='unavailable'))throw Error('provider');
 items.sort((a,b)=>Date.parse(b.published_at)-Date.parse(a.published_at));
 const value={items,channels,refreshed_at:new Date().toISOString()};snapshot=value;expires=Date.now()+300000;return value;
 })();try{return await pending;}finally{pending=null;}}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(!['GET','HEAD'].includes(req.method))return new Response('Method not allowed',{status:405,headers:{...cors,Allow:'GET, HEAD, OPTIONS'}});
 try{const feed=await readFeed(),url=new URL(req.url),imageId=url.searchParams.get('image');
 if(imageId){const item=feed.items.find(x=>x.id===imageId);if(!item||!imageAllowed(item.image_url))return new Response('Not found',{status:404,headers:cors});const response=await fetch(item.image_url,{redirect:'error',signal:AbortSignal.timeout(15000)});const type=response.headers.get('Content-Type')||'';if(!response.ok||!/^image\/(jpeg|png|webp|gif|avif)(;|$)/i.test(type)||Number(response.headers.get('Content-Length'))>10000000)throw Error('image');const data=await response.arrayBuffer();if(data.byteLength>10000000)throw Error('image');return new Response(req.method==='HEAD'?null:data,{headers:{...cors,'Content-Type':type,'Cache-Control':'public, max-age=300'}});}
 const items=feed.items.map(({image_url,provider_id,...p})=>({...p,image:imageAllowed(image_url)?Deno.env.get('SUPABASE_URL')+'/functions/v1/social-public-feed?image='+encodeURIComponent(p.id):null}));
 return new Response(req.method==='HEAD'?null:JSON.stringify({...feed,items}),{headers:{...cors,'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=300'}});
 }catch{return new Response(JSON.stringify({code:'social_feed_unavailable'}),{status:503,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store','Retry-After':'300'}});}
});
