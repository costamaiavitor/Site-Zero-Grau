/* mini-renderizador de diagramas: caixas em HTML, ligações em SVG */
const NS='http://www.w3.org/2000/svg';
function svgEl(t,a,p){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);(p||document.getElementById('lig')).appendChild(e);return e;}
function R(id){const c=document.getElementById('cv').getBoundingClientRect(),r=document.getElementById(id).getBoundingClientRect();
  return {x:r.left-c.left,y:r.top-c.top,w:r.width,h:r.height,cx:r.left-c.left+r.width/2,cy:r.top-c.top+r.height/2,el:document.getElementById(id)};}
/* ponto na borda (elipse ou retângulo) na direção de (tx,ty) */
function borda(b,tx,ty){const dx=tx-b.cx,dy=ty-b.cy;
  if(b.el.classList.contains('uc')){const a=b.w/2,bb=b.h/2,t=1/Math.sqrt(dx*dx/(a*a)+dy*dy/(bb*bb));return [b.cx+dx*t,b.cy+dy*t];}
  const sx=Math.abs(dx)>0?(b.w/2)/Math.abs(dx):1e9, sy=Math.abs(dy)>0?(b.h/2)/Math.abs(dy):1e9, t=Math.min(sx,sy);return [b.cx+dx*t,b.cy+dy*t];}
function pontos(a,b,ortho){
  const A=R(a),B=R(b);
  if(ortho){
    const oy=[Math.max(A.y,B.y),Math.min(A.y+A.h,B.y+B.h)], ox=[Math.max(A.x,B.x),Math.min(A.x+A.w,B.x+B.w)];
    if(oy[1]-oy[0]>20 && (A.x+A.w<B.x||B.x+B.w<A.x)){const y=(oy[0]+oy[1])/2;
      return A.x<B.x?[[A.x+A.w,y],[B.x,y]]:[[A.x,y],[B.x+B.w,y]];}
    if(ox[1]-ox[0]>20){const x=(ox[0]+ox[1])/2;return A.y<B.y?[[x,A.y+A.h],[x,B.y]]:[[x,A.y],[x,B.y+B.h]];}
  }
  return [borda(A,B.cx,B.cy),borda(B,A.cx,A.cy)];
}
function seta(p1,p2,cor,aberta){const [x1,y1]=p1,[x2,y2]=p2,an=Math.atan2(y2-y1,x2-x1),L=14,W=7;
  const pts=[[x2,y2],[x2-L*Math.cos(an)+W*Math.sin(an),y2-L*Math.sin(an)-W*Math.cos(an)],[x2-L*Math.cos(an)-W*Math.sin(an),y2-L*Math.sin(an)+W*Math.cos(an)]];
  if(aberta==='tri') svgEl('polygon',{points:pts.map(p=>p.join(',')).join(' '),fill:'#fff',stroke:cor,'stroke-width':2});
  else svgEl('polyline',{points:[pts[1],pts[0],pts[2]].map(p=>p.join(',')).join(' '),fill:'none',stroke:cor,'stroke-width':2});}
function rotulo(x,y,t,cls){const d=document.createElement('div');d.className='rot '+(cls||'');d.textContent=t;d.style.left=x+'px';d.style.top=y+'px';document.getElementById('cv').appendChild(d);}
function liga(a,b,o={}){const [p1,p2]=pontos(a,b,o.ortho);const cor=o.cor||'#1B1B3A';
  svgEl('line',{x1:p1[0],y1:p1[1],x2:p2[0],y2:p2[1],stroke:cor,'stroke-width':o.w||2,'stroke-dasharray':o.tr?'8 6':''});
  if(o.seta) seta(p1,p2,cor,o.seta);
  if(o.seta2) seta(p2,p1,cor,o.seta2);
  if(o.txt){rotulo((p1[0]+p2[0])/2,(p1[1]+p2[1])/2,o.txt,o.cls);}
  if(o.c1){const k=o.k||28,d=Math.hypot(p2[0]-p1[0],p2[1]-p1[1]),ux=(p2[0]-p1[0])/d,uy=(p2[1]-p1[1])/d;
    let px=-uy,py=ux;if(px<-.01||(Math.abs(px)<=.01&&py<0)){px=-px;py=-py;}const ox=px*24,oy=py*18;rotulo(p1[0]+ux*k+ox,p1[1]+uy*k+oy,o.c1,'card');rotulo(p2[0]-ux*k+ox,p2[1]-uy*k+oy,o.c2,'card');}
}
