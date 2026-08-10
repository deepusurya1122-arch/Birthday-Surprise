/* =========================================================================
   PHOTO WALL
   -------------------------------------------------------------------------
   Shared photo-wall helpers for the Birthday page and Secret Message page.

   BIRTHDAY PAGE:
   - Creates the requested number of polaroid slots.
   - Keeps photos outside the cake exclusion area.
   - Does NOT put leftover photos behind the cake.
   - Uses top / left / right areas first.
   - Uses the bottom area ONLY when there is genuinely enough room.
   - Recalculates safely when the browser is resized.
   - Keeps the photos readable instead of shrinking them unnecessarily.

   SECRET PAGE:
   - Keeps the fixed photo layout behavior.
   - Uses the existing message-centered layout.

   Public functions:
     setSlotImage()
     loadImageIntoSlot()
     buildPhotoWall()
     layoutGridAroundExclusion()
     layoutPhotosAroundMessage()
     scatterSlots()
   ========================================================================= */


/* -------------------------------------------------------------------------
   IMAGE HELPERS
   ------------------------------------------------------------------------- */

function setSlotImage(src, img, frame) {
  if (!src || !img || !frame) return;

  img.src = src;
  img.style.display = 'block';
  frame.style.background = 'none';
}


function loadImageIntoSlot(file, img, frame) {
  if (
    !file ||
    !file.type ||
    !file.type.startsWith('image/')
  ) {
    return;
  }

  const reader = new FileReader();

  reader.onload = function (event) {
    setSlotImage(
      event.target.result,
      img,
      frame
    );
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

  const wall =
    document.getElementById(containerId);

  if (!wall) {
    return [];
  }

  const slots = [];

  for (let i = 0; i < count; i++) {

    /*
       Rotation is random only once.

       IMPORTANT:
       Positioning itself is deterministic and collision-safe.
    */
    const rotation =
      (Math.random() * 14 - 7).toFixed(1);

    const card =
      document.createElement('div');

    card.className =
      'polaroid' +
      (extraClass
        ? ' ' + extraClass
        : '');

    card.dataset.rot = rotation;

    card.style.transform =
      'rotate(' + rotation + 'deg)';

    card.style.boxSizing =
      'border-box';


    /* ---------------- Frame ---------------- */

    const frame =
      document.createElement('div');

    frame.className =
      'frame';


    /* ---------------- Image ---------------- */

    const img =
      document.createElement('img');

    img.style.display =
      'none';

    img.loading =
      'lazy';

    img.draggable =
      false;

    img.onerror =
      function () {
        img.style.display =
          'none';

        img.removeAttribute(
          'src'
        );

        frame.style.background =
          '';
      };

    frame.appendChild(img);


    /* ---------------- File input ---------------- */

    const fileInput =
      document.createElement('input');

    fileInput.type =
      'file';

    fileInput.accept =
      'image/*';


    /* ---------------- Caption ---------------- */

    const caption =
      document.createElement('div');

    caption.className =
      'capLabel';

    caption.textContent =
      showLabel
        ? 'Memory #' + (i + 1)
        : '';


    /* ---------------- Assemble ---------------- */

    card.appendChild(frame);
    card.appendChild(caption);
    card.appendChild(fileInput);

    wall.appendChild(card);


    const slot = {
      card: card,
      frame: frame,
      img: img,
      fileInput: fileInput
    };

    slots.push(slot);


    /* ---------------- Preloaded image ---------------- */

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


    /* ---------------- Click upload ---------------- */

    card.addEventListener(
      'click',
      function (event) {

        if (
          event.target === fileInput
        ) {
          return;
        }

        fileInput.click();
      }
    );


    /* ---------------- File selected ---------------- */

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


    /* ---------------- Drag over ---------------- */

    card.addEventListener(
      'dragover',
      function (event) {

        event.preventDefault();

        card.classList.add(
          'dragOver'
        );
      }
    );


    /* ---------------- Drag leave ---------------- */

    card.addEventListener(
      'dragleave',
      function () {

        card.classList.remove(
          'dragOver'
        );
      }
    );


    /* ---------------- Drop ---------------- */

    card.addEventListener(
      'drop',
      function (event) {

        event.preventDefault();

        card.classList.remove(
          'dragOver'
        );

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


  /* -----------------------------------------------------------------------
     Multi-photo drop
     ----------------------------------------------------------------------- */

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
        ).filter(
          function (file) {

            return (
              file.type &&
              file.type.startsWith(
                'image/'
              )
            );
          }
        );


      if (!files.length) {
        return;
      }


      const emptySlots =
        slots.filter(
          function (slot) {

            return (
              slot.img.style.display ===
              'none'
            );
          }
        );


      files.forEach(
        function (file, index) {

          if (
            emptySlots[index]
          ) {

            loadImageIntoSlot(
              file,
              emptySlots[index].img,
              emptySlots[index].frame
            );
          }
        }
      );
    }
  );


  return slots;
}


/* =========================================================================
   GEOMETRY HELPERS
   ========================================================================= */


/*
   Birthday polaroid height.

   CSS uses:

       top padding    = 8px
       bottom padding = 16px
       frame height   = 0.85 * width

   Therefore:

       height = width * 0.85 + 24
*/

function birthdayCardHeight(
  width
) {
  return (
    width * 0.85 +
    24
  );
}


/*
   Rectangle collision test.
*/

function rectanglesOverlap(
  a,
  b,
  padding
) {
  padding =
    padding || 0;

  return !(
    a.x + a.w + padding <= b.x ||
    b.x + b.w + padding <= a.x ||
    a.y + a.h + padding <= b.y ||
    b.y + b.h + padding <= a.y
  );
}


/*
   Number of columns that can fit.
*/

function columnsForWidth(
  availableWidth,
  cardWidth,
  gap
) {
  if (
    availableWidth <= 0 ||
    cardWidth <= 0
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(
      (
        availableWidth +
        gap
      ) /
      (
        cardWidth +
        gap
      )
    )
  );
}


/*
   Number of rows that can fit.
*/

function rowsForHeight(
  availableHeight,
  cardWidth,
  gap
) {
  if (
    availableHeight <= 0 ||
    cardWidth <= 0
  ) {
    return 0;
  }

  const cardHeight =
    birthdayCardHeight(
      cardWidth
    );

  return Math.max(
    0,
    Math.floor(
      (
        availableHeight +
        gap
      ) /
      (
        cardHeight +
        gap
      )
    )
  );
}


/*
   Capacity of a rectangular band.
*/

function bandCapacity(
  box,
  cardWidth,
  gap
) {
  if (
    !box ||
    box.w <= 0 ||
    box.h <= 0
  ) {
    return 0;
  }

  const columns =
    columnsForWidth(
      box.w,
      cardWidth,
      gap
    );

  const rows =
    rowsForHeight(
      box.h,
      cardWidth,
      gap
    );

  return (
    columns *
    rows
  );
}


/* =========================================================================
   BIRTHDAY PAGE LAYOUT
   ========================================================================= */


/*
   Creates the four safe areas around the cake.

             TOP
       +---------------+
       |               |
       | L   CAKE    R |
       |               |
       +---------------+
            BOTTOM

   IMPORTANT:
   Bottom can have zero height.

   If the cake reaches the bottom of the stage, the bottom band is NOT USED.
*/

function getBirthdayBands(
  stageWidth,
  stageHeight,
  exclusion,
  margin,
  gapFromCake
) {

  return {

    top: {
      x: margin,
      y: margin,

      w:
        Math.max(
          0,
          stageWidth -
          margin * 2
        ),

      h:
        Math.max(
          0,
          exclusion.y -
          gapFromCake -
          margin
        )
    },


    bottom: {
      x: margin,

      y:
        exclusion.y +
        exclusion.h +
        gapFromCake,

      w:
        Math.max(
          0,
          stageWidth -
          margin * 2
        ),

      h:
        Math.max(
          0,
          stageHeight -
          (
            exclusion.y +
            exclusion.h
          ) -
          gapFromCake -
          margin
        )
    },


    left: {
      x: margin,

      y:
        Math.max(
          margin,
          exclusion.y
        ),

      w:
        Math.max(
          0,
          exclusion.x -
          gapFromCake -
          margin
        ),

      h:
        Math.max(
          0,
          exclusion.h
        )
    },


    right: {
      x:
        exclusion.x +
        exclusion.w +
        gapFromCake,

      y:
        Math.max(
          margin,
          exclusion.y
        ),

      w:
        Math.max(
          0,
          stageWidth -
          (
            exclusion.x +
            exclusion.w
          ) -
          gapFromCake -
          margin
        ),

      h:
        Math.max(
          0,
          exclusion.h
        )
    }

  };
}


/*
   Select a safe distribution for all 15 photos.

   Main desktop preference:

           7 TOP

       4 LEFT   4 RIGHT

   No bottom photos unless the bottom area actually has enough room.
*/

function chooseBirthdayDistribution(
  cardWidth,
  stageWidth,
  stageHeight,
  exclusion
) {

  const gap =
    stageWidth < 650
      ? 8
      : 10;

  const margin =
    stageWidth < 650
      ? 6
      : 8;

  const gapFromCake =
    stageWidth < 650
      ? 10
      : 14;

  const totalPhotos =
    15;


  const bands =
    getBirthdayBands(
      stageWidth,
      stageHeight,
      exclusion,
      margin,
      gapFromCake
    );


  const capacities = {

    top:
      bandCapacity(
        bands.top,
        cardWidth,
        gap
      ),

    bottom:
      bandCapacity(
        bands.bottom,
        cardWidth,
        gap
      ),

    left:
      bandCapacity(
        bands.left,
        cardWidth,
        gap
      ),

    right:
      bandCapacity(
        bands.right,
        cardWidth,
        gap
      )

  };


  /*
     Preferred distributions.

     Notice that the first five do NOT use bottom at all.
     This is what fixes the desktop cake overlap.
  */

  const preferred = [

    {
      top: 7,
      left: 4,
      right: 4,
      bottom: 0
    },

    {
      top: 6,
      left: 4,
      right: 5,
      bottom: 0
    },

    {
      top: 6,
      left: 5,
      right: 4,
      bottom: 0
    },

    {
      top: 8,
      left: 3,
      right: 4,
      bottom: 0
    },

    {
      top: 8,
      left: 4,
      right: 3,
      bottom: 0
    },


    /*
       Bottom is only considered if it really exists.
    */

    {
      top: 5,
      left: 3,
      right: 3,
      bottom: 4
    },

    {
      top: 6,
      left: 3,
      right: 3,
      bottom: 3
    },

    {
      top: 4,
      left: 4,
      right: 4,
      bottom: 3
    },

    {
      top: 5,
      left: 4,
      right: 3,
      bottom: 3
    },

    {
      top: 5,
      left: 3,
      right: 4,
      bottom: 3
    },

    {
      top: 7,
      left: 2,
      right: 3,
      bottom: 3
    },

    {
      top: 7,
      left: 3,
      right: 2,
      bottom: 3
    }

  ];


  function fits(
    distribution
  ) {

    return (

      distribution.top +
      distribution.left +
      distribution.right +
      distribution.bottom ===
      totalPhotos

      &&

      distribution.top <=
      capacities.top

      &&

      distribution.left <=
      capacities.left

      &&

      distribution.right <=
      capacities.right

      &&

      distribution.bottom <=
      capacities.bottom
    );
  }


  for (
    let i = 0;
    i < preferred.length;
    i++
  ) {

    if (
      fits(
        preferred[i]
      )
    ) {
      return preferred[i];
    }
  }


  /*
     Automatic search.

     Bottom is completely disabled if it has no real capacity.
  */

  const bottomUsable =
    capacities.bottom > 0;

  let best =
    null;


  for (
    let top = 0;
    top <= Math.min(
      totalPhotos,
      capacities.top
    );
    top++
  ) {

    for (
      let left = 0;
      left <= Math.min(
        totalPhotos - top,
        capacities.left
      );
      left++
    ) {

      for (
        let right = 0;
        right <= Math.min(
          totalPhotos -
          top -
          left,
          capacities.right
        );
        right++
      ) {

        const bottom =
          totalPhotos -
          top -
          left -
          right;


        if (
          bottom < 0
        ) {
          continue;
        }


        if (
          !bottomUsable &&
          bottom > 0
        ) {
          continue;
        }


        if (
          bottom >
          capacities.bottom
        ) {
          continue;
        }


        const usedBands =
          [
            top,
            left,
            right,
            bottom
          ].filter(
            Boolean
          ).length;


        const sideBalance =
          Math.abs(
            left -
            right
          );


        const verticalBalance =
          Math.abs(
            top -
            bottom
          );


        /*
           Strong penalty for using bottom.
        */

        const bottomPenalty =
          bottom * 20;


        const score =
          sideBalance * 5 +
          verticalBalance * 2 +
          bottomPenalty -
          usedBands * 3;


        if (
          !best ||
          score <
          best.score
        ) {

          best = {
            top: top,
            left: left,
            right: right,
            bottom: bottom,
            score: score
          };
        }
      }
    }
  }


  return (
    best || {

      top:
        Math.min(
          totalPhotos,
          capacities.top
        ),

      left: 0,
      right: 0,
      bottom: 0,

      score: Infinity

    }
  );
}


/*
   Place cards in one safe band.
*/

function placeBirthdayBand(
  slots,
  startIndex,
  count,
  box,
  cardWidth,
  gap
) {

  if (
    !box ||
    count <= 0
  ) {
    return startIndex;
  }


  const columns =
    columnsForWidth(
      box.w,
      cardWidth,
      gap
    );


  if (
    columns <= 0
  ) {
    return startIndex;
  }


  const rows =
    Math.ceil(
      count /
      columns
    );


  const cardHeight =
    birthdayCardHeight(
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
    cardHeight +
    (
      rows - 1
    ) *
    gap;


  /*
     Safety check.

     If it doesn't fit, DO NOT place it.
  */

  if (
    usedWidth >
      box.w + 0.5 ||
    usedHeight >
      box.h + 0.5
  ) {
    return startIndex;
  }


  const originX =
    box.x +
    (
      box.w -
      usedWidth
    ) / 2;


  const originY =
    box.y +
    (
      box.h -
      usedHeight
    ) / 2;


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
        startIndex +
        count
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
        (
          cardWidth +
          gap
        );


      const y =
        originY +
        row *
        (
          cardHeight +
          gap
        );


      slot.card.style.position =
        'absolute';

      slot.card.style.display =
        '';

      slot.card.style.width =
        cardWidth + 'px';

      slot.card.style.left =
        Math.round(x) +
        'px';

      slot.card.style.top =
        Math.round(y) +
        'px';

      slot.card.style.zIndex =
        '1';


      if (
        slot.frame
      ) {

        slot.frame.style.height =
          Math.round(
            cardWidth *
            0.85
          ) + 'px';
      }


      index++;
    }
  }


  return index;
}


