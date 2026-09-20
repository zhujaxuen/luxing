import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TRIP, ROUTE_STYLES } from "./data.js";
import { TRANSLATIONS } from "./translations.js";

// ============================================================
// Configuração básica
// ============================================================

const GLOBE_RADIUS = 2;

// ============================================================
// Idioma
// ============================================================
// Português vem direto do data.js (é o idioma "fonte"). Inglês e mandarim
// vêm do translations.js. Sempre que currentLang for "pt", usamos o valor
// original; nos outros casos, buscamos a tradução com fallback pro
// português caso falte alguma chave.

const SUPPORTED_LANGS = ["pt", "en", "zh"];
const urlLang = new URLSearchParams(window.location.search).get("lang");
let currentLang = SUPPORTED_LANGS.includes(urlLang)
  ? urlLang
  : localStorage.getItem("luxing-lang") || "pt";
if (!SUPPORTED_LANGS.includes(currentLang)) currentLang = "pt";
localStorage.setItem("luxing-lang", currentLang);

// Mantém a URL sempre explícita sobre o idioma atual (?lang=pt/en/zh),
// assim dá pra compartilhar o link já no idioma certo.
function syncUrlLang(lang) {
  const url = new URL(window.location.href);
  url.searchParams.set("lang", lang);
  window.history.replaceState(null, "", url);
}
syncUrlLang(currentLang);

function t(stopId, field, fallback) {
  if (currentLang === "pt") return fallback;
  return TRANSLATIONS[currentLang]?.stops?.[stopId]?.[field] ?? fallback;
}

function tUI(key, fallback) {
  if (currentLang === "pt") return fallback;
  return TRANSLATIONS[currentLang]?.ui?.[key] ?? fallback;
}

function tTrip(field, fallback) {
  if (currentLang === "pt") return fallback;
  return TRANSLATIONS[currentLang]?.trip?.[field] ?? fallback;
}

function tRouteLabel(type) {
  const fallback = (ROUTE_STYLES[type] || ROUTE_STYLES.voo).label;
  if (currentLang === "pt") return fallback;
  return TRANSLATIONS[currentLang]?.routeLabels?.[type] ?? fallback;
}


document.getElementById("trip-title").textContent = tTrip("title", TRIP.title);
document.getElementById("trip-subtitle").textContent = tTrip("subtitle", TRIP.subtitle);

const canvas = document.getElementById("globe-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1.35, 8.8);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 3;
controls.maxDistance = 12;
controls.rotateSpeed = 0.45;

if (window.innerWidth <= 720) {
  camera.position.set(0, 0.6, 10.8);
  controls.target.set(0, -1.05, 0);
  controls.update();
}

if (window.innerWidth <= 430 && window.innerHeight >= 800) {
  camera.position.set(0, 0.65, 11.4);
  controls.target.set(0, -1.55, 0);
  controls.update();
}

const overviewPosition = camera.position.clone();
const overviewTarget = controls.target.clone();

// Luzes
scene.add(new THREE.AmbientLight(0xffffff, 0.65));
const sun = new THREE.DirectionalLight(0xfff2d8, 1.1);
sun.position.set(5, 3, 5);
scene.add(sun);

// ============================================================
// Estrelas de fundo
// ============================================================

function buildStarfield() {
  const count = 2200;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 40 + Math.random() * 60;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xf2efe6,
    size: 0.045,
    transparent: true,
    opacity: 0.55,
  });
  scene.add(new THREE.Points(geo, mat));
}
buildStarfield();

// ============================================================
// Globo
// ============================================================

const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load(
  "https://cdn.jsdelivr.net/npm/three-globe@2.31.1/example/img/earth-blue-marble.jpg"
);
const earthBumpMap = textureLoader.load(
  "https://cdn.jsdelivr.net/npm/three-globe@2.31.1/example/img/earth-topology.png"
);

const globeGroup = new THREE.Group();
scene.add(globeGroup);

let isAutoRotating = false;
const rotationToggle = document.getElementById("rotation-toggle");
const overviewToggle = document.getElementById("overview-toggle");

// Sincroniza o texto inicial dos botões e da dica com o idioma salvo
// (o HTML vem em português por padrão).
rotationToggle.textContent = tUI("startRotation", "Iniciar giro");
overviewToggle.textContent = tUI("overview", "Visão geral");
const initialHintEl = document.getElementById("hint-text");
if (initialHintEl) {
  initialHintEl.textContent = tUI("hint", "arraste para girar · role para dar zoom");
}

