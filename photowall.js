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
    const rot = (Math.random()*20 - 10).toFixed(1);
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

    slots.push({
      card,
      frame,
      img
    });

    if(initialSrcs && initialSrcs[i]){
      setSlotImage(initialSrcs[i], img, frame);
    }

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
        loadImageIntoSlot(
          e.dataTransfer.files[0],
          img,
          frame
        );
      }
    });
  }

  wall.addEventListener('dragover', function(e){
    e.preventDefault();
  });

  wall.addEventListener('drop', function(e){
    e.preventDefault();

    const files = Array.from(
      e.dataTransfer.files || []
    ).filter(
      f => f.type.startsWith('image/')
    );

    if(files.length === 0) return;

    const emptySlots = slots.filter(
      s => s.img.style.display === 'none'
    );

    files.forEach((file, idx) => {
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
 * Places photos evenly around an oval ring centered on a message element,
 * using position:fixed so coordinates are relative to the actual device
 * viewport.
 */
function scatterOvalAroundMessage(slots, messageEl, opts){
  opts = opts || {};

  const n = slots.length;
  if(n === 0) return;

  const minCardW =
    opts.minCardW != null ? opts.minCardW : 58;

  const maxCardW =
    opts.maxCardW != null ? opts.maxCardW : 112;

  const gapFromMessage =
    opts.gapFromMessage != null ? opts.gapFromMessage : 28;

  const gapBetweenCards =
    opts.gapBetweenCards != null ? opts.gapBetweenCards : 8;

  const sideMargin =
    opts.sideMargin != null ? opts.sideMargin : 8;

  const topMargin =
    opts.topMargin != null ? opts.topMargin : 8;

  const bottomMargin =
    opts.bottomMargin != null ? opts.bottomMargin : 56;

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
    Math.min(maxRadiusX, maxRadiusY);

  let ringR =
    Math.min(
      exclusionRadius + gapFromMessage,
      tightMaxRadius
    );

  function cardWidthForRadius(r){
    const chord =
      2 * r * Math.sin(Math.PI / n) -
      gapBetweenCards;

    return chord /
      Math.sqrt(
        1 + cardAspect * cardAspect
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

  if(cardWidthForRadius(ringR) < minCardW){

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
        Math.max(ringR, neededR),
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
    stretch * (maxRadiusX - ringR);

  const radiusY =
    ringR +
    stretch * (maxRadiusY - ringR);

  slots.forEach(function(slot, i){

    const angle =
      (2 * Math.PI * i / n) +
      (Math.random() * 0.22 - 0.11);

    const rJitter =
      0.95 + Math.random() * 0.1;

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
        cardW < 82 ? '0.55rem' : '0.7rem';

      cap.style.marginTop =
        cardW < 82 ? '4px' : '8px';
    }
  });
}


/**
 * Arranges photos in neat rows above, below, and where possible
 * to either side of a message element.
 */
function layoutPhotosAroundMessage(slots, messageEl, opts){

  opts = opts || {};

  const n = slots.length;

  if(n === 0) return;

  const gapFromMessage =
    opts.gapFromMessage != null
      ? opts.gapFromMessage
      : 12;

  const gap =
    opts.gap != null
      ? opts.gap
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

  const baseCardW =
    opts.baseCardW != null
      ? opts.baseCardW
      : 128;

  const minCardW =
    opts.minCardW != null
      ? opts.minCardW
      : 56;

  const frameFactor =
    opts.frameFactor != null
      ? opts.frameFactor
      : 0.85;

  const chrome =
    opts.chrome != null
      ? opts.chrome
      : 24;

  function cardHeightFor(w){
    return frameFactor * w + chrome;
  }

  const vw =
    window.innerWidth;

  const vh =
    window.innerHeight;

  const msgRect =
    messageEl.getBoundingClientRect();

  const topSpace =
    Math.max(
      0,
      msgRect.top -
      topMargin -
      gapFromMessage
    );

  const bottomSpace =
    Math.max(
      0,
      vh -
      msgRect.bottom -
      bottomMargin -
      gapFromMessage
    );

  const sideW =
    Math.max(
      0,
      (vw - msgRect.width) / 2 -
      sideMargin -
      gapFromMessage
    );

  const sideH =
    msgRect.height;

  const useSides =
    sideW >= minCardW + gap * 2;

  const bandNames =
    useSides
      ? ['top', 'bottom', 'left', 'right']
      : ['top', 'bottom'];

  const bandBoxes = {

    top: {
      w: vw - sideMargin * 2,
      h: topSpace
    },

    bottom: {
      w: vw - sideMargin * 2,
      h: bottomSpace
    },

    left: {
      w: sideW,
      h: sideH
    },

    right: {
      w: sideW,
      h: sideH
    }
  };

  const bandCounts = {};

  bandNames.forEach(
    b => bandCounts[b] = 0
  );

  if(useSides){

    let side =
      Math.round(n / 4);

    if(side * 2 > n){
      side =
        Math.floor(n / 2);
    }

    bandCounts.left =
      side;

    bandCounts.right =
      side;

    const remaining =
      n - side * 2;

    bandCounts.top =
      Math.ceil(remaining / 2);

    bandCounts.bottom =
      remaining -
      bandCounts.top;

  } else {

    bandCounts.top =
      Math.ceil(n / 2);

    bandCounts.bottom =
      n -
      bandCounts.top;
  }

  function fitsAt(w){

    const h =
      cardHeightFor(w);

    return bandNames.every(
      function(name){

        const box =
          bandBoxes[name];

        const count =
          bandCounts[name];

        if(count === 0)
          return true;

        if(w > box.w)
          return false;

        const cols =
          Math.max(
            1,
            Math.floor(
              (box.w + gap) /
              (w + gap)
            )
          );

        const rows =
          Math.ceil(
            count / cols
          );

        return (
          rows * h +
          (rows - 1) * gap
        ) <= box.h;
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

  const cardH =
    cardHeightFor(cardW);

  let idx = 0;

  bandNames.forEach(
    function(name){

      const count =
        bandCounts[name];

      if(count === 0)
        return;

      const box =
        bandBoxes[name];

      let boxLeft;
      let boxTop;

      if(name === 'top'){
        boxLeft =
          sideMargin;

        boxTop =
          topMargin;
      }

      if(name === 'bottom'){
        boxLeft =
          sideMargin;

        boxTop =
          vh -
          bottomMargin -
          box.h;
      }

      if(name === 'left'){
        boxLeft =
          sideMargin;

        boxTop =
          msgRect.top;
      }

      if(name === 'right'){
        boxLeft =
          vw -
          sideMargin -
          box.w;

        boxTop =
          msgRect.top;
      }

      const cols =
        Math.max(
          1,
          Math.floor(
            (box.w + gap) /
            (cardW + gap)
          )
        );

      const rows =
        Math.ceil(
          count / cols
        );

      const usedW =
        cols * cardW +
        (cols - 1) * gap;

      const usedH =
        rows * cardH +
        (rows - 1) * gap;

      const originX =
        boxLeft +
        (box.w - usedW) / 2;

      const originY =
        boxTop +
        (box.h - usedH) / 2;

      for(
        let k = 0;
        k < count;
        k++
      ){

        const slot =
          slots[idx++];

        const colIdx =
          k % cols;

        const rowIdx =
          Math.floor(k / cols);

        slot.card.style.position =
          'fixed';

        slot.card.style.width =
          cardW + 'px';

        slot.card.style.left =
          Math.round(
            originX +
            colIdx *
            (cardW + gap)
          ) + 'px';

        slot.card.style.top =
          Math.round(
            originY +
            rowIdx *
            (cardH + gap)
          ) + 'px';

        if(slot.frame){
          slot.frame.style.height =
            (cardW * 0.85) + 'px';
        }
      }
    }
  );
}


/**
 * Splits photos evenly between two columns flanking a message element.
 */
function layoutPhotosLeftRight(slots, messageEl, opts){

  opts = opts || {};

  const n = slots.length;

  if(n === 0) return;

  const gapFromMessage =
    opts.gapFromMessage != null
      ? opts.gapFromMessage
      : 10;

  const gap =
    opts.gap != null
      ? opts.gap
      : 10;

  const sideMargin =
    opts.sideMargin != null
      ? opts.sideMargin
      : 8;

  const topMargin =
    opts.topMargin != null
      ? opts.topMargin
      : 10;

  const bottomMargin =
    opts.bottomMargin != null
      ? opts.bottomMargin
      : 56;

  const baseCardW =
    opts.baseCardW != null
      ? opts.baseCardW
      : 118;

  const minCardW =
    opts.minCardW != null
      ? opts.minCardW
      : 46;

  const cardAspect = 1.22;

  const vw =
    window.innerWidth;

  const vh =
    window.innerHeight;

  const msgRect =
    messageEl.getBoundingClientRect();

  const leftW =
    Math.max(
      0,
      msgRect.left -
      sideMargin -
      gapFromMessage
    );

  const rightW =
    Math.max(
      0,
      vw -
      msgRect.right -
      sideMargin -
      gapFromMessage
    );

  const colH =
    Math.max(
      0,
      vh -
      topMargin -
      bottomMargin
    );

  const leftCount =
    Math.ceil(n / 2);

  const rightCount =
    n - leftCount;

  const counts = {
    left: leftCount,
    right: rightCount
  };

  const boxes = {
    left: {
      w: leftW,
      h: colH
    },

    right: {
      w: rightW,
      h: colH
    }
  };

  function fitsAt(w){

    const h =
      w * cardAspect;

    return [
      'left',
      'right'
    ].every(
      function(side){

        const count =
          counts[side];

        if(count === 0)
          return true;

        const box =
          boxes[side];

        if(w > box.w)
          return false;

        const cols =
          Math.max(
            1,
            Math.floor(
              (box.w + gap) /
              (w + gap)
            )
          );

        const rows =
          Math.ceil(
            count / cols
          );

        return (
          rows * h +
          (rows - 1) * gap
        ) <= box.h;
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

  cardW =
    Math.min(
      cardW,
      Math.max(
        20,
        Math.min(
          leftW || cardW,
          rightW || cardW
        )
      )
    );

  const cardH =
    cardW * cardAspect;

  let idx = 0;

  ['left', 'right'].forEach(
    function(side){

      const count =
        counts[side];

      if(count === 0)
        return;

      const box =
        boxes[side];

      const cols =
        Math.max(
          1,
          Math.floor(
            (box.w + gap) /
            (cardW + gap)
          )
        );

      const rows =
        Math.ceil(
          count / cols
        );

      const usedW =
        cols * cardW +
        (cols - 1) * gap;

      const usedH =
        rows * cardH +
        (rows - 1) * gap;

      const boxLeft =
        side === 'left'
          ? (
              sideMargin +
              (box.w - usedW) / 2
            )
          : (
              vw -
              sideMargin -
              box.w +
              (box.w - usedW) / 2
            );

      const boxTop =
        topMargin +
        (box.h - usedH) / 2;

      for(
        let k = 0;
        k < count;
        k++
      ){

        const slot =
          slots[idx++];

        const colIdx =
          k % cols;

        const rowIdx =
          Math.floor(k / cols);

        slot.card.style.position =
          'fixed';

        slot.card.style.width =
          cardW + 'px';

        slot.card.style.left =
          Math.round(
            boxLeft +
            colIdx *
            (cardW + gap)
          ) + 'px';

        slot.card.style.top =
          Math.round(
            boxTop +
            rowIdx *
            (cardH + gap)
          ) + 'px';

        if(slot.frame){
          slot.frame.style.height =
            (cardW * 0.85) + 'px';
        }
      }
    }
  );
}


/**
 * Arranges photos in one uniform grid spanning the whole page.
 */
function layoutPhotosGrid(slots, messageEl, opts){

  opts = opts || {};

  const n =
    slots.length;

  if(n === 0)
    return;

  const gap =
    opts.gap != null
      ? opts.gap
      : 10;

  const margin =
    opts.margin != null
      ? opts.margin
      : 10;

  const bottomMargin =
    opts.bottomMargin != null
      ? opts.bottomMargin
      : 56;

  const gapFromMessage =
    opts.gapFromMessage != null
      ? opts.gapFromMessage
      : 10;

  const maxCardW =
    opts.baseCardW != null
      ? opts.baseCardW
      : 150;

  const minCardW =
    opts.minCardW != null
      ? opts.minCardW
      : 52;

  const cardAspect = 1.22;

  const vw =
    window.innerWidth;

  const vh =
    window.innerHeight;

  const availW =
    vw - margin * 2;

  const availH =
    vh -
    margin -
    bottomMargin;

  const msgRect =
    messageEl.getBoundingClientRect();

  const exclLeft =
    msgRect.left -
    gapFromMessage;

  const exclRight =
    msgRect.right +
    gapFromMessage;

  const exclTop =
    msgRect.top -
    gapFromMessage;

  const exclBottom =
    msgRect.bottom +
    gapFromMessage;

  function buildGrid(cardW){

    const cardH =
      cardW * cardAspect;

    const cols =
      Math.floor(
        (availW + gap) /
        (cardW + gap)
      );

    const rows =
      Math.floor(
        (availH + gap) /
        (cardH + gap)
      );

    if(
      cols < 1 ||
      rows < 1
    ){
      return {
        cols: 0,
        rows: 0,
        cardW,
        cardH,
        cells: []
      };
    }

    const usedW =
      cols * cardW +
      (cols - 1) * gap;

    const usedH =
      rows * cardH +
      (rows - 1) * gap;

    const originX =
      margin +
      (availW - usedW) / 2;

    const originY =
      margin +
      (availH - usedH) / 2;

    const cells = [];

    for(
      let r = 0;
      r < rows;
      r++
    ){

      for(
        let c = 0;
        c < cols;
        c++
      ){

        const x =
          originX +
          c * (cardW + gap);

        const y =
          originY +
          r * (cardH + gap);

        const overlapsMsg =
          !(
            x + cardW < exclLeft ||
            x > exclRight ||
            y + cardH < exclTop ||
            y > exclBottom
          );

        if(!overlapsMsg){

          cells.push({
            row: r,
            col: c,
            x,
            y,
            w: cardW,
            h: cardH
          });
        }
      }
    }

    return {
      cols,
      rows,
      cardW,
      cardH,
      cells
    };
  }

  let chosen = null;

  for(
    let w = maxCardW;
    w >= minCardW;
    w -= 2
  ){

    const grid =
      buildGrid(w);

    if(grid.cells.length >= n){

      chosen =
        grid;

      break;
    }
  }

  if(!chosen){
    chosen =
      buildGrid(minCardW);
  }

  const cols =
    chosen.cols;

  const byKey = {};

  chosen.cells.forEach(
    c => {
      byKey[
        c.row + '_' + c.col
      ] = c;
    }
  );

  const pairs = [];
  const centerlineCells = [];
  const seen = new Set();

  chosen.cells.forEach(
    function(cell){

      const key =
        cell.row + '_' + cell.col;

      if(seen.has(key))
        return;

      const mirrorCol =
        (cols - 1) -
        cell.col;

      if(mirrorCol === cell.col){

        centerlineCells.push(
          cell
        );

        seen.add(key);

        return;
      }

      if(cell.col < mirrorCol){

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

          seen.add(key);

          seen.add(
            cell.row +
            '_' +
            mirrorCol
          );

        } else {

          centerlineCells.push(
            cell
          );

          seen.add(key);
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
    cell =>
      Math.abs(
        (
          cell.y +
          cell.h / 2
        ) -
        msgCenterY
      );

  pairs.sort(
    (a, b) =>
      distFromMsg(a[0]) -
      distFromMsg(b[0])
  );

  centerlineCells.sort(
    (a, b) =>
      distFromMsg(a) -
      distFromMsg(b)
  );

  const placements = [];

  const neededPairs =
    Math.floor(n / 2);

  for(
    let i = 0;
    i < Math.min(
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

  let ci = 0;

  while(
    remaining > 0 &&
    ci < centerlineCells.length
  ){

    placements.push(
      centerlineCells[ci++]
    );

    remaining--;
  }

  let pi =
    neededPairs;

  while(
    remaining > 0 &&
    pi < pairs.length
  ){

    placements.push(
      pairs[pi][0]
    );

    remaining--;

    if(remaining > 0){

      placements.push(
        pairs[pi][1]
      );

      remaining--;
    }

    pi++;
  }

  slots.forEach(
    function(slot, i){

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
        Math.round(cell.x) + 'px';

      slot.card.style.top =
        Math.round(cell.y) + 'px';

      if(slot.frame){

        slot.frame.style.height =
          (cell.w * 0.85) + 'px';
      }
    }
  );
}


/**
 * Container-relative grid layout.
 *
 * Used by the birthday page around the cake backdrop.
 */
function layoutGridAroundExclusion(
  slots,
  containerEl,
  exclusionRect,
  opts
){

  opts = opts || {};

  const n =
    slots.length;

  if(n === 0)
    return;

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
   * Larger starting size.
   */
  const baseCardW =
    opts.baseCardW != null
      ? opts.baseCardW
      : 150;

  /*
   * Prevent tiny thumbnails.
   */
  const minCardW =
    opts.minCardW != null
      ? opts.minCardW
      : 58;

  const frameFactor =
    0.85;

  const chrome =
    24;

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

  if(
    cw === 0 ||
    ch === 0
  ){
    return;
  }

  /*
   * Birthday photo layout:
   *
   *              TOP
   *
   *       LEFT   CAKE   RIGHT
   *
   * Photos are distributed around the cake
   * instead of being kept in tiny scattered
   * positions.
   */

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

  /*
   * For 15 photos:
   *
   * 5 top
   * 5 left
   * 5 right
   */

  const topCount =
    Math.ceil(n / 3);

  const sideTotal =
    n - topCount;

  const leftCount =
    Math.ceil(sideTotal / 2);

  const rightCount =
    sideTotal -
    leftCount;

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
   * Find the largest card size
   * that fits all active areas.
   */

  function fitsAt(w){

    const h =
      cardHeightFor(w);

    return bands.every(
      function(band){

        if(band.count === 0)
          return true;

        if(w > band.w)
          return false;

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
            band.count /
            cols
          );

        return (
          rows * h +
          (rows - 1) * gap
        ) <= band.h;
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

  const cardH =
    cardHeightFor(cardW);

  let index = 0;

  bands.forEach(
    function(band){

      if(band.count === 0)
        return;

      let boxLeft;
      let boxTop;

      if(band.name === 'top'){

        boxLeft =
          margin;

        boxTop =
          margin;
      }

      if(band.name === 'left'){

        boxLeft =
          margin;

        boxTop =
          exclusionRect.y;
      }

      if(band.name === 'right'){

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
              band.w + gap
            ) /
            (
              cardW + gap
            )
          )
        );

      const rows =
        Math.ceil(
          band.count /
          cols
        );

      const usedW =
        cols * cardW +
        (cols - 1) * gap;

      const usedH =
        rows * cardH +
        (rows - 1) * gap;

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

      for(
        let k = 0;
        k < band.count;
        k++
      ){

        const slot =
          slots[index++];

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
    }
  );
}


function rectsOverlap(a, b, pad){

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


/**
 * Randomly scatters already-built polaroid slots inside a stage.
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

  const maxAttempts =
    200;

  slots.forEach(
    function(slot){

      let rect = null;

      for(
        let attempt = 0;
        attempt < maxAttempts;
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
            p =>
              rectsOverlap(
                candidate,
                p,
                16
              )
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
              placed.some(
                p =>
                  rectsOverlap(
                    candidate,
                    p,
                    12
                  )
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

      placed.push(rect);

      slot.card.style.position =
        'absolute';

      slot.card.style.left =
        rect.x + 'px';

      slot.card.style.top =
        rect.y + 'px';
    }
  );
}