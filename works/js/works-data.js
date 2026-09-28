/* ============================================================
   DATA KARYA — INI SATU-SATUNYA FILE YANG PERLU DIEDIT
   untuk menambah atau mengubah karya.
   ------------------------------------------------------------
   Cara menambah karya baru:
   1. Copy satu blok { ... } di bawah
   2. Tempel sebagai item baru di array WORKS
   3. Ganti isinya sesuai karya barumu
   List & popup di halaman akan otomatis mengikuti — tidak perlu
   sentuh index.html atau works.js sama sekali.

   Keterangan tiap field:
     catno       -> nomor katalog, misal "DN.1"
     title       -> judul karya
     cover       -> path gambar cover (dipakai di list & popup)
     midi        -> (opsional) path file .mid dari root situs, misal "midi-asset/dn54.mid".
                    Kalau diisi, karya tampil bisa diputar di visualizer landing page.
     desc        -> deskripsi/cerita karya
     soundcloud  -> URL embed player SoundCloud.
                    Cara ambil: buka track di SoundCloud > tombol
                    "Share" > tab "Embed" > copy bagian di dalam
                    src="..." lalu tempel di sini.
     musescore   -> link ke halaman sheet music di Musescore
                    (yang biasa kamu buka di browser, contoh:
                    "https://musescore.com/user/USERID/scores/SCOREID")
                    Ini otomatis dipakai juga untuk EMBED di dalam popup —
                    tidak perlu ambil kode embed manual.
     musescoreEmbed (opsional) -> kalau suatu saat auto-embed di atas
                    tidak cocok (misal Musescore ganti format URL, atau
                    kamu mau pakai parameter embed khusus), isi field ini
                    dengan URL embed lengkap dan itu akan dipakai duluan.
                    Kalau tidak butuh, boleh dihapus/dikosongkan.
     spotify        (opsional) -> link track di Spotify. Isi kalau ada,
                    biarkan kosong ("") atau hapus field-nya kalau belum
                    ada — ikon & link Spotify di popup otomatis tidak
                    muncul kalau field ini kosong/tidak ada.
     appleMusic     (opsional) -> sama seperti di atas, tapi untuk link
                    Apple Music.
     youtubeMusic   (opsional) -> sama seperti di atas, tapi untuk link
                    YouTube Music.
   ============================================================ */

