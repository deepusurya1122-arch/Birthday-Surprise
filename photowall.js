/* =========================================================================
   Shared polaroid photo-wall builder — used by both birthday-countdown.html
   and secret.html so the upload behavior and styling stay identical.
   Supports click-to-upload AND drag-and-drop (single slot or multi-drop),
   plus pre-loading from a local file path or hosted URL so photos appear
   automatically on page load without needing to be re-uploaded.

   buildPhotoWall(containerId, count, extraClass, initialSrcs)
     -> builds `count` polaroid slots inside #containerId, returns the slots.
        initialSrcs (optional): array of image paths/URLs, one per slot index.
        A non-empty entry pre-loads that slot on page load; "" (or a missing
        entry) leaves that slot as a normal click/drag upload placeholder.
        Clicking or dragging onto a pre-loaded slot still replaces it.

   scatterSlots(slots, stageW, stageH, cardW, cardH, excludeRect)
     -> randomly positions already-built slots (absolute, within a stage of
        stageW x stageH), avoiding overlap with each other and, if given,
        avoiding excludeRect ({x,y,w,h}) — e.g. the area the cake sits in.
   ========================================================================= */

function setSlotImage(src, img, frame){
  if(!src) return;

  img.src = src;
  img.style.display = 'block';
  frame.style.background = 'none';
}

function loadImageIntoSlot(file, img, frame){
  if(!file || !file.type.startsWith('image/')) return;

  const reader = new FileReader();

  reader.onload = function(ev){
    setSlotImage(
      ev.target.result,
      img,
      frame
    );
  };

  reader.readAsDataURL(file);
}


/* =========================================================================
   Secret-page enlarged photo viewer
   ========================================================================= */

function openSecretPhotoViewer(slot){

  if(!slot || !slot.img){
    return;
  }

  if(
    !slot.img.src ||
    slot.img.style.display === 'none'
  ){
    return;
  }

  let lightbox =
    document.getElementById(
      'photoLightbox'
    );

  /*
   * Create the viewer only when it is first needed.
   * This means no extra HTML is required in secret.html.
   */
  if(!lightbox){

    lightbox =
      document.createElement('div');

    lightbox.id =
      'photoLightbox';

    lightbox.innerHTML = `
      <div class="lightboxPolaroid">
        <button
          type="button"
          class="lightboxClose"
          aria-label="Close photo"
        >×</button>

        <img
          class="lightboxImage"
          alt="Enlarged memory"
        >

        <div class="lightboxCaption">
          A special memory ❤️
        </div>
      </div>
    `;

    document.body.appendChild(
      lightbox
    );

    /*
     * Clicking the dark area closes it.
     */
    lightbox.addEventListener(
      'click',
      function(e){

        if(
          e.target === lightbox
        ){
          closeSecretPhotoViewer();
        }
      }
    );

    /*
     * Close button.
     */
    const closeBtn =
      lightbox.querySelector(
        '.lightboxClose'
      );

    closeBtn.addEventListener(
      'click',
      function(e){

        e.preventDefault();
        e.stopPropagation();

        closeSecretPhotoViewer();
      }
    );
  }

  const viewerImg =
    lightbox.querySelector(
      '.lightboxImage'
    );

  const caption =
    lightbox.querySelector(
      '.lightboxCaption'
    );

  viewerImg.src =
    slot.img.src;

  /*
   * Use the original card label if available.
   */
  const originalCaption =
    slot.card.querySelector(
      '.capLabel'
    );

  if(
    originalCaption &&
    originalCaption.textContent.trim()
  ){
    caption.textContent =
      originalCaption.textContent;
  }else{
    caption.textContent =
      'A special memory ❤️';
  }

  lightbox.classList.add(
    'show'
  );

  /*
   * Prevent the secret page from scrolling
   * while the enlarged photo is open.
   */
  document.body.style.overflow =
    'hidden';
}


function closeSecretPhotoViewer(){

  const lightbox =
    document.getElementById(
      'photoLightbox'
    );

  if(!lightbox){
    return;
  }

  lightbox.classList.remove(
    'show'
  );

  document.body.style.overflow =
    '';
}


