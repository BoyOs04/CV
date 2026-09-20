import * as THREE from "three";

const body = document.body;
const topbar = document.getElementById("topbar");
const menuToggle = document.getElementById("menuToggle");
const mobileNav = document.getElementById("mobileNav");
const progressBar = document.getElementById("progressBar");
const heroVisual = document.getElementById("heroVisual");
const sceneHost = document.getElementById("scene");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const setMenu = (open) => {
  topbar?.classList.toggle("menu-open", open);
  menuToggle?.setAttribute("aria-expanded", String(open));
  menuToggle?.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
};

menuToggle?.addEventListener("click", () => {
  setMenu(!topbar?.classList.contains("menu-open"));
});

mobileNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenu(false);
});

document.addEventListener("click", (event) => {
  if (topbar?.classList.contains("menu-open") && !topbar.contains(event.target)) {
    setMenu(false);
  }
});

const updateProgress = () => {
  const total = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const value = Math.max(0, Math.min(100, (window.scrollY / total) * 100));
  if (progressBar) progressBar.style.width = `${value}%`;
};

window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress, { passive: true });
updateProgress();

const pointerMove = (event) => {
  if (reduceMotion.matches) return;

  const px = event.clientX / Math.max(1, window.innerWidth) - 0.5;
  const py = event.clientY / Math.max(1, window.innerHeight) - 0.5;

  body.style.setProperty("--mx", `${event.clientX}px`);
  body.style.setProperty("--my", `${event.clientY}px`);

  if (heroVisual) {
    heroVisual.style.setProperty("--tx", `${(px * -10).toFixed(2)}px`);
    heroVisual.style.setProperty("--ty", `${(py * -10).toFixed(2)}px`);
  }
};

window.addEventListener("pointermove", pointerMove, { passive: true });

document.querySelectorAll(".magnetic").forEach((button) => {
  const reset = () => {
    button.style.transform = "";
  };

  button.addEventListener("pointermove", (event) => {
    if (reduceMotion.matches || window.innerWidth < 900) return;
    const rect = button.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (event.clientY - rect.top - rect.height / 2) / rect.height;
    button.style.transform = `translate(${(x * 7).toFixed(2)}px,${(y * 7).toFixed(2)}px)`;
  });

  button.addEventListener("pointerleave", reset);
  button.addEventListener("blur", reset);
});

const observer = "IntersectionObserver" in window
  ? new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        entry.target.style.animationPlayState = "running";
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12 })
  : null;

document.querySelectorAll(".section .reveal").forEach((element) => {
  if (observer) {
    element.style.animationPlayState = "paused";
    observer.observe(element);
  }
});

// Subtle cursor glow follows the pointer.
const glow = document.createElement("div");
glow.setAttribute("aria-hidden", "true");
glow.style.cssText = [
  "position:fixed",
  "width:280px",
  "height:280px",
  "left:0",
  "top:0",
  "border-radius:50%",
  "pointer-events:none",
  "z-index:-1",
  "transform:translate(-50%,-50%)",
  "background:radial-gradient(circle,rgba(138,211,255,.07),transparent 68%)",
  "filter:blur(10px)",
  "mix-blend-mode:screen"
].join(";");
body.appendChild(glow);

window.addEventListener("pointermove", (event) => {
  if (reduceMotion.matches) return;
  glow.style.left = `${event.clientX}px`;
  glow.style.top = `${event.clientY}px`;
}, { passive: true });

let renderer = null;
let scene = null;
let camera = null;
let particles = null;
let ring = null;
let animationRunning = false;
let elapsed = 0;
let lastFrame = 0;

const render = (time) => {
  if (!renderer || !scene || !camera) return;

  const now = typeof time === "number" ? time : performance.now();
  const delta = lastFrame ? Math.min(0.05, Math.max(0, (now - lastFrame) / 1000)) : 0;
  lastFrame = now;

  if (!reduceMotion.matches) {
    elapsed += delta;
    particles.rotation.y = elapsed * 0.012;
    particles.rotation.x = Math.sin(elapsed * 0.1) * 0.025;
    ring.rotation.z = elapsed * 0.017;
  }

  renderer.render(scene, camera);
};

const startAnimation = () => {
  if (!renderer || animationRunning || reduceMotion.matches) return;
  animationRunning = true;
  renderer.setAnimationLoop(render);
};

const stopAnimation = () => {
  renderer?.setAnimationLoop(null);
  animationRunning = false;
};

const initThree = () => {
  if (!sceneHost || !window.WebGLRenderingContext) return;

  try {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / Math.max(1, window.innerHeight),
      0.1,
      100
    );
    camera.position.z = 13;

    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    sceneHost.appendChild(renderer.domElement);

    const mobile = window.matchMedia("(max-width: 640px)").matches;
    const count = mobile ? 170 : 300;
    const spread = mobile ? 14 : 19;
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

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    particles = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: "#8ad3ff",
        size: mobile ? 0.045 : 0.055,
        transparent: true,
        opacity: 0.24,
        depthWrite: false
      })
    );
    scene.add(particles);

    ring = new THREE.Mesh(
      new THREE.TorusGeometry(4.5, 0.009, 12, 128),
      new THREE.MeshBasicMaterial({
        color: "#c3a7ff",
        transparent: true,
        opacity: 0.13
      })
    );
    ring.rotation.x = Math.PI * 0.62;
    ring.position.set(-3.5, 2.2, -3);
    scene.add(ring);

    const resize = () => {
      if (!renderer || !camera) return;
      const width = Math.max(1, window.innerWidth);
      const height = Math.max(1, window.innerHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
    };

    window.addEventListener("resize", resize, { passive: true });
    resize();

    if (reduceMotion.matches) {
      renderer.render(scene, camera);
    } else {
      startAnimation();
    }

    reduceMotion.addEventListener?.("change", (event) => {
      if (event.matches) {
        stopAnimation();
        renderer?.render(scene, camera);
      } else {
        startAnimation();
      }
    });
  } catch (error) {
    console.warn("Three.js background disabled:", error);
    sceneHost.setAttribute("hidden", "");
    renderer?.dispose();
    renderer = null;
  }
};

initThree();