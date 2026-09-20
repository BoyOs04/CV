import * as THREE from "three";

const body = document.body;
const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".mobile-nav-toggle");
const navLinks = document.querySelectorAll(".nav-links a");
const canvasHost = document.getElementById("three-bg");
const printButton = document.getElementById("printButton");
const motionButton = document.getElementById("motionButton");
const scrollSkills = document.getElementById("scrollSkills");
const scrollProgress = document.getElementById("scrollProgress");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let motionEnabled = !prefersReducedMotion;
let renderer = null;
let scene = null;
let camera = null;
let timer = null;
let points = null;
let knot = null;
let ring = null;
let animationStarted = false;
let resizeHandler = null;
let pointerHandler = null;
let motionMediaHandler = null;

const setMotionState = (enabled) => {
  motionEnabled = enabled;
  body.classList.toggle("motion-off", !enabled);

  if (motionButton) {
    motionButton.setAttribute("aria-pressed", String(!enabled));
    motionButton.setAttribute("aria-label", enabled ? "Matikan animasi" : "Aktifkan animasi");
    motionButton.setAttribute("title", enabled ? "Matikan animasi" : "Aktifkan animasi");
  }

  if (renderer) {
    if (enabled) {
      startThreeAnimation();
    } else {
      renderer.setAnimationLoop(null);
      animationStarted = false;
      renderer.render(scene, camera);
    }
  }
};

const closeMobileMenu = () => {
  header?.classList.remove("menu-open");
  navToggle?.setAttribute("aria-expanded", "false");
};

navToggle?.addEventListener("click", () => {
  const open = !header?.classList.contains("menu-open");
  header?.classList.toggle("menu-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
});

navLinks.forEach((link) => link.addEventListener("click", closeMobileMenu));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMobileMenu();
});

document.addEventListener("click", (event) => {
  if (!header?.classList.contains("menu-open")) return;
  if (!header.contains(event.target)) closeMobileMenu();
});

printButton?.addEventListener("click", () => window.print());

motionButton?.addEventListener("click", () => {
  setMotionState(!motionEnabled);
});

scrollSkills?.addEventListener("click", () => {
  document.querySelector("#keahlian")?.scrollIntoView({
    behavior: motionEnabled ? "smooth" : "auto",
    block: "start"
  });
});

const updateProgress = () => {
  const scrollable = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  if (scrollProgress) {
    scrollProgress.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  }
};

window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress, { passive: true });

const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 })
  : null;

document.querySelectorAll(".reveal").forEach((element) => {
  if (revealObserver) {
    revealObserver.observe(element);
  } else {
    element.classList.add("is-visible");
  }
});

const updateThreeSize = () => {
  if (!renderer || !camera) return;
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
};

const animateThree = (timestamp) => {
  if (!renderer || !scene || !camera || !timer) return;

  timer.update(timestamp);

  if (motionEnabled) {
    const elapsed = timer.getElapsed();

    const x = pointerCurrent.x;
    const y = pointerCurrent.y;

    points.rotation.y = elapsed * 0.018 + x * 0.07;
    points.rotation.x = y * 0.04;

    knot.rotation.x = elapsed * 0.12 + y * 0.15;
    knot.rotation.y = elapsed * 0.17 + x * 0.24;
    knot.position.y = 0.45 + Math.sin(elapsed * 0.6) * 0.25;

    ring.rotation.z = Math.PI * 0.14 + elapsed * 0.02;
    ring.position.x = -4.5 + x * 0.25;
  }

  renderer.render(scene, camera);
};

const startThreeAnimation = () => {
  if (!renderer || !motionEnabled || animationStarted) return;
  animationStarted = true;
  renderer.setAnimationLoop(animateThree);
};

let pointerTarget = { x: 0, y: 0 };
let pointerCurrent = { x: 0, y: 0 };

const createThreeBackground = () => {
  if (!canvasHost || !("WebGLRenderingContext" in window)) {
    canvasHost?.setAttribute("hidden", "");
    return;
  }

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
    const count = isSmall ? 240 : 420;
    const spread = isSmall ? 14 : 19;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;
      const radius = spread * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
    }

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const pointsMaterial = new THREE.PointsMaterial({
      color: "#8ad3ff",
      size: isSmall ? 0.045 : 0.055,
      transparent: true,
      opacity: 0.38,
      depthWrite: false
    });

    points = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(points);

    knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(isSmall ? 2.0 : 2.6, isSmall ? 0.015 : 0.022, 150, 8),
      new THREE.MeshBasicMaterial({
        color: "#8ad3ff",
        transparent: true,
        opacity: 0.22,
        wireframe: true
      })
    );
    knot.position.set(3.7, 0.45, -2);
    scene.add(knot);

    ring = new THREE.Mesh(
      new THREE.TorusGeometry(4.3, 0.01, 12, 128),
      new THREE.MeshBasicMaterial({
        color: "#c3a7ff",
        transparent: true,
        opacity: 0.2
      })
    );
    ring.rotation.x = Math.PI * 0.62;
    ring.rotation.z = Math.PI * 0.14;
    ring.position.set(-4.5, 2.7, -3);
    scene.add(ring);

    pointerHandler = (event) => {
      pointerTarget.x = (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      pointerTarget.y = (event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
    };

    window.addEventListener("pointermove", pointerHandler, { passive: true });

    resizeHandler = updateThreeSize;
    window.addEventListener("resize", resizeHandler, { passive: true });

    timer = new THREE.Timer();
    timer.connect(document);

    const syncPointer = () => {
      pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * 0.035;
      pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * 0.035;
    };

    // Keep pointer interpolation independent from the render loop.
    const pointerLoop = () => {
      syncPointer();
      if (renderer) window.requestAnimationFrame(pointerLoop);
    };
    pointerLoop();

    if (motionEnabled) {
      startThreeAnimation();
    } else {
      renderer.render(scene, camera);
    }
  } catch (error) {
    console.warn("Three.js background disabled:", error);
    canvasHost.setAttribute("hidden", "");
    renderer?.dispose();
    renderer = null;
  }
};

motionMediaHandler = (event) => {
  if (event.matches) setMotionState(false);
};

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
motionQuery.addEventListener?.("change", motionMediaHandler);

setMotionState(motionEnabled);
updateProgress();
createThreeBackground();

window.addEventListener("beforeunload", () => {
  revealObserver?.disconnect();
  motionQuery.removeEventListener?.("change", motionMediaHandler);
  if (resizeHandler) window.removeEventListener("resize", resizeHandler);
  if (pointerHandler) window.removeEventListener("pointermove", pointerHandler);

  timer?.disconnect();
  timer?.dispose();

  points?.geometry.dispose();
  points?.material.dispose();
  knot?.geometry.dispose();
  knot?.material.dispose();
  ring?.geometry.dispose();
  ring?.material.dispose();

  renderer?.setAnimationLoop(null);
  renderer?.dispose();
});