/*
 * Escape closes the enlarged photo.
 */
document.addEventListener(
  'keydown',
  function(e){

    if(
      e.key === 'Escape'
    ){
      closeSecretPhotoViewer();
    }
  }
);


/* =========================================================================
   Build photo wall
   ========================================================================= */

function buildPhotoWall(
  containerId,
  count,
  extraClass,
  initialSrcs,
  showLabel
){

  if(showLabel === undefined){
    showLabel = true;
  }

  const wall =
    document.getElementById(
      containerId
    );

  if(!wall){
    return [];
  }

  const slots = [];

  for(
    let i = 0;
    i < count;
    i++
  ){

    const rot =
      (
        Math.random() * 20 -
        10
      ).toFixed(1);

    const card =
      document.createElement(
        'div'
      );

    card.className =
      'polaroid' +
      (
        extraClass
          ? ' ' + extraClass
          : ''
      );

    card.dataset.rot =
      rot;

    card.style.transform =
      'rotate(' +
      rot +
      'deg)';

    const frame =
      document.createElement(
        'div'
      );

    frame.className =
      'frame';

    const img =
      document.createElement(
        'img'
      );

    img.style.display =
      'none';

    img.loading =
      'lazy';

    img.onerror =
      function(){

        img.style.display =
          'none';

        img.removeAttribute(
          'src'
        );

        frame.style.background =
          '';
      };

    frame.appendChild(
      img
    );

    const fileInput =
      document.createElement(
        'input'
      );

    fileInput.type =
      'file';

    fileInput.accept =
      'image/*';

    const cap =
      document.createElement(
        'div'
      );

    cap.className =
      'capLabel';

    cap.textContent =
      showLabel
        ? 'Memory #' +
          (i + 1)
        : '';

    card.appendChild(
      frame
    );

    card.appendChild(
      cap
    );

    card.appendChild(
      fileInput
    );

    wall.appendChild(
      card
    );

    const slot = {
      card,
      frame,
      img
    };

    slots.push(
      slot
    );

    /*
     * Pre-load configured photo.
     */
    if(
      initialSrcs &&
      initialSrcs[i]
    ){

      setSlotImage(
        initialSrcs[i],
        img,
        frame
      );
    }


    /* ================================================================
       Click behavior
       ================================================================ */

    card.addEventListener(
      'click',
      function(e){

        /*
         * Secret page:
         * clicking an existing photo opens the enlarged viewer.
         *
         * We detect the secret page using the existing
         * "fadedPhoto" class so birthday-page behavior remains unchanged.
         */
        if(
          extraClass &&
          extraClass
            .split(/\s+/)
            .includes(
              'fadedPhoto'
            )
        ){

          /*
           * If there is an actual image,
           * open the enlarged viewer.
           */
          if(
            img.src &&
            img.style.display !==
              'none'
          ){

            e.preventDefault();
            e.stopPropagation();

            openSecretPhotoViewer(
              slot
            );

            return;
          }

          /*
           * If there is no image yet,
           * allow the user to choose one.
           */
          fileInput.click();

          return;
        }

        /*
         * All other pages retain the original
         * click-to-upload behavior.
         */
        fileInput.click();
      }
    );


    /* ================================================================
       File input
       ================================================================ */

    fileInput.addEventListener(
      'change',
      function(e){

        loadImageIntoSlot(
          e.target.files[0],
          img,
          frame
        );
      }
    );


    /* ================================================================
       Drag over
       ================================================================ */

    card.addEventListener(
      'dragover',
      function(e){

        e.preventDefault();

        card.classList.add(
          'dragOver'
        );
      }
    );


    /* ================================================================
       Drag leave
       ================================================================ */

    card.addEventListener(
      'dragleave',
      function(){

        card.classList.remove(
          'dragOver'
        );
      }
    );


    /* ================================================================
       Drop onto individual card
       ================================================================ */

    card.addEventListener(
      'drop',
      function(e){

        e.preventDefault();

        card.classList.remove(
          'dragOver'
        );

        if(
          e.dataTransfer.files &&
          e.dataTransfer.files[0]
        ){

          loadImageIntoSlot(
            e.dataTransfer.files[0],
            img,
            frame
          );
        }
      }
    );
  }


  /* ================================================================
     Multi-file drop onto wall
     ================================================================ */

  wall.addEventListener(
    'dragover',
    function(e){

      e.preventDefault();
    }
  );


  wall.addEventListener(
    'drop',
    function(e){

      e.preventDefault();

      const files =
        Array.from(
          e.dataTransfer.files || []
        ).filter(
          function(file){

            return file.type.startsWith(
              'image/'
            );
          }
        );

      if(
        files.length === 0
      ){
        return;
      }

      const emptySlots =
        slots.filter(
          function(slot){

            return (
              slot.img.style.display ===
              'none'
            );
          }
        );

      files.forEach(
        function(file, idx){

          if(
            emptySlots[idx]
          ){

            loadImageIntoSlot(
              file,
              emptySlots[idx].img,
              emptySlots[idx].frame
            );
          }
        }
      );
    }
  );

  return slots;
}


