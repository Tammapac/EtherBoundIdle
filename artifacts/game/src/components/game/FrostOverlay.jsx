import React, { useEffect, useRef } from "react";

/**
 * WebGL frost/ice shader overlay for frozen enemies.
 * Voronoi cracks, frost film, frozen border, and sparkle highlights.
 */

const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;

  uniform float u_time;
  uniform vec2 u_resolution;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float voronoi(vec2 uv) {
    vec2 i = floor(uv);
    vec2 f = fract(uv);
    float d = 1.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 o = vec2(hash(i + g), hash(i + g + 1.3));
        vec2 r = g + o - f;
        float dist = length(r);
        d = min(d, dist);
      }
    }
    return d;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    float PIXEL = 4.0;
    uv = floor(uv * u_resolution.xy / PIXEL) * PIXEL / u_resolution.xy;

    float t = u_time * 0.2;

    vec2 duv = uv + vec2(
      sin(uv.y * 10.0 + t),
      sin(uv.x * 10.0 - t)
    ) * 0.005;

    float v = voronoi(uv * 10.0);

    float cracks = smoothstep(0.02, 0.025, v);
    float crackLines = 1.0 - cracks;

    float edge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
    float border = smoothstep(0.2, 0.0, edge);

    float frost = hash(uv * 200.0);

    vec3 iceLight = vec3(0.9, 0.95, 1.0);
    vec3 iceBlue  = vec3(0.6, 0.8, 1.0);

    vec3 col = vec3(0.0);

    col = mix(col, iceLight, frost * 0.12);
    col += crackLines * iceBlue * 0.8;
    col = mix(col, iceLight, border * 0.7);

    float sparkle = step(0.995, hash(uv * 300.0));
    col += sparkle * vec3(1.0);

    float alpha = crackLines * 0.9 + border * 0.6 + frost * 0.08;
    alpha = clamp(alpha, 0.0, 0.85);

    if (alpha < 0.01) discard;

    gl_FragColor = vec4(col, alpha);
  }
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function FrostOverlay({ active }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const glRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Wait one frame for layout to settle so offsetWidth/Height are valid
    const initFrame = requestAnimationFrame(() => {
      const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
      if (!gl) return;
      glRef.current = gl;

      function resize() {
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.clientWidth * dpr;
        const h = canvas.clientHeight * dpr;
        if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
          canvas.width = w;
          canvas.height = h;
        }
      }
      resize();

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
      const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      if (!vs || !fs) return;

      const program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      gl.useProgram(program);

      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW
      );

      const posLoc = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      const timeLoc = gl.getUniformLocation(program, "u_time");
      const resLoc = gl.getUniformLocation(program, "u_resolution");

      function render(time) {
        resize();
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform1f(timeLoc, time * 0.001);
        gl.uniform2f(resLoc, canvas.width, canvas.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        rafRef.current = requestAnimationFrame(render);
      }

      rafRef.current = requestAnimationFrame(render);
    });

    return () => {
      cancelAnimationFrame(initFrame);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        width: "100%",
        height: "100%",
        zIndex: 10,
        borderRadius: "inherit",
      }}
    />
  );
}
