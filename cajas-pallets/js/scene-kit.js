/* ============================================================
   VSPT · Scene Kit — base three.js compartida
   1 unidad three.js = 100 mm  (SCALE = 0.01)
   ============================================================ */
(function () {
  "use strict";
  const SCALE = 0.01;
  const mm = (v) => v * SCALE;

  function createStage(canvas, opts) {
    opts = opts || {};
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(opts.bg || "#efe7d6");

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 2000);
    camera.position.set(9, 7, 12);

    const renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;

    /* ---- luces ---- */
    const hemi = new THREE.HemisphereLight(0xfff6e8, 0x6b5a52, 0.85);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff4e2, 1.05);
    key.position.set(14, 20, 10);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    const d = 30;
    key.shadow.camera.left = -d; key.shadow.camera.right = d;
    key.shadow.camera.top = d; key.shadow.camera.bottom = -d;
    key.shadow.camera.near = 1; key.shadow.camera.far = 120;
    key.shadow.bias = -0.0004;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xe9d9ff, 0.28);
    fill.position.set(-12, 8, -8);
    scene.add(fill);

    /* ---- suelo con sombra ---- */
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.ShadowMaterial({ opacity: 0.16, color: 0x3a0d33 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.001;
    ground.receiveShadow = true;
    scene.add(ground);

    /* piso visible muy sutil */
    const floorMat = new THREE.MeshStandardMaterial({
      color: opts.floor || "#e6dcc7", roughness: 1, metalness: 0,
    });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(60, 64), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    scene.add(floor);

    /* ---- controles orbit ---- */
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1.2;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.target.set(0, 1.4, 0);

    /* contenido va dentro de este grupo (se vacía al reconstruir) */
    const content = new THREE.Group();
    scene.add(content);

    const tickers = [];
    function onTick(fn) { tickers.push(fn); }

    let raf = null, running = false;
    function resize() {
      const r = canvas.getBoundingClientRect();
      const w = Math.max(1, r.width), h = Math.max(1, r.height);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    function loop() {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      const dt = 1 / 60;
      for (const fn of tickers) fn(dt);
      controls.update();
      renderer.render(scene, camera);
    }
    function start() { if (!running) { running = true; loop(); } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    function clearContent() {
      while (content.children.length) {
        const c = content.children.pop();
        disposeDeep(c);
      }
    }

    function frameObject(box3, pad) {
      // Encuadre ajustado: proyecta las 8 esquinas sobre los ejes de la cámara
      // (alto/ancho/profundidad) y calcula la distancia mínima para que TODO el
      // objeto llene el cuadro, tanto en vertical como en horizontal.
      pad = pad || 1.06;
      const center = new THREE.Vector3();
      box3.getCenter(center);
      const dir = new THREE.Vector3(0.85, 0.62, 1).normalize();  // cámara → centro
      const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize();
      const up = new THREE.Vector3().crossVectors(dir, right).normalize();

      const vFov = (camera.fov * Math.PI) / 180;
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
      const min = box3.min, max = box3.max;
      let maxR = 0, maxU = 0, maxF = 0;
      const v = new THREE.Vector3();
      for (let i = 0; i < 8; i++) {
        v.set(i & 1 ? max.x : min.x, i & 2 ? max.y : min.y, i & 4 ? max.z : min.z).sub(center);
        maxR = Math.max(maxR, Math.abs(v.dot(right)));
        maxU = Math.max(maxU, Math.abs(v.dot(up)));
        maxF = Math.max(maxF, Math.abs(v.dot(dir)));
      }
      const distU = maxU / Math.tan(vFov / 2) + maxF;
      const distR = maxR / Math.tan(hFov / 2) + maxF;
      const dist = Math.max(distU, distR) * pad;

      controls.target.copy(center);
      camera.position.copy(center).add(dir.multiplyScalar(dist));
      camera.near = Math.max(0.05, (dist - maxF) * 0.4);
      camera.far = (dist + maxF) * 3 + 10;
      camera.updateProjectionMatrix();
      controls.update();
    }

    return {
      scene, camera, renderer, controls, content,
      onTick, start, stop, resize, clearContent, frameObject,
      SCALE, mm,
    };
  }

  function disposeDeep(obj) {
    obj.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material.dispose();
      }
    });
  }

  /* tween numérico simple (lerp por frame hacia un target) */
  function makeSpring(initial) {
    let cur = initial, target = initial;
    return {
      set(v) { target = v; },
      jump(v) { cur = v; target = v; },
      step(k) { cur += (target - cur) * (k == null ? 0.18 : k); return cur; },
      get value() { return cur; },
      get target() { return target; },
    };
  }

  /* materiales reutilizables -------------------------------- */
  function kraftMaterial(color) {
    return new THREE.MeshStandardMaterial({
      color: color || "#caa86f", roughness: 0.92, metalness: 0.02,
    });
  }
  function woodMaterial() {
    return new THREE.MeshStandardMaterial({
      color: "#c79a5c", roughness: 0.85, metalness: 0,
    });
  }
  function glassMaterial(color) {
    return new THREE.MeshStandardMaterial({
      color: color || "#2f3a1c", roughness: 0.25, metalness: 0.1,
      transparent: true, opacity: 0.92,
    });
  }

  /* bottle (LatheGeometry) — devuelve grupo escalado a D×H en mm */
  function makeBottle(D, H, glassColor) {
    const grp = new THREE.Group();
    // perfil normalizado (radio 0..1 sobre D/2, altura 0..1 sobre H)
    const rB = 0.5;          // radio cuerpo (de D)
    const rN = 0.16;         // radio cuello
    const bodyTop = 0.62;    // donde empieza el hombro
    const neckBot = 0.80;    // donde el hombro termina
    const pts = [];
    pts.push(new THREE.Vector2(0.0, 0.0));
    pts.push(new THREE.Vector2(rB * 0.96, 0.0));
    pts.push(new THREE.Vector2(rB, 0.02));
    pts.push(new THREE.Vector2(rB, bodyTop));
    pts.push(new THREE.Vector2(rB * 0.92, bodyTop + 0.04));
    pts.push(new THREE.Vector2(rN * 1.5, neckBot - 0.02));
    pts.push(new THREE.Vector2(rN, neckBot));
    pts.push(new THREE.Vector2(rN, 0.96));
    pts.push(new THREE.Vector2(rN * 1.18, 0.975));   // labio
    pts.push(new THREE.Vector2(rN * 1.18, 1.0));
    pts.push(new THREE.Vector2(rN * 0.7, 1.0));
    const geo = new THREE.LatheGeometry(pts, 40);
    const body = new THREE.Mesh(geo, glassMaterial(glassColor));
    body.castShadow = true;
    grp.add(body);

    // etiqueta clara (cilindro fino)
    const lblGeo = new THREE.CylinderGeometry(rB * 1.005, rB * 1.005, 0.26, 40, 1, true);
    const lbl = new THREE.Mesh(lblGeo, new THREE.MeshStandardMaterial({
      color: "#f3ecdd", roughness: 0.85, side: THREE.DoubleSide,
    }));
    lbl.position.y = 0.30;
    grp.add(lbl);

    // cápsula superior
    const capGeo = new THREE.CylinderGeometry(rN * 1.22, rN * 1.22, 0.12, 24);
    const cap = new THREE.Mesh(capGeo, new THREE.MeshStandardMaterial({
      color: "#7a1233", roughness: 0.5, metalness: 0.3,
    }));
    cap.position.y = 0.92;
    grp.add(cap);

    grp.scale.set(mm(D), mm(H), mm(D));
    grp.userData.unit = true;
    return grp;
  }

  window.SceneKit = {
    createStage, makeSpring, disposeDeep,
    kraftMaterial, woodMaterial, glassMaterial, makeBottle,
    SCALE, mm,
  };
})();
