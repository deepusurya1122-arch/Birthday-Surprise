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
    setSlotImage(ev.target.result, img, frame);
  };
  reader.readAsDataURL(file);
}

function buildPhotoWall(containerId, count, extraClass, initialSrcs, showLabel){
  if(showLabel === undefined) showLabel = true;

  const wall = document.getElementById(containerId);
  if(!wall) return [];

  const slots = [];

  for(let i = 0; i < count; i++){
    const rot = (Math.random() * 20 - 10).toFixed(1);

    const card = document.createElement('div');
    card.className =
      'polaroid' + (extraClass ? (' ' + extraClass) : '');

    card.dataset.rot = rot;
    card.style.transform = 'rotate(' + rot + 'deg)';

    const frame = document.createElement('div');
    frame.className = 'frame';

    const img = document.createElement('img');
    img.style.display = 'none';
    img.loading = 'lazy';

    img.onerror = function(){
      img.style.display = 'none';
      img.removeAttribute('src');
      frame.style.background = '';
    };

    frame.appendChild(img);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    const cap = document.createElement('div');
    cap.className = 'capLabel';
    cap.textContent = showLabel
      ? ('Memory #' + (i + 1))
      : '';

    card.appendChild(frame);
    card.appendChild(cap);
    card.appendChild(fileInput);

    wall.appendChild(card);

    slots.push({
      card,
      frame,
      img
    });

    // Pre-load image from config if available.
    if(initialSrcs && initialSrcs[i]){
      setSlotImage(
        initialSrcs[i],
        img,
        frame
      );
    }

    // Click to upload.
    card.addEventListener('click', function(){
      fileInput.click();
    });

    fileInput.addEventListener('change', function(e){
      loadImageIntoSlot(
        e.target.files[0],
        img,
        frame
      );
    });

    // Drag over.
    card.addEventListener('dragover', function(e){
      e.preventDefault();
      card.classList.add('dragOver');
    });

    // Drag leave.
    card.addEventListener('dragleave', function(){
      card.classList.remove('dragOver');
    });

    // Drop onto individual card.
    card.addEventListener('drop', function(e){
      e.preventDefault();

      card.classList.remove('dragOver');

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
    });
  }

  // Multi-file drop onto wall.
  wall.addEventListener('dragover', function(e){
    e.preventDefault();
  });

  wall.addEventListener('drop', function(e){
    e.preventDefault();

    const files = Array.from(
      e.dataTransfer.files || []
    ).filter(function(file){
      return file.type.startsWith('image/');
    });

    if(files.length === 0) return;

    const emptySlots = slots.filter(function(slot){
      return slot.img.style.display === 'none';
    });

    files.forEach(function(file, idx){
      if(emptySlots[idx]){
        loadImageIntoSlot(
          file,
          emptySlots[idx].img,
          emptySlots[idx].frame
        );
      }
    });
  });

  return slots;
}


/**
 * Places photos evenly around an oval ring centered on a message element.
 *
 * Uses position:fixed so coordinates are relative to the actual device
 * viewport instead of a container.
 *
 * This is used for the secret/message page.
 */
