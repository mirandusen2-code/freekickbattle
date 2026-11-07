import * as THREE from 'three';
import { GOAL, keeperX } from './game.js';
import animation from '../data/animation-spec.json' with { type: 'json' };

export function createWorld(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  const gl = renderer.getContext();
  const debugRenderer = gl.getExtension('WEBGL_debug_renderer_info');
  const softwareRendering = debugRenderer && /swiftshader|llvmpipe|software/i.test(gl.getParameter(debugRenderer.UNMASKED_RENDERER_WEBGL));
  renderer.setPixelRatio(Math.min(devicePixelRatio, softwareRendering ? 1 : 1.8));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#accbd2');
  scene.fog = new THREE.Fog('#b5d0d4', 52, 115);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 180);
  const look = new THREE.Vector3(0, 1, -11);
  camera.position.set(7.8, 7.2, 13.5); camera.lookAt(look);
  scene.add(new THREE.HemisphereLight('#d5edff', '#5e7643', 2.5));
  const sun = new THREE.DirectionalLight('#fff1d4', 3.4);
  sun.position.set(-15, 28, 8); sun.castShadow = true;
  const shadowResolution = softwareRendering ? 512 : 1024;
  sun.shadow.mapSize.set(shadowResolution, shadowResolution);
  Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 25, bottom: -32, near: 1, far: 90 });
  sun.shadow.bias = -0.001;
  sun.shadow.normalBias = 0.035; scene.add(sun);
  const mats = new Map();
  const mat = (color, roughness = 0.85) => {
    if (!mats.has(color)) mats.set(color, new THREE.MeshStandardMaterial({ color, roughness }));
    return mats.get(color);
  };
  function box(w, h, d, color, x, y, z, parent = scene) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  function sphere(r, color, x, y, z, parent = scene) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat(color));
    m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m;
  }
  function line(points, color = '#eff6d9', opacity = 0.8, parent = scene) {
    const geo = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p)));
    const m = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity })); parent.add(m); return m;
  }
  // A procedural pitch and original geometry keep this build independent of external assets.
  box(85, 0.2, 100, '#5f8b54', 0, -0.15, -20).castShadow = false;
  for (let i = 0; i < 14; i++) box(48, 0.025, 4, i % 2 ? '#6d9b55' : '#739f59', 0, -0.025, 9 - i * 4).castShadow = false;
  const ground = 0.025;
  const rect = (x1, z1, x2, z2) => line([[x1, ground, z1], [x2, ground, z1], [x2, ground, z2], [x1, ground, z2], [x1, ground, z1]]);
  rect(-23, -39, 23, 10); rect(-13.4, -20, 13.4, -3.5); rect(-6.7, -20, 6.7, -14.5);
  line([[-23, ground, -20], [23, ground, -20]]);
  const arc = [];
  for (let i = 0; i <= 70; i++) { const a = i / 70 * Math.PI; arc.push([Math.cos(a) * 6, ground, -3.5 + Math.sin(a) * 3]); }
  line(arc); sphere(0.085, '#f4f4de', 0, 0.02, -8.5).scale.y = 0.2;
  // Low terrace, crowd, pavilion and floodlights.
  for (let row = 0; row < 5; row++) box(76, 1.1, 2.3, row % 2 ? '#b9b7a0' : '#c7c5b0', 0, row * 0.9 + 0.5, -32 - row * 2.2);
  box(80, 1, 0.3, '#193c42', 0, 5.2, -42);
  box(20, 7, 6, '#d9d3b9', 0, 3.5, -45);
  box(22, 0.4, 7, '#344c50', 0, 7.2, -45);
  for (let i = -4; i <= 4; i++) box(1.5, 2.2, 0.1, '#496773', i * 2.1, 4.8, -41.94);
  const crowdGeo = new THREE.BoxGeometry(0.35, 0.6, 0.3);
  const crowd = new THREE.InstancedMesh(crowdGeo, new THREE.MeshStandardMaterial({ roughness: 1 }), 580);
  const dummy = new THREE.Object3D(); const colors = ['#203c54', '#d5b89b', '#eee2c3', '#e29c6d', '#6b8d87', '#bd6650'];
  for (let i = 0; i < 580; i++) {
    const row = i % 5; const col = Math.floor(i / 5);
    dummy.position.set(-35 + col * 0.61, row * 0.9 + 1.35, -32 - row * 2.2);
    dummy.scale.y = 0.8 + (i * 17 % 10) / 20; dummy.updateMatrix(); crowd.setMatrixAt(i, dummy.matrix);
    crowd.setColorAt(i, new THREE.Color(colors[i * 7 % colors.length]));
  }
  scene.add(crowd);
  for (const x of [-29, 29]) for (const z of [-30, 5]) {
    box(0.22, 19, 0.22, '#859899', x, 9.5, z);
    box(4, 1.5, 0.5, '#e2e4d5', x, 19, z);
    for (let i = -1; i <= 1; i++) box(0.7, 0.8, 0.15, '#fff9df', x + i, 19, z + 0.3);
  }
  for (const x of [-28, 28]) {
    box(0.4, 1, 60, '#204c4d', x, 0.5, -14);
    for (let i = 0; i < 7; i++) {
      const tree = new THREE.Group(); scene.add(tree); tree.position.set(x * 1.2, 0, -10 - i * 7);
      box(0.45, 4, 0.45, '#78654a', 0, 2, 0, tree);
      sphere(2.8, i % 2 ? '#668b74' : '#4a7c69', 0, 5, 0, tree).scale.y = 1.5;
    }
  }
  // Goal posts and net, with their true goal-plane dimensions shared with physics.
  for (const x of [-GOAL.half, GOAL.half]) box(0.12, GOAL.height, 0.12, '#fffbe9', x, GOAL.height / 2, GOAL.z);
  box(GOAL.half * 2 + 0.12, 0.12, 0.12, '#fffbe9', 0, GOAL.height, GOAL.z);
  const net = new THREE.Group(); scene.add(net);
  const nz = GOAL.z - 1.8;
  for (let x = -GOAL.half; x <= GOAL.half; x += 0.23) {
    line([[x, 0, nz], [x, GOAL.height, nz], [x, GOAL.height, GOAL.z]], '#f1efdf', 0.45, net);
  }
  for (let y = 0; y <= GOAL.height; y += 0.23) line([[-GOAL.half, y, GOAL.z], [-GOAL.half, y, nz], [GOAL.half, y, nz], [GOAL.half, y, GOAL.z]], '#f1efdf', 0.45, net);
  // Pitch-side typography is generated locally.
  const bannerCanvas = document.createElement('canvas'); bannerCanvas.width = 1536; bannerCanvas.height = 128;
  const bc = bannerCanvas.getContext('2d'); bc.fillStyle = '#173f45'; bc.fillRect(0, 0, 1536, 128);
  bc.fillStyle = '#e0ecc5'; bc.font = 'bold 48px sans-serif'; bc.textAlign = 'center'; bc.fillText('FREEKICK BATTLE     •     MAKE IT COUNT', 768, 82);
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(45, 2.1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(bannerCanvas) }));
  banner.position.set(0, 1.05, -28); scene.add(banner);

  function player(color, keeper = false) {
    const root = new THREE.Group(); scene.add(root);
    const shirtMat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    const shirt = box(0.75, 0.82, 0.4, color, 0, 1.15, 0, root); shirt.material = shirtMat;
    box(0.73, 0.32, 0.4, '#203544', 0, 0.67, 0, root);
    sphere(0.32, '#d5a17d', 0, 1.94, 0, root);
    const hair = sphere(0.33, '#352e2b', 0, 2.07, -0.045, root); hair.scale.y = 0.68;
    box(0.065, 0.055, 0.03, '#282d2d', -0.105, 1.97, 0.3, root);
    box(0.065, 0.055, 0.03, '#282d2d', 0.105, 1.97, 0.3, root);
    const legs = [], arms = [];
    for (const side of [-1, 1]) {
      const leg = new THREE.Group(); leg.position.set(side * 0.22, 0.65, 0); root.add(leg); legs.push(leg);
      box(0.22, 0.55, 0.23, '#d5a17d', 0, -0.28, 0, leg);
      box(0.23, 0.24, 0.25, '#e4e8d5', 0, -0.46, 0, leg);
      box(0.26, 0.18, 0.42, keeper ? '#f2b451' : '#f1bf55', 0, -0.6, 0.1, leg);
      const arm = new THREE.Group(); arm.position.set(side * 0.47, 1.48, 0); arm.rotation.z = side * 0.13; root.add(arm); arms.push(arm);
      box(0.23, 0.5, 0.24, '#d5a17d', 0, -0.2, 0, arm);
      if (keeper) sphere(0.16, '#f7e9bd', 0, -0.5, 0, arm);
    }
    const accessories = new THREE.Group(); root.add(accessories);
    return { root, shirtMat, legs, arms, accessories };
  }
  const kicker = player('#238be5'); kicker.root.position.set(-0.65, 0, 3.3); kicker.root.rotation.y = Math.PI;
  const keeper = player('#edb54d', true); keeper.root.position.set(0, 0, -19.65);
  const defenders = [-0.8, 0, 0.8].map(x => { const p = player('#d5d9cd'); p.root.position.set(x, 0, -9); p.root.visible = false; return p; });
  const ballGeo = new THREE.SphereGeometry(GOAL.radius, 32, 24);
  const ballMaterial = new THREE.MeshStandardMaterial({ color: '#fffaf0', roughness: 0.65 });
  const ball = new THREE.Group(); scene.add(ball);
  const shell = new THREE.Mesh(ballGeo, ballMaterial); ball.add(shell); shell.castShadow = true;
  // Black pentagons on the twelve vertices of an icosahedron.
  const ico = new THREE.IcosahedronGeometry(1, 0).getAttribute('position'); const seen = new Set();
  for (let i = 0; i < ico.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(ico, i).normalize(); const key = v.toArray().map(n => n.toFixed(2)).join();
    if (seen.has(key)) continue; seen.add(key);
    const patch = new THREE.Mesh(new THREE.CircleGeometry(0.052, 5), mat('#243740'));
    patch.position.copy(v.multiplyScalar(0.148)); patch.lookAt(patch.position.clone().multiplyScalar(2)); ball.add(patch);
  }
  ball.position.set(0, 0.15, 1);
  const marker = new THREE.Group(); scene.add(marker); marker.position.set(2.8, 1.7, -19.85);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.025, 8, 48), new THREE.MeshBasicMaterial({ color: '#ecf7ad', transparent: true, opacity: 0.95 })); marker.add(ring);
  const inner = new THREE.Mesh(new THREE.CircleGeometry(0.04, 16), new THREE.MeshBasicMaterial({ color: '#ecf7ad' })); marker.add(inner);
  line([[-0.48, 0, 0], [-0.38, 0, 0]], '#ecf7ad', 1, marker);
  line([[0.38, 0, 0], [0.48, 0, 0]], '#ecf7ad', 1, marker);
  const trailGeo = new THREE.BufferGeometry(); const trailData = new Float32Array(90 * 3);
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailData, 3));
  const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: '#f1e7b8', transparent: true, opacity: 0.5 })); scene.add(trail);
  let trailPoints = [], currentKit = 'classic';
  const ray = new THREE.Raycaster(); const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 20);
  function pick(clientX, clientY) {
    const r = canvas.getBoundingClientRect(); const v = new THREE.Vector2((clientX - r.left) / r.width * 2 - 1, -(clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(v, camera); const p = ray.ray.intersectPlane(plane, new THREE.Vector3());
    return p ? { x: THREE.MathUtils.clamp(p.x, -4.5, 4.5), y: THREE.MathUtils.clamp(p.y, 0.3, 3.2) } : null;
  }
  function appearance(kit, color, ballColor) {
    renderer.shadowMap.needsUpdate = true;
    kicker.shirtMat.color.set(color); ballMaterial.color.set(ballColor);
    if (kit === currentKit) return; currentKit = kit;
    for (const child of [...kicker.accessories.children]) { kicker.accessories.remove(child); child.geometry?.dispose(); }
    if (kit === 'pirate') {
      box(0.95, 0.25, 0.42, '#27323b', 0, 2.28, 0, kicker.accessories);
      box(0.5, 0.28, 0.38, '#27323b', 0, 2.4, 0, kicker.accessories);
    }
    if (kit === 'samurai') {
      for (const side of [-1, 1]) box(0.4, 0.25, 0.6, '#a88948', side * 0.48, 1.52, 0, kicker.accessories);
      box(0.68, 0.2, 0.55, '#343e50', 0, 2.25, 0, kicker.accessories);
    }
    if (kit === 'bunny') for (const side of [-1, 1]) {
      const ear = sphere(0.12, '#dec9ed', side * 0.17, 2.52, 0, kicker.accessories); ear.scale.y = 3;
    }
  }
  function reset() {
    renderer.shadowMap.needsUpdate = true;
    net.scale.z = 1;
    ball.position.set(0, 0.15, 1); ball.rotation.set(0, 0, 0); trailPoints = []; trail.visible = false;
    kicker.root.position.set(-0.65, 0, 3.3); keeper.root.position.set(0, 0, -19.65); keeper.root.rotation.z = 0;
    [...kicker.legs, ...kicker.arms].forEach(p => { p.rotation.x = 0; });
  }
  function update({ time, shot, phase, phaseTime, aim, mode, reducedMotion = false }) {
    if (phase === 'runup' || phase === 'flight' || phase === 'replay') renderer.shadowMap.needsUpdate = true;
    defenders.forEach(d => { d.root.visible = mode === 'match'; });
    marker.position.set(aim.x, aim.y, -19.85); marker.visible = phase === 'ready';
    ring.rotation.z = reducedMotion ? 0 : time * 0.2;
    if (phase === 'runup') {
      const t = Math.min(1, phaseTime / animation.runupSeconds);
      kicker.root.position.z = 3.3 - t * 1.9;
      kicker.root.position.x = -0.65 + t * 0.4;
      kicker.legs[0].rotation.x = Math.sin(t * Math.PI * 3) * 0.7;
      kicker.legs[1].rotation.x = -Math.sin(t * Math.PI * 3) * 0.7;
      kicker.arms[0].rotation.x = Math.sin(t * Math.PI * 3) * 0.35;
      kicker.arms[1].rotation.x = -Math.sin(t * Math.PI * 3) * 0.35;
    }
    if (shot) {
      kicker.root.position.set(-0.25, 0, 1.4);
      ball.position.set(shot.x, shot.y, shot.z); ball.rotation.x = -shot.time * 17; ball.rotation.y = shot.time * shot.curve * 7;
      const kx = keeperX(shot.time, shot.x); keeper.root.position.x = kx;
      keeper.root.rotation.z = -Math.sign(kx) * Math.min(0.85, Math.abs(kx) * 0.35);
      keeper.root.position.y = Math.sin(Math.min(1, Math.abs(kx) / 2.7) * Math.PI) * 0.55;
      keeper.arms[0].rotation.z = Math.abs(kx) * 0.22; keeper.arms[1].rotation.z = -Math.abs(kx) * 0.22;
      kicker.legs[1].rotation.x = -Math.exp(-shot.time * 5) * 1.4;
      if (phase === 'flight') {
        trailPoints.push(ball.position.clone()); if (trailPoints.length > 90) trailPoints.shift();
        trailPoints.forEach((p, i) => p.toArray(trailData, i * 3)); trailGeo.setDrawRange(0, trailPoints.length); trailGeo.attributes.position.needsUpdate = true;
        trail.visible = !reducedMotion;
      }
      if (shot.result === 'goal') net.scale.z = 1 + Math.sin(phaseTime * 18) * Math.exp(-phaseTime * 3) * 0.006;
    } else { keeper.root.position.y = 0; keeper.arms[0].rotation.z = 0.25; keeper.arms[1].rotation.z = -0.25; }
  }
  function resize() {
    renderer.shadowMap.needsUpdate = true;
    const r = canvas.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height;
    if (camera.aspect < 0.85) { camera.position.set(9, 10, 23); camera.fov = 48; }
    else { camera.position.set(7.8, 7.2, 13.5); camera.fov = 45; }
    camera.lookAt(look); camera.updateProjectionMatrix();
  }
  resize(); new ResizeObserver(resize).observe(canvas);
  return { update, reset, pick, appearance, render: () => renderer.render(scene, camera), renderer };
}
