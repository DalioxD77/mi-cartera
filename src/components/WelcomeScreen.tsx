"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./WelcomeScreen.module.css";

const vertexShaderSource = `
attribute vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision highp float;
uniform vec2 resolution;
uniform float time;

void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
  float d = length(p) * 0.05;

  float r = 0.05 / abs(p.y + sin((p.x * (1.0 + d) + time) * 1.0) * 0.5);
  float g = 0.05 / abs(p.y + sin((p.x + time) * 1.0) * 0.5);
  float b = 0.05 / abs(p.y + sin((p.x * (1.0 - d) + time) * 1.0) * 0.5);

  gl_FragColor = vec4(r, g, b, 1.0);
}
`;

interface WelcomeScreenProps {
  onStart: () => void;
}

function IntroWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const introTimeout = window.setTimeout(() => setVisible(false), 3000);
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", { alpha: false, antialias: false });
    if (!canvas || !gl) {
      return () => window.clearTimeout(introTimeout);
    }

    const compileShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) {
        return null;
      }

      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("No se pudo compilar el shader de bienvenida:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = gl.createProgram();
    const buffer = gl.createBuffer();
    if (!vertexShader || !fragmentShader || !program || !buffer) {
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
      if (program) gl.deleteProgram(program);
      if (buffer) gl.deleteBuffer(buffer);
      return () => window.clearTimeout(introTimeout);
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("No se pudo enlazar el shader de bienvenida:", gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(buffer);
      return () => window.clearTimeout(introTimeout);
    }

    const positionLocation = gl.getAttribLocation(program, "position");
    const resolutionLocation = gl.getUniformLocation(program, "resolution");
    const timeLocation = gl.getUniformLocation(program, "time");
    if (positionLocation < 0 || !resolutionLocation || !timeLocation) {
      console.error("No se pudieron preparar los atributos del shader de bienvenida.");
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(buffer);
      return () => window.clearTimeout(introTimeout);
    }

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(canvas.clientWidth * pixelRatio));
      const height = Math.max(1, Math.floor(canvas.clientHeight * pixelRatio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      gl.uniform2f(resolutionLocation, width, height);
    };

    let animationFrame = 0;
    const startTime = performance.now();
    const render = (now: number) => {
      resize();
      gl.uniform1f(timeLocation, (now - startTime) * 0.0005);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrame = window.requestAnimationFrame(render);
    };

    resize();
    animationFrame = window.requestAnimationFrame(render);
    window.addEventListener("resize", resize);

    return () => {
      window.clearTimeout(introTimeout);
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className={styles.intro} role="status" aria-label="By-Danx">
      <canvas ref={canvasRef} className={styles.introCanvas} aria-hidden="true" />
      <div className={styles.introShade} aria-hidden="true" />
      <div className={styles.introContent}>
        <span className={styles.introEyebrow}>MI CARTERA</span>
        <h1 className={styles.introTitle}>By-Danx</h1>
        <span className={styles.introLoader} aria-hidden="true" />
      </div>
    </div>
  );
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <main className={styles.page}>
      <IntroWave />
      <section className={styles.hero}>
        <h1 className={styles.title}>Tu cartera. Simple desde el primer toque.</h1>
        <p className={styles.subtitle}>
          Inicia sesión y administra tus activos y alertas en segundos.
        </p>
        <div className={styles.fxLayer}>
          <button className={styles.button} onClick={onStart} type="button">
            <span className={styles.buttonText}>Comenzar</span>
            <span className={styles.buttonIcon} aria-hidden="true">
              <svg className={styles.svg} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <path d="M779.180132 473.232045 322.354755 16.406668c-21.413706-21.413706-56.121182-21.413706-77.534887 0-21.413706 21.413706-21.413706 56.122205 0 77.534887l418.057421 418.057421L244.819868 930.057421c-21.413706 21.413706-21.413706 56.122205 0 77.534887 10.706853 10.706853 24.759917 16.059767 38.767955 16.059767s28.061103-5.353938 38.767955-16.059767L779.180132 550.767955C800.593837 529.35425 800.593837 494.64575 779.180132 473.232045z" />
              </svg>
            </span>
            <span className={styles.circleOverlay} aria-hidden="true" />
          </button>
        </div>
      </section>
    </main>
  );
}