/*
   MAIN BIRTHDAY LAYOUT.

   This is the important replacement for the old
   layoutGridAroundExclusion().
*/

function layoutGridAroundExclusion(
  slots,
  containerEl,
  exclusionRect,
  opts
) {

  opts =
    opts || {};


  if (
    !slots ||
    !slots.length ||
    !containerEl ||
    !exclusionRect
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


  const requestedBase =
    Number(
      opts.baseCardW
    ) || 150;


  const requestedMin =
    Number(
      opts.minCardW
    ) || 76;


  /*
     Desktop:
       large photos

     Tablet:
       medium photos

     Phone:
       smaller but still readable photos
  */

  let maxCardWidth =
    requestedBase;


  if (
    stageWidth >= 1200
  ) {

    maxCardWidth =
      Math.min(
        maxCardWidth,
        150
      );

  } else if (
    stageWidth >= 950
  ) {

    maxCardWidth =
      Math.min(
        maxCardWidth,
        138
      );

  } else if (
    stageWidth >= 700
  ) {

    maxCardWidth =
      Math.min(
        maxCardWidth,
        118
      );

  } else {

    maxCardWidth =
      Math.min(
        maxCardWidth,
        100
      );
  }


  let minCardWidth =
    requestedMin;


  if (
    stageWidth < 500
  ) {

    minCardWidth =
      Math.min(
        minCardWidth,
        70
      );
  }


  const gap =
    stageWidth < 650
      ? 8
      : 10;


  let selectedWidth =
    null;


  let selectedDistribution =
    null;


  /*
     Start large.

     Shrink only when necessary.
  */

  for (
    let width =
      Math.round(
        maxCardWidth
      );

    width >=
      minCardWidth;

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
      distribution.left +
      distribution.right +
      distribution.bottom;


    if (
      total ===
      slots.length
    ) {

      selectedWidth =
        width;

      selectedDistribution =
        distribution;

      break;
    }
  }


  /*
     Extra-small fallback.

     Still NEVER overlaps the cake.
  */

  if (
    selectedWidth ===
    null
  ) {

    for (
      let width =
        Math.min(
          maxCardWidth,
          100
        );

      width >= 54;

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
        distribution.left +
        distribution.right +
        distribution.bottom;


      if (
        total ===
        slots.length
      ) {

        selectedWidth =
          width;

        selectedDistribution =
          distribution;

        break;
      }
    }
  }


  /*
     Extreme case only.

     Never put a card behind the cake.
  */

  if (
    selectedWidth ===
    null
  ) {

    selectedWidth =
      54;

    selectedDistribution =
      chooseBirthdayDistribution(
        selectedWidth,
        stageWidth,
        stageHeight,
        exclusionRect
      );
  }


  /*
     Reset all old positions.
  */

  slots.forEach(
    function (slot) {

      slot.card.style.position =
        'absolute';

      slot.card.style.display =
        '';

      slot.card.style.width =
        selectedWidth + 'px';

      slot.card.style.zIndex =
        '1';
    }
  );


  const bands =
    getBirthdayBands(
      stageWidth,
      stageHeight,
      exclusionRect,

      stageWidth < 650
        ? 6
        : 8,

      stageWidth < 650
        ? 10
        : 14
    );


  let index =
    0;


  /*
     TOP
  */

  index =
    placeBirthdayBand(
      slots,
      index,
      selectedDistribution.top,
      bands.top,
      selectedWidth,
      gap
    );


  /*
     LEFT
  */

  index =
    placeBirthdayBand(
      slots,
      index,
      selectedDistribution.left,
      bands.left,
      selectedWidth,
      gap
    );


  /*
     RIGHT
  */

  index =
    placeBirthdayBand(
      slots,
      index,
      selectedDistribution.right,
      bands.right,
      selectedWidth,
      gap
    );


  /*
     BOTTOM.

     This is only reached when chooseBirthdayDistribution()
     explicitly determined that bottom has enough space.
  */

  index =
    placeBirthdayBand(
      slots,
      index,
      selectedDistribution.bottom,
      bands.bottom,
      selectedWidth,
      gap
    );


  /*
     -----------------------------------------------------------------------
     FINAL COLLISION SAFETY CHECK
     -----------------------------------------------------------------------

     Add a few pixels around the cake exclusion zone because rotated
     polaroids visually extend beyond their mathematical rectangle.
  */

  const safeExclusion = {

    x:
      exclusionRect.x - 4,

    y:
      exclusionRect.y - 4,

    w:
      exclusionRect.w + 8,

    h:
      exclusionRect.h + 8

  };


  for (
    let i = 0;
    i < index;
    i++
  ) {

    const slot =
      slots[i];


    const x =
      parseFloat(
        slot.card.style.left
      ) || 0;


    const y =
      parseFloat(
        slot.card.style.top
      ) || 0;


    const w =
      parseFloat(
        slot.card.style.width
      ) ||
      selectedWidth;


    const h =
      birthdayCardHeight(
        w
      );


    /*
       If anything somehow touches the cake,
       hide it instead of allowing it behind the cake.
    */

    if (
      rectanglesOverlap(
        {
          x: x,
          y: y,
          w: w,
          h: h
        },

        safeExclusion,

        4
      )
    ) {

      slot.card.style.display =
        'none';
    }
  }


  /*
     Any cards that couldn't safely fit remain hidden.

     On normal desktop/tablet/phone sizes this should not happen.
  */

  for (
    let i = index;
    i < slots.length;
    i++
  ) {

    slots[i].card.style.display =
      'none';
  }
}


/* =========================================================================
   SECRET MESSAGE PAGE LAYOUT
   ========================================================================= */


/*
   Message-centered layout.

   This remains independent from the birthday cake layout.
*/

function layoutPhotosAroundMessage(
  slots,
  messageEl,
  opts
) {

  opts =
    opts || {};


  if (
    !slots ||
    !slots.length ||
    !messageEl
  ) {
    return;
  }


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


  function cardHeight(
    width
  ) {

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
    Math.max(
      0,
      messageRect.height
    );


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
        Math.max(
          0,
          viewportWidth -
          sideMargin * 2
        ),

      h:
        topSpace
    },


    bottom: {
      w:
        Math.max(
          0,
          viewportWidth -
          sideMargin * 2
        ),

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


  const counts = {

    top: 0,
    bottom: 0,
    left: 0,
    right: 0

  };


  if (
    useSides
  ) {

    const side =
      Math.floor(
        slots.length / 4
      );


    counts.left =
      side;


    counts.right =
      side;


    const remaining =
      slots.length -
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
        slots.length / 2
      );


    counts.bottom =
      slots.length -
      counts.top;
  }


  function fits(
    width
  ) {

    const height =
      cardHeight(width);


    return bands.every(
      function (band) {

        const box =
          boxes[band];


        const count =
          counts[band];


        if (
          count === 0
        ) {
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
                box.w +
                gap
              ) /
              (
                width +
                gap
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

          <=

          box.h
        );
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


  let index =
    0;


  bands.forEach(
    function (band) {

      const count =
        counts[band];


      if (
        count === 0
      ) {
        return;
      }


      const box =
        boxes[band];


      const columns =
        Math.max(
          1,

          Math.floor(
            (
              box.w +
              gap
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


      let boxLeft =
        sideMargin;


      let boxTop =
        topMargin;


      if (
        band ===
        'top'
      ) {

        boxLeft =
          sideMargin;

        boxTop =
          topMargin;

      } else if (
        band ===
        'bottom'
      ) {

        boxLeft =
          sideMargin;

        boxTop =
          viewportHeight -
          bottomMargin -
          box.h;

      } else if (
        band ===
        'left'
      ) {

        boxLeft =
          sideMargin;

        boxTop =
          messageRect.top;

      } else if (
        band ===
        'right'
      ) {

        boxLeft =
          viewportWidth -
          sideMargin -
          box.w;

        boxTop =
          messageRect.top;
      }


      const originX =
        boxLeft +
        Math.max(
          0,
          (
            box.w -
            usedWidth
          ) / 2
        );


      const originY =
        boxTop +
        Math.max(
          0,
          (
            box.h -
            usedHeight
          ) / 2
        );


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


        slot.card.style.zIndex =
          '500';


        if (
          slot.frame
        ) {

          slot.frame.style.height =
            (
              cardWidth *
              0.85
            ) + 'px';
        }
      }
    }
  );


  for (
    let i = index;
    i < slots.length;
    i++
  ) {

    slots[i].card.style.display =
      'none';
  }
}


/* =========================================================================
   OPTIONAL RANDOM SCATTER HELPER
   ========================================================================= */


/*
   Used only if another part of the project explicitly calls scatterSlots().

   It is also collision-safe and NEVER uses an exclusion zone as a fallback.
*/

function scatterSlots(
  slots,
  stageWidth,
  stageHeight,
  cardWidth,
  cardHeight,
  excludeRect
) {

  if (
    !slots ||
    !slots.length
  ) {
    return;
  }


  const placed =
    [];


  const maxAttempts =
    300;


  slots.forEach(
    function (slot) {

      let position =
        null;


      /*
         Random attempts.
      */

      for (
        let attempt = 0;
        attempt <
        maxAttempts;
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
         Deterministic safe scan.
      */

      if (
        !position
      ) {

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
              w: cardWidth,
              h: cardHeight

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
         IMPORTANT:

         There is deliberately NO fallback such as:

             x: 4,
             y: 4

         because that could put a photo over the cake.

         If there is genuinely no safe position,
         the photo is hidden instead.
      */

      if (
        !position
      ) {

        slot.card.style.display =
          'none';

        return;
      }


      placed.push(
        position
      );


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


      if (
        slot.frame
      ) {

        slot.frame.style.height =
          (
            cardWidth *
            0.85
          ) + 'px';
      }
    }
  );
}