rotationToggle.addEventListener("click", () => {
  isAutoRotating = !isAutoRotating;
  rotationToggle.setAttribute("aria-pressed", String(isAutoRotating));
  rotationToggle.textContent = isAutoRotating
    ? tUI("stopRotation", "Parar giro")
    : tUI("startRotation", "Iniciar giro");
});

overviewToggle.addEventListener("click", () => {
  activeCameraFollow = null;
  animateCamera(overviewPosition, overviewTarget);
  overviewToggle.hidden = true;
  activeStopId = null;
  updateTimelineState();
  routeObjects.forEach((route) => {
    route.line.visible = true;
    route.line.material.opacity = 0.85;
    if (route.icon) route.icon.visible = false;
  });
});

const globe = new THREE.Mesh(
  new THREE.SphereGeometry(GLOBE_RADIUS, 96, 96),
  new THREE.MeshPhongMaterial({
    map: earthTexture,
    bumpMap: earthBumpMap,
    bumpScale: 0.035,
    shininess: 6,
  })
);
globeGroup.add(globe);

// Brilho atmosférico (halo) usando shader simples de Fresnel
const atmosphereMat = new THREE.ShaderMaterial({
  transparent: true,
  side: THREE.BackSide,
  uniforms: {
    glowColor: { value: new THREE.Color(0xc9a24b) },
  },
  vertexShader: `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    uniform vec3 glowColor;
    void main() {
      float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
      gl_FragColor = vec4(glowColor, intensity * 0.75);
    }
  `,
});
const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(GLOBE_RADIUS * 1.06, 64, 64),
  atmosphereMat
);
scene.add(atmosphere);

// ============================================================
// Utilidades de posicionamento
// ============================================================

function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// ============================================================
// Marcadores dos locais
// ============================================================

const markerObjects = []; // { mesh, stop }

function createCityLabel(text) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const font = '600 11px "Manrope", sans-serif';
  const horizontalPadding = 8;
  context.font = font;
  const textWidth = context.measureText(text).width;
  canvas.width = Math.ceil(textWidth + horizontalPadding * 2);
  canvas.height = 32;
  context.font = font;
  context.fillStyle = "#edeae2";
  context.strokeStyle = "rgba(10, 14, 26, 0.95)";
  context.lineWidth = 4;
  context.lineJoin = "round";
  context.textBaseline = "middle";
  context.strokeText(text, horizontalPadding, canvas.height / 2);
  context.fillText(text, horizontalPadding, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  const labelHeight = 0.11;
  sprite.scale.set((canvas.width / canvas.height) * labelHeight, labelHeight, 1);
  sprite.userData.baseScale = sprite.scale.clone();
  sprite.center.set(0.5, 0);
  sprite.position.set(0, 0, 0.05);
  return sprite;
}

function buildMarkers() {
  TRIP.stops.forEach((stop) => {
    if (stop.showMarker === false) return;
    const pos = latLonToVector3(stop.lat, stop.lon, GLOBE_RADIUS);

    let label = null;
    const markerGroup = new THREE.Group();
    markerGroup.position.copy(pos);
    markerGroup.lookAt(pos.clone().multiplyScalar(2));

    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xc1432e })
    );
    markerGroup.add(dot);

    const ringGeo = new THREE.RingGeometry(0.038, 0.05, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xc1432e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.z = 0.001;
    markerGroup.add(ring);

    if (stop.showLabel !== false) {
      label = createCityLabel(t(stop.id, "name", stop.name));
      if (stop.labelOffset) {
        label.position.fromArray(stop.labelOffset);
      }
      markerGroup.add(label);
    }

    globeGroup.add(markerGroup);
    markerObjects.push({ group: markerGroup, dot, ring, label, stop });
  });
}
buildMarkers();

function rebuildMarkerLabels() {
  markerObjects.forEach((marker) => {
    if (!marker.label) return;
    marker.group.remove(marker.label);
    marker.label.material.map.dispose();
    marker.label.material.dispose();

    const newLabel = createCityLabel(t(marker.stop.id, "name", marker.stop.name));
    if (marker.stop.labelOffset) {
      newLabel.position.fromArray(marker.stop.labelOffset);
    }
    marker.group.add(newLabel);
    marker.label = newLabel;
  });
}

