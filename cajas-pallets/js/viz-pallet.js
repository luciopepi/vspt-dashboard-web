/* ============================================================
   VSPT · Visualización 3D — Pallet & Contenedor
   ============================================================ */
(function () {
  "use strict";
  const { mm, kraftMaterial, woodMaterial, makeSpring } = window.SceneKit;

  function create(stage) {
    const root = new THREE.Group();
    stage.content.add(root);

    const palletGrp = new THREE.Group();   // madera
    const boxGrp = new THREE.Group();       // cajas (modo pallet)
    const contGrp = new THREE.Group();      // contenedor + pallets proxy
    root.add(palletGrp, boxGrp, contGrp);

    const boxMat = kraftMaterial("#c9a972");
    const boxMatB = kraftMaterial("#bd9456");  // capa alterna (trabado)
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x4e1742, transparent: true, opacity: 0.5 });

    let boxes = [];            // {mesh, edge, baseY, delay}
    const reveal = makeSpring(0);
    let firstFrame = true;

    /* ---------- madera del pallet ---------- */
    function buildPallet(PL, PA, hP) {
      clearGroup(palletGrp);
      const wood = woodMaterial();
      const thk = 22, blockH = Math.max(60, hP - thk * 2);
      const sx = mm(PL), sz = mm(PA);

      // top deck: 7 tablas que abarcan PA (Z), distribuidas en X
      const nTop = 7, boardW = mm(PL) / (nTop + (nTop - 1) * 0.32);
      const gap = boardW * 0.32;
      for (let i = 0; i < nTop; i++) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(boardW, mm(thk), sz), wood);
        b.castShadow = true; b.receiveShadow = true;
        const x = -sx / 2 + boardW / 2 + i * (boardW + gap);
        b.position.set(x, mm(hP) - mm(thk) / 2, 0);
        palletGrp.add(b);
      }
      // bottom: 3 tablas
      for (let i = 0; i < 3; i++) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(mm(120), mm(thk), sz), wood);
        b.castShadow = true; b.receiveShadow = true;
        const x = (-sx / 2 + mm(60)) + i * ((sx - mm(120)) / 2);
        b.position.set(x, mm(thk) / 2, 0);
        palletGrp.add(b);
      }
      // 9 bloques (3×3)
      for (let ix = 0; ix < 3; ix++) {
        for (let iz = 0; iz < 3; iz++) {
          const blk = new THREE.Mesh(
            new THREE.BoxGeometry(mm(120), mm(blockH), mm(120)),
            new THREE.MeshStandardMaterial({ color: "#b3854c", roughness: 0.9 })
          );
          blk.castShadow = true;
          const x = (-sx / 2 + mm(60)) + ix * ((sx - mm(120)) / 2);
          const z = (-sz / 2 + mm(60)) + iz * ((sz - mm(120)) / 2);
          blk.position.set(x, mm(thk) + mm(blockH) / 2, z);
          palletGrp.add(blk);
        }
      }
    }

    /* ---------- cajas apiladas (modo pallet) ---------- */
    function buildBoxes(res, opts) {
      clearGroup(boxGrp);
      boxes = [];
      const { PL, PA, hPallet } = res;
      const { Lext, Aext, Hext } = opts;
      const pattern = opts.pattern;
      const Nalto = res.Nalto;
      const ctx = {
        PL, PA, Lext, Aext,
        manualCells: opts.manualCells, alternate: opts.alternate !== false,
      };

      let idx = 0;
      for (let layer = 0; layer < Nalto; layer++) {
        const cells = window.Patterns.layer(pattern, layer, ctx);
        const y0 = mm(hPallet) + mm(Hext) * layer;
        const mat = layer % 2 === 1 ? boxMatB : boxMat;
        for (const c of cells) {
          const g = new THREE.BoxGeometry(mm(c.w) * 0.985, mm(Hext) * 0.99, mm(c.d) * 0.985);
          const m = new THREE.Mesh(g, mat);
          m.castShadow = true; m.receiveShadow = true;
          m.position.set(mm(c.x), y0 + mm(Hext) / 2, mm(c.z));
          const e = new THREE.LineSegments(new THREE.EdgesGeometry(g), edgeMat);
          e.position.copy(m.position);
          boxGrp.add(m, e);
          boxes.push({ mesh: m, edge: e, baseY: m.position.y, delay: layer * 0.12 + idx * 0.004 });
          idx++;
        }
      }
      reveal.jump(0); reveal.set(1);
    }

    /* ---------- contenedor con pallets proxy ---------- */
    function buildContainer(cont, res, opts) {
      clearGroup(contGrp);
      if (!cont) return;
      const { PL, PA } = res;
      const stackH = res.stackHeight;
      const ori = cont.orient;
      const pBx = ori === 0 ? PL : PA;
      const pBy = ori === 0 ? PA : PL;
      const n1 = Math.floor(cont.L / pBx);
      const n2 = Math.floor(cont.A / pBy);

      // shell del contenedor (translúcido, frente abierto)
      const cl = mm(cont.L), cw = mm(cont.A), ch = mm(cont.H);
      const shellMat = new THREE.MeshStandardMaterial({
        color: "#9aa6b2", roughness: 0.6, metalness: 0.3,
        transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false,
      });
      const shell = new THREE.Mesh(new THREE.BoxGeometry(cl, ch, cw), shellMat);
      shell.position.set(0, ch / 2, 0);
      contGrp.add(shell);
      const cont3 = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(cl, ch, cw)),
        new THREE.LineBasicMaterial({ color: 0x3a4654 })
      );
      cont3.position.set(0, ch / 2, 0);
      contGrp.add(cont3);

      // piso
      const fl = new THREE.Mesh(new THREE.BoxGeometry(cl, mm(40), cw),
        new THREE.MeshStandardMaterial({ color: "#6f7a86", roughness: 0.9 }));
      fl.position.set(0, -mm(20), 0); fl.receiveShadow = true;
      contGrp.add(fl);

      const proxyMat = kraftMaterial("#c9a972");
      const proxyEdge = new THREE.LineBasicMaterial({ color: 0x4e1742, transparent: true, opacity: 0.4 });
      const palMat = new THREE.MeshStandardMaterial({ color: "#b3854c", roughness: 0.9 });
      const tiers = cont.tiers;
      const usedW = n1 * pBx, usedD = n2 * pBy;
      const ox = -mm(usedW) / 2, oz = -mm(usedD) / 2;
      for (let t = 0; t < tiers; t++) {
        for (let i = 0; i < n1; i++) {
          for (let j = 0; j < n2; j++) {
            const x = ox + mm(pBx) * (i + 0.5);
            const z = oz + mm(pBy) * (j + 0.5);
            const y0 = t * mm(stackH);
            // base pallet
            const pal = new THREE.Mesh(
              new THREE.BoxGeometry(mm(pBx) * 0.97, mm(res.hPallet), mm(pBy) * 0.97), palMat);
            pal.position.set(x, y0 + mm(res.hPallet) / 2, z);
            pal.castShadow = true;
            contGrp.add(pal);
            // bloque de cajas
            const bh = mm(stackH - res.hPallet);
            const g = new THREE.BoxGeometry(
              mm(ori === 0 ? PL : PA) * 0.95, bh, mm(ori === 0 ? PA : PL) * 0.95);
            const m = new THREE.Mesh(g, proxyMat);
            m.position.set(x, y0 + mm(res.hPallet) + bh / 2, z);
            m.castShadow = true;
            const e = new THREE.LineSegments(new THREE.EdgesGeometry(g), proxyEdge);
            e.position.copy(m.position);
            contGrp.add(m, e);
          }
        }
      }
    }

    /* ---------- API ---------- */
    let mode = "pallet";
    function update(res, opts) {
      mode = opts.viewMode || "pallet";
      if (mode === "contenedor" && opts.container) {
        palletGrp.visible = false; boxGrp.visible = false; contGrp.visible = true;
        buildContainer(opts.container, res, opts);
        if (firstFrame || opts.reframe) frame(true);
      } else {
        palletGrp.visible = true; boxGrp.visible = true; contGrp.visible = false;
        buildPallet(res.PL, res.PA, res.hPallet);
        buildBoxes(res, opts);
        if (firstFrame || opts.reframe) frame(false);
      }
      firstFrame = false;
    }

    function frame(isContainer) {
      const bb = new THREE.Box3();
      if (isContainer) {
        contGrp.updateMatrixWorld(true);
        bb.setFromObject(contGrp);
      } else {
        // SÓLO pallet + cajas — el contenedor (oculto) puede tener geometría vieja
        // que infla el bounding box y dejaría el pallet diminuto.
        palletGrp.updateMatrixWorld(true);
        boxGrp.updateMatrixWorld(true);
        bb.setFromObject(palletGrp);
        const bb2 = new THREE.Box3().setFromObject(boxGrp);
        if (!bb2.isEmpty()) bb.union(bb2);
      }
      if (bb.isEmpty()) return;
      stage.frameObject(bb, isContainer ? 1.04 : 1.08);
    }

    stage.onTick(() => {
      const r = reveal.step(0.08);
      if (mode === "pallet") {
        for (const b of boxes) {
          const local = Math.min(1, Math.max(0, (r - b.delay) / 0.18));
          const eased = local < 0 ? 0 : 1 - Math.pow(1 - local, 3);
          b.mesh.visible = local > 0;
          b.edge.visible = local > 0.05;
          const s = 0.6 + 0.4 * eased;
          b.mesh.scale.set(1, eased < 0.02 ? 0.02 : eased, 1);
          b.edge.scale.copy(b.mesh.scale);
          const dropY = b.baseY + (1 - eased) * mm(120);
          b.mesh.position.y = dropY;
          b.edge.position.y = dropY;
        }
      }
    });

    function show(v) { root.visible = v; }
    function reframe() { firstFrame = true; }
    return { update, show, reframe, root };
  }

  function clearGroup(g) {
    while (g.children.length) {
      const c = g.children.pop();
      if (c.geometry) c.geometry.dispose();
      g.remove(c);
    }
  }

  window.PalletViz = { create };
})();
