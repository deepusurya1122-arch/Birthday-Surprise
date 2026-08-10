/* =========================================================================
   CONFIG — every piece of editable text, the photo behavior, and the core
   settings live here. Both birthday-countdown.html and secret.html load
   this file, so a change made here shows up on both pages automatically.
   ========================================================================= */

const CONFIG = {

  // --- core settings ---
  password: "1215",

  targetDate: new Date(
    2026,
    7,
    12,
    0,
    0,
    0
  ),

  name: "Dedeepya",


  // --- birthday message shown at the top of the page ---
  bigWishText: "Happy Birthday {name} 🎂",


  // --- password gate text ---
  gateTitle: "🔒 This Is Locked",

  gateSubtitle:
    "Enter the 4-digit code to continue",

  unlockButtonText:
    "Unlock",

  gateErrorText:
    "Wrong code. Try again 💔",

  hintLabel:
    "Hint:",

  hintText:
    "You & Me together",


  // --- countdown / celebration text ---
  tagline:
    "Every second brings us closer!",

  celebrationTitle:
    "🎉 Happy Birthday! 🎉",

  celebrationText:
    "The day is finally here.",


  // --- cake section ---
  cakeSectionTitle:
    "🎂 Make a Wish",

  cakeImageUrl:
    "cake.png",

  // Set to false if you want to hide the name banner over the cake.
  cakeNameOverlay:
    true,

  cakeOverlayText:
    "Happy birthday Deepuu 😘😘",


  // --- Bubu-Dudu GIF ---
  // Place the GIF at:
  // images/bubu-dudu.gif
  bubuDuduGif:
    "images/bubu-dudu.gif",


  // --- birthday music ---
  // Place the music file at:
  // images/birthday-music.mp3
  birthdayMusic:
    "images/birthday-music.mp3",


  // --- backdrop photos behind the cake (15 slots) ---
  // Birthday photos are stored in:
  // images/birthday/
  //
  // You can replace any of these paths with another image path.
  backdropPhotos: [

    "images/birthday/birthday2.jpg",

    "images/birthday/birthday11.jpg",

    "images/birthday/birthday5.jpg",

    "images/birthday/birthday15.jpg",

    "images/birthday/birthday13.jpg",

    "images/birthday/birthday6.jpg",

    "images/birthday/birthday8.jpg",

    "images/birthday/birthday7.jpg",

    "images/birthday/birthday3.jpg",

    "images/birthday/birthday4.jpg",

    "images/birthday/birthday9.jpg",

    "images/birthday/birthday12.jpg",

    "images/birthday/birthday1.jpg",

    "images/birthday/birthday10.jpg",

    "images/birthday/birthday14.jpg"

  ],


  // --- secret message button + secret page ---
  revealButtonText:
    "Tap for Secret Message 💌",

  secretPageTitle:
    "💌 A Message For You",

  customMessage:
    "Wishing you many Happy returns of the bujjamma🎉🎂❤️❤️ ilane chala chala birthday inka happy ga cheskovali nuv🧿🧿
     Happy anniversary kanna❤️❤️❤️
     Asalu e 4 years entha fast ga aipoyayo teliyaledu na prathi moment ni netho share cheskunte gani complete feel rakunela aipoyav Bujji
     Nak e vishyamina netho chepte chalu nuvve na love na wife na bestfriend ❤️❤️
     Nuv na happy place 🥺 ne pakkana undi ninnu chustu undipovalanundi
     Sorry kanna navalla chala sarlu edchav 🥺😘😘😘😘. Adi intentionally eppudu cheyanu kanna but anukokunda aipotay bujji but ninnu happy ga unchali ani eppudu anukutu unta
     Ne pichodini chala love chestav 🥺🥺 na luck nuv na life loki radam bujji 😘😘
     Roju chala miss autunna bujji
     Nuv tension assala teskoku nuv anukunnavanni e year Neku autai 🧿🧿😘😘
     Sorry bujji dress time ki rananduku nek salary paddaka em kavalanna konta bujji nuv na bangaru 😘
     Don't ever stop talking to me 🥺 😘😘😘😘😘
     I love you forever ♾️ 😘💕",


  // --- secret page's own photo wall ---
  secretPhotoWallTitle:
    "📸 More Memories",

  secretPhotoWallHint:
    "Click or drag a photo to upload (up to 15)",


  // Secret photos are stored in:
  // images/secret/
  revealPhotos: [

    "images/secret/secret3.jpg",

    "images/secret/secret15.jpg",

    "images/secret/secret14.jpg",

    "images/secret/secret9.jpg",

    "images/secret/secret5.jpg",

    "images/secret/secret7.png",

    "images/secret/secret11.jpg",

    "images/secret/secret4.jpg",

    "images/secret/secret10.jpg",

    "images/secret/secret13.jpg",

    "images/secret/secret6.jpg",

    "images/secret/secret12.jpg",

    "images/secret/secret1.jpg",

    "images/secret/secret8.jpg",

    "images/secret/secret2.jpg"

  ]

};