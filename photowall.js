/* =========================================================================
   PHOTO WALL
   -------------------------------------------------------------------------
   Shared photo-wall builder for the Birthday page and Secret page.

   Birthday page:
   - Always creates 15 photo slots.
   - Automatically sizes the polaroids according to available screen space.
   - Uses the area around the cake efficiently.
   - Keeps photos away from the cake, balloons and name banner.
   - Keeps all 15 photos visible.
   - Automatically recalculates on resize/orientation change.

   Secret page:
   - Keeps the existing fixed photo layout behavior.
   - Does NOT intentionally change the secret-page appearance.
   ========================================================================= */


/* -------------------------------------------------------------------------
   IMAGE HELPERS
   ------------------------------------------------------------------------- */

function setSlotImage(src, img, frame) {
  if (!src) return;

  img.src = src;
  img.style.display = 'block';
  frame.style.background = 'none';
}


function loadImageIntoSlot(file, img, frame) {
  if (!file || !file.type || !file.type.startsWith('image/')) return;

  const reader = new FileReader();

  reader.onload = function (event) {
    setSlotImage(event.target.result, img, frame);
  };

  reader.readAsDataURL(file);
}


/* -------------------------------------------------------------------------
   BUILD PHOTO WALL
   ------------------------------------------------------------------------- */

function buildPhotoWall(
  containerId,
  count,
  extraClass,
  initialSrcs,
  showLabel
) {
  if (showLabel === undefined) {
    showLabel = true;
  }

  const wall = document.getElementById(containerId);

  if (!wall) {
    return [];
  }

  const slots = [];

  for (let i = 0; i < count; i++) {

    /*
      Rotation is generated only once.
      The layout itself is deterministic so photos do not randomly overlap.
    */
    const rotation = (Math.random() * 14 - 7).toFixed(1);

    const card = document.createElement('div');

    card.className =
      'polaroid' +
      (extraClass ? ' ' + extraClass : '');

    card.dataset.rot = rotation;

    card.style.transform =
      'rotate(' + rotation + 'deg)';


    /* Photo frame */

    const frame = document.createElement('div');

    frame.className = 'frame';


    /* Image */

    const img = document.createElement('img');

    img.style.display = 'none';
    img.loading = 'lazy';

    img.onerror = function () {
      img.style.display = 'none';
      img.removeAttribute('src');
      frame.style.background = '';
    };

    frame.appendChild(img);


    /* File input */

    const fileInput = document.createElement('input');

    fileInput.type = 'file';
    fileInput.accept = 'image/*';


    /* Caption */

    const caption = document.createElement('div');

    caption.className = 'capLabel';

    caption.textContent =
      showLabel
        ? 'Memory #' + (i + 1)
        : '';


    /* Assemble */

    card.appendChild(frame);
    card.appendChild(caption);
    card.appendChild(fileInput);

    wall.appendChild(card);


    const slot = {
      card: card,
      frame: frame,
      img: img
    };

    slots.push(slot);


    /* Preloaded image */

    if (
      initialSrcs &&
      initialSrcs[i]
    ) {
      setSlotImage(
        initialSrcs[i],
        img,
        frame
      );
    }


    /* Click to upload */

    card.addEventListener('click', function () {
      fileInput.click();
    });


    /* File selected */

    fileInput.addEventListener(
      'change',
      function (event) {

        if (
          event.target.files &&
          event.target.files[0]
        ) {
          loadImageIntoSlot(
            event.target.files[0],
            img,
            frame
          );
        }

      }
    );


    /* Drag over */

    card.addEventListener(
      'dragover',
      function (event) {

        event.preventDefault();

        card.classList.add('dragOver');

      }
    );


    /* Drag leave */

    card.addEventListener(
      'dragleave',
      function () {

        card.classList.remove('dragOver');

      }
    );


    /* Drop */

    card.addEventListener(
      'drop',
      function (event) {

        event.preventDefault();

        card.classList.remove('dragOver');

        if (
          event.dataTransfer &&
          event.dataTransfer.files &&
          event.dataTransfer.files[0]
        ) {

          loadImageIntoSlot(
            event.dataTransfer.files[0],
            img,
            frame
          );

        }

      }
    );

  }


  /* Multi-photo drop */

  wall.addEventListener(
    'dragover',
    function (event) {

      event.preventDefault();

    }
  );


  wall.addEventListener(
    'drop',
    function (event) {

      event.preventDefault();

      const files =
        Array.from(
          event.dataTransfer.files || []
        ).filter(function (file) {
          return (
            file.type &&
            file.type.startsWith('image/')
          );
        });


      if (files.length === 0) {
        return;
      }


      const emptySlots =
        slots.filter(function (slot) {
          return (
            slot.img.style.display === 'none'
          );
        });


      files.forEach(function (file, index) {

        if (emptySlots[index]) {

          loadImageIntoSlot(
            file,
            emptySlots[index].img,
            emptySlots[index].frame
          );

        }

      });

    }
  );


  return slots;
}


