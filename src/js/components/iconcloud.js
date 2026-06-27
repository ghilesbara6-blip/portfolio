// ===================== IconCloud (ported from React hooks/canvas) =====================
// A draggable 3D sphere of icons rendered on a 2D canvas. Click an icon to
// rotate it to face-front with an eased animation; drag to spin freely;
// otherwise it drifts slowly toward the cursor. Ported 1:1 in spirit — same
// Fibonacci-sphere placement, same rotation math, same depth-based
// scale/opacity — just plain canvas + closures instead of React state/refs.

function easeOutCubicIC(t) {
  return 1 - Math.pow(1 - t, 3);
}

function initIconCloud(canvas, opts = {}) {
  const { images = [], labels = [], size = 400 } = opts;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const W = size, H = size;

  // ---- build icon positions on a Fibonacci sphere ----
  const items = images.length ? images : Array.from({ length: 20 }, (_, i) => i + 1);
  const numIcons = items.length;
  const offsetStep = 2 / numIcons;
  const increment = Math.PI * (3 - Math.sqrt(5));
  const iconPositions = [];
  for (let i = 0; i < numIcons; i++) {
    const y = i * offsetStep - 1 + offsetStep / 2;
    const r = Math.sqrt(1 - y * y);
    const phi = i * increment;
    const x = Math.cos(phi) * r;
    const z = Math.sin(phi) * r;
    iconPositions.push({ x: x * 100, y: y * 100, z: z * 100, id: i });
  }

  // ---- preload icon images onto small offscreen canvases ----
  const iconCanvases = [];
  const imagesLoaded = new Array(numIcons).fill(false);

  if (images.length) {
    images.forEach((src, index) => {
      const offscreen = document.createElement('canvas');
      offscreen.width = 40;
      offscreen.height = 40;
      const offCtx = offscreen.getContext('2d');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        offCtx.clearRect(0, 0, 40, 40);
        offCtx.save();
        offCtx.beginPath();
        offCtx.arc(20, 20, 20, 0, Math.PI * 2);
        offCtx.closePath();
        offCtx.clip();
        offCtx.fillStyle = 'rgba(21,19,29,1)';
        offCtx.fillRect(0, 0, 40, 40);
        const pad = 7;
        offCtx.drawImage(img, pad, pad, 40 - pad * 2, 40 - pad * 2);
        offCtx.restore();
        imagesLoaded[index] = true;
      };
      img.onerror = () => { imagesLoaded[index] = false; };
      img.src = src;
      iconCanvases.push(offscreen);
    });
  }

  // ---- interaction state ----
  let isDragging = false;
  let lastMouse = { x: 0, y: 0 };
  let mousePos = { x: W / 2, y: H / 2 };
  let targetRotation = null; // { x, y, startX, startY, startTime, duration }
  const rotation = { x: 0, y: 0 };
  let hoveredIndex = -1;

  function getLocalPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function projectIcon(icon) {
    const cosX = Math.cos(rotation.x), sinX = Math.sin(rotation.x);
    const cosY = Math.cos(rotation.y), sinY = Math.sin(rotation.y);
    const rotatedX = icon.x * cosY - icon.z * sinY;
    const rotatedZ = icon.x * sinY + icon.z * cosY;
    const rotatedY = icon.y * cosX + rotatedZ * sinX;
    const scale = (rotatedZ + 200) / 300;
    return {
      screenX: W / 2 + rotatedX,
      screenY: H / 2 + rotatedY,
      scale,
      rotatedZ,
      opacity: Math.max(0.2, Math.min(1, (rotatedZ + 150) / 200))
    };
  }

  function onMouseDown(e) {
    const { x, y } = getLocalPos(e);
    let hitIcon = null;
    for (const icon of iconPositions) {
      const p = projectIcon(icon);
      const radius = 20 * p.scale;
      const dx = x - p.screenX, dy = y - p.screenY;
      if (dx * dx + dy * dy < radius * radius) { hitIcon = icon; break; }
    }
    if (hitIcon) {
      const targetX = -Math.atan2(hitIcon.y, Math.sqrt(hitIcon.x * hitIcon.x + hitIcon.z * hitIcon.z));
      const targetY = Math.atan2(hitIcon.x, hitIcon.z);
      const currentX = rotation.x, currentY = rotation.y;
      const distance = Math.sqrt((targetX - currentX) ** 2 + (targetY - currentY) ** 2);
      const duration = Math.min(2000, Math.max(800, distance * 1000));
      targetRotation = { x: targetX, y: targetY, startX: currentX, startY: currentY, startTime: performance.now(), duration };
      return;
    }
    isDragging = true;
    lastMouse = { x: e.clientX, y: e.clientY };
    canvas.style.cursor = 'grabbing';
  }

  function onMouseMove(e) {
    const local = getLocalPos(e);
    mousePos = local;

    hoveredIndex = -1;
    for (let i = 0; i < iconPositions.length; i++) {
      const p = projectIcon(iconPositions[i]);
      const radius = 20 * p.scale;
      const dx = local.x - p.screenX, dy = local.y - p.screenY;
      if (dx * dx + dy * dy < radius * radius) { hoveredIndex = i; break; }
    }
    canvas.style.cursor = isDragging ? 'grabbing' : (hoveredIndex >= 0 ? 'pointer' : 'grab');

    if (isDragging) {
      const deltaX = e.clientX - lastMouse.x;
      const deltaY = e.clientY - lastMouse.y;
      rotation.x += deltaY * 0.002;
      rotation.y += deltaX * 0.002;
      lastMouse = { x: e.clientX, y: e.clientY };
    }
  }

  function onMouseUp() { isDragging = false; canvas.style.cursor = hoveredIndex >= 0 ? 'pointer' : 'grab'; }

  // touch support
  function onTouchStart(e) {
    const t = e.touches[0];
    onMouseDown({ clientX: t.clientX, clientY: t.clientY });
  }
  function onTouchMove(e) {
    const t = e.touches[0];
    onMouseMove({ clientX: t.clientX, clientY: t.clientY });
  }

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('mouseleave', onMouseUp);
  canvas.addEventListener('touchstart', onTouchStart, { passive: true });
  canvas.addEventListener('touchmove', onTouchMove, { passive: true });
  canvas.addEventListener('touchend', onMouseUp);
  canvas.style.cursor = 'grab';
  canvas.style.touchAction = 'none';

  let raf;
  function animate() {
    raf = requestAnimationFrame(animate);
    ctx.clearRect(0, 0, W, H);

    const centerX = W / 2, centerY = H / 2;
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    const dx = mousePos.x - centerX, dy = mousePos.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = 0.0015 + (distance / maxDistance) * 0.005;

    if (targetRotation) {
      const elapsed = performance.now() - targetRotation.startTime;
      const progress = Math.min(1, elapsed / targetRotation.duration);
      const eased = easeOutCubicIC(progress);
      rotation.x = targetRotation.startX + (targetRotation.x - targetRotation.startX) * eased;
      rotation.y = targetRotation.startY + (targetRotation.y - targetRotation.startY) * eased;
      if (progress >= 1) targetRotation = null;
    } else if (!isDragging) {
      rotation.x += (dy / H) * speed;
      rotation.y += (dx / W) * speed;
    }

    // depth-sort so nearer icons draw on top
    const withDepth = iconPositions.map((icon, index) => ({ icon, index, p: projectIcon(icon) }));
    withDepth.sort((a, b) => a.p.rotatedZ - b.p.rotatedZ);

    withDepth.forEach(({ icon, index, p }) => {
      ctx.save();
      ctx.translate(p.screenX, p.screenY);
      ctx.scale(p.scale, p.scale);
      ctx.globalAlpha = p.opacity;

      const isHovered = index === hoveredIndex;
      if (isHovered) {
        ctx.shadowColor = 'rgba(124, 58, 237, 0.9)';
        ctx.shadowBlur = 14;
      }

      if (images.length && iconCanvases[index] && imagesLoaded[index]) {
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(21,19,29,1)';
        ctx.fill();
        ctx.drawImage(iconCanvases[index], -20, -20, 40, 40);
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.strokeStyle = isHovered ? 'rgba(124,58,237,0.9)' : 'rgba(240,238,232,0.15)';
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#7C3AED';
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '600 13px Space Grotesk, Arial, sans-serif';
        const label = labels[icon.id] || String(icon.id + 1);
        ctx.fillText(label.length > 3 ? label.slice(0, 3) : label, 0, 0);
      }
      ctx.restore();
    });
  }
  raf = requestAnimationFrame(animate);

  return () => {
    cancelAnimationFrame(raf);
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('mouseleave', onMouseUp);
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchmove', onTouchMove);
    canvas.removeEventListener('touchend', onMouseUp);
  };
}
