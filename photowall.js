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

    img.alt = 'Memory photo';

    img.draggable = false;


    /* Upload input */

    const input = document.createElement('input');

    input.type = 'file';

    input.accept = 'image/*';

    input.style.display = 'none';


    /* Optional label */

    let label = null;

    if (showLabel) {

      label = document.createElement('div');

      label.className = 'photoLabel';

      label.textContent =
        'Click or drag a photo here';

      label.addEventListener('click', function (event) {
        event.stopPropagation();
        input.click();
      });

      card.appendChild(label);
    }


    /* Image frame */

    frame.appendChild(img);

    card.appendChild(frame);

    card.appendChild(input);


    /* Initial image */

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


    /* Click */

    card.addEventListener(
      'click',
      function (event) {

        if (
          event.target === label ||
          event.target === input
        ) {
          return;
        }

        /*
          If an image exists, clicking it opens the
          passport-size viewer.
        */
        if (
          img.style.display !== 'none' &&
          img.src
        ) {
          openPhotoViewer(img.src);
          return;
        }

        input.click();
      }
    );


    /* File selection */

    input.addEventListener(
      'change',
      function () {

        if (
          input.files &&
          input.files[0]
        ) {
          loadImageIntoSlot(
            input.files[0],
            img,
            frame
          );
        }
      }
    );


    /* Drag/drop */

    card.addEventListener(
      'dragover',
      function (event) {
        event.preventDefault();

        card.classList.add(
          'dragOver'
        );
      }
    );


    card.addEventListener(
      'dragleave',
      function () {

        card.classList.remove(
          'dragOver'
        );
      }
    );


    card.addEventListener(
      'drop',
      function (event) {

        event.preventDefault();

        card.classList.remove(
          'dragOver'
        );

        const files =
          event.dataTransfer.files;

        if (
          files &&
          files.length
        ) {
          loadImageIntoSlot(
            files[0],
            img,
            frame
          );
        }
      }
    );


    wall.appendChild(card);

    slots.push({
      card: card,
      frame: frame,
      img: img,
      input: input,
      label: label
    });
  }

  return slots;
}


/* -------------------------------------------------------------------------
   PHOTO VIEWER
   ------------------------------------------------------------------------- */

function openPhotoViewer(src) {

  /*
    Don't create multiple viewers.
  */
  const oldViewer =
    document.getElementById(
      'photoViewer'
    );

  if (oldViewer) {
    oldViewer.remove();
  }


  const viewer =
    document.createElement('div');

  viewer.id =
    'photoViewer';

  viewer.className =
    'photoViewer';


  const backdrop =
    document.createElement('div');

  backdrop.className =
    'photoViewerBackdrop';


  const passport =
    document.createElement('div');

  passport.className =
    'passportPolaroid';


  const image =
    document.createElement('img');

  image.src = src;

  image.alt =
    'Enlarged memory photo';


  const close =
    document.createElement('button');

  close.type =
    'button';

  close.className =
    'photoViewerClose';

  close.textContent =
    '×';

  close.setAttribute(
    'aria-label',
    'Close photo'
  );


  passport.appendChild(image);

  passport.appendChild(close);

  viewer.appendChild(
    backdrop
  );

  viewer.appendChild(
    passport
  );

  document.body.appendChild(
    viewer
  );


  /*
    Close when backdrop is tapped.
  */

  backdrop.addEventListener(
    'click',
    function () {
      viewer.remove();
    }
  );


  /*
    Close button.
  */

  close.addEventListener(
    'click',
    function (event) {

      event.stopPropagation();

      viewer.remove();
    }
  );


  /*
    Escape key.
  */

  function escapeHandler(event) {

    if (
      event.key === 'Escape'
    ) {

      viewer.remove();

      document.removeEventListener(
        'keydown',
        escapeHandler
      );
    }
  }

  document.addEventListener(
    'keydown',
    escapeHandler
  );
}


/* -------------------------------------------------------------------------
   GENERIC RECTANGLE HELPERS
   ------------------------------------------------------------------------- */

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


function clamp(
  value,
  min,
  max
) {

  return Math.max(
    min,
    Math.min(max, value)
  );
}


/* -------------------------------------------------------------------------
   CAKE EXCLUSION LAYOUT
   ------------------------------------------------------------------------- */