/* =========================================================================
   BIRTHDAY PAGE LAYOUT
   ========================================================================= */


/*
   Calculate the actual rendered height of a birthday polaroid.

   CSS:
     top padding    = 8px
     bottom padding = 16px
     frame height   = 0.85 * card width

   Therefore:
     total height = width * 0.85 + 24
*/
function birthdayCardHeight(width) {
  return (
    width * 0.85 +
    24
  );
}


/*
   Check whether two rectangles overlap.
*/
function rectanglesOverlap(a, b, padding) {

  padding = padding || 0;

  return !(
    a.x + a.w + padding <= b.x ||
    b.x + b.w + padding <= a.x ||
    a.y + a.h + padding <= b.y ||
    b.y + b.h + padding <= a.y
  );
}


/*
   Find how many cards can fit horizontally inside a band.
*/
function columnsForWidth(
  availableWidth,
  cardWidth,
  gap
) {

  return Math.max(
    1,
    Math.floor(
      (availableWidth + gap) /
      (cardWidth + gap)
    )
  );

}


/*
   Find how many cards can fit vertically inside a band.
*/
function rowsForHeight(
  availableHeight,
  cardWidth,
  gap
) {

  const cardHeight =
    birthdayCardHeight(cardWidth);

  return Math.max(
    0,
    Math.floor(
      (availableHeight + gap) /
      (cardHeight + gap)
    )
  );

}