/* =========================================================================
   SECRET PAGE
   Oval layout around the message.

   Responsive card sizing:
   - Desktop: larger cards
   - Tablet: medium cards
   - Phone: cards remain readable
   ========================================================================= */

function scatterOvalAroundMessage(
  slots,
  messageEl,
  opts
){

  opts =
    opts || {};

  const n =
    slots.length;

  if(n === 0){
    return;
  }

  const viewportW =
    window.innerWidth;

  const viewportH =
    window.innerHeight;

  const isPhone =
    viewportW <= 600;

  const isTablet =
    viewportW > 600 &&
    viewportW <= 900;

  /*
   * Responsive dimensions.
   */
  const minCardW =
    opts.minCardW != null
      ? opts.minCardW
      : (
          isPhone
            ? 76
            : isTablet
              ? 86
              : 96
        );

  const maxCardW =
    opts.maxCardW != null
      ? opts.maxCardW
      : (
          isPhone
            ? 94
            : isTablet
              ? 112
              : 132
        );

  const gapFromMessage =
    opts.gapFromMessage != null
      ? opts.gapFromMessage
      : (
          isPhone
            ? 10
            : 28
        );

  const gapBetweenCards =
    opts.gapBetweenCards != null
      ? opts.gapBetweenCards
      : (
          isPhone
            ? 5
            : 8
        );

  const sideMargin =
    opts.sideMargin != null
      ? opts.sideMargin
      : (
          isPhone
            ? 4
            : 8
        );

  const topMargin =
    opts.topMargin != null
      ? opts.topMargin
      : 8;

  const bottomMargin =
    opts.bottomMargin != null
      ? opts.bottomMargin
      : (
          isPhone
            ? 42
            : 56
        );

  const cardAspect =
    1.3;

  const msgRect =
    messageEl.getBoundingClientRect();

  const centerX =
    msgRect.left +
    msgRect.width / 2;

  const centerY =
    msgRect.top +
    msgRect.height / 2;

  const exclusionRadius =
    Math.sqrt(
      Math.pow(
        msgRect.width / 2,
        2
      ) +
      Math.pow(
        msgRect.height / 2,
        2
      )
    );

  const maxRadiusX =
    Math.max(
      50,
      Math.min(
        centerX,
        viewportW -
        centerX
      ) -
      sideMargin
    );

  const maxRadiusY =
    Math.max(
      50,
      Math.min(
        centerY -
        topMargin,
        viewportH -
        bottomMargin -
        centerY
      )
    );

  const tightMaxRadius =
    Math.min(
      maxRadiusX,
      maxRadiusY
    );

  let ringR =
    Math.min(
      exclusionRadius +
      gapFromMessage,
      tightMaxRadius
    );

  function cardWidthForRadius(r){

    const chord =
      2 *
      r *
      Math.sin(
        Math.PI / n
      ) -
      gapBetweenCards;

    return (
      chord /
      Math.sqrt(
        1 +
        cardAspect *
        cardAspect
      )
    );
  }

  let cardW =
    Math.max(
      minCardW,
      Math.min(
        maxCardW,
        cardWidthForRadius(
          ringR
        )
      )
    );

  /*
   * On phones, don't let the card become smaller
   * just because the message takes more space.
   *
   * Instead, reduce the ring gap slightly.
   */
  if(
    isPhone &&
    cardW < minCardW
  ){

    ringR =
      Math.min(
        tightMaxRadius,
        Math.max(
          ringR,
          (
            minCardW *
            Math.sqrt(
              1 +
              cardAspect *
              cardAspect
            ) +
            gapBetweenCards
          ) /
          (
            2 *
            Math.sin(
              Math.PI / n
            )
          )
        )
      );

    cardW =
      Math.max(
        minCardW,
        Math.min(
          maxCardW,
          cardWidthForRadius(
            ringR
          )
        )
      );
  }

  const cardH =
    cardW *
    cardAspect;

  const frameH =
    cardW *
    0.85;

  const stretch =
    isPhone
      ? 0.12
      : 0.25;

  const radiusX =
    ringR +
    stretch *
    (
      maxRadiusX -
      ringR
    );

  const radiusY =
    ringR +
    stretch *
    (
      maxRadiusY -
      ringR
    );

  slots.forEach(
    function(slot, i){

      const angle =
        (
          2 *
          Math.PI *
          i /
          n
        ) +
        (
          Math.random() *
          0.22 -
          0.11
        );

      const rJitter =
        0.95 +
        Math.random() *
        0.1;

      const x =
        centerX +
        Math.cos(angle) *
        radiusX *
        rJitter -
        cardW / 2;

      const y =
        centerY +
        Math.sin(angle) *
        radiusY *
        rJitter -
        cardH / 2;

      slot.card.style.position =
        'fixed';

      slot.card.style.width =
        cardW + 'px';

      slot.card.style.left =
        Math.round(x) +
        'px';

      slot.card.style.top =
        Math.round(y) +
        'px';

      if(slot.frame){

        slot.frame.style.height =
          frameH + 'px';
      }

      const cap =
        slot.card.querySelector(
          '.capLabel'
        );

      if(cap){

        cap.style.fontSize =
          cardW < 82
            ? '0.55rem'
            : '0.7rem';

        cap.style.marginTop =
          cardW < 82
            ? '4px'
            : '8px';
      }
    }
  );
}