function layoutGridAroundExclusion(
  slots,
  stage,
  exclusion,
  options
) {

  if (
    !slots ||
    !slots.length ||
    !stage
  ) {
    return;
  }


  options =
    options || {};


  const stageWidth =
    stage.clientWidth;

  const stageHeight =
    stage.clientHeight;


  if (
    stageWidth <= 0 ||
    stageHeight <= 0
  ) {
    return;
  }


  const baseCardW =
    options.baseCardW ||
    150;

  const minCardW =
    options.minCardW ||
    58;

  const gap =
    options.gap ||
    10;

  const gapFromCenter =
    options.gapFromCenter ||
    16;

  const margin =
    options.margin ||
    8;


  /*
    We want all photos visible.

    First determine how many columns can fit
    on the left/right of the cake.
  */

  const availableLeft =
    Math.max(
      0,
      exclusion.x -
      gapFromCenter -
      margin
    );

  const availableRight =
    Math.max(
      0,
      stageWidth -
      (exclusion.x +
       exclusion.w) -
      gapFromCenter -
      margin
    );


  /*
    We use several rows around the cake.

    Number of slots is always 15.
  */

  const leftSlots =
    Math.floor(
      availableLeft /
      (minCardW + gap)
    );

  const rightSlots =
    Math.floor(
      availableRight /
      (minCardW + gap)
    );


  /*
    Calculate a practical number
    of cards per side.
  */

  let sideColumns =
    Math.max(
      1,
      Math.min(
        4,
        Math.max(
          leftSlots,
          rightSlots
        )
      )
    );


  /*
    If there isn't enough horizontal room,
    distribute cards in more rows.
  */

  const topSpace =
    Math.max(
      0,
      exclusion.y -
      margin
    );

  const bottomSpace =
    Math.max(
      0,
      stageHeight -
      (exclusion.y +
       exclusion.h) -
      margin
    );


  /*
    Determine card width based on actual
    available dimensions.
  */

  let cardW =
    baseCardW;


  const horizontalCardLimit =
    Math.max(
      minCardW,
      Math.floor(
        (
          Math.max(
            availableLeft,
            availableRight
          ) -
          Math.max(
            0,
            sideColumns - 1
          ) * gap
        ) /
        Math.max(
          1,
          sideColumns
        )
      )
    );


  cardW =
    Math.min(
      cardW,
      horizontalCardLimit
    );


  /*
    Passport-ish polaroid ratio.
  */

  let cardH =
    Math.round(
      cardW * 1.23
    );


  /*
    Determine vertical capacity.
  */

  const topRows =
    Math.max(
      1,
      Math.floor(
        (
          topSpace +
          gap
        ) /
        (
          cardH +
          gap
        )
      )
    );

  const bottomRows =
    Math.max(
      1,
      Math.floor(
        (
          bottomSpace +
          gap
        ) /
        (
          cardH +
          gap
        )
      )
    );


  /*
    Generate candidate positions.
  */

  const candidates = [];


  function addSideCandidates(
    side
  ) {

    const xStart =
      side === 'left'
        ? margin
        : exclusion.x +
          exclusion.w +
          gapFromCenter;


    const available =
      side === 'left'
        ? availableLeft
        : availableRight;


    const columns =
      Math.max(
        1,
        Math.min(
          sideColumns,
          Math.floor(
            (
              available +
              gap
            ) /
            (
              cardW +
              gap
            )
          )
        )
      );


    for (
      let row = 0;
      row < Math.max(
        topRows,
        bottomRows
      );
      row++
    ) {

      for (
        let col = 0;
        col < columns;
        col++
      ) {

        let x =
          xStart +
          col *
          (
            cardW +
            gap
          );

        if (
          side === 'right'
        ) {

          x =
            xStart +
            col *
            (
              cardW +
              gap
            );

        }


        let y;


        /*
          Alternate from top and bottom
          so the photos surround the cake.
        */

        if (
          row % 2 === 0
        ) {

          const r =
            Math.floor(
              row / 2
            );

          y =
            margin +
            r *
            (
              cardH +
              gap
            );

        } else {

          const r =
            Math.floor(
              row / 2
            );

          y =
            stageHeight -
            margin -
            cardH -
            r *
            (
              cardH +
              gap
            );

        }


        candidates.push({
          x: x,
          y: y,
          w: cardW,
          h: cardH,
          side: side
        });
      }
    }
  }


  addSideCandidates(
    'left'
  );

  addSideCandidates(
    'right'
  );


  /*
    Add top and bottom positions if
    horizontal positions aren't enough.
  */

  function addHorizontalCandidates(
    position
  ) {

    const availableWidth =
      stageWidth -
      margin * 2;

    const columns =
      Math.max(
        1,
        Math.floor(
          (
            availableWidth +
            gap
          ) /
          (
            cardW +
            gap
          )
        )
      );


    for (
      let col = 0;
      col < columns;
      col++
    ) {

      const x =
        margin +
        col *
        (
          cardW +
          gap
        );


      let y;

      if (
        position === 'top'
      ) {

        y =
          margin;

      } else {

        y =
          stageHeight -
          margin -
          cardH;
      }


      candidates.push({
        x: x,
        y: y,
        w: cardW,
        h: cardH,
        side: position
      });
    }
  }


  addHorizontalCandidates(
    'top'
  );

  addHorizontalCandidates(
    'bottom'
  );


  /*
    Filter out candidates that overlap
    the cake exclusion rectangle.
  */

  const validCandidates =
    candidates.filter(
      function (candidate) {

        return !rectanglesOverlap(
          candidate,
          exclusion,
          gapFromCenter
        );
      }
    );


  /*
    Sort candidates so we get a balanced
    distribution around the cake.
  */

  validCandidates.sort(
    function (a, b) {

      const order = {
        left: 0,
        right: 1,
        top: 2,
        bottom: 3
      };

      return (
        order[a.side] -
        order[b.side]
      );
    }
  );


  /*
    If there are not enough candidates,
    progressively reduce card size and
    retry.
  */

  if (
    validCandidates.length <
    slots.length
  ) {

    const smaller =
      Math.max(
        minCardW,
        Math.floor(
          cardW * 0.85
        )
      );


    if (
      smaller < cardW
    ) {

      layoutGridAroundExclusion(
        slots,
        stage,
        exclusion,
        Object.assign(
          {},
          options,
          {
            baseCardW:
              smaller,
            minCardW:
              Math.min(
                minCardW,
                smaller
              )
          }
        )
      );

      return;
    }
  }


  /*
    Place every slot.
  */

  slots.forEach(
    function (
      slot,
      index
    ) {

      const candidate =
        validCandidates[
          index %
          validCandidates.length
        ];


      if (!candidate) {
        return;
      }


      const card =
        slot.card;


      card.style.position =
        'absolute';


      card.style.width =
        candidate.w +
        'px';


      card.style.height =
        candidate.h +
        'px';


      card.style.left =
        candidate.x +
        'px';


      card.style.top =
        candidate.y +
        'px';


      card.style.margin =
        '0';


      card.style.zIndex =
        String(
          10 + index
        );


      /*
        Keep the original small rotation
        without allowing it to create
        large collisions.
      */

      const rot =
        parseFloat(
          card.dataset.rot ||
          '0'
        );


      card.style.transform =
        'rotate(' +
        clamp(
          rot,
          -4,
          4
        ) +
        'deg)';
    }
  );
}


