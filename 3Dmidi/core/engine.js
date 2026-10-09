/* =========================================================
   MIDI3D ENGINE — visualizer 3D di landing page (hero).
   Data karya diambil dari WORKS (works/js/works-data.js).
   Tambah field  midi: "midi-asset/xxx.mid"  di karya mana pun,
   otomatis muncul & bisa diputar.

   Engine ini TIDAK peduli tampilan: scene, kamera, keyboard, MIDI,
   audio, playlist & tombol Theme ada di sini. Semua yang "kelihatan"
   per-tema (bar jatuh, kembang api, dst.) ada di 3Dmidi/<tema>/theme.js
   — lihat 3Dmidi/README.md.
   ========================================================= */
(function(){
'use strict';
const M = window.MIDI3D;
if (!M || typeof WORKS === 'undefined' || typeof THREE === 'undefined') return;

/* ---------- daftar tema (tambah tema baru = tambah 1 entri + 1 folder) ---------- */
const MANIFEST = M.manifest || [];
const THEME_KEY = 'mv3d-theme';

/* ---------- konfigurasi tampilan ---------- */
const HIT_Z = -6;       // posisi bar saat menyentuh tuts (tema neon) / acuan z peluncuran
const FALL_SPEED = 9;   // unit dunia / detik (tema neon)
const MOBILE = matchMedia('(pointer:coarse)').matches || innerWidth < 768;

const parseMidi = M.parseMidi;
const kb = M.buildKeyboard(THREE);
const { KEY_INFO, KB_CENTER, keyMeshes } = kb;

/* ---------- scene (background transparan → tampil background hero) ---------- */
const stage = document.getElementById('mvStage');
const hero = document.getElementById('hero');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 400);
const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputEncoding = THREE.sRGBEncoding;
stage.appendChild(renderer.domElement);

let camDist = 34, camYaw = 0, camPitch = 0.55;
const DIST_MIN = 16, DIST_MAX = 90;
const CAM_TARGET = new THREE.Vector3(0, 2, -6);
function updateCamera(){
  // offset kamera relatif ke target; diputar (yaw) mengelilingi sumbu Y target
  const offY = 8 + camDist*Math.sin(camPitch);
  const offR = camDist*Math.cos(camPitch) - camDist*0.15 + 20;
  camera.position.set(
    CAM_TARGET.x + Math.sin(camYaw)*offR,
    CAM_TARGET.y + offY,
    CAM_TARGET.z + Math.cos(camYaw)*offR
  );
  camera.lookAt(CAM_TARGET);
}
function stageSize(){ return { w: stage.clientWidth || innerWidth, h: stage.clientHeight || innerHeight }; }
let theme = null, themeId = null;
function resize(){
  const {w, h} = stageSize();
  camera.aspect = w/h; camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  if(theme && theme.resize) theme.resize(w, h);
}
camDist = Math.min(DIST_MAX, 34 * Math.max(1, 1.5/((stage.clientWidth||innerWidth)/(stage.clientHeight||innerHeight))));
resize(); updateCamera();
new ResizeObserver(resize).observe(stage);

/* lampu dasar — warna/intensitas diatur ulang oleh tema aktif saat activate() */
const lights = {
  ambient: new THREE.AmbientLight(0x88aa99, 0.6),
  key1: new THREE.DirectionalLight(0xffffff, 0.8),
  rim: new THREE.PointLight(0x39ff14, 0.9, 70)
};
lights.key1.position.set(10,30,20); lights.rim.position.set(0,10,-20);
scene.add(lights.ambient, lights.key1, lights.rim);

scene.add(kb.group);
scene.add(kb.buildGrid());

/* konteks yang diberikan ke setiap tema */
const ctx = { THREE, scene, camera, renderer, stage, hero, lights, kb,
              KEY_INFO, KB_CENTER, keyMeshes, HIT_Z, FALL_SPEED, mobile: MOBILE, stageSize };

/* ---------- audio ---------- */
let actx = null;
const piano = M.createPiano(()=>actx);

/* ---------- orbit, zoom (wheel & pinch), auto-rotate ---------- */
let dragging=false, lx=0, ly=0, pinchDist=0;
let lastInput = -1e9;                 // waktu interaksi terakhir (detik)
const touchNow = ()=>{ lastInput = performance.now()/1000; };
stage.addEventListener('pointerdown', e=>{
  if(pinchDist) return;
  dragging=true; lx=e.clientX; ly=e.clientY; touchNow();
});
addEventListener('pointerup', ()=>{ dragging=false; touchNow(); });
addEventListener('pointercancel', ()=>{ dragging=false; });
addEventListener('pointermove', e=>{
  if(!dragging || pinchDist) return;
  camYaw -= (e.clientX-lx)*0.004;   // geser ke kanan → scene ikut berputar ke kanan
  camPitch = Math.min(1.1, Math.max(0.18, camPitch + (e.clientY-ly)*0.003));
  lx=e.clientX; ly=e.clientY; touchNow(); updateCamera();
});
stage.addEventListener('wheel', e=>{
  // di batas zoom-out, biarkan scroll halaman lewat
  if(e.deltaY > 0 && camDist >= DIST_MAX) return;
  e.preventDefault(); touchNow();
  camDist = Math.min(DIST_MAX, Math.max(DIST_MIN, camDist + e.deltaY*0.03));
  updateCamera();
}, {passive:false});

// pinch dua jari (mobile)
const tDist = t => Math.hypot(t[0].clientX-t[1].clientX, t[0].clientY-t[1].clientY);
stage.addEventListener('touchstart', e=>{
  if(e.touches.length === 2){ pinchDist = tDist(e.touches); dragging = false; touchNow(); e.preventDefault(); }
}, {passive:false});
stage.addEventListener('touchmove', e=>{
  if(e.touches.length !== 2 || !pinchDist) return;
  e.preventDefault(); touchNow();
  const d = tDist(e.touches);
  if(d > 0){
    camDist = Math.min(DIST_MAX, Math.max(DIST_MIN, camDist * pinchDist / d));
    pinchDist = d; updateCamera();
  }
}, {passive:false});
const endTouch = e=>{ if(e.touches.length < 2) pinchDist = 0; touchNow(); };
stage.addEventListener('touchend', endTouch);
stage.addEventListener('touchcancel', endTouch);

// auto-rotate: pelan & halus saat lagu diputar; berhenti saat disentuh, lanjut perlahan setelah dilepas
const AUTO_SPEED = 0.07;      // rad/detik
const AUTO_LIMIT = 0.9;       // ayunan ± rad dari depan (Infinity = putar penuh 360°)
const AUTO_RESUME = 1.5;      // detik jeda setelah interaksi terakhir
const AUTO_EASE = 1.2;        // makin besar = akselerasi/pengereman makin cepat
let autoVel = 0, autoDir = 1, lastFrame = performance.now()/1000;
function stepAutoRotate(dt){
  const idle = !dragging && !pinchDist && (performance.now()/1000 - lastInput) > AUTO_RESUME;
  if(camYaw > AUTO_LIMIT) autoDir = -1; else if(camYaw < -AUTO_LIMIT) autoDir = 1;
  const target = (playing && idle) ? AUTO_SPEED*autoDir : 0;
  autoVel += (target - autoVel) * (1 - Math.exp(-AUTO_EASE*dt));
  if(Math.abs(autoVel) > 1e-5){ camYaw += autoVel*dt; updateCamera(); }
}

/* ---------- playback ---------- */
let notes = [], total = 0, playing = false, ready = false, loop = false;
let loadState = 'idle', autoPlay = false, currentW = null; // idle | loading | error
let playStart = 0, pausedAt = 0, startPtr = 0, schedPtr = 0;
const activeSet = new Set();
const AHEAD = 1.2;

function resetPtrs(t){
  startPtr = 0;
  while(startPtr < notes.length && notes[startPtr].start < t) startPtr++;
  schedPtr = startPtr; activeSet.clear();
}
function schedTick(t){
  while(schedPtr < notes.length && notes[schedPtr].start <= t+AHEAD){
    piano.scheduleNote(notes[schedPtr], playStart + notes[schedPtr].start); schedPtr++;
  }
}
function killAudio(){ if(actx){ actx.close(); actx = null; } }

/* ---------- keep screen on (mobile) ---------- */
let wakeLock = null;
async function lockScreen(){
  try{
    if(!('wakeLock' in navigator) || wakeLock) return;
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', ()=>{ wakeLock = null; });
  }catch(e){ wakeLock = null; }
}
function unlockScreen(){ if(wakeLock){ wakeLock.release().catch(()=>{}); wakeLock = null; } }
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'visible' && playing) lockScreen(); });