/* =========================================================================
   SECRET PAGE
   Responsive grid/side layout.
   ========================================================================= */

function layoutPhotosAroundMessage(
  slots,
  messageEl,
  opts
){

  opts =
    opts || {};

  const n =
    slots.length;

  if(n === 0){
    return;
  }

  const viewportW =
    window.innerWidth;

  const isPhone =
    viewportW <= 600;

  const isTablet =
    viewportW > 600 &&
    viewportW <= 900;

  const minCardW =
    opts.minCardW != null
      ? opts.minCardW
      : (
          isPhone
            ? 76
            : isTablet
              ? 86
              : 96
        );

  const maxCardW =
    opts.maxCardW != null
      ? opts.maxCardW
      : (
          isPhone
            ? 94
            : isTablet
              ? 112
              : 132
        );

  const gap =
    opts.gap != null
      ? opts.gap
      : (
          isPhone
            ? 7
            : 10
        );

  const gapFromMessage =
    opts.gapFromMessage != null
      ? opts.gapFromMessage
      : (
          isPhone
            ? 10
            : 16
        );

  const sideMargin =
    opts.sideMargin != null
      ? opts.sideMargin
      : (
          isPhone
            ? 4
            : 8
        );

  const topMargin =
    opts.topMargin != null
      ? opts.topMargin
      : 8;

  const bottomMargin =
    opts.bottomMargin != null
      ? opts.bottomMargin
      : (
          isPhone
            ? 42
            : 56
        );

  const frameFactor =
    0.85;

  const chrome =
    24;

  function cardHeightFor(w){

    return (
      w *
      frameFactor +
      chrome
    );
  }

  const msgRect =
    messageEl.getBoundingClientRect();

  const vw =
    window.innerWidth;

  const vh =
    window.innerHeight;

  const msgLeft =
    msgRect.left;

  const msgRight =
    msgRect.right;

  const msgTop =
    msgRect.top;

  const msgBottom =
    msgRect.bottom;

  const availableTop =
    Math.max(
      0,
      msgTop -
      topMargin -
      gapFromMessage
    );

  const availableBottom =
    Math.max(
      0,
      vh -
      msgBottom -
      bottomMargin -
      gapFromMessage
    );

  const availableLeft =
    Math.max(
      0,
      msgLeft -
      sideMargin -
      gapFromMessage
    );

  const availableRight =
    Math.max(
      0,
      vw -
      msgRight -
      sideMargin -
      gapFromMessage
    );

  function buildGrid(cardW){

    const cardH =
      cardHeightFor(
        cardW
      );

    const cells = [];

    /*
     * Top row.
     */
    if(
      availableTop >=
      cardH
    ){

      const cols =
        Math.max(
          1,
          Math.floor(
            (
              vw -
              sideMargin * 2 +
              gap
            ) /
            (
              cardW +
              gap
            )
          )
        );

      const usedW =
        cols *
        cardW +
        (
          cols - 1
        ) *
        gap;

      const startX =
        Math.max(
          sideMargin,
          (
            vw -
            usedW
          ) / 2
        );

      const y =
        Math.max(
          topMargin,
          msgTop -
          gapFromMessage -
          cardH
        );

      for(
        let i = 0;
        i < cols;
        i++
      ){

        cells.push({
          x:
            startX +
            i *
            (
              cardW +
              gap
            ),
          y,
          w: cardW,
          h: cardH,
          row: 0,
          col: i
        });
      }
    }

    /*
     * Bottom row.
     */
    if(
      availableBottom >=
      cardH
    ){

      const cols =
        Math.max(
          1,
          Math.floor(
            (
              vw -
              sideMargin * 2 +
              gap
            ) /
            (
              cardW +
              gap
            )
          )
        );

      const usedW =
        cols *
        cardW +
        (
          cols - 1
        ) *
        gap;

      const startX =
        Math.max(
          sideMargin,
          (
            vw -
            usedW
          ) / 2
        );

      const y =
        Math.min(
          vh -
          bottomMargin -
          cardH,
          msgBottom +
          gapFromMessage
        );

      for(
        let i = 0;
        i < cols;
        i++
      ){

        cells.push({
          x:
            startX +
            i *
            (
              cardW +
              gap
            ),
          y,
          w: cardW,
          h: cardH,
          row: 1,
          col: i
        });
      }
    }

    /*
     * Left column.
     */
    if(
      availableLeft >=
      cardW
    ){

      const rows =
        Math.max(
          1,
          Math.floor(
            (
              vh -
              topMargin -
              bottomMargin +
              gap
            ) /
            (
              cardH +
              gap
            )
          )
        );

      const usedH =
        rows *
        cardH +
        (
          rows - 1
        ) *
        gap;

      const startY =
        Math.max(
          topMargin,
          (
            vh -
            usedH
          ) / 2
        );

      const x =
        Math.max(
          sideMargin,
          msgLeft -
          gapFromMessage -
          cardW
        );

      for(
        let i = 0;
        i < rows;
        i++
      ){

        cells.push({
          x,
          y:
            startY +
            i *
            (
              cardH +
              gap
            ),
          w: cardW,
          h: cardH,
          row: 2,
          col: i
        });
      }
    }

    /*
     * Right column.
     */
    if(
      availableRight >=
      cardW
    ){

      const rows =
        Math.max(
          1,
          Math.floor(
            (
              vh -
              topMargin -
              bottomMargin +
              gap
            ) /
            (
              cardH +
              gap
            )
          )
        );

      const usedH =
        rows *
        cardH +
        (
          rows - 1
        ) *
        gap;

      const startY =
        Math.max(
          topMargin,
          (
            vh -
            usedH
          ) / 2
        );

      const x =
        Math.min(
          vw -
          sideMargin -
          cardW,
          msgRight +
          gapFromMessage
        );

      for(
        let i = 0;
        i < rows;
        i++
      ){

        cells.push({
          x,
          y:
            startY +
            i *
            (
              cardH +
              gap
            ),
          w: cardW,
          h: cardH,
          row: 3,
          col: i
        });
      }
    }

    return {
      cols: 1,
      rows: 1,
      cardW,
      cardH,
      cells
    };
  }

  /*
   * Start at the largest desired size.
   */
  let chosen =
    null;

  for(
    let w =
      maxCardW;
    w >= minCardW;
    w -= 2
  ){

    const grid =
      buildGrid(w);

    if(
      grid.cells.length >= n
    ){

      chosen =
        grid;

      break;
    }
  }

  /*
   * If all cards cannot fit at the preferred
   * size, use the smallest safe size.
   */
  if(!chosen){

    chosen =
      buildGrid(
        minCardW
      );
  }

  const cols =
    chosen.cols;

  const byKey =
    {};

  chosen.cells.forEach(
    function(c){

      byKey[
        c.row +
        '_' +
        c.col
      ] = c;
    }
  );

  const pairs =
    [];

  const centerlineCells =
    [];

  const seen =
    new Set();

  chosen.cells.forEach(
    function(cell){

      const key =
        cell.row +
        '_' +
        cell.col;

      if(
        seen.has(key)
      ){
        return;
      }

      const mirrorCol =
        (
          cols - 1
        ) -
        cell.col;

      if(
        mirrorCol ===
        cell.col
      ){

        centerlineCells.push(
          cell
        );

        seen.add(
          key
        );

        return;
      }

      if(
        cell.col <
        mirrorCol
      ){

        const mirrorCell =
          byKey[
            cell.row +
            '_' +
            mirrorCol
          ];

        if(mirrorCell){

          pairs.push([
            cell,
            mirrorCell
          ]);

          seen.add(
            key
          );

          seen.add(
            cell.row +
            '_' +
            mirrorCol
          );

        }else{

          centerlineCells.push(
            cell
          );

          seen.add(
            key
          );
        }
      }
    }
  );

  const msgCenterY =
    (
      msgRect.top +
      msgRect.bottom
    ) / 2;

  const distFromMsg =
    function(cell){

      return Math.abs(
        (
          cell.y +
          cell.h / 2
        ) -
        msgCenterY
      );
    };

  pairs.sort(
    function(a,b){

      return (
        distFromMsg(a[0]) -
        distFromMsg(b[0])
      );
    }
  );

  centerlineCells.sort(
    function(a,b){

      return (
        distFromMsg(a) -
        distFromMsg(b)
      );
    }
  );

  const placements =
    [];

  const neededPairs =
    Math.floor(
      n / 2
    );

  for(
    let i = 0;
    i <
    Math.min(
      neededPairs,
      pairs.length
    );
    i++
  ){

    placements.push(
      pairs[i][0],
      pairs[i][1]
    );
  }

  let remaining =
    n -
    placements.length;

  let ci =
    0;

  while(
    remaining > 0 &&
    ci <
    centerlineCells.length
  ){

    placements.push(
      centerlineCells[
        ci++
      ]
    );

    remaining--;
  }

  let pi =
    neededPairs;

  while(
    remaining > 0 &&
    pi <
    pairs.length
  ){

    placements.push(
      pairs[pi][0]
    );

    remaining--;

    if(
      remaining > 0
    ){

      placements.push(
        pairs[pi][1]
      );

      remaining--;
    }

    pi++;
  }

  slots.forEach(
    function(slot,i){

      const cell =
        placements[i];

      if(!cell){

        slot.card.style.display =
          'none';

        return;
      }

      slot.card.style.display =
        '';

      slot.card.style.position =
        'fixed';

      slot.card.style.width =
        cell.w + 'px';

      slot.card.style.left =
        Math.round(
          cell.x
        ) + 'px';

      slot.card.style.top =
        Math.round(
          cell.y
        ) + 'px';

      if(slot.frame){

        slot.frame.style.height =
          (
            cell.w *
            0.85
          ) + 'px';
      }
    }
  );
}