/* -------------------------------------------------------------------------
   SECRET PAGE PHOTO LAYOUT
   ------------------------------------------------------------------------- */

function layoutPhotosAroundMessage(
  slots,
  messageCard
) {

  if (
    !slots ||
    !slots.length ||
    !messageCard
  ) {
    return;
  }


  /*
    Secret page intentionally uses
    viewport coordinates.
  */

  const viewportWidth =
    window.innerWidth;

  const viewportHeight =
    window.innerHeight;


  const messageRect =
    messageCard.getBoundingClientRect();


  const margin =
    Math.max(
      10,
      Math.min(
        22,
        viewportWidth * 0.018
      )
    );


  /*
    Card size changes automatically
    with the viewport.

    Desktop:
      larger cards

    Tablet:
      medium cards

    Phone:
      smaller cards
  */

  let cardWidth =
    clamp(
      viewportWidth * 0.12,
      92,
      155
    );


  if (
    viewportWidth < 900
  ) {

    cardWidth =
      clamp(
        viewportWidth * 0.18,
        78,
        125
      );
  }


  if (
    viewportWidth < 600
  ) {

    cardWidth =
      clamp(
        viewportWidth * 0.22,
        72,
        105
      );
  }


  const cardHeight =
    Math.round(
      cardWidth *
      1.23
    );


  /*
    Create candidate locations around
    the message card.
  */

  const candidates = [];


  /*
    Left side.
  */

  const leftX =
    margin;


  const leftAvailable =
    Math.max(
      0,
      messageRect.left -
      margin -
      8
    );


  const leftColumns =
    Math.max(
      1,
      Math.floor(
        (
          leftAvailable +
          8
        ) /
        (
          cardWidth +
          8
        )
      )
    );


  for (
    let col = 0;
    col < leftColumns;
    col++
  ) {

    const x =
      leftX +
      col *
      (
        cardWidth +
        8
      );


    for (
      let row = 0;
      row < 4;
      row++
    ) {

      const y =
        margin +
        row *
        (
          cardHeight +
          10
        );


      candidates.push({
        x: x,
        y: y,
        w: cardWidth,
        h: cardHeight
      });
    }
  }


  /*
    Right side.
  */

  const rightStart =
    messageRect.right +
    8;


  const rightAvailable =
    viewportWidth -
    rightStart -
    margin;


  const rightColumns =
    Math.max(
      1,
      Math.floor(
        (
          rightAvailable +
          8
        ) /
        (
          cardWidth +
          8
        )
      )
    );


  for (
    let col = 0;
    col < rightColumns;
    col++
  ) {

    const x =
      rightStart +
      col *
      (
        cardWidth +
        8
      );


    for (
      let row = 0;
      row < 4;
      row++
    ) {

      const y =
        margin +
        row *
        (
          cardHeight +
          10
        );


      candidates.push({
        x: x,
        y: y,
        w: cardWidth,
        h: cardHeight
      });
    }
  }


  /*
    Top and bottom candidates.
  */

  const topY =
    margin;


  const bottomY =
    viewportHeight -
    margin -
    cardHeight;


  const columns =
    Math.max(
      1,
      Math.floor(
        (
          viewportWidth +
          8
        ) /
        (
          cardWidth +
          8
        )
      )
    );


  for (
    let col = 0;
    col < columns;
    col++
  ) {

    const x =
      margin +
      col *
      (
        cardWidth +
        8
      );


    candidates.push({
      x: x,
      y: topY,
      w: cardWidth,
      h: cardHeight
    });


    candidates.push({
      x: x,
      y: bottomY,
      w: cardWidth,
      h: cardHeight
    });
  }


  /*
    Remove candidates that overlap
    the secret message card.
  */

  const valid =
    candidates.filter(
      function (
        candidate
      ) {

        return !rectanglesOverlap(
          candidate,
          {
            x:
              messageRect.left,
            y:
              messageRect.top,
            w:
              messageRect.width,
            h:
              messageRect.height
          },
          12
        );
      }
    );


  /*
    Remove candidates that are outside
    the viewport.
  */

  const visible =
    valid.filter(
      function (
        candidate
      ) {

        return (
          candidate.x >= 0 &&
          candidate.y >= 0 &&
          candidate.x +
            candidate.w <=
            viewportWidth &&
          candidate.y +
            candidate.h <=
            viewportHeight
        );
      }
    );


  /*
    Use a balanced selection rather than
    simply filling one side first.
  */

  let selected = [];


  if (
    visible.length >=
    slots.length
  ) {

    const step =
      visible.length /
      slots.length;


    for (
      let i = 0;
      i < slots.length;
      i++
    ) {

      selected.push(
        visible[
          Math.floor(
            i * step
          )
        ]
      );
    }

  } else {

    selected =
      visible.slice(
        0,
        slots.length
      );
  }


  /*
    If the viewport is too small for all
    photos at the current size, shrink
    them and retry.
  */

  if (
    selected.length <
    slots.length &&
    cardWidth > 70
  ) {

    /*
      Remove temporary positioning.
      Re-run with a smaller viewport
      proportional card size.
    */

    slots.forEach(
      function (slot) {

        slot.card.style.width =
          '';

        slot.card.style.height =
          '';
      }
    );


    const reduced =
      Math.max(
        64,
        cardWidth * 0.82
      );


    /*
      Recalculate directly using a
      reduced width.
    */

    layoutSecretWithCardSize(
      slots,
      messageCard,
      reduced
    );

    return;
  }


  /*
    Place selected cards.
  */

  slots.forEach(
    function (
      slot,
      index
    ) {

      const pos =
        selected[index];


      if (!pos) {
        return;
      }


      const card =
        slot.card;


      card.style.position =
        'fixed';


      card.style.left =
        pos.x +
        'px';


      card.style.top =
        pos.y +
        'px';


      card.style.width =
        pos.w +
        'px';


      card.style.height =
        pos.h +
        'px';


      card.style.margin =
        '0';


      card.style.zIndex =
        String(
          500 + index
        );


      /*
        Preserve small rotations but
        prevent excessive overlap.
      */

      const rot =
        parseFloat(
          card.dataset.rot ||
          '0'
        );


      card.style.transform =
        'rotate(' +
        clamp(
          rot,
          -4,
          4
        ) +
        'deg)';
    }
  );
}


