import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Texture, Triangle } from "ogl";

type VortexShaderProps = {
  src: string;
  rotationPeriod?: number;
  twistStrength?: number;
  parallax?: number;
  focalPoint?: [number, number];
  className?: string;
};

const vertex = /* glsl */ `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform vec2 uRes;
  uniform vec2 uTexRes;
  uniform float uTwist;
  uniform float uRotation;
  uniform vec2 uMouse;
  uniform vec2 uFocalPoint;

  vec2 coverUv(vec2 uv, vec2 res, vec2 texRes) {
    float canvasRatio = res.x / res.y;
    float textureRatio = texRes.x / texRes.y;
    vec2 scale = canvasRatio > textureRatio
      ? vec2(1.0, textureRatio / canvasRatio)
      : vec2(canvasRatio / textureRatio, 1.0);

    return (uv - 0.5) * scale + 0.5;
  }

  void main() {
    vec2 center = uFocalPoint + uMouse * 0.03;
    float aspect = uRes.x / uRes.y;
    vec2 delta = vUv - center;
    vec2 polarDelta = vec2(delta.x * aspect, delta.y);
    float radius = length(polarDelta);
    float angle = atan(polarDelta.y, polarDelta.x);
    float vortexArea = 1.0 - smoothstep(0.18, 0.72, radius);
    float swirl = (uTwist * (0.55 / (radius + 0.3)) + uRotation) * vortexArea;

    angle += swirl;
    vec2 twistedDelta = vec2(cos(angle), sin(angle)) * radius;
    twistedDelta.x /= aspect;
    vec2 twistedUv = center + twistedDelta;
    vec3 color = texture2D(uTex, coverUv(twistedUv, uRes, uTexRes)).rgb;

    color *= smoothstep(0.02, 0.5, radius) * 0.15 + 0.85;
    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function VortexShader({
  src,
  rotationPeriod = 80,
  twistStrength = 1.0,
  parallax = 1.0,
  focalPoint = [0.5, 0.5],
  className = "",
}: VortexShaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [focalX, focalY] = focalPoint;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !window.WebGLRenderingContext) return;

    const renderer = new Renderer({
      alpha: false,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    });
    const gl = renderer.gl;
    gl.clearColor(0.03, 0.02, 0.06, 1);
    container.appendChild(gl.canvas);
    gl.canvas.style.cssText = "display:block;width:100%;height:100%;";

    const texture = new Texture(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTex: { value: texture },
        uRes: { value: [1, 1] },
        uTexRes: { value: [1, 1] },
        uTwist: { value: 0 },
        uRotation: { value: 0 },
        uMouse: { value: [0, 0] },
        uFocalPoint: { value: [focalX, focalY] },
      },
    });
    const mesh = new Mesh(gl, {
      geometry: new Triangle(gl),
      program,
    });

    const image = new Image();
    image.decoding = "async";
    image.src = src;
    image.onload = () => {
      texture.image = image;
      program.uniforms.uTexRes.value = [image.naturalWidth, image.naturalHeight];
    };

    const resize = () => {
      const { clientWidth: width, clientHeight: height } = container;
      if (!width || !height) return;

      renderer.setSize(width, height);
      program.uniforms.uRes.value = [gl.canvas.width, gl.canvas.height];
    };
    resize();
    window.addEventListener("resize", resize);

    const targetMouse = { x: 0, y: 0 };
    const currentMouse = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      const bounds = container.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;

      targetMouse.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2 * parallax;
      targetMouse.y = -((event.clientY - bounds.top) / bounds.height - 0.5) * 2 * parallax;
    };
    window.addEventListener("pointermove", onPointerMove);

    let awakenedAt: number | null = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && awakenedAt === null) awakenedAt = performance.now();
      },
      { threshold: 0.25 },
    );
    observer.observe(container);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const safeRotationPeriod = Math.max(rotationPeriod, 0.001);
    const startedAt = performance.now();
    let animationFrame = 0;

    const render = (now: number) => {
      const elapsed = (now - startedAt) / 1000;
      const revealProgress = awakenedAt === null ? 0 : Math.min((now - awakenedAt) / 1500, 1);
      const easeOut = 1 - Math.pow(1 - revealProgress, 3);

      program.uniforms.uTwist.value = easeOut * twistStrength;
      program.uniforms.uRotation.value = reducedMotion
        ? 0
        : (elapsed / safeRotationPeriod) * Math.PI * 2;

      currentMouse.x += (targetMouse.x - currentMouse.x) * 0.05;
      currentMouse.y += (targetMouse.y - currentMouse.y) * 0.05;
      program.uniforms.uMouse.value = [currentMouse.x, currentMouse.y];

      renderer.render({ scene: mesh });
      animationFrame = window.requestAnimationFrame(render);
    };
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      observer.disconnect();
      program.remove();
      gl.deleteTexture(texture.texture);
      gl.canvas.remove();
    };
  }, [focalX, focalY, parallax, rotationPeriod, src, twistStrength]);

  return (
    <div
      ref={containerRef}
      data-testid="vortex-shader"
      data-src={src}
      data-focal-point={`${focalX},${focalY}`}
      aria-hidden="true"
      className={className}
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    />
  );
}
