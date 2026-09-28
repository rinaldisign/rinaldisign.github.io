/* =========================================================
   MIDI HERO — visualizer 3D di landing page.
   Data karya diambil dari WORKS (works/js/works-data.js).
   Tambah field  midi: "midi/xxx.mid"  di karya mana pun,
   otomatis muncul & bisa diputar. File ini tidak perlu diedit.
   ========================================================= */
(function(){
'use strict';
if (typeof WORKS === 'undefined' || typeof THREE === 'undefined') return;

/* ---------- konfigurasi tampilan ---------- */
const NEON = 0x39ff14;
const FALL_SPEED = 9;   // unit dunia / detik
const HIT_Z = -6;       // posisi bar saat menyentuh tuts

/* ---------- MIDI parser ---------- */
function readVarLen(dv, pos){
  let v = 0, b;
  do{ b = dv.getUint8(pos++); v = (v<<7) | (b & 0x7f); } while(b & 0x80);
  return [v, pos];
}
function parseMidi(buffer){
  const dv = new DataView(buffer);
  let pos = 0;
  const str = n => { let s=''; for(let i=0;i<n;i++) s+=String.fromCharCode(dv.getUint8(pos+i)); pos+=n; return s; };
  if(str(4) !== 'MThd') throw new Error('Bukan file MIDI');
  const headerLen = dv.getUint32(pos); pos+=4;
  pos+=2;
  const numTracks = dv.getUint16(pos); pos+=2;
  const division = dv.getUint16(pos); pos+=2;
  pos += headerLen - 6;
  const ppq = division & 0x8000 ? 480 : division;
  const all = [];
  for(let t=0;t<numTracks;t++){
    if(str(4) !== 'MTrk') throw new Error('Track tidak valid');
    const len = dv.getUint32(pos); pos+=4;
    const end = pos+len;
    let tick = 0, running = 0;
    while(pos < end){
      let delta; [delta,pos] = readVarLen(dv,pos);
      tick += delta;
      let status = dv.getUint8(pos);
      if(status < 0x80){ status = running; } else { pos++; running = status; }
      const type = status & 0xf0, ch = status & 0x0f;
      if(status === 0xff){
        const meta = dv.getUint8(pos); pos++;
        let l; [l,pos] = readVarLen(dv,pos);
        if(meta === 0x51) all.push({tick, tempo:(dv.getUint8(pos)<<16)|(dv.getUint8(pos+1)<<8)|dv.getUint8(pos+2)});
        pos += l;
      } else if(status === 0xf0 || status === 0xf7){
        let l; [l,pos] = readVarLen(dv,pos); pos += l;
      } else if(type === 0xc0 || type === 0xd0){
        pos += 1;
      } else {
        const d1 = dv.getUint8(pos), d2 = dv.getUint8(pos+1); pos += 2;
        if(type === 0x90) all.push({tick, on:d2>0, note:d1, vel:d2, ch});
        else if(type === 0x80) all.push({tick, on:false, note:d1, vel:0, ch});
      }
    }
    pos = end;
  }
  all.sort((a,b)=>a.tick-b.tick);
  const tempoMap = [{tick:0, time:0, mpqn:500000}];
  let lt=0, lT=0, lm=500000;
  for(const e of all) if(e.tempo !== undefined){
    lT += ((e.tick-lt)/ppq) * (lm/1e6); lt = e.tick; lm = e.tempo;
    tempoMap.push({tick:lt, time:lT, mpqn:lm});
  }
  const tickToTime = tick => {
    let seg = tempoMap[0];
    for(const s of tempoMap){ if(s.tick <= tick) seg = s; else break; }
    return seg.time + ((tick-seg.tick)/ppq) * (seg.mpqn/1e6);
  };
  const active = {}, notes = [];
  for(const e of all){
    if(e.tempo !== undefined) continue;
    const key = e.ch+'-'+e.note;
    if(e.on){ active[key] = {startTick:e.tick, vel:e.vel}; }
    else if(active[key]){
      const a = active[key], s = tickToTime(a.startTick), en = tickToTime(e.tick);
      if(en > s) notes.push({note:e.note, start:s, end:en, dur:en-s, vel:a.vel});
      delete active[key];
    }
  }
  notes.sort((a,b)=>a.start-b.start);
  return {notes, duration: notes.reduce((m,n)=>Math.max(m,n.end),0)};
}

/* ---------- geometri keyboard ---------- */
const PATTERN_X = [0,0.7,1,1.7,2,3,3.6,4,4.7,5,5.7,6];
const IS_BLACK = [false,true,false,true,false,false,true,false,true,false,true,false];
const WHITE_W=1, WHITE_D=5.4, WHITE_H=0.35, BLACK_W=0.62, BLACK_D=3.3, BLACK_H=0.55;
const KEY_INFO = {};
let minX=Infinity, maxX=-Infinity;
for(let n=21;n<=108;n++){
  const pc = n%12, x = (Math.floor(n/12)-1)*7 + PATTERN_X[pc];
  KEY_INFO[n] = {x, black:IS_BLACK[pc]};
  const h = IS_BLACK[pc] ? BLACK_W/2 : WHITE_W/2;
  minX = Math.min(minX, x-h); maxX = Math.max(maxX, x+h);
}
const KB_CENTER = (minX+maxX)/2;

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
function updateCamera(){
  camera.position.set(
    Math.sin(camYaw)*camDist*Math.cos(camPitch),
    10 + camDist*Math.sin(camPitch),
    Math.cos(camYaw)*camDist*Math.cos(camPitch) - camDist*0.15 + 14
  );
  camera.lookAt(0, 2, -6);
}
function resize(){
  const w = stage.clientWidth || innerWidth, h = stage.clientHeight || innerHeight;
  camera.aspect = w/h; camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
camDist = Math.min(DIST_MAX, 34 * Math.max(1, 1.5/((stage.clientWidth||innerWidth)/(stage.clientHeight||innerHeight))));
resize(); updateCamera();
new ResizeObserver(resize).observe(stage);

scene.add(new THREE.AmbientLight(0x88aa99, 0.6));
const key1 = new THREE.DirectionalLight(0xffffff, 0.8); key1.position.set(10,30,20); scene.add(key1);
const rim = new THREE.PointLight(NEON, 0.9, 70); rim.position.set(0,10,-20); scene.add(rim);

const kbGroup = new THREE.Group();
const whiteMat = new THREE.MeshStandardMaterial({color:0xf2ede3, roughness:.5, metalness:.05});
const blackMat = new THREE.MeshStandardMaterial({color:0x17151b, roughness:.4, metalness:.1});
const whiteGeo = new THREE.BoxGeometry(WHITE_W*0.97, WHITE_H, WHITE_D);
const blackGeo = new THREE.BoxGeometry(BLACK_W, BLACK_H, BLACK_D);
const keyMeshes = {};
for(let n=21;n<=108;n++){
  const g = KEY_INFO[n];
  const mat = (g.black ? blackMat : whiteMat).clone();
  mat.emissive = new THREE.Color(NEON);
  mat.emissiveIntensity = 0;
  const m = new THREE.Mesh(g.black ? blackGeo : whiteGeo, mat);
  m.position.set(g.x-KB_CENTER, g.black ? BLACK_H/2+0.001 : WHITE_H/2, g.black ? -WHITE_D/2+BLACK_D/2 : 0);
  m.userData.baseY = m.position.y;
  kbGroup.add(m); keyMeshes[n] = m;
}
scene.add(kbGroup);

/* bar hijau neon + 2 lapis glow additive */
const barGeo = new THREE.BoxGeometry(1,1,1);
const barMat = new THREE.MeshStandardMaterial({color:NEON, emissive:NEON, emissiveIntensity:0.9, roughness:.3, metalness:0});
const glowMat1 = new THREE.MeshBasicMaterial({color:NEON, transparent:true, opacity:.2, blending:THREE.AdditiveBlending, depthWrite:false});
const glowMat2 = new THREE.MeshBasicMaterial({color:NEON, transparent:true, opacity:.07, blending:THREE.AdditiveBlending, depthWrite:false});
const noteGroup = new THREE.Group(); scene.add(noteGroup);
let noteMeshes = [];
function buildNoteMeshes(notes){
  for(const m of noteMeshes) noteGroup.remove(m);
  noteMeshes = [];
  for(const note of notes){
    const g = KEY_INFO[note.note]; if(!g) continue;
    const w = (g.black ? BLACK_W : WHITE_W) * 0.82;
    const depth = Math.max(note.dur*FALL_SPEED, 0.35);
    const h = 0.5 + (note.vel/127)*0.5;
    const m = new THREE.Mesh(barGeo, barMat);
    m.scale.set(w, h, depth);
    m.position.set(g.x-KB_CENTER, h/2 + 0.02, 0);
    const s1 = new THREE.Mesh(barGeo, glowMat1); s1.scale.set(1.5,1.5,1.03); m.add(s1);
    const s2 = new THREE.Mesh(barGeo, glowMat2); s2.scale.set(2.3,2.3,1.06); m.add(s2);
    m.userData.note = note; m.userData.depth = depth;
    noteGroup.add(m); noteMeshes.push(m);
  }
}

/* ---------- orbit & zoom ---------- */
let dragging=false, lx=0, ly=0;
stage.addEventListener('pointerdown', e=>{ dragging=true; lx=e.clientX; ly=e.clientY; });
addEventListener('pointerup', ()=>dragging=false);
addEventListener('pointermove', e=>{
  if(!dragging) return;
  camYaw += (e.clientX-lx)*0.004;
  camPitch = Math.min(1.1, Math.max(0.18, camPitch + (e.clientY-ly)*0.003));
  lx=e.clientX; ly=e.clientY; updateCamera();
});
stage.addEventListener('wheel', e=>{
  // di batas zoom-out, biarkan scroll halaman lewat
  if(e.deltaY > 0 && camDist >= DIST_MAX) return;
  e.preventDefault();
  camDist = Math.min(DIST_MAX, Math.max(DIST_MIN, camDist + e.deltaY*0.03));
  updateCamera();
}, {passive:false});

/* ---------- audio: Salamander Grand Piano (CC BY 3.0, Alexander Holm) ---------- */
let actx = null;
const decodeCtx = new (window.AudioContext||window.webkitAudioContext)();
const SAMPLE_LETTER = {0:'C',3:'D#',6:'F#',9:'A'};
const LAYERS = [{tag:'3', vel:24},{tag:'12', vel:95}];
const sampleBuffers = {};
const sampleMidiFor = n => n + ((n%12)%3===0 ? 0 : ((n%12)%3===1 ? -1 : 1));
const sampleNameFor = s => SAMPLE_LETTER[s%12] + (Math.floor(s/12)-1);

async function loadSamplesForNotes(notes){
  const needed = new Set(notes.map(n=>sampleMidiFor(n.note)));
  const tasks = [];
  for(const s of needed) for(const L of LAYERS){
    const key = L.tag+'|'+s;
    if(sampleBuffers[key]) continue;
    const url = `https://cdn.jsdelivr.net/npm/@audio-samples/piano-mp3-velocity${L.tag}/audio/${encodeURIComponent(sampleNameFor(s))}v${L.tag}.mp3`;
    tasks.push(fetch(url).then(r=>r.arrayBuffer()).then(ab=>decodeCtx.decodeAudioData(ab)).then(b=>{sampleBuffers[key]=b;}).catch(()=>{}));
  }
  await Promise.all(tasks);
}
function scheduleNote(note, when){
  if(!actx) return;
  const s = sampleMidiFor(note.note), rate = Math.pow(2,(note.note-s)/12);
  const startAt = Math.max(actx.currentTime+0.03, when);
  const relDur = Math.max(note.dur, 0.12);
  const tt = Math.min(1, Math.max(0, (note.vel-LAYERS[0].vel)/(LAYERS[1].vel-LAYERS[0].vel)));
  const amp = 0.18 + 0.82*(note.vel/127);
  const w = {[LAYERS[0].tag]: amp*(1-tt), [LAYERS[1].tag]: amp*tt};
  const master = actx.createGain(); master.connect(actx.destination);
  for(const L of LAYERS){
    const wt = w[L.tag], buf = sampleBuffers[L.tag+'|'+s];
    if(!buf || wt < 0.003) continue;
    const src = actx.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate;
    const g = actx.createGain();
    g.gain.setValueAtTime(0, startAt);
    g.gain.linearRampToValueAtTime(wt, startAt+0.005);
    const rs = startAt+relDur;
    g.gain.setValueAtTime(wt, rs);
    g.gain.exponentialRampToValueAtTime(0.0004, rs+0.4);
    src.connect(g).connect(master);
    src.start(startAt); src.stop(rs+0.45);
  }
}

/* ---------- playback ---------- */
let notes = [], total = 0, playing = false, ready = false, loop = false;
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
    scheduleNote(notes[schedPtr], playStart + notes[schedPtr].start); schedPtr++;
  }
}
function killAudio(){ if(actx){ actx.close(); actx = null; } }
function play(){
  if(!ready) return;
  if(pausedAt >= total-0.05) pausedAt = 0;
  actx = actx || new (window.AudioContext||window.webkitAudioContext)();
  if(actx.state === 'suspended') actx.resume();
  playing = true;
  playStart = actx.currentTime - pausedAt;
  resetPtrs(pausedAt);
  for(let i=0;i<startPtr;i++){ const n = notes[i]; if(n.end > pausedAt) scheduleNote({...n, dur:n.end-pausedAt}, playStart+pausedAt); }
  schedTick(pausedAt); syncBtn();
}
function pause(){
  if(actx) pausedAt = actx.currentTime - playStart;
  playing = false; killAudio(); syncBtn();
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
const ICON_REP = '<svg viewBox="0 0 12 12"><path d="M2 5.5V5a2 2 0 0 1 2-2h6M8.5 1.2 10.2 3 8.5 4.8M10 6.5V7a2 2 0 0 1-2 2H2M3.5 10.8 1.8 9l1.7-1.8"/></svg>';

const ctl = document.createElement('span'); ctl.className = 'mv-ctl';
ctl.innerHTML = '<button class="pp" type="button" aria-label="Play / Pause"></button>'
  + '<button class="rep" type="button" aria-label="Repeat">'+ICON_REP+'</button>'
  + '<a class="inf" href="#" aria-label="Halaman karya">i</a>';
const prog = document.createElement('span'); prog.className = 'mv-prog'; prog.innerHTML = '<i></i>';
const ppBtn = ctl.querySelector('.pp'), repBtn = ctl.querySelector('.rep'), infBtn = ctl.querySelector('.inf'), progFill = prog.firstChild;
function syncBtn(){ ppBtn.innerHTML = playing ? ICON_PAUSE : ICON_PLAY; }
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
  row.className = 'mv-row' + (w.midi ? '' : ' is-off');
  row.innerHTML = '<span class="mv-cat">'+w.catno+'</span><span class="mv-title"></span>';
  row.querySelector('.mv-title').textContent = w.title;
  if(w.midi) row.addEventListener('click', ()=>select(w, row));
  listEl.appendChild(row);
  rows.push({w, row});
});

