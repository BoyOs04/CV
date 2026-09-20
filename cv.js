import * as THREE from "three";

const root = document.documentElement;
const body = document.body;
const canvasHost = document.getElementById("three-bg");
const printButton = document.getElementById("printButton");
const motionButton = document.getElementById("motionButton");
const scrollSkills = document.getElementById("scrollSkills");
const scrollProgress = document.getElementById("scrollProgress");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let motionEnabled = !prefersReducedMotion;

const setMotionState = (enabled) => {
  motionEnabled = enabled;
  body.classList.toggle("motion-off", !enabled);
  motionButton?.setAttribute("aria-pressed", String(!enabled));
  motionButton?.setAttribute("aria-label", enabled ? "Matikan animasi" : "Aktifkan animasi");
  motionButton?.setAttribute("title", enabled ? "Matikan animasi" : "Aktifkan animasi");
};

setMotionState(motionEnabled);

printButton?.addEventListener("click", () => window.print());

motionButton?.addEventListener("click", () => {
  setMotionState(!motionEnabled);
  if (!motionEnabled) {
    renderer?.render(scene, camera);
  }
});

scrollSkills?.addEventListener("click", () => {
  document.querySelector("#keahlian")?.scrollIntoView({ behavior: motionEnabled ? "smooth" : "auto", block: "start" });
});

const updateProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  if (scrollProgress) scrollProgress.style.width = `${Math.min(100, Math.max(0, progress))}%`;
};

window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress, { passive: true });
updateProgress();

const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      }
    }, { threshold: 0.12 })
  : null;

document.querySelectorAll(".reveal").forEach((element) => {
  if (revealObserver) revealObserver.observe(element);
  else element.classList.add("is-visible");
});

let renderer = null;
let scene = null;
let camera = null;
let animationFrame = 0;
let resizeObserver = null;
let pointerTarget = { x: 0, y: 0 };
let pointerCurrent = { x: 0, y: 0 };

const createThreeBackground = () => {
  if (!canvasHost) return;

  try {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / Math.max(window.innerHeight, 1),
      0.1,
      100
    );
    camera.position.z = 13;

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    canvasHost.appendChild(renderer.domElement);

    const isSmall = window.matchMedia("(max-width: 700px)").matches;
    const count = isSmall ? 330 : 620;
    const spread = isSmall ? 15 : 20;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;
      const radius = spread * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      sizes[i] = 0.02 + Math.random() * 0.04;
    }

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pointsGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

    const pointsMaterial = new THREE.PointsMaterial({
      color: new THREE.Color("#8ad3ff"),
      size: isSmall ? 0.045 : 0.055,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });

    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(points);

    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(isSmall ? 2.2 : 2.8, isSmall ? 0.018 : 0.025, 220, 10),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#8ad3ff"),
        transparent: true,
        opacity: 0.28,
        wireframe: true
      })
    );
    knot.position.set(3.7, 0.7, -2);
    scene.add(knot);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(4.6, 0.012, 16, 180),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#c3a7ff"),
        transparent: true,
        opacity: 0.25
      })
    );
    ring.rotation.x = Math.PI * 0.62;
    ring.rotation.z = Math.PI * 0.14;
    ring.position.set(-4.5, 2.8, -3);
    scene.add(ring);

    const onPointerMove = (event) => {
      const x = (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      const y = (event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
      pointerTarget = { x, y };
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const resize = () => {
      if (!renderer || !camera) return;
      const width = window.innerWidth;
      const height = Math.max(window.innerHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    };

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(document.body);

    const clock = new THREE.Clock();

    const animate = () => {
      animationFrame = window.requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * 0.035;
      pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * 0.035;

      if (motionEnabled) {
        points.rotation.y = elapsed * 0.018 + pointerCurrent.x * 0.07;
        points.rotation.x = pointerCurrent.y * 0.04;

        knot.rotation.x = elapsed * 0.12 + pointerCurrent.y * 0.15;
        knot.rotation.y = elapsed * 0.17 + pointerCurrent.x * 0.24;
        knot.position.y = 0.7 + Math.sin(elapsed * 0.6) * 0.35;

        ring.rotation.z = Math.PI * 0.14 + elapsed * 0.02;
        ring.position.x = -4.5 + pointerCurrent.x * 0.3;
      }

      renderer.render(scene, camera);
    };

    animate();

    if (!motionEnabled) {
      cancelAnimationFrame(animationFrame);
      renderer.render(scene, camera);
    }
  } catch (error) {
    // A CV should remain fully usable when WebGL is unavailable.
    console.warn("Three.js background disabled:", error);
    canvasHost.setAttribute("hidden", "");
  }
};

createThreeBackground();

window.addEventListener("beforeunload", () => {
  if (animationFrame) window.cancelAnimationFrame(animationFrame);
  resizeObserver?.disconnect();
});
