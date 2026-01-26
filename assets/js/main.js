import * as THREE from "https://unpkg.com/three@0.161.0/build/three.module.js";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealElements = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !prefersReducedMotion) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  revealElements.forEach((el) => revealObserver.observe(el));
} else {
  revealElements.forEach((el) => el.classList.add("is-visible"));
}

const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const emailLinks = document.querySelectorAll("[data-email-user][data-email-domain]");
emailLinks.forEach((link) => {
  const user = link.dataset.emailUser;
  const domain = link.dataset.emailDomain;
  if (!user || !domain) {
    return;
  }

  const subject = link.dataset.mailtoSubject || "";
  const body = link.dataset.mailtoBody || "";
  const params = [];
  if (subject) {
    params.push(`subject=${encodeURIComponent(subject)}`);
  }
  if (body) {
    params.push(`body=${encodeURIComponent(body)}`);
  }

  const query = params.length ? `?${params.join("&")}` : "";
  link.setAttribute("href", `mailto:${user}@${domain}${query}`);
});

const modalTriggers = document.querySelectorAll("[data-modal-target]");
const modalCloseButtons = document.querySelectorAll("[data-modal-close]");

const closeModal = (modal) => {
  if (!modal) {
    return;
  }
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
};

modalTriggers.forEach((trigger) => {
  const targetId = trigger.dataset.modalTarget;
  const modal = document.getElementById(targetId);
  if (!modal) {
    return;
  }

  trigger.addEventListener("click", () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  });
});

modalCloseButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    const modal = event.target.closest(".modal");
    closeModal(modal);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    const openModal = document.querySelector(".modal.is-open");
    closeModal(openModal);
  }
});

const canvas = document.getElementById("sim-canvas");
const simFooter = document.querySelector(".sim-footer");

const setSimStatus = (message) => {
  if (simFooter) {
    simFooter.innerHTML = `<span class="status-dot"></span>${message}`;
  }
};

