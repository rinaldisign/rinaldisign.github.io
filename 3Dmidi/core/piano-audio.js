/* =========================================================
   Piano sampler — Salamander Grand Piano (CC BY 3.0, Alexander Holm)
   Sample diunduh dari CDN; jadwal note memakai AudioContext milik engine.
   Pemakaian:  const piano = MIDI3D.createPiano(()=>audioContextAktif);
               await piano.loadSamplesForNotes(notes, onProgress);
               piano.scheduleNote(note, waktuAudioContext);
   ========================================================= */
(function(){
'use strict';
window.MIDI3D.createPiano = function(getCtx){
  const decodeCtx = new (window.AudioContext||window.webkitAudioContext)();
  const SAMPLE_LETTER = {0:'C',3:'D#',6:'F#',9:'A'};
  const LAYERS = [{tag:'3', vel:24},{tag:'12', vel:95}];
  const sampleBuffers = {};
  const sampleMidiFor = n => n + ((n%12)%3===0 ? 0 : ((n%12)%3===1 ? -1 : 1));
  const sampleNameFor = s => SAMPLE_LETTER[s%12] + (Math.floor(s/12)-1);

  /* Sama seperti visualizer acuan: semua sample diunduh paralel dari CDN, tanpa timeout
     & tanpa membatalkan lagu bila sebagian gagal (note tanpa sample tetap tampil visual). */
  async function loadSamplesForNotes(notes, onProgress){
    const needed = new Set(notes.map(n=>sampleMidiFor(n.note)));
    const jobs = [];
    for(const s of needed) for(const L of LAYERS){
      const key = L.tag+'|'+s;
      if(sampleBuffers[key]) continue;
      const nm = encodeURIComponent(sampleNameFor(s)) + 'v' + L.tag + '.mp3';
      jobs.push({key, urls:[
        `https://cdn.jsdelivr.net/npm/@audio-samples/piano-mp3-velocity${L.tag}/audio/${nm}`,
        `https://unpkg.com/@audio-samples/piano-mp3-velocity${L.tag}/audio/${nm}`
      ]});
    }
    let done = 0; const total = jobs.length;
    if(onProgress) onProgress(0, total);
    await Promise.all(jobs.map(async j=>{
      for(const url of j.urls){
        try{
          const r = await fetch(url);
          if(!r.ok) throw new Error('HTTP '+r.status);
          sampleBuffers[j.key] = await decodeCtx.decodeAudioData(await r.arrayBuffer());
          break;
        }catch(e){ /* coba sumber berikutnya */ }
      }
      done++; if(onProgress) onProgress(done, total);
    }));
    let missing = 0;
    for(const s of needed) if(!LAYERS.some(L=>sampleBuffers[L.tag+'|'+s])) missing++;
    return {total: needed.size, failed: missing};
  }
  function scheduleNote(note, when){
    const actx = getCtx();
    if(!actx) return;
    const s = sampleMidiFor(note.note), rate = Math.pow(2,(note.note-s)/12);
    const startAt = Math.max(actx.currentTime+0.03, when);
    const relDur = Math.max(note.dur, 0.12);
    const tt = Math.min(1, Math.max(0, (note.vel-LAYERS[0].vel)/(LAYERS[1].vel-LAYERS[0].vel)));
    const amp = 0.18 + 0.82*(note.vel/127);
    const w = {[LAYERS[0].tag]: amp*(1-tt), [LAYERS[1].tag]: amp*tt};
    const has0 = !!sampleBuffers[LAYERS[0].tag+'|'+s], has1 = !!sampleBuffers[LAYERS[1].tag+'|'+s];
    if(has0 !== has1){ w[LAYERS[0].tag] = has0 ? amp : 0; w[LAYERS[1].tag] = has1 ? amp : 0; }
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
  return { loadSamplesForNotes, scheduleNote };
};
})();