let token = 0, currentRow = null;
async function select(w, row){
  if(row === currentRow) return;
  const my = ++token;
  pause(); ready = false; pausedAt = 0; total = 0; notes = []; activeSet.clear();
  buildNoteMeshes([]);
  if(currentRow) currentRow.classList.remove('is-active');
  currentRow = row; row.classList.add('is-active');
  row.appendChild(ctl); row.appendChild(prog);
  infBtn.href = 'w/' + slug(w.catno) + '/';
  progFill.style.width = '0%';
  statusEl.textContent = 'loading…';
  try{
    const res = await fetch(w.midi);
    if(!res.ok) throw new Error('404');
    const parsed = parseMidi(await res.arrayBuffer());
    if(my !== token) return;
    notes = parsed.notes; total = parsed.duration;
    buildNoteMeshes(notes); resetPtrs(0);
    await loadSamplesForNotes(notes);
    if(my !== token) return;
    ready = true; statusEl.textContent = '';
  }catch(err){
    if(my === token) statusEl.textContent = 'error';
  }
}

/* pilih otomatis karya pertama yang punya midi */
const first = rows.find(r=>r.w.midi);
if(first){ select(first.w, first.row); first.row.scrollIntoView({block:'nearest'}); }

/* ---------- render loop ---------- */
let visible = true;
new IntersectionObserver(e=>{ visible = e[0].isIntersecting; }).observe(hero);
const keyUpD = {true:0.06, false:0.05};