/* buka izin audio browser mobile sekali, agar auto-next tanpa tap tetap bunyi */
['pointerdown','touchend','click'].forEach(ev=>document.addEventListener(ev, function unlock(){
  try{ const c = new (window.AudioContext||window.webkitAudioContext)(); c.resume(); c.close(); }catch(e){}
  ['pointerdown','touchend','click'].forEach(x=>document.removeEventListener(x, unlock, true));
}, true));
function play(){
  if(loadState === 'error' && currentRow){ const r = currentRow; currentRow = null; select(currentW, r, true); return; }
  if(!ready){ autoPlay = true; syncBtn(); return; }
  autoPlay = false;
  if(pausedAt >= total-0.05) pausedAt = 0;
  actx = actx || new (window.AudioContext||window.webkitAudioContext)();
  if(actx.state === 'suspended') actx.resume();
  playing = true; lockScreen();
  playStart = actx.currentTime - pausedAt;
  resetPtrs(pausedAt);
  for(let i=0;i<startPtr;i++){ const n = notes[i]; if(n.end > pausedAt) piano.scheduleNote({...n, dur:n.end-pausedAt}, playStart+pausedAt); }
  schedTick(pausedAt); syncBtn();
}
function pause(){
  autoPlay = false;
  if(actx) pausedAt = actx.currentTime - playStart;
  playing = false; killAudio(); unlockScreen(); syncBtn();
}
function seek(t){
  const was = playing;
  playing = false; killAudio();
  pausedAt = Math.min(Math.max(t,0), total);
  resetPtrs(pausedAt);
  if(was) play();
}

