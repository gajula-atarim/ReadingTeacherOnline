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
 for (const w of [1440,1100,1099,1024,912,834,820,800,768,767,600,390]) {
  await p.setViewportSize({width:w,height:900}); await p.waitForTimeout(250);
  const m=await p.evaluate(()=>{const cards=[...document.querySelectorAll('.rto-post')].map(c=>c.getBoundingClientRect());
   const more=[...document.querySelectorAll('.rto-post > .elementor-widget:last-child')].map(e=>Math.round(e.getBoundingClientRect().top));
   const t=[...document.querySelectorAll('.rto-post .rto-post-title .elementor-heading-title')].map(e=>getComputedStyle(e).fontSize);
   return {rows:new Set(cards.map(c=>Math.round(c.top))).size, w:cards.map(c=>Math.round(c.width)), readMoreAligned:new Set(more).size===1, title:t[0], ovf:document.documentElement.scrollWidth-innerWidth}});
  console.log(String(w).padStart(5),'| rows',m.rows,'| card widths',m.w.join('/'),'| title',m.title,'| Read More aligned',m.readMoreAligned,'| overflow',m.ovf);
  if (OUT && [1024,768].includes(w)) { const s=await p.$('.rto-media'); await s.scrollIntoViewIfNeeded(); await p.waitForTimeout(1500); await s.screenshot({path:`${OUT}/media_${w}.png`}); }
 }
 await b.close(); })();