function frame(){
  requestAnimationFrame(frame);
  let t = pausedAt;
  if(playing && actx){
    t = actx.currentTime - playStart;
    schedTick(t);
    if(t >= total + 0.5){
      killAudio(); playing = false; pausedAt = total; t = total;
      if(loop){ pausedAt = 0; play(); t = 0; } else syncBtn();
    }
  }
  if(!visible) return;

  while(startPtr < notes.length && notes[startPtr].start <= t){ activeSet.add(notes[startPtr]); startPtr++; }
  for(const n of Array.from(activeSet)) if(n.end < t) activeSet.delete(n);

  for(const k in keyMeshes){ const m = keyMeshes[k]; m.position.y = m.userData.baseY; m.material.emissiveIntensity = 0; }
  for(const n of activeSet){
    const m = keyMeshes[n.note]; if(!m) continue;
    m.position.y = m.userData.baseY - keyUpD[KEY_INFO[n.note].black];
    m.material.emissiveIntensity = 1;
  }
  for(const m of noteMeshes){
    const n = m.userData.note;
    const zF = (n.start - t) * FALL_SPEED, zB = zF + m.userData.depth;
    m.position.z = HIT_Z - (zF+zB)/2;
    m.visible = zB > -2 && zF < 60;
  }
  if(total) progFill.style.width = (Math.min(1, t/total)*100) + '%';
  renderer.render(scene, camera);
}
frame();
})();