/* ---------- UI: list kecil dari WORKS ---------- */
const listEl = document.getElementById('mvList');
const statusEl = document.getElementById('mvStatus');
const slug = c => (c||'').replace(/[^a-zA-Z0-9]/g,'').toLowerCase();
const ICON_PLAY = '<svg viewBox="0 0 12 12"><path d="M3 1.5v9l7.5-4.5z"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 12 12"><path d="M2.5 1.5h2.6v9H2.5zM6.9 1.5h2.6v9H6.9z"/></svg>';
const ICON_LOAD = '<svg class="spin" viewBox="0 0 12 12"><circle cx="6" cy="6" r="4.2"/></svg>';
const ICON_REP = '<svg viewBox="0 0 12 12"><path d="M2 5.5V5a2 2 0 0 1 2-2h6M8.5 1.2 10.2 3 8.5 4.8M10 6.5V7a2 2 0 0 1-2 2H2M3.5 10.8 1.8 9l1.7-1.8"/></svg>';

const ctl = document.createElement('span'); ctl.className = 'mv-ctl';
ctl.innerHTML = '<button class="pp" type="button" aria-label="Play / Pause"></button>'
  + '<button class="rep" type="button" aria-label="Repeat">'+ICON_REP+'</button>'
  + '<a class="inf" href="#" aria-label="Halaman karya">i</a>';
