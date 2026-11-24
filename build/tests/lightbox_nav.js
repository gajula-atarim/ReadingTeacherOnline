const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
const ROOT=process.argv[2], OUT=process.argv[3], O='https://readingteacheronline.wsdfy.com';
(async()=>{ const b=await chromium.launch(); const res=[];
 for (const [w,h,mob] of [[1440,900,false],[768,1024,true],[390,844,true]]) {
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob}); const p=await ctx.newPage();
  await p.route('**/*', r=>{const u=r.request().url(); if(!u.startsWith(O)) return r.abort(); const q=decodeURIComponent(new URL(u).pathname);
   if(q==='/') return r.fulfill({path:path.join(ROOT,'index.html'),contentType:'text/html'});
   if(/\.(webp|jpe?g|png)$/.test(q)) return r.fulfill({path:path.join(ROOT,'placeholder.jpg')});
   if(q.startsWith('/wp-json/')) return r.fulfill({status:200,body:'{}',contentType:'application/json'});
   const f=path.join(ROOT,'site',q); return fs.existsSync(f)?r.fulfill({path:f,contentType:q.endsWith('.css')?'text/css':'application/javascript'}):r.fulfill({status:404,body:''});});
  await p.goto(O+'/'); await p.waitForTimeout(900);
  const a=p.locator('.rto-gallery .elementor-widget-image a').nth(0); await a.scrollIntoViewIfNeeded(); await a.click(); await p.waitForTimeout(2200);
  const counter=()=>p.evaluate(()=>document.querySelector('.elementor-lightbox .elementor-slideshow__counter').textContent.trim());
  const ic=await p.evaluate(()=>{const s=document.querySelector('.elementor-lightbox .elementor-swiper-button-next svg').getBoundingClientRect(); return {x:Math.round(s.left),y:Math.round(s.top),w:Math.round(s.width),onScreen:s.right<=innerWidth&&s.bottom<=innerHeight&&s.top>=0}});
  const c0=await counter(); await p.locator('.elementor-lightbox .elementor-swiper-button-next').click({force:true}); await p.waitForTimeout(900); const c1=await counter();
  await p.locator('.elementor-lightbox .elementor-swiper-button-next').click({force:true}); await p.waitForTimeout(900); const c2=await counter();
  await p.locator('.elementor-lightbox .elementor-swiper-button-prev').click({force:true}); await p.waitForTimeout(900); const c3=await counter();
  await p.locator('.elementor-lightbox .elementor-swiper-button-prev').click({force:true}); await p.waitForTimeout(900);
  await p.locator('.elementor-lightbox .elementor-swiper-button-prev').click({force:true}); await p.waitForTimeout(900); const c4=await counter();
  res.push(`${w}px: arrow icon ${ic.w}px at x=${ic.x},y=${ic.y} ${ic.onScreen?'on screen':'OFF SCREEN'} | start ${c0} → next ${c1} → next ${c2} → prev ${c3} → prev,prev ${c4}`);
  await p.locator('.elementor-lightbox .elementor-swiper-button-next').click({force:true}); await p.waitForTimeout(900);
  await p.screenshot({path:`${OUT}/lbnav_${w}.png`});
  if (w===390) { await p.keyboard.press('Escape'); await p.waitForTimeout(600); res.push('Esc closes lightbox: '+await p.evaluate(()=>{const m=document.querySelector('.elementor-lightbox'); return !m || getComputedStyle(m.closest('.dialog-widget')||m).display==='none'})); }
  await ctx.close(); }
 await b.close(); console.log(res.join('\n')); })();
