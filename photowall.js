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

  for(let i=0;i<count;i++){
    const rot = (Math.random()*20 - 10).toFixed(1); // random tilt only, -10deg to +10deg
    const card = document.createElement('div');
    card.className = 'polaroid' + (extraClass ? (' ' + extraClass) : '');
    card.dataset.rot = rot;
    card.style.transform = 'rotate(' + rot + 'deg)';

    const frame = document.createElement('div');
    frame.className = 'frame';

    const img = document.createElement('img');
    img.style.display = 'none';
    img.loading = 'lazy';
    img.onerror = function(){
      // a bad path/URL shouldn't leave a broken-image icon — just fall back
      // to the normal empty upload placeholder for that slot
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
    cap.textContent = showLabel ? ('Memory #' + (i+1)) : '';

    card.appendChild(frame);
    card.appendChild(cap);
    card.appendChild(fileInput);
    wall.appendChild(card);
    slots.push({ card, frame, img });

    // pre-load from config, if a path/URL was provided for this slot
    if(initialSrcs && initialSrcs[i]){
      setSlotImage(initialSrcs[i], img, frame);
    }

    card.addEventListener('click', function(){
      fileInput.click();
    });
    fileInput.addEventListener('change', function(e){
      loadImageIntoSlot(e.target.files[0], img, frame);
    });

    card.addEventListener('dragover', function(e){
      e.preventDefault();
      card.classList.add('dragOver');
    });
    card.addEventListener('dragleave', function(){
      card.classList.remove('dragOver');
    });
    card.addEventListener('drop', function(e){
      e.preventDefault();
      card.classList.remove('dragOver');
      if(e.dataTransfer.files && e.dataTransfer.files[0]){
        loadImageIntoSlot(e.dataTransfer.files[0], img, frame);
      }
    });
  }

  wall.addEventListener('dragover', function(e){ e.preventDefault(); });
  wall.addEventListener('drop', function(e){
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'));
    if(files.length === 0) return;
    const emptySlots = slots.filter(s => s.img.style.display === 'none');
    files.forEach((file, idx) => {
      if(emptySlots[idx]){
        loadImageIntoSlot(file, emptySlots[idx].img, emptySlots[idx].frame);
      }
    });
  });

  return slots;
}

/**
 * Places photos evenly around an oval ring centered on a message element,
 * using position:fixed so coordinates are relative to the actual device
 * viewport — not any container box — which is what guarantees every photo
 * stays fully on-screen on any device, with no page growth or scrolling.
 *
 * Card size and ring radius are solved together from the real screen size:
 * the ring starts just outside the message, and if 15 evenly-spaced cards
 * at that tight radius would touch each other, the card size shrinks
 * (down to a readable minimum) rather than the ring growing wide — keeping
 * the frame close around the message as requested, while still fitting.
 * Only if a screen is too small even for minimum-size cards does the ring
 * grow outward, and only up to what the viewport allows.
 *
 * messageEl: the element to center around and avoid overlapping.
 * opts (all optional): baseCardW, minCardW, maxCardW, gapFromMessage,
 * gapBetweenCards, sideMargin, topMargin, bottomMargin (extra room reserved
 * at the bottom, e.g. for a back button).
 */