/*
   Determine a good distribution of the 15 photos.

   We deliberately prefer:

       TOP
   LEFT  CAKE  RIGHT
      BOTTOM

   On wide screens:
       5 top
       2 left
       3 right
       5 bottom

   On smaller screens the function automatically changes the distribution.

   The important part is that we NEVER throw away any of the 15 photos.
*/
function chooseBirthdayDistribution(
  cardWidth,
  stageWidth,
  stageHeight,
  exclusion
) {

  const gap = 12;

  const topHeight =
    Math.max(
      0,
      exclusion.y - 10
    );

  const bottomHeight =
    Math.max(
      0,
      stageHeight -
      (exclusion.y + exclusion.h) -
      10
    );

  const leftWidth =
    Math.max(
      0,
      exclusion.x - 10
    );

  const rightWidth =
    Math.max(
      0,
      stageWidth -
      (exclusion.x + exclusion.w) -
      10
    );

  const sideHeight =
    Math.max(
      0,
      exclusion.h
    );


  const topCols =
    columnsForWidth(
      stageWidth - 20,
      cardWidth,
      gap
    );

  const bottomCols =
    columnsForWidth(
      stageWidth - 20,
      cardWidth,
      gap
    );

  const leftCols =
    columnsForWidth(
      leftWidth,
      cardWidth,
      gap
    );

  const rightCols =
    columnsForWidth(
      rightWidth,
      cardWidth,
      gap
    );


  const topRows =
    rowsForHeight(
      topHeight,
      cardWidth,
      gap
    );

  const bottomRows =
    rowsForHeight(
      bottomHeight,
      cardWidth,
      gap
    );

  const leftRows =
    rowsForHeight(
      sideHeight,
      cardWidth,
      gap
    );

  const rightRows =
    rowsForHeight(
      sideHeight,
      cardWidth,
      gap
    );


  const capacities = {

    top:
      topCols *
      topRows,

    bottom:
      bottomCols *
      bottomRows,

    left:
      leftCols *
      leftRows,

    right:
      rightCols *
      rightRows

  };


  /*
     We want a visually balanced layout.

     Try several distributions and choose the first one
     that can hold all 15 photos.
  */

  const distributions = [

    /*
      Wide desktop
    */
    {
      top: 5,
      bottom: 5,
      left: 2,
      right: 3
    },

    {
      top: 4,
      bottom: 4,
      left: 3,
      right: 4
    },

    {
      top: 5,
      bottom: 4,
      left: 3,
      right: 3
    },

    {
      top: 4,
      bottom: 5,
      left: 3,
      right: 3
    },

    /*
      More side-heavy
    */
    {
      top: 3,
      bottom: 3,
      left: 4,
      right: 5
    },

    {
      top: 3,
      bottom: 4,
      left: 4,
      right: 4
    },

    {
      top: 4,
      bottom: 3,
      left: 4,
      right: 4
    },

    /*
      Mostly top and bottom.
    */
    {
      top: 7,
      bottom: 8,
      left: 0,
      right: 0
    },

    {
      top: 8,
      bottom: 7,
      left: 0,
      right: 0
    }

  ];


  for (
    let i = 0;
    i < distributions.length;
    i++
  ) {

    const d =
      distributions[i];


    if (
      d.top <= capacities.top &&
      d.bottom <= capacities.bottom &&
      d.left <= capacities.left &&
      d.right <= capacities.right
    ) {

      return d;

    }

  }


  /*
     If none of the preferred distributions fits,
     construct a distribution automatically.

     This is especially useful on phones.
  */

  let best = null;


  for (
    let top = 0;
    top <= Math.min(
      15,
      capacities.top
    );
    top++
  ) {

    for (
      let bottom = 0;
      bottom <= Math.min(
        15 - top,
        capacities.bottom
      );
      bottom++
    ) {

      for (
        let left = 0;
        left <= Math.min(
          15 - top - bottom,
          capacities.left
        );
        left++
      ) {

        const right =
          15 -
          top -
          bottom -
          left;


        if (
          right < 0 ||
          right > capacities.right
        ) {
          continue;
        }


        /*
           Score layouts:

           - Prefer balanced left/right.
           - Prefer balanced top/bottom.
           - Prefer using all four areas.
        */

        const sideBalance =
          Math.abs(left - right);

        const verticalBalance =
          Math.abs(top - bottom);

        const usedBands =
          [
            top,
            bottom,
            left,
            right
          ].filter(
            function (value) {
              return value > 0;
            }
          ).length;


        const score =
          sideBalance * 20 +
          verticalBalance * 5 -
          usedBands * 3;


        if (
          best === null ||
          score < best.score
        ) {

          best = {
            top: top,
            bottom: bottom,
            left: left,
            right: right,
            score: score
          };

        }

      }

    }

  }


  if (best) {
    return best;
  }


  /*
     Absolute fallback.
     At this point the screen is extremely small.
     Put every photo into top/bottom rows.
  */

  return {
    top: Math.ceil(15 / 2),
    bottom: Math.floor(15 / 2),
    left: 0,
    right: 0
  };

}