function updateMarkerScale() {
  const distance = camera.position.distanceTo(globeGroup.position);
  const zoomProgress = THREE.MathUtils.clamp(
    (distance - controls.minDistance) / (controls.maxDistance - controls.minDistance),
    0,
    1
  );
  const markerScale = 0.55 + zoomProgress * 0.65;
  const dotScale = markerScale * 0.5;
  const ringScale = markerScale * 0.65;
  const labelScale = 0.35 + zoomProgress * 2.2;

  markerObjects.forEach((marker) => {
    marker.dot.scale.setScalar(dotScale);
    marker.ring.scale.setScalar(marker.ring.userData.pulse * ringScale);
    if (marker.label) {
      marker.label.scale.copy(marker.label.userData.baseScale).multiplyScalar(labelScale);
    }
  });

  // Quanto mais perto o zoom (ex.: olhando de perto pras cidades da
  // China), menos sensível o arrasto fica — um gesto pequeno de dedo/mouse
  // já gira bastante quando a câmera está perto, então reduzimos a
  // velocidade de rotação nesse caso.
  controls.rotateSpeed = THREE.MathUtils.lerp(0.18, 0.45, zoomProgress);
}

// ============================================================
// Rotas (arcos entre pontos)
// ============================================================

const routeObjects = []; // { line, icon, type }
const FLIGHT_DURATION_SECONDS = 14; // padrão pra voos não listados abaixo
const TRAIN_DURATION_SECONDS = 9; // padrão pra trens não listados abaixo
const ROUTES_WITHOUT_ICON = new Set(["nanjing:yangzhou"]);

// Duração (em segundos) da animação de cada trecho específico. Quem não
// está listado aqui usa o padrão do tipo (FLIGHT_DURATION_SECONDS ou
// TRAIN_DURATION_SECONDS, lá em cima).
const ROUTE_DURATION_OVERRIDES = {
  "curitiba:sao-paulo": 5,
  "sao-paulo:istambul": 5,
  "istambul:guangzhou": 5,
  "guangzhou-local:beijing": 5,
  "beijing:nanjing": 8,
  "yangzhou:shanghai": 8,
  "shanghai:guangzhou-retorno": 4,
  "guangzhou-retorno:istambul-retorno": 5,
  "istambul-retorno:saopaulo-retorno": 5,
  "saopaulo-retorno:curitiba-retorno": 5,
};

// Trechos em que a câmera acompanha o ícone de perto durante a animação,
// terminando enquadrando a cidade de chegada.
const CAMERA_FOLLOW_ROUTE_KEYS = new Set([
  "sao-paulo:istambul",
  "istambul:guangzhou",
  "guangzhou-local:beijing",
  "beijing:nanjing",
  "yangzhou:shanghai",
  "shanghai:guangzhou-retorno",
  "guangzhou-retorno:istambul-retorno",
  "istambul-retorno:saopaulo-retorno",
]);

// A que distância do centro do globo a câmera fica enquanto acompanha o
// ícone. Nos trechos longos (intercontinentais) ela se afasta mais pra dar
// uma visão do trajeto todo; nos trechos curtos dentro da China isso não é
// necessário — ela fica perto o tempo todo, sem dar esse "zoom pra fora e
// de volta".
const DEFAULT_FOLLOW_DISTANCE = 6.6;
const FOLLOW_DISTANCE_OVERRIDES = {
  "guangzhou-local:beijing": 4,
  "beijing:nanjing": 4,
  "yangzhou:shanghai": 4,
  "shanghai:guangzhou-retorno": 4,
};

function getFollowDistance(route) {
  const routeKey = `${route.from}:${route.to}`;
  return FOLLOW_DISTANCE_OVERRIDES[routeKey] ?? DEFAULT_FOLLOW_DISTANCE;
}

let activeCameraFollow = null;
const routeIconWorldPosition = new THREE.Vector3();

// Desenho vetorial simples, usado só como reserva enquanto a imagem do
// emoji ✈️ carrega (ou caso ela falhe ao carregar). O "nariz" fica sempre
// em x=58, apontando para o eixo local +X — mesma convenção usada pela
// imagem do emoji depois de carregada.
function createFallbackPlaneCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  context.fillStyle = "#f2efe6";
  context.strokeStyle = "#05070d";
  context.lineWidth = 2;
  context.lineJoin = "round";
  // Desenha em metade do tamanho, centralizado, pra ter a mesma margem ao
  // redor que o glifo do trem tem (ver createRouteIcon para "trem").
  context.save();
  context.translate(32, 32);
  context.scale(0.5, 0.5);
  context.translate(-32, -32);
  context.beginPath();
  context.moveTo(58, 32);
  context.lineTo(14, 8);
  context.lineTo(34, 28);
  context.lineTo(10, 20);
  context.lineTo(18, 32);
  context.lineTo(10, 44);
  context.lineTo(34, 36);
  context.lineTo(14, 56);
  context.closePath();
  context.fill();
  context.stroke();
  context.restore();
  return canvas;
}

