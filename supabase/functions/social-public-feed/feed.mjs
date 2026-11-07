export const PAGE='766538236534766',INSTAGRAM='17841476009175873';
export function publicPost(row,channel){
 const attachment=row.attachments?.data?.[0];
 if(channel==='facebook'&&!row.message&&/^(Dieser Inhalt ist (momentan|derzeit) nicht verfügbar|This content (isn.t|is not) available)/i.test(attachment?.title||''))return null;
 const raw=channel==='facebook'?(row.message||attachment?.title||attachment?.description||row.story):row.caption;
 const caption=String(raw||'').slice(0,10000);
 const date=channel==='facebook'?row.created_time:row.timestamp;
 const rawLink=channel==='facebook'?row.permalink_url:row.permalink;
 let link;try{link=new URL(rawLink);if(link.protocol!=='https:'||!(channel==='facebook'?['facebook.com','www.facebook.com','m.facebook.com'].includes(link.hostname):['instagram.com','www.instagram.com'].includes(link.hostname)))return null;}catch{return null;}
 if(!row.id||!Number.isFinite(Date.parse(date))||row.is_published===false||row.is_hidden===true)return null;
 return {id:channel+'_'+row.id,provider_id:String(row.id),channel,title:caption.split('\n').find(x=>x.trim())?.slice(0,120)||(channel==='facebook'?'Neues von Facebook':'Neues von Instagram'),summary:caption,published_at:date,permalink:link.href,media_type:row.media_type||'IMAGE',image_url:channel==='facebook'?(row.full_picture||attachment?.media?.image?.src||attachment?.subattachments?.data?.[0]?.media?.image?.src):(row.media_type==='VIDEO'?row.thumbnail_url:row.media_url)};
}
export function imageAllowed(value){try{const u=new URL(value);return u.protocol==='https:'&&['fbcdn.net','cdninstagram.com','fbsbx.com'].some(d=>u.hostname.endsWith('.'+d)||u.hostname===d)}catch{return false}}
