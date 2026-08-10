/* =========================================================================
   CONFIG — every piece of editable text, the photo behavior, and the core
   settings live here.
   ========================================================================= */

const CONFIG = {

  // --- core settings ---
  // Owner can unlock before the birthday date.
  ownerPassword: "1000",

  // Everyone can use this password from August 12, 2026 00:00 onward.
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
  bigWishText:
    "Happy Birthday {name} 🎂",


  // --- password gate text ---
  gateTitle:
    "🔒 This Is Locked",

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

  cakeNameOverlay:
    true,

  cakeOverlayText:
    "Happy birthday Deepuu 😘😘",


  // --- Bubu-Dudu GIF ---
  // File location:
  // images/bubu-dudu.gif
  bubuDuduGif:
    "images/bubu-dudu.gif",


  // --- birthday music ---
  // File location:
  // images/birthday-music.mp3
  birthdayMusic:
    "images/birthday-music.mp3",


  // --- birthday page backdrop photos ---
  // 15 birthday photos
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


  // --- YOUR SECRET MESSAGE ---
  // Backticks are intentional because the message contains
  // multiple lines and emojis.
  customMessage: `Wishing you many Happy returns of the bujjamma🎉🎂❤️❤️ ilane chala chala birthday inka happy ga cheskovali nuv🧿🧿
Happy anniversary kanna❤️❤️❤️
Asalu e 4 years entha fast ga aipoyayo teliyaledu na prathi moment ni netho share cheskunte gani complete feel rakunela aipoyav Bujji
Nak e vishyamina netho chepte chalu nuvve na love na wife na bestfriend ❤️❤️
Nuv na happy place 🥺 ne pakkana undi ninnu chustu undipovalanundi
Sorry kanna navalla chala sarlu edchav 🥺. Adi intentionally eppudu cheyanu kanna but anukokunda aipotay bujji but ninnu happy ga unchali ani eppudu anukutu unta
Ne pichodini chala love chestav 🥺🥺 na luck nuv na life loki radam bujji 😘😘
Nuv tension assala teskoku nuv anukunnavanni e year Neku autai 🧿🧿😘😘
Sorry bujji dress time ki rananduku nek salary paddaka em kavalanna konta bujji nuv na bangaru 😘
Don't ever stop talking to me 🥺 😘😘😘😘😘
I love you forever ♾️ 😘💕`,


  // --- secret page photo wall ---
  secretPhotoWallTitle:
    "📸 More Memories",

  secretPhotoWallHint:
    "Click or drag a photo to upload (up to 15)",


  // --- secret page photos ---
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