function createRouteIcon(type) {
  if (type === "trem") {
    const symbol = String.fromCodePoint(0x1f686);
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    context.font = '600 22px "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#ffffff";
    context.strokeStyle = "#05070d";
    context.lineWidth = 2;
    context.lineJoin = "round";
    context.strokeText(symbol, 32, 32);
    context.fillText(symbol, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const icon = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: true })
    );
    icon.scale.setScalar(0.08);
    icon.visible = false;
    return icon;
  }

  if (type === "voo") {
    // O ícone é a imagem do emoji ✈️ de verdade (Twemoji), não o glifo de
    // fonte do sistema. Antes usávamos o glifo desenhado pela fonte
    // "Segoe UI Symbol" — só que fontes de emoji diferentes (Windows vs.
    // as fontes nativas de iOS/Android) desenham a "frente" do avião em
    // ângulos diferentes, o que fazia a rotação calculada em
    // positionFlightIcon() ficar correta só no desktop e errada no
    // celular. Usando sempre a MESMA imagem (baixada de um CDN, não a
    // fonte do aparelho), o desenho — e portanto o ângulo do "nariz" — é
    // sempre idêntico em qualquer dispositivo.
    const icon = new THREE.Mesh(
      new THREE.PlaneGeometry(0.08, 0.08),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(createFallbackPlaneCanvas()),
        transparent: true,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: false,
      })
    );
    icon.visible = false;

    const emojiImage = new Image();
    emojiImage.crossOrigin = "anonymous";
    emojiImage.onload = () => {
      // Desenha o emoji num canvas com a MESMA margem ao redor que o glifo
      // do trem tem (ver createRouteIcon para "trem"), porque a imagem do
      // Twemoji preenche quase todo o quadro sozinha — sem essa margem o
      // avião parece bem maior que o trem mesmo com a mesma malha 3D.
      const paddedCanvas = document.createElement("canvas");
      paddedCanvas.width = 64;
      paddedCanvas.height = 64;
      const paddedContext = paddedCanvas.getContext("2d");
      const glyphSize = 26;
      paddedContext.drawImage(
        emojiImage,
        (64 - glyphSize) / 2,
        (64 - glyphSize) / 2,
        glyphSize,
        glyphSize
      );

      const emojiTexture = new THREE.CanvasTexture(paddedCanvas);
      emojiTexture.colorSpace = THREE.SRGBColorSpace;
      icon.material.map = emojiTexture;
      icon.material.needsUpdate = true;
    };
    // Se a imagem não carregar por algum motivo (ex.: sem internet), o
    // desenho vetorial de reserva definido acima continua no lugar.
    emojiImage.src =
      "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2708.png";

    return icon;
  }


  return null;
}

// O emoji ✈️ do Twemoji é desenhado apontando na diagonal (não
// perfeitamente para a direita), então aplicamos essa correção de ângulo
// por cima da rotação principal. Se o avião parecer girado um pouco a
// mais ou a menos que o esperado, ajuste esse valor (em graus).
const VOO_ICON_ANGLE_OFFSET = THREE.MathUtils.degToRad(-38);

function positionFlightIcon(icon, curve, progress) {
  icon.position.copy(curve.getPointAt(progress));
  // O eixo X do desenho do avião aponta para a frente. Alinhamos esse eixo
  // com a tangente da curva para que ele siga o sentido origem → destino.
  const direction = curve.getTangentAt(progress).normalize();
  const normal = icon.position.clone().normalize();
  const fixedUp = new THREE.Vector3().crossVectors(normal, direction).normalize();
  icon.quaternion.setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(direction, fixedUp, normal)
  );
  icon.rotateOnAxis(new THREE.Vector3(0, 0, 1), VOO_ICON_ANGLE_OFFSET);
}

function getRouteProgress(route, duration, elapsed) {
  // Sem "% 1": queremos que a animação toque uma vez só e pare, não fique
  // repetindo em loop depois que o ícone chega no destino.
  const startedAt = route.animationStartedAt ?? 0;
  return (elapsed - startedAt) / duration;
}

function getRouteDuration(route) {
  const routeKey = `${route.from}:${route.to}`;
  if (ROUTE_DURATION_OVERRIDES[routeKey] !== undefined) {
    return ROUTE_DURATION_OVERRIDES[routeKey];
  }
  return route.type === "trem" ? TRAIN_DURATION_SECONDS : FLIGHT_DURATION_SECONDS;
}

