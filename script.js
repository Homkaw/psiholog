
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// Мобильное меню
const burger = document.getElementById("burger");
const mobileMenu = document.getElementById("mobileMenu");

burger?.addEventListener("click", () => {
  const open = mobileMenu.classList.toggle("active");
  burger.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll(".mobile-menu a").forEach(link => {
  link.addEventListener("click", () => {
    mobileMenu?.classList.remove("active");
    burger?.setAttribute("aria-expanded", "false");
  });
});

// 3D-комната
const host = document.getElementById("therapyScene");

if (host) initRoom();

function initRoom() {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#f2eaf2");

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  const startPosition = new THREE.Vector3(7.8, 6.3, 9.5);
  const startTarget = new THREE.Vector3(0, 1.1, 0);
  camera.position.copy(startPosition);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;
  host.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(startTarget);
  controls.enableDamping = !reducedMotion;
  controls.dampingFactor = 0.055;
  controls.enablePan = false;
  controls.minDistance = 6;
  controls.maxDistance = 18;
  controls.minPolarAngle = 0.45;
  controls.maxPolarAngle = Math.PI / 2.1;
  controls.minAzimuthAngle = -Math.PI / 2.8;
  controls.maxAzimuthAngle = Math.PI / 2.8;
  controls.update();

  const mat = color => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.85
  });

  const m = {
    cream: mat("#fbf7f2"),
    wall: mat("#eee5e6"),
    lavender: mat("#c9bad9"),
    darkLavender: mat("#a996bf"),
    oak: mat("#c49a6c"),
    darkOak: mat("#9d714e"),
    rug: mat("#e7dbe9"),
    green: mat("#81967d"),
    pot: mat("#dbc6ae"),
    white: mat("#fffdf9"),
    brass: new THREE.MeshStandardMaterial({
      color: "#c6a77d",
      metalness: 0.5,
      roughness: 0.35
    })
  };

  const group = (x = 0, y = 0, z = 0) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    scene.add(g);
    return g;
  };

  function box(parent, w, h, d, material, x, y, z, r = 0.06) {
    const radius = Math.max(
      0.001,
      Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)
    );

    const mesh = new THREE.Mesh(
      new RoundedBoxGeometry(w, h, d, 3, radius),
      material
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function cylinder(parent, top, bottom, h, material, x, y, z, segments = 32) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(top, bottom, h, segments),
      material
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function sphere(parent, radius, material, x, y, z) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 16, 12),
      material
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  const interactive = [];

  function interact(object, label, action) {
    object.userData.interaction = { label, action };
    interactive.push(object);
  }

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({
    behavior: reducedMotion ? "instant" : "smooth"
  });

  // Пол и стены
  const room = group();

  box(room, 8.2, 0.28, 6.8, m.darkOak, 0, -0.21, 0);
  box(room, 8, 0.08, 6.6, m.oak, 0, -0.02, 0);
  box(room, 8, 4.8, 0.16, m.wall, 0, 2.4, -3.25);
  box(room, 0.16, 4.8, 6.6, m.cream, -4, 2.4, 0);
  box(room, 8, 0.15, 0.12, m.white, 0, 0.12, -3.12);
  box(room, 0.12, 0.15, 6.5, m.white, -3.87, 0.12, 0);

  for (let i = 0; i < 15; i++) {
    box(room, 0.015, 0.008, 6.5, m.darkOak, -3.75 + i * 0.5, 0.025, 0);
  }

  const rug = cylinder(room, 1.8, 1.8, 0.035, m.rug, 0.2, 0.055, 0.65, 64);
  rug.scale.set(1.25, 1, 0.85);

  // Окно
  const windowGroup = group(-1.4, 2.65, -3.12);

  const sky = box(
    windowGroup, 2.25, 1.85, 0.012,
    new THREE.MeshBasicMaterial({ color: "#e3dce9" }),
    0, 0, -0.015, 0.005
  );
  sky.castShadow = false;

  const hills = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 16),
    new THREE.MeshBasicMaterial({ color: "#c1b2c8" })
  );
  hills.scale.set(1.65, 0.42, 0.05);
  hills.position.set(0, -1.02, 0.008);
  hills.castShadow = false;
  windowGroup.add(hills);

  box(windowGroup, 2.42, 0.10, 0.14, m.white, 0, 1, 0.05);
  box(windowGroup, 2.42, 0.10, 0.14, m.white, 0, -1, 0.05);
  box(windowGroup, 0.10, 2.05, 0.14, m.white, -1.18, 0, 0.05);
  box(windowGroup, 0.10, 2.05, 0.14, m.white, 1.18, 0, 0.05);
  box(windowGroup, 0.065, 2, 0.12, m.white, 0, 0, 0.08);
  box(windowGroup, 2.3, 0.065, 0.12, m.white, 0, 0, 0.08);
  box(windowGroup, 2.65, 0.12, 0.35, m.white, 0, -1.07, 0.17);

  // Кресла
  function createChair(x, z, rotation) {
    const chair = group(x, 0, z);
    chair.rotation.y = rotation;

    for (const px of [-0.48, 0.48]) {
      for (const pz of [-0.43, 0.43]) {
        cylinder(chair, 0.065, 0.045, 0.32, m.darkOak, px, 0.24, pz, 12);
      }
    }

    box(chair, 1.38, 0.33, 1.25, m.darkLavender, 0, 0.53, 0);
    box(chair, 1.13, 0.19, 1.04, m.lavender, 0, 0.76, 0.08, 0.09);

    const back = box(chair, 1.3, 1.26, 0.30, m.lavender, 0, 1.29, -0.52, 0.13);
    back.rotation.x = -0.12;

    for (const px of [-0.65, 0.65]) {
      box(chair, 0.23, 0.66, 1.15, m.darkLavender, px, 0.93, 0.01, 0.1);
    }

    box(chair, 0.65, 0.54, 0.15, m.cream, 0, 1.13, -0.29, 0.07);
    return chair;
  }

  interact(
    createChair(-1.5, 1, -0.20),
    "Познакомиться с психологом",
    () => scrollTo("about")
  );

  interact(
    createChair(1.8, 0.6, -0.35),
    "Как проходят консультации",
    () => scrollTo("steps")
  );

  // Столик
  const table = group(0.2, 0, 1.05);

  cylinder(table, 0.9, 0.9, 0.11, m.oak, 0, 0.80, 0, 48);
  cylinder(table, 0.11, 0.14, 0.7, m.darkOak, 0, 0.42, 0);
  cylinder(table, 0.48, 0.48, 0.09, m.darkOak, 0, 0.09, 0);

  const book = box(table, 0.51, 0.07, 0.34, m.white, -0.22, 0.90, 0);
  book.rotation.y = 0.3;

  cylinder(table, 0.12, 0.09, 0.27, m.pot, 0.35, 0.98, 0.02);
  sphere(table, 0.15, m.green, 0.35, 1.18, 0.02);

  // Книжный шкаф
  const shelf = group(2.65, 0, -2.75);

  box(shelf, 1.75, 2.85, 0.65, m.oak, 0, 1.43, 0);
  box(shelf, 1.52, 2.61, 0.04, m.darkOak, 0, 1.44, 0.34);

  const bookColors = [
    "#c9bad9", "#e5d0bf", "#a5b69a",
    "#f3eee6", "#b8a6a0", "#ad9abf"
  ].map(mat);

  for (let row = 0; row < 3; row++) {
    const shelfY = 0.55 + row * 0.83;
    box(shelf, 1.62, 0.09, 0.65, m.darkOak, 0, shelfY, 0);

    for (let i = 0; i < 7; i++) {
      const height = 0.40 + ((i * 3 + row) % 4) * 0.06;

      const b = box(
        shelf, 0.13, height, 0.36,
        bookColors[(i + row) % bookColors.length],
        -0.61 + i * 0.20,
        shelfY + 0.05 + height / 2,
        0.04, 0.02
      );

      b.rotation.z = i % 3 === 0 ? 0.05 : 0;
    }
  }

  interact(shelf, "Направления работы", () => scrollTo("help"));

  // Растение
  const plant = group(-3.22, 0, -2.1);

  cylinder(plant, 0.31, 0.24, 0.62, m.pot, 0, 0.32, 0);
  cylinder(plant, 0.08, 0.08, 1.65, m.darkOak, 0, 1.26, 0, 12);

  const leaves = [];

  for (let i = 0; i < 9; i++) {
    const angle = i / 9 * Math.PI * 2;
    const leaf = sphere(
      plant, 0.31, m.green,
      Math.cos(angle) * 0.34,
      1.35 + i % 3 * 0.29,
      Math.sin(angle) * 0.34
    );

    leaf.scale.set(0.7, 1.6, 0.5);
    leaf.rotation.z = Math.cos(angle) * 0.35;
    leaves.push(leaf);
  }

  // Торшер
  const lamp = group(3.3, 0, 1.9);

  cylinder(lamp, 0.3, 0.3, 0.07, m.brass, 0, 0.07, 0);
  cylinder(lamp, 0.035, 0.035, 2.18, m.brass, 0, 1.17, 0, 16);

  const shadeMaterial = new THREE.MeshStandardMaterial({
    color: "#f1e6d7",
    side: THREE.DoubleSide,
    roughness: 0.9,
    emissive: "#ffddab",
    emissiveIntensity: 0.12
  });

  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.43, 0.52, 32, 1, true),
    shadeMaterial
  );

  shade.position.y = 2.38;
  shade.castShadow = true;
  lamp.add(shade);

  const lampLight = new THREE.PointLight("#ffd5a0", 4, 5, 2);
  lampLight.position.set(0, 2.23, 0);
  lamp.add(lampLight);

  interact(lamp, "Переключить освещение", toggleAtmosphere);

  // Календарь
  const calendar = group(0.95, 2.7, -3.10);

  box(calendar, 0.92, 1.12, 0.06, m.white, 0, 0, 0);
  box(calendar, 0.92, 0.22, 0.085, m.lavender, 0, 0.43, 0.015);

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      box(
        calendar, 0.09, 0.065, 0.015,
        m.darkLavender,
        -0.28 + col * 0.14,
        0.13 - row * 0.19,
        0.055, 0.01
      );
    }
  }

  interact(calendar, "Записаться на встречу", () => scrollTo("appointment"));

  // Освещение
  const ambient = new THREE.HemisphereLight("#ffffff", "#b9a4a0", 2);
  scene.add(ambient);

  const sunlight = new THREE.DirectionalLight("#fff1df", 3.8);
  sunlight.position.set(-3, 8, 6);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(1024, 1024);
  sunlight.shadow.camera.left = -9;
  sunlight.shadow.camera.right = 9;
  sunlight.shadow.camera.top = 9;
  sunlight.shadow.camera.bottom = -9;
  sunlight.shadow.normalBias = 0.02;
  scene.add(sunlight);

  let evening = false;
  const atmosphereButton = document.getElementById("toggleAtmosphere");

  function toggleAtmosphere() {
    evening = !evening;

    scene.background.set(evening ? "#3a334b" : "#f2eaf2");
    ambient.intensity = evening ? 0.85 : 2;
    sunlight.intensity = evening ? 0.6 : 3.8;
    lampLight.intensity = evening ? 7 : 4;
    shadeMaterial.emissiveIntensity = evening ? 0.8 : 0.12;
    renderer.toneMappingExposure = evening ? 1.15 : 1.45;

    if (atmosphereButton) {
      atmosphereButton.textContent = evening ? "☀ День" : "☾ Вечер";
    }
  }

  atmosphereButton?.addEventListener("click", toggleAtmosphere);

  // Наведение и клики по предметам
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const hint = document.getElementById("sceneHint");

  const targets = [];
  interactive.forEach(object => {
    object.traverse(child => {
      if (child.isMesh) targets.push(child);
    });
  });

  function getHit(x, y) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = (x - rect.left) / rect.width * 2 - 1;
    pointer.y = -(y - rect.top) / rect.height * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    const hits = raycaster.intersectObjects(targets, false);

    if (!hits.length) return null;

    let object = hits[0].object;

    while (object) {
      if (object.userData.interaction) return object.userData.interaction;
      object = object.parent;
    }

    return null;
  }

  function showHint(label = "") {
    if (!hint) return;
    hint.textContent = label;
    hint.classList.toggle("visible", Boolean(label));
  }

  let startPointer = null;

  renderer.domElement.addEventListener("pointerdown", e => {
    startPointer = { x: e.clientX, y: e.clientY };
  });

  renderer.domElement.addEventListener("pointermove", e => {
    if (e.pointerType === "touch") return;

    const hit = getHit(e.clientX, e.clientY);

    renderer.domElement.style.cursor = hit ? "pointer" : "grab";
    showHint(hit?.label || "");
  });

  renderer.domElement.addEventListener("pointerup", e => {
    if (!startPointer) return;

    const distance = Math.hypot(
      e.clientX - startPointer.x,
      e.clientY - startPointer.y
    );

    startPointer = null;
    if (distance > 7) return;

    getHit(e.clientX, e.clientY)?.action();
  });

  renderer.domElement.addEventListener("pointerleave", () => {
    startPointer = null;
    showHint();
  });

  renderer.domElement.addEventListener("pointercancel", () => {
    startPointer = null;
    showHint();
  });

  document.getElementById("resetCamera")?.addEventListener("click", () => {
    camera.position.copy(startPosition);
    controls.target.copy(startTarget);
    controls.update();
  });

  // Адаптив
  function resize() {
    const width = host.clientWidth;
    const height = host.clientHeight;

    if (!width || !height) return;

    camera.aspect = width / height;
    camera.fov = width < 500 ? 43 : 35;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height, false);
  }

  new ResizeObserver(resize).observe(host);
  resize();

  // Анимация
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    if (!reducedMotion) {
      const time = clock.getElapsedTime();

      leaves.forEach((leaf, i) => {
        leaf.rotation.z =
          Math.cos(i / 9 * Math.PI * 2) * 0.35 +
          Math.sin(time * 0.65 + i) * 0.018;
      });
    }

    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}