function scatterOvalAroundMessage(slots, messageEl, opts){
  opts = opts || {};
  const n = slots.length;
  if(n === 0) return;

  const minCardW = opts.minCardW != null ? opts.minCardW : 58;
  const maxCardW = opts.maxCardW != null ? opts.maxCardW : 112;
  const gapFromMessage = opts.gapFromMessage != null ? opts.gapFromMessage : 28;
  const gapBetweenCards = opts.gapBetweenCards != null ? opts.gapBetweenCards : 8;
  const sideMargin = opts.sideMargin != null ? opts.sideMargin : 8;
  const topMargin = opts.topMargin != null ? opts.topMargin : 8;
  const bottomMargin = opts.bottomMargin != null ? opts.bottomMargin : 56;
  const cardAspect = 1.3; // height/width, matches the polaroid's proportions

  const msgRect = messageEl.getBoundingClientRect();
  const centerX = msgRect.left + msgRect.width / 2;
  const centerY = msgRect.top + msgRect.height / 2;
  const exclusionRadius = Math.sqrt(Math.pow(msgRect.width/2, 2) + Math.pow(msgRect.height/2, 2));

  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  // furthest the ring can reach before running off any edge of the screen
  const maxRadiusX = Math.max(50, Math.min(centerX, viewportW - centerX) - sideMargin);
  const maxRadiusY = Math.max(50, Math.min(centerY - topMargin, viewportH - bottomMargin - centerY));
  const tightMaxRadius = Math.min(maxRadiusX, maxRadiusY);

  // start with a ring that hugs the message closely
  let ringR = Math.min(exclusionRadius + gapFromMessage, tightMaxRadius);

  // solve the card width that lets n cards sit evenly around this ring without touching
  function cardWidthForRadius(r){
    const chord = 2 * r * Math.sin(Math.PI / n) - gapBetweenCards;
    return chord / Math.sqrt(1 + cardAspect * cardAspect);
  }
  let cardW = Math.max(minCardW, Math.min(maxCardW, cardWidthForRadius(ringR)));

  // if the ring was too tight even for the minimum card size, grow it —
  // but never past what the screen allows
  if(cardWidthForRadius(ringR) < minCardW){
    const neededR = (minCardW * Math.sqrt(1 + cardAspect*cardAspect) + gapBetweenCards) / (2 * Math.sin(Math.PI/n));
    ringR = Math.min(Math.max(ringR, neededR), tightMaxRadius);
    cardW = Math.max(minCardW, Math.min(maxCardW, cardWidthForRadius(ringR)));
  }

  const cardH = cardW * cardAspect;
  const frameH = cardW * 0.85;

  // gently oval-ize toward whichever screen axis has extra room, without ever
  // shrinking below the safe ring radius (scaling up independently in x/y can
  // only increase the distance between neighboring cards, never decrease it)
  const stretch = 0.25;
  const radiusX = ringR + stretch * (maxRadiusX - ringR);
  const radiusY = ringR + stretch * (maxRadiusY - ringR);

  slots.forEach(function(slot, i){
    const angle = (2 * Math.PI * i / n) + (Math.random()*0.22 - 0.11);
    const rJitter = 0.95 + Math.random()*0.1;
    const x = centerX + Math.cos(angle) * radiusX * rJitter - cardW/2;
    const y = centerY + Math.sin(angle) * radiusY * rJitter - cardH/2;

    slot.card.style.position = 'fixed';
    slot.card.style.width = cardW + 'px';
    slot.card.style.left = Math.round(x) + 'px';
    slot.card.style.top = Math.round(y) + 'px';
    if(slot.frame) slot.frame.style.height = frameH + 'px';
    const cap = slot.card.querySelector('.capLabel');
    if(cap){
      cap.style.fontSize = cardW < 82 ? '0.55rem' : '0.7rem';
      cap.style.marginTop = cardW < 82 ? '4px' : '8px';
    }
  });
}

/**
 * Arranges photos in neat rows (a "picture frame" grid) directly above,
 * below, and — on screens with room for it — to either side of a message
 * element. Like scatterOvalAroundMessage, this uses position:fixed so
 * everything is measured against the real viewport: nothing can grow the
 * page or spill off any screen edge.
 *
 * How it fits without overlap or clipping:
 * - Each side of the message (top/bottom/left/right) gets its own bounded
 *   box that, by construction, never overlaps the message or run past the
 *   viewport edges. Left/right boxes only exist when there's genuinely
 *   enough width for a photo there (otherwise everything goes in the top
 *   and bottom rows, which works fine on narrow phones).
 * - One shared card size is solved for up front: starting from a slightly
 *   larger baseline than before, it shrinks only as far as needed for every
 *   box's assigned photos to wrap into rows that fit that box's height —
 *   never below a readable minimum.
 * - Within each box, photos are centered and wrap left-to-right, top-to-
 *   bottom — a normal, evenly-gapped grid, not a scattered pattern.
 *
 * messageEl: the element to frame.
 * opts (all optional): baseCardW, minCardW, gap, gapFromMessage, sideMargin,
 * topMargin, bottomMargin (extra room reserved at the bottom, e.g. for a
 * back button).
 */