function startCameraFollow(route) {
  if (!route.icon) return false;
  const now = clock.getElapsedTime();
  route.animationStartedAt = now;
  positionFlightIcon(route.icon, route.curve, 0);

  // Ao final da animação, a câmera deve terminar enquadrando a cidade de
  // DESTINO (não voltar pra onde estava antes do voo começar).
  const destinationStop = TRIP.stops.find((s) => s.id === route.to);
  const arrivalPosition = destinationStop
    ? latLonToVector3(destinationStop.lat, destinationStop.lon, GLOBE_RADIUS)
        .normalize()
        .multiplyScalar(3.8)
    : camera.position.clone();
  const arrivalTarget =
    window.innerWidth <= 720 ? globeGroup.position.clone() : controls.target.clone();

  activeCameraFollow = {
    route,
    endsAt: now + getRouteDuration(route),
    restorePosition: arrivalPosition,
    restoreTarget: arrivalTarget,
  };
  return true;
}

function buildRoutes() {
  const stopsById = Object.fromEntries(TRIP.stops.map((s) => [s.id, s]));

  TRIP.routes.forEach((route) => {
    const from = stopsById[route.from];
    const to = stopsById[route.to];
    if (!from || !to) return;

    const start = latLonToVector3(from.lat, from.lon, GLOBE_RADIUS);
    const end = latLonToVector3(to.lat, to.lon, GLOBE_RADIUS);

    const distance = start.distanceTo(end);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    mid.normalize().multiplyScalar(GLOBE_RADIUS + distance * 0.45);

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const points = curve.getPoints(64);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const style = ROUTE_STYLES[route.type] || ROUTE_STYLES.voo;
    const material = new THREE.LineBasicMaterial({
      color: route.phase === "volta" ? 0xc1432e : style.color,
      transparent: true,
      opacity: 0.85,
    });

    const line = new THREE.Line(geometry, material);
    globeGroup.add(line);

    const routeKey = `${route.from}:${route.to}`;
    const icon = ROUTES_WITHOUT_ICON.has(routeKey) ? null : createRouteIcon(route.type);
    if (icon) {
      icon.position.copy(curve.getPoint(0.5));
      if (route.type === "voo") {
        positionFlightIcon(icon, curve, 0.5);
      }
      globeGroup.add(icon);
    }

    routeObjects.push({
      line,
      icon,
      type: route.type,
      phase: route.phase,
      from: route.from,
      to: route.to,
      curve,
      animationStartedAt: null,
    });
  });
}
buildRoutes();

// ============================================================
// Legenda (filtro por tipo de trajeto)
// ============================================================

function buildLegend() {
  const legend = document.getElementById("legend");
  legend.innerHTML = "";
  const usedTypes = [...new Set(TRIP.routes.map((r) => r.type))];

  usedTypes.forEach((type) => {
    const style = ROUTE_STYLES[type] || ROUTE_STYLES.voo;
    const btn = document.createElement("button");
    const hex = "#" + style.color.toString(16).padStart(6, "0");
    btn.innerHTML = `<span class="dot" style="background:${hex}"></span>${tRouteLabel(type)}`;
    btn.dataset.type = type;

    btn.addEventListener("click", () => {
      btn.classList.toggle("off");
      const visible = !btn.classList.contains("off");
      routeObjects
        .filter((r) => r.type === type)
        .forEach((r) => {
          r.line.visible = visible;
          if (r.icon) r.icon.visible = visible;
        });
    });

    legend.appendChild(btn);
  });
}
buildLegend();

// ============================================================
// Estatísticas do roteiro
// ============================================================

function haversineKm(a, b) {
  const earthRadiusKm = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(h)));
}

function buildStats() {
  const stats = document.getElementById("stats");
  if (!stats) return;

  const stopsById = Object.fromEntries(TRIP.stops.map((stop) => [stop.id, stop]));
  const totalKm = TRIP.routes.reduce((sum, route) => {
    const from = stopsById[route.from];
    const to = stopsById[route.to];
    return from && to ? sum + haversineKm(from, to) : sum;
  }, 0);

  let countdown = "";
  if (TRIP.startDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const departure = new Date(`${TRIP.startDate}T00:00:00`);
    const days = Math.round((departure - today) / 86400000);
    const uiStrings = currentLang !== "pt" ? TRANSLATIONS[currentLang]?.ui : null;

    if (days > 1) {
      countdown = uiStrings
        ? uiStrings.countdownDays(days)
        : `faltam <strong>${days}</strong> dias`;
    } else if (days === 1) {
      countdown = uiStrings ? uiStrings.countdownOneDay : "falta <strong>1</strong> dia";
    } else if (days === 0) {
      countdown = uiStrings ? uiStrings.countdownToday : "a viagem começa <strong>hoje</strong> 🎉";
    } else {
      countdown = uiStrings ? uiStrings.countdownStarted : "a viagem já começou 🎉";
    }
  }

  const stopsLabel = currentLang === "pt" ? "paradas" : tUI("statsStops", "stops");
  const kmLabel = currentLang === "pt" ? "km" : tUI("statsKmSuffix", "km");

  stats.innerHTML = `
    <span><strong>${TRIP.stops.length}</strong> ${stopsLabel}</span>
    <span><strong>${Math.round(totalKm).toLocaleString("pt-BR")}</strong> ${kmLabel}</span>
    ${countdown ? `<span>${countdown}</span>` : ""}
  `;
}
buildStats();