// Форма обратной связи
// ==========================================
// PREMIUM CONTACT FORM
// ==========================================

const appointmentForm = document.getElementById("appointmentForm");

if (appointmentForm) {
  const form = appointmentForm;
  const fields = form.elements;
  const messageBox = document.getElementById("formMessage");
  const submitButton = form.querySelector('[type="submit"]');

  const rules = {
    name: value => {
      if (!value.trim()) return "Пожалуйста, укажите ваше имя";
      if (value.trim().length < 2) return "Имя должно содержать минимум 2 символа";
      if (value.length > 100) return "Имя слишком длинное";
      return "";
    },

    email: value => {
      if (!value.trim()) return "Укажите электронную почту";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        return "Введите корректный адрес электронной почты";
      }
      if (value.length > 254) return "Адрес электронной почты слишком длинный";
      return "";
    },

    message: value => {
      if (value.length > 500) return "Максимум 500 символов";
      return "";
    },

    consent: value => {
      return value
        ? ""
        : "Необходимо согласиться с обработкой персональных данных";
    }
  };

  function getFieldWrapper(field) {
    return field.closest(".form-field, .form-consent");
  }

  function clearFieldError(field) {
    const wrapper = getFieldWrapper(field);
    if (!wrapper) return;

    wrapper.classList.remove("is-invalid");
    field.removeAttribute("aria-invalid");
    field.removeAttribute("aria-describedby");

    wrapper.querySelectorAll(".field-error").forEach(el => el.remove());
  }

  function showFieldError(field, message) {
    const wrapper = getFieldWrapper(field);
    if (!wrapper) return;

    clearFieldError(field);

    if (!message) {
      wrapper.classList.add("is-valid");
      return;
    }

    wrapper.classList.remove("is-valid");
    wrapper.classList.add("is-invalid");
    field.setAttribute("aria-invalid", "true");

    const error = document.createElement("span");
    error.className = "field-error";
    error.id = `${field.id}-error`;
    error.textContent = message;

    if (field.type === "checkbox") {
      error.classList.add("consent-error");
      wrapper.after(error);
    } else {
      wrapper.appendChild(error);
    }

    field.setAttribute("aria-describedby", error.id);
  }

  function validateField(name) {
    const field = fields[name];
    if (!field) return true;

    const value = field.type === "checkbox"
      ? field.checked
      : field.value;

    const error = rules[name]?.(value) || "";

    if (name === "consent") {
      document.getElementById("clientConsent-error")?.remove();
    }

    showFieldError(field, error);
    return !error;
  }

  function showMessage(message, status = "") {
    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.dataset.status = status;
  }

  ["name", "email", "message", "consent"].forEach(name => {
    const field = fields[name];
    if (!field) return;

    const eventType = field.type === "checkbox" ? "change" : "input";

    field.addEventListener(eventType, () => {
      if (
        getFieldWrapper(field)?.classList.contains("is-invalid") ||
        field.dataset.touched === "true"
      ) {
        validateField(name);
      }
    });

    field.addEventListener("blur", () => {
      field.dataset.touched = "true";
      validateField(name);
    });
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (submitButton.disabled) return;

    showMessage("");

    const names = ["name", "email", "message", "consent"];
    const errors = names.filter(name => !validateField(name));

    if (errors.length) {
      fields[errors[0]]?.focus();
      return;
    }

    const data = {
      name: fields["name"].value.trim(),
      email: fields["email"].value.trim(),
      format: fields["format"].value,
      message: fields["message"].value.trim(),
      consent: fields["consent"].checked,
      website: fields["website"]?.value || ""
    };

    submitButton.disabled = true;
    showMessage("Отправляем вашу заявку…", "loading");

    try {
      const response = await fetch("/api/appointment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Не удалось отправить заявку"
        );
      }

      form.reset();

      form.querySelectorAll(".is-valid, .is-invalid").forEach(el => {
        el.classList.remove("is-valid", "is-invalid");
      });

      form.querySelectorAll(".field-error").forEach(el => el.remove());

      form.querySelectorAll("[aria-invalid], [aria-describedby]").forEach(el => {
        el.removeAttribute("aria-invalid");
        el.removeAttribute("aria-describedby");
      });

      form.querySelectorAll("[data-touched]").forEach(el => {
        delete el.dataset.touched;
      });

      showMessage(
        "Спасибо! Ваша заявка успешно отправлена. С вами свяжутся по электронной почте.",
        "success"
      );

    } catch (error) {
      console.error("Ошибка отправки формы:", error);
      showMessage(
        error.message || "Что-то пошло не так. Попробуйте позже.",
        "error"
      );

    } finally {
      submitButton.disabled = false;
    }
  });
}



