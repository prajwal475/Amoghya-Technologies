/* ═══════════════════════════════════════════════
   AMOGHYA TECHNOLOGIES — Shared JS
   No external libraries. Single RAF loop.
═══════════════════════════════════════════════ */
(function(){
'use strict';

/* ── HELPERS ─────────────────────────────────── */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const lerp = (a,b,t) => a+(b-a)*t;

/* ── PAGE VEIL (fade in on load, out on navigate) */
(function(){
  let veil = $('#page-veil');
  if(!veil){
    veil = document.createElement('div');
    veil.id = 'page-veil';
    document.body.prepend(veil);
  }
  /* Set veil instantly opaque (no transition) so page starts black */
  veil.style.cssText = 'opacity:1;pointer-events:auto;transition:none;position:fixed;inset:0;background:var(--bg);z-index:9990;';

  /* Fade out — works whether DOMContentLoaded already fired or not */
  function revealPage(){
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{   /* double rAF ensures paint before transition */
        veil.style.transition = 'opacity .6s cubic-bezier(.77,0,.18,1)';
        veil.style.opacity = '0';
        setTimeout(()=>{ veil.style.pointerEvents='none'; }, 660);
      });
    });
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', revealPage);
  } else {
    revealPage();
  }

  /* Fade in before navigating away */
  document.addEventListener('click', e=>{
    const a = e.target.closest('a[href]');
    if(!a) return;
    const href = a.getAttribute('href');
    if(!href || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('http')) return;
    e.preventDefault();
    veil.style.transition = 'opacity .4s cubic-bezier(.77,0,.18,1)';
    veil.style.opacity = '1';
    veil.style.pointerEvents = 'auto';
    setTimeout(()=>{ window.location.href = href; }, 430);
  });
})();

/* ── CURSOR ──────────────────────────────────── */
const cur  = $('#cur');
const ring = $('#cur-ring');
if(!cur) return;

/* Cursor label */
let curLabel = $('#cur-label');
if(!curLabel){
  curLabel = document.createElement('div');
  curLabel.id = 'cur-label';
  document.body.appendChild(curLabel);
}

/* Trail particles */
const TRAIL_COUNT = 6;
const trails = [];
for(let i=0;i<TRAIL_COUNT;i++){
  const t = document.createElement('div');
  t.className = 'cur-trail';
  const s = 6 - i*0.7;
  t.style.cssText = `width:${Math.max(2,s)}px;height:${Math.max(2,s)}px;opacity:${0.5 - i*0.07}`;
  document.body.appendChild(t);
  trails.push({el:t, x:innerWidth/2, y:innerHeight/2});
}

let cmx = innerWidth/2, cmy = innerHeight/2;
let crx = cmx, cry = cmy;
let lblX = cmx, lblY = cmy;
let cursorVisible = false;
let rafActive = false;
let lastMoveTime = 0;

document.addEventListener('mousemove', e=>{
  cmx = e.clientX; cmy = e.clientY;
  lastMoveTime = performance.now();
  if(!cursorVisible){
    cursorVisible = true;
    cur.style.opacity = '1';
    ring.style.opacity = '1';
  }
  if(!rafActive){ rafActive = true; requestAnimationFrame(tick); }
  /* Cursor label: check for data-cursor-label */
  const target = e.target.closest('[data-cursor-label]');
  if(target){
    curLabel.textContent = target.dataset.cursorLabel;
    curLabel.classList.add('show');
  } else {
    curLabel.classList.remove('show');
  }
},{passive:true});

document.addEventListener('mouseleave', ()=>{
  curLabel.classList.remove('show');
},{passive:true});

/* ── NAV STICKY ──────────────────────────────── */
const nav = $('#nav');
function checkNav(){ nav && nav.classList.toggle('stuck', scrollY>60); }
window.addEventListener('scroll', checkNav, {passive:true});
checkNav();

/* Set active nav link */
(function(){
  const path = location.pathname.split('/').pop() || 'index.html';
  $$('#nav .nav-links a').forEach(a=>{
    const href = a.getAttribute('href');
    if(href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });
})();

/* ── MAGNETIC BUTTONS ─────────────────────────── */
$$('.btn-pri, .btn-out, .nav-cta, .c-submit').forEach(btn=>{
  btn.addEventListener('mouseenter', ()=>{
    btn.style.transition = 'transform 0s';
  },{passive:true});
  btn.addEventListener('mousemove', e=>{
    const r = btn.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width/2) * .28;
    const y = (e.clientY - r.top  - r.height/2) * .28;
    btn.style.transform = `translate(${x}px,${y}px)`;
  },{passive:true});
  btn.addEventListener('mouseleave', ()=>{
    btn.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)';
    btn.style.transform = '';
  },{passive:true});
});

