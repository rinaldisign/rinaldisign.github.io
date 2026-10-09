/* =========================================================
   TEMA 1 — NEON GREEN  (tampilan asli: bar hijau jatuh + kunang-kunang)
   Isi tema ini dipindahkan apa adanya dari js/midi-hero.js lama.
   Hook yang diimplementasi: activate, deactivate, setNotes, frameStart,
   noteOn, update, styleKeys, render.
   ========================================================= */
(function(){
'use strict';
window.MIDI3D.registerTheme('neon-green', function create(ctx){
  const { THREE, scene, camera, renderer, KEY_INFO, KB_CENTER, keyMeshes, HIT_Z, FALL_SPEED, lights } = ctx;
  const { WHITE_W, BLACK_W } = ctx.kb.C;
  const NEON = 0x39ff14;
  const keyUpD = {true:0.06, false:0.05};

  /* bar hijau neon + 2 lapis glow additive */
  const barGeo = new THREE.BoxGeometry(1,1,1);
  const barMat = new THREE.MeshStandardMaterial({color:NEON, emissive:NEON, emissiveIntensity:0.9, roughness:.3, metalness:0});
  const glowMat1 = new THREE.MeshBasicMaterial({color:NEON, transparent:true, opacity:.2, blending:THREE.AdditiveBlending, depthWrite:false});
  const glowMat2 = new THREE.MeshBasicMaterial({color:NEON, transparent:true, opacity:.07, blending:THREE.AdditiveBlending, depthWrite:false});
  const noteGroup = new THREE.Group(); 
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

  /* ---------- kunang-kunang: muncul halus saat note menyentuh tuts ---------- */
  const FLY_MOBILE = matchMedia('(pointer:coarse)').matches || innerWidth < 768;
  const FLY_N = FLY_MOBILE ? 240 : 480;            // ukuran pool partikel
  const FLY_BUDGET = FLY_MOBILE ? 8 : 16;          // maks partikel baru per frame
  const FLY_T0 = performance.now()/1000;
  const flyPos = new Float32Array(FLY_N*3);
  const flyData = new Float32Array(FLY_N*4);       // birth, life, seed, size
  for(let i=0;i<FLY_N;i++) flyData[i*4] = -1e4;
  const flyGeo = new THREE.BufferGeometry();
  const flyPosAttr = new THREE.BufferAttribute(flyPos, 3);
  const flyDataAttr = new THREE.BufferAttribute(flyData, 4);
  flyGeo.setAttribute('position', flyPosAttr);
  flyGeo.setAttribute('aData', flyDataAttr);
  const flyMat = new THREE.ShaderMaterial({
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    uniforms:{ uTime:{value:0}, uScale:{value:600} },
    vertexShader:`
      attribute vec4 aData;
      uniform float uTime, uScale;
      varying float vAlpha; varying vec3 vColor;
      void main(){
        float life = aData.y, seed = aData.z, size = aData.w;
        float age = uTime - aData.x, t = age/life;
        if(t < 0. || t > 1.){ gl_Position = vec4(2.,2.,2.,1.); gl_PointSize = 0.; vAlpha = 0.; vColor = vec3(0.); return; }
        float r1 = fract(seed*17.13), r2 = fract(seed*91.7), r3 = fract(seed*53.3), r4 = fract(seed*7.77);
        float ph = seed*40., ph2 = seed*23.;
        vec3 p = position;
        p.y += (0.30 + 0.45*r1) * age * (1. - 0.45*t);
        p.y += (sin(age*1.3 + ph2) - sin(ph2)) * 0.10;
        float w = 0.55 + r2*0.7, amp = 0.30 + 0.40*r3;
        p.x += (sin(age*w + ph) - sin(ph)) * amp;
        p.z += (cos(age*(w*0.8) + ph2) - cos(ph2)) * amp * 0.8;
        float blink = 0.5 + 0.5*sin(age*(2.0 + r4*2.6) + ph);
        blink = 0.25 + 0.75*blink*blink;
        float env = smoothstep(0.0, 0.14, t) * (1. - smoothstep(0.5, 1.0, t));
        vAlpha = env * blink * 0.75;
        vColor = mix(vec3(0.80,1.0,0.42), vec3(0.30,1.0,0.16), r2);
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = min(size * uScale / -mv.z, 48.);
      }`,
    fragmentShader:`
      varying float vAlpha; varying vec3 vColor;
      void main(){
        float d = length(gl_PointCoord - 0.5) * 2.;
        float a = exp(-d*d*5.) * (1. - smoothstep(0.8, 1.0, d)) + exp(-d*d*28.) * 0.55;
        gl_FragColor = vec4(vColor, a * vAlpha);
      }`
  });
  const flyPoints = new THREE.Points(flyGeo, flyMat);
  flyPoints.frustumCulled = false;
  let flyHead = 0, flyBudget = FLY_BUDGET, flyDirty = false;
  function emitFireflies(note, now){
    const g = KEY_INFO[note.note]; if(!g) return;
    const cnt = FLY_MOBILE ? 2 + (Math.random() < note.vel/127 ? 1 : 0)
                           : 3 + Math.floor(Math.random()*(1 + note.vel/127*2));
    const x = g.x - KB_CENTER;
    for(let k=0;k<cnt && flyBudget>0;k++, flyBudget--){
      const i = flyHead; flyHead = (flyHead+1) % FLY_N;
      flyPos[i*3]   = x + (Math.random()-0.5)*0.6;
      flyPos[i*3+1] = 0.6 + Math.random()*0.3;
      flyPos[i*3+2] = HIT_Z + Math.random()*3.2;
      flyData[i*4]   = now;
      flyData[i*4+1] = 2.6 + Math.random()*2.4;
      flyData[i*4+2] = Math.random();
      flyData[i*4+3] = 0.28 + Math.random()*0.32;
      flyDirty = true;
    }
  }

  /* ---------- hook tema ---------- */
  return {
    id:'neon-green',

    activate(){
      lights.rim.color.setHex(NEON); lights.rim.intensity = 0.9;
      lights.ambient.color.setHex(0x88aa99); lights.ambient.intensity = 0.6;
      for(const k in keyMeshes){ keyMeshes[k].material.emissive.setHex(NEON); }
      scene.add(noteGroup); scene.add(flyPoints);
    },
    deactivate(){
      scene.remove(noteGroup); scene.remove(flyPoints);
    },
    setNotes(notes){ buildNoteMeshes(notes); },

    frameStart(){ flyBudget = FLY_BUDGET; flyDirty = false; },
    noteOn(note /*, nowS */){ emitFireflies(note, performance.now()/1000 - FLY_T0); },

    update(t, dt, playing, activeSet){
      const flyNow = performance.now()/1000 - FLY_T0;
      if(flyDirty){ flyPosAttr.needsUpdate = true; flyDataAttr.needsUpdate = true; }
      flyMat.uniforms.uTime.value = flyNow;
      flyMat.uniforms.uScale.value = renderer.domElement.height / (2*Math.tan(camera.fov*Math.PI/360));
      for(const m of noteMeshes){
        const n = m.userData.note;
        const zF = (n.start - t) * FALL_SPEED, zB = zF + m.userData.depth;
        m.position.z = HIT_Z - (zF+zB)/2;
        m.visible = zB > -2 && zF < 60;
      }
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