/* -------------------------------------------------------------------------
   SECRET PAGE SMALL-CARD FALLBACK
   ------------------------------------------------------------------------- */

function layoutSecretWithCardSize(
  slots,
  messageCard,
  cardWidth
) {

  const viewportWidth =
    window.innerWidth;

  const viewportHeight =
    window.innerHeight;


  const messageRect =
    messageCard.getBoundingClientRect();


  const gap =
    Math.max(
      5,
      Math.min(
        10,
        viewportWidth * 0.012
      )
    );


  const margin =
    Math.max(
      5,
      Math.min(
        12,
        viewportWidth * 0.015
      )
    );


  const cardHeight =
    Math.round(
      cardWidth *
      1.23
    );


  const candidates = [];


  /*
    Create a dense grid across the viewport.
  */

  const columns =
    Math.max(
      1,
      Math.floor(
        (
          viewportWidth -
          margin * 2 +
          gap
        ) /
        (
          cardWidth +
          gap
        )
      )
    );


  const rows =
    Math.max(
      1,
      Math.floor(
        (
          viewportHeight -
          margin * 2 +
          gap
        ) /
        (
          cardHeight +
          gap
        )
      )
    );


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

      const x =
        margin +
        col *
        (
          cardWidth +
          gap
        );


      const y =
        margin +
        row *
        (
          cardHeight +
          gap
        );


      const candidate = {
        x: x,
        y: y,
        w: cardWidth,
        h: cardHeight
      };


      if (
        !rectanglesOverlap(
          candidate,
          {
            x:
              messageRect.left,
            y:
              messageRect.top,
            w:
              messageRect.width,
            h:
              messageRect.height
          },
          8
        )
      ) {

        candidates.push(
          candidate
        );
      }
    }
  }


  /*
    Spread the cards evenly across
    the available candidates.
  */

  const step =
    candidates.length /
    Math.max(
      1,
      slots.length
    );


  slots.forEach(
    function (
      slot,
      index
    ) {

      const pos =
        candidates[
          Math.floor(
            index * step
          )
        ];


      if (!pos) {
        return;
      }


      const card =
        slot.card;


      card.style.position =
        'fixed';


      card.style.left =
        pos.x +
        'px';


      card.style.top =
        pos.y +
        'px';


      card.style.width =
        pos.w +
        'px';


      card.style.height =
        pos.h +
        'px';


      card.style.margin =
        '0';


      card.style.zIndex =
        String(
          500 + index
        );


      const rot =
        parseFloat(
          card.dataset.rot ||
          '0'
        );


      card.style.transform =
        'rotate(' +
        clamp(
          rot,
          -4,
          4
        ) +
        'deg)';
    }
  );
}