/* =========================================================================
   Birthday page layout
   ========================================================================= */

function layoutGridAroundExclusion(
  slots,
  containerEl,
  exclusionRect,
  opts
){

  opts =
    opts || {};

  const n =
    slots.length;

  if(n === 0){
    return;
  }

  const gap =
    opts.gap != null
      ? opts.gap
      : 14;

  const gapFromCenter =
    opts.gapFromCenter != null
      ? opts.gapFromCenter
      : 18;

  const margin =
    opts.margin != null
      ? opts.margin
      : 8;

  const baseCardW =
    opts.baseCardW != null
      ? opts.baseCardW
      : 125;

  const minCardW =
    opts.minCardW != null
      ? opts.minCardW
      : 82;

  const frameFactor =
    opts.frameFactor != null
      ? opts.frameFactor
      : 0.85;

  const chrome =
    opts.chrome != null
      ? opts.chrome
      : 24;

  function cardHeightFor(w){

    return (
      frameFactor *
      w +
      chrome
    );
  }

  const cw =
    containerEl.clientWidth;

  const ch =
    containerEl.clientHeight;

  if(
    cw === 0 ||
    ch === 0
  ){
    return;
  }

  const topSpace =
    Math.max(
      0,
      exclusionRect.y -
      margin -
      gapFromCenter
    );

  const sideW =
    Math.max(
      0,
      (
        cw -
        exclusionRect.w
      ) / 2 -
      margin -
      gapFromCenter
    );

  const sideH =
    Math.max(
      0,
      exclusionRect.h
    );

  const topCount =
    Math.ceil(
      n / 3
    );

  const sideTotal =
    n -
    topCount;

  const leftCount =
    Math.ceil(
      sideTotal / 2
    );

  const rightCount =
    sideTotal -
    leftCount;

  const bands = [
    {
      name: 'top',
      count: topCount,
      w: cw -
        margin * 2,
      h: topSpace
    },
    {
      name: 'left',
      count: leftCount,
      w: sideW,
      h: sideH
    },
    {
      name: 'right',
      count: rightCount,
      w: sideW,
      h: sideH
    }
  ];

  function fitsAt(w){

    const h =
      cardHeightFor(w);

    return bands.every(
      function(band){

        if(
          band.count === 0
        ){
          return true;
        }

        if(
          w > band.w
        ){
          return false;
        }

        const cols =
          Math.max(
            1,
            Math.floor(
              (
                band.w +
                gap
              ) /
              (
                w +
                gap
              )
            )
          );

        const rows =
          Math.ceil(
            band.count /
            cols
          );

        const requiredHeight =
          rows * h +
          (
            rows - 1
          ) *
          gap;

        return (
          requiredHeight <=
          band.h
        );
      }
    );
  }

  let cardW =
    baseCardW;

  while(
    cardW > minCardW &&
    !fitsAt(cardW)
  ){

    cardW -= 2;
  }

  cardW =
    Math.max(
      minCardW,
      cardW
    );

  const largestBandW =
    Math.max.apply(
      null,
      bands.map(
        function(band){
          return band.w;
        }
      )
    );

  cardW =
    Math.min(
      cardW,
      Math.max(
        20,
        largestBandW
      )
    );

  const cardH =
    cardHeightFor(
      cardW
    );

  let index =
    0;

  bands.forEach(
    function(band){

      if(
        band.count === 0
      ){
        return;
      }

      let boxLeft;
      let boxTop;

      if(
        band.name === 'top'
      ){

        boxLeft =
          margin;

        boxTop =
          margin;

      }else if(
        band.name === 'left'
      ){

        boxLeft =
          margin;

        boxTop =
          exclusionRect.y;

      }else{

        boxLeft =
          cw -
          margin -
          band.w;

        boxTop =
          exclusionRect.y;
      }

      const cols =
        Math.max(
          1,
          Math.floor(
            (
              band.w +
              gap
            ) /
            (
              cardW +
              gap
            )
          )
        );

      const rows =
        Math.ceil(
          band.count /
          cols
        );

      const usedW =
        cols *
        cardW +
        (
          cols - 1
        ) *
        gap;

      const usedH =
        rows *
        cardH +
        (
          rows - 1
        ) *
        gap;

      const originX =
        boxLeft +
        Math.max(
          0,
          (
            band.w -
            usedW
          ) / 2
        );

      const originY =
        boxTop +
        Math.max(
          0,
          (
            band.h -
            usedH
          ) / 2
        );

      for(
        let k = 0;
        k < band.count;
        k++
      ){

        const slot =
          slots[index++];

        if(!slot){
          continue;
        }

        const col =
          k % cols;

        const row =
          Math.floor(
            k / cols
          );

        slot.card.style.position =
          'absolute';

        slot.card.style.width =
          cardW + 'px';

        slot.card.style.left =
          Math.round(
            originX +
            col *
            (
              cardW +
              gap
            )
          ) + 'px';

        slot.card.style.top =
          Math.round(
            originY +
            row *
            (
              cardH +
              gap
            )
          ) + 'px';

        if(slot.frame){

          slot.frame.style.height =
            Math.round(
              cardW *
              frameFactor
            ) + 'px';
        }
      }
    }
  );
}