const prog = document.createElement('span'); prog.className = 'mv-prog'; prog.innerHTML = '<i></i>';
const ppBtn = ctl.querySelector('.pp'), repBtn = ctl.querySelector('.rep'), infBtn = ctl.querySelector('.inf'), progFill = prog.firstChild;
const loadEl = document.createElement('div'); loadEl.className = 'mv-loading';
loadEl.innerHTML = '<div class="mv-load-txt"></div><div class="mv-load-bar"><i></i></div>';
hero.appendChild(loadEl);
const loadTxt = loadEl.firstChild, loadFill = loadEl.querySelector('i');
function setLoad(state, msg, pct){
  loadState = state;
  loadEl.classList.toggle('show', state !== 'idle');
  loadEl.classList.toggle('err', state === 'error');
  loadTxt.textContent = msg || '';
  if(pct !== undefined) loadFill.style.width = pct + '%';
  statusEl.textContent = state === 'loading' ? (msg||'loading…') : state === 'error' ? 'error' : '';
  syncBtn();
}
function syncBtn(){
  ppBtn.innerHTML = loadState === 'loading' ? ICON_LOAD : (playing ? ICON_PAUSE : ICON_PLAY);
  ppBtn.classList.toggle('busy', loadState === 'loading');
}
syncBtn();

ppBtn.addEventListener('click', e=>{ e.stopPropagation(); playing ? pause() : play(); });
repBtn.addEventListener('click', e=>{ e.stopPropagation(); loop = !loop; repBtn.classList.toggle('on', loop); });
infBtn.addEventListener('click', e=>e.stopPropagation());
ctl.addEventListener('click', e=>e.stopPropagation());
prog.addEventListener('click', e=>{
  e.stopPropagation();
  if(!total) return;
  const r = prog.getBoundingClientRect(); seek((e.clientX-r.left)/r.width*total);
});

const rows = [];
WORKS.slice().reverse().forEach(w=>{
  const row = document.createElement('div');
  const hasMidi = w.midi && w.midi !== '#';
  row.className = 'mv-row' + (hasMidi ? '' : ' is-off');
  row.innerHTML = '<span class="mv-cat">'+w.catno+'</span><span class="mv-title"></span>';
  row.querySelector('.mv-title').textContent = w.title;
  if(hasMidi) row.addEventListener('click', ()=>select(w, row));
  listEl.appendChild(row);
  rows.push({w, row});
});

let token = 0, currentRow = null;
async function select(w, row, auto){
  if(row === currentRow) return;
  const my = ++token; currentW = w;
  pause(); autoPlay = !!auto; ready = false; pausedAt = 0; total = 0; notes = []; activeSet.clear();
  setThemeNotes([]);
  if(currentRow) currentRow.classList.remove('is-active');
  currentRow = row; row.classList.add('is-active');
  row.appendChild(ctl); row.appendChild(prog);
  infBtn.href = 'w/' + slug(w.catno) + '/';
  progFill.style.width = '0%';
  setLoad('loading', 'Loading MIDI…', 0);
  try{
    // coba path persis, lalu variasi huruf besar/kecil & .mid/.midi (hosting case-sensitive)
    const m = w.midi.match(/^(.*\/)?([^\/]+?)(\.[a-z]+)?$/i), dir = m[1]||'', base = m[2];
    const cands = [w.midi]; 
    [base, base.toUpperCase(), base.toLowerCase()].forEach(b=>['.mid','.midi','.MID'].forEach(x=>cands.push(dir+b+x)));
    let res = null;
    // cadangan: langsung dari repo GitHub (raw mengizinkan CORS) bila hosting Pages belum/tidak menyajikan file
    const RAW = 'https://raw.githubusercontent.com/rinaldisign/rinaldisign.github.io/main/';
    cands.push('/' + w.midi.replace(/^\/+/, ''), RAW + w.midi.replace(/^\/+/, ''));
    for(const u of [...new Set(cands)]){
      try{ const r = await fetch(u); if(r.ok){ res = r; break; } }catch(e){}
    }
    if(!res) throw new Error('midi tidak ditemukan: '+w.midi);
    const parsed = parseMidi(await res.arrayBuffer());
    if(my !== token) return;
    notes = parsed.notes; total = parsed.duration;
    setThemeNotes(notes); resetPtrs(0);
    const r = await piano.loadSamplesForNotes(notes, (d,t)=>{
      if(my !== token) return;
      const pct = t ? Math.round(d/t*100) : 100;
      setLoad('loading', 'Loading piano samples… '+pct+'%', pct);
    });
    if(my !== token) return;
    if(r.total && r.failed === r.total) console.warn('[midi3d] semua sample piano gagal dimuat (CDN diblokir?)');
    ready = true; setLoad('idle');
    if(autoPlay) play();
  }catch(err){
    if(my === token){ setLoad('error', 'Failed to load MIDI — press play to retry'); statusEl.title = String(err && err.message || err); console.error('[midi3d]', err); }
  }
}

