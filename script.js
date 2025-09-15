
/* ===== Config ===== */
const AUDIO_URL = "https://stream.zeno.fm/jpsr5zsxjlguv";
const PHONE_EC = "+593983706294"; // 098 370 6294

/* ===== Tabs SPA ===== */
const tabs = document.querySelectorAll('#tabs .chip, .header-top .chip');
const views = document.querySelectorAll('.view');
function activateView(id){
  tabs.forEach(c=>c.classList.toggle('primary', c.dataset.tab===id));
  views.forEach(v=>v.classList.toggle('active', v.id===id));
  // Al activar una vista, forzamos el re-size de mini-viz (para evitar width=0 cuando estaban ocultos)
  resizeVisibleMiniViz();
  // Si volvemos a home y el audio está en play, reanudamos el dibujo principal
  if(id === "home" && !audio.paused && analyser){ startMainViz(); }
}
tabs.forEach(chip=>{
  chip.addEventListener('click', ()=> activateView(chip.dataset.tab));
});

/* ===== Audio ===== */
const audio = document.getElementById('radio');
audio.src = AUDIO_URL;

const mainPP = document.getElementById('pp');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const minis = [document.getElementById('miniPP1'), document.getElementById('miniPP2'), document.getElementById('miniPP3')].filter(Boolean);

function setPPState(isPlaying){
  if (playIcon) playIcon.style.display = isPlaying ? 'none' : 'block';
  if (pauseIcon) pauseIcon.style.display = isPlaying ? 'block' : 'none';
  minis.forEach(b=> b.textContent = isPlaying ? '❚❚' : '▶');
}

async function tryPlay(){
  try{
    await audio.play();
    setPPState(true);
    const unlock = document.getElementById('unlock');
    if (unlock) unlock.style.display='none';
  }catch(e){
    const unlock = document.getElementById('unlock');
    if (unlock) unlock.style.display='grid';
    setPPState(false);
  }
}
if (mainPP){
  mainPP.addEventListener('click', ()=> audio.paused ? tryPlay() : (audio.pause(), setPPState(false)));
}
minis.forEach(btn => btn.addEventListener('click', ()=> audio.paused ? tryPlay() : (audio.pause(), setPPState(false))));
window.addEventListener('load', tryPlay);
const unlockBtn = document.getElementById('unlockBtn');
if (unlockBtn) unlockBtn.addEventListener('click', tryPlay);

// Reintento cuando regresa el foco
document.addEventListener('visibilitychange', ()=>{
  if(!audio.paused){
    tryPlay();
    if(analyser) startMainViz();
  }
});

/* ===== Visualizador principal ===== */
const canvas = document.getElementById('viz');
const ctx = canvas ? canvas.getContext('2d') : null;
function sizeCanvas(){
  if(!canvas) return;
  const r = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, r.width * devicePixelRatio);
  canvas.height = Math.max(1, r.height * devicePixelRatio);
}
sizeCanvas(); addEventListener('resize', sizeCanvas);

let audioCtx, analyser, raf;
function drawFallback(){
  if(!canvas || !ctx) return;
  let t = 0;
  cancelAnimationFrame(raf);
  (function loop(){
    t += 0.035;
    const W = canvas.width, H = canvas.height, bars = 40;
    ctx.clearRect(0,0,W,H);
    for(let i=0;i<bars;i++){
      const x = (i+.5)*W/bars;
      const w = W/bars*0.6;
      const h = (Math.sin(t+i*.5)*0.45+0.55) * (H*0.9);
      const g = ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,"rgba(255,204,51,.95)");
      g.addColorStop(1,"rgba(255,102,0,.7)");
      ctx.fillStyle = g;
      ctx.fillRect(x-w/2, H-h, w, h);
    }
    raf = requestAnimationFrame(loop);
  })();
}

function startMainViz(){
  if(!canvas || !ctx || !analyser) return;
  const buf = new Uint8Array(analyser.frequencyBinCount);
  cancelAnimationFrame(raf);
  (function loop(){
    analyser.getByteFrequencyData(buf);
    const W = canvas.width, H = canvas.height, bars = 40, step = Math.floor(buf.length/bars);
    ctx.clearRect(0,0,W,H);
    for(let i=0;i<bars;i++){
      const v = buf[i*step]/255;
      const x = (i+.5)*W/bars;
      const w = W/bars*0.6;
      const h = Math.max(6, v*(H*0.9));
      const g = ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,"rgba(255,204,51,.95)");
      g.addColorStop(1,"rgba(255,102,0,.7)");
      ctx.fillStyle = g;
      ctx.fillRect(x-w/2, H-h, w, h);
    }
    raf = requestAnimationFrame(loop);
  })();
}

async function setupAnalyser(){
  try{
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const src = audioCtx.createMediaElementSource(audio);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    src.connect(analyser);
    analyser.connect(audioCtx.destination);

    startMainViz();

    // Instanciar mini viz una sola vez (aunque estén ocultos)
    registerMiniViz('viz1'); 
    registerMiniViz('viz2'); 
    registerMiniViz('viz3');
  }catch(err){
    drawFallback();
  }
}
audio.addEventListener('play', ()=>{
  if(!audioCtx) setupAnalyser();
});

