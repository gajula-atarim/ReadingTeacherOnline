const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
const ROOT=process.argv[2], O='https://readingteacheronline.wsdfy.com';
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1024,height:800}});
 const F=process.env.FONTDIR; await p.route('**/*', r=>{const u=r.request().url();
  if(u.startsWith('https://fonts.googleapis.com/css') && u.includes('Nunito')) return r.fulfill({contentType:'text/css', body:[400,600,700,800].map(w=>`@font-face{font-family:'Nunito';font-style:normal;font-weight:${w};font-display:swap;src:url(https://fonts.gstatic.com/nunito-${w}.woff2) format('woff2')}`).join('')});
  if(u.startsWith('https://fonts.gstatic.com/nunito-')) { const w=u.match(/nunito-(\d+)/)[1]; return r.fulfill({path:`${F}/nunito-latin-${w}-normal.woff2`, contentType:'font/woff2'}); }
  if(!u.startsWith(O)) return r.abort(); const q=decodeURIComponent(new URL(u).pathname);
  if(q==='/') return r.fulfill({path:path.join(ROOT,'index.html'),contentType:'text/html'});
  if(/\.(webp|jpe?g|png)$/.test(q)) return r.fulfill({path:path.join(ROOT,'placeholder.jpg')});
  if(q.startsWith('/wp-json/')) return r.fulfill({status:200,body:'{}',contentType:'application/json'});
  const f=path.join(ROOT,'site',q); return fs.existsSync(f)?r.fulfill({path:f,contentType:q.endsWith('.css')?'text/css':'application/javascript'}):r.fulfill({status:404,body:''});});
 await p.goto(O+'/'); await p.waitForTimeout(600); console.log('Nunito loaded:', await p.evaluate(()=>document.fonts.check('800 16px Nunito')));
 for (const w of (process.argv[3]||'1366,1280,1180,1100,1099,1024,980,900,834,820,800,768,767,700,600,430,390,360').split(',').map(Number)) {
  await p.setViewportSize({width:w,height:800}); await p.waitForTimeout(250);
  const m=await p.evaluate(()=>{const r=s=>{const e=document.querySelector(s);if(!e)return null;const b=e.getBoundingClientRect();return b.width?{t:Math.round(b.top),l:Math.round(b.left),w:Math.round(b.width),h:Math.round(b.height)}:'hidden'};
   const lis=[...document.querySelectorAll('.rto-nav li.menu-item')].map(li=>Math.round(li.getBoundingClientRect().top));
   const nav=document.querySelector('.rto-nav'); const lastA=[...document.querySelectorAll('.rto-nav li.menu-item > a')].pop().getBoundingClientRect(); return {right:Math.round(lastA.right), fs:getComputedStyle(document.querySelector('.rto-nav li.menu-item > a')).fontSize, ovf: document.documentElement.scrollWidth-innerWidth, brand:r('.rto-brand'),nav:r('.rto-nav'),cta:r('.rto-header-cta'),word:r('.rto-wordmark'),bar:r('.rto-mainbar'),navRows:new Set(lis).size}});
  const sameRow = m.brand && m.nav && Math.abs(m.brand.t - m.nav.t) < 30;
  console.log(String(w).padStart(5), 'mainbar h=',m.bar.h, '| nav beside logo:', sameRow?'yes':'NO ', '| menu rows:', m.navRows, '| wordmark:', m.word==='hidden'?'hidden':'shown', '| CTA:', m.cta==='hidden'?'hidden':'shown', '| font', m.fs, '| last link right edge', m.right, '/', w, '| page overflow', m.ovf);
  if (process.argv[4]) await p.screenshot({path:`${process.argv[4]}/hdr_${w}.png`,clip:{x:0,y:0,width:w,height:180}});
 }
 await b.close();})();
