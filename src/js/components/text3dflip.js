// ===================== Text3DFlip (ported from React + motion/react) =====================
// Splits text into per-character 3D boxes (front face + a second face rotated
// 90deg behind it). On hover, each character box rotates into view with a
// per-character stagger delay, then resets — the same effect as the original
// `useAnimate` sequence, done with plain CSS transitions + setTimeout.

const ROTATION_TRANSFORM = {
  top: 'rotateX(90deg)',
  right: 'rotateY(90deg)',
  bottom: 'rotateX(-90deg)',
  left: 'rotateY(-90deg)'
};

const CONTAINER_TRANSFORM = {
  top: 'translateZ(-0.5lh)',
  bottom: 'translateZ(-0.5lh)',
  left: 'rotateY(90deg) translateX(50%) rotateY(-90deg)',
  right: 'rotateY(90deg) translateX(50%) rotateY(-90deg)'
};

const FRONT_FACE_TRANSFORM = {
  top: 'translateZ(0.5lh)',
  bottom: 'translateZ(0.5lh)',
  left: 'rotateY(90deg) translateX(50%) rotateY(-90deg)',
  right: 'rotateY(-90deg) translateX(50%) rotateY(90deg)'
};

const SECOND_FACE_TRANSFORM = {
  top: 'rotateX(-90deg) translateZ(0.5lh)',
  bottom: 'rotateX(90deg) translateZ(0.5lh)',
  left: 'rotateY(90deg) translateX(50%) rotateY(-90deg) translateX(50%) rotateY(-90deg) translateX(50%)',
  right: 'rotateY(90deg) translateX(50%) rotateY(-90deg) translateX(-50%) rotateY(-90deg) translateX(50%)'
};

function splitIntoCharacters(text) {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text), ({ segment }) => segment);
  }
  return Array.from(text);
}

function getStaggerDelay(index, totalChars, staggerFrom, staggerDuration) {
  if (staggerFrom === 'first') return index * staggerDuration;
  if (staggerFrom === 'last') return (totalChars - 1 - index) * staggerDuration;
  if (staggerFrom === 'center') {
    const center = Math.floor(totalChars / 2);
    return Math.abs(center - index) * staggerDuration;
  }
  if (staggerFrom === 'random') {
    const randomIndex = Math.floor(Math.random() * totalChars);
    return Math.abs(randomIndex - index) * staggerDuration;
  }
  if (typeof staggerFrom === 'number') return Math.abs(staggerFrom - index) * staggerDuration;
  return index * staggerDuration;
}

function initText3DFlip(el, opts = {}) {
  const {
    text = el.textContent.trim(),
    staggerDuration = 0.05,
    staggerFrom = 'first',
    transitionMs = 380,
    rotateDirection = 'top'
  } = opts;

  el.classList.add('text-3d-flip');
  el.innerHTML = '';

  const srOnly = document.createElement('span');
  srOnly.className = 'sr-only';
  srOnly.textContent = text;
  el.appendChild(srOnly);

  const words = text.split(' ');
  const charBoxes = [];

  words.forEach((word, wordIndex) => {
    const wordSpan = document.createElement('span');
    wordSpan.className = 'text-3d-flip-word';

    splitIntoCharacters(word).forEach((char) => {
      const box = document.createElement('span');
      box.className = 'text-3d-flip-char';
      box.style.transform = CONTAINER_TRANSFORM[rotateDirection] || '';

      const front = document.createElement('span');
      front.className = 'text-3d-flip-face text-3d-flip-face--front';
      front.style.transform = FRONT_FACE_TRANSFORM[rotateDirection] || '';
      front.textContent = char;

      const back = document.createElement('span');
      back.className = 'text-3d-flip-face text-3d-flip-face--back';
      back.style.transform = SECOND_FACE_TRANSFORM[rotateDirection] || '';
      back.textContent = char;

      box.appendChild(front);
      box.appendChild(back);
      wordSpan.appendChild(box);
      charBoxes.push(box);
    });

    if (wordIndex !== words.length - 1) {
      const space = document.createElement('span');
      space.className = 'text-3d-flip-space';
      space.textContent = ' ';
      wordSpan.appendChild(space);
    }
    el.appendChild(wordSpan);
  });

  const totalChars = charBoxes.length;
  let isAnimating = false;

  function runFlip() {
    if (isAnimating) return;
    isAnimating = true;

    charBoxes.forEach((box, i) => {
      const delay = getStaggerDelay(i, totalChars, staggerFrom, staggerDuration);
      box.style.transition = `transform ${transitionMs}ms cubic-bezier(.34,1.56,.64,1) ${delay}s`;
      box.style.transform = ROTATION_TRANSFORM[rotateDirection] || '';
    });

    const maxDelay = Math.max(...charBoxes.map((_, i) => getStaggerDelay(i, totalChars, staggerFrom, staggerDuration)));
    const totalTime = (maxDelay * 1000) + transitionMs;

    setTimeout(() => {
      charBoxes.forEach((box) => {
        box.style.transition = 'none';
        box.style.transform = CONTAINER_TRANSFORM[rotateDirection] || '';
      });
      // force reflow so the next hover restarts cleanly
      void el.offsetWidth;
      isAnimating = false;
    }, totalTime + 30);
  }

  el.addEventListener('mouseenter', runFlip);

  return () => el.removeEventListener('mouseenter', runFlip);
}