function playNext(){
  const list = rows.filter(r=>r.w.midi && r.w.midi !== '#');
  if(list.length < 2) return;
  const i = list.findIndex(r=>r.row === currentRow);
  const n = list[(i+1) % list.length];
  select(n.w, n.row, true);
  n.row.scrollIntoView({block:'nearest'});
}

/* ---------- manajer tema + tombol Theme ---------- */
let curNotes = [];
function setThemeNotes(n){ curNotes = n; if(theme) theme.setNotes(n); }

const loadedFiles = {}, instances = {};
function loadScript(url){
  return new Promise((res, rej)=>{
    const s = document.createElement('script');
    s.src = url; s.async = false; s.onload = res;
    s.onerror = ()=>rej(new Error('gagal memuat '+url));
    document.head.appendChild(s);
  });
}
async function ensureTheme(def){
  if(instances[def.id]) return instances[def.id];
  if(!M.themes[def.id]){
    for(const f of def.files){
      if(!loadedFiles[f]) loadedFiles[f] = loadScript(M.base + f);
      await loadedFiles[f];
    }
  }
  if(!M.themes[def.id]) throw new Error('tema tidak terdaftar: '+def.id);
  return (instances[def.id] = M.themes[def.id](ctx));
}

const menuEl = document.createElement('div');
menuEl.className = 'mv-theme';
menuEl.innerHTML =
  '<button class="mv-theme-btn" type="button" aria-haspopup="listbox" aria-expanded="false">'
  + '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.2"/><circle cx="5.2" cy="6.4" r=".9"/><circle cx="8.6" cy="4.8" r=".9"/><circle cx="11" cy="7.6" r=".9"/><path d="M8 14.2c-1.3 0-1.8-1-1.3-1.9.6-1 .2-2.1-1-2.1"/></svg>'
  + '<span>Theme</span></button>'
  + '<ul class="mv-theme-menu" role="listbox"></ul>';