/* ── MASTER RAF ───────────────────────────────── */
/* Runs only while cursor is moving; stops ~600ms after last move */
function tick(){
  /* Main cursor dot — instant */
  cur.style.transform  = `translate3d(${cmx-5}px,${cmy-5}px,0)`;

  /* Cursor ring — lagged */
  crx = lerp(crx, cmx, .09);
  cry = lerp(cry, cmy, .09);
  ring.style.transform = `translate3d(${crx-18}px,${cry-18}px,0)`;

  /* Cursor label — follow cursor with slight offset */
  lblX = lerp(lblX, cmx, .14);
  lblY = lerp(lblY, cmy, .14);
  curLabel.style.transform = `translate3d(${lblX+20}px,${lblY-16}px,0)`;

  /* Cursor trail — staggered lerp chain */
  let px = cmx, py = cmy;
  trails.forEach((t, i)=>{
    const speed = 0.18 - i*0.02;
    t.x = lerp(t.x, px, speed);
    t.y = lerp(t.y, py, speed);
    const s = parseFloat(t.el.style.width);
    t.el.style.transform = `translate3d(${t.x - s/2}px,${t.y - s/2}px,0)`;
    px = t.x; py = t.y;
  });

  /* Keep ticking for 600ms after last move so trailing settles, then stop */
  if(performance.now() - lastMoveTime < 600){
    requestAnimationFrame(tick);
  } else {
    rafActive = false;
  }
}

/* ── INTERSECTION OBSERVER — scroll reveals ──── */
const io = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
  });
},{threshold:.1,rootMargin:'0px 0px -40px 0px'});
$$('.rv,.rv-l,.rv-r,.rv-scale,.rv-clip,.sweep-line,.d1,.d2,.d3,.d4').forEach(el=>io.observe(el));

/* ── SCROLL PROGRESS BAR ─────────────────────── */
(function(){
  const bar = document.getElementById('scroll-progress');
  if(!bar) return;
  function upd(){
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (max>0 ? (scrollY/max*100) : 0)+'%';
  }
  window.addEventListener('scroll', upd, {passive:true});
  upd();
})();

/* ── HERO PARALLAX ───────────────────────────── */
(function(){
  const hero    = document.getElementById('hero');
  const bgWord  = document.querySelector('.hero-bg-word');
  const heroCtx = document.querySelector('.hero-content');
  if(!hero) return;
  let pPend=false;
  window.addEventListener('scroll',()=>{
    if(pPend) return; pPend=true;
    requestAnimationFrame(()=>{
      const p = Math.min(scrollY/innerHeight, 1);
      if(bgWord)  bgWord.style.transform  = `translateY(${p*-90}px)`;
      if(heroCtx) heroCtx.style.transform = `translateY(${p*55}px)`;
      hero.style.opacity = String(Math.max(0, 1-p*1.8));
      pPend=false;
    });
  },{passive:true});
})();

/* ── CARD TILT (with shine via CSS vars) ─────── */
$$('.tilt').forEach(card=>{
  card.addEventListener('mousemove',e=>{
    const r = card.getBoundingClientRect();
    const x = (e.clientX-r.left)/r.width-.5;
    const y = (e.clientY-r.top)/r.height-.5;
    /* Shine position as percentage */
    const mx = ((e.clientX-r.left)/r.width*100).toFixed(1)+'%';
    const my = ((e.clientY-r.top)/r.height*100).toFixed(1)+'%';
    card.style.setProperty('--mx', mx);
    card.style.setProperty('--my', my);
    card.style.transform=`perspective(700px) rotateY(${x*9}deg) rotateX(${-y*9}deg) translateY(-5px) scale(1.015)`;
  },{passive:true});
  card.addEventListener('mouseleave',()=>{
    card.style.transform='';
  },{passive:true});
});

/* ── MARQUEE (if present) ────────────────────── */
(function(){
  const track = $('#mq-track');
  if(!track) return;
  const words=['Web Development','App Development','AI Solutions','Content Production','Digital Growth','Brand Strategy','UI/UX Design','3D Experiences','Creative Tech'];
  for(let s=0;s<4;s++) words.forEach(w=>{
    const el=document.createElement('span');
    el.className='mq-item';
    el.innerHTML=`${w}<span class="mq-dot"></span>`;
    track.appendChild(el);
  });
  /* Double rAF: fonts + layout must settle before measuring width */
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      const setW = track.scrollWidth / 4;
      if(setW <= 0) return;
      /* Override @keyframes with exact pixel shift */
      const st = document.createElement('style');
      st.textContent = `@keyframes mq{0%{transform:translate3d(0,0,0)}to{transform:translate3d(-${setW}px,0,0)}}`;
      document.head.appendChild(st);
    });
  });
})();