function layoutPhotosAroundMessage(slots, messageEl, opts){
  opts = opts || {};
  const n = slots.length;
  if(n === 0) return;

  const gapFromMessage = opts.gapFromMessage != null ? opts.gapFromMessage : 12;
  const gap = opts.gap != null ? opts.gap : 8;
  const sideMargin = opts.sideMargin != null ? opts.sideMargin : 8;
  const topMargin = opts.topMargin != null ? opts.topMargin : 8;
  const bottomMargin = opts.bottomMargin != null ? opts.bottomMargin : 56; // room for the back button
  const baseCardW = opts.baseCardW != null ? opts.baseCardW : 128; // increased further, as requested
  const minCardW = opts.minCardW != null ? opts.minCardW : 56;
  // Exact rendered height = frame (0.85 * width) + top/bottom padding (8+16,
  // matching .secretStage .polaroid.fadedPhoto in style.css). A fixed
  // multiplier alone can't capture this since padding doesn't scale with
  // width — using the real formula keeps row-fitting math accurate instead
  // of just approximately close.
  const frameFactor = opts.frameFactor != null ? opts.frameFactor : 0.85;
  const chrome = opts.chrome != null ? opts.chrome : 24; // 8px top pad + 16px bottom pad
  function cardHeightFor(w){ return frameFactor * w + chrome; }

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const msgRect = messageEl.getBoundingClientRect();

  const topSpace = Math.max(0, msgRect.top - topMargin - gapFromMessage);
  const bottomSpace = Math.max(0, vh - msgRect.bottom - bottomMargin - gapFromMessage);
  const sideW = Math.max(0, (vw - msgRect.width) / 2 - sideMargin - gapFromMessage);
  const sideH = msgRect.height;

  const useSides = sideW >= minCardW + gap * 2;
  const bandNames = useSides ? ['top', 'bottom', 'left', 'right'] : ['top', 'bottom'];

  const bandBoxes = {
    top:    { w: vw - sideMargin * 2, h: topSpace },
    bottom: { w: vw - sideMargin * 2, h: bottomSpace },
    left:   { w: sideW, h: sideH },
    right:  { w: sideW, h: sideH }
  };

  // Left and right must always match exactly (a hard requirement — a
  // left/right split by round-robin index can accidentally land uneven).
  // Any remainder after giving both sides an equal share goes to top/bottom,
  // which doesn't have a symmetry requirement between them.
  const bandCounts = {}; bandNames.forEach(b => bandCounts[b] = 0);
  if(useSides){
    let side = Math.round(n / 4);
    if(side * 2 > n) side = Math.floor(n / 2);
    bandCounts.left = side;
    bandCounts.right = side;
    const remaining = n - side * 2;
    bandCounts.top = Math.ceil(remaining / 2);
    bandCounts.bottom = remaining - bandCounts.top;
  } else {
    bandCounts.top = Math.ceil(n / 2);
    bandCounts.bottom = n - bandCounts.top;
  }

  // solve one shared card width that lets every band's photos wrap to fit —
  // every band (including left/right) can wrap into multiple columns when
  // there's room, matching a dense, grid-like frame rather than a single
  // thin strip on the sides.
  function fitsAt(w){
    const h = cardHeightFor(w);
    return bandNames.every(function(name){
      const box = bandBoxes[name];
      const count = bandCounts[name];
      if(count === 0) return true;
      if(w > box.w) return false;
      const cols = Math.max(1, Math.floor((box.w + gap) / (w + gap)));
      const rows = Math.ceil(count / cols);
      return (rows * h + (rows - 1) * gap) <= box.h;
    });
  }
  let cardW = baseCardW;
  while(cardW > minCardW && !fitsAt(cardW)){ cardW -= 2; }
  cardW = Math.max(minCardW, cardW);
  const cardH = cardHeightFor(cardW);

  let idx = 0;
  bandNames.forEach(function(name){
    const count = bandCounts[name];
    if(count === 0) return;
    const box = bandBoxes[name];

    let boxLeft, boxTop;
    if(name === 'top'){ boxLeft = sideMargin; boxTop = topMargin; }
    if(name === 'bottom'){ boxLeft = sideMargin; boxTop = vh - bottomMargin - box.h; }
    if(name === 'left'){ boxLeft = sideMargin; boxTop = msgRect.top; }
    if(name === 'right'){ boxLeft = vw - sideMargin - box.w; boxTop = msgRect.top; }

    const cols = Math.max(1, Math.floor((box.w + gap) / (cardW + gap)));
    const rows = Math.ceil(count / cols);
    const usedW = cols * cardW + (cols - 1) * gap;
    const usedH = rows * cardH + (rows - 1) * gap;
    const originX = boxLeft + (box.w - usedW) / 2;
    const originY = boxTop + (box.h - usedH) / 2;

    for(let k = 0; k < count; k++){
      const slot = slots[idx++];
      const colIdx = k % cols;
      const rowIdx = Math.floor(k / cols);

      slot.card.style.position = 'fixed';
      slot.card.style.width = cardW + 'px';
      slot.card.style.left = Math.round(originX + colIdx * (cardW + gap)) + 'px';
      slot.card.style.top = Math.round(originY + rowIdx * (cardH + gap)) + 'px';
      if(slot.frame) slot.frame.style.height = (cardW * 0.85) + 'px';
    }
  });
}