function scatterOvalAroundMessage(slots, messageEl, opts){
  opts = opts || {};

  const n = slots.length;
  if(n === 0) return;

  const minCardW =
    opts.minCardW != null
      ? opts.minCardW
      : 58;

  const maxCardW =
    opts.maxCardW != null
      ? opts.maxCardW
      : 112;

  const gapFromMessage =
    opts.gapFromMessage != null
      ? opts.gapFromMessage
      : 28;

  const gapBetweenCards =
    opts.gapBetweenCards != null
      ? opts.gapBetweenCards
      : 8;

  const sideMargin =
    opts.sideMargin != null
      ? opts.sideMargin
      : 8;

  const topMargin =
    opts.topMargin != null
      ? opts.topMargin
      : 8;

  const bottomMargin =
    opts.bottomMargin != null
      ? opts.bottomMargin
      : 56;

  const cardAspect = 1.3;

  const msgRect =
    messageEl.getBoundingClientRect();

  const centerX =
    msgRect.left + msgRect.width / 2;

  const centerY =
    msgRect.top + msgRect.height / 2;

  const exclusionRadius =
    Math.sqrt(
      Math.pow(msgRect.width / 2, 2) +
      Math.pow(msgRect.height / 2, 2)
    );

  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  const maxRadiusX =
    Math.max(
      50,
      Math.min(
        centerX,
        viewportW - centerX
      ) - sideMargin
    );

  const maxRadiusY =
    Math.max(
      50,
      Math.min(
        centerY - topMargin,
        viewportH - bottomMargin - centerY
      )
    );

  const tightMaxRadius =
    Math.min(
      maxRadiusX,
      maxRadiusY
    );

  let ringR =
    Math.min(
      exclusionRadius + gapFromMessage,
      tightMaxRadius
    );

  function cardWidthForRadius(r){
    const chord =
      2 * r *
      Math.sin(Math.PI / n) -
      gapBetweenCards;

    return (
      chord /
      Math.sqrt(
        1 + cardAspect * cardAspect
      )
    );
  }

  let cardW =
    Math.max(
      minCardW,
      Math.min(
        maxCardW,
        cardWidthForRadius(ringR)
      )
    );

  if(
    cardWidthForRadius(ringR) <
    minCardW
  ){
    const neededR =
      (
        minCardW *
        Math.sqrt(
          1 + cardAspect * cardAspect
        ) +
        gapBetweenCards
      ) /
      (
        2 *
        Math.sin(Math.PI / n)
      );

    ringR =
      Math.min(
        Math.max(
          ringR,
          neededR
        ),
        tightMaxRadius
      );

    cardW =
      Math.max(
        minCardW,
        Math.min(
          maxCardW,
          cardWidthForRadius(ringR)
        )
      );
  }

  const cardH =
    cardW * cardAspect;

  const frameH =
    cardW * 0.85;

  const stretch = 0.25;

  const radiusX =
    ringR +
    stretch *
    (maxRadiusX - ringR);

  const radiusY =
    ringR +
    stretch *
    (maxRadiusY - ringR);

  slots.forEach(function(slot, i){

    const angle =
      (2 * Math.PI * i / n) +
      (Math.random() * 0.22 - 0.11);

    const rJitter =
      0.95 +
      Math.random() * 0.1;

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

    slot.card.style.position = 'fixed';
    slot.card.style.width =
      cardW + 'px';

    slot.card.style.left =
      Math.round(x) + 'px';

    slot.card.style.top =
      Math.round(y) + 'px';

    if(slot.frame){
      slot.frame.style.height =
        frameH + 'px';
    }

    const cap =
      slot.card.querySelector('.capLabel');

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
  });
}


/**
 * Arranges photos in neat rows around a message element.
 *
 * This is used on the secret/message page.
 */
