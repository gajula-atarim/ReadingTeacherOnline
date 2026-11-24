const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
const ROOT=process.argv[2], OUT=process.argv[3], F=process.env.FONTDIR, O='https://readingteacheronline.wsdfy.com';
(async()=>{ const b=await chromium.launch(); const p=await b.newPage();
 await p.route('**/*', r=>{const u=r.request().url();
  if(u.startsWith('https://fonts.googleapis.com/css') && u.includes('Nunito')) return r.fulfill({contentType:'text/css', body:[400,600,700,800].map(x=>`@font-face{font-family:'Nunito';font-weight:${x};src:url(https://fonts.gstatic.com/nunito-${x}.woff2)}`).join('')});
  if(u.startsWith('https://fonts.gstatic.com/nunito-')) return r.fulfill({path:`${F}/nunito-latin-${u.match(/nunito-(\d+)/)[1]}-normal.woff2`});
  if(!u.startsWith(O)) return r.abort(); const q=decodeURIComponent(new URL(u).pathname);
  if(q==='/') return r.fulfill({path:path.join(ROOT,'index.html'),contentType:'text/html'});
  if(/\.(webp|jpe?g|png)$/.test(q)) return r.fulfill({path:path.join(ROOT,'placeholder.jpg')});
  if(q.startsWith('/wp-json/')) return r.fulfill({status:200,body:'{}',contentType:'application/json'});
  const f=path.join(ROOT,'site',q); return fs.existsSync(f)?r.fulfill({path:f,contentType:q.endsWith('.css')?'text/css':'application/javascript'}):r.fulfill({status:404,body:''});});
 for (const w of [1024,820,768,744,712,700,690,680,679,640,600,430,390]) { await p.setViewportSize({width:w,height:900}); await p.goto(O+'/'); await p.waitForTimeout(700);
  const m=await p.evaluate(()=>{const vis=e=>{if(!e)return false;const r=e.getBoundingClientRect();return r.width>2&&getComputedStyle(e).display!=='none'};
   const items=[document.querySelector('.rto-tb-email .rto-tb-text'),document.querySelector('.rto-tb-loc'),document.querySelector('.rto-topbar .elementor-heading-title')];
   const tops=items.filter(vis).map(e=>Math.round(e.getBoundingClientRect().top));
   return {email:vis(items[0]),loc:vis(items[1]),tips:vis(items[2]),lines:new Set(tops).size,h:Math.round(document.querySelector('.rto-topbar').getBoundingClientRect().height),ovf:document.documentElement.scrollWidth-innerWidth}});
  console.log(String(w).padStart(5),`| email text ${m.email?'shown':'hidden'}, location ${m.loc?'shown':'hidden'}, tips ${m.tips?'shown':'hidden'} | lines ${m.lines} | bar ${m.h}px | overflow ${m.ovf}`);
  if ([744,640].includes(w)) await p.screenshot({path:`${OUT}/tb_${w}.png`,clip:{x:0,y:0,width:w,height:90}}); }
 await b.close(); })();
