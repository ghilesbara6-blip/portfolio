// ===================== ShapeBlur (ported to raw WebGL, no three.js dependency) =====================
function initShapeBlur(container, opts = {}) {
  const {
    variation = 0,
    shapeSize = 0.6,
    roundness = 0.4,
    borderSize = 0.05,
    circleSize = 0.4,
    circleEdge = 0.6
  } = opts;

  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  const gl = canvas.getContext('webgl', { alpha: true, antialias: true });
  if (!gl) return () => {};

  const vert = `
  attribute vec2 position;
  varying vec2 v_texcoord;
  void main() {
    v_texcoord = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }`;

  const frag = `
  precision highp float;
  varying vec2 v_texcoord;
  uniform vec2 u_mouse;
  uniform vec2 u_resolution;
  uniform float u_pixelRatio;
  uniform float u_shapeSize, u_roundness, u_borderSize, u_circleSize, u_circleEdge;
  #define PI 3.1415926535897932384626433832795
  #define TWO_PI 6.2831853071795864769252867665590
  #define VAR ${variation}

  vec2 coord(in vec2 p) {
    p = p / u_resolution.xy;
    if (u_resolution.x > u_resolution.y) {
      p.x *= u_resolution.x / u_resolution.y;
      p.x += (u_resolution.y - u_resolution.x) / u_resolution.y / 2.0;
    } else {
      p.y *= u_resolution.y / u_resolution.x;
      p.y += (u_resolution.x - u_resolution.y) / u_resolution.x / 2.0;
    }
    p -= 0.5;
    p *= vec2(-1.0, 1.0);
    return p;
  }

  float sdRoundRect(vec2 p, vec2 b, float r) {
    vec2 d = abs(p - 0.5) * 4.2 - b + vec2(r);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
  }
  float sdCircle(in vec2 st, in vec2 center) { return length(st - center) * 2.0; }
  float sdPoly(in vec2 p, in float w, in int sides) {
    float a = atan(p.x, p.y) + PI;
    float r = TWO_PI / float(sides);
    float d = cos(floor(0.5 + a / r) * r - a) * length(max(abs(p) * 1.0, 0.0));
    return d * 2.0 - w;
  }
  float aastep(float threshold, float value) {
    float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;
    return smoothstep(threshold - afwidth, threshold + afwidth, value);
  }
  float fillF(in float x) { return 1.0 - aastep(0.0, x); }
  float fillFE(float x, float size, float edge) { return 1.0 - smoothstep(size - edge, size + edge, x); }
  float strokeAA(float x, float size, float w, float edge) {
    float afwidth = length(vec2(dFdx(x), dFdy(x))) * 0.70710678;
    float d = smoothstep(size - edge - afwidth, size + edge + afwidth, x + w * 0.5)
            - smoothstep(size - edge - afwidth, size + edge + afwidth, x - w * 0.5);
    return clamp(d, 0.0, 1.0);
  }

  void main() {
    vec2 st0 = coord(gl_FragCoord.xy);
    vec2 mx = coord(u_mouse * u_pixelRatio);
    vec2 st = st0 + 0.5;
    vec2 posMouse = mx * vec2(1.0, -1.0) + 0.5;

    float size = u_shapeSize;
    float roundness = u_roundness;
    float borderSize = u_borderSize;
    float circleSize = u_circleSize;
    float circleEdge = u_circleEdge;

    float sdfCircle = fillFE(sdCircle(st, posMouse), circleSize, circleEdge);

    float sdf;
    if (VAR == 0) {
      sdf = sdRoundRect(st, vec2(size), roundness);
      sdf = strokeAA(sdf, 0.0, borderSize, sdfCircle) * 4.0;
    } else if (VAR == 1) {
      sdf = sdCircle(st, vec2(0.5));
      sdf = fillFE(sdf, 0.6, sdfCircle) * 1.2;
    } else if (VAR == 2) {
      sdf = sdCircle(st, vec2(0.5));
      sdf = strokeAA(sdf, 0.58, 0.02, sdfCircle) * 4.0;
    } else {
      sdf = sdPoly(st - vec2(0.5, 0.45), 0.3, 3);
      sdf = fillFE(sdf, 0.05, sdfCircle) * 1.4;
    }

    gl_FragColor = vec4(vec3(1.0), sdf);
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
    u_mouse: U('u_mouse'), u_resolution: U('u_resolution'), u_pixelRatio: U('u_pixelRatio'),
    u_shapeSize: U('u_shapeSize'), u_roundness: U('u_roundness'), u_borderSize: U('u_borderSize'),
    u_circleSize: U('u_circleSize'), u_circleEdge: U('u_circleEdge')
  };

  gl.uniform1f(loc.u_shapeSize, shapeSize);
  gl.uniform1f(loc.u_roundness, roundness);
  gl.uniform1f(loc.u_borderSize, borderSize);
  gl.uniform1f(loc.u_circleSize, circleSize);
  gl.uniform1f(loc.u_circleEdge, circleEdge);

  const mouse = { x: -9999, y: -9999 };
  const mouseDamp = { x: -9999, y: -9999 };

  function onMove(e) {
    const rect = container.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }
  document.addEventListener('pointermove', onMove);

  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(loc.u_resolution, canvas.width, canvas.height);
    gl.uniform1f(loc.u_pixelRatio, dpr);
  }
  window.addEventListener('resize', resize);
  resize();

  let raf, lastTime = 0;
  function loop(t) {
    raf = requestAnimationFrame(loop);
    const dt = lastTime ? (t - lastTime) / 1000 : 0;
    lastTime = t;
    const damp = (cur, target, lambda, dt2) => cur + (target - cur) * (1 - Math.exp(-lambda * dt2));
    mouseDamp.x = damp(mouseDamp.x, mouse.x, 8, dt);
    mouseDamp.y = damp(mouseDamp.y, mouse.y, 8, dt);
    gl.uniform2f(loc.u_mouse, mouseDamp.x, mouseDamp.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    document.removeEventListener('pointermove', onMove);
    if (canvas.parentNode === container) container.removeChild(canvas);
  };
}