const WORKS = [
  {
    catno: "DN.1",
    title: "Lumin Forest",
    cover: "../img/covers/art-dn1.jpg",
    desc: "A quiet piano composition inspired by the depth of forest light. The piece moves slowly, allowing silence and resonance to create space and atmosphere. 2025",
    soundcloud: "",
    musescore: "https://musescore.com/user/118322597/scores/32785730",
    spotify: "https://open.spotify.com/track/15QcSlGlge3L5lTAnLSKHW?si=frk8eO35SFGhyNXB06gJ4Q&utm_source=copy-link",
    appleMusic: "https://music.apple.com/jp/album/lumin-forest/1879852119?i=1879852134&l=en-US",
    youtubeMusic: "https://music.youtube.com/watch?v=UdMFZ4RQBwk&si=5fc4C3vyGfAMF1Fe"
  },
  {
    catno: "DN.2",
    title: "Solastalgia",
    cover: "../img/covers/art-dn1.jpg",
    desc: "A reflective piece exploring emotional distance and nostalgia. Soft harmonic motion creates a fragile and contemplative musical space. 2025",
    soundcloud: "",
    musescore: "https://musescore.com/user/118322597/scores/32670671",
    spotify: "https://open.spotify.com/track/2OPhar8XPBx382rUYcgg3b?si=EoEsmhoDQv6jh8JoYKvoGQ&utm_source=copy-link",
    appleMusic: "https://music.apple.com/jp/album/laserila/1879852119?i=1879852133&l=en-US",
    youtubeMusic: "https://music.youtube.com/watch?v=3LW17v3eerU&si=YqDIvUqY_bfRwCts"
  },
  {
    catno: "DN.3",
    title: "Laserila",
    cover: "../img/covers/art-dn1.jpg",
    desc: "I composed this piece on a cold night, alone at the piano. As I sat in the quietness of the night, a melody seemed to emerge from nothingness — unbidden, fragile, and melancholic. From that solitary moment, filled with sadness and quiet reflection, Laserila was born. 2025",
    soundcloud: "",
    musescore: "https://musescore.com/user/118322597/scores/32670398",
    spotify: "https://open.spotify.com/track/2KS5Ijfq415vaLsF0z3kFS?si=1kPC_99OSvuznO9WMllWDg&utm_source=copy-link",
    appleMusic: "https://music.apple.com/jp/album/laserila/1879852119?i=1879852133&l=en-US",
    youtubeMusic: "https://music.youtube.com/watch?v=3LW17v3eerU&si=YqDIvUqY_bfRwCts"
  },
  {
    catno: "DN.4",
    title: "Cycle7",
    cover: "../img/covers/art-dn1.jpg",
    desc: "I created this simple melody in the key of C♯ minor because it is easy to play and useful for practice. It really helps train both the left and right hands. 2025",
    soundcloud: "",
    musescore: "#",
    spotify: "https://open.spotify.com/track/3uDIw3QNYLhVmbDrpPOuYC?si=p5dm9qmkTYCWJsl4VXKz0w&utm_source=copy-link",
    appleMusic: "https://music.apple.com/jp/album/cycle7/1879852119?i=1879852123&l=en-US",
    youtubeMusic: "https://music.youtube.com/watch?v=Vp6wTvKTQmI&si=X_kRhSjGGiKyI-48"
  },
  {
    catno: "DN.5",
    title: "Furnama",
    cover: "../img/covers/art-dn1.jpg",
    desc: "I feel a sense of tranquility whenever I listen to this melody. Its gentle and steady flow was created as a piece for the night, evoking the quiet atmosphere of a peaceful evening beneath the moonlight. The title Furnama is inspired by the Indonesian word for 'full moon,' symbolizing the calm and serene feeling that lies at the heart of this piece. 2025",
    soundcloud: "",
    musescore: "https://musescore.com/user/118322597/scores/32670272",
    spotify: "https://open.spotify.com/track/0Cn4vgImV3K5kv4SqHbxKk?si=jNn1ZeYWTUq8-1kLXXK98Q&utm_source=copy-link",
    appleMusic: "https://music.apple.com/jp/album/fu-rnama/1879852119?i=1879852124&l=en-US",
    youtubeMusic: "https://music.youtube.com/watch?v=AlbKOcPhqps&si=zvbjPAvS6YvEZZRL"
  },
    {
    catno: "DN.6",
    title: "(Data Lost)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "The original data was lost, along with the melody I had recorded. No trace of it remains. What survives today is only the memory that this piece once existed a small but meaningful part of my journey as a composer. 2025",
    soundcloud: "",
    musescore: "#",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
   {
    catno: "DN.7",
    title: "Mycro",
    cover: "../img/covers/art-dn2.jpg",
    desc: "I created this piece after coming home from work feeling tired. As soon as I touched the piano keys, a lazy melody came from somewhere inside me, almost by itself. And that is how MYCRO was born. 2025",
    soundcloud: "",
    musescore: "https://musescore.com/user/118322597/scores/32671463",
    spotify: "https://open.spotify.com/track/0hzVQ9f4j4a9aikvhxzAqy?si=1_dq6HY7QyW2RZXUsepR8g&utm_source=copy-link",
    appleMusic: "https://music.apple.com/us/song/mycro-flaviventris/1878211692",
    youtubeMusic: "https://music.youtube.com/watch?v=BCaZaCbu2PM&si=C0tQqNOBEsEBjv57"
  },
   {
    catno: "DN.8",
    title: "Lucent Sepium",
    cover: "../img/covers/art-dn2.jpg",
    desc: "I wrote this piece while exploring a new chord progression from C# major to F minor. I only created a few very short melodic fragments in this piece. 2025",
    soundcloud: "",
    musescore: "https://musescore.com/user/118322597/scores/32783756",
    spotify: "https://open.spotify.com/track/6dHtig4p6PpI34gRtwHTzr?si=QLyMFtANRPuMQITFks-j6w&utm_source=copy-link",
    appleMusic: "https://music.apple.com/us/song/lucent-sepium/1878211525",
    youtubeMusic: "https://music.youtube.com/watch?v=fGtd-ZxXdYg&si=K_azM3gaF-hWaHYh"
  },
  {
    catno: "DN.9",
    title: "Serein Paradisaea",
    cover: "../img/covers/art-dn2.jpg",
    desc: "I created this piece while exploring a chord progression in C# major. I found a simple melody that felt melancholic, matching my mood at the time I composed it. 2025",
    soundcloud: "",
    musescore: "https://musescore.com/user/118322597/scores/32813600",
    spotify: "https://open.spotify.com/track/1wC1ReOB9C8VleM0rP4BXQ?si=mRDYGte9TsuWcd0DDR5s2g&utm_source=copy-link",
    appleMusic: "https://music.apple.com/us/song/serein-paradisaea/1878211830",
    youtubeMusic: ""
  },
  {
    catno: "DN.10",
    title: "Serene Sepium",
    cover: "../img/covers/art-dn2.jpg",
    desc: "I wrote this piece naturally, using the same progression as the previous work. Here, I started to feel more comfortable writing my own original music.",
    soundcloud: "",
    musescore: "https://musescore.com/user/118322597/scores/32843381",
    spotify: "https://open.spotify.com/track/0lQOq4ioYW09mM90dzNpIH?si=_ZaD5TKJRGCiPt9zZZ0NnA&utm_source=copy-link",
    appleMusic: "https://music.apple.com/us/song/serene-sepium/1878211837",
    youtubeMusic: "https://music.youtube.com/watch?v=bUO59vlnJLA&si=KPzb9Q_WjZ2IGoZE"
  },
    {
    catno: "DN.11",
    title: "(Data Lost)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "The original data was lost, along with the melody I had recorded. No trace of it remains. What survives today is only the memory that this piece once existed a small but meaningful part of my journey as a composer.",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
    {
    catno: "DN.12",
    title: "Memory Glow",
    cover: "../img/covers/art-dn2.jpg",
    desc: "A slow solo piano instrumental filled with warm nostalgia, gentle affection, and a touch of loneliness. A quiet melody that carries memories of precious moments, love, and the soft emptiness of someone or something once held close.",
    soundcloud: "",
    musescore: "https://musescore.com/user/118322597/scores/36852011",
    spotify: "https://open.spotify.com/track/439BJPDJaQXdYhKDzaQ6Ps?si=Ledo4mm4T6Ca2TfTNKyukg&utm_source=copy-link",
    appleMusic: "https://music.apple.com/us/song/memory-glow/1878211685",
    youtubeMusic: "https://music.youtube.com/watch?v=VHFtm8mJ3wY&si=7JVlSMJOAvByyw47"
  },
    {
    catno: "DN.13",
    title: "(Data Lost)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "The original data was lost, along with the melody I had recorded. No trace of it remains. What survives today is only the memory that this piece once existed a small but meaningful part of my journey as a composer.",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
    {
    catno: "DN.14",
    title: "Memoriae",
    cover: "../img/covers/art-dn3.jpg",
    desc: "A melancholic piano piece shaped by nostalgia and memories of a distant past. Each note lingers like a fading recollection quiet, intimate, and bittersweet, as if remembering something that can never return.",
    soundcloud: "",
    musescore: "",
    spotify: "https://open.spotify.com/track/6tBThW5nXYKxk5VLEOpH3U?si=O5EqVvXeTPeJSMMX_m8HQA&utm_source=copy-link",
    appleMusic: "https://music.apple.com/us/song/memoriae-cyanopsitta/1879873855",
    youtubeMusic: ""
  },
    {
    catno: "DN.15",
    title: "Velarium Harpia",
    cover: "../img/covers/art-dn3.jpg",
    desc: "A piano piece in E minor, carrying a subtle darkness beneath its melody. Its quiet tension and shadowy harmonies create an introspective atmosphere melancholic, restrained, and slightly mysterious",
    soundcloud: "",
    musescore: "",
    spotify: "https://open.spotify.com/track/7nvmpTdXi4nFzCVYLZmZ4S?si=jG_y0DC9ST20whn0SwLuLg&utm_source=copy-link",
    appleMusic: "https://music.apple.com/us/song/velarium-harpia-grand-piano/1878211849",
    youtubeMusic: "https://music.youtube.com/watch?v=UgxiCJigUbk&si=nQioM1eiYkeuSydQ"
  },
    {
    catno: "DN.16",
    title: "Wistful",
    cover: "../img/covers/art-dn3.jpg",
    desc: "A warm and gentle piano piece bathed in a soft, luminous atmosphere. Beneath its tenderness lies a quiet melancholy, like a distant memory glowing softly through the passage of time.",
    soundcloud: "",
    musescore: "",
    spotify: "https://open.spotify.com/track/06ImTrFBDxbTb4l4Q6YL5n?si=7Jss7oHVTlGAsfkZ1Y_ESA&utm_source=copy-link",
    appleMusic: "https://music.apple.com/us/song/wistful-locustella/1879873857",
    youtubeMusic: "https://music.youtube.com/watch?v=G7UaujWPHzc&si=JnCEWbjn_cNj9qrv"
  },
    {
    catno: "DN.17",
    title: "Sitta Villosa",
    cover: "../img/covers/art-dn1.jpg",
    desc: "A soft and tranquil piano piece with a gentle touch of sadness. Flowing right-hand arpeggios create a calm, weightless atmosphere, with no sense of tension only quiet reflection and peaceful solitude.",
    soundcloud: "",
    musescore: "",
    spotify: "https://open.spotify.com/track/1LtvjirwAkYNQazP1Agdjt?si=RwOfqVSdQfy9HkBHtLd_1w&utm_source=copy-link",
    appleMusic: "https://music.apple.com/us/song/sitta-villosa/1879852138",
    youtubeMusic: "https://music.youtube.com/watch?v=AVjHnVV9ZOU&si=V3AFioUIp0g3K9JL"
  },
    {
    catno: "DN.18",
    title: "Mellune",
    cover: "../img/covers/art-dn3.jpg",
    desc: "A slow and deeply touching piano piece, tender and intimate like a lullaby whispered in the quiet of the night. Its gentle melody carries a subtle sadness, inviting the listener into a peaceful, dreamlike sleep.",
    soundcloud: "",
    musescore: "",
    spotify: "https://open.spotify.com/track/2CSACTYqXu4YoWAf4c3weU?si=QqAjrytMRP6Qpe7azy4ZlQ&utm_source=copy-link",
    appleMusic: "https://music.apple.com/us/song/mellune-myzomela/1879873821",
    youtubeMusic: "https://music.youtube.com/watch?v=nUGlzH49Yrs&si=hkM3Fi4Uhkb_CNG_"
  },
    {
    catno: "DN.19",
    title: "Avelune",
    cover: "../img/covers/art-dn3.jpg",
    desc: "A delicate lullaby shaped by quiet tenderness and soft, flowing melodies. Gentle enough to drift into sleep, yet touched by a faint melancholy, like a distant memory whispered in the stillness of night.",
    soundcloud: "",
    musescore: "",
    spotify: "https://open.spotify.com/track/6744LGpGX0dYrF70ddeIVQ?si=lj66XLIxRECLDz0jYsxtug&utm_source=copy-link",
    appleMusic: "https://music.apple.com/us/song/avelune-oriolus/1879873796",
    youtubeMusic: "https://music.youtube.com/watch?v=juct3vASMMM&si=4vrb-yDYLA8h0g13"
  },
    {
    catno: "DN.20",
    title: "(Data Lost)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "The original data was lost, along with the melody I had recorded. No trace of it remains. What survives today is only the memory that this piece once existed a small but meaningful part of my journey as a composer.",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
   {
    catno: "DN.21",
    title: "(Data Lost)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "The original data was lost, along with the melody I had recorded. No trace of it remains. What survives today is only the memory that this piece once existed a small but meaningful part of my journey as a composer.",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
   {
    catno: "DN.22",
    title: "2Keychains",
    cover: "../img/covers/art-dn22.jpg",
    desc: "Inspired by two keychains separated by distance and time, yet somehow still connected by fate, this original piano piece was born froma feeling I cannot easily put into words.Though they remain apart, their existence still seems to belong to the same story as if destiny continues to hold an invisible thread between them.This music carries a warm and melancholic atmosphere, with a touch of mystery. A reflection of distance, time, memories, and the quiet belief that some connections may never truly disappear.",
    soundcloud: "",
    musescore: "https://musescore.com/user/118322597/scores/36858233",
    spotify: "https://open.spotify.com/track/2HZaRxtrNYsYlTC3Dq9qze?si=7a28ad2be7064135",
    appleMusic: "https://music.apple.com/us/song/2-keychains-cygnus-studio-version/1878217781",
    youtubeMusic: "https://music.youtube.com/watch?v=ZA-JorSmkl4&si=04nBR8VNEY4eJuD5"
  },
   {
    catno: "DN.23",
    title: "(Data Lost)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "The original data was lost, along with the melody I had recorded. No trace of it remains. What survives today is only the memory that this piece once existed a small but meaningful part of my journey as a composer.",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
   {
    catno: "DN.24",
    title: "(Data Lost)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "The original data was lost, along with the melody I had recorded. No trace of it remains. What survives today is only the memory that this piece once existed a small but meaningful part of my journey as a composer.",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
   {
    catno: "DN.25",
    title: "Lament",
    cover: "../img/covers/art-dn22.jpg",
    desc: "I composed this piece while feeling sad, with a slight sense of frustration in my heart. I simply sat down at the piano, played this melody as it came to me, and recorded it in the moment.",
    soundcloud: "",
    musescore: "",
    spotify: "https://open.spotify.com/track/4plysuxYPLk7Im2XiS8coQ?si=cgYfZKo2RfG1r9aQVHpgQQ&utm_source=copy-link",
    appleMusic: "https://music.apple.com/us/song/lament-corvuscorax-studio-version/1878217782",
    youtubeMusic: "https://music.youtube.com/watch?v=wCjZkWBL0nw&si=veBrk-ZOF0JsGzD2"
  },
   {
    catno: "DN.26",
    title: "Serenity",
    cover: "../img/covers/art-dn22.jpg",
    desc: "A melancholic piece with a quiet sadness, yet touched by a gentle light. Serenity captures the feeling of finding a small sense of peace within sorrow—soft, reflective, and quietly hopeful. I created it while my feelings were filled with restlessness, an overactive mind, and countless distractions.",
    soundcloud: "",
    musescore: "",
    spotify: "https://open.spotify.com/track/3fxCCQfcpACgqJNaw5OiYR?si=xqzmzvpWThixS_xmRKCq6w&utm_source=copy-link",
    appleMusic: "https://music.apple.com/us/song/serenity-alauda-studio-version/1878217784",
    youtubeMusic: "https://music.youtube.com/watch?v=AukOYKwd5-4&si=uqndaC5pBXq3VbXD"
  },
   {
    catno: "DN.27",
    title: "Afterimage",
    cover: "../img/covers/art-dn22.jpg",
    desc: "I created Afterimage after a meeting that made my heart happy for a brief moment, only for me to return to a bitter reality afterward. I sat at the piano and simply played whatever melody came to me. I recorded it just as it was, and somehow, that moment became this piece of music.",
    soundcloud: "",
    musescore: "",
    spotify: "https://open.spotify.com/track/2Bswxc7vzIzIkUSfLHg2W0?si=3rlwEY3rQdqycURUs7K3hA&utm_source=copy-link",
    appleMusic: "https://music.apple.com/us/song/afterimage-chrysoloph-studio-version/1878217787",
    youtubeMusic: "https://music.youtube.com/watch?v=SQLm1ZCc2IY&si=tLnTQd-47kcYdLUL"
  },
   {
    catno: "DN.28",
    title: "Descent",
    cover: "../img/covers/art-dn22.jpg",
    desc: "I created Descent while reflecting on the meaning of life. What is the purpose of living if, one day, everything will eventually fade away? I too will be forgotten, and perhaps nothing of me will remain. Yet I realized that the only thing I can do is create. I can leave something behind through my work something that may continue to exist, even after I am gone.",
    soundcloud: "",
    musescore: "",
    spotify: "https://open.spotify.com/track/2fBJQ4w8PjXngJMP7XfV4O?si=oMwBZj11TpS39IUYfnA-KQ&utm_source=copy-link",
    appleMusic: "https://music.apple.com/jp/album/descent-rhipidura-studio-version/1878217657?i=1878217794&l=en-US",
    youtubeMusic: "https://music.youtube.com/watch?v=gjv4gPgZarc&si=FJCCNZUNeOX-Tjlc"
  },
   {
    catno: "DN.29",
    title: "Elysium",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "A slow and peaceful piano piece that feels like lying beneath a quiet, glowing sky. The melody stays light and high, almost as if the notes are floating in the air. I wanted Elysium to feel simple, warm, and unhurried a small place where the mind can finally rest.",
    soundcloud: "",
    musescore: "",
    spotify: "https://open.spotify.com/track/7vNBA9lwp2jhcYOuAOXcfh?si=6f641d79c7d741d4",
    appleMusic: "https://music.apple.com/jp/album/elysium-single/6805027861",
    youtubeMusic: "https://music.youtube.com/playlist?list=OLAK5uy_mSBcHwqHV7LieMBHKbJTmCB_MHYzBH0Xg&si=DeaLRATNcKBgXs6-"
  },
   {
    catno: "DN.30",
    title: "(In Progress)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "In Editing",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
   {
    catno: "DN.31",
    title: "Affectionary",
    cover: "../img/covers/art-dn31.jpg",
    desc: "Affectionary is a solo piano piece in 6/8 that lives between light and shadow. Beneath its bright, glowing surface runs a quiet darkness, shaped by non-diatonic chords that repeat throughout the piece and never let the harmony fully settle. The music shifts between two moods: tender waltz passages with a gentle 6/8 sway, and rippling arpeggios that catch the light in quick, shimmering bursts. It moves from softness to intensity and back again, staying introspective without ever turning fully somber, much like affection itself: beautiful, but not simple.",
    soundcloud: "",
    musescore: "https://musescore.com/user/118322597/scores/36862169",
    spotify: "https://open.spotify.com/track/3oACirBWIAWJeouHBHxpLX?si=63U_f-ueTAmmzdQYUWr5gA&utm_source=copy-link",
    appleMusic: "https://music.apple.com/jp/album/affectionary/6806219357?i=6806219358&l=en-US",
    youtubeMusic: "https://music.youtube.com/watch?v=zPsrOfncfkE&si=lV9cBx_EwuxeX2O4"
  },
  {
    catno: "DN.32",
    title: "(In Progress)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "In Editing",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
  {
    catno: "DN.33",
    title: "(In Progress)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "In Editing",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
  {
    catno: "DN.34",
    title: "(In Progress)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "In Editing",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
  {
    catno: "DN.35",
    title: "(In Progress)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "In Editing",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
  {
    catno: "DN.36",
    title: "(In Progress)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "In Editing",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
  {
    catno: "DN.37",
    title: "(In Progress)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "In Editing",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
  {
    catno: "DN.38",
    title: "(In Progress)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "In Editing",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
  {
    catno: "DN.39",
    title: "(In Progress)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "In Editing",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
  {
    catno: "DN.40",
    title: "(In Progress)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "In Editing",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
  {
    catno: "DN.41",
    title: "(In Progress)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "In Editing",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
  {
    catno: "DN.42",
    title: "(In Progress)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "In Editing",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
  {
    catno: "DN.43",
    title: "(In Progress)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "In Editing",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
  {
    catno: "DN.44",
    title: "(In Progress)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "In Editing",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
  {
    catno: "DN.45",
    title: "(In Progress)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "In Editing",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
  {
    catno: "DN.46",
    title: "(In Progress)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "In Editing",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
  {
    catno: "DN.47",
    title: "(In Progress)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "In Editing",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
  {
    catno: "DN.48",
    title: "(In Progress)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "In Editing",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
  {
    catno: "DN.49",
    title: "(In Progress)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "In Editing",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
  {
    catno: "DN.50",
    title: "(In Progress)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "In Editing",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
  {
    catno: "DN.51",
    title: "(In Progress)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "In Editing",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
  {
    catno: "DN.52",
    title: "(In Progress)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "In Editing",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
  {
    catno: "DN.53",
    title: "(In Progress)",
    cover: "../img/covers/placeholder-2.jpg",
    desc: "In Editing",
    soundcloud: "",
    musescore: "",
    spotify: "",
    appleMusic: "",
    youtubeMusic: ""
  },
  {
    catno: "DN.54",
    title: "Beloved Waltz",
    cover: "../img/covers/art-dn54.jpg",
    midi: "#",
    desc: "I wrote this piece thinking about the feeling of being in love when even the simplest moments feel a little more beautiful. A gentle waltz in C-sharp minor, carrying a warm sense of happiness, tenderness, and the quiet joy of having someone you truly love in your heart. 8/2026",
    soundcloud: "",
    musescore: "https://musescore.com/user/118322597/scores/37069763",
    spotify: "https://open.spotify.com/track/7GqNxLt6uaBzfMbdYrxRII?si=d445513fb43547f9",
    appleMusic: "https://music.apple.com/jp/album/beloved-waltz-single/6805050501",
    youtubeMusic: "https://music.youtube.com/playlist?list=OLAK5uy_nihKxkMzpyFAMI-kFem1EF7IyeBG9cLU0&si=Id4KmRaLW4FMoKzo"
  },
  {
    catno: "DN.55",
    title: "Dearest Waltz",
    cover: "../img/covers/art-dn55.jpg",
    midi: "midi-asset/dn55.mid",
    desc: "Dearest Waltz is a gentle and flowing waltz, born unexpectedly in a quiet moment at the piano. While finishing my previous composition, Waltz DN.54, I continued to play freely, and without planning it, the melody of this waltz began to emerge.Although written in C♯ minor, Dearest Waltz carries a cheerful and warm spirit. Its melody gently dances between light and shadow, portraying the feeling of smiling above sadness not to deny it, but to embrace it with hope. Beneath its joyful character lies a message of positivity, tenderness, and affection.Dearest Waltz is a small reminder that even in moments touched by sadness, there can still be warmth in the heart, a reason to smile, and love to share. 8/2026",
    soundcloud: "",
    musescore: "https://musescore.com/user/118322597/scores/36907076",
    spotify: "https://open.spotify.com/track/6PaY6ElshHT8pqefQvQCGE?si=235cd3e71c664ee3",
    appleMusic: "https://music.apple.com/jp/album/dearest-waltz-single/6804621570",
    youtubeMusic: "https://music.youtube.com/playlist?list=OLAK5uy_kYn_MDA35rnGW6cAc40bodO91xkTqmfPU&si=nLwVAEq8kbXdLGxx"
  },
];