/* ===== FAB ===== */
const fabBtn = document.getElementById('fabBtn');
const sheet = document.getElementById('sheet');
if (fabBtn) fabBtn.addEventListener('click', ()=> sheet && sheet.classList.toggle('open'));
const whLink = document.getElementById('whLink');
if (whLink) whLink.href = "https://wa.me/" + PHONE_EC.replace(/\D/g,"");

/* ===== Slider ===== */
function makeSlider(slideId, captionId){
  const slide = document.getElementById(slideId);
  const captionEl = document.getElementById(captionId);
  const items = Array.from({length:10}).map((_,i)=>({src:'logo.png', caption:`Descripción ${i+1} — tu texto aquí`}));
  let idx = 0;
  function render(){
    if(!slide) return;
    slide.innerHTML = `<img src="${items[idx].src}" alt="item ${idx+1}" />`;
    if(captionEl) captionEl.textContent = items[idx].caption;
  }
  render();
  return {
    next(){ idx = (idx+1)%items.length; render(); },
    prev(){ idx = (idx-1+items.length)%items.length; render(); }
  };
}
const cli = makeSlider('clientesSlide','clientesCaption');
const art = makeSlider('artistasSlide','artistasCaption');
const nextCliente = document.getElementById('nextCliente');
const prevCliente = document.getElementById('prevCliente');
if (nextCliente) nextCliente.onclick = ()=> cli.next();
if (prevCliente) prevCliente.onclick = ()=> cli.prev();
const nextArtista = document.getElementById('nextArtista');
const prevArtista = document.getElementById('prevArtista');
if (nextArtista) nextArtista.onclick = ()=> art.next();
if (prevArtista) prevArtista.onclick = ()=> art.prev();

/* ===== Botón Regresar ===== */
document.querySelectorAll('.back-btn').forEach(b=>{
  b.addEventListener('click', ()=>{
    activateView('home');
  });
});

/* ===== Contacto ===== */
function formToText(){
  const f = document.getElementById('contactForm');
  const name = f.name.value.trim();
  const email = f.email.value.trim();
  const phone = f.phone.value.trim();
  const msg = f.msg.value.trim();
  return `Hola, soy ${name}. Mi correo es ${email} y mi teléfono es ${phone}. Mensaje: ${msg}`;
}
const sendWA = document.getElementById('sendWA');
const sendMail = document.getElementById('sendMail');
const sendSMS = document.getElementById('sendSMS');
if (sendWA) sendWA.onclick = ()=>{
  const text = encodeURIComponent(formToText());
  location.href = `https://wa.me/${PHONE_EC.replace(/\D/g,"")}?text=${text}`;
};
if (sendMail) sendMail.onclick = ()=>{
  const subject = encodeURIComponent("Contacto desde La Buenota Radio Online");
  const body = encodeURIComponent(formToText());
  location.href = `mailto:?subject=${subject}&body=${body}`;
};
if (sendSMS) sendSMS.onclick = ()=>{
  const body = encodeURIComponent(formToText());
  location.href = `sms:${PHONE_EC}?&body=${body}`;
};
const contactForm = document.getElementById('contactForm');
if (contactForm){
  contactForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    alert("¡Gracias! Tu mensaje ha sido preparado. Usa WhatsApp/Correo/SMS para enviarlo.");
  });
}

/* ===== Mini-espectros: robusto y responsivo ===== */
const miniVizRegistry = new Map();

function registerMiniViz(canvasId){
  const c = document.getElementById(canvasId);
  if(!c || miniVizRegistry.has(canvasId)) return;
  const cx = c.getContext('2d');

  function size(){
    // Si el canvas está oculto (offsetWidth=0), usa ancho del contenedor padre visible
    const host = c.closest('.mini-player') || c.parentElement;
    const fallbackW = host ? host.clientWidth - 80 : 300;
    const w = (c.offsetWidth || fallbackW);
    c.width  = Math.max(1, w * devicePixelRatio);
    c.height = Math.max(1, c.offsetHeight * devicePixelRatio || 18 * devicePixelRatio);
  }
  size();

  function draw(){
    if(!analyser){
      requestAnimationFrame(draw); 
      return;
    }
    const buf = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(buf);
    cx.clearRect(0,0,c.width,c.height);
    const W=c.width,H=c.height,bars=18,step=Math.max(1, Math.floor(buf.length/bars));
    for(let i=0;i<bars;i++){
      const v=buf[i*step]/255;
      const x=(i+.5)*W/bars, w=W/bars*.6, h=Math.max(1, v*(H*.95));
      const g=cx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,"rgba(255,204,51,.9)");
      g.addColorStop(1,"rgba(255,102,0,.7)");
      cx.fillStyle=g; 
      cx.fillRect(x-w/2, H-h, w, h);
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  miniVizRegistry.set(canvasId, { size });
}

function resizeVisibleMiniViz(){
  // Re-dimensiona solo los que están en la vista activa
  document.querySelectorAll('.view.active .mini-viz').forEach(cv=>{
    const rec = miniVizRegistry.get(cv.id);
    if(rec) rec.size();
  });
}

// Registrar (aunque estén ocultos; se redimensionan al mostrarse)
['viz1','viz2','viz3'].forEach(registerMiniViz);

// Redimensionar al cambiar tamaño de ventana
window.addEventListener('resize', resizeVisibleMiniViz);

// Si cargamos en Home, mantener Home activo por defecto
activateView('home');