/* =========================================================================
   Rectangle overlap helper
   ========================================================================= */

function rectsOverlap(
  a,
  b,
  pad
){

  pad =
    pad || 0;

  return !(
    a.x +
      a.w +
      pad <
      b.x ||

    b.x +
      b.w +
      pad <
      a.x ||

    a.y +
      a.h +
      pad <
      b.y ||

    b.y +
      b.h +
      pad <
      a.y
  );
}


/* =========================================================================
   Random scatter helper
   ========================================================================= */

function scatterSlots(
  slots,
  stageW,
  stageH,
  cardW,
  cardH,
  excludeRect
){

  const placed =
    [];

  const maxAttempts =
    200;

  slots.forEach(
    function(slot){

      let rect =
        null;

      for(
        let attempt = 0;
        attempt <
        maxAttempts;
        attempt++
      ){

        const x =
          Math.random() *
          (
            stageW -
            cardW
          );

        const y =
          Math.random() *
          (
            stageH -
            cardH
          );

        const candidate = {
          x,
          y,
          w: cardW,
          h: cardH
        };

        const hitsCake =
          excludeRect &&
          rectsOverlap(
            candidate,
            excludeRect,
            38
          );

        const hitsPlaced =
          placed.some(
            function(p){

              return rectsOverlap(
                candidate,
                p,
                16
              );
            }
          );

        if(
          !hitsCake &&
          !hitsPlaced
        ){

          rect =
            candidate;

          break;
        }
      }

      /*
       * Deterministic fallback.
       */
      if(!rect){

        const step =
          16;

        outer:
        for(
          let y = 0;
          y <=
            stageH -
            cardH;
          y += step
        ){

          for(
            let x = 0;
            x <=
              stageW -
              cardW;
            x += step
          ){

            const candidate = {
              x,
              y,
              w: cardW,
              h: cardH
            };

            const hitsCake =
              excludeRect &&
              rectsOverlap(
                candidate,
                excludeRect,
                38
              );

            const hitsPlaced =
              placed.some(
                function(p){

                  return rectsOverlap(
                    candidate,
                    p,
                    12
                  );
                }
              );

            if(
              !hitsCake &&
              !hitsPlaced
            ){

              rect =
                candidate;

              break outer;
            }
          }
        }
      }

      /*
       * Last resort.
       */
      if(!rect){

        rect = {
          x: 0,
          y: 0,
          w: cardW,
          h: cardH
        };
      }

      placed.push(
        rect
      );

      slot.card.style.position =
        'absolute';

      slot.card.style.left =
        rect.x + 'px';

      slot.card.style.top =
        rect.y + 'px';
    }
  );
}