// =========================================
// АНИМАЦИЯ РАЗДЕЛОВ ПРИ ПРОКРУТКЕ
// =========================================

function initPageAnimations() {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reducedMotion || !("IntersectionObserver" in window)) return;

  const revealGroups = [
    [".about-visual", "left"],
    [".about-description", "right"],
    [".premium-heading", "up"],
    [".help-item", "scale"],
    [".quote-content", "up"],
    [".process-item", "up"],
    [".premium-service", "scale"],
    [".faq-layout > div:first-child", "left"],
    [".faq-item", "up"],
    [".contact-info", "left"],
    [".premium-form", "right"],
    [".footer-main", "up"]
  ];

  const elements = [];

  revealGroups.forEach(([selector, direction]) => {
    document.querySelectorAll(selector).forEach((element, index) => {
      element.dataset.reveal = direction;

      const delay = selector === ".help-item" ||
                    selector === ".premium-service" ||
                    selector === ".faq-item"
        ? (index % 3) * 100
        : 0;

      element.style.setProperty("--reveal-delay", `${delay}ms`);
      elements.push(element);
    });
  });

  if (!elements.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.08,
    rootMargin: "0px 0px -35px 0px"
  });

  elements.forEach(element => observer.observe(element));

  // Включаем скрытие только после настройки наблюдателя.
  document.documentElement.classList.add("motion-ready");

  // Элементы, уже находящиеся на экране, показываем сразу.
  elements.forEach(element => {
    const rect = element.getBoundingClientRect();

    if (rect.top < window.innerHeight && rect.bottom > 0) {
      element.classList.add("is-visible");
      observer.unobserve(element);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPageAnimations);
} else {
  initPageAnimations();
}



// ==========================================
// FOOTER
// ==========================================

const footerYear = document.getElementById("footerYear");
const backToTop = document.getElementById("backToTop");

if (footerYear) {
  footerYear.textContent = new Date().getFullYear();
}

if (backToTop) {
  function updateBackToTop() {
    backToTop.classList.toggle(
      "visible",
      window.scrollY > 550
    );
  }

  window.addEventListener("scroll", updateBackToTop, {
    passive: true
  });

  updateBackToTop();

  backToTop.addEventListener("click", () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "instant" : "smooth"
    });
  });
}