// ============================================================
// Distância e tempo estimado até a próxima cidade
// ============================================================

// Velocidades médias usadas para estimar o tempo de deslocamento de cada
// tipo de trajeto. Trens são tratados como trens de alta velocidade.
const AVERAGE_SPEED_KMH = {
  voo: 800,
  trem: 300,
  metro: 40,
  onibus: 65,
};

function formatDuration(hours) {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function getNextLegInfo(stopId) {
  const route = TRIP.routes.find((r) => r.from === stopId);
  if (!route) return null;

  const stopsById = Object.fromEntries(TRIP.stops.map((s) => [s.id, s]));
  const from = stopsById[route.from];
  const to = stopsById[route.to];
  if (!from || !to) return null;

  const km = haversineKm(from, to);
  const speed = AVERAGE_SPEED_KMH[route.type] || AVERAGE_SPEED_KMH.voo;

  return {
    toName: t(to.id, "name", to.name),
    km: Math.round(km),
    duration: formatDuration(km / speed),
    typeLabel: tRouteLabel(route.type),
  };
}

// ============================================================
// Painel lateral (linha do tempo)
// ============================================================

let activeStopId = null;

function updateTimelineState() {
  const activeIndex = TRIP.stops.findIndex((stop) => stop.id === activeStopId);
  document.querySelectorAll(".stop").forEach((el, index) => {
    el.classList.toggle("active", el.dataset.id === activeStopId);
    el.classList.toggle("visited", activeIndex >= 0 && index < activeIndex);
  });
}

function buildTimeline() {
  const timeline = document.getElementById("timeline");
  timeline.innerHTML = "";
  let currentPhase = null;

  TRIP.stops.forEach((stop) => {
    let phase = currentPhase || "deslocamento";
    if (stop.id === "guangzhou") phase = "roteiro";
    if (stop.id === "guangzhou-retorno") phase = "retorno";

    if (phase !== currentPhase) {
      const section = document.createElement("div");
      section.className = `timeline-section ${phase}`;
      section.textContent = {
        deslocamento: tUI("timelineDeslocamento", "Deslocamento para China"),
        roteiro: tUI("timelineRoteiro", "Roteiro pela China"),
        retorno: tUI("timelineRetorno", "Retorno ao Brasil"),
      }[phase];
      timeline.appendChild(section);
      currentPhase = phase;
    }

    const legInfo = getNextLegInfo(stop.id);
    let routeInfoHTML = "";
    if (legInfo) {
      if (currentLang === "pt") {
        routeInfoHTML = `<div class="route-info">
           <strong>${legInfo.km.toLocaleString("pt-BR")} km</strong> até ${legInfo.toName}
           · cerca de ${legInfo.duration} de ${legInfo.typeLabel.toLowerCase()}
         </div>`;
      } else {
        const kmFormatted = legInfo.km.toLocaleString(currentLang === "zh" ? "zh-CN" : "en-US");
        routeInfoHTML = `<div class="route-info">${TRANSLATIONS[currentLang].ui.routeInfo(
          kmFormatted,
          legInfo.toName,
          legInfo.duration,
          legInfo.typeLabel.toLowerCase()
        )}</div>`;
      }
    }

    const el = document.createElement("div");
    el.className = "stop";
    el.dataset.id = stop.id;
    el.innerHTML = `
      <div class="date">${t(stop.id, "date", stop.date)}</div>
      <h3>${t(stop.id, "name", stop.name)}</h3>
      <div class="tag">${t(stop.id, "tag", stop.tag)}</div>
      <p>${t(stop.id, "description", stop.description)}</p>
      ${routeInfoHTML}
    `;
    el.addEventListener("click", () => selectStop(stop.id, true));
    timeline.appendChild(el);
  });

  updateTimelineState();
}
buildTimeline();

// ============================================================
// Seletor de idioma
// ============================================================

function applyLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang) || lang === currentLang) return;
  currentLang = lang;
  localStorage.setItem("luxing-lang", lang);

  document.getElementById("trip-title").textContent = tTrip("title", TRIP.title);
  document.getElementById("trip-subtitle").textContent = tTrip("subtitle", TRIP.subtitle);

  rotationToggle.textContent = isAutoRotating
    ? tUI("stopRotation", "Parar giro")
    : tUI("startRotation", "Iniciar giro");
  overviewToggle.textContent = tUI("overview", "Visão geral");

  const hintEl = document.getElementById("hint-text");
  if (hintEl) hintEl.textContent = tUI("hint", "arraste para girar · role para dar zoom");

  // Preserva quais tipos de rota estavam filtrados (desligados) na legenda
  // antes de reconstruí-la com os novos rótulos.
  const previouslyOffTypes = [...document.querySelectorAll(".legend button.off")].map(
    (btn) => btn.dataset.type
  );

  buildLegend();
  document.querySelectorAll(".legend button").forEach((btn) => {
    if (previouslyOffTypes.includes(btn.dataset.type)) {
      btn.classList.add("off");
      routeObjects
        .filter((r) => r.type === btn.dataset.type)
        .forEach((r) => {
          r.line.visible = false;
          if (r.icon) r.icon.visible = false;
        });
    }
  });

  buildStats();
  buildTimeline();
  rebuildMarkerLabels();

  syncUrlLang(lang);
  if (langSelect) langSelect.value = lang;
}

