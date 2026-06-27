// ===================== CircularGallery (ported to raw WebGL2, no ogl dependency) =====================
function initCircularGallery(container, opts = {}) {
  const {
    items = [],
    bend = 3,
    textColor = '#f0eee8',
    borderRadius = 0.06,
    font = '600 24px Space Grotesk, sans-serif',
    scrollSpeed = 2,
    scrollEase = 0.04
  } = opts;

  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);
  container.tabIndex = 0;

  const gl = canvas.getContext('webgl', { alpha: true, antialias: true });
  if (!gl) return () => {};

  function compile(src, type) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh));
    return sh;
  }
  function makeProgram(vsSrc, fsSrc) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(vsSrc, gl.VERTEX_SHADER));
    gl.attachShader(p, compile(fsSrc, gl.FRAGMENT_SHADER));
    gl.linkProgram(p);
    return p;
  }

  // ---- plane geometry (subdivided, for the gentle warp) ----
  function buildPlane(wSeg, hSeg) {
    const positions = [];
    const uvs = [];
    const indices = [];
    for (let y = 0; y <= hSeg; y++) {
      for (let x = 0; x <= wSeg; x++) {
        const u = x / wSeg;
        const v = y / hSeg;
        positions.push(u - 0.5, v - 0.5, 0);
        uvs.push(u, 1 - v);
      }
    }
    for (let y = 0; y < hSeg; y++) {
      for (let x = 0; x < wSeg; x++) {
        const a = y * (wSeg + 1) + x;
        const b = a + 1;
        const c = a + (wSeg + 1);
        const d = c + 1;
        indices.push(a, b, c, b, d, c);
      }
    }
    return { positions: new Float32Array(positions), uvs: new Float32Array(uvs), indices: new Uint16Array(indices) };
  }

  const planeGeo = buildPlane(40, 20);
  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, planeGeo.positions, gl.STATIC_DRAW);
  const uvBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
  gl.bufferData(gl.ARRAY_BUFFER, planeGeo.uvs, gl.STATIC_DRAW);
  const idxBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, planeGeo.indices, gl.STATIC_DRAW);
  const idxCount = planeGeo.indices.length;

  const mediaVert = `
  attribute vec3 position;
  attribute vec2 uv;
  uniform mat4 modelMatrix, viewMatrix, projectionMatrix;
  uniform float uTime, uSpeed;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.z += (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.1 + uSpeed * 0.5);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.0);
  }`;
  const mediaFrag = `
  precision highp float;
  varying vec2 vUv;
  uniform vec2 uImageSizes, uPlaneSizes;
  uniform sampler2D tMap;
  uniform float uBorderRadius;
  float roundedBoxSDF(vec2 p, vec2 b, float r) {
    vec2 d = abs(p) - b;
    return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
  }
  void main() {
    vec2 ratio = vec2(
      min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
      min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
    );
    vec2 uv = vec2(vUv.x * ratio.x + (1.0 - ratio.x) * 0.5, vUv.y * ratio.y + (1.0 - ratio.y) * 0.5);
    vec4 color = texture2D(tMap, uv);
    float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
    float edgeSmooth = 0.002;
    float alpha = 1.0 - smoothstep(-edgeSmooth, edgeSmooth, d);
    gl_FragColor = vec4(color.rgb, alpha);
  }`;
  const mediaProgram = makeProgram(mediaVert, mediaFrag);

  const titleVert = `
  attribute vec3 position;
  attribute vec2 uv;
  uniform mat4 modelMatrix, viewMatrix, projectionMatrix;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }`;
  const titleFrag = `
  precision highp float;
  uniform sampler2D tMap;
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(tMap, vUv);
    if (color.a < 0.1) discard;
    gl_FragColor = color;
  }`;
  const titleProgram = makeProgram(titleVert, titleFrag);

  // simple plane (unit quad, no subdivision) for titles
  const quadPos = new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0]);
  const quadUv = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);
  const quadIdx = new Uint16Array([0, 1, 2, 1, 3, 2]);
  const quadPosBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadPosBuf);
  gl.bufferData(gl.ARRAY_BUFFER, quadPos, gl.STATIC_DRAW);
  const quadUvBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadUvBuf);
  gl.bufferData(gl.ARRAY_BUFFER, quadUv, gl.STATIC_DRAW);
  const quadIdxBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIdxBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, quadIdx, gl.STATIC_DRAW);

  function mat4Identity() { return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); }
  function mat4Multiply(a, b) {
    const out = new Float32Array(16);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        out[i * 4 + j] = a[i*4+0]*b[0*4+j] + a[i*4+1]*b[1*4+j] + a[i*4+2]*b[2*4+j] + a[i*4+3]*b[3*4+j];
      }
    }
    return out;
  }
  function mat4Translate(x, y, z) { const m = mat4Identity(); m[12]=x; m[13]=y; m[14]=z; return m; }
  function mat4Scale(x, y, z) { const m = mat4Identity(); m[0]=x; m[5]=y; m[10]=z; return m; }
  function mat4RotateZ(rad) {
    const m = mat4Identity(); const c = Math.cos(rad), s = Math.sin(rad);
    m[0]=c; m[1]=s; m[4]=-s; m[5]=c; return m;
  }
  function mat4Perspective(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2);
    const out = new Float32Array(16);
    out[0] = f / aspect; out[5] = f;
    out[10] = (far + near) / (near - far);
    out[11] = -1;
    out[14] = (2 * far * near) / (near - far);
    return out;
  }
  function mat4LookAtZ(z) { return mat4Translate(0, 0, -z); }

  function createTextTexture(text, font, color) {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    ctx.font = font;
    const metrics = ctx.measureText(text);
    const textWidth = Math.ceil(metrics.width);
    const fontSizeMatch = font.match(/(\d+)px/);
    const fontSize = fontSizeMatch ? parseInt(fontSizeMatch[1], 10) : 24;
    const textHeight = Math.ceil(fontSize * 1.4);
    c.width = textWidth + 24;
    c.height = textHeight + 24;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillText(text, c.width / 2, c.height / 2);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    return { tex, width: c.width, height: c.height };
  }

  const defaultItems = items && items.length ? items : [
    { image: 'https://picsum.photos/seed/bg1/800/600?grayscale', text: 'Item One' },
    { image: 'https://picsum.photos/seed/bg2/800/600?grayscale', text: 'Item Two' },
    { image: 'https://picsum.photos/seed/bg3/800/600?grayscale', text: 'Item Three' }
  ];
  const mediaList = defaultItems.concat(defaultItems);

  let screen = { width: container.clientWidth || 1, height: container.clientHeight || 1 };
  let viewport = { width: 1, height: 1 };
  const camera = { fov: 45, position_z: 20, aspect: 1 };

  function updateCameraViewport() {
    camera.aspect = screen.width / screen.height;
    const fovRad = (camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fovRad / 2) * camera.position_z;
    const width = height * camera.aspect;
    viewport = { width, height };
  }

  const medias = mediaList.map((data, index) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,0]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    const imgSize = { w: 1, h: 1 };
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      imgSize.w = img.naturalWidth; imgSize.h = img.naturalHeight;
    };
    img.src = data.image;

    const title = createTextTexture(data.text, font, textColor);

    return {
      index, texture, imgSize, title,
      extra: 0, x: 0, width: 0, scale: { x: 1, y: 1 },
      position: { x: 0, y: 0, z: 0 }, rotationZ: 0
    };
  });

  function layoutMedias() {
    const total = medias.length;
    medias.forEach((m, i) => {
      const sc = screen.height / 1500;
      m.scale.y = (viewport.height * (900 * sc)) / screen.height;
      m.scale.x = (viewport.width * (700 * sc)) / screen.width;
      m.padding = 2;
      m.width = m.scale.x + m.padding;
      m.widthTotal = m.width * total;
      m.x = m.width * i;
    });
  }

  function resize() {
    screen = { width: container.clientWidth || 1, height: container.clientHeight || 1 };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = screen.width * dpr;
    canvas.height = screen.height * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
    updateCameraViewport();
    layoutMedias();
  }
  window.addEventListener('resize', resize);
  resize();

  const scroll = { ease: scrollEase, current: 0, target: 0, last: 0 };
  let isDown = false, startX = 0, scrollPosStart = 0;

  function getLocalX(e) {
    return e.touches ? e.touches[0].clientX : e.clientX;
  }
  function onDown(e) {
    isDown = true;
    scrollPosStart = scroll.current;
    startX = getLocalX(e);
  }
  function onMove(e) {
    if (!isDown) return;
    const x = getLocalX(e);
    const distance = (startX - x) * (scrollSpeed * 0.025);
    scroll.target = scrollPosStart + distance;
  }
  function onUp() { isDown = false; }
  function onWheel(e) {
    const delta = e.deltaY || e.wheelDelta || e.detail;
    scroll.target += (delta > 0 ? scrollSpeed : -scrollSpeed) * 0.2;
  }
  function onKeyDown(e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); scroll.target += scrollSpeed * 5; }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); scroll.target -= scrollSpeed * 5; }
  }

  container.addEventListener('mousedown', onDown);
  container.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  container.addEventListener('touchstart', onDown, { passive: true });
  container.addEventListener('touchmove', onMove, { passive: true });
  container.addEventListener('touchend', onUp);
  container.addEventListener('wheel', onWheel, { passive: true });
  container.addEventListener('keydown', onKeyDown);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.DEPTH_TEST);

  const projLoc = {};
  function getLocs(program, names) {
    names.forEach(n => { projLoc[program === mediaProgram ? 'm_' + n : 't_' + n] = gl.getUniformLocation(program, n); });
  }
  getLocs(mediaProgram, ['modelMatrix','viewMatrix','projectionMatrix','uTime','uSpeed','uImageSizes','uPlaneSizes','tMap','uBorderRadius']);
  getLocs(titleProgram, ['modelMatrix','viewMatrix','projectionMatrix','tMap']);

  let raf;
  let lastSpeed = 0;
  function render() {
    raf = requestAnimationFrame(render);
    scroll.current += (scroll.target - scroll.current) * scroll.ease;
    const direction = scroll.current > scroll.last ? 'right' : 'left';
    const projMatrix = mat4Perspective((camera.fov * Math.PI) / 180, camera.aspect, 0.1, 1000);
    const viewMatrix = mat4LookAtZ(camera.position_z);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const H = viewport.width / 2;
    const speed = scroll.current - scroll.last;

    medias.forEach(m => {
      m.position.x = m.x - scroll.current - m.extra;
      const x = m.position.x;
      if (bend === 0) { m.position.y = 0; m.rotationZ = 0; }
      else {
        const B_abs = Math.abs(bend);
        const R = (H * H + B_abs * B_abs) / (2 * B_abs);
        const effectiveX = Math.min(Math.abs(x), H);
        const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
        if (bend > 0) { m.position.y = -arc; m.rotationZ = -Math.sign(x) * Math.asin(effectiveX / R); }
        else { m.position.y = arc; m.rotationZ = Math.sign(x) * Math.asin(effectiveX / R); }
      }

      const planeOffset = m.scale.x / 2;
      const viewportOffset = viewport.width / 2;
      const isBefore = m.position.x + planeOffset < -viewportOffset;
      const isAfter = m.position.x - planeOffset > viewportOffset;
      if (direction === 'right' && isBefore) m.extra -= m.widthTotal;
      if (direction === 'left' && isAfter) m.extra += m.widthTotal;

      // draw media plane
      gl.useProgram(mediaProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      const pLoc = gl.getAttribLocation(mediaProgram, 'position');
      gl.enableVertexAttribArray(pLoc);
      gl.vertexAttribPointer(pLoc, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
      const uvLoc = gl.getAttribLocation(mediaProgram, 'uv');
      gl.enableVertexAttribArray(uvLoc);
      gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);

      let model = mat4Scale(m.scale.x, m.scale.y, 1);
      model = mat4Multiply(mat4RotateZ(m.rotationZ), model);
      model = mat4Multiply(mat4Translate(m.position.x, m.position.y, m.position.z), model);

      gl.uniformMatrix4fv(projLoc.m_modelMatrix, false, model);
      gl.uniformMatrix4fv(projLoc.m_viewMatrix, false, viewMatrix);
      gl.uniformMatrix4fv(projLoc.m_projectionMatrix, false, projMatrix);
      gl.uniform1f(projLoc.m_uTime, performance.now() * 0.001);
      gl.uniform1f(projLoc.m_uSpeed, speed);
      gl.uniform2f(projLoc.m_uImageSizes, m.imgSize.w, m.imgSize.h);
      gl.uniform2f(projLoc.m_uPlaneSizes, m.scale.x, m.scale.y);
      gl.uniform1f(projLoc.m_uBorderRadius, borderRadius);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, m.texture);
      gl.uniform1i(projLoc.m_tMap, 0);
      gl.drawElements(gl.TRIANGLES, idxCount, gl.UNSIGNED_SHORT, 0);

      // draw title quad below
      gl.useProgram(titleProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadPosBuf);
      const tpLoc = gl.getAttribLocation(titleProgram, 'position');
      gl.enableVertexAttribArray(tpLoc);
      gl.vertexAttribPointer(tpLoc, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadUvBuf);
      const tuvLoc = gl.getAttribLocation(titleProgram, 'uv');
      gl.enableVertexAttribArray(tuvLoc);
      gl.vertexAttribPointer(tuvLoc, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIdxBuf);

      const aspect = m.title.width / m.title.height;
      const textHeight = m.scale.y * 0.15;
      const textWidth = textHeight * aspect;
      const titleY = m.position.y - m.scale.y * 0.5 - textHeight * 0.5 - 0.05;

      let tModel = mat4Scale(textWidth, textHeight, 1);
      tModel = mat4Multiply(mat4Translate(m.position.x, titleY, m.position.z), tModel);

      gl.uniformMatrix4fv(projLoc.t_modelMatrix, false, tModel);
      gl.uniformMatrix4fv(projLoc.t_viewMatrix, false, viewMatrix);
      gl.uniformMatrix4fv(projLoc.t_projectionMatrix, false, projMatrix);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, m.title.tex);
      gl.uniform1i(projLoc.t_tMap, 0);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    });

    scroll.last = scroll.current;
  }
  raf = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('mouseup', onUp);
    container.removeEventListener('mousedown', onDown);
    container.removeEventListener('mousemove', onMove);
    container.removeEventListener('touchstart', onDown);
    container.removeEventListener('touchmove', onMove);
    container.removeEventListener('touchend', onUp);
    container.removeEventListener('wheel', onWheel);
    container.removeEventListener('keydown', onKeyDown);
    if (canvas.parentNode === container) container.removeChild(canvas);
  };
}