/**
 * Splits photos evenly between two columns flanking a message element —
 * left and right — each column spanning nearly the full screen height so
 * photos fill the page naturally rather than clustering only near the
 * message. Uses position:fixed throughout, so measurements are against the
 * real device viewport: nothing can grow the page or spill off any edge.
 *
 * How balance + no-overlap is guaranteed:
 * - Photo count is split as evenly as possible between the left and right
 *   columns (n/2 each, off-by-one to whichever side if n is odd).
 * - Each column's box sits strictly left of the message's left edge or
 *   right of its right edge, so it can never overlap the message by
 *   construction — no coordinate math to get wrong there.
 * - One shared card size is solved for that lets both columns wrap their
 *   assigned photos (possibly into a few sub-columns on wide screens) into
 *   rows that fit the available height — shrinking only as far as truly
 *   needed, and never so far that a card would need to be less than a few
 *   pixels to fit (in that pathological case it's clamped to the actual
 *   available width rather than allowed to overlap the message).
 *
 * messageEl: the element to flank.
 * opts (all optional): baseCardW, minCardW, gap, gapFromMessage, sideMargin,
 * topMargin, bottomMargin (extra room reserved at the bottom, e.g. for a
 * back button).
 */
function layoutPhotosLeftRight(slots, messageEl, opts){
  opts = opts || {};
  const n = slots.length;
  if(n === 0) return;

  const gapFromMessage = opts.gapFromMessage != null ? opts.gapFromMessage : 10;
  const gap = opts.gap != null ? opts.gap : 10;
  const sideMargin = opts.sideMargin != null ? opts.sideMargin : 8;
  const topMargin = opts.topMargin != null ? opts.topMargin : 10;
  const bottomMargin = opts.bottomMargin != null ? opts.bottomMargin : 56; // room for the back button
  const baseCardW = opts.baseCardW != null ? opts.baseCardW : 118; // slightly larger, as requested
  const minCardW = opts.minCardW != null ? opts.minCardW : 46;
  const cardAspect = 1.22; // shorter than the labeled version since there's no caption text

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const msgRect = messageEl.getBoundingClientRect();

  const leftW = Math.max(0, msgRect.left - sideMargin - gapFromMessage);
  const rightW = Math.max(0, vw - msgRect.right - sideMargin - gapFromMessage);
  const colH = Math.max(0, vh - topMargin - bottomMargin);

  const leftCount = Math.ceil(n / 2);
  const rightCount = n - leftCount;
  const counts = { left: leftCount, right: rightCount };
  const boxes = { left: { w: leftW, h: colH }, right: { w: rightW, h: colH } };

  function fitsAt(w){
    const h = w * cardAspect;
    return ['left', 'right'].every(function(side){
      const count = counts[side];
      if(count === 0) return true;
      const box = boxes[side];
      if(w > box.w) return false;
      const cols = Math.max(1, Math.floor((box.w + gap) / (w + gap)));
      const rows = Math.ceil(count / cols);
      return (rows * h + (rows - 1) * gap) <= box.h;
    });
  }

  let cardW = baseCardW;
  while(cardW > minCardW && !fitsAt(cardW)){ cardW -= 2; }
  cardW = Math.max(minCardW, cardW);
  // last-resort clamp: if even the minimum doesn't physically fit the
  // available width on an extremely narrow screen, shrink to whatever
  // width IS available rather than let a photo overlap the message —
  // staying fully visible always wins over the target minimum size.
  cardW = Math.min(cardW, Math.max(20, Math.min(leftW || cardW, rightW || cardW)));
  const cardH = cardW * cardAspect;

  let idx = 0;
  ['left', 'right'].forEach(function(side){
    const count = counts[side];
    if(count === 0) return;
    const box = boxes[side];

    const cols = Math.max(1, Math.floor((box.w + gap) / (cardW + gap)));
    const rows = Math.ceil(count / cols);
    const usedW = cols * cardW + (cols - 1) * gap;
    const usedH = rows * cardH + (rows - 1) * gap;

    const boxLeft = side === 'left' ? (sideMargin + (box.w - usedW) / 2) : (vw - sideMargin - box.w + (box.w - usedW) / 2);
    const boxTop = topMargin + (box.h - usedH) / 2;

    for(let k = 0; k < count; k++){
      const slot = slots[idx++];
      const colIdx = k % cols;
      const rowIdx = Math.floor(k / cols);

      slot.card.style.position = 'fixed';
      slot.card.style.width = cardW + 'px';
      slot.card.style.left = Math.round(boxLeft + colIdx * (cardW + gap)) + 'px';
      slot.card.style.top = Math.round(boxTop + rowIdx * (cardH + gap)) + 'px';
      if(slot.frame) slot.frame.style.height = (cardW * 0.85) + 'px';
    }
  });
}