const themeBtn = menuEl.querySelector('.mv-theme-btn'), themeList = menuEl.querySelector('.mv-theme-menu');
MANIFEST.forEach((d, i)=>{
  const li = document.createElement('li');
  li.setAttribute('role','option'); li.dataset.id = d.id; li.tabIndex = 0;
  li.innerHTML = '<i>'+(i+1)+'.</i><span></span><b></b>';
  li.querySelector('span').textContent = d.label;
  li.addEventListener('click', ()=>{ closeMenu(); setTheme(d.id, true); });
  li.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); li.click(); } });
  themeList.appendChild(li);
});
hero.appendChild(menuEl);
function closeMenu(){ menuEl.classList.remove('open'); themeBtn.setAttribute('aria-expanded','false'); }
themeBtn.addEventListener('click', e=>{
  e.stopPropagation();
  const o = menuEl.classList.toggle('open'); themeBtn.setAttribute('aria-expanded', String(o));
});
menuEl.addEventListener('pointerdown', e=>e.stopPropagation());
document.addEventListener('click', e=>{ if(!menuEl.contains(e.target)) closeMenu(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeMenu(); });
function markActive(){
  themeList.querySelectorAll('li').forEach(li=>{
    const on = li.dataset.id === themeId;
    li.classList.toggle('is-active', on); li.setAttribute('aria-selected', String(on));
  });
}

let themeToken = 0;
async function setTheme(id, persist){
  const def = MANIFEST.find(d=>d.id===id) || MANIFEST[0];
  if(!def || (themeId === def.id && theme)) return;
  const my = ++themeToken;
  menuEl.classList.add('busy');
  let inst;
  try{ inst = await ensureTheme(def); }
  catch(err){
    console.error('[midi3d]', err);
    menuEl.classList.remove('busy');
    if(!theme && def.id !== MANIFEST[0].id) return setTheme(MANIFEST[0].id);   // fallback ke tema pertama
    return;
  }
  if(my !== themeToken) return;
  if(theme){                                    // transisi halus antar tema
    stage.classList.add('mv-swap');
    await new Promise(r=>setTimeout(r, 220));
    if(my !== themeToken) return;
    if(theme.deactivate) theme.deactivate();
  }
  theme = inst; themeId = def.id;
  hero.dataset.mvTheme = def.id;
  hero.style.setProperty('--mv-accent', def.accent);
  hero.style.setProperty('--mv-accent-rgb', def.accentRGB);
  theme.activate();
  const {w, h} = stageSize();
  if(theme.resize) theme.resize(w, h);
  theme.setNotes(curNotes);
  activeSet.clear(); resetPtrs(pausedAt);       // kosongkan efek tema sebelumnya
  stage.classList.remove('mv-swap');
  menuEl.classList.remove('busy');
  markActive();
  if(persist){ try{ localStorage.setItem(THEME_KEY, def.id); }catch(e){} }
}
let savedTheme = null; try{ savedTheme = localStorage.getItem(THEME_KEY); }catch(e){}
setTheme(savedTheme || MANIFEST[0].id);


/* pilih otomatis karya pertama yang punya midi */
const first = rows.find(r=>r.w.midi && r.w.midi !== '#');
if(first){ select(first.w, first.row); first.row.scrollIntoView({block:'nearest'}); }

/* ---------- render loop ---------- */
let visible = true;
new IntersectionObserver(e=>{ visible = e[0].isIntersecting; }).observe(hero);

function frame(){
  requestAnimationFrame(frame);
  const nowS = performance.now()/1000, dtF = Math.min(0.1, nowS-lastFrame); lastFrame = nowS;
  stepAutoRotate(dtF);
  let t = pausedAt;
  if(playing && actx){
    t = actx.currentTime - playStart;
    schedTick(t);
    if(t >= total + 0.5){
      killAudio(); playing = false; pausedAt = total; t = total;
      if(loop){ pausedAt = 0; play(); t = 0; } else { unlockScreen(); syncBtn(); playNext(); }
    }
  }
  if(!visible || !theme) return;

  if(theme.frameStart) theme.frameStart(nowS);
  while(startPtr < notes.length && notes[startPtr].start <= t){
    if(playing && theme.noteOn) theme.noteOn(notes[startPtr], nowS);
    activeSet.add(notes[startPtr]); startPtr++;
  }
  for(const n of Array.from(activeSet)) if(n.end < t) activeSet.delete(n);

  theme.update(t, dtF, playing, activeSet, nowS);
  theme.styleKeys(activeSet, t);
  if(total) progFill.style.width = (Math.min(1, t/total)*100) + '%';
  theme.render();
}
frame();
})();
