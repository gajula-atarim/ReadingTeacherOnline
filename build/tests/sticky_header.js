const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
const ROOT=process.argv[2], OUT=process.argv[3], F=process.env.FONTDIR, O='https://readingteacheronline.wsdfy.com';
const res=[]; const ok=(n,p,d='')=>res.push((p?'PASS ':'FAIL ')+n+(d?'  '+d:''));
(async()=>{ const b=await chromium.launch();
 for (const w of [1440,1024,820,768,767,390]) {
  const mob=w<768; const ctx=await b.newContext({viewport:{width:w,height:mob?844:900},hasTouch:mob,isMobile:mob}); const p=await ctx.newPage();
  await p.route('**/*', r=>{const u=r.request().url();
   if(u.startsWith('https://fonts.googleapis.com/css') && u.includes('Nunito')) return r.fulfill({contentType:'text/css', body:[400,600,700,800].map(x=>`@font-face{font-family:'Nunito';font-weight:${x};src:url(https://fonts.gstatic.com/nunito-${x}.woff2)}`).join('')});
   if(u.startsWith('https://fonts.gstatic.com/nunito-')) return r.fulfill({path:`${F}/nunito-latin-${u.match(/nunito-(\d+)/)[1]}-normal.woff2`});
   if(!u.startsWith(O)) return r.abort(); const q=decodeURIComponent(new URL(u).pathname);
   if(q==='/') return r.fulfill({path:path.join(ROOT,'index.html'),contentType:'text/html'});
   if(/\.(webp|jpe?g|png)$/.test(q)) return r.fulfill({path:path.join(ROOT,'placeholder.jpg')});
   if(q.startsWith('/wp-json/')) return r.fulfill({status:200,body:'{}',contentType:'application/json'});
   const f=path.join(ROOT,'site',q); return fs.existsSync(f)?r.fulfill({path:f,contentType:q.endsWith('.css')?'text/css':'application/javascript'}):r.fulfill({status:404,body:''});});
  await p.goto(O+'/'); await p.waitForTimeout(900);
  for (const y of [400,1200,2500,4500]) {
   await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y); await p.waitForTimeout(250);
   const m=await p.evaluate(()=>{const t=document.querySelector('.rto-topbar').getBoundingClientRect(), mb=document.querySelector('.rto-mainbar').getBoundingClientRect(); return {tb:Math.round(t.top), mb:Math.round(mb.top), mbBottom:Math.round(mb.bottom)}});
   if (!mob) ok(`${w}px scrolled ${y}px: top bar + main bar pinned`, m.tb===0 && m.mb>0 && m.mb<=40, `top bar at ${m.tb}px, main bar at ${m.mb}px`);
   else ok(`${w}px scrolled ${y}px: main bar pinned, top bar scrolled away`, m.mb===0 && m.tb<0, `top bar at ${m.tb}px, main bar at ${m.mb}px`);
  }
  if (w===1024) await p.screenshot({path:OUT+'/sticky_1024.png',clip:{x:0,y:0,width:w,height:200}});
  // menu link lands below the pinned header
  await p.evaluate(()=>scrollTo({top:0,behavior:'instant'})); await p.waitForTimeout(300);
  if (mob) { await p.tap('.rto-nav .hfe-nav-menu__toggle'); await p.waitForTimeout(500); await p.tap('.rto-nav .hfe-nav-menu__layout-horizontal li.menu-item:nth-child(5) > a'); }
  else await p.click('.rto-nav li.menu-item:nth-child(5) > a');
  await p.waitForTimeout(3500);
  const c=await p.evaluate(()=>({c:Math.round(document.getElementById('contact').getBoundingClientRect().top), hb:Math.round(document.querySelector('.rto-mainbar').getBoundingClientRect().bottom)}));
  ok(`${w}px menu "Contact" lands just below the pinned header`, c.c>=c.hb-1 && c.c<=c.hb+20, `section top ${c.c}px, header bottom ${c.hb}px`);
  await ctx.close(); }
 await b.close(); console.log(res.join('\n')); console.log(`\n${res.filter(r=>r.startsWith('PASS')).length}/${res.length} passed`); })();
