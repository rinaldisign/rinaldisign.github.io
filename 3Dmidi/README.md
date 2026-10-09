# 3Dmidi — visualizer piano 3D (hero homepage)

```
3Dmidi/
├── themes.js            daftar tema + menu (tambah tema = 1 entri di sini)
├── core/                dipakai SEMUA tema — jarang perlu diedit
│   ├── namespace.js     window.MIDI3D + registerTheme()
│   ├── midi-parser.js   parser MIDI
│   ├── keyboard.js      88 tuts + lantai grid
│   ├── piano-audio.js   sampler piano (Salamander)
│   ├── engine.js        scene, kamera, playback, playlist, tombol Theme
│   └── engine.css       gaya tombol Theme & aksen panel
├── neon-green/theme.js  tema 1: bar jatuh + kunang-kunang (tampilan asli)
├── chord-connector/theme.js  tema 3: 88 gelembung not + benang akor
└── fireworks/           tema 2: kembang api
    ├── theme.js         roket, jenis ledakan, cahaya, parameter (objek CFG)
    ├── shaders.js       GLSL percikan (fisika di GPU) + bloom
    └── bloom.js         render HDR + bloom, komposit ke canvas transparan
```

## Membuat tema baru
1. Buat folder `3Dmidi/<id>/theme.js`:
   `MIDI3D.registerTheme('<id>', function(ctx){ return { ...hook }; })`
2. Tambah entri di `themes.js` (id, label, accent, files).

Hook (semua opsional kecuali yang bertanda *):
`activate*`, `deactivate*`, `setNotes(notes)*`, `resize(w,h)`, `frameStart(nowS)`,
`noteOn(note, nowS)` (dipanggil saat note mulai & lagu diputar),
`update(t, dt, playing, activeSet, nowS)*`, `styleKeys(activeSet)*`, `render()*`.
`ctx`: THREE, scene, camera, renderer, lights, KEY_INFO, KB_CENTER, keyMeshes, mobile, ...

## Tweak Fireworks
`fireworks/theme.js` → objek `CFG` (jumlah partikel, bloom, ukuran/tinggi ledakan,
waktu naik roket). Uji tanpa lagu di console: `MIDI3D.fwTest(60, 110, 2)` (note, velocity, durasi).

Pilihan tema tersimpan di localStorage (`mv3d-theme`).

## Tweak Chord Connector
`chord-connector/theme.js` → objek `CFG` (ukuran gelembung, kecepatan putar `spin`, opacity ikatan/benang,
`idleLabel` untuk menampilkan nama not samar saat idle). Uji tanpa lagu: `MIDI3D.ccHold = [48,55,64]` (lepas: `= null`).
