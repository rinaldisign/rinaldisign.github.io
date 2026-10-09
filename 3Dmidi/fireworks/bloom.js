/* =========================================================
   FIREWORKS — pipeline glow.
   1. Percikan digambar ke render target HDR (half-float) → nilai bisa > 1,
      jadi ledakan besar benar-benar "menyilaukan" seperti kamera sungguhan.
   2. Bloom dual-filter (downsample 13-tap + upsample tent) → glow lebar & halus.
   3. Hasil (tajam + bloom) DITAMBAHKAN ke canvas transparan secara premultiplied,
      jadi background hero asli tetap terlihat di belakangnya.
   Bila perangkat tak mendukung render HDR, `ok=false` dan tema memakai jalur cadangan
   (gambar langsung ke canvas, tanpa bloom).
   ========================================================= */
(function(){
'use strict';
window.MIDI3D.createFireworksPost = function(THREE, renderer, mobile){
  const SH = window.MIDI3D.fwShaders;
  const gl = renderer.getContext();
  const isGL2 = renderer.capabilities.isWebGL2;
  const hdr = isGL2 && !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
  const ok = isGL2;                                   // butuh WebGL2 (half-float + filter linear bawaan)
  const MAX_H = mobile ? 900 : 1400;                  // batas tinggi layer (piksel) demi performa
  const LEVELS = mobile ? 4 : 5;

  const rtOpts = { type: hdr ? THREE.HalfFloatType : THREE.UnsignedByteType, format: THREE.RGBAFormat,
                   minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
                   depthBuffer:false, stencilBuffer:false, generateMipmaps:false };
  let layer = null, mips = [], W = 0, H = 0;

  /* segitiga layar-penuh */
  const tri = new THREE.BufferGeometry();
  tri.setAttribute('position', new THREE.Float32BufferAttribute([-1,-1,0, 3,-1,0, -1,3,0], 3));
  const fsCam = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const fsScene = new THREE.Scene();
  const fsMesh = new THREE.Mesh(tri, null); fsMesh.frustumCulled = false; fsScene.add(fsMesh);

  const mk = (frag, uniforms, additive)=>new THREE.ShaderMaterial({
    vertexShader: SH.fsVert, fragmentShader: frag, uniforms,
    depthTest:false, depthWrite:false, transparent:false,
    blending: additive ? THREE.CustomBlending : THREE.NoBlending,
    blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor
  });
  const downMat = mk(SH.bloomDown, { tSrc:{value:null}, uTexel:{value:new THREE.Vector2()}, uKaris:{value:0} }, false);
  const upMat   = mk(SH.bloomUp,   { tSrc:{value:null}, uTexel:{value:new THREE.Vector2()}, uRadius:{value:1.0} }, true);
  const compMat = mk(SH.composite, { tLayer:{value:null}, tBloom:{value:null}, uBloom:{value:1.0}, uGain:{value:1.0} }, true);
  compMat.transparent = true;

  function pass(mat, target){            // autoClear dimatikan: pass 'naik' & composite bersifat additive
    fsMesh.material = mat;
    const ac = renderer.autoClear; renderer.autoClear = false;
    renderer.setRenderTarget(target);
    renderer.render(fsScene, fsCam);
    renderer.autoClear = ac;
  }

  function dispose(){ if(layer) layer.dispose(); mips.forEach(m=>m.dispose()); layer = null; mips = []; }
  function resize(cssW, cssH){
    const pr = renderer.getPixelRatio();
    const k = Math.min(1, MAX_H / (cssH*pr));
    const w = Math.max(16, Math.round(cssW*pr*k)), h = Math.max(16, Math.round(cssH*pr*k));
    if(w === W && h === H && layer) return;
    W = w; H = h; dispose();
    layer = new THREE.WebGLRenderTarget(W, H, rtOpts);
    let mw = W, mh = H;
    for(let i=0;i<LEVELS;i++){
      mw = Math.max(2, mw>>1); mh = Math.max(2, mh>>1);
      mips.push(new THREE.WebGLRenderTarget(mw, mh, rtOpts));
    }
  }

  /* 1) gambar percikan ke layer HDR, 2) bloom */
  function renderLayer(pScene, camera){
    if(!layer) return;
    renderer.setRenderTarget(layer);
    renderer.setClearColor(0x000000, 0); renderer.clear();
    renderer.render(pScene, camera);

    // turun
    downMat.uniforms.tSrc.value = layer.texture;
    downMat.uniforms.uTexel.value.set(1/W, 1/H); downMat.uniforms.uKaris.value = 1;
    pass(downMat, mips[0]);
    downMat.uniforms.uKaris.value = 0;
    for(let i=1;i<mips.length;i++){
      downMat.uniforms.tSrc.value = mips[i-1].texture;
      downMat.uniforms.uTexel.value.set(1/mips[i-1].width, 1/mips[i-1].height);
      pass(downMat, mips[i]);
    }
    // naik (additive ke level di atasnya)
    for(let i=mips.length-1;i>0;i--){
      upMat.uniforms.tSrc.value = mips[i].texture;
      upMat.uniforms.uTexel.value.set(1/mips[i].width, 1/mips[i].height);
      pass(upMat, mips[i-1]);
    }
  }

  /* 3) tambahkan ke canvas (dipanggil SETELAH scene utama digambar) */
  function composite(bloom, gain){
    compMat.uniforms.tLayer.value = layer.texture;
    compMat.uniforms.tBloom.value = mips[0].texture;
    compMat.uniforms.uBloom.value = bloom; compMat.uniforms.uGain.value = gain;
    pass(compMat, null);
  }

  return { ok, hdr, resize, renderLayer, composite, dispose,
           get width(){ return W; }, get height(){ return H; } };
};
})();