/**
 * Arranges photos in one uniform grid spanning the whole page — same row
 * height and column width everywhere — with only the cells that would
 * overlap the central message left empty, the way a photo collage with a
 * cut-out center works. This is different from layoutPhotosAroundMessage's
 * separate top/bottom/left/right bands: here every photo shares the exact
 * same grid, which is what makes left and right come out symmetric by
 * construction rather than by balancing two independent counts.
 *
 * How it works:
 * - A card size is chosen (the largest one, within given bounds, that still
 *   yields at least `slots.length` usable grid cells after removing the
 *   ones overlapping the message) — bigger photos when there's room, never
 *   so big that fewer than n cells would fit.
 * - The grid is centered as a whole block in the viewport via position:
 *   fixed, so it can't grow the page or run off any screen edge.
 * - Remaining cells are paired left/right by mirrored column. Whole pairs
 *   are used first (guaranteeing an exact left = right count), closest to
 *   the message first, so if there are more usable cells than photos the
 *   ones farthest from center are simply left empty rather than sparsely
 *   used. Because 15 doesn't split evenly, at most one leftover photo goes
 *   to a centerline cell (directly above/below the message) rather than
 *   tipping either side — the closest thing to perfect balance an odd
 *   count allows.
 *
 * messageEl: the element to frame.
 * opts (all optional): baseCardW (max), minCardW, gap, margin,
 * gapFromMessage, bottomMargin (extra room reserved at the bottom, e.g. for
 * a back button).
 */