const langSelect = document.getElementById("lang-select");
if (langSelect) {
  langSelect.value = currentLang;
  langSelect.addEventListener("change", () => applyLanguage(langSelect.value));
}

function selectStop(id, flyTo) {
  activeStopId = id;
  activeCameraFollow = null;
  updateTimelineState();

  const selectedStop = TRIP.stops.find((stop) => stop.id === id);
  const marker = markerObjects.find((m) => m.stop.id === id);

  if (selectedStop) {
    routeObjects.forEach((route) => {
      const isOutbound = route.from === id;
      route.line.visible = isOutbound;
      route.line.material.opacity = 0.9;
      if (route.icon) {
        route.icon.visible = isOutbound;
        if (isOutbound) {
          // Reinicia a animação do zero (progresso 0 = na cidade de
          // origem) toda vez que o ícone é exibido por causa de um
          // clique. Sem isso, o progresso era calculado a partir do
          // tempo total desde que a página abriu, então às vezes o
          // ícone já aparecia no meio do caminho ou quase chegando.
          route.animationStartedAt = clock.getElapsedTime();
          if (route.type === "voo") {
            positionFlightIcon(route.icon, route.curve, 0);
          } else {
            route.icon.position.copy(route.curve.getPointAt(0));
          }
        }
      }
    });
  }

  const routeToFollow = routeObjects.find(
    (route) =>
      route.from === id &&
      CAMERA_FOLLOW_ROUTE_KEYS.has(`${route.from}:${route.to}`) &&
      route.icon
  );

  const isStartingCameraFollow =
    Boolean(selectedStop && flyTo && routeToFollow) && startCameraFollow(routeToFollow);

  if (selectedStop && flyTo && !isStartingCameraFollow) {
    const position = marker
      ? marker.group.getWorldPosition(markerWorldPosition).clone()
      : latLonToVector3(selectedStop.lat, selectedStop.lon, GLOBE_RADIUS);
    const target = position.normalize().multiplyScalar(3.8);
    const focusTarget =
      window.innerWidth <= 720 ? globeGroup.position.clone() : controls.target.clone();
    animateCamera(target, focusTarget);
    overviewToggle.hidden = false;
  }
}

let cameraAnimationId = 0;

