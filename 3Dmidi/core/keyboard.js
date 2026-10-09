/* =========================================================
   Keyboard 88 tuts + lantai grid — dipakai SEMUA tema.
   MIDI3D.buildKeyboard(THREE) → { KEY_INFO, KB_CENTER, group, keyMeshes, buildGrid, C }
   ========================================================= */
(function(){
'use strict';
window.MIDI3D.buildKeyboard = function(THREE){

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

  const kbGroup = new THREE.Group();
  const whiteMat = new THREE.MeshStandardMaterial({color:0xf2ede3, roughness:.5, metalness:.05});
  const blackMat = new THREE.MeshStandardMaterial({color:0x17151b, roughness:.4, metalness:.1});
  const whiteGeo = new THREE.BoxGeometry(WHITE_W*0.97, WHITE_H, WHITE_D);
  const blackGeo = new THREE.BoxGeometry(BLACK_W, BLACK_H, BLACK_D);
  const keyMeshes = {};
  for(let n=21;n<=108;n++){
    const g = KEY_INFO[n];
    const mat = (g.black ? blackMat : whiteMat).clone();
    mat.emissive = new THREE.Color(0xffffff);   // warna emissive diatur tema aktif
    mat.emissiveIntensity = 0;
    const m = new THREE.Mesh(g.black ? blackGeo : whiteGeo, mat);
    m.position.set(g.x-KB_CENTER, g.black ? BLACK_H/2+0.001 : WHITE_H/2, g.black ? -WHITE_D/2+BLACK_D/2 : 0);
    m.userData.baseY = m.position.y;
    kbGroup.add(m); keyMeshes[n] = m;
  }

  /* ---------- ground: jaring tipis, transparan, tepi memudar (radial) ---------- */
  const GRID_STEP = 4, GRID_HALF_X = 90, GRID_Z0 = -150, GRID_Z1 = 60;
  const GRID_CX = 0, GRID_CZ = (GRID_Z0+GRID_Z1)/2, GRID_R = 88, GRID_ALPHA = 0.08;
  function buildGrid(){
    const pos = [], alp = [];
    const fade = (x,z)=>{
      const d = Math.hypot(x-GRID_CX, (z-GRID_CZ)*0.85) / GRID_R;      // 0 di tengah, 1 di tepi
      const t = Math.min(1, Math.max(0, (d-0.25)/0.75));
      return 1 - t*t*(3-2*t);                                          // smoothstep terbalik
    };
    const seg = (x0,z0,x1,z1)=>{
      pos.push(x0,0,z0, x1,0,z1); alp.push(fade(x0,z0), fade(x1,z1));
    };
    for(let z=GRID_Z0; z<=GRID_Z1; z+=GRID_STEP)
      for(let x=-GRID_HALF_X; x<GRID_HALF_X; x+=GRID_STEP) seg(x,z,x+GRID_STEP,z);
    for(let x=-GRID_HALF_X; x<=GRID_HALF_X; x+=GRID_STEP)
      for(let z=GRID_Z0; z<GRID_Z1; z+=GRID_STEP) seg(x,z,x,z+GRID_STEP);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
    geo.setAttribute('aAlpha', new THREE.Float32BufferAttribute(alp,1));
    const mat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false,
      uniforms:{ uColor:{value:new THREE.Color(0x5c8f6b)}, uOpacity:{value:GRID_ALPHA} },
      vertexShader:'attribute float aAlpha; varying float vA; void main(){ vA=aAlpha; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader:'uniform vec3 uColor; uniform float uOpacity; varying float vA; void main(){ gl_FragColor=vec4(uColor, uOpacity*vA); }'
    });
    const grid = new THREE.LineSegments(geo, mat);
    grid.position.y = -0.02; grid.renderOrder = -1;
    return grid;
  }

  return {
    KEY_INFO, KB_CENTER, group:kbGroup, keyMeshes, buildGrid,
    C:{ WHITE_W, WHITE_D, WHITE_H, BLACK_W, BLACK_D, BLACK_H }
  };
};
})();
