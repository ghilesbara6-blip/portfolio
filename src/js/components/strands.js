// ===================== Strands (ported to raw WebGL2, no ogl dependency) =====================
function initStrands(container, opts = {}) {
  const {
    colors = ['#045992', '#7C3AED', '#06B6D4'],
    count = 3,
    speed = 0.4,
    amplitude = 1,
    waviness = 1,
    thickness = 0.7,
    glow = 2.6,
    taper = 3,
    spread = 1,
    intensity = 0.6,
    saturation = 1.5,
    opacity = 1,
    scale = 1.5
  } = opts;

  const MAX_STRANDS = 12;
  const MAX_COLORS = 8;

  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true });
  if (!gl) return () => {};

  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const VERT = `#version 300 es
  in vec2 position;
  void main() { gl_Position = vec4(position, 0.0, 1.0); }
  `;

  const FRAG = `#version 300 es
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uColors[${MAX_COLORS}];
  uniform int uColorCount;
  uniform int uStrandCount;
  uniform float uSpeed, uAmplitude, uWaviness, uThickness, uGlow, uTaper, uSpread;
  uniform float uHueShift, uIntensity, uOpacity, uScale, uSaturation;
  out vec4 fragColor;
  const float PI = 3.14159265;
  vec3 spectrum(float t) { return 0.5 + 0.5 * cos(2.0 * PI * (t + vec3(0.00, 0.33, 0.67))); }
  vec3 samplePalette(float t) {
    t = fract(t);
    float scaled = t * float(uColorCount);
    int idx = int(floor(scaled));
    float blend = fract(scaled);
    int nextIdx = idx + 1;
    if (nextIdx >= uColorCount) nextIdx = 0;
    return mix(uColors[idx], uColors[nextIdx], blend);
  }
  vec3 strandColor(float t) { if (uColorCount > 0) return samplePalette(t); return spectrum(t); }
  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
    uv /= max(uScale, 0.0001);
    float e = 0.06 + uIntensity * 0.94;
    float env = pow(max(cos(uv.x * PI * 1.3), 0.0), uTaper);
    vec3 col = vec3(0.0);
    for (int i = 0; i < ${MAX_STRANDS}; i++) {
      if (i >= uStrandCount) break;
      float fi = float(i);
      float ph = fi * 1.7 * uSpread;
      float freq = (2.0 + fi * 0.35) * uWaviness;
      float spd = 1.4 + fi * 1.2;
      float tt = uTime * uSpeed;
      float w = sin(uv.x * freq + tt * spd + ph) * 0.60 + sin(uv.x * freq * 1.1 - tt * spd * 0.7 + ph * 1.7) * 0.40;
      float amp = (0.1 + 0.02 * e) * env * uAmplitude;
      float y = w * amp;
      float d = abs(uv.y - y);
      float thick = (0.001 + 0.05 * e) * (0.35 + env) * uThickness;
      float g = thick / (d + thick * 0.45);
      g = g * g;
      float h = fi / float(uStrandCount) + uv.x * 0.30 + uTime * 0.04 + uHueShift;
      col += strandColor(h) * g * env;
    }
    col *= 0.45 + 0.7 * e;
    col = 1.0 - exp(-col * uGlow);
    float gray = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = max(mix(vec3(gray), col, uSaturation), 0.0);
    float lum = max(max(col.r, col.g), col.b);
    float alpha = clamp(lum, 0.0, 1.0) * uOpacity;
    fragColor = vec4(col * uOpacity, alpha);
  }
  `;

  function compile(src, type) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(sh));
    }
    return sh;
  }

  const program = gl.createProgram();
  gl.attachShader(program, compile(VERT, gl.VERTEX_SHADER));
  gl.attachShader(program, compile(FRAG, gl.FRAGMENT_SHADER));
  gl.linkProgram(program);
  gl.useProgram(program);

  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const U = name => gl.getUniformLocation(program, name);
  const uTime = U('uTime');
  const uResolution = U('uResolution');
  const uColors = U('uColors');
  const uColorCount = U('uColorCount');
  const uStrandCount = U('uStrandCount');
  const uSpeed = U('uSpeed');
  const uAmplitude = U('uAmplitude');
  const uWaviness = U('uWaviness');
  const uThickness = U('uThickness');
  const uGlow = U('uGlow');
  const uTaper = U('uTaper');
  const uSpread = U('uSpread');
  const uHueShift = U('uHueShift');
  const uIntensity = U('uIntensity');
  const uOpacity = U('uOpacity');
  const uScale = U('uScale');
  const uSaturation = U('uSaturation');

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const v = h.length === 3
      ? [h[0] + h[0], h[1] + h[1], h[2] + h[2]]
      : [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)];
    return [parseInt(v[0], 16) / 255, parseInt(v[1], 16) / 255, parseInt(v[2], 16) / 255];
  }

  function buildPalette(arr) {
    const filled = arr && arr.length ? arr : ['#ffffff'];
    const flat = new Float32Array(MAX_COLORS * 3);
    for (let i = 0; i < MAX_COLORS; i++) {
      const hex = filled[i] ?? filled[filled.length - 1];
      const [r, g, b] = hexToRgb(hex);
      flat[i * 3] = r; flat[i * 3 + 1] = g; flat[i * 3 + 2] = b;
    }
    return flat;
  }

  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uResolution, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize);
  resize();

  gl.uniform1i(uColorCount, Math.min(colors.length, MAX_COLORS));
  gl.uniform3fv(uColors, buildPalette(colors));
  gl.uniform1i(uStrandCount, Math.min(count, MAX_STRANDS));
  gl.uniform1f(uSpeed, speed);
  gl.uniform1f(uAmplitude, amplitude);
  gl.uniform1f(uWaviness, waviness);
  gl.uniform1f(uThickness, thickness);
  gl.uniform1f(uGlow, glow);
  gl.uniform1f(uTaper, taper);
  gl.uniform1f(uSpread, spread);
  gl.uniform1f(uHueShift, 0);
  gl.uniform1f(uIntensity, intensity);
  gl.uniform1f(uOpacity, opacity);
  gl.uniform1f(uScale, scale);
  gl.uniform1f(uSaturation, saturation);

  let raf;
  function loop(t) {
    raf = requestAnimationFrame(loop);
    gl.uniform1f(uTime, t * 0.001);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    if (canvas.parentNode === container) container.removeChild(canvas);
  };
}
