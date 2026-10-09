/* =========================================================
   DAFTAR TEMA — urutan di sini = urutan di menu "Theme".
   Tema baru: buat folder 3Dmidi/<id>/ lalu tambahkan 1 entri di bawah.
     id        nama folder (juga kunci yang disimpan di localStorage)
     label     teks di menu
     accent    warna aksen panel playlist (CSS)
     accentRGB sama, format "r,g,b" (untuk rgba())
     files     script yang dimuat (lazy, hanya saat tema dipilih)
   ========================================================= */
window.MIDI3D = window.MIDI3D || {};
window.MIDI3D.manifest = [
  { id:'neon-green', label:'Neon Green', accent:'#39ff14', accentRGB:'57,255,20',
    files:['neon-green/theme.js'] },
  { id:'fireworks',  label:'Fireworks',  accent:'#ffb15c', accentRGB:'255,177,92',
    files:['fireworks/shaders.js','fireworks/bloom.js','fireworks/theme.js'] },
  { id:'chord-connector', label:'Chord Connector', accent:'#39ff14', accentRGB:'57,255,20',
    files:['chord-connector/theme.js'] }
];