/*
   Place a row of cards inside a rectangular band.
*/
function placeBirthdayBand(
  slots,
  startIndex,
  count,
  box,
  cardWidth,
  gap
) {

  if (count <= 0) {
    return startIndex;
  }


  const cardHeight =
    birthdayCardHeight(
      cardWidth
    );


  const columns =
    Math.max(
      1,
      columnsForWidth(
        box.w,
        cardWidth,
        gap
      )
    );


  const rows =
    Math.ceil(
      count / columns
    );


  const usedWidth =
    columns * cardWidth +
    (columns - 1) * gap;


  const usedHeight =
    rows * cardHeight +
    (rows - 1) * gap;


  const originX =
    box.x +
    Math.max(
      0,
      (box.w - usedWidth) / 2
    );


  const originY =
    box.y +
    Math.max(
      0,
      (box.h - usedHeight) / 2
    );


  let index =
    startIndex;


  for (
    let row = 0;
    row < rows;
    row++
  ) {

    for (
      let col = 0;
      col < columns;
      col++
    ) {

      if (
        index >=
        startIndex + count
      ) {
        break;
      }


      const slot =
        slots[index];


      if (!slot) {
        continue;
      }


      const x =
        originX +
        col *
        (cardWidth + gap);


      const y =
        originY +
        row *
        (cardHeight + gap);


      slot.card.style.position =
        'absolute';

      slot.card.style.display =
        '';

      slot.card.style.width =
        cardWidth + 'px';

      slot.card.style.left =
        Math.round(x) + 'px';

      slot.card.style.top =
        Math.round(y) + 'px';


      if (slot.frame) {

        slot.frame.style.height =
          Math.round(
            cardWidth * 0.85
          ) + 'px';

      }


      index++;

    }

  }


  return index;

}


