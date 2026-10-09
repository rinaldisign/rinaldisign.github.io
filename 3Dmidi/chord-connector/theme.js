/* =========================================================
   TEMA 3 — CHORD CONNECTOR
   88 nama not (A0 … C8) = 88 gelembung hijau neon yang tersusun seperti
   molekul (bola-dan-batang): ada "ikatan" tipis beropacity rendah, seluruh
   molekul berputar & tiap gelembung mengambang acak, semuanya pelan.

     • 1 not ditekan   → hanya gelembungnya yang menyala + nama not muncul di dalamnya
                          (TIDAK ada benang)
     • 2+ not bersamaan → benang tipis menghubungkan SEMUA gelembung yang ditekan
                          (tiap pasangan), misal 3 not = segitiga

   Posisi gelembung dihitung di CPU tiap frame (88 titik, murah);
   tampilan gelembung (cincin kaca, glow, riak, teks) digambar di shader.
   Parameter yang enak di-tweak ada di objek CFG.
   ========================================================= */
(function(){
'use strict';
window.MIDI3D.registerTheme('chord-connector', function create(ctx){
  const { THREE, scene, camera, renderer, keyMeshes, KEY_INFO, lights } = ctx;
  const NEON = 0x39ff14;

  const CFG = {
    bubbleR:     1.15,     // jari-jari gelembung (unit dunia)
    center:      [0, 13.5, -8], // pusat molekul
    spreadX:     23,       // lebar sebaran (nada rendah ←→ tinggi)
    minDist:     4.1,      // jarak minimum antar gelembung
    bondMaxDist: 7.6,      // ikatan hanya antar gelembung yang cukup dekat
    spin:        0.07,     // rad/detik, putaran VERTIKAL (poros = sumbu panjang, sejajar keyboard)
    tilt:        0.05,     // rad, goyangan miring sangat kecil (panjang tetap sejajar keyboard)
    radiusMax:   8.8,      // batas jari-jari sebaran di y/z → saat berputar tidak pernah menembus keyboard
    driftAmp:    [0.55, 1.0],   // amplitudo gerak acak tiap gelembung
    driftSpeed:  [0.10, 0.32],  // rad/detik
    idleAlpha:   0.60,     // kecerahan gelembung saat idle
    idleLabel:   0.0,      // 0 = nama not hanya muncul saat ditekan (mis. 0.12 = samar selalu)
    bondAlpha:   [0.16, 0.28],  // opacity ikatan idle
    threadAlpha: 0.95,     // opacity benang akor
    maxChord:    14        // maks not yang dihubungkan benang
  };

  const N = 88, FIRST = 21;
  const NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const noteName = n => NAMES[n%12] + (Math.floor(n/12)-1);       // 21 → A0 … 108 → C8
  const lerp = (a,b,t)=>a+(b-a)*t;

  /* ---------- RNG deterministik: susunan molekul sama tiap kali dibuka ---------- */
  function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  const rnd = mulberry32(8808);
  const gauss = ()=> (rnd()+rnd()+rnd()-1.5)/0.75;

  /* ---------- susunan 3D: urutan nada kiri→kanan, tapi tersebar seperti molekul ---------- */
  const base = [];   // posisi relatif terhadap pusat
  for(let i=0;i<N;i++){
    base.push([ lerp(-CFG.spreadX, CFG.spreadX, i/(N-1)) + gauss()*1.2, gauss()*4.4, gauss()*6.8 ]);
  }
  for(let it=0; it<90; it++){
    for(let i=0;i<N;i++) for(let j=i+1;j<N;j++){
      const a = base[i], b = base[j];
      const dx=b[0]-a[0], dy=b[1]-a[1], dz=b[2]-a[2];
      const d = Math.hypot(dx,dy,dz) || 0.001;
      if(d < CFG.minDist){
        const push = (CFG.minDist-d)*0.5/d;
        a[0]-=dx*push; a[1]-=dy*push; a[2]-=dz*push;
        b[0]+=dx*push; b[1]+=dy*push; b[2]+=dz*push;
      }
    }
    for(let i=0;i<N;i++){                             // pegas: jaga urutan x & kompak di y/z
      const p = base[i], tx = lerp(-CFG.spreadX, CFG.spreadX, i/(N-1));
      p[0] += (tx-p[0])*0.08; p[1] *= 0.992; p[2] *= 0.992;
      const rr = Math.hypot(p[1], p[2]);
      if(rr > CFG.radiusMax){ const k = CFG.radiusMax/rr; p[1] *= k; p[2] *= k; }
    }
  }

  /* ---------- ikatan (batang molekul): 2–3 tetangga terdekat ---------- */
  const bonds = [], seen = new Set();
  for(let i=0;i<N;i++){
    const nb = [];
    for(let j=0;j<N;j++) if(j!==i) nb.push([j, Math.hypot(base[i][0]-base[j][0], base[i][1]-base[j][1], base[i][2]-base[j][2])]);
    nb.sort((p,q)=>p[1]-q[1]);
    const k = rnd() < 0.4 ? 3 : 2;
    for(let m=0, c=0; m<nb.length && c<k; m++){
      if(nb[m][1] > CFG.bondMaxDist && c>0) break;
      const a = Math.min(i,nb[m][0]), b = Math.max(i,nb[m][0]), key = a*100+b;
      if(!seen.has(key)){ seen.add(key); bonds.push([a,b]); }
      c++;
    }
  }

  /* ---------- gerak acak tiap gelembung ---------- */
  const drift = [];
  for(let i=0;i<N;i++) drift.push({
    amp: lerp(CFG.driftAmp[0], CFG.driftAmp[1], rnd()),
    w: [0,1,2].map(()=>lerp(CFG.driftSpeed[0], CFG.driftSpeed[1], rnd())),
    ph: [0,1,2].map(()=>rnd()*6.2832)
  });

  /* ---------- atlas teks: 88 nama not ---------- */
  const COLS = 11, ROWS = 8, CELL = 128;
  const cv = document.createElement('canvas'); cv.width = COLS*CELL; cv.height = ROWS*CELL;
  const g2 = cv.getContext('2d');
  g2.fillStyle = '#000'; g2.fillRect(0,0,cv.width,cv.height);
  g2.fillStyle = '#fff'; g2.textAlign = 'center'; g2.textBaseline = 'middle';
  g2.font = '700 54px "Manrope","Helvetica Neue",Arial,sans-serif';
  for(let i=0;i<N;i++){
    g2.fillText(noteName(FIRST+i), (i%COLS+0.5)*CELL, (Math.floor(i/COLS)+0.5)*CELL + 3);
  }
  const atlas = new THREE.CanvasTexture(cv);
  atlas.flipY = false; atlas.generateMipmaps = true;
  atlas.minFilter = THREE.LinearMipmapLinearFilter; atlas.magFilter = THREE.LinearFilter;
  atlas.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  /* ---------- gelembung (instanced billboard) ---------- */
  const iPos  = new Float32Array(N*3);
  const iAct  = new Float32Array(N*4);        // glow, held, velocity, waktu note-on terakhir
  const iMeta = new Float32Array(N*4);        // kolom atlas, baris atlas, seed, sharp?
  for(let i=0;i<N;i++){
    const n = FIRST+i;
    iMeta[i*4]=i%COLS; iMeta[i*4+1]=Math.floor(i/COLS); iMeta[i*4+2]=rnd(); iMeta[i*4+3]=NAMES[n%12].length>1 ? 1 : 0;
    iAct[i*4+3] = -1e6;
  }
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-1,-1,0, 1,-1,0, 1,1,0, -1,1,0], 3));
  geo.setIndex([0,1,2, 0,2,3]);
  const posAttr = new THREE.InstancedBufferAttribute(iPos, 3, false, 1).setUsage(THREE.DynamicDrawUsage);
  const actAttr = new THREE.InstancedBufferAttribute(iAct, 4, false, 1).setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('iPos', posAttr);
  geo.setAttribute('iAct', actAttr);
  geo.setAttribute('iMeta', new THREE.InstancedBufferAttribute(iMeta, 4, false, 1));
  geo.instanceCount = N;

  const additive = { transparent:true, depthTest:true, depthWrite:false, blending:THREE.CustomBlending,
                     blendEquation:THREE.AddEquation, blendSrc:THREE.OneFactor, blendDst:THREE.OneFactor };

  const bubbleMat = new THREE.ShaderMaterial(Object.assign({
    uniforms:{ uTime:{value:0}, uScale:{value:600}, uR:{value:CFG.bubbleR}, uRes:{value:new THREE.Vector2(1,1)},
               uAtlas:{value:atlas}, uGrid:{value:new THREE.Vector2(COLS,ROWS)},
               uNeon:{value:new THREE.Color(NEON)}, uIdle:{value:CFG.idleAlpha}, uLabelIdle:{value:CFG.idleLabel} },
    vertexShader: /* glsl */`
      attribute vec3 iPos; attribute vec4 iAct; attribute vec4 iMeta;
      uniform float uTime, uScale, uR; uniform vec2 uRes;
      varying vec2 vP; varying vec4 vAct; varying vec4 vMeta;
      const float PAD = 2.4;
      void main(){
        vec4 mv = modelViewMatrix * vec4(iPos, 1.0);
        vAct = iAct; vMeta = iMeta; vP = vec2(0.0);
        if(mv.z > -0.5){ gl_Position = vec4(2.0,2.0,2.0,1.0); return; }
        float breathe = 1.0 + 0.035*sin(uTime*0.9 + iMeta.z*40.0);
        float sc = (1.0 + 0.38*iAct.x*(0.65 + 0.35*iAct.z)) * breathe;
        vec4 c = projectionMatrix * mv;
        float rpx = uR * sc * uScale / -mv.z;                 // jari-jari gelembung dalam piksel
        c.xy += position.xy * rpx * PAD * 2.0 / uRes * c.w;
        gl_Position = c;
        vP = position.xy * PAD;                               // satuan: jari-jari gelembung
      }`,
    fragmentShader: /* glsl */`
      precision highp float;
      varying vec2 vP; varying vec4 vAct; varying vec4 vMeta;
      uniform sampler2D uAtlas; uniform vec2 uGrid; uniform vec3 uNeon;
      uniform float uTime, uIdle, uLabelIdle;
      void main(){
        float r = length(vP);
        float g = vAct.x, vel = vAct.z;
        vec3 base = mix(uNeon, vec3(0.50,1.0,0.78), vMeta.w*0.5);        // not kromatik sedikit lebih mint

        float inside = 1.0 - smoothstep(0.95, 1.0, r);
        float ring   = smoothstep(0.78, 0.96, r) * (1.0 - smoothstep(0.98, 1.04, r));
        float fill   = inside * (0.03 + 0.06*r*r);                        // tepi lebih terang (kaca)
        vec2  sp     = vP - vec2(-0.36, 0.40);
        float spec   = exp(-dot(sp,sp)*14.0) * inside;                    // kilau kecil

        vec3 col = (base*(ring*0.75 + fill) + vec3(0.9,1.0,0.9)*spec*0.28) * uIdle;

        // menyala saat ditekan
        float k = 0.7 + 0.5*vel;
        float core = inside * (0.22 + 0.50*(1.0 - r*r)) * g * k;
        float halo = (1.0 - inside) * exp(-max(r-1.0, 0.0)*2.7) * g * 0.8 * k;
        col += base * (core + halo + ring*g*1.1);
        col += vec3(0.85,1.0,0.85) * spec * g * 0.8;

        // riak saat note-on
        float age = uTime - vAct.w;
        if(age > 0.0 && age < 0.9){
          float rr = 1.0 + age*1.5, w = 0.05 + 0.10*age;
          float d = (r - rr)/w;
          col += base * exp(-d*d) * (1.0 - age/0.9) * (0.40 + 0.45*vel);
        }

        // nama not di dalam gelembung
        vec2 lq = vP/1.24 + 0.5;
        float inBox = step(0.0, lq.x)*step(lq.x, 1.0)*step(0.0, lq.y)*step(lq.y, 1.0);
        vec2 lc = clamp(lq, 0.0, 1.0);
        vec2 uv = vec2((vMeta.x + lc.x)/uGrid.x, (vMeta.y + 1.0 - lc.y)/uGrid.y);
        float t = texture2D(uAtlas, uv).r * inBox;
        col += mix(vec3(1.0), base, 0.22) * t * max(g, uLabelIdle) * (0.9 + 0.4*vel);

        gl_FragColor = vec4(col, max(max(col.r, col.g), col.b));
      }`
  }, additive));
  const bubbles = new THREE.Mesh(geo, bubbleMat); bubbles.frustumCulled = false; bubbles.renderOrder = 3;

  /* ---------- garis: ikatan idle & benang akor ---------- */
  const lineVert = /* glsl */`attribute float aA; varying float vA;
    void main(){ vA = aA; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
  const lineFrag = /* glsl */`precision highp float; uniform vec3 uColor; varying float vA;
    void main(){ vec3 c = uColor * vA; gl_FragColor = vec4(c, vA); }`;
  const mkLines = (maxVerts, color)=>{
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(maxVerts*3), a = new Float32Array(maxVerts);
    g.setAttribute('position', new THREE.BufferAttribute(p,3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aA', new THREE.BufferAttribute(a,1).setUsage(THREE.DynamicDrawUsage));
    const m = new THREE.ShaderMaterial(Object.assign({ vertexShader:lineVert, fragmentShader:lineFrag,
      uniforms:{ uColor:{value:new THREE.Color(color)} } }, additive));
    const o = new THREE.LineSegments(g, m); o.frustumCulled = false;
    return { obj:o, geo:g, p, a };
  };
  const bondLines = mkLines(bonds.length*2, 0x39ff14); bondLines.obj.renderOrder = 1;
  const bondBase = bonds.map(()=>lerp(CFG.bondAlpha[0], CFG.bondAlpha[1], rnd()));
  bondLines.geo.setDrawRange(0, bonds.length*2);

  const SEG = 14, MAXP = CFG.maxChord*(CFG.maxChord-1)/2;
  const threadLines = mkLines(MAXP*SEG*2, 0xb8ff9a); threadLines.obj.renderOrder = 2;
  threadLines.geo.setDrawRange(0, 0);

  /* ---------- state ---------- */
  const glow = new Float32Array(N), held = new Float32Array(N), vel = new Float32Array(N);
  const T0 = performance.now()/1000;
  const wp = new Float32Array(N*3);              // posisi dunia hasil animasi

  function updatePositions(clk){
    // putar HANYA mengelilingi sumbu X (sumbu panjang molekul = arah keyboard): gelembung naik-turun & maju-mundur,
    // sebaran tetap memanjang kiri-kanan dan tidak menyilang keyboard
    const ph = clk*CFG.spin, rl = CFG.tilt*Math.sin(clk*0.07 + 1.0);
    const cx = Math.cos(ph), sx = Math.sin(ph), cz = Math.cos(rl), sz = Math.sin(rl);
    for(let i=0;i<N;i++){
      const b = base[i], d = drift[i];
      let x = b[0] + d.amp*Math.sin(clk*d.w[0]+d.ph[0]);
      let y = b[1] + d.amp*Math.sin(clk*d.w[1]+d.ph[1]);
      let z = b[2] + d.amp*Math.sin(clk*d.w[2]+d.ph[2]);
      const y1 = y*cx - z*sx, z2 = y*sx + z*cx;           // putar sumbu X
      const x2 = x*cz - y1*sz, y2 = x*sz + y1*cz;         // goyang kecil sumbu Z
      wp[i*3]   = CFG.center[0] + x2;
      wp[i*3+1] = CFG.center[1] + y2;
      wp[i*3+2] = CFG.center[2] + z2;
    }
    iPos.set(wp); posAttr.needsUpdate = true;
  }

  function updateBonds(clk){
    const p = bondLines.p, a = bondLines.a;
    for(let k=0;k<bonds.length;k++){
      const i = bonds[k][0], j = bonds[k][1];
      p[k*6]=wp[i*3]; p[k*6+1]=wp[i*3+1]; p[k*6+2]=wp[i*3+2];
      p[k*6+3]=wp[j*3]; p[k*6+4]=wp[j*3+1]; p[k*6+5]=wp[j*3+2];
      const al = bondBase[k] * (0.85 + 0.15*Math.sin(clk*0.7 + k));
      a[k*2] = al; a[k*2+1] = al;
    }
    bondLines.geo.attributes.position.needsUpdate = true; bondLines.geo.attributes.aA.needsUpdate = true;
  }

  const chord = [];
  function updateThreads(clk){
    chord.length = 0;
    for(let i=0;i<N && chord.length<CFG.maxChord;i++) if(held[i] > 0.04) chord.push(i);
    const p = threadLines.p, a = threadLines.a;
    let v = 0;
    if(chord.length >= 2){                              // benang hanya bila ≥ 2 not
      const R = CFG.bubbleR;
      for(let m=0;m<chord.length;m++) for(let n=m+1;n<chord.length;n++){
        const i = chord[m], j = chord[n];
        const ax=wp[i*3], ay=wp[i*3+1], az=wp[i*3+2], bx=wp[j*3], by=wp[j*3+1], bz=wp[j*3+2];
        let dx=bx-ax, dy=by-ay, dz=bz-az; const len = Math.hypot(dx,dy,dz) || 1;
        dx/=len; dy/=len; dz/=len;
        const sA = R*(1+0.38*glow[i]), sB = R*(1+0.38*glow[j]);          // mulai dari tepi gelembung
        const x0=ax+dx*sA, y0=ay+dy*sA, z0=az+dz*sA, x1=bx-dx*sB, y1=by-dy*sB, z1=bz-dz*sB;
        const L = Math.max(0.01, len - sA - sB);
        const sag = 0.05*L, seed = (i*7+j*13)%17;
        const al = Math.min(held[i], held[j]) * CFG.threadAlpha;
        let px=x0, py=y0, pz=z0;
        for(let s=1;s<=SEG;s++){
          const t = s/SEG, w = Math.sin(Math.PI*t);
          const wob = 0.18*Math.sin(clk*1.4 + t*7 + seed)*w;
          const nx = lerp(x0,x1,t) + wob*0.6;
          const ny = lerp(y0,y1,t) - sag*w + wob;
          const nz = lerp(z0,z1,t) + wob*0.6;
          const o = v*3;
          p[o]=px; p[o+1]=py; p[o+2]=pz; p[o+3]=nx; p[o+4]=ny; p[o+5]=nz;
          a[v] = a[v+1] = al * (0.55 + 0.45*w);                       // ujung lebih redup, tengah lebih terang
          px=nx; py=ny; pz=nz; v += 2;
        }
      }
    }
    threadLines.geo.setDrawRange(0, v);
    threadLines.geo.attributes.position.needsUpdate = true; threadLines.geo.attributes.aA.needsUpdate = true;
  }

  const keyUpD = {true:0.06, false:0.05};
  const tgt = new Float32Array(N), tv = new Float32Array(N);

  return {
    id:'chord-connector',

    activate(){
      lights.rim.color.setHex(NEON); lights.rim.intensity = 0.9;
      lights.ambient.color.setHex(0x88aa99); lights.ambient.intensity = 0.6;
      for(const k in keyMeshes) keyMeshes[k].material.emissive.setHex(NEON);
      glow.fill(0); held.fill(0); vel.fill(0);
      scene.add(bondLines.obj, threadLines.obj, bubbles);
    },
    deactivate(){ scene.remove(bondLines.obj, threadLines.obj, bubbles); },
    setNotes(){},

    noteOn(note, nowS){
      const i = note.note - FIRST; if(i<0 || i>=N) return;
      iAct[i*4+3] = nowS - T0;                          // memicu riak
    },

    update(t, dt, playing, activeSet, nowS){
      const clk = nowS - T0;
      tgt.fill(0); tv.fill(0);
      for(const n of activeSet){
        const i = n.note - FIRST; if(i<0 || i>=N) continue;
        tgt[i] = 1; tv[i] = Math.max(tv[i], n.vel/127);
      }
      // helper dev (console):  MIDI3D.ccHold = [60,64,67]  → tahan akor tanpa memutar lagu;  MIDI3D.ccHold = null → lepas
      if(window.MIDI3D.ccHold) for(const nn of window.MIDI3D.ccHold){ const i = nn - FIRST; if(i>=0 && i<N){ tgt[i] = 1; tv[i] = 0.8; } }
      const aUp = 1-Math.exp(-dt*18), aDn = 1-Math.exp(-dt*2.2);       // glow: naik cepat, turun pelan
      const hUp = 1-Math.exp(-dt*30), hDn = 1-Math.exp(-dt*14);        // benang: naik/turun cepat
      for(let i=0;i<N;i++){
        glow[i] += (tgt[i]-glow[i]) * (tgt[i] > glow[i] ? aUp : aDn);
        held[i] += (tgt[i]-held[i]) * (tgt[i] > held[i] ? hUp : hDn);
        if(tgt[i] > 0) vel[i] = tv[i];
        iAct[i*4] = glow[i]; iAct[i*4+1] = held[i]; iAct[i*4+2] = vel[i];
      }
      actAttr.needsUpdate = true;

      updatePositions(clk);
      updateBonds(clk);
      updateThreads(clk);

      bubbleMat.uniforms.uTime.value = clk;
      bubbleMat.uniforms.uRes.value.set(renderer.domElement.width, renderer.domElement.height);
      bubbleMat.uniforms.uScale.value = renderer.domElement.height / (2*Math.tan(camera.fov*Math.PI/360));
    },

    styleKeys(activeSet){
      for(const k in keyMeshes){ const m = keyMeshes[k]; m.position.y = m.userData.baseY; m.material.emissiveIntensity = 0; }
      for(const n of activeSet){
        const m = keyMeshes[n.note]; if(!m) continue;
        m.position.y = m.userData.baseY - keyUpD[KEY_INFO[n.note].black];
        m.material.emissiveIntensity = 1;
      }
    },

    render(){ renderer.render(scene, camera); }
  };
});
})();