function animateCamera(targetPos, targetLookAt = controls.target.clone()) {
  // Se já existir uma animação de câmera em andamento (ex.: o usuário
  // clicou rápido em outra cidade), ela é cancelada aqui — sem isso, as
  // duas ficavam rodando ao mesmo tempo e "brigando" pela posição da
  // câmera, deixando ela numa posição estranha e imprevisível.
  const animationId = ++cameraAnimationId;
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const startTime = performance.now();
  const duration = 900;

  function step(now) {
    if (animationId !== cameraAnimationId) return; // uma animação mais nova assumiu
    const t = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    camera.position.lerpVectors(startPos, targetPos, eased);
    controls.target.lerpVectors(startTarget, targetLookAt, eased);
    controls.update();
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ============================================================
// Interação: clicar num marcador do globo
// ============================================================

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const markerWorldPosition = new THREE.Vector3();
const floatingCard = document.getElementById("floating-card");
const fcName = document.getElementById("fc-name");
const fcDate = document.getElementById("fc-date");

function onPointerMove(event) {
  updatePointer(event);

  raycaster.setFromCamera(pointer, camera);
  const dots = markerObjects.map((m) => m.dot);
  const hits = raycaster.intersectObjects(dots);

  if (hits.length > 0) {
    const hit = markerObjects.find((m) => m.dot === hits[0].object);
    document.body.style.cursor = "pointer";
    fcName.textContent = t(hit.stop.id, "name", hit.stop.name);
    fcDate.textContent = t(hit.stop.id, "date", hit.stop.date);
    floatingCard.style.left = event.clientX + 16 + "px";
    floatingCard.style.top = event.clientY - 10 + "px";
    floatingCard.classList.add("visible");
  } else {
    document.body.style.cursor = "default";
    floatingCard.classList.remove("visible");
  }
}

function updatePointer(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onClick(event) {
  updatePointer(event);
  raycaster.setFromCamera(pointer, camera);
  const dots = markerObjects.map((m) => m.dot);
  const hits = raycaster.intersectObjects(dots);
  if (hits.length > 0) {
    const hit = markerObjects.find((m) => m.dot === hits[0].object);
    selectStop(hit.stop.id, true);
    document.querySelector(`.stop[data-id="${hit.stop.id}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
}

window.addEventListener("pointermove", onPointerMove);
window.addEventListener("click", onClick);

// ============================================================
// Loop de animação
// ============================================================

const clock = new THREE.Clock();
let previousElapsed = 0;
// Duração de uma volta completa (360°) do giro automático.
const FULL_ROTATION_SECONDS = 22;

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  const delta = elapsed - previousElapsed;
  previousElapsed = elapsed;

  if (isAutoRotating) {
    globeGroup.rotation.y -= ((2 * Math.PI) / FULL_ROTATION_SECONDS) * delta;
  }

  markerObjects.forEach((m, i) => {
    const pulse = 1 + Math.sin(elapsed * 2.4 + i) * 0.18;
    m.ring.userData.pulse = pulse;
  });

  routeObjects.forEach((route) => {
    if (!route.icon || !route.icon.visible) return;
    const progress = getRouteProgress(route, getRouteDuration(route), elapsed);
    if (progress >= 1) {
      // Chegou no destino: para por aqui, não fica viajando de novo em
      // loop. Um novo clique na cidade de origem reinicia a animação.
      route.icon.visible = false;
      return;
    }
    if (route.type === "voo") {
      positionFlightIcon(route.icon, route.curve, progress);
    }
    if (route.type === "trem") {
      route.icon.position.copy(route.curve.getPointAt(progress));
    }
  });

  if (activeCameraFollow) {
    if (elapsed >= activeCameraFollow.endsAt) {
      const { restorePosition, restoreTarget, route } = activeCameraFollow;
      activeCameraFollow = null;
      // Só atualiza qual parada fica destacada na timeline — não chama
      // selectStop() completo, porque isso deixaria visível (e animando)
      // o ícone da PRÓXIMA rota sozinho, sem o usuário ter clicado nela.
      activeStopId = route.to;
      updateTimelineState();
      animateCamera(restorePosition, restoreTarget);
    } else {
      const { icon } = activeCameraFollow.route;
      icon.getWorldPosition(routeIconWorldPosition);
      const followDistance = getFollowDistance(activeCameraFollow.route);
      const cameraTarget = routeIconWorldPosition.clone().normalize().multiplyScalar(followDistance);
      // A velocidade com que a câmera "persegue" o ícone é proporcional à
      // duração do trecho: em voos rápidos (poucos segundos), ela precisa
      // reagir mais rápido pra não ficar pra trás. 0.55/10s = 0.055, que é
      // o valor original calibrado pros trechos mais longos.
      const followDuration = getRouteDuration(activeCameraFollow.route);
      const followSpeed = THREE.MathUtils.clamp(0.55 / followDuration, 0.05, 0.35);
      camera.position.lerp(cameraTarget, followSpeed);
      controls.target.lerp(routeIconWorldPosition, Math.min(followSpeed * 1.8, 0.5));
    }
  }

  controls.update();
  updateMarkerScale();
  renderer.render(scene, camera);
}
animate();

// ============================================================
// Responsividade
// ============================================================

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Seleciona a primeira parada por padrão
if (TRIP.stops.length > 0) {
  selectStop(TRIP.stops[0].id, false);
}
