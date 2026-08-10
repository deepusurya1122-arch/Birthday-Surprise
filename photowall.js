/* =========================================================================
   PHOTO WALL
   -------------------------------------------------------------------------
   Shared photo-wall builder for the Birthday page and Secret page.

   Birthday page:
   - Supports all 15 photos.
   - Responsive sizing.
   - Desktop layout uses the space around the cake.
   - Keeps photos away from cake / balloons / central artwork.
   - Reserves space for the Secret Message button.
   - Mobile layout remains independent.

   Secret page:
   - Uses a separate layout function.
   - Does not apply birthday-page positioning to secret photos.
   ========================================================================= */


/* =========================================================================
   IMAGE HELPERS
   ========================================================================= */

function setSlotImage(src, img, frame) {
  if (!src || !img || !frame) {
    return;
  }

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


/* =========================================================================
   PHOTO WALL BUILDER
   ========================================================================= */

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
    document.getElementById(
      containerId
    );

  if (!wall) {
    return [];
  }


  const slots = [];


  for (
    let i = 0;
    i < count;
    i++
  ) {

    /*
     * Keep the existing Polaroid-style random rotation.
     * Positioning itself is controlled by the layout functions.
     */
    const rotation =
      (
        Math.random() * 14 - 7
      ).toFixed(1);


    const card =
      document.createElement('div');


    card.className =
      'polaroid' +
      (
        extraClass
          ? ' ' + extraClass
          : ''
      );


    card.dataset.rot =
      rotation;


    card.style.transform =
      'rotate(' +
      rotation +
      'deg)';


    /* ---------------------------------------------------------------
       PHOTO FRAME
       --------------------------------------------------------------- */

    const frame =
      document.createElement('div');

    frame.className =
      'frame';


    /* ---------------------------------------------------------------
       IMAGE
       --------------------------------------------------------------- */

    const img =
      document.createElement('img');


    img.style.display =
      'none';

    img.loading =
      'lazy';


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


    frame.appendChild(
      img
    );


    /* ---------------------------------------------------------------
       FILE INPUT
       --------------------------------------------------------------- */

    const fileInput =
      document.createElement(
        'input'
      );


    fileInput.type =
      'file';

    fileInput.accept =
      'image/*';


    /* ---------------------------------------------------------------
       CAPTION
       --------------------------------------------------------------- */

    const caption =
      document.createElement(
        'div'
      );


    caption.className =
      'capLabel';


    caption.textContent =
      showLabel
        ? 'Memory #' + (i + 1)
        : '';


    /* ---------------------------------------------------------------
       ASSEMBLE
       --------------------------------------------------------------- */

    card.appendChild(
      frame
    );

    card.appendChild(
      caption
    );

    card.appendChild(
      fileInput
    );


    wall.appendChild(
      card
    );


    const slot = {

      card: card,

      frame: frame,

      img: img

    };


    slots.push(
      slot
    );


    /* ---------------------------------------------------------------
       PRELOADED IMAGE
       --------------------------------------------------------------- */

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


    /* ---------------------------------------------------------------
       CLICK TO UPLOAD
       --------------------------------------------------------------- */

    card.addEventListener(
      'click',
      function () {

        fileInput.click();

      }
    );


    /* ---------------------------------------------------------------
       FILE SELECTED
       --------------------------------------------------------------- */

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


    /* ---------------------------------------------------------------
       DRAG OVER
       --------------------------------------------------------------- */

    card.addEventListener(
      'dragover',
      function (event) {

        event.preventDefault();

        card.classList.add(
          'dragOver'
        );

      }
    );


    /* ---------------------------------------------------------------
       DRAG LEAVE
       --------------------------------------------------------------- */

    card.addEventListener(
      'dragleave',
      function () {

        card.classList.remove(
          'dragOver'
        );

      }
    );


    /* ---------------------------------------------------------------
       DROP
       --------------------------------------------------------------- */

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


  /* =========================================================================
     MULTI-PHOTO DROP
     ========================================================================= */

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


      if (
        files.length === 0
      ) {
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
   BIRTHDAY CARD DIMENSIONS
   ========================================================================= */

function birthdayCardHeight(
  width
) {

  /*
   * Polaroid frame:
   * approximately 85% of card width.
   *
   * Additional white Polaroid area:
   * approximately 24px.
   */

  return (
    width * 0.85 +
    24
  );

}


/* =========================================================================
   RECTANGLE HELPER
   ========================================================================= */

function rectanglesOverlap(
  a,
  b,
  padding
) {

  padding =
    padding || 0;


  return !(
    a.x +
    a.w +
    padding <=
    b.x ||

    b.x +
    b.w +
    padding <=
    a.x ||

    a.y +
    a.h +
    padding <=
    b.y ||

    b.y +
    b.h +
    padding <=
    a.y
  );

}


/* =========================================================================
   BIRTHDAY PHOTO-WALL LAYOUT
   ========================================================================= */

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
    slots.length === 0 ||
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


  /* =========================================================================
     PHONE / SMALL TABLET
     -------------------------------------------------------------------------
     Keep this independent from the desktop layout.
     ========================================================================= */

  if (
    stageWidth < 700
  ) {

    let cardWidth =
      Math.min(
        105,
        Math.max(
          72,
          (
            stageWidth -
            32
          ) / 3
        )
      );


    const gap =
      7;


    const cardHeight =
      birthdayCardHeight(
        cardWidth
      );


    const columns =
      Math.max(
        1,
        Math.floor(
          (
            stageWidth -
            16 +
            gap
          ) /
          (
            cardWidth +
            gap
          )
        )
      );


    let index =
      0;


    for (
      let row = 0;
      index < slots.length;
      row++
    ) {

      for (
        let col = 0;
        col < columns &&
        index < slots.length;
        col++
      ) {

        const slot =
          slots[index++];


        slot.card.style.position =
          'absolute';


        slot.card.style.display =
          '';


        slot.card.style.width =
          cardWidth + 'px';


        slot.card.style.left =
          (
            8 +
            col *
            (
              cardWidth +
              gap
            )
          ) + 'px';


        slot.card.style.top =
          (
            8 +
            row *
            (
              cardHeight +
              gap
            )
          ) + 'px';


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


    return;
  }


  /* =========================================================================
     DESKTOP / LARGE TABLET
     ========================================================================= */

  /*
   * Desired 15-photo distribution:
   *
   *       1  2  3  4  5
   *
   *       6          8
   *       7          9
   *                    10
   *
   *       11 12 13 14 15
   *
   * Total = 15.
   *
   * The bottom row is kept above the Secret Message button.
   */


  const gap =
    stageWidth < 900
      ? 8
      : 10;


  const horizontalMargin =
    stageWidth < 900
      ? 8
      : 12;


  /*
   * Reserve space at the bottom.
   *
   * This is deliberately larger than the button itself so that
   * Polaroids do not touch the button.
   */

  const buttonReserve =
    stageWidth < 900
      ? 105
      : 120;


  /* =========================================================================
     DETECT SECRET MESSAGE BUTTON
     ========================================================================= */

  const stageRect =
    containerEl.getBoundingClientRect();


  const revealButton =
    document.getElementById(
      'revealBtn'
    );


  let buttonTopLimit =
    stageHeight -
    buttonReserve;


  if (
    revealButton
  ) {

    const buttonRect =
      revealButton.getBoundingClientRect();


    const buttonRelativeTop =
      buttonRect.top -
      stageRect.top;


    /*
     * If the button is physically inside the stage,
     * use its real location.
     */

    if (
      buttonRelativeTop > 0 &&
      buttonRelativeTop < stageHeight
    ) {

      buttonTopLimit =
        Math.min(
          buttonTopLimit,
          buttonRelativeTop -
          gap
        );

    }

  }


  /* =========================================================================
     CAKE / CENTRAL ARTWORK SAFE AREA
     ========================================================================= */

  const cakePadding =
    18;


  const cakeLeft =
    Math.max(
      horizontalMargin,
      exclusionRect.x -
      cakePadding
    );


  const cakeRight =
    Math.min(
      stageWidth -
      horizontalMargin,
      exclusionRect.x +
      exclusionRect.w +
      cakePadding
    );


  const cakeTop =
    Math.max(
      horizontalMargin,
      exclusionRect.y -
      cakePadding
    );


  const cakeBottom =
    Math.min(
      stageHeight,
      exclusionRect.y +
      exclusionRect.h +
      cakePadding
    );


  /* =========================================================================
     START WITH LARGE POLAROIDS
     ========================================================================= */

  let cardWidth;


  if (
    stageWidth >= 1200
  ) {

    cardWidth =
      160;

  } else if (
    stageWidth >= 1000
  ) {

    cardWidth =
      145;

  } else {

    cardWidth =
      125;

  }


  /*
   * Respect supplied baseCardW, but do not let it make
   * the cards unreasonably large.
   */

  if (
    opts.baseCardW != null
  ) {

    const suppliedWidth =
      Number(
        opts.baseCardW
      );


    if (
      Number.isFinite(
        suppliedWidth
      )
    ) {

      cardWidth =
        Math.max(
          cardWidth,
          Math.min(
            suppliedWidth,
            170
          )
        );

    }

  }


  /* =========================================================================
     FIVE-CARD ROW MUST FIT HORIZONTALLY
     ========================================================================= */

  const maxWidthForFive =
    (
      stageWidth -
      horizontalMargin * 2 -
      gap * 4
    ) / 5;


  cardWidth =
    Math.min(
      cardWidth,
      maxWidthForFive
    );


  /*
   * Never collapse desktop photos into tiny thumbnails.
   */

  const minimumDesktopCard =
    stageWidth < 900
      ? 72
      : 82;


  cardWidth =
    Math.max(
      minimumDesktopCard,
      cardWidth
    );


  /* =========================================================================
     AVAILABLE AREAS
     ========================================================================= */

  const topAvailable =
    cakeTop -
    gap -
    8;


  const bottomAvailable =
    buttonTopLimit -
    cakeBottom -
    gap;


  const sideAvailable =
    cakeBottom -
    cakeTop;


  function cardHeightForWidth(
    width
  ) {

    return birthdayCardHeight(
      width
    );

  }


  /*
   * Reduce card size only as much as necessary.
   *
   * The button is treated as a hard boundary.
   */

  while (
    cardWidth >
    minimumDesktopCard &&
    (
      cardHeightForWidth(
        cardWidth
      ) >
      topAvailable ||

      cardHeightForWidth(
        cardWidth
      ) >
      bottomAvailable ||

      (
        cardHeightForWidth(
          cardWidth
        ) * 3 +
        gap * 2
      ) >
      sideAvailable
    )
  ) {

    cardWidth -= 2;

  }


  cardWidth =
    Math.max(
      minimumDesktopCard,
      cardWidth
    );


  const cardHeight =
    cardHeightForWidth(
      cardWidth
    );


  /* =========================================================================
     TOP ROW - 5
     ========================================================================= */

  const topCount =
    5;


  const topUsedWidth =
    topCount *
    cardWidth +
    (
      topCount - 1
    ) *
    gap;


  const topStartX =
    (
      stageWidth -
      topUsedWidth
    ) / 2;


  /*
   * Keep the top row inside the stage and above the central artwork.
   */

  const topY =
    Math.max(
      8,
      cakeTop -
      cardHeight -
      gap
    );


  /* =========================================================================
     BOTTOM ROW - 5
     ========================================================================= */

  const bottomCount =
    5;


  const bottomUsedWidth =
    bottomCount *
    cardWidth +
    (
      bottomCount - 1
    ) *
    gap;


  const bottomStartX =
    (
      stageWidth -
      bottomUsedWidth
    ) / 2;


  /*
   * IMPORTANT:
   *
   * The bottom row is positioned from buttonTopLimit,
   * NOT from stageHeight.
   *
   * This prevents the Polaroids from covering the
   * Secret Message button.
   */

  const bottomY =
    Math.max(
      8,
      buttonTopLimit -
      cardHeight
    );


  /* =========================================================================
     LEFT SIDE - 2
     ========================================================================= */

  const leftCount =
    2;


  const leftTotalHeight =
    leftCount *
    cardHeight +
    (
      leftCount - 1
    ) *
    gap;


  const leftX =
    cakeLeft -
    cardWidth -
    gap;


  let leftStartY =
    cakeTop +
    (
      (
        cakeBottom -
        cakeTop
      ) -
      leftTotalHeight
    ) / 2;


  /* =========================================================================
     RIGHT SIDE - 3
     ========================================================================= */

  const rightCount =
    3;


  const rightTotalHeight =
    rightCount *
    cardHeight +
    (
      rightCount - 1
    ) *
    gap;


  const rightX =
    cakeRight +
    gap;


  let rightStartY =
    cakeTop +
    (
      (
        cakeBottom -
        cakeTop
      ) -
      rightTotalHeight
    ) / 2;


  /* =========================================================================
     SIDE SAFETY
     ========================================================================= */

  leftStartY =
    Math.max(
      8,
      Math.min(
        buttonTopLimit -
        leftTotalHeight,
        leftStartY
      )
    );


  rightStartY =
    Math.max(
      8,
      Math.min(
        buttonTopLimit -
        rightTotalHeight,
        rightStartY
      )
    );


  const safeLeftX =
    Math.max(
      4,
      Math.min(
        stageWidth -
        cardWidth -
        4,
        leftX
      )
    );


  const safeRightX =
    Math.max(
      4,
      Math.min(
        stageWidth -
        cardWidth -
        4,
        rightX
      )
    );


  /* =========================================================================
     POSITION HELPER
     ========================================================================= */

  function positionSlot(
    slot,
    x,
    y
  ) {

    if (!slot) {
      return;
    }


    slot.card.style.position =
      'absolute';


    slot.card.style.display =
      '';


    slot.card.style.width =
      cardWidth + 'px';


    slot.card.style.left =
      Math.round(
        x
      ) + 'px';


    slot.card.style.top =
      Math.round(
        y
      ) + 'px';


    if (
      slot.frame
    ) {

      slot.frame.style.height =
        Math.round(
          cardWidth *
          0.85
        ) + 'px';

    }

  }


  /* =========================================================================
     PLACE ALL 15
     ========================================================================= */

  let index =
    0;


  /*
   * Photos 1-5
   * TOP
   */

  for (
    let i = 0;
    i < 5;
    i++
  ) {

    positionSlot(
      slots[index++],

      topStartX +
      i *
      (
        cardWidth +
        gap
      ),

      topY
    );

  }


  /*
   * Photos 6-7
   * LEFT
   */

  for (
    let i = 0;
    i < 2;
    i++
  ) {

    positionSlot(
      slots[index++],

      safeLeftX,

      leftStartY +
      i *
      (
        cardHeight +
        gap
      )
    );

  }


  /*
   * Photos 8-10
   * RIGHT
   */

  for (
    let i = 0;
    i < 3;
    i++
  ) {

    positionSlot(
      slots[index++],

      safeRightX,

      rightStartY +
      i *
      (
        cardHeight +
        gap
      )
    );

  }


  /*
   * Photos 11-15
   * BOTTOM
   */

  for (
    let i = 0;
    i < 5;
    i++
  ) {

    positionSlot(
      slots[index++],

      bottomStartX +
      i *
      (
        cardWidth +
        gap
      ),

      bottomY
    );

  }


  /*
   * Never hide additional slots.
   *
   * This protects the layout if CONFIG later contains
   * more than 15 images.
   */

  for (
    let i = index;
    i < slots.length;
    i++
  ) {

    positionSlot(
      slots[i],

      horizontalMargin,

      Math.max(
        8,
        buttonTopLimit -
        cardHeight
      )
    );

  }

}


/* =========================================================================
   SECRET PAGE PHOTO LAYOUT
   -------------------------------------------------------------------------
   This is kept separate from the birthday-page layout.
   ========================================================================= */

function layoutPhotosAroundMessage(
  slots,
  messageEl,
  opts
) {

  opts =
    opts || {};


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
   * Secret-page Polaroid sizing.
   *
   * This remains independent of the birthday page.
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


  function cardHeight(
    width
  ) {

    return (
      width *
      frameFactor +
      chrome
    );

  }


  /* =========================================================================
     AVAILABLE SECRET-PAGE AREAS
     ========================================================================= */

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
      ) / 2 -
      sideMargin -
      gapFromMessage
    );


  const sideHeight =
    messageRect.height;


  const useSides =
    sideWidth >=
    (
      minCardWidth +
      gap * 2
    );


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


  /* =========================================================================
     DISTRIBUTE SECRET PHOTOS
     ========================================================================= */

  const counts =
    {};


  bands.forEach(
    function (band) {

      counts[band] =
        0;

    }
  );


  if (
    useSides
  ) {

    const side =
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


  /* =========================================================================
     CHECK SECRET-PAGE CARD SIZE
     ========================================================================= */

  function fits(
    width
  ) {

    const height =
      cardHeight(
        width
      );


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
        ) <=
        box.h;

      }
    );

  }


  /* =========================================================================
     RESPONSIVE SECRET-PAGE SIZE
     ========================================================================= */

  while (
    cardWidth >
    minCardWidth &&
    !fits(
      cardWidth
    )
  ) {

    cardWidth -=
      2;

  }


  cardWidth =
    Math.max(
      minCardWidth,
      cardWidth
    );


  /* =========================================================================
     PLACE SECRET PHOTOS
     ========================================================================= */

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


      let boxLeft;
      let boxTop;


      /* ---------------------------------------------------------------
         TOP
         --------------------------------------------------------------- */

      if (
        band === 'top'
      ) {

        boxLeft =
          sideMargin;

        boxTop =
          topMargin;

      }


      /* ---------------------------------------------------------------
         BOTTOM
         --------------------------------------------------------------- */

      if (
        band === 'bottom'
      ) {

        boxLeft =
          sideMargin;

        boxTop =
          viewportHeight -
          bottomMargin -
          box.h;

      }


      /* ---------------------------------------------------------------
         LEFT
         --------------------------------------------------------------- */

      if (
        band === 'left'
      ) {

        boxLeft =
          sideMargin;

        boxTop =
          messageRect.top;

      }


      /* ---------------------------------------------------------------
         RIGHT
         --------------------------------------------------------------- */

      if (
        band === 'right'
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
        (
          box.w -
          usedWidth
        ) / 2;


      const originY =
        boxTop +
        (
          box.h -
          usedHeight
        ) / 2;


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
          cardWidth +
          'px';


        slot.card.style.left =
          Math.round(
            originX +
            column *
            (
              cardWidth +
              gap
            )
          ) +
          'px';


        slot.card.style.top =
          Math.round(
            originY +
            row *
            (
              cardHeightValue +
              gap
            )
          ) +
          'px';


        if (
          slot.frame
        ) {

          slot.frame.style.height =
            (
              cardWidth *
              0.85
            ) +
            'px';

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

  const placed =
    [];


  const maxAttempts =
    300;


  slots.forEach(
    function (slot) {

      let position =
        null;


      /* ---------------------------------------------------------------
         RANDOM SEARCH
         --------------------------------------------------------------- */

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
            function (
              existing
            ) {

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


      /* ---------------------------------------------------------------
         DETERMINISTIC FALLBACK
         --------------------------------------------------------------- */

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
                function (
                  existing
                ) {

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


      /* ---------------------------------------------------------------
         LAST RESORT
         --------------------------------------------------------------- */

      if (
        !position
      ) {

        position = {

          x: 4,

          y: 4,

          w:
            cardWidth,

          h:
            cardHeight

        };

      }


      placed.push(
        position
      );


      slot.card.style.position =
        'absolute';


      slot.card.style.left =
        Math.round(
          position.x
        ) +
        'px';


      slot.card.style.top =
        Math.round(
          position.y
        ) +
        'px';


      slot.card.style.width =
        cardWidth +
        'px';


      if (
        slot.frame
      ) {

        slot.frame.style.height =
          (
            cardWidth *
            0.85
          ) +
          'px';

      }

    }
  );

}