const startFallback = () => {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  setSimStatus("WebGL unavailable. Showing 2D simulation preview.");

  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) {
      return false;
    }
    canvas.width = Math.floor(width * window.devicePixelRatio);
    canvas.height = Math.floor(height * window.devicePixelRatio);
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    return true;
  };

  const ensureSize = () => {
    if (!resize()) {
      requestAnimationFrame(ensureSize);
    }
  };

  window.addEventListener("resize", resize);
  requestAnimationFrame(ensureSize);

  const points = Array.from({ length: 14 }, (_, i) => ({
    angle: (Math.PI * 2 * i) / 14,
    radius: 90 + i * 4
  }));

  const draw = (time) => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) {
      requestAnimationFrame(draw);
      return;
    }

    ctx.clearRect(0, 0, width, height);
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "rgba(43, 179, 163, 0.2)");
    gradient.addColorStop(1, "rgba(255, 138, 61, 0.15)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const centerX = width * 0.5;
    const centerY = height * 0.52;

    ctx.strokeStyle = "rgba(15, 22, 30, 0.35)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i += 1) {
      const radius = 40 + i * 26;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    const t = time * 0.001;
    const baseAngle = t * 0.8;
    const elbowAngle = Math.sin(t * 1.2) * 0.6 - 0.6;

    ctx.strokeStyle = "rgba(12, 21, 31, 0.8)";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    const armX = centerX + Math.cos(baseAngle) * 120;
    const armY = centerY + Math.sin(baseAngle) * 60;
    ctx.lineTo(armX, armY);
    const forearmX = armX + Math.cos(baseAngle + elbowAngle) * 90;
    const forearmY = armY + Math.sin(baseAngle + elbowAngle) * 40;
    ctx.lineTo(forearmX, forearmY);
    ctx.stroke();

    ctx.fillStyle = "#ff8a3d";
    ctx.beginPath();
    ctx.arc(forearmX, forearmY, 8, 0, Math.PI * 2);
    ctx.fill();

    points.forEach((point, index) => {
      const angle = point.angle + t * 0.5;
      const x = centerX + Math.cos(angle) * point.radius;
      const y = centerY + Math.sin(angle) * (point.radius * 0.55);
      ctx.fillStyle = index % 2 === 0 ? "rgba(43, 179, 163, 0.8)" : "rgba(255, 255, 255, 0.7)";
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    if (!prefersReducedMotion) {
      requestAnimationFrame(draw);
    }
  };

  requestAnimationFrame(draw);
};

if (canvas) {
  const glContext = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  let renderer;

  if (!glContext) {
    startFallback();
  } else {
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        context: glContext,
        antialias: true,
        alpha: true
      });
    } catch (error) {
      startFallback();
    }
  }

  if (!renderer) {
    // WebGL unavailable, fallback already started.
  } else {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0c151f, 6, 20);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
  camera.position.set(6.5, 4.2, 9.5);
  camera.lookAt(0, 1, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 0.55);
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
  keyLight.position.set(6, 8, 6);
  const fillLight = new THREE.DirectionalLight(0xffe2c4, 0.4);
  fillLight.position.set(-6, 3, -4);
  scene.add(ambient, keyLight, fillLight);

  const grid = new THREE.GridHelper(16, 22, 0x2bb3a3, 0x22303f);
  grid.material.opacity = 0.4;
  grid.material.transparent = true;
  scene.add(grid);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.5, 0.6, 32),
    new THREE.MeshStandardMaterial({ color: 0x2a3947, metalness: 0.4, roughness: 0.6 })
  );
  base.position.y = 0.3;
  scene.add(base);

  const armGroup = new THREE.Group();
  armGroup.position.y = 0.6;
  scene.add(armGroup);

  const upperArm = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 0.4, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x3c5268, metalness: 0.5, roughness: 0.35 })
  );
  upperArm.position.x = 1.4;
  armGroup.add(upperArm);

  const forearmGroup = new THREE.Group();
  forearmGroup.position.x = 2.8;
  armGroup.add(forearmGroup);

  const forearm = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.32, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x4f6c86, metalness: 0.4, roughness: 0.4 })
  );
  forearm.position.x = 1.05;
  forearmGroup.add(forearm);

  const effector = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 20, 20),
    new THREE.MeshStandardMaterial({ color: 0xff8a3d, emissive: 0xff6a1a, emissiveIntensity: 0.5 })
  );
  effector.position.set(2.1, 0, 0);
  forearmGroup.add(effector);

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3, 0.8, -2),
    new THREE.Vector3(0, 1.6, -3.6),
    new THREE.Vector3(3.2, 1.1, -1.2),
    new THREE.Vector3(2.2, 0.9, 3),
    new THREE.Vector3(-2.8, 1.4, 2.4)
  ]);

  const curvePoints = curve.getPoints(80);
  const curveGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
  const curveLine = new THREE.Line(
    curveGeometry,
    new THREE.LineBasicMaterial({ color: 0x2bb3a3, transparent: true, opacity: 0.45 })
  );
  scene.add(curveLine);

  const payload = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xf0c26d, emissive: 0xf0c26d, emissiveIntensity: 0.25 })
  );
  scene.add(payload);

  const satellites = new THREE.Group();
  const satelliteGeometry = new THREE.SphereGeometry(0.12, 12, 12);
  const satelliteMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x2bb3a3, emissiveIntensity: 0.35 });
  for (let i = 0; i < 12; i += 1) {
    const satellite = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
    satellites.add(satellite);
  }
  scene.add(satellites);

  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) {
      return false;
    }
    renderer.setSize(width, height, true);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    return true;
  };

  const ensureSize = () => {
    if (!resize()) {
      requestAnimationFrame(ensureSize);
    }
  };

  window.addEventListener("load", resize);
  window.addEventListener("resize", resize);
  requestAnimationFrame(ensureSize);
  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
  }

  const clock = new THREE.Clock();

  const animate = () => {
    const t = clock.getElapsedTime();
    armGroup.rotation.y = t * 0.3;
    upperArm.rotation.z = Math.sin(t * 0.6) * 0.35 + 0.2;
    forearmGroup.rotation.z = Math.cos(t * 0.8) * 0.5 - 0.4;
    forearmGroup.rotation.y = Math.sin(t * 0.4) * 0.2;

    const progress = (t * 0.05) % 1;
    payload.position.copy(curve.getPointAt(progress));

    satellites.children.forEach((satellite, index) => {
      const angle = t * 0.5 + index * 0.6;
      satellite.position.set(
        Math.cos(angle) * 4,
        1.1 + Math.sin(t + index) * 0.3,
        Math.sin(angle) * 4
      );
    });

    renderer.render(scene, camera);

    if (!prefersReducedMotion) {
      requestAnimationFrame(animate);
    }
  };

    animate();
  }
}