function layoutPhotosAroundMessage(
  slots,
  messageEl,
  opts
){
  opts = opts || {};

  const n = slots.length;
  if(n === 0) return;

  const minCardW =
    opts.minCardW != null
      ? opts.minCardW
      : 58;

  const maxCardW =
    opts.maxCardW != null
      ? opts.maxCardW
      : 112;

  const gap =
    opts.gap != null
      ? opts.gap
      : 10;

  const gapFromMessage =
    opts.gapFromMessage != null
      ? opts.gapFromMessage
      : 16;

  const sideMargin =
    opts.sideMargin != null
      ? opts.sideMargin
      : 8;

  const topMargin =
    opts.topMargin != null
      ? opts.topMargin
      : 8;

  const bottomMargin =
    opts.bottomMargin != null
      ? opts.bottomMargin
      : 56;

  const frameFactor = 0.85;
  const chrome = 24;

  function cardHeightFor(w){
    return (
      w * frameFactor +
      chrome
    );
  }

  const msgRect =
    messageEl.getBoundingClientRect();

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const msgLeft = msgRect.left;
  const msgRight = msgRect.right;
  const msgTop = msgRect.top;
  const msgBottom = msgRect.bottom;

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

  /*
   * Build possible cells around the message.
   */
  function buildGrid(cardW){

    const cardH =
      cardHeightFor(cardW);

    const cells = [];

    // Top row.
    if(availableTop >= cardH){

      const cols =
        Math.max(
          1,
          Math.floor(
            (
              vw -
              sideMargin * 2 +
              gap
            ) /
            (cardW + gap)
          )
        );

      const usedW =
        cols * cardW +
        (cols - 1) * gap;

      const startX =
        Math.max(
          sideMargin,
          (vw - usedW) / 2
        );

      const y =
        Math.max(
          topMargin,
          msgTop -
          gapFromMessage -
          cardH
        );

      for(let i = 0; i < cols; i++){
        cells.push({
          x:
            startX +
            i * (cardW + gap),
          y,
          w: cardW,
          h: cardH,
          row: 0,
          col: i
        });
      }
    }

    // Bottom row.
    if(availableBottom >= cardH){

      const cols =
        Math.max(
          1,
          Math.floor(
            (
              vw -
              sideMargin * 2 +
              gap
            ) /
            (cardW + gap)
          )
        );

      const usedW =
        cols * cardW +
        (cols - 1) * gap;

      const startX =
        Math.max(
          sideMargin,
          (vw - usedW) / 2
        );

      const y =
        Math.min(
          vh -
          bottomMargin -
          cardH,
          msgBottom +
          gapFromMessage
        );

      for(let i = 0; i < cols; i++){
        cells.push({
          x:
            startX +
            i * (cardW + gap),
          y,
          w: cardW,
          h: cardH,
          row: 1,
          col: i
        });
      }
    }

    // Left column.
    if(availableLeft >= cardW){

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
            (cardH + gap)
          )
        );

      const usedH =
        rows * cardH +
        (rows - 1) * gap;

      const startY =
        Math.max(
          topMargin,
          (vh - usedH) / 2
        );

      const x =
        Math.max(
          sideMargin,
          msgLeft -
          gapFromMessage -
          cardW
        );

      for(let i = 0; i < rows; i++){
        cells.push({
          x,
          y:
            startY +
            i * (cardH + gap),
          w: cardW,
          h: cardH,
          row: 2,
          col: i
        });
      }
    }

    // Right column.
    if(availableRight >= cardW){

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
            (cardH + gap)
          )
        );

      const usedH =
        rows * cardH +
        (rows - 1) * gap;

      const startY =
        Math.max(
          topMargin,
          (vh - usedH) / 2
        );

      const x =
        Math.min(
          vw -
          sideMargin -
          cardW,
          msgRight +
          gapFromMessage
        );

      for(let i = 0; i < rows; i++){
        cells.push({
          x,
          y:
            startY +
            i * (cardH + gap),
          w: cardW,
          h: cardH,
          row: 3,
          col: i
        });
      }
    }

    return {
      cells,
      cardW,
      cardH
    };
  }

  let chosen = null;

  for(
    let w = maxCardW;
    w >= minCardW;
    w -= 2
  ){
    const grid = buildGrid(w);

    if(grid.cells.length >= n){
      chosen = grid;
      break;
    }
  }

  if(!chosen){
    chosen =
      buildGrid(minCardW);
  }

  /*
   * Remove duplicate/overlapping cells that can occur at the corners
   * where top/bottom rows meet left/right columns.
   */
  const uniqueCells = [];

  chosen.cells.forEach(function(cell){

    const overlap =
      uniqueCells.some(function(existing){
        return rectsOverlap(
          cell,
          existing,
          Math.max(0, gap / 2)
        );
      });

    if(!overlap){
      uniqueCells.push(cell);
    }
  });

  /*
   * Sort cells by distance from the message center.
   * This makes the closest positions preferred.
   */
  const msgCenterX =
    (msgRect.left + msgRect.right) / 2;

  const msgCenterY =
    (msgRect.top + msgRect.bottom) / 2;

  uniqueCells.sort(function(a, b){

    const acx =
      a.x + a.w / 2;

    const acy =
      a.y + a.h / 2;

    const bcx =
      b.x + b.w / 2;

    const bcy =
      b.y + b.h / 2;

    const ad =
      Math.pow(acx - msgCenterX, 2) +
      Math.pow(acy - msgCenterY, 2);

    const bd =
      Math.pow(bcx - msgCenterX, 2) +
      Math.pow(bcy - msgCenterY, 2);

    return ad - bd;
  });

  slots.forEach(function(slot, i){

    const cell =
      uniqueCells[i];

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
      Math.round(cell.x) + 'px';

    slot.card.style.top =
      Math.round(cell.y) + 'px';

    if(slot.frame){
      slot.frame.style.height =
        (cell.w * 0.85) + 'px';
    }
  });
}