function layoutPhotosGrid(slots, messageEl, opts){
  opts = opts || {};
  const n = slots.length;
  if(n === 0) return;

  const gap = opts.gap != null ? opts.gap : 10;
  const margin = opts.margin != null ? opts.margin : 10;
  const bottomMargin = opts.bottomMargin != null ? opts.bottomMargin : 56; // room for the back button
  const gapFromMessage = opts.gapFromMessage != null ? opts.gapFromMessage : 10;
  const maxCardW = opts.baseCardW != null ? opts.baseCardW : 150;
  const minCardW = opts.minCardW != null ? opts.minCardW : 52;
  const cardAspect = 1.22; // shorter than the labeled version since there's no caption text

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const availW = vw - margin * 2;
  const availH = vh - margin - bottomMargin;

  const msgRect = messageEl.getBoundingClientRect();
  const exclLeft = msgRect.left - gapFromMessage;
  const exclRight = msgRect.right + gapFromMessage;
  const exclTop = msgRect.top - gapFromMessage;
  const exclBottom = msgRect.bottom + gapFromMessage;

  function buildGrid(cardW){
    const cardH = cardW * cardAspect;
    const cols = Math.floor((availW + gap) / (cardW + gap));
    const rows = Math.floor((availH + gap) / (cardH + gap));
    if(cols < 1 || rows < 1) return { cols: 0, rows: 0, cardW, cardH, cells: [] };

    const usedW = cols * cardW + (cols - 1) * gap;
    const usedH = rows * cardH + (rows - 1) * gap;
    const originX = margin + (availW - usedW) / 2;
    const originY = margin + (availH - usedH) / 2;

    const cells = [];
    for(let r = 0; r < rows; r++){
      for(let c = 0; c < cols; c++){
        const x = originX + c * (cardW + gap);
        const y = originY + r * (cardH + gap);
        const overlapsMsg = !(x + cardW < exclLeft || x > exclRight || y + cardH < exclTop || y > exclBottom);
        if(!overlapsMsg){
          cells.push({ row: r, col: c, x, y, w: cardW, h: cardH });
        }
      }
    }
    return { cols, rows, cardW, cardH, cells };
  }

  // pick the largest card size (within bounds) that still leaves at least n usable cells
  let chosen = null;
  for(let w = maxCardW; w >= minCardW; w -= 2){
    const grid = buildGrid(w);
    if(grid.cells.length >= n){ chosen = grid; break; }
  }
  if(!chosen) chosen = buildGrid(minCardW); // best effort on a screen too small even at minimum size

  const cols = chosen.cols;
  const byKey = {};
  chosen.cells.forEach(c => { byKey[c.row + '_' + c.col] = c; });

  // group into left/right mirrored pairs; anything on the exact center column
  // (or with no symmetric partner) becomes a centerline candidate instead
  const pairs = [];
  const centerlineCells = [];
  const seen = new Set();
  chosen.cells.forEach(function(cell){
    const key = cell.row + '_' + cell.col;
    if(seen.has(key)) return;
    const mirrorCol = (cols - 1) - cell.col;
    if(mirrorCol === cell.col){
      centerlineCells.push(cell);
      seen.add(key);
      return;
    }
    if(cell.col < mirrorCol){
      const mirrorCell = byKey[cell.row + '_' + mirrorCol];
      if(mirrorCell){
        pairs.push([cell, mirrorCell]);
        seen.add(key);
        seen.add(cell.row + '_' + mirrorCol);
      } else {
        centerlineCells.push(cell);
        seen.add(key);
      }
    }
  });

  // closest to the message first, so any leftover cells dropped when we have
  // more room than photos are the ones farthest from center
  const msgCenterY = (msgRect.top + msgRect.bottom) / 2;
  const distFromMsg = cell => Math.abs((cell.y + cell.h / 2) - msgCenterY);
  pairs.sort((a, b) => distFromMsg(a[0]) - distFromMsg(b[0]));
  centerlineCells.sort((a, b) => distFromMsg(a) - distFromMsg(b));

  const placements = [];
  const neededPairs = Math.floor(n / 2);
  for(let i = 0; i < Math.min(neededPairs, pairs.length); i++){
    placements.push(pairs[i][0], pairs[i][1]);
  }
  let remaining = n - placements.length;
  let ci = 0;
  while(remaining > 0 && ci < centerlineCells.length){
    placements.push(centerlineCells[ci++]);
    remaining--;
  }
  let pi = neededPairs;
  while(remaining > 0 && pi < pairs.length){
    placements.push(pairs[pi][0]); remaining--;
    if(remaining > 0){ placements.push(pairs[pi][1]); remaining--; }
    pi++;
  }

  slots.forEach(function(slot, i){
    const cell = placements[i];
    if(!cell){ slot.card.style.display = 'none'; return; }
    slot.card.style.display = '';
    slot.card.style.position = 'fixed';
    slot.card.style.width = cell.w + 'px';
    slot.card.style.left = Math.round(cell.x) + 'px';
    slot.card.style.top = Math.round(cell.y) + 'px';
    if(slot.frame) slot.frame.style.height = (cell.w * 0.85) + 'px';
  });
}


