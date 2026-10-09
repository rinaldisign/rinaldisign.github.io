/* =========================================================
   TEMA 2 — FIREWORKS
   Keyboard 3D "menembakkan" kembang api, bukan bar jatuh:

     note-on  →  roket (bola cahaya kecil + ekor api) naik dari tuts
                 • panjang ekor  = durasi note (ekor menempel di tuts selama
                   note ditahan, lalu terlepas — seperti bar Synthesia dibalik)
                 • tinggi & waktu naik: acak
     meledak  →  ukuran & jumlah percikan ∝ velocity (70%) + durasi note (30%)
                 • jenis acak: peony, chrysanthemum, willow, ring, palm, strobe
                 • kadang ledakan kedua (double-break) & inti warna lain (pistil)
     glow     →  render HDR + bloom, flash ledakan, cahaya ledakan menyinari keyboard

   Percikan dihitung di GPU (lihat shaders.js); CPU hanya menulis
   "kelahiran" percikan ke ring-buffer instance saat roket meledak.
   Background hero & lantai grid tetap yang asli.
   ========================================================= */
(function(){
'use strict';
window.MIDI3D.registerTheme('fireworks', function create(ctx){
  const { THREE, scene, camera, renderer, KEY_INFO, KB_CENTER, keyMeshes, lights, mobile } = ctx;
  const SH = window.MIDI3D.fwShaders;
  const post = window.MIDI3D.createFireworksPost(THREE, renderer, mobile);

  /* ---------- parameter yang enak di-tweak ---------- */
  const CFG = {
    pool:        mobile ? 5200 : 14000,   // maks percikan hidup bersamaan (ring buffer)
    quality:     mobile ? 0.55 : 1.0,     // pengali jumlah percikan
    gravity:     7.0,                     // unit/detik²
    bloom:       mobile ? 0.5 : 0.6,     // kekuatan glow lebar
    gain:        1.0,                     // kecerahan total
    radiusMin:   mobile ? 3.4 : 3.8,      // jari-jari ledakan terkecil (velocity rendah, note pendek)
    radiusMax:   mobile ? 11  : 13.5,     // jari-jari ledakan terbesar
    heightMin:   7,  heightMax: 16,       // tinggi ledakan (acak) di atas tuts
    riseMin:     1.0, riseMax:  1.9,      // waktu naik roket (detik, acak)
    maxBurstsPerFrame: 3,
    loadSoft:    mobile ? 1100 : 2400,    // di atas ini ledakan baru otomatis diperkecil (cegah tumpang tindih → putih)
    loadHard:    mobile ? 2200 : 4600,    // di atas ini ledakan baru hanya jadi kilatan kecil
    shedPerFrame: mobile ? 10 : 24        // percikan ekor roket per frame (total)
  };
  const rand = Math.random;
  const lerp = (a,b,t)=>a+(b-a)*t, clamp = (x,a,b)=>Math.min(b,Math.max(a,x));
  const T0 = performance.now()/1000;

  /* ---------- warna (nilai tampilan mentah; bara = warna akhir) ---------- */
  const PAL = [
    {a:[1.00,0.16,0.10], b:[0.50,0.04,0.02]},   // merah (stronsium)
    {a:[1.00,0.46,0.08], b:[0.50,0.10,0.02]},   // jingga
    {a:[1.00,0.74,0.22], b:[0.65,0.22,0.03]},   // emas
    {a:[0.28,1.00,0.32], b:[0.05,0.42,0.10]},   // hijau (barium)
    {a:[0.20,0.85,1.00], b:[0.04,0.25,0.55]},   // cyan
    {a:[0.25,0.45,1.00], b:[0.05,0.10,0.55]},   // biru (tembaga)
    {a:[0.66,0.32,1.00], b:[0.22,0.05,0.45]},   // ungu
    {a:[1.00,0.28,0.72], b:[0.50,0.05,0.28]},   // pink
    {a:[1.00,0.96,0.88], b:[0.62,0.50,0.32]}    // putih perak
  ];
  const GOLD = PAL[2];
  let lastPal = [-1,-1];
  function pickPal(){
    let i, n = 0;
    do{ i = Math.floor(rand()*PAL.length); n++; } while((i===lastPal[0] || i===lastPal[1]) && n<8);
    lastPal = [i, lastPal[0]];
    return PAL[i];
  }

  /* ---------- ring-buffer percikan (instanced quad) ---------- */
  const POOL = CFG.pool;
  const buf = {
    iOrigin: new Float32Array(POOL*3), iVel: new Float32Array(POOL*3),
    iTime: new Float32Array(POOL*4),   iColA: new Float32Array(POOL*4),
    iColB: new Float32Array(POOL*4),   iExtra: new Float32Array(POOL*4)
  };
  for(let i=0;i<POOL;i++){ buf.iTime[i*4] = -1e6; buf.iTime[i*4+1] = 1; }
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-1,-1,0, 1,-1,0, 1,1,0, -1,1,0], 3));
  geo.setIndex([0,1,2, 0,2,3]);
  const attrs = {};
  for(const k in buf){
    const n = (k==='iOrigin'||k==='iVel') ? 3 : 4;
    const a = new THREE.InstancedBufferAttribute(buf[k], n, false, 1);
    a.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute(k, a); attrs[k] = a;
  }
  geo.instanceCount = POOL;

  const mat = new THREE.ShaderMaterial({
    vertexShader: SH.sparkVert, fragmentShader: SH.sparkFrag,
    uniforms:{ uTime:{value:0}, uScale:{value:600}, uGravity:{value:CFG.gravity},
               uRes:{value:new THREE.Vector2(1,1)}, uExposure:{value:1} },
    transparent:true, depthTest:false, depthWrite:false,
    blending:THREE.CustomBlending, blendEquation:THREE.AddEquation,
    blendSrc:THREE.OneFactor, blendDst:THREE.OneFactor
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false;
  const pScene = new THREE.Scene(); pScene.add(mesh);

  let head = 0, dLo = 1e9, dHi = -1, wrapped = false, putCount = 0;
  const SPARK_KIND = {spark:0, flash:1, strobe:2, rocket:3};
  function put(ox,oy,oz, vx,vy,vz, birth, life, kind, size, ca, cb, drag, grav, trail, rate, flick){
    putCount++;
    const i = head; head = (head+1) % POOL;
    if(i === 0 && dHi >= 0) wrapped = true;
    if(i < dLo) dLo = i; if(i > dHi) dHi = i;
    let j = i*3;
    buf.iOrigin[j]=ox; buf.iOrigin[j+1]=oy; buf.iOrigin[j+2]=oz;
    buf.iVel[j]=vx;    buf.iVel[j+1]=vy;    buf.iVel[j+2]=vz;
    j = i*4;
    buf.iTime[j]=birth; buf.iTime[j+1]=life; buf.iTime[j+2]=rand(); buf.iTime[j+3]=kind;
    buf.iColA[j]=ca[0]; buf.iColA[j+1]=ca[1]; buf.iColA[j+2]=ca[2]; buf.iColA[j+3]=size;
    buf.iColB[j]=cb[0]; buf.iColB[j+1]=cb[1]; buf.iColB[j+2]=cb[2]; buf.iColB[j+3]=drag;
    buf.iExtra[j]=grav; buf.iExtra[j+1]=trail; buf.iExtra[j+2]=rate; buf.iExtra[j+3]=flick;
  }
  // flash = blob bulat lembut: intensity & decay diselipkan lewat slot grav & rate
  function flash(x,y,z, clk, life, size, ca, cb, intensity, decay){
    put(x,y,z, 0,0,0, clk, life, SPARK_KIND.flash, size, ca, cb, 0.01, intensity, 0, decay, 0);
  }
  function flush(){
    if(dHi < 0) return;
    const lo = wrapped ? 0 : dLo, hi = wrapped ? POOL-1 : dHi;
    for(const k in attrs){
      const a = attrs[k];
      a.updateRange.offset = lo*a.itemSize; a.updateRange.count = (hi-lo+1)*a.itemSize;
      a.needsUpdate = true;
    }
    dLo = 1e9; dHi = -1; wrapped = false;
  }

  /* ---------- perencanaan tiap note ---------- */
  const WHITE = [1,0.97,0.9];
  const mix3 = (a,b,t)=>[lerp(a[0],b[0],t), lerp(a[1],b[1],t), lerp(a[2],b[2],t)];
  const TYPE_NAMES = ['peony','chrys','willow','ring','palm','strobe'];
  function pickType(f, dur){
    const w = [
      lerp(.34,.20,f),                                  // peony
      lerp(.18,.28,f),                                  // chrysanthemum
      lerp(.05,.16,f) + Math.min(dur,4)*.03,            // willow (suka note panjang)
      lerp(.16,.09,f),                                  // ring
      lerp(.06,.14,f) + Math.min(dur,4)*.02,            // palm
      lerp(.18,.08,f)                                   // strobe
    ];
    let s = 0; for(const x of w) s += x;
    let r = rand()*s;
    for(let i=0;i<w.length;i++){ r -= w[i]; if(r <= 0) return TYPE_NAMES[i]; }
    return 'peony';
  }

  const live = [];        // ledakan yang masih hidup: {t, life, n} → perkiraan beban layar
  const rockets = [];     // roket yang sedang naik
  const pending = [];     // ledakan tertunda (double-break)
  const glows = [];       // cahaya ledakan → menyinari keyboard
  let lastClk = 0;

  function launch(note, clk){
    const info = KEY_INFO[note.note]; if(!info) return;
    const v = note.vel/127, d = note.dur;
    let f = 0.7*v + 0.3*Math.min(d/2.5, 1);              // 70% velocity, 30% durasi
    f = clamp(f * (0.85 + rand()*0.30), 0, 1);
    const type = pickType(f, d);
    const pal = type === 'willow' ? GOLD : pickPal();
    const pal2 = pickPal();
    const T = lerp(CFG.riseMin, CFG.riseMax, rand()) + Math.min(d, 2)*0.1;
    const H = lerp(CFG.heightMin, CFG.heightMax, rand()) + f*2;
    const R = lerp(CFG.radiusMin, CFG.radiusMax, f);
    note.fw = { r:pal.a[0], g:pal.a[1], b:pal.a[2] };    // tuts menyala sewarna ledakan

    const x = info.x - KB_CENTER, y0 = 0.65, z0 = info.black ? -1.05 : -0.4;
    const k = 1.15, dd = (1 - Math.exp(-k*T)) / k;
    const vx = (rand()-0.5)*3.2/dd, vy = H/dd, vz = -(1.5 + rand()*5.5)/dd;
    const tail = clamp(d, 0.14, T*0.97);                 // ekor = durasi note
    const colB = mix3([1.0,0.38,0.06], pal.a, 0.25);
    put(x,y0,z0, vx,vy,vz, clk, T, SPARK_KIND.rocket, 0.20, [1.0,0.92,0.64], colB, k, 0, tail, 0, 0);
    // kilatan kecil di tuts saat roket lepas
    flash(x,y0+0.2,z0, clk, 0.26, 0.9, mix3(WHITE, pal.a, 0.45), pal.b, 1.0, 1.7);
    glows.push({t:clk, x, y:2, z:z0, r:pal.a[0], g:pal.a[1], b:pal.a[2], e:0.35});

    rockets.push({ t0:clk, T, x,y0,z0, vx,vy,vz, k, tail, type, f, R, pal, pal2 });
  }

  const posAt = (r, a, out)=>{
    const d = (1 - Math.exp(-r.k*a)) / r.k;
    out[0] = r.x + r.vx*d; out[1] = r.y0 + r.vy*d; out[2] = r.z0 + r.vz*d; return out;
  };
  const P0 = [0,0,0], P1 = [0,0,0];

  /* ---------- pola ledakan ---------- */
  function sphereDirs(n, fn){
    const ph0 = rand()*6.2832;
    for(let i=0;i<n;i++){
      const y = 1 - 2*(i+0.5)/n, rr = Math.sqrt(Math.max(0, 1-y*y));
      const ph = i*2.39996323 + ph0 + (rand()-.5)*.4;
      let dx = Math.cos(ph)*rr + (rand()-.5)*.14, dy = y + (rand()-.5)*.14, dz = Math.sin(ph)*rr + (rand()-.5)*.14;
      const l = Math.hypot(dx,dy,dz) || 1;
      fn(dx/l, dy/l, dz/l, i);
    }
  }
  function shell(c, clk, R, n, ca, cb, o){
    sphereDirs(n, (dx,dy,dz)=>{
      const sp = R * o.k * lerp(o.spMin||0.9, o.spMax||1.1, rand());
      const kind = rand() < (o.strobe||0) ? SPARK_KIND.strobe : SPARK_KIND.spark;
      put(c[0],c[1],c[2], dx*sp,dy*sp,dz*sp, clk, o.life*lerp(.85,1.15,rand()), kind,
          o.size*lerp(.85,1.2,rand()), ca, cb, o.k, o.grav, o.trail, kind===2 ? 4+rand()*7 : 8+rand()*10, o.flick);
    });
  }
  function ring(c, clk, R, n, ca, cb, o){
    // bidang cincin acak
    let nx = rand()-.5, ny = rand()-.5, nz = rand()-.5; const nl = Math.hypot(nx,ny,nz)||1; nx/=nl; ny/=nl; nz/=nl;
    let ux = -nz, uy = 0, uz = nx; let ul = Math.hypot(ux,uy,uz); if(ul < 1e-3){ ux=0; uy=nz; uz=-ny; ul = Math.hypot(ux,uy,uz); }
    ux/=ul; uy/=ul; uz/=ul;
    const vx = ny*uz-nz*uy, vy = nz*ux-nx*uz, vz = nx*uy-ny*ux;
    const ph = rand()*6.2832;
    for(let i=0;i<n;i++){
      const a = ph + i/n*6.2832 + (rand()-.5)*.03;
      const ca_ = Math.cos(a), sa_ = Math.sin(a);
      const dx = ux*ca_+vx*sa_, dy = uy*ca_+vy*sa_, dz = uz*ca_+vz*sa_;
      const sp = R * o.k * lerp(.97, 1.03, rand());
      put(c[0],c[1],c[2], dx*sp,dy*sp,dz*sp, clk, o.life*lerp(.9,1.1,rand()), 0, o.size, ca, cb, o.k, o.grav, o.trail, 8+rand()*8, o.flick);
    }
  }
  function palm(c, clk, R, arms, per, ca, cb, o){
    const az0 = rand()*6.2832;
    for(let a=0;a<arms;a++){
      const az = az0 + a/arms*6.2832 + (rand()-.5)*.25, el = lerp(-0.12, 1.15, rand());
      const dx0 = Math.cos(az)*Math.cos(el), dy0 = Math.sin(el), dz0 = Math.sin(az)*Math.cos(el);
      for(let j=0;j<per;j++){
        const sp = R * o.k * lerp(.45, 1.0, per>1 ? j/(per-1) : 1) ;
        const jx = (rand()-.5)*.03, jy = (rand()-.5)*.03, jz = (rand()-.5)*.03;
        put(c[0],c[1],c[2], (dx0+jx)*sp,(dy0+jy)*sp,(dz0+jz)*sp, clk, o.life*lerp(.9,1.1,rand()), 0,
            o.size*lerp(.9,1.2,rand()), ca, cb, o.k, o.grav, o.trail, 8+rand()*8, o.flick);
      }
    }
  }

  // beban layar saat ini = jumlah percikan hidup (berbobot sisa umur)
  function liveLoad(clk){
    let L = 0;
    for(let i=live.length-1;i>=0;i--){
      const b = live[i], a = (clk - b.t)/b.life;
      if(a >= 1){ live.splice(i,1); continue; }
      L += b.n * (1 - a);
    }
    return L;
  }

  function explode(r, c, clk, spec){
    // anti "putih semua": makin padat layar, makin kecil ledakan baru
    const load = liveLoad(clk);
    const crowd = clamp((load - CFG.loadSoft) / (CFG.loadHard - CFG.loadSoft), 0, 1);   // 0 lega … 1 penuh
    const Q = CFG.quality * lerp(1, 0.22, crowd), f = spec.f, R = spec.R * lerp(1, 0.8, crowd);
    const pal = spec.pal, pal2 = spec.pal2, type = spec.type;
    const put0 = putCount;
    const cnt = (a,b)=>Math.max(8, Math.round(lerp(a,b,f)*Q));
    const size = lerp(0.105, 0.145, f);

    // flash utama + cahaya langit (cahaya langit dilewati bila layar sudah padat)
    flash(c[0],c[1],c[2], clk, 0.34, R*0.50, mix3(WHITE, pal.a, 0.5), pal.b, 0.55*lerp(1,0.5,crowd), 3.0);
    if(crowd < 0.35) flash(c[0],c[1],c[2], clk, 1.0, R*1.6, pal.a, pal.b, 0.05, 1.8);
    if(crowd >= 1){ glows.push({t:clk, x:c[0], y:c[1], z:c[2], r:pal.a[0], g:pal.a[1], b:pal.a[2], e:0.3}); return; }

    switch(type){
      case 'chrys':
        shell(c, clk, R, cnt(220,520), pal.a, pal.b, {k:1.9, life:2.7, trail:0.5, grav:1.0, size, flick:.4, strobe:.22});
        break;
      case 'willow':
        shell(c, clk, R*0.92, cnt(170,340), GOLD.a, [0.62,0.17,0.02], {k:1.3, life:3.5, trail:0.8, grav:1.35, size:size*0.95, flick:.25, spMin:.55, spMax:1.05});
        break;
      case 'ring':
        ring(c, clk, R, cnt(70,130), pal.a, pal.b, {k:2.1, life:2.6, trail:0.30, grav:1.0, size:size*1.1, flick:.3});
        if(rand() < .45) ring(c, clk, R*0.58, cnt(46,86), pal2.a, pal2.b, {k:2.1, life:2.3, trail:0.26, grav:1.0, size:size, flick:.3});
        break;
      case 'palm':
        palm(c, clk, R, 8 + Math.floor(rand()*4), Math.max(3, Math.round((6+f*4)*Math.sqrt(Q))), spec.pal.a, spec.pal.b,
             {k:1.75, life:2.8, trail:0.55, grav:0.85, size:size*1.05, flick:.3});
        break;
      case 'strobe':
        shell(c, clk, R, cnt(110,260), pal.a.map(x=>lerp(x,1,.35)), pal.b, {k:2.0, life:2.7, trail:0.08, grav:0.95, size:size*0.9, flick:0, strobe:1});
        break;
      default: // peony
        shell(c, clk, R, cnt(140,420), pal.a, pal.b, {k:2.1, life:2.5, trail:0.30, grav:1.0, size, flick:.35, strobe:0});
        if(rand() < .55)                                  // pistil: inti warna lain
          shell(c, clk, R*0.46, cnt(50,150), pal2.a, pal2.b, {k:2.1, life:2.0, trail:0.2, grav:1.0, size:size*0.9, flick:.3});
    }

    // ledakan kedua (double-break) untuk shell besar
    if(!spec.second && f > 0.55 && rand() < .5 && type !== 'ring' && type !== 'palm'){
      pending.push({ at:clk+0.18+rand()*0.12, c:[c[0],c[1],c[2]],
        spec:{ type:'peony', f:f*0.7, R:R*0.52, pal:pal2, pal2:pal, second:true }});
    }
    live.push({ t:clk, life:3.0, n:putCount - put0 });
    glows.push({t:clk, x:c[0], y:c[1], z:c[2], r:pal.a[0], g:pal.a[1], b:pal.a[2], e:(0.55 + f*1.6)*lerp(1,0.5,crowd)});
  }

  function clearAll(){
    for(let i=0;i<POOL;i++) buf.iTime[i*4] = -1e6;
    for(const k in attrs) attrs[k].needsUpdate = true;
    for(const k in attrs){ attrs[k].updateRange.offset = 0; attrs[k].updateRange.count = -1; }
    dLo = 1e9; dHi = -1; wrapped = false;
    rockets.length = 0; pending.length = 0; glows.length = 0; live.length = 0;
  }

  /* ---------- hook tema ---------- */
  // helper dev (console):  MIDI3D.fwTest(60, 110, 2.0)  → tembak 1 kembang api (note, velocity, durasi detik)
  window.MIDI3D.fwTest = (note, vel, dur)=>launch({note:note||60, vel:vel||100, dur:dur||1, start:0, end:dur||1}, performance.now()/1000 - T0);
  window.MIDI3D.fwDebug = ()=>({rockets:rockets.length, head, pending:pending.length, glows:glows.length, postOk:post.ok, w:post.width, h:post.height, t:performance.now()/1000-T0});
  const keyDefault = new THREE.Color(1,0.8,0.5);
  return {
    id:'fireworks',

    activate(){
      lights.ambient.color.setHex(0x8a96b8); lights.ambient.intensity = 0.55;
      lights.rim.color.setHex(0xffb070); lights.rim.intensity = 0; lights.rim.distance = 120;
      for(const k in keyMeshes){ keyMeshes[k].material.emissive.copy(keyDefault); }
      if(!post.ok) scene.add(mesh);
      clearAll();
    },
    deactivate(){
      if(!post.ok) scene.remove(mesh);
      lights.rim.distance = 70;
      clearAll();
    },
    setNotes(notes){ for(const n of notes) n.fw = null; },
    resize(w, h){ post.resize(w, h); },

    frameStart(){},
    noteOn(note, nowS){ launch(note, nowS - T0); },

    update(t, dt, playing, activeSet, nowS){
      const clk = nowS - T0;
      if(clk - lastClk > 2.0) clearAll();                 // tab sempat tersembunyi → jangan hamburkan ledakan tertunda
      lastClk = clk;

      let bursts = 0;
      for(let i=pending.length-1;i>=0 && bursts<CFG.maxBurstsPerFrame;i--){
        const p = pending[i];
        if(clk >= p.at){ explode(null, p.c, clk, p.spec); pending.splice(i,1); bursts++; }
      }
      let shed = CFG.shedPerFrame;
      for(let i=rockets.length-1;i>=0;i--){
        const r = rockets[i], a = clk - r.t0;
        if(a >= r.T){
          if(bursts < CFG.maxBurstsPerFrame){
            posAt(r, r.T, P0);
            explode(r, P0, r.t0 + r.T, r); bursts++; rockets.splice(i,1);
          }
          continue;
        }
        // percikan api sepanjang ekor roket
        const n = Math.min(shed, Math.floor(dt*(mobile?20:36) + rand()));
        if(n > 0){
          posAt(r, a, P0); posAt(r, Math.max(a - r.tail, 0), P1);
          for(let s=0;s<n;s++){
            const q = Math.pow(rand(), 0.7);
            const px = lerp(P1[0],P0[0],q), py = lerp(P1[1],P0[1],q), pz = lerp(P1[2],P0[2],q);
            put(px+(rand()-.5)*.12, py, pz+(rand()-.5)*.12, (rand()-.5)*1.5, -0.3-rand()*1.3, (rand()-.5)*1.5,
                clk, lerp(.45,1.0,rand()), 0, lerp(.055,.10,rand()),
                [1.0,0.66,0.26], [0.5,0.1,0.02], 1.6, 0.9, 0.10, 12, .5);
          }
          shed -= n;
        }
      }
      flush();

      // cahaya ledakan → menyinari keyboard (satu PointLight yang mengikuti ledakan terkuat)
      let E=0, cx=0,cy=0,cz=0, cr=0,cg=0,cb=0;
      for(let i=glows.length-1;i>=0;i--){
        const g = glows[i], a = clk - g.t;
        if(a > 1.8){ glows.splice(i,1); continue; }
        const w = g.e * Math.exp(-a*2.4);
        E += w; cx += g.x*w; cy += g.y*w; cz += g.z*w; cr += g.r*w; cg += g.g*w; cb += g.b*w;
      }
      if(E > 0.002){
        lights.rim.position.set(cx/E, Math.max(6, cy/E*0.6), cz/E + 6);
        lights.rim.color.setRGB(cr/E, cg/E, cb/E);
        lights.rim.intensity = Math.min(2.8, E*1.5);
      } else lights.rim.intensity = 0;

      // uniform shader
      const rw = post.ok ? post.width : renderer.domElement.width, rh = post.ok ? post.height : renderer.domElement.height;
      mat.uniforms.uExposure.value = 1 / (1 + 0.55*clamp(liveLoad(clk)/CFG.loadHard, 0, 1.5));   // layar padat → sedikit redup
      mat.uniforms.uTime.value = clk;
      mat.uniforms.uRes.value.set(rw, rh);
      mat.uniforms.uScale.value = rh / (2*Math.tan(camera.fov*Math.PI/360));
    },

    styleKeys(activeSet){
      for(const k in keyMeshes){ const m = keyMeshes[k]; m.position.y = m.userData.baseY; m.material.emissiveIntensity = 0; }
      for(const n of activeSet){
        const m = keyMeshes[n.note]; if(!m) continue;
        m.position.y = m.userData.baseY - (KEY_INFO[n.note].black ? 0.06 : 0.05);
        const c = n.fw;
        if(c) m.material.emissive.setRGB(c.r, c.g, c.b); else m.material.emissive.copy(keyDefault);
        m.material.emissiveIntensity = 0.95;
      }
    },

    render(){
      if(post.ok){
        post.renderLayer(pScene, camera);
        renderer.setRenderTarget(null);
        renderer.render(scene, camera);
        post.composite(CFG.bloom, CFG.gain);
      } else {
        renderer.render(scene, camera);
      }
    }
  };
});
})();