/*
   Main birthday layout.

   This replaces the previous layoutGridAroundExclusion()
   implementation that was shrinking the photos too aggressively.
*/
function layoutGridAroundExclusion(
  slots,
  containerEl,
  exclusionRect,
  opts
) {

  opts = opts || {};

  if (
    !slots ||
    slots.length === 0 ||
    !containerEl
  ) {
    return;
  }


  const stageWidth =
    containerEl.clientWidth;

  const stageHeight =
    containerEl.clientHeight;


  if (
    stageWidth <= 0 ||
    stageHeight <= 0
  ) {
    return;
  }


  /*
     Responsive limits.

     Desktop:
       around 155-165px

     Tablet:
       around 125-145px

     Phone:
       around 88-115px
  */

  let maxCardWidth;


  if (stageWidth >= 1200) {

    maxCardWidth = 165;

  } else if (stageWidth >= 900) {

    maxCardWidth = 150;

  } else if (stageWidth >= 650) {

    maxCardWidth = 125;

  } else {

    maxCardWidth = 105;

  }


  if (
    opts.baseCardW != null
  ) {

    maxCardWidth =
      Math.max(
        maxCardWidth,
        opts.baseCardW
      );

  }


  const minCardWidth =
    stageWidth < 480
      ? 72
      : 82;


  const gap =
    stageWidth < 600
      ? 8
      : 12;


  /*
     Try the largest card first.

     We intentionally do NOT immediately shrink to 60px.
     The old code could end up doing that because of the
     top/bottom band calculation.
  */

  let selectedWidth = null;
  let selectedDistribution = null;


  for (
    let width =
      maxCardWidth;
    width >= minCardWidth;
    width -= 2
  ) {

    const distribution =
      chooseBirthdayDistribution(
        width,
        stageWidth,
        stageHeight,
        exclusionRect
      );


    const total =
      distribution.top +
      distribution.bottom +
      distribution.left +
      distribution.right;


    if (total >= slots.length) {

      selectedWidth =
        width;

      selectedDistribution =
        distribution;

      break;

    }

  }


  /*
     If the screen is too small for the preferred
     distribution, use a safe responsive size.
  */

  if (
    selectedWidth === null
  ) {

    selectedWidth =
      Math.max(
        60,
        Math.min(
          maxCardWidth,
          stageWidth / 5
        )
      );


    selectedDistribution =
      chooseBirthdayDistribution(
        selectedWidth,
        stageWidth,
        stageHeight,
        exclusionRect
      );

  }


  const d =
    selectedDistribution;


  /*
     Clear any old positions first.
  */

  slots.forEach(function (slot) {

    slot.card.style.display =
      '';

    slot.card.style.position =
      'absolute';

  });


  /*
     Calculate the four safe bands.
  */

  const topBox = {

    x: 10,

    y: 8,

    w: stageWidth - 20,

    h:
      Math.max(
        0,
        exclusionRect.y - 16
      )

  };


  const bottomBox = {

    x: 10,

    y:
      exclusionRect.y +
      exclusionRect.h +
      8,

    w:
      stageWidth - 20,

    h:
      Math.max(
        0,
        stageHeight -
        (
          exclusionRect.y +
          exclusionRect.h
        ) -
        16
      )

  };


  const leftBox = {

    x: 8,

    y:
      exclusionRect.y,

    w:
      Math.max(
        0,
        exclusionRect.x - 16
      ),

    h:
      exclusionRect.h

  };


  const rightBox = {

    x:
      exclusionRect.x +
      exclusionRect.w +
      8,

    y:
      exclusionRect.y,

    w:
      Math.max(
        0,
        stageWidth -
        (
          exclusionRect.x +
          exclusionRect.w
        ) -
        16
      ),

    h:
      exclusionRect.h

  };


  /*
     Put photos into the four bands.

     The order remains sequential so all 15
     CONFIG photos keep their original numbering.
  */

  let index = 0;


  index =
    placeBirthdayBand(
      slots,
      index,
      d.top,
      topBox,
      selectedWidth,
      gap
    );


  index =
    placeBirthdayBand(
      slots,
      index,
      d.left,
      leftBox,
      selectedWidth,
      gap
    );


  index =
    placeBirthdayBand(
      slots,
      index,
      d.right,
      rightBox,
      selectedWidth,
      gap
    );


  index =
    placeBirthdayBand(
      slots,
      index,
      d.bottom,
      bottomBox,
      selectedWidth,
      gap
    );


  /*
     Absolute safety fallback.

     If for some unusual viewport the calculated
     distribution did not consume every slot,
     place the remaining photos in a compact row
     at the bottom without hiding them.
  */

  if (index < slots.length) {

    const remaining =
      slots.length - index;


    const safeWidth =
      Math.max(
        58,
        Math.min(
          selectedWidth,
          (
            stageWidth -
            20 -
            (
              remaining - 1
            ) * gap
          ) /
          Math.max(
            1,
            remaining
          )
        )
      );


    for (
      let i = index;
      i < slots.length;
      i++
    ) {

      const local =
        i - index;


      slots[i].card.style.position =
        'absolute';

      slots[i].card.style.display =
        '';

      slots[i].card.style.width =
        safeWidth + 'px';

      slots[i].card.style.left =
        Math.max(
          8,
          Math.min(
            stageWidth -
            safeWidth -
            8,
            8 +
            local *
            (
              safeWidth +
              gap
            )
          )
        ) + 'px';

      slots[i].card.style.top =
        Math.max(
          8,
          stageHeight -
          birthdayCardHeight(
            safeWidth
          ) -
          8
        ) + 'px';


      if (slots[i].frame) {

        slots[i].frame.style.height =
          (
            safeWidth * 0.85
          ) + 'px';

      }

    }

  }

}


/* =========================================================================
   SECRET PAGE LAYOUT
   -------------------------------------------------------------------------
   Kept separate from the birthday-page layout.
   ========================================================================= */


