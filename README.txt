Drop your photo files in this folder, then reference them by filename
in config.js (backdropPhotos and revealPhotos arrays).

Example:
  1. Add photos/backdrop1.jpg, photos/backdrop2.jpg, etc.
  2. In config.js, set:
       backdropPhotos: [
         "photos/backdrop1.jpg",
         "photos/backdrop2.jpg",
         "", "", "", "", "", "", "", "", "", "", "", "", ""
       ]
  3. Save and reopen birthday-countdown.html — those photos now appear
     automatically, no upload needed.

Leave an entry as "" to keep that slot as a click-or-drag upload
placeholder instead. You can also use a full https:// URL to a hosted
image instead of a local filename — either works.

This same pattern applies to revealPhotos for the secret-message page.
