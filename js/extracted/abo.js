(() => {
  const params=new URLSearchParams(window.location.search);
  const productionHost=['www.styrian-bastards.at','styrian-bastards.at'].includes(window.location.hostname);
  const sandboxMode=!productionHost||params.get('stb_staging')==='1'||window.STB_ABO_SANDBOX?.enabled===true;
  const V2_URL=sandboxMode?'https://asrkcguvzscgtysnivsq.supabase.co':'https://yktioliukcrrccrfwxad.supabase.co';
  const V2_KEY=sandboxMode?'sb_publishable_26j21pToqdSBbSxpmYj1tg_o7w4Yz_b':(window.STB_V2_SHOP_PUBLISHABLE_KEY||'');
  const status=document.getElementById('abo-status'),card=document.getElementById('abo-card'),form=document.getElementById('abo-form'),quantity=document.getElementById('abo-quantity'),price=document.getElementById('abo-price'),availability=document.getElementById('abo-availability'),total=document.getElementById('abo-total'),errorBox=document.getElementById('abo-error'),submit=document.getElementById('abo-submit'),payButton=document.getElementById('abo-pay-sumup'),paymentStatus=document.getElementById('abo-payment-status');
  let campaign=null,currentOrderId=null,currentPaymentToken=null,currentOrderNumber=null,checkoutStarted=false,checkoutUrl=null;
  const storageKey='stb_sumup_return';
  const validCheckoutUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='checkout.sumup.com'&&!u.username&&!u.password}catch{return false}};
  const saveOrder=()=>sessionStorage.setItem(storageKey,JSON.stringify({checkoutId:null,orderId:currentOrderId,paymentToken:currentPaymentToken,orderNumber:currentOrderNumber,sandboxMode,checkoutStarted,checkoutUrl}));
  function restoreOrder(){
    let saved=null;try{saved=JSON.parse(sessionStorage.getItem(storageKey)||'null')}catch{}
    if(!saved?.orderId||!saved?.paymentToken||Boolean(saved.sandboxMode)!==sandboxMode)return false;
    currentOrderId=saved.orderId;currentPaymentToken=saved.paymentToken;currentOrderNumber=saved.orderNumber;
    checkoutStarted=saved.checkoutStarted===true||Boolean(saved.checkoutId);checkoutUrl=validCheckoutUrl(saved.checkoutUrl)?saved.checkoutUrl:null;
    status.hidden=true;card.hidden=true;document.getElementById('abo-success').hidden=false;document.getElementById('abo-order-number').textContent=currentOrderNumber||'–';
    payButton.hidden=false;payButton.disabled=checkoutStarted&&!checkoutUrl;
    if(checkoutStarted){payButton.textContent=checkoutUrl?'Zahlung fortsetzen':'Zahlungsprüfung erforderlich';paymentStatus.hidden=false;paymentStatus.textContent=checkoutUrl?'Die bestehende SumUp-Zahlung kann fortgesetzt werden.':'Der Zahlungsaufruf wurde bereits begonnen. Bitte starte keine neue Zahlung und kontaktiere uns mit deiner Bestellnummer.'}
    return true;
  }
  const money=cents=>new Intl.NumberFormat('de-AT',{style:'currency',currency:'EUR'}).format(Number(cents||0)/100);
  const headers=()=>({'Content-Type':'application/json','Accept':'application/json','apikey':V2_KEY,'Authorization':'Bearer '+V2_KEY});
  async function rpc(name,body={}){if(!V2_KEY)throw new Error('Konfiguration der Bestellseite fehlt.');const response=await fetch(V2_URL+'/rest/v1/rpc/'+name,{method:'POST',headers:headers(),body:JSON.stringify(body)});const payload=await response.json().catch(()=>null);if(!response.ok){const error=new Error(payload?.message||payload?.error||'Anfrage fehlgeschlagen.');error.requestRejected=response.status>=400&&response.status<500;throw error}return payload}
  async function edge(name,body){if(!V2_KEY)throw new Error('Konfiguration der Zahlungsseite fehlt.');const response=await fetch(V2_URL+'/functions/v1/'+name,{method:'POST',headers:headers(),body:JSON.stringify(body)});const payload=await response.json().catch(()=>null);if(!response.ok)throw new Error(payload?.error||'Zahlungsdienst nicht verfügbar.');return payload}
  function syncTotal(){if(campaign)total.innerHTML='<span>Gesamt</span><strong>'+money(Number(quantity.value||1)*campaign.price_cents)+'</strong>'}
  async function load(){try{const rows=await rpc('get_public_abo_campaign');campaign=Array.isArray(rows)?rows[0]:null;if(campaign){campaign.price_cents=Number(campaign.price_cents);campaign.available_quantity=Number(campaign.available_quantity);campaign.max_quantity_per_order=Number(campaign.max_quantity_per_order);campaign.sales_open=campaign.sales_open===true||campaign.sales_open==='true';campaign.homepage_visible=campaign.homepage_visible===true||campaign.homepage_visible==='true'}status.hidden=true;if(!campaign||!campaign.homepage_visible){status.hidden=false;status.textContent='Das Saisonabo ist derzeit nicht verfügbar.';return}price.textContent=money(campaign.price_cents)+' pro Abo';availability.textContent=campaign.available_quantity>0?'Noch '+campaign.available_quantity+' aus dem Fanclub-Kontingent verfügbar.':'Kontingent derzeit ausgeschöpft.';if(!campaign.sales_open||campaign.available_quantity<1){status.hidden=false;status.textContent=campaign.available_quantity<1?'Das Fanclub-Kontingent ist derzeit ausgeschöpft.':'Der Abo-Verkauf ist derzeit nicht aktiv.';return}const max=Math.min(campaign.max_quantity_per_order,campaign.available_quantity);quantity.innerHTML='';for(let i=1;i<=max;i++){const option=document.createElement('option');option.value=String(i);option.textContent=String(i);quantity.appendChild(option)}quantity.value='1';card.hidden=false;syncTotal()}catch(e){status.textContent='Das Abo-Angebot konnte gerade nicht geladen werden. Bitte versuche es später erneut.'}}
  quantity.addEventListener('change',syncTotal);
  form.addEventListener('submit',async e=>{e.preventDefault();errorBox.hidden=true;if(submit.disabled||currentOrderId||!form.reportValidity()||!campaign)return;submit.disabled=true;submit.textContent='Bestellung wird gesendet …';let retryAllowed=true;try{const rows=await rpc('create_public_abo_ticket_order_with_payment_token',{p_campaign_id:campaign.id,p_first_name:document.getElementById('abo-first-name').value.trim(),p_last_name:document.getElementById('abo-last-name').value.trim(),p_email:document.getElementById('abo-email').value.trim(),p_phone:document.getElementById('abo-phone').value.trim()||null,p_quantity:Number(quantity.value),p_privacy_consent:document.getElementById('abo-consent').checked,p_privacy_consent_version:'v1'});const result=Array.isArray(rows)?rows[0]:rows;currentOrderId=result?.order_id||null;currentPaymentToken=result?.payment_token||null;currentOrderNumber=result?.order_number||null;if(currentOrderId&&currentPaymentToken){try{saveOrder()}catch{payButton.disabled=true;paymentStatus.hidden=false;paymentStatus.textContent='Die Bestellung wurde gespeichert. Die Onlinezahlung benötigt den Sitzungsspeicher; bitte kontaktiere uns mit deiner Bestellnummer.'}}card.hidden=true;document.getElementById('abo-success').hidden=false;document.getElementById('abo-order-number').textContent=result?.order_number||'–';payButton.hidden=!(currentOrderId&&currentPaymentToken);window.scrollTo({top:0,behavior:'smooth'})}catch(e){retryAllowed=e?.requestRejected===true;errorBox.textContent=!retryAllowed?'Bestellstatus unklar. Bitte sende keine zweite Bestellung und kontaktiere uns zur Prüfung.':String(e?.message||'').includes('abo_ticket_sales_not_active')?'Der Abo-Verkauf ist derzeit nicht aktiv.':'Bestellung konnte nicht angelegt werden. Bitte prüfe deine Angaben und versuche es erneut.';errorBox.hidden=false}finally{submit.disabled=!retryAllowed;submit.textContent=retryAllowed?'Abo verbindlich bestellen':'Bestellprüfung erforderlich'}});
  payButton.addEventListener('click',async()=>{
    if(!currentOrderId||!currentPaymentToken||payButton.disabled)return;
    if(checkoutStarted){if(checkoutUrl)window.location.assign(checkoutUrl);return}
    payButton.disabled=true;payButton.textContent='SumUp wird geöffnet …';paymentStatus.hidden=false;paymentStatus.textContent='Sichere Zahlung wird vorbereitet …';
    try{
      // Persist before the request; unknown outcomes must not create a second checkout.
      checkoutStarted=true;saveOrder();
      const returnUrl=new URL('/abo.html',window.location.origin);returnUrl.searchParams.set('payment_return','1');if(sandboxMode)returnUrl.searchParams.set('stb_staging','1');
      const result=await edge('sumup-abo-checkout-create',{orderId:currentOrderId,paymentToken:currentPaymentToken,returnUrl:returnUrl.toString()});
      if(!result?.checkoutId||!validCheckoutUrl(result.checkoutUrl))throw new Error('checkout_data_invalid');
      checkoutUrl=result.checkoutUrl;
      sessionStorage.setItem(storageKey,JSON.stringify({checkoutId:result.checkoutId,paymentToken:currentPaymentToken,orderId:currentOrderId,orderNumber:currentOrderNumber,sandboxMode,checkoutStarted:true,checkoutUrl}));
      window.location.assign(checkoutUrl);
    }catch{
      paymentStatus.textContent='Das Zahlungsergebnis ist noch unklar. Bitte starte keine neue Zahlung und kontaktiere uns mit deiner Bestellnummer. Deine Bestellung bleibt gespeichert.';
      payButton.textContent='Zahlungsprüfung erforderlich';
    }
  });
  async function handlePaymentReturn(){
    status.hidden=false;card.hidden=true;status.textContent='Zahlung wird sicher bei SumUp geprüft …';
    let saved=null;try{saved=JSON.parse(sessionStorage.getItem('stb_sumup_return')||'null')}catch{}
    if(!saved?.checkoutId||!saved?.paymentToken||Boolean(saved.sandboxMode)!==sandboxMode){status.textContent='Die Zahlung konnte in diesem Browser nicht automatisch zugeordnet werden. Bitte starte keine neue Zahlung und kontaktiere uns mit deiner Bestellnummer.';return}
    try{
      const result=await edge('sumup-payment-verify',{checkoutId:saved.checkoutId,paymentToken:saved.paymentToken});
      if(result?.status==='paid'){
        sessionStorage.removeItem('stb_sumup_return');status.hidden=true;document.getElementById('abo-success').hidden=false;document.getElementById('abo-order-number').textContent=saved.orderNumber||'–';document.getElementById('abo-payment-copy').textContent='Zahlung erfolgreich. Dein Saisonabo wurde als bezahlt verbucht.';payButton.hidden=true;paymentStatus.hidden=false;paymentStatus.textContent='SumUp-Zahlung erfolgreich bestätigt.';return
      }
      status.textContent='Die Zahlung ist bei SumUp noch nicht bestätigt. Bitte starte keine zweite Zahlung und versuche die Prüfung in Kürze erneut.'
    }catch(e){status.textContent='Die Zahlung konnte noch nicht bestätigt werden. Bitte starte keine zweite Zahlung. Deine Bestellung bleibt gespeichert.'}
  }
  const paymentReturn=params.get('payment_return')==='1';
  if(sandboxMode){const banner=document.createElement('div');banner.className='abo-status';banner.textContent='SANDBOX-TESTMODUS – keine echte Zahlung.';status.parentNode.insertBefore(banner,status);document.title='SANDBOX – '+document.title}
  fetch('/navbar.html').then(r=>r.text()).then(v=>document.getElementById('navbar').innerHTML=v).catch(()=>{});fetch('/footer.html').then(r=>r.text()).then(v=>document.getElementById('footer').innerHTML=v).catch(()=>{});if(paymentReturn)handlePaymentReturn();else if(!restoreOrder())load();
})();
