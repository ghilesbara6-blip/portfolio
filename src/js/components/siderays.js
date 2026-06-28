// ===================== SIDE RAYS =====================
// Vanilla JS port of the SideRays React/OGL component.
// Uses raw WebGL — no external dependencies.

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255]
    : [1, 1, 1];
}

function originToFlip(origin) {
  switch (origin) {
    case 'top-left':     return [1, 0];
    case 'bottom-right': return [0, 1];
    case 'bottom-left':  return [1, 1];
    default:             return [0, 0]; // top-right
  }
}

function initSideRays(container, opts = {}) {
  const {
    speed      = 2.5,
    rayColor1  = '#7C3AED',
    rayColor2  = '#06B6D4',
    intensity  = 2,
    spread     = 2.8,
    origin     = 'top-right',
    tilt       = 0,
    saturation = 1.5,
    blend      = 0.75,
    falloff    = 1.6,
    opacity    = 1.0,
  } = opts;

  // ── Canvas setup ──────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%;';
  container.appendChild(canvas);

  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
  if (!gl) return () => {};

  // ── Shaders ───────────────────────────────────────────
  const VERT = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const FRAG = `
    precision highp float;

    uniform float iTime;
    uniform vec2  iResolution;
    uniform float iSpeed;
    uniform vec3  iRayColor1;
    uniform vec3  iRayColor2;
    uniform float iIntensity;
    uniform float iSpread;
    uniform float iFlipX;
    uniform float iFlipY;
    uniform float iTilt;
    uniform float iSaturation;
    uniform float iBlend;
    uniform float iFalloff;
    uniform float iOpacity;

    float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord,
                      float seedA, float seedB, float speed) {
      vec2  sourceToCoord = coord - raySource;
      float cosAngle = dot(normalize(sourceToCoord), rayRefDirection);
      return clamp(
        (0.45 + 0.15 * sin(cosAngle * seedA + iTime * speed)) +
        (0.30 + 0.20 * cos(-cosAngle * seedB + iTime * speed)),
        0.0, 1.0) *
        clamp((iResolution.x - length(sourceToCoord)) / iResolution.x, 0.5, 1.0);
    }

    void main() {
      vec2 fragCoord = gl_FragCoord.xy;
      if (iFlipX > 0.5) fragCoord.x = iResolution.x - fragCoord.x;
      if (iFlipY > 0.5) fragCoord.y = iResolution.y - fragCoord.y;

      vec2 coord  = vec2(fragCoord.x, iResolution.y - fragCoord.y);
      vec2 rayPos = vec2(iResolution.x * 1.1, -0.5 * iResolution.y);

      float tiltRad = iTilt * 3.14159265 / 180.0;
      float cs = cos(tiltRad);
      float sn = sin(tiltRad);
      vec2 rel        = coord - rayPos;
      vec2 tiltedCoord = vec2(rel.x * cs - rel.y * sn,
                              rel.x * sn + rel.y * cs) + rayPos;

      float halfSpread  = iSpread * 0.275;
      vec2 rayRefDir1   = normalize(vec2(cos(0.785398 + halfSpread), sin(0.785398 + halfSpread)));
      vec2 rayRefDir2   = normalize(vec2(cos(0.785398 - halfSpread), sin(0.785398 - halfSpread)));

      vec4 rays1 = vec4(iRayColor1, 1.0) *
                   rayStrength(rayPos, rayRefDir1, tiltedCoord, 36.2214, 21.11349, iSpeed);
      vec4 rays2 = vec4(iRayColor2, 1.0) *
                   rayStrength(rayPos, rayRefDir2, tiltedCoord, 22.3991, 18.0234,  iSpeed * 0.2);

      vec4 color = rays1 * (1.0 - iBlend) * 0.9 + rays2 * iBlend * 0.9;

      float distanceToLight = length(fragCoord.xy - vec2(rayPos.x, iResolution.y - rayPos.y))
                              / iResolution.y;
      float brightness = iIntensity * 0.4 / pow(max(distanceToLight, 0.001), iFalloff);
      color.rgb *= brightness;

      float gray   = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      color.rgb    = mix(vec3(gray), color.rgb, iSaturation);
      color.a      = max(color.r, max(color.g, color.b)) * iOpacity;

      gl_FragColor = color;
    }
  `;

  // ── Compile helpers ───────────────────────────────────
  function compile(type, src) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    return shader;
  }

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER,   VERT));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  gl.useProgram(program);

  // ── Full-screen triangle ──────────────────────────────
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([-1, -1,  3, -1,  -1, 3]),
    gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  // ── Uniform locations ─────────────────────────────────
  const loc = {};
  ['iTime','iResolution','iSpeed','iRayColor1','iRayColor2',
   'iIntensity','iSpread','iFlipX','iFlipY','iTilt',
   'iSaturation','iBlend','iFalloff','iOpacity']
    .forEach(n => { loc[n] = gl.getUniformLocation(program, n); });

  // ── Set initial uniforms ──────────────────────────────
  const [flipX, flipY] = originToFlip(origin);
  gl.uniform1f(loc.iSpeed,      speed);
  gl.uniform3fv(loc.iRayColor1, hexToRgb(rayColor1));
  gl.uniform3fv(loc.iRayColor2, hexToRgb(rayColor2));
  gl.uniform1f(loc.iIntensity,  intensity);
  gl.uniform1f(loc.iSpread,     spread);
  gl.uniform1f(loc.iFlipX,      flipX);
  gl.uniform1f(loc.iFlipY,      flipY);
  gl.uniform1f(loc.iTilt,       tilt);
  gl.uniform1f(loc.iSaturation, saturation);
  gl.uniform1f(loc.iBlend,      blend);
  gl.uniform1f(loc.iFalloff,    falloff);
  gl.uniform1f(loc.iOpacity,    opacity);

  // ── Blending ─────────────────────────────────────────
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // ── Resize ───────────────────────────────────────────
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(loc.iResolution, canvas.width, canvas.height);
  }

  window.addEventListener('resize', resize);
  resize();

  // ── Render loop ───────────────────────────────────────
  let rafId;

  function loop(t) {
    gl.uniform1f(loc.iTime, t * 0.001);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    rafId = requestAnimationFrame(loop);
  }

  rafId = requestAnimationFrame(loop);

  // ── Cleanup ───────────────────────────────────────────
  return function destroy() {
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    gl.deleteProgram(program);
    gl.deleteBuffer(buf);
    const ext = gl.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
}
