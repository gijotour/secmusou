/* 보안무쌍 3D 복셀 렌더러 (Three.js r128)
   - 게임 로직(game.js)은 2D 평면(x, y) + 높이(z). 여기서는 그 상태를 복셀(블록) 스타일 3D로 그린다.
   - 좌표: world x → X, world y → Z, 높이 → Y.  2D 각도 a 의 방향 = (cos a, 0, sin a)
   - 시점: 'fps'(1인칭, 기본) / 'tps'(3인칭). THREE 로드 실패 시 아무것도 안 하고 2D가 그대로 동작. */
'use strict';
(function () {
  if (!window.THREE) { console.warn('[3D] THREE 미로딩 → 2D 모드'); return; }
  const T = window.THREE;
  const glCanvas = document.getElementById('gl');
  let renderer;
  const MOBILE = !!window.SECMUSOU_MOBILE; // 휴대폰: 안티앨리어싱 끄고 해상도 1배
  try { renderer = new T.WebGLRenderer({ canvas: glCanvas, antialias: !MOBILE, powerPreference: 'high-performance' }); }
  catch (e) { console.warn('[3D] WebGL 초기화 실패 → 2D 모드', e); return; }
  renderer.setPixelRatio(MOBILE ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(78, 1, 2, 9000);
  scene.add(camera);
  function resize3d() { renderer.setSize(window.innerWidth, window.innerHeight, false); camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); }
  window.addEventListener('resize', resize3d); resize3d();

  // ── 픽셀 텍스처 유틸 (NearestFilter = 또렷한 도트) ──
  function pixTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); draw(g, w, h);
    const t = new T.CanvasTexture(c); t.magFilter = T.NearestFilter; t.minFilter = T.NearestMipmapNearestFilter;
    return t;
  }
  const shade = (g, x, y, cols) => { g.fillStyle = cols[(Math.random() * cols.length) | 0]; g.fillRect(x, y, 1, 1); };

  // 하늘: 부드러운 그라데이션(배경) + 실제 3D 점 별 (배경 텍스처에 별을 찍으면 늘어나 보임)
  {
    const c = document.createElement('canvas'); c.width = 2; c.height = 256;
    const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#03050d'); gr.addColorStop(0.5, '#0b1024'); gr.addColorStop(1, '#161a33');
    g.fillStyle = gr; g.fillRect(0, 0, 2, 256);
    scene.background = new T.CanvasTexture(c);
  }
  const STAR = 420, starPos = new Float32Array(STAR * 3);
  for (let i = 0; i < STAR; i++) {
    const a = Math.random() * Math.PI * 2, el = 0.12 + Math.random() * 1.3, R = 4200;
    starPos[i * 3] = Math.cos(a) * Math.cos(el) * R; starPos[i * 3 + 1] = Math.sin(el) * R; starPos[i * 3 + 2] = Math.sin(a) * Math.cos(el) * R;
  }
  const starGeo = new T.BufferGeometry(); starGeo.setAttribute('position', new T.BufferAttribute(starPos, 3));
  const stars = new T.Points(starGeo, new T.PointsMaterial({ color: '#cfe8ff', size: 2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.8 }));
  stars.frustumCulled = false; scene.add(stars);
  scene.fog = new T.Fog('#161a33', 600, 2000);

  // 조명
  scene.add(new T.HemisphereLight('#cfe6ff', '#24203a', 0.7));
  const sun = new T.DirectionalLight('#fff1dc', 0.6); sun.position.set(600, 1400, 300); scene.add(sun);
  const pLight = new T.PointLight('#7fdcff', 0.7, 520, 2); scene.add(pLight);
  const gLight = new T.PointLight('#ffd740', 0, 650, 2); scene.add(gLight);

  // ── 바닥: 16px 회로 블록 타일 (64 유닛 = 블록 1칸) ──
  const TILE = 64;
  const groundTex = pixTex(16, 16, (g) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) shade(g, x, y, ['#111a2e', '#131d33', '#0f1729', '#152038']);
    g.fillStyle = '#0a1020'; g.fillRect(0, 15, 16, 1); g.fillRect(15, 0, 1, 16);
    g.fillStyle = '#1d3463'; g.fillRect(3, 4, 7, 1); g.fillRect(9, 4, 1, 6); g.fillRect(9, 10, 4, 1);
    g.fillStyle = '#2b5cb8'; g.fillRect(2, 3, 2, 2); g.fillRect(12, 9, 2, 2);
  });
  groundTex.wrapS = groundTex.wrapT = T.RepeatWrapping;
  const GW = WORLD.w + 3200, GH = WORLD.h + 3200;
  groundTex.repeat.set(GW / TILE, GH / TILE);
  const ground = new T.Mesh(new T.PlaneGeometry(GW, GH), new T.MeshLambertMaterial({ map: groundTex }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(WORLD.w / 2, 0, WORLD.h / 2); scene.add(ground);
  const outMat = new T.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.55, depthWrite: false });
  [[WORLD.w / 2, -800, GW, 1600], [WORLD.w / 2, WORLD.h + 800, GW, 1600], [-800, WORLD.h / 2, 1600, WORLD.h], [WORLD.w + 800, WORLD.h / 2, 1600, WORLD.h]].forEach(([x, z, w, h]) => {
    const m = new T.Mesh(new T.PlaneGeometry(w, h), outMat); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.5, z); scene.add(m);
  });

  // ── 복셀 모델 빌더: 보이는 면만 합쳐 하나의 지오메트리로 ──
  const FACES = [
    { n: [1, 0, 0], v: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], k: 0.82 },
    { n: [-1, 0, 0], v: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]], k: 0.82 },
    { n: [0, 1, 0], v: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], k: 1.0 },
    { n: [0, -1, 0], v: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], k: 0.55 },
    { n: [0, 0, 1], v: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]], k: 0.92 },
    { n: [0, 0, -1], v: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]], k: 0.72 },
  ];
  function voxBuild(fn) {
    const map = new Map();
    const put = (x, y, z, c, glow) => map.set(`${x},${y},${z}`, { x, y, z, c: new T.Color(c), glow: !!glow });
    const box = (x0, x1, y0, y1, z0, z1, c, glow) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) put(x, y, z, c, glow); };
    const del = (x, y, z) => map.delete(`${x},${y},${z}`);
    fn({ put, box, del });
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, minZ = 1e9, maxZ = -1e9;
    for (const v of map.values()) { minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x); minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y); minZ = Math.min(minZ, v.z); maxZ = Math.max(maxZ, v.z); }
    const cx = (minX + maxX + 1) / 2, cz = (minZ + maxZ + 1) / 2;
    const mk = (glowPass) => {
      const pos = [], nor = [], col = [], idx = [];
      for (const v of map.values()) {
        if (v.glow !== glowPass) continue;
        for (const f of FACES) {
          const nb = map.get(`${v.x + f.n[0]},${v.y + f.n[1]},${v.z + f.n[2]}`);
          if (nb && nb.glow === v.glow) continue; // 같은 재질끼리 맞닿은 면은 생략
          const base = pos.length / 3;
          for (const p of f.v) { pos.push(v.x + p[0] - cx, v.y + p[1] - minY, v.z + p[2] - cz); nor.push(...f.n); const k = glowPass ? 1 : f.k; col.push(v.c.r * k, v.c.g * k, v.c.b * k); }
          idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
        }
      }
      if (!pos.length) return null;
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
      g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      g.setIndex(idx);
      return g;
    };
    return { lit: mk(false), glow: mk(true), h: maxY - minY + 1, w: Math.max(maxX - minX + 1, maxZ - minZ + 1) };
  }

  // ── 적 복셀 디자인 (정면 = +z) ──
  const MODELS = {
    bug: voxBuild(({ box, put }) => {
      box(-2, 2, 1, 2, -3, 2, '#5fb320'); box(-1, 1, 3, 3, -2, 1, '#8BEA3B'); box(0, 0, 3, 3, -3, 2, '#3d7a12');
      box(-1, 1, 1, 2, 3, 4, '#24470a'); put(-1, 2, 5, '#ff2d2d', 1); put(1, 2, 5, '#ff2d2d', 1);
      for (const z of [-2, 0, 2]) { put(-3, 1, z, '#2f5a0e'); put(-3, 0, z, '#2f5a0e'); put(3, 1, z, '#2f5a0e'); put(3, 0, z, '#2f5a0e'); }
      put(-1, 3, 5, '#2f5a0e'); put(1, 3, 5, '#2f5a0e'); put(-2, 4, 6, '#2f5a0e'); put(2, 4, 6, '#2f5a0e');
    }),
    worm: voxBuild(({ box, put }) => {
      box(-2, 2, 0, 3, -2, 2, '#FF9F1C'); box(-2, 2, 4, 4, -1, 1, '#ffb74d');
      box(-1, 1, 1, 1, 3, 3, '#4a1500', 1); put(-1, 2, 3, '#ffffff', 1); put(1, 2, 3, '#ffffff', 1);
      put(-2, 3, 3, '#111111'); put(2, 3, 3, '#111111');
    }),
    virus: voxBuild(({ put }) => {
      for (let x = -2; x <= 2; x++) for (let y = -2; y <= 2; y++) for (let z = -2; z <= 2; z++) if (x * x + y * y + z * z <= 5) put(x, y + 5, z, (x + y + z) % 2 ? '#FF3B6B' : '#d81b60');
      for (const [a, b, c] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) { put(a * 3, b * 3 + 5, c * 3, '#ff80ab'); put(a * 4, b * 4 + 5, c * 4, '#ffd6e4', 1); }
      for (const [a, b, c] of [[1, 1, 1], [-1, 1, 1], [1, -1, 1], [-1, -1, 1], [1, 1, -1], [-1, 1, -1], [1, -1, -1], [-1, -1, -1]]) put(a * 2, b * 2 + 5, c * 2, '#ffd6e4', 1);
      put(-1, 6, 2, '#ffffff', 1); put(1, 6, 2, '#ffffff', 1);
    }),
    trojan: voxBuild(({ box, put }) => { // 트로이 목마 = 진짜 나무 목마
      box(-2, 2, 4, 7, -5, 4, '#a0682a'); box(-2, 2, 4, 4, -5, 4, '#7a4a1a');
      for (const x of [-2, 2]) for (const z of [-4, 3]) box(x, x, 1, 3, z, z, '#7a4a1a');
      for (const x of [-3, 3]) { box(x, x, 0, 1, -5, -3, '#37474f'); box(x, x, 0, 1, 2, 4, '#37474f'); }
      box(-1, 1, 8, 10, 3, 5, '#a0682a'); box(-1, 1, 9, 11, 5, 8, '#b07a35');
      put(-2, 10, 7, '#ff1a1a', 1); put(2, 10, 7, '#ff1a1a', 1);
      box(0, 0, 9, 12, 2, 5, '#4e2c0e'); box(0, 0, 5, 7, -6, -6, '#4e2c0e');
      box(-3, -3, 5, 6, -2, 1, '#d9a93a', 1); // .exe 명패
    }),
    botnet: voxBuild(({ box, put, del }) => {
      box(-1, 1, 0, 1, -1, 0, '#263238'); box(-3, 3, 2, 2, -1, 1, '#263238');
      box(-4, 4, 3, 9, -1, 0, '#37474f'); box(-3, 3, 4, 8, 1, 1, '#4DD0E1', 1);
      for (const [x, y] of [[-2, 7], [-1, 6], [-2, 6], [-1, 7], [1, 7], [2, 6], [1, 6], [2, 7], [-1, 5], [0, 5], [1, 5]]) { del(x, y, 1); put(x, y, 1, '#0b3940'); }
      put(2, 10, 0, '#90a4ae'); put(2, 11, 0, '#90a4ae'); put(2, 12, 0, '#ff3030', 1);
    }),
    rootkit: voxBuild(({ box, put, del }) => {
      for (let y = 0; y <= 5; y++) box(-3, 3, y, y, -3, 3, y > 3 ? '#4a5262' : '#3d4450');
      for (let x = -3; x <= 3; x += 2) for (let z = -3; z <= 3; z += 2) del(x, 0, z);
      box(-2, 2, 6, 7, -2, 2, '#5b6475'); box(-1, 1, 8, 8, -1, 1, '#6f7885');
      box(-2, 2, 4, 6, 3, 3, '#0a0b0f'); put(-1, 5, 3, '#39ff14', 1); put(1, 5, 3, '#39ff14', 1);
      put(0, 2, 4, '#39ff14', 1);
    }),
    ransom: voxBuild(({ box, put }) => {
      box(-3, 3, 0, 4, -2, 2, '#7c4dff'); box(-3, 3, 4, 4, -2, 2, '#9575ff');
      box(-2, -2, 5, 7, 0, 0, '#cfd8dc'); box(2, 2, 5, 7, 0, 0, '#cfd8dc'); box(-2, 2, 8, 8, 0, 0, '#eceff1');
      put(0, 2, 3, '#ffd400', 1); put(0, 1, 3, '#ffd400', 1); put(-2, 3, 3, '#ff2050', 1); put(2, 3, 3, '#ff2050', 1);
    }),
    keeper: voxBuild(({ box, put }) => {
      box(-2, -1, 0, 2, -1, 1, '#5a0a12'); box(1, 2, 0, 2, -1, 1, '#5a0a12');
      box(-3, 3, 3, 7, -2, 2, '#8a0010'); box(-5, -4, 3, 6, -1, 1, '#6a0b16'); box(4, 5, 3, 6, -1, 1, '#6a0b16');
      box(-2, 2, 8, 10, -2, 2, '#5a0a12'); box(-1, 1, 4, 6, 3, 3, '#ff5252', 1);
      put(-1, 9, 3, '#fff200', 1); put(1, 9, 3, '#fff200', 1);
    }),
    officer: voxBuild(({ box, put }) => {
      box(-3, -1, 0, 3, -1, 1, '#1a0006'); box(1, 3, 0, 3, -1, 1, '#1a0006');
      box(-4, 4, 4, 9, -3, 2, '#c4001d'); box(-4, 4, 4, 4, -3, 2, '#1a0006');
      box(-7, -5, 5, 9, -1, 1, '#9a0016'); box(5, 7, 5, 9, -1, 1, '#9a0016');
      put(-6, 10, 0, '#ffcc00', 1); put(6, 10, 0, '#ffcc00', 1); put(-6, 11, 0, '#ffcc00', 1); put(6, 11, 0, '#ffcc00', 1);
      box(-3, 3, 10, 13, -3, 2, '#1a0006'); box(-2, 2, 11, 11, 3, 3, '#00f0ff', 1);
      for (const [x, z] of [[-3, -3], [3, -3], [-3, 2], [3, 2], [0, -3], [0, 2]]) { put(x, 14, z, '#ffcc00', 1); put(x, 15, z, '#ffe57f', 1); }
      box(-1, 1, 6, 8, 3, 3, '#ffcc00', 1);
    }),
    office: voxBuild(({ box, put }) => {
      box(-1, -1, 0, 2, 0, 0, '#5d4037'); box(1, 1, 0, 2, 0, 0, '#5d4037');
      box(-3, 3, 3, 11, -1, 1, '#fff8e1'); box(-3, 3, 11, 11, -1, 1, '#ffca28');
      for (let y = 4; y <= 9; y += 2) box(-2, 2, y, y, 2, 2, '#bdbdbd');
      put(-2, 9, 2, '#c62828', 1); put(-1, 8, 2, '#c62828', 1); put(2, 9, 2, '#c62828', 1); put(1, 8, 2, '#c62828', 1);
      box(1, 3, 3, 5, 2, 2, '#e53935', 1);
      box(-5, -4, 6, 7, 0, 0, '#fff8e1'); box(4, 5, 6, 7, 0, 0, '#fff8e1');
    }),
    boss: voxBuild(({ box, put }) => {
      for (let x = -6; x <= 6; x++) for (let y = 0; y <= 12; y++) for (let z = -6; z <= 6; z++) {
        if (Math.abs(x) < 6 && y > 0 && y < 12 && Math.abs(z) < 6) continue; // 속은 비움
        put(x, y, z, (x + y + z) % 3 === 0 ? '#3a0010' : (x * y + z) % 4 === 0 ? '#ff1744' : '#a0002c');
      }
      box(-4, 4, 2, 10, 7, 7, '#ffffff', 1);
      box(-2, 2, 4, 8, 8, 8, '#ff1744', 1); box(-1, 1, 5, 7, 9, 9, '#110000');
      for (const x of [-5, 5]) box(x, x, 13, 15, -1, 1, '#ff6d00', 1);
    }),
  };

  // 인스턴스 메시 생성
  const litMat = new T.MeshLambertMaterial({ vertexColors: true });
  const glowMat = new T.MeshBasicMaterial({ vertexColors: true });
  const flashMat = new T.MeshBasicMaterial({ color: '#ffffff' });
  const ghostMat = new T.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.9 });
  const tmpC = new T.Color();
  function inst(geo, mat, cap) {
    const m = new T.InstancedMesh(geo, mat, cap);
    m.instanceMatrix.setUsage(T.DynamicDrawUsage);
    for (let i = 0; i < cap; i++) m.setColorAt(i, tmpC.set('#ffffff'));
    m.count = 0; m.frustumCulled = false; scene.add(m);
    return m;
  }
  const EM = {};
  for (const [type, md] of Object.entries(MODELS)) {
    const cap = type === 'boss' ? 2 : type === 'keeper' || type === 'officer' ? 48 : 520;
    EM[type] = {
      md,
      lit: md.lit && inst(md.lit, type === 'rootkit' ? ghostMat : litMat, cap),
      glow: md.glow && inst(md.glow, glowMat, cap),
      flash: md.lit && inst(md.lit, flashMat, Math.min(cap, 200)),
      n: 0, fn: 0, cap,
    };
  }
  // 웜 몸통 / 공용 큐브
  const cubeGeo = new T.BoxGeometry(1, 1, 1);
  const wormSeg = inst(cubeGeo, new T.MeshLambertMaterial({ color: '#ffffff' }), 3200);
  const debris = inst(cubeGeo, new T.MeshLambertMaterial({ color: '#ffffff' }), 1000);
  const shadowGeo = new T.PlaneGeometry(1, 1); shadowGeo.rotateX(-Math.PI / 2);
  const shadows = inst(shadowGeo, new T.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.35, depthWrite: false }), 800);

  // 행렬 헬퍼
  const m4 = new T.Matrix4(), q = new T.Quaternion(), eul = new T.Euler(0, 0, 0, 'YXZ'), vP = new T.Vector3(), vS = new T.Vector3();
  function setM(mesh, i, x, y, z, yaw, s, sx, sy, sz, rx = 0, rz = 0) {
    eul.set(rx, yaw, rz); q.setFromEuler(eul); vP.set(x, y, z); vS.set(sx ?? s, sy ?? s, sz ?? s);
    m4.compose(vP, q, vS); mesh.setMatrixAt(i, m4);
  }
  const yawOf = (a) => Math.PI / 2 - a; // 2D 각도 → yaw (모델 정면 +Z)
  const scaleFor = (type, r) => { const md = MODELS[type]; const target = r * (type === 'boss' ? 2.4 : type === 'officer' || type === 'keeper' ? 2.6 : 2.3); return target / md.h; };

  // ── 방화벽: 불타는 블록 벽 (월드 경계) ──
  const fireTex = pixTex(16, 32, (g) => {
    for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) {
      const k = y / 32 + Math.random() * 0.25;
      g.fillStyle = k > 0.8 ? '#ffeb3b' : k > 0.6 ? '#ff9100' : k > 0.35 ? '#ff1744' : '#4a0010';
      g.fillRect(x, y, 1, 1);
    }
  });
  fireTex.wrapS = fireTex.wrapT = T.RepeatWrapping; fireTex.repeat.set(1, 0.5);
  const fireMat = new T.MeshBasicMaterial({ map: fireTex });
  const wallBlocks = [];
  for (let x = 0; x <= WORLD.w; x += TILE) wallBlocks.push([x, -TILE / 2], [x, WORLD.h + TILE / 2]);
  for (let y = 0; y <= WORLD.h; y += TILE) wallBlocks.push([-TILE / 2, y], [WORLD.w + TILE / 2, y]);
  const walls = inst(cubeGeo, fireMat, wallBlocks.length * 2);
  wallBlocks.forEach(([x, z], i) => { setM(walls, i * 2, x, TILE / 2, z, 0, TILE); setM(walls, i * 2 + 1, x, TILE * 1.5, z, 0, TILE); });
  walls.count = wallBlocks.length * 2; walls.instanceMatrix.needsUpdate = true;

  // ── 서버랙 기둥 (game.obstacles) ──
  const rackTex = pixTex(16, 16, (g) => {
    g.fillStyle = '#1c2433'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#0d121c'; for (let y = 1; y < 16; y += 4) g.fillRect(1, y, 14, 3);
    for (let y = 2; y < 16; y += 4) { g.fillStyle = '#00e676'; g.fillRect(2, y, 1, 1); g.fillStyle = Math.random() < 0.5 ? '#ffab00' : '#00e676'; g.fillRect(4, y, 1, 1); g.fillStyle = '#37474f'; g.fillRect(8, y, 6, 1); }
    g.fillStyle = '#2b3850'; g.fillRect(0, 0, 16, 1); g.fillRect(0, 0, 1, 16);
  });
  const racks = inst(cubeGeo, new T.MeshLambertMaterial({ map: rackTex }), 512);
  let racksBuilt = null;
  function syncRacks() {
    if (racksBuilt === game.obstacles) return;
    racksBuilt = game.obstacles;
    let n = 0;
    for (const o of game.obstacles) for (let h = 0; h < o.h; h++) {
      for (const [dx, dz] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) {
        if (n >= 512) break;
        setM(racks, n++, o.x + dx * o.r, h * o.r + o.r / 2, o.y + dz * o.r, 0, o.r);
      }
    }
    racks.count = n; racks.instanceMatrix.needsUpdate = true;
  }

  // ── 거점: 육각 바닥 + 모서리 블록 기둥 + 신호 빔 ──
  const baseObjs = new Map();
  const pillarBlocks = inst(cubeGeo, new T.MeshBasicMaterial({ color: '#ffffff' }), 6 * 6 * 3);
  function baseObj(b) {
    let o = baseObjs.get(b); if (o) return o;
    const grp = new T.Group(); grp.position.set(b.x, 0, b.y);
    const fillM = new T.MeshBasicMaterial({ color: '#ff4050', transparent: true, opacity: 0.1, depthWrite: false });
    const fill = new T.Mesh(new T.CircleGeometry(b.r, 6), fillM); fill.rotation.x = -Math.PI / 2; fill.position.y = 1.5;
    const edgeM = new T.MeshBasicMaterial({ color: '#ff4050', transparent: true, opacity: 0.9, depthWrite: false, side: T.DoubleSide });
    const edge = new T.Mesh(new T.RingGeometry(b.r - 10, b.r, 6), edgeM); edge.rotation.x = -Math.PI / 2; edge.position.y = 2;
    const beamM = new T.MeshBasicMaterial({ color: '#ff4050', transparent: true, opacity: 0.1, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
    const beam = new T.Mesh(new T.BoxGeometry(60, 900, 60), beamM); beam.position.y = 450;
    grp.add(fill, edge, beam); scene.add(grp);
    o = { grp, fillM, edgeM, beamM, beam }; baseObjs.set(b, o); return o;
  }
  const hqRing = new T.Mesh(new T.RingGeometry(160, 172, 4), new T.MeshBasicMaterial({ color: '#78909c', transparent: true, opacity: 0.7, side: T.DoubleSide }));
  hqRing.rotation.x = -Math.PI / 2; hqRing.rotation.z = Math.PI / 4; hqRing.position.set(HQ.x, 2, HQ.y); scene.add(hqRing);

  // ── 데이터 레인 (하늘에서 내리는 초록 도트) ──
  const RAIN = 120;
  const rainGeo = new T.BufferGeometry();
  const rainPos = new Float32Array(RAIN * 3);
  const rainSeed = Array.from({ length: RAIN }, () => ({ a: Math.random() * Math.PI * 2, d: 1300 + Math.random() * 700, y: Math.random() * 900, v: 120 + Math.random() * 220 }));
  rainGeo.setAttribute('position', new T.BufferAttribute(rainPos, 3).setUsage(T.DynamicDrawUsage));
  const rain = new T.Points(rainGeo, new T.PointsMaterial({ color: '#00e676', size: 7, transparent: true, opacity: 0.28, depthWrite: false, blending: T.AdditiveBlending }));
  rain.frustumCulled = false; scene.add(rain);

  // ── 플레이어 (3인칭용 블록 캐릭터) ──
  const pg = new T.Group(); scene.add(pg);
  const lam = (c) => new T.MeshLambertMaterial({ color: c });
  const mk = (mat, x, y, z, sx, sy, sz, parent = pg) => { const m = new T.Mesh(cubeGeo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); parent.add(m); return m; };
  const legL = mk(lam('#1b2333'), -6, 9, 0, 9, 18, 9), legR = mk(lam('#1b2333'), 6, 9, 0, 9, 18, 9);
  const torso = mk(lam('#263859'), 0, 32, 0, 28, 28, 16);
  mk(lam('#ffffff'), 0, 29, 8.5, 7, 9, 1);
  mk(lam('#ffd7b0'), 0, 56, 0, 22, 22, 22);
  mk(lam('#20160f'), 0, 67, -1, 23, 6, 24); mk(lam('#20160f'), 0, 58, -11, 23, 16, 3);
  mk(lam('#111111'), 0, 57, 11.5, 18, 4, 1);
  mk(new T.MeshBasicMaterial({ color: '#00e5ff' }), -12, 56, 0, 3, 8, 8); mk(new T.MeshBasicMaterial({ color: '#00e5ff' }), 12, 56, 0, 3, 8, 8);
  const aura = new T.Mesh(new T.BoxGeometry(80, 110, 80), new T.MeshBasicMaterial({ color: '#ffc107', transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }));
  aura.position.y = 50; pg.add(aura);

  // 픽셀 키보드 무기
  const kbTex = pixTex(44, 14, (g) => {
    g.fillStyle = '#1f232c'; g.fillRect(0, 0, 44, 14);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 14; c++) {
      if (r === 3 && c > 3 && c < 10) continue;
      g.fillStyle = r === 0 && c === 0 ? '#ff5252' : (r + c) % 7 === 0 ? '#b0bec5' : '#e8ecf3'; g.fillRect(1 + c * 3, 1 + r * 3, 2, 2);
    }
    g.fillStyle = '#e8ecf3'; g.fillRect(13, 10, 17, 2);
    g.fillStyle = '#00e5ff'; g.fillRect(41, 10, 2, 2);
  });
  const kbSide = lam('#2b2f3a');
  const kbTop = new T.MeshLambertMaterial({ map: kbTex });
  const kbGlowM = new T.MeshBasicMaterial({ color: '#ff00ff' });
  function makeKeyboard() {
    const g = new T.Group();
    const kb = new T.Mesh(cubeGeo, [kbSide, kbSide, kbTop, kbSide, kbSide, kbSide]); kb.scale.set(88, 8, 28); g.add(kb);
    const gl = new T.Mesh(cubeGeo, kbGlowM); gl.scale.set(91, 3, 31); gl.position.y = -4; g.add(gl);
    return g;
  }
  const wp = new T.Group(); wp.rotation.order = 'YZX'; scene.add(wp);
  const wHold = new T.Group(); wp.add(wHold);

  // 1인칭 뷰모델: 블록 팔 + 키보드 (카메라 자식)
  const vm = new T.Group(); vm.rotation.order = 'YXZ'; vm.scale.setScalar(0.24); camera.add(vm);
  const vHold = new T.Group(); vHold.rotation.y = Math.PI / 2; vHold.position.set(0, 0, 6); vm.add(vHold);
  mk(lam('#ffd7b0'), 0, -4, -6, 9, 9, 11, vm);
  mk(lam('#263859'), 2, -6, 10, 11, 11, 24, vm);
  vm.visible = false;

  // ── 무기 모델 (모두 +X 방향으로 뻗음, 원점 = 손) ──
  function buildWeapon(id) {
    const g = new T.Group();
    const add = (mat, x, y, z, sx, sy, sz) => { const m = new T.Mesh(cubeGeo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); g.add(m); return m; };
    switch (id) {
      case 'lan': { const blue = lam('#1e88e5'); for (let i = 0; i < 15; i++) add(blue, 14 + i * 9, Math.sin(i * 0.8) * 3, 0, 9.5, 3.2, 3.2); add(lam('#eceff1'), 154, 0, 0, 11, 8, 9); add(new T.MeshBasicMaterial({ color: '#ffd740' }), 160, 1, 0, 2, 3, 7); break; }
      case 'hammer': { add(lam('#37474f'), 50, 0, 0, 80, 6, 6); add(new T.MeshLambertMaterial({ map: rackTex }), 100, 0, 0, 30, 44, 34); add(new T.MeshBasicMaterial({ color: '#00e676' }), 100, 0, 17.5, 20, 3, 1); break; }
      case 'flail': { add(lam('#37474f'), 28, 0, 0, 34, 6, 6); const ch = lam('#90a4ae'); for (let i = 0; i < 6; i++) add(ch, 48 + i * 7, -i * 1.6, 0, 5.5, 3, 3); add(lam('#f5f5f5'), 96, -10, 0, 28, 13, 19); add(lam('#424242'), 88, -3, 0, 7, 3, 3); add(new T.MeshBasicMaterial({ color: '#ff1744' }), 108, -10, 0, 3, 4, 8); break; }
      case 'shield': { add(lam('#37474f'), 16, 0, 0, 22, 6, 6); add(fireMat, 34, 0, 0, 10, 66, 56); add(new T.MeshBasicMaterial({ color: '#ffeb3b' }), 39.5, 0, 0, 1, 10, 30); break; }
      case 'gijo': { add(new T.MeshBasicMaterial({ map: gijoTex }), 16, 0, 0, 14, 14, 14); add(new T.MeshBasicMaterial({ color: '#ffd740' }), 66, 0, 0, 92, 4, 12); add(new T.MeshBasicMaterial({ color: '#fff8e1' }), 66, 0, 0, 92, 5, 2); break; }
      default: { const kb = makeKeyboard(); kb.position.set(58, 0, 0); g.add(kb); }
    }
    return g;
  }
  let weaponId = null;
  function syncWeaponModel() {
    const id = curWeapon().id; if (id === weaponId) return; weaponId = id;
    for (const h of [wHold, vHold]) { while (h.children.length) h.remove(h.children[0]); h.add(buildWeapon(id)); }
  }
  // 미션 마커 (목표 지점 빔 + 링)
  const markRingGeo = new T.RingGeometry(0.9, 1, 40);
  const markRing = new T.Mesh(markRingGeo, new T.MeshBasicMaterial({ color: '#69f0ae', transparent: true, opacity: 0.9, depthWrite: false, side: T.DoubleSide }));
  markRing.rotation.x = -Math.PI / 2; markRing.visible = false; scene.add(markRing);
  const markBeam = new T.Mesh(new T.BoxGeometry(40, 900, 40), new T.MeshBasicMaterial({ color: '#69f0ae', transparent: true, opacity: 0.18, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }));
  markBeam.visible = false; scene.add(markBeam);

  // ── 이펙트 ──
  const additive = (o = {}) => new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, ...o });
  const arcCache = new Map();
  const arcs = Array.from({ length: 10 }, () => { const m = new T.Mesh(new T.BufferGeometry(), additive({ color: '#80d8ff', opacity: 0.8 })); m.rotation.x = -Math.PI / 2; m.visible = false; scene.add(m); return { m, key: '' }; });
  function setArc(slot, cx, cz, h, r0, r1, a0, a1, color, opacity) {
    const A = arcs[slot], m = A.m;
    // 시작각은 메시 회전으로, 호 길이만 양자화해 캐시 → 매 프레임 지오메트리 생성 없음
    const lo = Math.min(a0, a1), len = Math.max(0.04, Math.round((Math.max(a0, a1) - lo) / 0.04) * 0.04);
    const key = `${r0 | 0},${r1 | 0},${len.toFixed(2)}`;
    let geo = arcCache.get(key);
    if (!geo) { if (arcCache.size > 400) { for (const g of arcCache.values()) g.dispose(); arcCache.clear(); } geo = new T.RingGeometry(r0, r1, 24, 1, -len, len); arcCache.set(key, geo); }
    if (A.key !== key) { m.geometry = geo; A.key = key; }
    m.rotation.set(-Math.PI / 2, 0, -lo);
    m.position.set(cx, h + (R3D.mode === 'fps' ? 16 : 0), cz); m.material.color.set(color); m.material.opacity = opacity; m.visible = true;
  }
  const ringGeo = new T.RingGeometry(0.86, 1, 8); // 팔각 링 = 블록 느낌
  const rings = Array.from({ length: 48 }, () => { const m = new T.Mesh(ringGeo, additive()); m.rotation.x = -Math.PI / 2; m.visible = false; scene.add(m); return m; });
  const sqGeo = new T.PlaneGeometry(2, 2); sqGeo.rotateX(-Math.PI / 2);
  const teleFill = Array.from({ length: 14 }, () => { const m = new T.Mesh(new T.CircleGeometry(1, 8), new T.MeshBasicMaterial({ color: '#ff1744', transparent: true, opacity: 0.2, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.visible = false; scene.add(m); return m; });
  const teleEdge = Array.from({ length: 14 }, () => { const m = new T.Mesh(ringGeo, additive({ color: '#ff5252' })); m.rotation.x = -Math.PI / 2; m.visible = false; scene.add(m); return m; });
  const lineGeo = new T.PlaneGeometry(1, 1); lineGeo.rotateX(-Math.PI / 2); lineGeo.translate(0.5, 0, 0);
  const teleLine = Array.from({ length: 4 }, () => { const m = new T.Mesh(lineGeo, new T.MeshBasicMaterial({ color: '#ff1744', transparent: true, opacity: 0.3, depthWrite: false })); m.visible = false; scene.add(m); return m; });

  function makePoints(cap, size) {
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(new Float32Array(cap * 3), 3).setUsage(T.DynamicDrawUsage));
    geo.setAttribute('color', new T.BufferAttribute(new Float32Array(cap * 3), 3).setUsage(T.DynamicDrawUsage));
    const pts = new T.Points(geo, new T.PointsMaterial({ size, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    pts.frustumCulled = false; scene.add(pts);
    return { geo, cap, n: 0 };
  }
  const ptSmall = makePoints(2400, 6), ptBig = makePoints(500, 22);
  const colorCache = new Map();
  const colOf = (s) => { let c = colorCache.get(s); if (!c) { c = new T.Color(s); colorCache.set(s, c); } return c; };
  function pushPt(P, x, y, z, color, k) {
    if (P.n >= P.cap) return;
    const i = P.n * 3, pa = P.geo.attributes.position.array, ca = P.geo.attributes.color.array;
    pa[i] = x; pa[i + 1] = y; pa[i + 2] = z; ca[i] = color.r * k; ca[i + 1] = color.g * k; ca[i + 2] = color.b * k; P.n++;
  }
  const keyCaps = inst(cubeGeo, lam('#eef1f7'), 200);
  const bullets = inst(cubeGeo, new T.MeshBasicMaterial({ color: '#ffffff' }), 400);
  const waveMesh = inst(cubeGeo, additive({ color: '#a8e6ff', opacity: 0.7 }), 30);
  const itemMesh = { coffee: inst(cubeGeo, lam('#ffffff'), 60), energy: inst(cubeGeo, new T.MeshBasicMaterial({ color: '#ffeb3b' }), 60), patch: inst(cubeGeo, new T.MeshBasicMaterial({ color: '#69f0ae' }), 60),
    inspect: inst(cubeGeo, new T.MeshBasicMaterial({ color: '#e3f2fd' }), 4), backup: inst(cubeGeo, new T.MeshBasicMaterial({ color: '#26c6da' }), 4) };
  const gijoTex = pixTex(16, 16, (g) => {
    g.fillStyle = '#ffc400'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#fff3c4'; g.fillRect(0, 0, 16, 2); g.fillRect(0, 0, 2, 16);
    g.fillStyle = '#b8860b'; g.fillRect(0, 14, 16, 2); g.fillRect(14, 0, 2, 16);
    g.fillStyle = '#3e2700'; // G
    [[3, 4], [4, 4], [5, 4], [3, 5], [3, 6], [3, 7], [4, 7], [5, 7], [5, 6], [9, 4], [9, 5], [9, 6], [9, 7], [11, 4], [12, 4], [11, 5], [11, 6], [11, 7], [12, 7], [12, 5], [12, 6]].forEach(([x, y]) => g.fillRect(x, y + 2, 1, 1));
  });
  const gijoMesh = new T.Mesh(cubeGeo, new T.MeshBasicMaterial({ map: gijoTex })); gijoMesh.scale.setScalar(34);
  const gijoBeam = new T.Mesh(new T.BoxGeometry(30, 700, 30), additive({ color: '#ffd740', opacity: 0.25 }));
  scene.add(gijoMesh, gijoBeam);
  const drones = inst(cubeGeo, new T.MeshBasicMaterial({ color: '#ffd740' }), 6);
  const boltLines = Array.from({ length: 16 }, () => {
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(new Float32Array(8 * 3), 3));
    const l = new T.Line(geo, new T.LineBasicMaterial({ color: '#a0f0ff', transparent: true, blending: T.AdditiveBlending, depthWrite: false })); l.visible = false; l.frustumCulled = false; scene.add(l); return l;
  });

  // ── 매 프레임 동기화 ──
  const RED = new T.Color('#ff3030'), cW = new T.Color();
  function drawModel(type, x, h, z, yaw, s, flash, wind, darkK, rx = 0, t = 0) {
    const E = EM[type]; if (!E || E.n >= E.cap) return;
    const i = E.n++;
    cW.setRGB(1, 1, 1);
    if (wind) cW.lerp(RED, 0.55 + 0.35 * Math.sin(t * 40));
    if (darkK < 1) cW.multiplyScalar(darkK);
    if (E.lit) { setM(E.lit, i, x, h, z, yaw, s, null, null, null, rx); E.lit.setColorAt(i, cW); }
    if (E.glow) { setM(E.glow, i, x, h, z, yaw, s, null, null, null, rx); }
    if (flash && E.flash && E.fn < E.flash.instanceMatrix.count) { const f = s * 1.06; setM(E.flash, E.fn++, x, h - s * 0.03, z, yaw, f, null, null, null, rx); }
  }
  let shN = 0;
  function shadow(x, z, w, d) { if (shN >= shadows.instanceMatrix.count) return; setM(shadows, shN++, x, 0.8, z, 0, 1, w, 1, d); }

  function syncEnemies(t) {
    for (const k in EM) { EM[k].n = 0; EM[k].fn = 0; }
    let segN = 0;
    for (const e of game.enemies) {
      const d = e.def;
      const toP = Math.atan2(player.y - e.y, player.x - e.x);
      let yaw = yawOf(d.rotate ? e.heading : toP);
      if (d.spin) yaw += t * 1.5 + e.seed;
      let dk = 1;
      if (d.stealth) { const dd = Math.hypot(e.x - player.x, e.y - player.y); dk = dd < 200 || e.flash > 0 || e.windup > 0 ? 1 : 0.18 + 0.12 * Math.sin(t * 5 + e.seed); }
      const s = scaleFor(e.type, e.r) * (e.stun > 0 && !d.big ? 1 + Math.sin(t * 50) * 0.05 : 1);
      const hop = e.type === 'bug' && e.stun <= 0 ? Math.abs(Math.sin(t * 14 + e.seed)) * 3 : 0;
      drawModel(e.type, e.x, e.z + hop, e.y, yaw, s, e.flash > 0, e.windup > 0 || e.chargeT > 0, dk, 0, t);
      if (d.segs && e.trail.length > 2) {
        for (let i = 1; i <= d.segs; i++) {
          const p = e.trail[Math.min(e.trail.length - 1, i * 3)];
          const r = d.r * (1.5 - i * 0.12);
          if (segN < wormSeg.instanceMatrix.count) { setM(wormSeg, segN, p.x, e.z + r / 2, p.y, 0, r); wormSeg.setColorAt(segN, e.flash > 0 ? colOf('#ffffff') : colOf(i % 2 ? '#e07b00' : '#FF9F1C')); segN++; }
        }
      }
      shadow(e.x, e.y, e.r * 2 / (1 + e.z / 220), e.r * 1.6 / (1 + e.z / 220));
    }
    // 시체: 같은 모델이 굴러가며 줄어듦 (복셀 파편은 별도)
    for (const c of game.corpses) {
      const k = c.life / c.max;
      drawModel(c.type, c.x, c.z, c.y, c.rot * 0.5, scaleFor(c.type, c.r) * (0.4 + k * 0.6), k > 0.7, false, 1, c.rot, t);
    }
    for (const k in EM) {
      const E = EM[k];
      for (const m of [E.lit, E.glow]) if (m) { m.count = E.n; if (E.n) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; } }
      if (E.flash) { E.flash.count = E.fn; if (E.fn) E.flash.instanceMatrix.needsUpdate = true; }
    }
    wormSeg.count = segN; wormSeg.instanceMatrix.needsUpdate = true; if (wormSeg.instanceColor) wormSeg.instanceColor.needsUpdate = true;
    // 복셀 파편
    let dn = 0;
    for (const c of game.cubes) {
      if (dn >= debris.instanceMatrix.count) break;
      const k = Math.min(1, c.life * 1.5);
      setM(debris, dn, c.x, c.h, c.y, c.rot, c.size * k, null, null, null, c.rot * 0.7);
      debris.setColorAt(dn, colOf(c.color)); dn++;
    }
    debris.count = dn; debris.instanceMatrix.needsUpdate = true; if (debris.instanceColor) debris.instanceColor.needsUpdate = true;
  }

  function syncPlayer(t) {
    const p = player, fps = R3D.mode === 'fps';
    const blink = p.inv > 0 && p.hurtT > 0 && p.state !== 'musou' && Math.sin(t * 60) > 0;
    pg.visible = !fps && !blink; wp.visible = !fps; vm.visible = fps;
    pg.position.set(p.x, p.z, p.y);
    const spinning = (p.state === 'attack' && p.atk && (p.atk.kind === 'tornado' || p.atk.kind === 'radial')) || p.state === 'musou';
    pg.rotation.y = yawOf(p.facing) + (spinning && R3D.mode === 'chase' ? -t * 20 : 0);
    const walk = p.state === 'move' ? Math.sin(p.walk) : 0;
    legL.position.z = walk * 5; legR.position.z = -walk * 5; torso.position.y = 32 + Math.abs(walk) * 2;
    const gold = p.state === 'musou' || game.gijoT > 0;
    const buff = gold || p.quizBuffT > 0 || p.patchT > 0;
    aura.material.color.set(gold ? '#ffc107' : p.quizBuffT > 0 ? '#00e5ff' : '#69f0ae');
    aura.material.opacity = buff && !fps ? 0.12 + Math.sin(t * 8) * 0.05 : 0;
    aura.rotation.y = t * 2;
    if (!fps) shadow(p.x, p.y, 30 / (1 + p.z / 150), 22 / (1 + p.z / 150));
    // 3인칭 무기
    const a = p.atk;
    let wa = p.facing + 0.9 * p.flip, tilt = 0.55, wh = 30;
    if (p.state === 'attack' && a) {
      if (a.kind === 'arc') { wa = p.swingAng ?? p.facing; tilt = -0.05; }
      else if (a.kind === 'pound') { wa = p.facing; tilt = p.t < a.a0 ? 1.25 : -0.35; wh = 40 + p.z * 0.3; }
      else if (a.kind === 'radial') { wa = p.facing + p.t * 18; tilt = 0; }
      else { wa = p.facing; tilt = 0; }
    } else if (p.state === 'musou') { wa = p.facing + t * 14; tilt = 0.05; }
    if (R3D.mode === 'chase' && p.state === 'attack' && a && a.kind === 'tornado') { wa = p.facing + t * 20; tilt = 0; }
    wp.position.set(p.x, p.z + wh, p.y); wp.rotation.y = -wa; wp.rotation.z = tilt;
    kbGlowM.color.setHSL((t * 0.55) % 1, 1, 0.55);
    if (fps) syncViewModel(p, a, t);
    // 슬래시 궤적
    for (const A of arcs) A.m.visible = false;
    let slot = 0;
    if (p.state === 'attack' && a && (a.kind === 'arc' || a.kind === 'tornado')) {
      const fade = p.t > a.a1 ? Math.max(0, 1 - (p.t - a.a1) / 0.12) : 1;
      if (fade > 0) {
        if (a.kind === 'tornado') {
          const base = R3D.mode !== 'tps' ? t * 22 : p.facing;
          setArc(slot++, p.x, p.y, 24, a.range * 0.55, a.range * 1.05, base, base + 2.6, '#80d8ff', 0.55 * fade);
          setArc(slot++, p.x, p.y, 36, a.range * 0.7, a.range * 1.0, base + 3.1, base + 5.4, '#e1f5fe', 0.45 * fade);
        } else {
          const k0 = Math.min(1, Math.max(0, (p.t - a.a0 + 0.03) / (a.a1 - a.a0 + 0.06)));
          const arc = a.arc * Math.PI / 180, s = p.facing - (arc / 2) * a.dir, cur = s + arc * k0 * a.dir;
          if (!fps) p.swingAng = cur;
          setArc(slot++, p.x, p.y, 26, a.range * 0.35, a.range * 1.02, s, cur, '#4fc3f7', 0.4 * fade);
          setArc(slot++, p.x, p.y, 28, a.range * 0.86, a.range * 1.0, s, cur, '#ffffff', 0.85 * fade);
        }
      }
    }
    for (const qq of game.particles) {
      if (qq.type !== 'slash' || slot >= arcs.length) continue;
      setArc(slot++, p.x, p.y, 30, qq.r * 0.75, qq.r, qq.ang, qq.ang + 2.2, qq.color, (qq.life / qq.max) * 0.85);
    }
    pLight.position.set(p.x, 120, p.y);
    pLight.color.set(gold ? '#ffc107' : '#00e5ff');
    pLight.intensity = 0.7 + (p.state === 'musou' ? 1.2 : 0);
  }

  // 1인칭 키보드 휘두르기 (카메라 공간: x 오른쪽, y 위, -z 앞)
  function syncViewModel(p, a, t) {
    const walk = p.state === 'move' ? Math.sin(p.walk) : 0;
    // 기본: 오른손에 세워 든 키보드 (키캡 면이 보이게 기울임)
    let ry = 0.22, rx = 0.6, rz = -0.6, px = 6.5, py = -6.5, pz = -12;
    if (p.state === 'attack' && a) {
      const k = Math.min(1, Math.max(0, (p.t - a.a0 + 0.03) / (a.a1 - a.a0 + 0.06)));
      const ease = 1 - Math.pow(1 - k, 3);
      if (a.kind === 'arc') { // 오른쪽 → 왼쪽(또는 반대)으로 수평 베기
        const half = Math.min(Math.PI * 0.6, (a.arc * Math.PI / 180) / 2);
        const from = half * a.dir, to = -half * a.dir;
        ry = from + (to - from) * ease; rx = 0.05; rz = -1.3 * a.dir; px = 2; py = -8; pz = -4;
      } else if (a.kind === 'pound') {
        const pre = p.t < a.a0;
        rx = pre ? 1.3 * Math.min(1, p.t / a.a0) : -0.7; ry = 0; rz = 0; px = 2; py = pre ? -2 : -12; pz = -5;
      } else if (a.kind === 'radial' || a.kind === 'tornado') { ry = (a.kind === 'radial' ? p.t : t) * 22; rx = 0; rz = -1.4; px = 0; py = -9; pz = -3; }
      else if (a.kind === 'dash') { ry = 0; rx = 0.1; rz = -0.3; px = 6; py = -9; pz = -9; }
      else if (a.kind === 'wave') { ry = -0.7 + ease * 1.4; rx = 0.05; rz = -1.3; px = 2; py = -8; pz = -4; }
    } else if (p.state === 'musou') { ry = Math.sin(t * 34) * 1.3; rx = 0.05; rz = -1.3 + Math.sin(t * 17) * 0.3; px = 0; py = -8; pz = -3; }
    vm.position.set(px + walk * 0.8, py + Math.abs(walk) * 0.8, pz);
    vm.rotation.set(rx, ry, rz);
  }

  function syncFx(t) {
    let ri = 0;
    for (const qq of game.particles) {
      if (qq.type !== 'ring' || ri >= rings.length) continue;
      const k = Math.max(0, qq.life / qq.max), r = qq.r0 + (qq.r1 - qq.r0) * (1 - k * k);
      const m = rings[ri++]; m.visible = true; m.position.set(qq.x, 6, qq.y); m.scale.set(r, r, 1);
      m.material.color.set(qq.color); m.material.opacity = k;
    }
    for (; ri < rings.length; ri++) rings[ri].visible = false;
    ptSmall.n = 0; ptBig.n = 0;
    let kc = 0;
    for (const qq of game.particles) {
      const k = Math.max(0, qq.life / qq.max);
      switch (qq.type) {
        case 'spark': pushPt(ptSmall, qq.x, 30 + Math.random() * 14, qq.y, colOf(qq.color), k); break;
        case 'bin': pushPt(ptSmall, qq.x, 40 + (1 - k) * 40, qq.y, colOf(qq.color), k); break;
        case 'dust': pushPt(ptBig, qq.x, 8, qq.y, colOf('#40506e'), k * 0.8); break;
        case 'ghost': if (R3D.mode !== 'fps') { pushPt(ptBig, qq.x, 34, qq.y, colOf('#00e5ff'), k * 0.9); pushPt(ptBig, qq.x, 58, qq.y, colOf('#00e5ff'), k * 0.6); } break;
        case 'key':
          if (kc < keyCaps.instanceMatrix.count) {
            setM(keyCaps, kc, qq.x, 20 + (1 - k) * 60 + Math.sin(k * Math.PI) * 80, qq.y, qq.rot * 0.7, 1, 16, 6, 12, qq.rot, qq.rot * 0.3);
            keyCaps.setColorAt(kc, tmpC.setScalar(Math.min(1, k * 2))); kc++;
          }
          break;
      }
    }
    for (const P of [ptSmall, ptBig]) { P.geo.setDrawRange(0, P.n); P.geo.attributes.position.needsUpdate = true; P.geo.attributes.color.needsUpdate = true; }
    keyCaps.count = kc; keyCaps.instanceMatrix.needsUpdate = true; if (keyCaps.instanceColor) keyCaps.instanceColor.needsUpdate = true;
    let bi = 0;
    for (const b of game.bullets) {
      if (bi >= bullets.instanceMatrix.count) break;
      setM(bullets, bi, b.x, 30, b.y, yawOf(Math.atan2(b.vy, b.vx)) + t * 6, b.r * 1.6, null, null, null, t * 4);
      bullets.setColorAt(bi, colOf(b.color)); bi++;
    }
    bullets.count = bi; bullets.instanceMatrix.needsUpdate = true; if (bullets.instanceColor) bullets.instanceColor.needsUpdate = true;
    let wi = 0;
    for (const w of game.waves) { if (wi >= waveMesh.instanceMatrix.count) break; setM(waveMesh, wi++, w.x, 8, w.y, yawOf(w.ang), 1, w.r * 2, 10, 14); }
    waveMesh.count = wi; waveMesh.instanceMatrix.needsUpdate = true;
    let ti = 0, li = 0;
    for (const qq of game.tele) {
      const k = qq.t / qq.dur;
      if (qq.line) {
        if (li >= teleLine.length) continue;
        const m = teleLine[li++]; m.visible = true; m.position.set(qq.x, 3, qq.y); m.rotation.y = -qq.ang; m.scale.set(qq.len, 1, 100); m.material.opacity = 0.15 + k * 0.35;
      } else {
        if (ti >= teleFill.length) continue;
        const f = teleFill[ti], e = teleEdge[ti]; ti++;
        f.visible = e.visible = true;
        f.position.set(qq.x, 3, qq.y); f.scale.set(qq.r, qq.r, 1); f.material.opacity = 0.12 + k * 0.2;
        e.position.set(qq.x, 4, qq.y); e.scale.set(qq.r * Math.max(0.05, k), qq.r * Math.max(0.05, k), 1); e.material.opacity = 0.9;
      }
    }
    for (; ti < teleFill.length; ti++) { teleFill[ti].visible = false; teleEdge[ti].visible = false; }
    for (; li < teleLine.length; li++) teleLine[li].visible = false;
    const ic = { coffee: 0, energy: 0, patch: 0, inspect: 0, backup: 0 };
    let gijoSeen = false;
    for (const it of game.items) {
      const blink = it.t > itemLife(it) - 4 && Math.sin(it.t * 20) > 0;
      const bob = 22 + Math.sin(t * 4 + it.bob) * 6;
      if (it.kind === 'gijo') {
        gijoSeen = !blink;
        gijoMesh.position.set(it.x, 48 + Math.sin(t * 3) * 8, it.y); gijoMesh.rotation.set(0.3, t * 2, 0.3);
        gijoBeam.position.set(it.x, 350, it.y); gijoBeam.material.opacity = 0.18 + Math.sin(t * 6) * 0.07;
        gLight.position.set(it.x, 90, it.y);
        continue;
      }
      if (blink) continue;
      const m = itemMesh[it.kind];
      if (!m || ic[it.kind] >= m.instanceMatrix.count) continue;
      const i = ic[it.kind]++;
      if (it.kind === 'coffee') { setM(m, i, it.x, bob, it.y, t * 2.5, 1, 14, 18, 14); m.setColorAt(i, colOf('#6d4c41')); }
      else if (it.kind === 'energy') setM(m, i, it.x, bob, it.y, t * 2.5, 1, 10, 22, 10);
      else if (it.kind === 'inspect') setM(m, i, it.x, bob + 10, it.y, t * 2, 1, 20, 26, 3);
      else if (it.kind === 'backup') setM(m, i, it.x, bob + 6, it.y, t * 1.5, 1, 26, 16, 26);
      else setM(m, i, it.x, bob, it.y, t * 2.5, 16, null, null, null, 0.6, 0.6);
    }
    for (const k in itemMesh) { const m = itemMesh[k]; m.count = ic[k]; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
    gijoMesh.visible = gijoBeam.visible = gijoSeen;
    gLight.intensity = gijoSeen ? 2.2 : game.gijoT > 0 ? 1.5 : 0;
    if (game.gijoT > 0) gLight.position.set(player.x, 140, player.y);
    const mk = game.missionMarker;
    markRing.visible = markBeam.visible = !!mk;
    if (mk) {
      markRing.position.set(mk.x, 5, mk.y); markRing.scale.set(mk.r, mk.r, 1); markRing.material.color.set(mk.color);
      markBeam.position.set(mk.x, 450, mk.y); markBeam.material.color.set(mk.color); markBeam.material.opacity = 0.14 + Math.sin(t * 5) * 0.05;
    }
    let di = 0;
    for (const d of game.drones) setM(drones, di++, d.x, 72 + Math.sin(t * 5 + d.i) * 6, d.y, t * 6, 11, null, null, null, t * 4);
    drones.count = di; drones.instanceMatrix.needsUpdate = true;
    let li2 = 0;
    for (const b of game.bolts) {
      if (li2 >= boltLines.length) break;
      const l = boltLines[li2++], arr = l.geometry.attributes.position.array;
      const h1 = (b.z1 || 0) + 20, h2 = (b.z2 || 0) + 22;
      for (let i = 0; i < 8; i++) {
        const k = i / 7, j = i === 0 || i === 7 ? 0 : 22;
        arr[i * 3] = b.x1 + (b.x2 - b.x1) * k + (Math.random() - 0.5) * j;
        arr[i * 3 + 1] = h1 + (h2 - h1) * k + (Math.random() - 0.5) * j;
        arr[i * 3 + 2] = b.y1 + (b.y2 - b.y1) * k + (Math.random() - 0.5) * j;
      }
      l.geometry.attributes.position.needsUpdate = true;
      l.material.color.set(b.gold ? '#ffe082' : '#a0f0ff'); l.material.opacity = b.life / 0.12; l.visible = true;
    }
    for (; li2 < boltLines.length; li2++) boltLines[li2].visible = false;
  }

  let basesRef = null;
  function syncWorld(t) {
    syncRacks();
    if (basesRef !== game.bases) { // 새 판: 이전 거점 메시 정리
      basesRef = game.bases;
      for (const o of baseObjs.values()) { scene.remove(o.grp); o.grp.traverse((m) => { if (m.geometry) m.geometry.dispose(); if (m.material) m.material.dispose(); }); }
      baseObjs.clear();
    }
    let pn = 0;
    for (const b of game.bases) {
      const o = baseObj(b), en = b.owner === 'enemy', c = en ? '#ff4050' : '#00e5ff';
      o.fillM.color.set(c); o.edgeM.color.set(c); o.beamM.color.set(c);
      o.fillM.opacity = 0.08 + Math.sin(t * 2 + b.pulse) * 0.03;
      o.beam.visible = en; o.beamM.opacity = 0.08 + Math.sin(t * 4) * 0.03;
      for (let i = 0; i < 6; i++) { // 모서리 블록 기둥
        const a = i / 6 * Math.PI * 2;
        const x = b.x + Math.cos(a) * b.r, z = b.y + Math.sin(a) * b.r;
        for (let h = 0; h < 3; h++) { if (pn < pillarBlocks.instanceMatrix.count) { setM(pillarBlocks, pn, x, 16 + h * 32 + (h === 2 ? Math.sin(t * 3 + i) * 4 : 0), z, t * (h === 2 ? 1.5 : 0), 30); pillarBlocks.setColorAt(pn, colOf(h === 2 ? c : en ? '#4a0d16' : '#0d3a4a')); pn++; } }
      }
    }
    pillarBlocks.count = pn; pillarBlocks.instanceMatrix.needsUpdate = true; if (pillarBlocks.instanceColor) pillarBlocks.instanceColor.needsUpdate = true;
    hqRing.material.color.set(game.boss ? '#ff1744' : '#78909c');
    fireTex.offset.y = (t * 0.35) % 1;
    // 데이터 레인
    for (let i = 0; i < RAIN; i++) {
      const r = rainSeed[i]; r.y -= r.v * (1 / 60); if (r.y < 0) { r.y = 900; r.a = Math.random() * Math.PI * 2; }
      rainPos[i * 3] = player.x + Math.cos(r.a) * r.d; rainPos[i * 3 + 1] = r.y; rainPos[i * 3 + 2] = player.y + Math.sin(r.a) * r.d;
    }
    rainGeo.attributes.position.needsUpdate = true;
    stars.position.set(camera.position.x, 0, camera.position.z);
  }

  function syncBossExtras() { /* 보스는 복셀 모델(EM.boss)로 그려짐 */ }

  function syncCamera() {
    const z = game.zoom, p = player;
    if (R3D.mode === 'fps') {
      const bob = p.state === 'move' ? Math.abs(Math.sin(p.walk)) * 3 : 0;
      const eye = 50 + p.z + bob;
      camera.position.set(p.x + game.sx * 0.5, eye + game.sy * 0.4, p.y);
      const pitch = (p.pitch || 0) - 0.12, cp = Math.cos(pitch);
      camera.lookAt(p.x + Math.cos(p.facing) * cp * 100, eye + Math.sin(pitch) * 100, p.y + Math.sin(p.facing) * cp * 100);
      camera.rotateZ(game.sx * 0.004); // 타격 시 화면 기울임
      const fov = 80 / z + (p.state === 'dash' ? 8 : 0);
      if (Math.abs(camera.fov - fov) > 0.05) { camera.fov += (fov - camera.fov) * 0.3; camera.updateProjectionMatrix(); }
      scene.fog.near = 450; scene.fog.far = 1900;
      return;
    }
    if (R3D.mode === 'chase') {
      // 등 뒤 추적 카메라 (캐릭터가 보이는 3인칭)
      const fx = Math.cos(p.facing), fz = Math.sin(p.facing);
      const pitch = (p.pitch || 0);
      const dist = 215 / z, hgt = 118 / z - pitch * 120;
      chase.x += (p.x - fx * dist - chase.x) * 0.25; chase.z += (p.y - fz * dist - chase.z) * 0.25; chase.y += (hgt + p.z * 0.4 - chase.y) * 0.2;
      camera.position.set(chase.x + game.sx * 0.8, chase.y + game.sy * 0.6, chase.z);
      camera.lookAt(p.x + fx * 150, 46 + p.z * 0.5 + pitch * 160, p.y + fz * 150);
      camera.rotateZ(game.sx * 0.003);
      const fov = 66 / z + (p.state === 'dash' ? 7 : 0);
      if (Math.abs(camera.fov - fov) > 0.05) { camera.fov += (fov - camera.fov) * 0.3; camera.updateProjectionMatrix(); }
      scene.fog.near = 650; scene.fog.far = 2200;
      return;
    }
    if (Math.abs(camera.fov - 46) > 0.05) { camera.fov = 46; camera.updateProjectionMatrix(); }
    scene.fog.near = 1100; scene.fog.far = 2600;
    camera.position.set(cam.x + game.sx * 1.6, 640 / z + game.sy * 1.2, cam.y + 560 / z);
    camera.lookAt(cam.x + game.sx * 0.6, 20, cam.y - 40);
  }

  const chase = { x: 0, y: 120, z: 0 };
  const v3 = new T.Vector3();
  const R3D = {
    enabled: (settings.view || 'chase') !== '2d',
    mode: ['fps', 'chase', 'tps'].includes(settings.view) ? settings.view : 'chase',
    show(on) { glCanvas.style.display = on ? 'block' : 'none'; },
    toScreen(x, y, h = 0) {
      v3.set(x, h, y);
      const dist = camera.position.distanceTo(v3);
      v3.project(camera);
      return { x: (v3.x + 1) / 2 * window.innerWidth, y: (1 - v3.y) / 2 * window.innerHeight, vis: v3.z < 1 && Math.abs(v3.x) < 1.15 && Math.abs(v3.y) < 1.15, k: Math.min(2, (R3D.mode === 'fps' ? 380 : R3D.mode === 'chase' ? 520 : 820) / dist) };
    },
    render() {
      const t = game.titleT;
      shN = 0;
      syncWeaponModel(); syncCamera(); syncWorld(t); syncEnemies(t); syncPlayer(t); syncFx(t); syncBossExtras();
      shadows.count = shN; shadows.instanceMatrix.needsUpdate = true;
      renderer.render(scene, camera);
    },
  };
  window.R3D = R3D;
  console.log('[3D] Three.js r' + T.REVISION + ' 복셀 렌더러 준비 완료');
})();