/* -------------------------------------------------------------------------
   RESPONSIVE LAYOUT REFRESH
   ------------------------------------------------------------------------- */

(function () {

  let resizeTimer = null;


  function refreshPhotoLayouts() {

    /*
      Birthday cake backdrop.
    */

    if (
      typeof layoutCakeBackdrop ===
      'function'
    ) {

      try {
        layoutCakeBackdrop();
      } catch (
        error
      ) {

        console.warn(
          'Cake photo layout error:',
          error
        );
      }
    }


    /*
      Secret page.
    */

    if (
      typeof revealSlots !==
      'undefined' &&
      revealSlots
    ) {

      const messageCard =
        document.querySelector(
          '#secretRevealStage .secretMessageCard'
        );


      if (
        messageCard
      ) {

        try {

          layoutPhotosAroundMessage(
            revealSlots,
            messageCard
          );

        } catch (
          error
        ) {

          console.warn(
            'Secret photo layout error:',
            error
          );
        }
      }
    }
  }


  window.addEventListener(
    'resize',
    function () {

      clearTimeout(
        resizeTimer
      );


      resizeTimer =
        setTimeout(
          refreshPhotoLayouts,
          120
        );
    }
  );


  window.addEventListener(
    'orientationchange',
    function () {

      setTimeout(
        refreshPhotoLayouts,
        250
      );
    }
  );


  /*
    Refresh after fonts/images/layout
    have had a chance to settle.
  */

  window.addEventListener(
    'load',
    function () {

      setTimeout(
        refreshPhotoLayouts,
        250
      );

      setTimeout(
        refreshPhotoLayouts,
        800
      );
    }
  );

})();