/*
   Existing-style fixed grid around the secret message.

   This is deliberately independent from the birthday layout above.
*/
function layoutPhotosAroundMessage(
  slots,
  messageEl,
  opts
) {

  opts = opts || {};

  if (
    !slots ||
    slots.length === 0 ||
    !messageEl
  ) {
    return;
  }


  const n =
    slots.length;


  const viewportWidth =
    window.innerWidth;


  const viewportHeight =
    window.innerHeight;


  const messageRect =
    messageEl.getBoundingClientRect();


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


  const gapFromMessage =
    opts.gapFromMessage != null
      ? opts.gapFromMessage
      : 12;


  /*
     Keep the existing secret-page sizing behavior.
  */

  let cardWidth =
    opts.baseCardW != null
      ? opts.baseCardW
      : 128;


  const minCardWidth =
    opts.minCardW != null
      ? opts.minCardW
      : 56;


  const frameFactor =
    0.85;


  const chrome =
    24;


  function cardHeight(width) {

    return (
      width *
      frameFactor +
      chrome
    );

  }


  const topSpace =
    Math.max(
      0,
      messageRect.top -
      topMargin -
      gapFromMessage
    );


  const bottomSpace =
    Math.max(
      0,
      viewportHeight -
      messageRect.bottom -
      bottomMargin -
      gapFromMessage
    );


  const sideWidth =
    Math.max(
      0,
      (
        viewportWidth -
        messageRect.width
      ) /
      2 -
      sideMargin -
      gapFromMessage
    );


  const sideHeight =
    messageRect.height;


  const useSides =
    sideWidth >=
    minCardWidth +
    gap * 2;


  const bands =
    useSides
      ? [
          'top',
          'bottom',
          'left',
          'right'
        ]
      : [
          'top',
          'bottom'
        ];


  const boxes = {

    top: {
      w:
        viewportWidth -
        sideMargin * 2,

      h:
        topSpace
    },

    bottom: {
      w:
        viewportWidth -
        sideMargin * 2,

      h:
        bottomSpace
    },

    left: {
      w:
        sideWidth,

      h:
        sideHeight
    },

    right: {
      w:
        sideWidth,

      h:
        sideHeight
    }

  };


  const counts = {};


  bands.forEach(function (band) {

    counts[band] = 0;

  });


  if (useSides) {

    let side =
      Math.floor(
        n / 4
      );


    counts.left =
      side;


    counts.right =
      side;


    const remaining =
      n -
      side * 2;


    counts.top =
      Math.ceil(
        remaining / 2
      );


    counts.bottom =
      remaining -
      counts.top;

  } else {

    counts.top =
      Math.ceil(
        n / 2
      );


    counts.bottom =
      n -
      counts.top;

  }


  function fits(width) {

    const height =
      cardHeight(width);


    return bands.every(
      function (band) {

        const box =
          boxes[band];


        const count =
          counts[band];


        if (count === 0) {
          return true;
        }


        if (
          width >
          box.w
        ) {
          return false;
        }


        const columns =
          Math.max(
            1,
            Math.floor(
              (
                box.w + gap
              ) /
              (
                width + gap
              )
            )
          );


        const rows =
          Math.ceil(
            count /
            columns
          );


        return (
          rows *
          height +
          (
            rows - 1
          ) *
          gap
        ) <= box.h;

      }
    );

  }


  while (
    cardWidth >
    minCardWidth &&
    !fits(cardWidth)
  ) {

    cardWidth -= 2;

  }


  cardWidth =
    Math.max(
      minCardWidth,
      cardWidth
    );


  let index = 0;


  bands.forEach(
    function (band) {

      const count =
        counts[band];


      if (count === 0) {
        return;
      }


      const box =
        boxes[band];


      const columns =
        Math.max(
          1,
          Math.floor(
            (
              box.w + gap
            ) /
            (
              cardWidth +
              gap
            )
          )
        );


      const rows =
        Math.ceil(
          count /
          columns
        );


      const cardHeightValue =
        cardHeight(
          cardWidth
        );


      const usedWidth =
        columns *
        cardWidth +
        (
          columns - 1
        ) *
        gap;


      const usedHeight =
        rows *
        cardHeightValue +
        (
          rows - 1
        ) *
        gap;


      let boxLeft;
      let boxTop;


      if (band === 'top') {

        boxLeft =
          sideMargin;

        boxTop =
          topMargin;

      }


      if (band === 'bottom') {

        boxLeft =
          sideMargin;

        boxTop =
          viewportHeight -
          bottomMargin -
          box.h;

      }


      if (band === 'left') {

        boxLeft =
          sideMargin;

        boxTop =
          messageRect.top;

      }


      if (band === 'right') {

        boxLeft =
          viewportWidth -
          sideMargin -
          box.w;

        boxTop =
          messageRect.top;

      }


      const originX =
        boxLeft +
        (
          box.w -
          usedWidth
        ) /
        2;


      const originY =
        boxTop +
        (
          box.h -
          usedHeight
        ) /
        2;


      for (
        let k = 0;
        k < count;
        k++
      ) {

        const slot =
          slots[index++];


        if (!slot) {
          continue;
        }


        const column =
          k %
          columns;


        const row =
          Math.floor(
            k /
            columns
          );


        slot.card.style.position =
          'fixed';

        slot.card.style.display =
          '';

        slot.card.style.width =
          cardWidth + 'px';

        slot.card.style.left =
          Math.round(
            originX +
            column *
            (
              cardWidth +
              gap
            )
          ) + 'px';

        slot.card.style.top =
          Math.round(
            originY +
            row *
            (
              cardHeightValue +
              gap
            )
          ) + 'px';


        if (slot.frame) {

          slot.frame.style.height =
            (
              cardWidth *
              0.85
            ) + 'px';

        }

      }

    }
  );

}