/**
 * The container-relative counterpart to layoutPhotosAroundMessage.
 *
 * This is the layout used for the cake backdrop.
 *
 * IMPORTANT CHANGE:
 *
 * The old implementation divided the space into top/bottom/left/right
 * bands. Because the cake occupies the lower center of the stage, the
 * bottom band was extremely short. The shared card size therefore became
 * very small in order to make every band fit.
 *
 * The new implementation uses:
 *
 *                 TOP
 *
 *        LEFT     CAKE     RIGHT
 *
 * There is deliberately no bottom band.
 *
 * For the normal 15-photo birthday wall this results in:
 *
 *       5 photos across the top
 *       5 photos down the left
 *       5 photos down the right
 *
 * The algorithm still measures the real stage dimensions and calculates
 * the largest card size that can safely fit without overlapping the cake.
 */
function layoutGridAroundExclusion(
  slots,
  containerEl,
  exclusionRect,
  opts
){
  opts = opts || {};

  const n = slots.length;

  if(n === 0) return;

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

  /*
   * Larger starting card size.
   */
  const baseCardW =
    opts.baseCardW != null
      ? opts.baseCardW
      : 125;

  /*
   * Prevent tiny thumbnails.
   */
  const minCardW =
    opts.minCardW != null
      ? opts.minCardW
      : 82;

  /*
   * Matches the backdrop polaroid CSS:
   *
   * frame = 0.85 * width
   * top padding = 8px
   * bottom padding = 16px
   *
   * Total chrome = 24px.
   */
  const frameFactor = 0.85;
  const chrome = 24;

  function cardHeightFor(w){
    return (
      frameFactor * w +
      chrome
    );
  }

  const cw =
    containerEl.clientWidth;

  const ch =
    containerEl.clientHeight;

  if(cw === 0 || ch === 0){
    return;
  }

  /*
   * ---------------------------------------------------------------
   * AVAILABLE AREAS
   * ---------------------------------------------------------------
   */

  /*
   * Space above the cake exclusion area.
   */
  const topSpace =
    Math.max(
      0,
      exclusionRect.y -
      margin -
      gapFromCenter
    );

  /*
   * Horizontal space on either side of the cake.
   */
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

  /*
   * Vertical space alongside the cake.
   */
  const sideH =
    Math.max(
      0,
      exclusionRect.h
    );

  /*
   * ---------------------------------------------------------------
   * PHOTO DISTRIBUTION
   * ---------------------------------------------------------------
   *
   * 15 photos:
   *
   * top   = 5
   * left  = 5
   * right = 5
   */
  const topCount =
    Math.ceil(n / 3);

  const sideTotal =
    n - topCount;

  const leftCount =
    Math.ceil(sideTotal / 2);

  const rightCount =
    sideTotal - leftCount;

  const bands = [
    {
      name: 'top',
      count: topCount,
      w: cw - margin * 2,
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

  /*
   * ---------------------------------------------------------------
   * FIND LARGEST CARD SIZE
   * ---------------------------------------------------------------
   */
  function fitsAt(w){

    const h =
      cardHeightFor(w);

    return bands.every(function(band){

      if(band.count === 0){
        return true;
      }

      if(w > band.w){
        return false;
      }

      const cols =
        Math.max(
          1,
          Math.floor(
            (
              band.w + gap
            ) /
            (
              w + gap
            )
          )
        );

      const rows =
        Math.ceil(
          band.count / cols
        );

      const requiredHeight =
        rows * h +
        (rows - 1) * gap;

      return (
        requiredHeight <= band.h
      );
    });
  }

  /*
   * Start large and shrink only when genuinely necessary.
   */
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

  const cardH =
    cardHeightFor(cardW);

  /*
   * ---------------------------------------------------------------
   * PLACE EACH BAND
   * ---------------------------------------------------------------
   */
  let index = 0;

  bands.forEach(function(band){

    if(band.count === 0){
      return;
    }

    let boxLeft;
    let boxTop;

    /*
     * TOP
     */
    if(band.name === 'top'){
      boxLeft = margin;
      boxTop = margin;
    }

    /*
     * LEFT
     */
    if(band.name === 'left'){
      boxLeft = margin;
      boxTop = exclusionRect.y;
    }

    /*
     * RIGHT
     */
    if(band.name === 'right'){
      boxLeft =
        cw -
        margin -
        band.w;

      boxTop =
        exclusionRect.y;
    }

    /*
     * Number of columns that fit.
     */
    const cols =
      Math.max(
        1,
        Math.floor(
          (
            band.w + gap
          ) /
          (
            cardW + gap
          )
        )
      );

    /*
     * Number of rows required.
     */
    const rows =
      Math.ceil(
        band.count / cols
      );

    /*
     * Actual occupied width.
     */
    const usedW =
      cols * cardW +
      (cols - 1) * gap;

    /*
     * Actual occupied height.
     */
    const usedH =
      rows * cardH +
      (rows - 1) * gap;

    /*
     * Center the group inside the available band.
     */
    const originX =
      boxLeft +
      Math.max(
        0,
        (band.w - usedW) / 2
      );

    const originY =
      boxTop +
      Math.max(
        0,
        (band.h - usedH) / 2
      );

    /*
     * Position every photo.
     */
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
          (cardW + gap)
        ) + 'px';

      slot.card.style.top =
        Math.round(
          originY +
          row *
          (cardH + gap)
        ) + 'px';

      if(slot.frame){
        slot.frame.style.height =
          Math.round(
            cardW *
            frameFactor
          ) + 'px';
      }
    }
  });
}


