/* =========================================================
   MIDI3D — namespace & registry tema.
   Dimuat PERTAMA. Menentukan BASE url folder 3Dmidi/ (dipakai
   engine untuk memuat tema secara lazy) dan registerTheme().
   ========================================================= */
(function(){
'use strict';
const M = window.MIDI3D = window.MIDI3D || {};
M.themes = M.themes || {};

// folder 3Dmidi/ diturunkan dari lokasi script ini: .../3Dmidi/core/namespace.js
const me = document.currentScript && document.currentScript.src;
M.base = me ? me.replace(/core\/namespace\.js(\?.*)?$/, '') : '3Dmidi/';

/* Tema mendaftar lewat:
     MIDI3D.registerTheme('id', function create(ctx){ return { ...hook tema... }; });
   Lihat 3Dmidi/README.md untuk daftar hook. */
M.registerTheme = function(id, create){ M.themes[id] = create; };
})();
