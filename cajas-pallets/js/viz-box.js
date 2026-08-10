/* ============================================================
   VSPT · Visualización 3D — Caja (botellas en colmena)
   ============================================================ */
(function () {
  "use strict";
  const { mm, makeBottle, kraftMaterial } = window.SceneKit;
  const { makeSpring } = window.SceneKit;

  function create(stage) {
    const root = new THREE.Group();
    stage.content.add(root);

    // springs de dimensiones (mm)
    const sLint = makeSpring(150), sAint = makeSpring(150), sHint = makeSpring(300);
    const sLext = makeSpring(160), sAext = makeSpring(160), sHext = makeSpring(310);
    const sD = makeSpring(75), sH = makeSpring(300), sE = makeSpring(3);

    let nl = 2, na = 3, glass = "#2f3a1c";
    let firstFrame = true;

    /* ---- meshes persistentes ---- */
    const bottomMat = kraftMaterial("#c4a06a");
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), bottomMat);
    bottom.castShadow = true; bottom.receiveShadow = true;
    root.add(bottom);

    const wallMat = new THREE.MeshStandardMaterial({
      color: "#caa86f", roughness: 0.92, transparent: true, opacity: 0.26,
      side: THREE.DoubleSide, depthWrite: false,
    });
    const walls = [];
    for (let i = 0; i < 4; i++) {
      const w = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), wallMat);
      root.add(w); walls.push(w);
    }

    // contorno
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
      new THREE.LineBasicMaterial({ color: 0x4e1742, transparent: true, opacity: 0.55 })
    );
    root.add(edges);

    const divMat = kraftMaterial("#bb965e");
    const dividers = [];   // pool de tabiques
    const bottles = [];    // pool de botellas

    function ensureDividers(n) {
      while (dividers.length < n) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), divMat);
        m.castShadow = true; root.add(m); dividers.push(m);
      }
      dividers.forEach((m, i) => (m.visible = i < n));
    }
    function ensureBottles(n) {
      while (bottles.length < n) {
        const b = makeBottle(75, 300, glass);
        root.add(b); bottles.push(b);
      }
      // rehacer color de vidrio si cambió
      bottles.forEach((b, i) => (b.visible = i < n));
    }
    function rebuildBottleGlass() {
      bottles.forEach((b) => {
        b.children[0].material.color.set(glass);  // body es el primer hijo
      });
    }

    /* ---- API ---- */
    function update(box, opts) {
      opts = opts || {};
      const structural = (box.nl !== nl || box.na !== na || box.glass !== glass);
      nl = box.nl; na = box.na;
      if (box.glass && box.glass !== glass) { glass = box.glass; }
      sLint.set(box.Lint); sAint.set(box.Aint); sHint.set(box.Hint);
      sLext.set(box.Lext); sAext.set(box.Aext); sHext.set(box.Hext);
      sD.set(box.D); sH.set(box.H); sE.set(opts.e || 3);

      ensureBottles(nl * na);
      ensureDividers((nl - 1) + (na - 1));
      rebuildBottleGlass();

      if (opts.snap) {
        sLint.jump(box.Lint); sAint.jump(box.Aint); sHint.jump(box.Hint);
        sLext.jump(box.Lext); sAext.jump(box.Aext); sHext.jump(box.Hext);
        sD.jump(box.D); sH.jump(box.H);
        firstFrame = true;
      }
    }

    function layout() {
      const Lint = sLint.value, Aint = sAint.value, Hint = sHint.value;
      const Lext = sLext.value, Aext = sAext.value, Hext = sHext.value;
      const D = sD.value, H = sH.value, e = sE.value;
      const g = Math.max(2, (Lext - Lint) / 2);
      const t = mm; // alias

      // piso de la caja
      bottom.scale.set(mm(Lext), mm(g), mm(Aext));
      bottom.position.set(0, mm(g) / 2, 0);

      // paredes: 2 en X (frente/fondo) y 2 en Z (izq/der)
      const wallH = mm(Hext);
      // frente (z+) y fondo (z-)
      walls[0].scale.set(mm(Lext), wallH, mm(g));
      walls[0].position.set(0, wallH / 2, mm(Aext) / 2 - mm(g) / 2);
      walls[1].scale.set(mm(Lext), wallH, mm(g));
      walls[1].position.set(0, wallH / 2, -mm(Aext) / 2 + mm(g) / 2);
      // laterales
      walls[2].scale.set(mm(g), wallH, mm(Aext));
      walls[2].position.set(mm(Lext) / 2 - mm(g) / 2, wallH / 2, 0);
      walls[3].scale.set(mm(g), wallH, mm(Aext));
      walls[3].position.set(-mm(Lext) / 2 + mm(g) / 2, wallH / 2, 0);

      edges.scale.set(mm(Lext), wallH, mm(Aext));
      edges.position.set(0, wallH / 2, 0);

      // tabiques (colmena) — altura 72% de Hint
      const divH = mm(Hint) * 0.72;
      const divY = mm(g) + divH / 2;
      const colW = mm(Lint) / nl;     // ancho de celda en X
      const rowW = mm(Aint) / na;     // ancho de celda en Z
      const x0 = -mm(Lint) / 2;
      const z0 = -mm(Aint) / 2;
      const eW = mm(e);
      let di = 0;
      // tabiques entre columnas (planos en YZ), abarcan Aint en Z
      for (let i = 1; i < nl; i++) {
        const m = dividers[di++];
        m.scale.set(eW, divH, mm(Aint));
        m.position.set(x0 + colW * i, divY, 0);
      }
      // tabiques entre filas (planos en XY), abarcan Lint en X
      for (let j = 1; j < na; j++) {
        const m = dividers[di++];
        m.scale.set(mm(Lint), divH, eW);
        m.position.set(0, divY, z0 + rowW * j);
      }

      // botellas
      let bi = 0;
      for (let j = 0; j < na; j++) {
        for (let i = 0; i < nl; i++) {
          const b = bottles[bi++];
          const x = x0 + colW * (i + 0.5);
          const z = z0 + rowW * (j + 0.5);
          b.position.set(x, mm(g), z);
          b.scale.set(mm(D), mm(H), mm(D));
        }
      }

      if (firstFrame) {
        const bb = new THREE.Box3(
          new THREE.Vector3(-mm(Lext) / 2, 0, -mm(Aext) / 2),
          new THREE.Vector3(mm(Lext) / 2, mm(Hext), mm(Aext) / 2)
        );
        stage.frameObject(bb, 1.08);
        firstFrame = false;
      }
    }

    stage.onTick(() => {
      const k = 0.16;
      sLint.step(k); sAint.step(k); sHint.step(k);
      sLext.step(k); sAext.step(k); sHext.step(k);
      sD.step(k); sH.step(k); sE.step(k);
      layout();
    });

    function show(v) { root.visible = v; }
    function reframe() { firstFrame = true; }

    return { update, show, reframe, root };
  }

  window.BoxViz = { create };
})();