/**
 * Checks whether two rectangles overlap.
 */
function rectsOverlap(a, b, pad){

  pad = pad || 0;

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


/**
 * Randomly scatters already-built polaroid slots inside a stage.
 *
 * This function is retained for compatibility with other pages/features
 * that may use scatterSlots().
 */
function scatterSlots(
  slots,
  stageW,
  stageH,
  cardW,
  cardH,
  excludeRect
){

  const placed = [];

  const maxAttempts = 200;

  slots.forEach(function(slot){

    let rect = null;

    /*
     * First attempt random placement.
     */
    for(
      let attempt = 0;
      attempt < maxAttempts;
      attempt++
    ){

      const x =
        Math.random() *
        (stageW - cardW);

      const y =
        Math.random() *
        (stageH - cardH);

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
        placed.some(function(p){
          return rectsOverlap(
            candidate,
            p,
            16
          );
        });

      if(
        !hitsCake &&
        !hitsPlaced
      ){
        rect = candidate;
        break;
      }
    }

    /*
     * Deterministic fallback if random placement failed.
     */
    if(!rect){

      const step = 16;

      outer:
      for(
        let y = 0;
        y <= stageH - cardH;
        y += step
      ){

        for(
          let x = 0;
          x <= stageW - cardW;
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
            placed.some(function(p){
              return rectsOverlap(
                candidate,
                p,
                12
              );
            });

          if(
            !hitsCake &&
            !hitsPlaced
          ){
            rect = candidate;
            break outer;
          }
        }
      }
    }

    /*
     * Last resort when the stage is genuinely too small.
     */
    if(!rect){

      rect = {
        x: 0,
        y: 0,
        w: cardW,
        h: cardH
      };
    }

    placed.push(rect);

    slot.card.style.position =
      'absolute';

    slot.card.style.left =
      rect.x + 'px';

    slot.card.style.top =
      rect.y + 'px';
  });
}