/**
 * The container-relative counterpart to layoutPhotosAroundMessage — same
 * grid-band approach (top/bottom rows spanning the full width, left/right
 * columns flanking the exclusion area when there's room), but measured
 * against a given container element's own local box (position:absolute)
 * instead of the viewport (position:fixed). Used for in-page sections like
 * the cake backdrop, where photos scroll with the page rather than sitting
 * in a fixed overlay.
 *
 * Randomness is intentionally limited to each photo's rotation (set once,
 * at creation, in buildPhotoWall) — every photo's position comes from this
 * grid, so "scattered but never overlapping" is guaranteed by the grid math
 * itself rather than by chance.
 *
 * containerEl: the positioned element (position:relative) that photos are
 * placed absolutely within.
 * exclusionRect: {x,y,w,h} in containerEl's own local coordinates — the
 * area (e.g. the cake) to stay clear of.
 * opts: same tuning knobs as layoutPhotosAroundMessage (baseCardW, minCardW,
 * gap, gapFromMessage, sideMargin/topMargin/bottomMargin here just called
 * margin, applied on all sides).
 */
function layoutGridAroundExclusion(slots, containerEl, exclusionRect, opts){
  opts = opts || {};
  const n = slots.length;
  if(n === 0) return;

  const gap = opts.gap != null ? opts.gap : 8;
  const gapFromCenter = opts.gapFromCenter != null ? opts.gapFromCenter : 10;
  const margin = opts.margin != null ? opts.margin : 8;
  const baseCardW = opts.baseCardW != null ? opts.baseCardW : 92;
  const minCardW = opts.minCardW != null ? opts.minCardW : 44;
  // Exact rendered height = frame (0.85 * width) + top/bottom padding (8+16,
  // matching .cakeStage .polaroid.backdropPhoto in style.css) — see the
  // matching comment in layoutPhotosAroundMessage for why this needs to be
  // exact rather than an approximate multiplier.
  const frameFactor = opts.frameFactor != null ? opts.frameFactor : 0.85;
  const chrome = opts.chrome != null ? opts.chrome : 24; // 8px top pad + 16px bottom pad
  function cardHeightFor(w){ return frameFactor * w + chrome; }

  const cw = containerEl.clientWidth;
  const ch = containerEl.clientHeight;
  if(cw === 0 || ch === 0) return; // not visible/measurable yet

  const topSpace = Math.max(0, exclusionRect.y - margin - gapFromCenter);
  const bottomSpace = Math.max(0, ch - (exclusionRect.y + exclusionRect.h) - margin - gapFromCenter);
  const sideW = Math.max(0, (cw - exclusionRect.w) / 2 - margin - gapFromCenter);
  const sideH = exclusionRect.h;

  const useSides = sideW >= minCardW + gap * 2;
  const bandNames = useSides ? ['top', 'bottom', 'left', 'right'] : ['top', 'bottom'];

  const bandBoxes = {
    top:    { w: cw - margin * 2, h: topSpace },
    bottom: { w: cw - margin * 2, h: bottomSpace },
    left:   { w: sideW, h: sideH },
    right:  { w: sideW, h: sideH }
  };

  const bandCounts = {}; bandNames.forEach(b => bandCounts[b] = 0);
  if(useSides){
    let side = Math.round(n / 4);
    if(side * 2 > n) side = Math.floor(n / 2);
    bandCounts.left = side;
    bandCounts.right = side;
    const remaining = n - side * 2;
    bandCounts.top = Math.ceil(remaining / 2);
    bandCounts.bottom = remaining - bandCounts.top;
  } else {
    bandCounts.top = Math.ceil(n / 2);
    bandCounts.bottom = n - bandCounts.top;
  }

  function fitsAt(w){
    const h = cardHeightFor(w);
    return bandNames.every(function(name){
      const box = bandBoxes[name];
      const count = bandCounts[name];
      if(count === 0) return true;
      if(w > box.w) return false;
      const cols = Math.max(1, Math.floor((box.w + gap) / (w + gap)));
      const rows = Math.ceil(count / cols);
      return (rows * h + (rows - 1) * gap) <= box.h;
    });
  }
  let cardW = baseCardW;
  while(cardW > minCardW && !fitsAt(cardW)){ cardW -= 2; }
  cardW = Math.max(minCardW, cardW);
  const cardH = cardHeightFor(cardW);

  let idx = 0;
  bandNames.forEach(function(name){
    const count = bandCounts[name];
    if(count === 0) return;
    const box = bandBoxes[name];

    let boxLeft, boxTop;
    if(name === 'top'){ boxLeft = margin; boxTop = margin; }
    if(name === 'bottom'){ boxLeft = margin; boxTop = ch - margin - box.h; }
    if(name === 'left'){ boxLeft = margin; boxTop = exclusionRect.y; }
    if(name === 'right'){ boxLeft = cw - margin - box.w; boxTop = exclusionRect.y; }

    const cols = Math.max(1, Math.floor((box.w + gap) / (cardW + gap)));
    const rows = Math.ceil(count / cols);
    const usedW = cols * cardW + (cols - 1) * gap;
    const usedH = rows * cardH + (rows - 1) * gap;
    const originX = boxLeft + (box.w - usedW) / 2;
    const originY = boxTop + (box.h - usedH) / 2;

    for(let k = 0; k < count; k++){
      const slot = slots[idx++];
      const colIdx = k % cols;
      const rowIdx = Math.floor(k / cols);

      slot.card.style.position = 'absolute';
      slot.card.style.width = cardW + 'px';
      slot.card.style.left = Math.round(originX + colIdx * (cardW + gap)) + 'px';
      slot.card.style.top = Math.round(originY + rowIdx * (cardH + gap)) + 'px';
      if(slot.frame) slot.frame.style.height = (cardW * 0.85) + 'px';
    }
  });
}