/* ── STAT COUNTERS (if present) ──────────────── */
function runCount(el, end, dur){
  const t0 = performance.now();
  (function step(now){
    const p = Math.min(1,(now-t0)/dur);
    const e = 1-Math.pow(1-p,3);
    el.textContent = Math.round(e*end);
    if(p<1) requestAnimationFrame(step); else el.textContent=end;
  })(performance.now());
}
const cntIO = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(!e.isIntersecting) return;
    $$('[data-count]').forEach(el=>runCount(el,+el.dataset.count,2000));
    $$('[data-target]').forEach(el=>runCount(el,+el.dataset.target,1800));
    cntIO.disconnect();
  });
},{threshold:.4});
const statsEl = $('#stats')||$('#about')||$('.intro-stats')||$('.intro-section');
if(statsEl) cntIO.observe(statsEl);

/* ── PROCESS PATH (if present) ───────────────── */
(function(){
  const pFill = $('#p-fill');
  const pDot  = $('#p-dot');
  const procS = $('#process');
  const wrap  = $('#proc-wrap');
  if(!pFill||!pDot||!procS||!wrap) return;

  let pLen=0, scX=1, scY=1;
  function cacheP(){
    pLen = pFill.getTotalLength();
    pFill.style.strokeDasharray  = pLen;
    pFill.style.strokeDashoffset = pLen;
    scX = wrap.offsetWidth  / 1200;
    scY = wrap.offsetHeight / 540;
  }
  window.addEventListener('load', cacheP);
  window.addEventListener('resize', cacheP, {passive:true});

  let pPending=false;
  function updateP(){
    if(pPending) return;
    pPending=true;
    requestAnimationFrame(()=>{
      const r = procS.getBoundingClientRect();
      const p = Math.max(0,Math.min(1,(innerHeight*.62-r.top)/(r.height*.72)));
      pFill.style.strokeDashoffset = pLen*(1-p);
      const pt = pFill.getPointAtLength(pLen*p);
      pDot.style.transform = `translate3d(${pt.x*scX-6.5}px,${pt.y*scY-6.5}px,0)`;
      pPending=false;
    });
  }
  window.addEventListener('scroll', updateP, {passive:true});
  window.addEventListener('load', updateP);
})();

/* ── CAROUSEL CLASS ──────────────────────────── */
window.Carousel = class {
  constructor(wrap){
    this.slides  = $$('.slide', wrap);
    this.dots    = $$('.cc-dot', wrap);
    this.fill    = $('.cc-fill', wrap);
    this.count   = $('.cc-count', wrap);
    this.prevBtn = $('.arr-prev', wrap);
    this.nextBtn = $('.arr-next', wrap);
    this.total   = this.slides.length;
    this.cur     = 0;
    this.busy    = false;

    this.prevBtn && this.prevBtn.addEventListener('click', ()=>this.go(-1));
    this.nextBtn && this.nextBtn.addEventListener('click', ()=>this.go(1));
    wrap.setAttribute('tabindex','0');
    wrap.addEventListener('keydown', e=>{
      if(e.key==='ArrowLeft')  this.go(-1);
      if(e.key==='ArrowRight') this.go(1);
    });
    let tx=0;
    wrap.addEventListener('touchstart', e=>{ tx=e.touches[0].clientX; },{passive:true});
    wrap.addEventListener('touchend',   e=>{
      const dx=e.changedTouches[0].clientX-tx;
      if(Math.abs(dx)>44) this.go(dx<0?1:-1);
    },{passive:true});
    this.update(null, true);
  }
  go(dir){
    if(this.busy) return;
    this.busy=true;
    this.slides[this.cur].classList.remove('active');
    this.cur=(this.cur+dir+this.total)%this.total;
    this.slides[this.cur].classList.add('active');
    setTimeout(()=>this.busy=false, 460);
    this.update(dir);
  }
  update(dir, init){
    if(!init) this.slides[this.cur].classList.add('active');
    else { this.slides[0].classList.add('active'); }
    if(this.dots.length){
      this.dots.forEach((d,i)=>d.classList.toggle('on',i===this.cur));
    }
    if(this.fill){
      this.fill.style.width = ((this.cur+1)/this.total*100)+'%';
    }
    if(this.count){
      this.count.textContent=`${String(this.cur+1).padStart(2,'0')} / ${String(this.total).padStart(2,'0')}`;
    }
    if(this.prevBtn) this.prevBtn.disabled = false;
    if(this.nextBtn) this.nextBtn.disabled = false;
  }
};

})();
