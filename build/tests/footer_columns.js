const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
const ROOT=process.argv[2], OUT=process.argv[3], F=process.env.FONTDIR, O='https://readingteacheronline.wsdfy.com';
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1024,height:900}});
 await p.route('**/*', r=>{const u=r.request().url();
  if(u.startsWith('https://fonts.googleapis.com/css') && u.includes('Nunito')) return r.fulfill({contentType:'text/css', body:[400,600,700,800].map(x=>`@font-face{font-family:'Nunito';font-weight:${x};src:url(https://fonts.gstatic.com/nunito-${x}.woff2)}`).join('')});
  if(u.startsWith('https://fonts.gstatic.com/nunito-')) return r.fulfill({path:`${F}/nunito-latin-${u.match(/nunito-(\d+)/)[1]}-normal.woff2`});
  if(!u.startsWith(O)) return r.abort(); const q=decodeURIComponent(new URL(u).pathname);
  if(q==='/') return r.fulfill({path:path.join(ROOT,'index.html'),contentType:'text/html'});
  if(/\.(webp|jpe?g|png)$/.test(q)) return r.fulfill({path:path.join(ROOT,'placeholder.jpg')});
  if(q.startsWith('/wp-json/')) return r.fulfill({status:200,body:'{}',contentType:'application/json'});
  const f=path.join(ROOT,'site',q); return fs.existsSync(f)?r.fulfill({path:f,contentType:q.endsWith('.css')?'text/css':'application/javascript'}):r.fulfill({status:404,body:''});});
 await p.goto(O+'/'); await p.waitForTimeout(800);
 for (const w of (process.argv[4]||'1440,1366,1280,1100,1024,1000,900,834,820,800,768,700,600,430,390,360').split(',').map(Number)) {
  await p.setViewportSize({width:w,height:900}); await p.waitForTimeout(250);
  const m=await p.evaluate(()=>{const g=document.querySelector('.rto-footer-inner'); const cols=[...g.children].map(c=>{const r=c.getBoundingClientRect();return {t:Math.round(r.top),l:Math.round(r.left),w:Math.round(r.width)}});
   const rows=new Set(cols.map(c=>c.t)).size; const f=document.querySelector('form.rto-newsletter .rto-newsletter-row'); const fr=f.getBoundingClientRect(); const btn=f.querySelector('.wpcf7-submit').getBoundingClientRect(); const inp=f.querySelector('input[type=email]').getBoundingClientRect();
   const lw=[...document.querySelectorAll('.rto-footer-links .elementor-icon-list-text')].map(e=>e.scrollWidth>e.clientWidth+1).some(Boolean);
   return {rows, widths:cols.map(c=>c.w), formW:Math.round(fr.width), inputW:Math.round(inp.width), btnInside: btn.right<=fr.right+0.5 && Math.abs(btn.top-inp.top)<20, linkOverflow:lw}});
  console.log(String(w).padStart(5), '| rows', m.rows, '| col widths', m.widths.join('/'), '| newsletter form', m.formW, 'input', m.inputW, m.btnInside?'(button inline)':'(BUTTON WRAPPED)', m.linkOverflow?'| LINK TEXT OVERFLOW':'');
  if (OUT && [1024,834,768].includes(w)) { const g=await p.$('.rto-footer'); await g.scrollIntoViewIfNeeded(); await g.screenshot({path:`${OUT}/foot_${w}.png`}); }
 }
 await b.close(); })();
