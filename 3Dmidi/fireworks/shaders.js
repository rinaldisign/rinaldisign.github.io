/* =========================================================
   FIREWORKS — semua GLSL (WebGL2 via three.js).
   Percikan dihitung SEPENUHNYA di GPU secara analitik (tanpa simulasi CPU):
     posisi(a) = asal + v0 * d  −  (g/k) * (a − d)        d = (1 − e^(−k·a)) / k
   (gerak balistik dengan hambatan udara k + gravitasi g).
   Tiap percikan = 1 quad yang direntangkan dari titik-ekor ke titik-kepala
   di layar → jejak (streak) mulus & kontinu, tanpa titik-titik putus.
   ========================================================= */
(function(){
'use strict';

/* ---------- percikan / roket / flash ---------- */
const sparkVert = /* glsl */`
  attribute vec3 iOrigin;   // titik awal
  attribute vec3 iVel;      // kecepatan awal
  attribute vec4 iTime;     // birth, life, seed, kind (0 percikan, 1 flash, 2 strobe, 3 roket)
  attribute vec4 iColA;     // rgb warna utama, w = ukuran (unit dunia)
  attribute vec4 iColB;     // rgb warna akhir (bara), w = drag
  attribute vec4 iExtra;    // x gravitasi*, y panjang jejak (detik), z laju kedip (Hz) / peluruhan flash, w jumlah kedip

  uniform float uTime, uScale, uGravity;
  uniform vec2  uRes;

  varying vec2  vLocal;     // (s,u) piksel: s sepanjang ekor→kepala, u tegak lurus
  varying float vLen, vW;
  varying vec3  vColH, vColT;
  varying vec4  vFx;        // x kecerahan kepala, z kind

  vec3 posAt(float a){
    float k = max(iColB.w, 0.001);
    float d = (1.0 - exp(-k*a)) / k;
    return iOrigin + iVel*d + vec3(0.0, -uGravity*iExtra.x*(a - d)/k, 0.0);
  }
  vec3 colAt(float t){                       // putih-panas → warna utama → bara
    vec3 hot = mix(vec3(1.0,0.96,0.88), iColA.rgb, smoothstep(0.0, 0.20, t));
    return mix(hot, iColB.rgb, smoothstep(0.42, 1.0, t));
  }
  float envAt(float t){
    float o = 1.0 - smoothstep(0.50, 1.0, t);
    return smoothstep(0.0, 0.02, t) * o * o;
  }

  void main(){
    float age  = uTime - iTime.x;
    float life = iTime.y;
    float t01  = age / life;
    float kind = iTime.w;
    vFx = vec4(0.0); vColH = vec3(0.0); vColT = vec3(0.0); vLocal = vec2(0.0); vLen = 0.0; vW = 1.0;
    if(age < 0.0 || t01 >= 1.0){ gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }

    /* ---- flash: blob bulat lembut di titik ledakan ---- */
    if(kind > 0.5 && kind < 1.5){
      vec4 mv = modelViewMatrix * vec4(iOrigin, 1.0);
      if(mv.z > -0.5){ gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
      vec4 c = projectionMatrix * mv;
      float w = clamp(iColA.w * uScale / -mv.z, 4.0, 900.0);
      vec2 corner = position.xy;
      c.xy += corner * w * 2.0 / uRes * c.w;
      gl_Position = c;
      vLocal = corner * w; vW = w;
      vColH = iColA.rgb;
      vFx = vec4(iExtra.x * pow(1.0 - t01, iExtra.z) * smoothstep(0.0, 0.03, t01), 0.0, 1.0, 0.0);
      return;
    }

    /* ---- percikan / strobe / roket: streak ---- */
    float trail = iExtra.y;
    float aT    = max(age - trail, 0.0);
    vec4 mvH = modelViewMatrix * vec4(posAt(age), 1.0);
    vec4 mvT = modelViewMatrix * vec4(posAt(aT),  1.0);
    if(mvH.z > -0.5 || mvT.z > -0.5){ gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
    vec4 cH = projectionMatrix * mvH, cT = projectionMatrix * mvT;
    vec2 sH = cH.xy / cH.w * 0.5 * uRes;
    vec2 sT = cT.xy / cT.w * 0.5 * uRes;
    vec2 dv = sH - sT; float len = length(dv);
    vec2 dir = len > 0.0001 ? dv / len : vec2(1.0, 0.0);
    vec2 nrm = vec2(-dir.y, dir.x);
    float w = clamp(iColA.w * uScale / -mvH.z * 3.0, 3.0, 140.0);   // setengah lebar luar (termasuk halo)

    float s = mix(-w, len + w, position.x * 0.5 + 0.5);
    float u = position.y * w;
    vec2 pix = sT + dir*s + nrm*u;
    float zNdc = mix(cT.z / cT.w, cH.z / cH.w, clamp(s / max(len, 0.001), 0.0, 1.0));
    gl_Position = vec4(pix / (0.5 * uRes), zNdc, 1.0);

    float seed = iTime.z;
    float tT = aT / life;
    float bH, bT;
    if(kind > 2.5){                         // roket: kepala emas-putih, ekor jingga bara
      float fl = 0.85 + 0.15 * sin(age * 70.0 + seed * 60.0);
      float fade = smoothstep(0.0, 0.03, t01) * (1.0 - smoothstep(0.88, 1.0, t01));
      vColH = iColA.rgb * fl; vColT = iColB.rgb;
      bH = fade * 1.25; 
    } else if(kind > 1.5){                  // strobe: berkedip tajam
      float ph = fract(age * iExtra.z + seed);
      float blink = smoothstep(0.0, 0.06, ph) * (1.0 - smoothstep(0.28, 0.46, ph));
      float o = 1.0 - smoothstep(0.70, 1.0, t01);
      vColH = colAt(t01); vColT = colAt(tT);
      bH = smoothstep(0.0, 0.02, t01) * o * (0.12 + 0.88 * blink) * 1.15;
    } else {                                // percikan biasa (+ kedip halus di akhir hidup)
      float flick = 1.0 - iExtra.w * smoothstep(0.55, 1.0, t01) * (0.5 + 0.5 * sin(age * iExtra.z * 6.28318 + seed * 100.0));
      vColH = colAt(t01); vColT = colAt(tT);
      bH = envAt(t01) * flick * 1.15;
    }
    vLocal = vec2(s, u); vLen = len; vW = w;
    vFx = vec4(bH, 0.0, kind, 0.0);
  }
`;

const sparkFrag = /* glsl */`
  precision highp float;
  varying vec2  vLocal;
  varying float vLen, vW;
  varying vec3  vColH, vColT;
  varying vec4  vFx;
  uniform float uExposure;

  void main(){
    float kind = vFx.z;
    vec3 outc;
    if(kind > 0.5 && kind < 1.5){            // flash
      float r = length(vLocal) / vW;
      float a = exp(-r*r*4.5) * (1.0 - smoothstep(0.55, 1.0, r));
      outc = vColH * a * vFx.x;
    } else {
      float s = vLocal.x, u = vLocal.y, len = vLen;
      float dx   = max(max(-s, s - len), 0.0);
      float r    = length(vec2(dx, u)) / vW;
      float g    = len > 0.5 ? clamp(s / len, 0.0, 1.0) : 1.0;       // 0 ekor … 1 kepala
      float prof = pow(g, 1.25);
      float core = exp(-r*r*26.0);                                     // garis tipis panas
      float halo = exp(-r*r*7.0) * 0.34;
      float edge = 1.0 - smoothstep(0.72, 1.0, r);
      float hx   = (s - len) / vW, hu = u / vW;
      float head = exp(-(hx*hx + hu*hu) * 16.0);                       // titik terang di kepala
      vec3 col   = mix(vColT, vColH, g);
      vec3 hot   = mix(col, vec3(1.0), 0.3);                           // inti putih-panas
      outc  = col * halo * prof * edge;
      outc += hot * core * (0.18 + 0.82 * prof) * edge;
      outc += mix(vColH, vec3(1.0), 0.3) * head * 0.6;
      outc *= vFx.x;
    }
    outc *= uExposure;
    gl_FragColor = vec4(outc, max(max(outc.r, outc.g), outc.b));       // premultiplied
  }
`;

/* ---------- post-process: bloom (dual filter / Jimenez) ---------- */
const fsVert = /* glsl */`
  varying vec2 vUv;
  void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const bloomDown = /* glsl */`
  precision highp float;
  uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uKaris;
  varying vec2 vUv;
  vec3 S(vec2 o){ return texture2D(tSrc, vUv + o * uTexel).rgb; }
  float W(vec3 c){ return 1.0 / (1.0 + dot(c, vec3(0.2126, 0.7152, 0.0722))); }
  void main(){
    vec3 A=S(vec2(-2., 2.)), B=S(vec2(0., 2.)), C=S(vec2(2., 2.));
    vec3 D=S(vec2(-1., 1.)), E=S(vec2(1., 1.));
    vec3 F=S(vec2(-2., 0.)), G=S(vec2(0., 0.)), H=S(vec2(2., 0.));
    vec3 I=S(vec2(-1.,-1.)), J=S(vec2(1.,-1.));
    vec3 K=S(vec2(-2.,-2.)), L=S(vec2(0.,-2.)), M=S(vec2(2.,-2.));
    vec3 r;
    if(uKaris > 0.5){                       // Karis average: cegah "firefly" piksel super terang
      vec3 g0=(D+E+I+J)*0.25, g1=(A+B+F+G)*0.25, g2=(B+C+G+H)*0.25, g3=(F+G+K+L)*0.25, g4=(G+H+L+M)*0.25;
      float w0=W(g0)*0.5, w1=W(g1)*0.125, w2=W(g2)*0.125, w3=W(g3)*0.125, w4=W(g4)*0.125;
      r = (g0*w0 + g1*w1 + g2*w2 + g3*w3 + g4*w4) / (w0+w1+w2+w3+w4);
    } else {
      r = (D+E+I+J)*0.125 + (A+B+F+G)*0.03125 + (B+C+G+H)*0.03125 + (F+G+K+L)*0.03125 + (G+H+L+M)*0.03125;
    }
    gl_FragColor = vec4(r, 1.0);
  }
`;

const bloomUp = /* glsl */`
  precision highp float;
  uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uRadius;
  varying vec2 vUv;
  vec3 S(vec2 o){ return texture2D(tSrc, vUv + o * uTexel * uRadius).rgb; }
  void main(){
    vec3 r = S(vec2(-1., 1.)) + S(vec2(0., 1.))*2. + S(vec2(1., 1.))
           + S(vec2(-1., 0.))*2. + S(vec2(0., 0.))*4. + S(vec2(1., 0.))*2.
           + S(vec2(-1.,-1.)) + S(vec2(0.,-1.))*2. + S(vec2(1.,-1.));
    gl_FragColor = vec4(r / 16.0, 1.0);
  }
`;

/* tambahkan layer tajam + bloom ke canvas transparan (premultiplied, additive) */
const composite = /* glsl */`
  precision highp float;
  uniform sampler2D tLayer, tBloom; uniform float uBloom, uGain;
  varying vec2 vUv;
  void main(){
    vec3 c = texture2D(tLayer, vUv).rgb + texture2D(tBloom, vUv).rgb * uBloom;
    c *= uGain;
    c = 1.0 - exp(-c * 1.35);               // tone-map lembut: highlight menyala ke putih, warna tetap jenuh
    gl_FragColor = vec4(c, max(max(c.r, c.g), c.b));
  }
`;

window.MIDI3D.fwShaders = { sparkVert, sparkFrag, fsVert, bloomDown, bloomUp, composite };
})();