/* =========================================================================
   OPTIONAL RANDOM SCATTER HELPER
   ========================================================================= */

function scatterSlots(
  slots,
  stageWidth,
  stageHeight,
  cardWidth,
  cardHeight,
  excludeRect
) {

  const placed = [];

  const maxAttempts = 300;


  slots.forEach(function (slot) {

    let position = null;


    for (
      let attempt = 0;
      attempt < maxAttempts;
      attempt++
    ) {

      const candidate = {

        x:
          Math.random() *
          Math.max(
            1,
            stageWidth -
            cardWidth
          ),

        y:
          Math.random() *
          Math.max(
            1,
            stageHeight -
            cardHeight
          ),

        w:
          cardWidth,

        h:
          cardHeight

      };


      const hitsExclude =
        excludeRect &&
        rectanglesOverlap(
          candidate,
          excludeRect,
          12
        );


      const hitsPhoto =
        placed.some(
          function (existing) {

            return rectanglesOverlap(
              candidate,
              existing,
              8
            );

          }
        );


      if (
        !hitsExclude &&
        !hitsPhoto
      ) {

        position =
          candidate;

        break;

      }

    }


    /*
       Deterministic fallback.
    */

    if (!position) {

      outerLoop:

      for (
        let y = 0;
        y <=
        stageHeight -
        cardHeight;
        y += 8
      ) {

        for (
          let x = 0;
          x <=
          stageWidth -
          cardWidth;
          x += 8
        ) {

          const candidate = {

            x: x,

            y: y,

            w:
              cardWidth,

            h:
              cardHeight

          };


          if (
            excludeRect &&
            rectanglesOverlap(
              candidate,
              excludeRect,
              12
            )
          ) {
            continue;
          }


          if (
            placed.some(
              function (existing) {

                return rectanglesOverlap(
                  candidate,
                  existing,
                  8
                );

              }
            )
          ) {
            continue;
          }


          position =
            candidate;

          break outerLoop;

        }

      }

    }


    /*
       Last-resort position.
    */

    if (!position) {

      position = {

        x: 4,

        y: 4,

        w:
          cardWidth,

        h:
          cardHeight

      };

    }


    placed.push(position);


    slot.card.style.position =
      'absolute';

    slot.card.style.left =
      Math.round(
        position.x
      ) + 'px';

    slot.card.style.top =
      Math.round(
        position.y
      ) + 'px';

    slot.card.style.width =
      cardWidth + 'px';


    if (slot.frame) {

      slot.frame.style.height =
        (
          cardWidth *
          0.85
        ) + 'px';

    }

  });

}