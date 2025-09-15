
/* ====== Config ====== */
const AUDIO_URL = "https://stream.zeno.fm/jpsr5zsxjlguv";
const PHONE_EC = "+593983706294"; // 098 370 6294

/* ====== Tabs SPA ====== */
const tabs = document.querySelectorAll('#tabs .chip, .header-top .chip');
const views = document.querySelectorAll('.view');
tabs.forEach(chip=>{
  chip.addEventListener('click', ()=>{
    tabs.forEach(c=>c.classList.remove('primary'));
    chip.classList.add('primary');
    const id = chip.dataset.tab;
    views.forEach(v=>v.classList.toggle('active', v.id===id));
  });
});

/* ====== Audio ====== */
const audio = document.getElementById('radio');
audio.src = AUDIO_URL;

const mainPP = document.getElementById('pp');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const minis = [document.getElementById('miniPP1'), document.getElementById('miniPP2'), document.getElementById('miniPP3')].filter(Boolean);

function setPPState(isPlaying){
  playIcon.style.display = isPlaying ? 'none' : 'block';
  pauseIcon.style.display = isPlaying ? 'block' : 'none';
  minis.forEach(b=> b.textContent = isPlaying ? '❚❚' : '▶');
}

async function tryPlay(){
  try{
    await audio.play();
    setPPState(true);
    document.getElementById('unlock').style.display='none';
  }catch(e){
    // Autoplay bloqueado: mostrar overlay
    document.getElementById('unlock').style.display='grid';
    setPPState(false);
  }
}
mainPP.addEventListener('click', ()=> audio.paused ? tryPlay() : (audio.pause(), setPPState(false)));
minis.forEach(btn => btn.addEventListener('click', ()=> audio.paused ? tryPlay() : (audio.pause(), setPPState(false))));
window.addEventListener('load', tryPlay);
document.getElementById('unlockBtn').addEventListener('click', tryPlay);

// Reintento cuando regresa el foco
document.addEventListener('visibilitychange', ()=>{
  if(!audio.paused) tryPlay();
});

/* ====== Visualizador real (Analyser) con fallback ====== */
const canvas = document.getElementById('viz');
const ctx = canvas.getContext('2d');
function sizeCanvas(){
  const r = canvas.getBoundingClientRect();
  canvas.width = r.width * devicePixelRatio;
  canvas.height = r.height * devicePixelRatio;
}
sizeCanvas(); addEventListener('resize', sizeCanvas);

let audioCtx, analyser, raf;
function drawFallback(){
  // barras suaves cuando WebAudio no se puede usar (CORS/políticas)
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

async function setupAnalyser(){
  try{
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const src = audioCtx.createMediaElementSource(audio);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    src.connect(analyser);
    analyser.connect(audioCtx.destination);

    const buf = new Uint8Array(analyser.frequencyBinCount);
    cancelAnimationFrame(raf);
    (function loop(){
      analyser.getByteFrequencyData(buf);
      const W = canvas.width, H = canvas.height, bars = 40, step = Math.floor(buf.length/bars);
      ctx.clearRect(0,0,W,H);
      for(let i=0;i<bars;i++){
        const v = buf[i*step]/255;
        const x = (i+.5)*W/bars; const w = W/bars*0.6; const h = Math.max(6, v*(H*0.9));
        const g = ctx.createLinearGradient(0,0,0,H);
        g.addColorStop(0,"rgba(255,204,51,.95)");
        g.addColorStop(1,"rgba(255,102,0,.7)");
        ctx.fillStyle = g;
        ctx.fillRect(x-w/2, H-h, w, h);
      }
      raf = requestAnimationFrame(loop);
    })();
  }catch(err){
    drawFallback();
  }
}
audio.addEventListener('play', ()=>{
  if(!audioCtx) setupAnalyser();
});

/* ====== FAB ====== */
const fabBtn = document.getElementById('fabBtn');
const sheet = document.getElementById('sheet');
fabBtn.addEventListener('click', ()=> sheet.classList.toggle('open'));
document.getElementById('whLink').href = "https://wa.me/" + PHONE_EC.replace(/\D/g,"");

/* ====== Slider (una imagen a la vez, con caption) ====== */
function makeSlider(slideId, captionId){
  const slide = document.getElementById(slideId);
  const captionEl = document.getElementById(captionId);
  const items = Array.from({length:10}).map((_,i)=>({src:'logo.png', caption:`Descripción ${i+1} — tu texto aquí`}));
  let idx = 0;
  function render(){
    slide.innerHTML = `<img src="${items[idx].src}" alt="item ${idx+1}" />`;
    captionEl.textContent = items[idx].caption;
  }
  render();
  return {
    next(){ idx = (idx+1)%items.length; render(); },
    prev(){ idx = (idx-1+items.length)%items.length; render(); }
  };
}
const cli = makeSlider('clientesSlide','clientesCaption');
document.getElementById('nextCliente').onclick = ()=> cli.next();
document.getElementById('prevCliente').onclick = ()=> cli.prev();

const art = makeSlider('artistasSlide','artistasCaption');
document.getElementById('nextArtista').onclick = ()=> art.next();
document.getElementById('prevArtista').onclick = ()=> art.prev();

/* ====== Botón Regresar ====== */
document.querySelectorAll('.back-btn').forEach(b=>{
  b.addEventListener('click', ()=>{
    views.forEach(v=>v.classList.remove('active'));
    document.getElementById('home').classList.add('active');
  });
});

/* ====== Contacto ====== */
function formToText(){
  const f = document.getElementById('contactForm');
  const name = f.name.value.trim();
  const email = f.email.value.trim();
  const phone = f.phone.value.trim();
  const msg = f.msg.value.trim();
  return `Hola, soy ${name}. Mi correo es ${email} y mi teléfono es ${phone}. Mensaje: ${msg}`;
}
document.getElementById('sendWA').onclick = ()=>{
  const text = encodeURIComponent(formToText());
  location.href = `https://wa.me/${PHONE_EC.replace(/\D/g,"")}?text=${text}`;
};
document.getElementById('sendMail').onclick = ()=>{
  const subject = encodeURIComponent("Contacto desde La Buenota Radio Online");
  const body = encodeURIComponent(formToText());
  location.href = `mailto:?subject=${subject}&body=${body}`;
};
document.getElementById('sendSMS').onclick = ()=>{
  const body = encodeURIComponent(formToText());
  location.href = `sms:${PHONE_EC}?&body=${body}`;
};
document.getElementById('contactForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  alert("¡Gracias! Tu mensaje ha sido preparado. Usa WhatsApp/Correo/SMS para enviarlo.");
});