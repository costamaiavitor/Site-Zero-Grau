/* casos de uso: spec = {w,h,titulo,limite:[x,y,w,h,rotulo], atores:[[id,x,y,nome]], sistemas:[[id,x,y,nome]], ucs:[[id,x,y,texto,destaque]], lig:[[a,b,tipo]]} */
function desenhaUC(s){
  const cv=document.getElementById('cv');cv.style.width=s.w+'px';cv.style.height=s.h+'px';
  const [bx,by,bw,bh,bl]=s.limite;
  cv.insertAdjacentHTML('beforeend',`<div style="position:absolute;left:${bx}px;top:${by}px;width:${bw}px;height:${bh}px;border:2.5px solid #1B1B3A;border-radius:6px;background:#FAFAFD"></div><div style="position:absolute;left:${bx+14}px;top:${by+8}px;font:800 15px Gabarito,Arial;letter-spacing:.06em;text-transform:uppercase;color:#1B1B3A">${bl}</div>`);
  for(const [id,x,y,t,d] of s.ucs) cv.insertAdjacentHTML('beforeend',`<div id="${id}" class="uc${d?' d':''}" style="left:${x-125}px;top:${y-32}px">${t}</div>`);
  for(const [id,x,y,n] of s.atores) cv.insertAdjacentHTML('beforeend',`<div id="${id}" class="ator" style="left:${x-60}px;top:${y-55}px"><svg width="120" height="80" viewBox="0 0 120 80"><circle cx="60" cy="12" r="10" fill="none" stroke="#1B1B3A" stroke-width="2.5"/><line x1="60" y1="22" x2="60" y2="50" stroke="#1B1B3A" stroke-width="2.5"/><line x1="40" y1="32" x2="80" y2="32" stroke="#1B1B3A" stroke-width="2.5"/><line x1="60" y1="50" x2="44" y2="74" stroke="#1B1B3A" stroke-width="2.5"/><line x1="60" y1="50" x2="76" y2="74" stroke="#1B1B3A" stroke-width="2.5"/></svg><b>${n}</b></div>`);
  for(const [id,x,y,n] of (s.sistemas||[])) cv.insertAdjacentHTML('beforeend',`<div id="${id}" class="sis" style="left:${x-80}px;top:${y-36}px"><i>«sistema externo»</i>${n}</div>`);
  Promise.all(['400 14px Manrope','600 14px Manrope','800 14px Manrope','900 17px Gabarito','800 15px Gabarito'].map(f=>document.fonts.load(f))).then(()=>new Promise(r=>setTimeout(r,300))).then(()=>requestAnimationFrame(()=>{
    for(const [a,b,t] of s.lig){
      if(t==='a') liga(a,b,{});
      else if(t==='i') liga(a,b,{tr:1,seta:'v',txt:'«include»',cor:'#C2185B'});
      else if(t==='e') liga(a,b,{tr:1,seta:'v',txt:'«extend»',cor:'#00897B',cls:'ext'});
      else if(t==='g') liga(a,b,{seta:'tri'});
    }
    document.body.dataset.pronto=1;
  }));
}
