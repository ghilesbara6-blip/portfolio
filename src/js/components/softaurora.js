// ===================== SOFT AURORA =====================
// Vanilla JS port of the SoftAurora React/OGL component.
// Uses raw WebGL — no external dependencies.

function hexToVec3(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255
  ];
}

function initSoftAurora(container, opts = {}) {
  const {
    speed                = 0.7,
    scale                = 1.5,
    brightness           = 1.0,
    color1               = '#7C3AED',
    color2               = '#06B6D4',
    noiseFrequency       = 6,
    noiseAmplitude       = 1.0,
    bandHeight           = 0.5,
    bandSpread           = 0.7,
    octaveDecay          = 0.1,
    layerOffset          = 0,
    colorSpeed           = 0.8,
    enableMouseInteraction = true,
    mouseInfluence       = 0.25,
  } = opts;

  // ── Canvas ──────────────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
  container.appendChild(canvas);

  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
  if (!gl) return () => {};
  gl.clearColor(0, 0, 0, 0);

  // ── Shaders ─────────────────────────────────────────────
  const VERT = `
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const FRAG = `
    precision highp float;

    uniform float uTime;
    uniform vec3  uResolution;
    uniform float uSpeed;
    uniform float uScale;
    uniform float uBrightness;
    uniform vec3  uColor1;
    uniform vec3  uColor2;
    uniform float uNoiseFreq;
    uniform float uNoiseAmp;
    uniform float uBandHeight;
    uniform float uBandSpread;
    uniform float uOctaveDecay;
    uniform float uLayerOffset;
    uniform float uColorSpeed;
    uniform vec2  uMouse;
    uniform float uMouseInfluence;
    uniform bool  uEnableMouse;

    #define TAU 6.28318

    vec3 gradientHash(vec3 p) {
      p = vec3(
        dot(p, vec3(127.1, 311.7, 234.6)),
        dot(p, vec3(269.5, 183.3, 198.3)),
        dot(p, vec3(169.5, 283.3, 156.9))
      );
      vec3 h = fract(sin(p) * 43758.5453123);
      float phi   = acos(2.0 * h.x - 1.0);
      float theta = TAU * h.y;
      return vec3(cos(theta) * sin(phi), sin(theta) * cos(phi), cos(phi));
    }

    float quinticSmooth(float t) {
      float t2 = t * t;
      float t3 = t * t2;
      return 6.0 * t3 * t2 - 15.0 * t2 * t2 + 10.0 * t3;
    }

    vec3 cosineGradient(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
      return a + b * cos(TAU * (c * t + d));
    }

    float perlin3D(float amplitude, float frequency, float px, float py, float pz) {
      float x = px * frequency;
      float y = py * frequency;
      float fx = floor(x); float fy = floor(y); float fz = floor(pz);
      float cx = ceil(x);  float cy = ceil(y);  float cz = ceil(pz);

      vec3 g000 = gradientHash(vec3(fx, fy, fz));
      vec3 g100 = gradientHash(vec3(cx, fy, fz));
      vec3 g010 = gradientHash(vec3(fx, cy, fz));
      vec3 g110 = gradientHash(vec3(cx, cy, fz));
      vec3 g001 = gradientHash(vec3(fx, fy, cz));
      vec3 g101 = gradientHash(vec3(cx, fy, cz));
      vec3 g011 = gradientHash(vec3(fx, cy, cz));
      vec3 g111 = gradientHash(vec3(cx, cy, cz));

      float d000 = dot(g000, vec3(x - fx, y - fy, pz - fz));
      float d100 = dot(g100, vec3(x - cx, y - fy, pz - fz));
      float d010 = dot(g010, vec3(x - fx, y - cy, pz - fz));
      float d110 = dot(g110, vec3(x - cx, y - cy, pz - fz));
      float d001 = dot(g001, vec3(x - fx, y - fy, pz - cz));
      float d101 = dot(g101, vec3(x - cx, y - fy, pz - cz));
      float d011 = dot(g011, vec3(x - fx, y - cy, pz - cz));
      float d111 = dot(g111, vec3(x - cx, y - cy, pz - cz));

      float sx = quinticSmooth(x - fx);
      float sy = quinticSmooth(y - fy);
      float sz = quinticSmooth(pz - fz);

      float lx00 = mix(d000, d100, sx);
      float lx10 = mix(d010, d110, sx);
      float lx01 = mix(d001, d101, sx);
      float lx11 = mix(d011, d111, sx);
      float ly0  = mix(lx00, lx10, sy);
      float ly1  = mix(lx01, lx11, sy);
      return amplitude * mix(ly0, ly1, sz);
    }

    float auroraGlow(float t, vec2 shift) {
      vec2 uv = gl_FragCoord.xy / uResolution.y;
      uv += shift;

      float noiseVal = 0.0;
      float freq = uNoiseFreq;
      float amp  = uNoiseAmp;
      vec2 samplePos = uv * uScale;

      for (float i = 0.0; i < 3.0; i += 1.0) {
        noiseVal += perlin3D(amp, freq, samplePos.x, samplePos.y, t);
        amp  *= uOctaveDecay;
        freq *= 2.0;
      }

      float yBand = uv.y * 10.0 - uBandHeight * 10.0;
      return 0.3 * max(exp(uBandSpread * (1.0 - 1.1 * abs(noiseVal + yBand))), 0.0);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / uResolution.xy;
      float t = uSpeed * 0.4 * uTime;

      vec2 shift = vec2(0.0);
      if (uEnableMouse) {
        shift = (uMouse - 0.5) * uMouseInfluence;
      }

      vec3 col = vec3(0.0);
      col += 0.99 * auroraGlow(t, shift)
           * cosineGradient(
               uv.x + uTime * uSpeed * 0.2 * uColorSpeed,
               vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.3, 0.20, 0.20)
             ) * uColor1;
      col += 0.99 * auroraGlow(t + uLayerOffset, shift)
           * cosineGradient(
               uv.x + uTime * uSpeed * 0.1 * uColorSpeed,
               vec3(0.5), vec3(0.5), vec3(2.0, 1.0, 0.0), vec3(0.5, 0.20, 0.25)
             ) * uColor2;

      col *= uBrightness;
      float alpha = clamp(length(col), 0.0, 1.0);
      gl_FragColor = vec4(col, alpha);
    }
  `;

  // ── Compile & link ───────────────────────────────────────
  function compileShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl.VERTEX_SHADER,   VERT));
  gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  gl.useProgram(program);

  // ── Full-screen triangle (covers clip space) ─────────────
  // positions + uvs interleaved: x, y, u, v
  const verts = new Float32Array([
    -1, -1,  0, 0,
     3, -1,  2, 0,
    -1,  3,  0, 2,
  ]);
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

  const stride = 4 * 4; // 4 floats × 4 bytes
  const posLoc = gl.getAttribLocation(program, 'position');
  const uvLoc  = gl.getAttribLocation(program, 'uv');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(uvLoc);
  gl.vertexAttribPointer(uvLoc,  2, gl.FLOAT, false, stride, 2 * 4);

  // ── Uniform locations ────────────────────────────────────
  const U = {};
  ['uTime','uResolution','uSpeed','uScale','uBrightness',
   'uColor1','uColor2','uNoiseFreq','uNoiseAmp','uBandHeight',
   'uBandSpread','uOctaveDecay','uLayerOffset','uColorSpeed',
   'uMouse','uMouseInfluence','uEnableMouse']
    .forEach(n => { U[n] = gl.getUniformLocation(program, n); });

  // ── Set static uniforms ──────────────────────────────────
  gl.uniform1f(U.uSpeed,          speed);
  gl.uniform1f(U.uScale,          scale);
  gl.uniform1f(U.uBrightness,     brightness);
  gl.uniform3fv(U.uColor1,        hexToVec3(color1));
  gl.uniform3fv(U.uColor2,        hexToVec3(color2));
  gl.uniform1f(U.uNoiseFreq,      noiseFrequency);
  gl.uniform1f(U.uNoiseAmp,       noiseAmplitude);
  gl.uniform1f(U.uBandHeight,     bandHeight);
  gl.uniform1f(U.uBandSpread,     bandSpread);
  gl.uniform1f(U.uOctaveDecay,    octaveDecay);
  gl.uniform1f(U.uLayerOffset,    layerOffset);
  gl.uniform1f(U.uColorSpeed,     colorSpeed);
  gl.uniform1f(U.uMouseInfluence, mouseInfluence);
  gl.uniform1i(U.uEnableMouse,    enableMouseInteraction ? 1 : 0);
  gl.uniform2f(U.uMouse,          0.5, 0.5);

  // ── Blending ─────────────────────────────────────────────
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // ── Resize ───────────────────────────────────────────────
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);
    gl.uniform3f(U.uResolution, canvas.width, canvas.height, canvas.width / canvas.height);
  }

  window.addEventListener('resize', resize);
  resize();

  // ── Mouse tracking ───────────────────────────────────────
  let currentMouse = [0.5, 0.5];
  let targetMouse  = [0.5, 0.5];

  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    targetMouse = [
      (e.clientX - rect.left)  / rect.width,
      1.0 - (e.clientY - rect.top) / rect.height
    ];
  }
  function onMouseLeave() { targetMouse = [0.5, 0.5]; }

  if (enableMouseInteraction) {
    canvas.addEventListener('mousemove',  onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);
  }

  // ── Render loop ───────────────────────────────────────────
  let rafId;

  function loop(t) {
    gl.useProgram(program);
    gl.uniform1f(U.uTime, t * 0.001);

    if (enableMouseInteraction) {
      currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
      currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
      gl.uniform2f(U.uMouse, currentMouse[0], currentMouse[1]);
    }

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    rafId = requestAnimationFrame(loop);
  }

  rafId = requestAnimationFrame(loop);

  // ── Cleanup ───────────────────────────────────────────────
  return function destroy() {
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    if (enableMouseInteraction) {
      canvas.removeEventListener('mousemove',  onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    }
    gl.deleteProgram(program);
    gl.deleteBuffer(vbo);
    const ext = gl.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
}
