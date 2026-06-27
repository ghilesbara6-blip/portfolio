// ===================== ColorBends (ported to raw WebGL, no three.js dependency) =====================
function initColorBends(container, opts = {}) {
  const {
    colors = ['#7C3AED', '#06B6D4', '#FF4242'],
    rotation = 90,
    autoRotate = 4,
    speed = 0.2,
    scale = 1,
    frequency = 1,
    warpStrength = 1,
    mouseInfluence = 1,
    parallax = 0.5,
    noise = 0.15,
    iterations = 1,
    intensity = 1.5,
    bandWidth = 6,
    transparent = true
  } = opts;

  const MAX_COLORS = 8;
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true });
  if (!gl) return () => {};

  const vert = `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }`;

  const frag = `
  precision highp float;
  #define MAX_COLORS ${MAX_COLORS}
  uniform vec2 uCanvas;
  uniform float uTime, uSpeed;
  uniform vec2 uRot;
  uniform int uColorCount;
  uniform vec3 uColors[MAX_COLORS];
  uniform int uTransparent;
  uniform float uScale, uFrequency, uWarpStrength;
  uniform vec2 uPointer;
  uniform float uMouseInfluence, uParallax, uNoise, uIntensity, uBandWidth;
  uniform int uIterations;
  varying vec2 vUv;

  void main() {
    float t = uTime * uSpeed;
    vec2 p = vUv * 2.0 - 1.0;
    p += uPointer * uParallax * 0.1;
    vec2 rp = vec2(p.x * uRot.x - p.y * uRot.y, p.x * uRot.y + p.y * uRot.x);
    vec2 q = vec2(rp.x * (uCanvas.x / uCanvas.y), rp.y);
    q /= max(uScale, 0.0001);
    q /= 0.5 + 0.2 * dot(q, q);
    q += 0.2 * cos(t) - 7.56;
    vec2 toward = (uPointer - rp);
    q += toward * uMouseInfluence * 0.2;

    for (int j = 0; j < 5; j++) {
      if (j >= uIterations - 1) break;
      vec2 rr = sin(1.5 * (q.yx * uFrequency) + 2.0 * cos(q * uFrequency));
      q += (rr - q) * 0.15;
    }

    vec3 col = vec3(0.0);
    float a = 1.0;

    if (uColorCount > 0) {
      vec2 s = q;
      vec3 sumCol = vec3(0.0);
      float cover = 0.0;
      for (int i = 0; i < MAX_COLORS; ++i) {
        if (i >= uColorCount) break;
        s -= 0.01;
        vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
        float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(i)) / 4.0);
        float kBelow = clamp(uWarpStrength, 0.0, 1.0);
        float kMix = pow(kBelow, 0.3);
        float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
        vec2 disp = (r - s) * kBelow;
        vec2 warped = s + disp * gain;
        float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(i)) / 4.0);
        float m = mix(m0, m1, kMix);
        float w = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));
        sumCol += uColors[i] * w;
        cover = max(cover, w);
      }
      col = clamp(sumCol, 0.0, 1.0);
      a = uTransparent > 0 ? cover : 1.0;
    }

    col *= uIntensity;

    if (uNoise > 0.0001) {
      float n = fract(sin(dot(gl_FragCoord.xy + vec2(uTime), vec2(12.9898, 78.233))) * 43758.5453123);
      col += (n - 0.5) * uNoise;
      col = clamp(col, 0.0, 1.0);
    }

    vec3 rgb = (uTransparent > 0) ? col * a : col;
    gl_FragColor = vec4(rgb, a);
  }`;

  function compile(src, type) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh));
    return sh;
  }

  const program = gl.createProgram();
  gl.attachShader(program, compile(vert, gl.VERTEX_SHADER));
  gl.attachShader(program, compile(frag, gl.FRAGMENT_SHADER));
  gl.linkProgram(program);
  gl.useProgram(program);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const U = name => gl.getUniformLocation(program, name);
  const loc = {
    uCanvas: U('uCanvas'), uTime: U('uTime'), uSpeed: U('uSpeed'), uRot: U('uRot'),
    uColorCount: U('uColorCount'), uColors: U('uColors'), uTransparent: U('uTransparent'),
    uScale: U('uScale'), uFrequency: U('uFrequency'), uWarpStrength: U('uWarpStrength'),
    uPointer: U('uPointer'), uMouseInfluence: U('uMouseInfluence'), uParallax: U('uParallax'),
    uNoise: U('uNoise'), uIterations: U('uIterations'), uIntensity: U('uIntensity'), uBandWidth: U('uBandWidth')
  };

  function hexToVec3(hex) {
    const h = hex.replace('#', '');
    const v = h.length === 3
      ? [h[0] + h[0], h[1] + h[1], h[2] + h[2]]
      : [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)];
    return [parseInt(v[0], 16) / 255, parseInt(v[1], 16) / 255, parseInt(v[2], 16) / 255];
  }

  const flatColors = new Float32Array(MAX_COLORS * 3);
  const arr = colors.slice(0, MAX_COLORS).map(hexToVec3);
  arr.forEach((c, i) => { flatColors[i * 3] = c[0]; flatColors[i * 3 + 1] = c[1]; flatColors[i * 3 + 2] = c[2]; });

  gl.uniform1i(loc.uColorCount, arr.length);
  gl.uniform3fv(loc.uColors, flatColors);
  gl.uniform1i(loc.uTransparent, transparent ? 1 : 0);
  gl.uniform1f(loc.uScale, scale);
  gl.uniform1f(loc.uFrequency, frequency);
  gl.uniform1f(loc.uWarpStrength, warpStrength);
  gl.uniform1f(loc.uMouseInfluence, mouseInfluence);
  gl.uniform1f(loc.uParallax, parallax);
  gl.uniform1f(loc.uNoise, noise);
  gl.uniform1i(loc.uIterations, iterations);
  gl.uniform1f(loc.uIntensity, intensity);
  gl.uniform1f(loc.uBandWidth, bandWidth);
  gl.uniform1f(loc.uSpeed, speed);

  const pointerTarget = [0, 0];
  const pointerCurrent = [0, 0];

  function onPointerMove(e) {
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / (rect.width || 1)) * 2 - 1;
    const y = -(((e.clientY - rect.top) / (rect.height || 1)) * 2 - 1);
    pointerTarget[0] = x; pointerTarget[1] = y;
  }
  container.addEventListener('pointermove', onPointerMove);

  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(loc.uCanvas, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize);
  resize();

  let raf;
  let startTime = performance.now();
  function loop(t) {
    raf = requestAnimationFrame(loop);
    const elapsed = (t - startTime) * 0.001;
    gl.uniform1f(loc.uTime, elapsed);

    const deg = (rotation % 360) + autoRotate * elapsed;
    const rad = (deg * Math.PI) / 180;
    gl.uniform2f(loc.uRot, Math.cos(rad), Math.sin(rad));

    pointerCurrent[0] += (pointerTarget[0] - pointerCurrent[0]) * 0.08;
    pointerCurrent[1] += (pointerTarget[1] - pointerCurrent[1]) * 0.08;
    gl.uniform2f(loc.uPointer, pointerCurrent[0], pointerCurrent[1]);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    container.removeEventListener('pointermove', onPointerMove);
    if (canvas.parentNode === container) container.removeChild(canvas);
  };
}
