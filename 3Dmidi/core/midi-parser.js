/* =========================================================
   MIDI parser (tanpa dependensi) → { notes:[{note,start,end,dur,vel}], duration }
   ========================================================= */
(function(){
'use strict';
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

window.MIDI3D.parseMidi = parseMidi;
})();