function rectsOverlap(a, b, pad){
  pad = pad || 0;
  return !(
    a.x + a.w + pad < b.x ||
    b.x + b.w + pad < a.x ||
    a.y + a.h + pad < b.y ||
    b.y + b.h + pad < a.y
  );
}

function seededRandom(seed){
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

/**
 * Randomly scatters already-built polaroid slots inside a stage of size
 * stageW x stageH. cardW/cardH are the slot's footprint (used for collision
 * checks). excludeRect, if given, is kept clear (e.g. the cake's bounding
 * box) so photos never sit behind or overlap it.
 */
function scatterSlots(slots, stageW, stageH, cardW, cardH, excludeRect){
  const placed = [];
  const maxAttempts = 200;

  slots.forEach(function(slot, slotIdx){
    let rect = null;
    for(let attempt = 0; attempt < maxAttempts; attempt++){
      const x = seededRandom(slotIdx * 1000 + attempt * 3) * (stageW - cardW);
      const y = seededRandom(slotIdx * 1000 + attempt * 3 + 1) * (stageH - cardH);
      const candidate = { x, y, w: cardW, h: cardH };

      const hitsCake = excludeRect && rectsOverlap(candidate, excludeRect, 38);
      const hitsPlaced = placed.some(p => rectsOverlap(candidate, p, 16));

      if(!hitsCake && !hitsPlaced){
        rect = candidate;
        break;
      }
    }
    // fallback: if random placement couldn't find a free spot after maxAttempts,
    // do a deterministic grid scan of the whole stage so we still guarantee no
    // overlap with the exclusion zone or any already-placed photo.
    if(!rect){
      const step = 16;
      outer:
      for(let y = 0; y <= stageH - cardH; y += step){
        for(let x = 0; x <= stageW - cardW; x += step){
          const candidate = { x, y, w: cardW, h: cardH };
          const hitsCake = excludeRect && rectsOverlap(candidate, excludeRect, 38);
          const hitsPlaced = placed.some(p => rectsOverlap(candidate, p, 12));
          if(!hitsCake && !hitsPlaced){
            rect = candidate;
            break outer;
          }
        }
      }
    }
    // last resort (stage is simply too small for all photos): place at the
    // stage's edge — still better than throwing, though it may sit close to
    // another photo if the stage truly has no room left.
    if(!rect){
      rect = { x: 0, y: 0, w: cardW, h: cardH };
    }

    placed.push(rect);
    slot.card.style.position = 'absolute';
    slot.card.style.left = rect.x + 'px';
    slot.card.style.top = rect.y + 'px';
  });
}
