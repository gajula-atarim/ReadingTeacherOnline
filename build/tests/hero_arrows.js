const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
const ROOT=process.argv[2], OUT=process.argv[3], F=process.env.FONTDIR, O='https://readingteacheronline.wsdfy.com';
(async()=>{ const b=await chromium.launch();
 for (const w of [1440,768,430,390,360,320]) {
  const ctx=await b.newContext({viewport:{width:w,height:844},hasTouch:w<768,isMobile:w<768}); const p=await ctx.newPage();
  await p.route('**/*', r=>{const u=r.request().url();
   if(u.startsWith('https://fonts.googleapis.com/css') && u.includes('Nunito')) return r.fulfill({contentType:'text/css', body:[400,600,700,800].map(x=>`@font-face{font-family:'Nunito';font-weight:${x};src:url(https://fonts.gstatic.com/nunito-${x}.woff2)}`).join('')});
   if(u.startsWith('https://fonts.gstatic.com/nunito-')) return r.fulfill({path:`${F}/nunito-latin-${u.match(/nunito-(\d+)/)[1]}-normal.woff2`});
   if(!u.startsWith(O)) return r.abort(); const q=decodeURIComponent(new URL(u).pathname);
   if(q==='/') return r.fulfill({path:path.join(ROOT,'index.html'),contentType:'text/html'});
   if(/\.(webp|jpe?g|png)$/.test(q)) return r.fulfill({path:path.join(ROOT,'placeholder.jpg')});
   if(q.startsWith('/wp-json/')) return r.fulfill({status:200,body:'{}',contentType:'application/json'});
   const f=path.join(ROOT,'site',q); return fs.existsSync(f)?r.fulfill({path:f,contentType:q.endsWith('.css')?'text/css':'application/javascript'}):r.fulfill({status:404,body:''});});
  await p.goto(O+'/'); await p.waitForTimeout(1500);
  const m=await p.evaluate(()=>{const a=document.querySelector('.rto-hero-arrow--prev').getBoundingClientRect(), n=document.querySelector('.rto-hero-arrow--next').getBoundingClientRect();
   const txt=[...document.querySelectorAll('.rto-slide.is-active .rto-hero-title .rto-w-i, .rto-slide.is-active .rto-hero-text p')].map(e=>e.getBoundingClientRect()).filter(r=>r.width);
   const minL=Math.min(...txt.map(r=>r.left)), maxR=Math.max(...txt.map(r=>r.right));
   const hit=txt.some(r=>(r.left<a.right&&r.right>a.left&&r.top<a.bottom&&r.bottom>a.top)||(r.left<n.right&&r.right>n.left&&r.top<n.bottom&&r.bottom>n.top));
   return {size:Math.round(a.width), left:Math.round(a.left), right:Math.round(innerWidth-n.right), textL:Math.round(minL), textR:Math.round(innerWidth-maxR), overlap:hit}});
  console.log(String(w).padStart(5),`| arrows ${m.size}px, ${m.left}px / ${m.right}px from edges | text starts ${m.textL}px, ends ${m.textR}px from right | arrows overlap text: ${m.overlap}`);
  if (w===390) await p.screenshot({path:OUT+'/hero_arrows_390.png',clip:{x:0,y:90,width:390,height:520}});
  await ctx.close(); }
 await b.close(); })();
