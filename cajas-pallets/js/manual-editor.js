/* ============================================================
   VSPT · Editor de planta 2D (vista superior del pallet)
   Permite armar la capa caja por caja: agregar, mover, girar, borrar.
   Coordenadas del SVG = milímetros, origen en el centro del pallet.
   ============================================================ */
(function () {
  "use strict";
  const SVGNS = "http://www.w3.org/2000/svg";
  const snap = (v) => Math.round(v / 5) * 5;
  const clamp = (v, half, P) => Math.max(-P / 2 + half, Math.min(P / 2 - half, v));

  function create(host) {
    host.classList.add("editor2d");
    host.innerHTML = `
      <div class="ed-toolbar">
        <div class="ed-tools" id="ed-tools">
          <button data-tool="mover" class="active">Mover / Girar</button>
          <button data-tool="agregar">+ Agregar</button>
          <button data-tool="borrar">Borrar</button>
        </div>
        <div class="ed-actions">
          <button id="ed-auto">Auto-llenar</button>
          <button id="ed-clear">Vaciar</button>
          <label class="ed-check"><input type="checkbox" id="ed-mirror" checked>
            <span>Capas pares espejadas</span></label>
          <label class="ed-check ed-free"><input type="checkbox" id="ed-free">
            <span>Modo libre (sin restricciones)</span></label>
        </div>
      </div>
      <div class="ed-canvas"><svg id="ed-svg"></svg></div>
      <div class="ed-foot">
        <div class="ed-readout" id="ed-readout"></div>
        <div class="ed-hint" id="ed-hint">Arrastrá una caja: se <b>pega</b> y se alinea con las demás · tocala para <b>girarla</b></div>
      </div>`;

    const svg = host.querySelector("#ed-svg");
    const readout = host.querySelector("#ed-readout");
    const hint = host.querySelector("#ed-hint");

    let opts = null;          // contexto actual
    let cells = [];           // [{x,z,rot}]
    let tool = "mover";
    let freeMode = false;     // sin restricciones: permite superposición y exceder el pallet
    let drag = null;          // {i, startX, startY, moved}
    let snapGuides = [];      // líneas guía mientras se arrastra

    /* ---- tools ---- */
    host.querySelectorAll("#ed-tools button").forEach((b) => {
      b.addEventListener("click", () => {
        tool = b.dataset.tool;
        host.querySelectorAll("#ed-tools button").forEach((x) =>
          x.classList.toggle("active", x === b));
        hint.innerHTML = tool === "agregar"
          ? "Tocá el pallet para <b>colocar</b> una caja"
          : tool === "borrar"
          ? "Tocá una caja para <b>borrarla</b>"
          : "Arrastrá una caja: se <b>pega</b> y se alinea con las demás · tocala para <b>girarla</b>";
      });
    });
    host.querySelector("#ed-auto").addEventListener("click", () => {
      if (!opts) return;
      cells = window.Patterns.seedManual(ctxOf(opts));
      commit();
    });
    host.querySelector("#ed-clear").addEventListener("click", () => {
      cells = []; commit();
    });
    host.querySelector("#ed-mirror").addEventListener("change", (e) => {
      if (opts && opts.onAlternate) opts.onAlternate(e.target.checked);
    });
    host.querySelector("#ed-free").addEventListener("change", (e) => {
      freeMode = e.target.checked;
      host.classList.toggle("freemode", freeMode);
      hint.innerHTML = freeMode
        ? "<b>Modo libre activo:</b> las cajas pueden superponerse y sobresalir del pallet"
        : tool === "agregar"
        ? "Tocá el pallet para <b>colocar</b> una caja"
        : tool === "borrar"
        ? "Tocá una caja para <b>borrarla</b>"
        : "Arrastrá una caja: se <b>pega</b> y se alinea con las demás · tocala para <b>girarla</b>";
      if (opts) draw();
    });

    // clamp que respeta el modo libre (sin restricción de borde del pallet)
    function clampF(v, half, P) { return freeMode ? v : clamp(v, half, P); }

    function ctxOf(o) { return { PL: o.PL, PA: o.PA, Lext: o.Lext, Aext: o.Aext }; }
    function dims(rot) {
      return rot === 0 ? [opts.Lext, opts.Aext] : [opts.Aext, opts.Lext];
    }
    function ptOf(e) {
      const p = svg.createSVGPoint();
      p.x = e.clientX; p.y = e.clientY;
      const m = svg.getScreenCTM().inverse();
      const r = p.matrixTransform(m);
      return { x: r.x, z: r.y };
    }
    function hit(x, z) {
      for (let i = cells.length - 1; i >= 0; i--) {
        const [w, d] = dims(cells[i].rot);
        if (Math.abs(x - cells[i].x) <= w / 2 && Math.abs(z - cells[i].z) <= d / 2) return i;
      }
      return -1;
    }
    /* ¿la caja en (x,z) con dims (w,d) se superpone con alguna otra?
       (excluye el índice `self`; el contacto borde-con-borde NO cuenta como superposición) */
    function overlapsAny(self, x, z, w, d) {
      if (freeMode) return false;   // modo libre: se permite la superposición
      const hw = w / 2, hd = d / 2, EPS = 0.5;
      for (let j = 0; j < cells.length; j++) {
        if (j === self) continue;
        const [wj, dj] = dims(cells[j].rot);
        if (Math.abs(x - cells[j].x) < hw + wj / 2 - EPS &&
            Math.abs(z - cells[j].z) < hd + dj / 2 - EPS) return true;
      }
      return false;
    }

    /* Imán: ajusta (rawX,rawZ) a los bordes del pallet y de las cajas vecinas
       para que se peguen y se alineen. Si no hay nada cerca, cae a la grilla de 5 mm. */
    function snapPosition(self, rawX, rawZ, w, d) {
      const hw = w / 2, hd = d / 2;
      const TH = 14;                       // umbral magnético (mm)
      const xC = [-opts.PL / 2 + hw, opts.PL / 2 - hw, 0];   // paredes + centro
      const zC = [-opts.PA / 2 + hd, opts.PA / 2 - hd, 0];
      for (let j = 0; j < cells.length; j++) {
        if (j === self) continue;
        const [wj, dj] = dims(cells[j].rot);
        const hwj = wj / 2, hdj = dj / 2, xj = cells[j].x, zj = cells[j].z;
        // pegado lateral + alineación de bordes/centro
        xC.push(xj - hwj - hw, xj + hwj + hw, xj, xj - hwj + hw, xj + hwj - hw);
        zC.push(zj - hdj - hd, zj + hdj + hd, zj, zj - hdj + hd, zj + hdj - hd);
      }
      let x = null, bdX = TH;
      for (const c of xC) { const dd = Math.abs(rawX - c); if (dd < bdX) { bdX = dd; x = c; } }
      let z = null, bdZ = TH;
      for (const c of zC) { const dd = Math.abs(rawZ - c); if (dd < bdZ) { bdZ = dd; z = c; } }
      const gx = x !== null ? x : snap(rawX);
      const gz = z !== null ? z : snap(rawZ);
      return {
        x: clampF(gx, hw, opts.PL), z: clampF(gz, hd, opts.PA),
        snapX: x !== null, snapZ: z !== null
      };
    }

    /* líneas guía (en los bordes pegados) para feedback visual */
    function buildGuides(sp, w, d) {
      const g = [], hw = w / 2, hd = d / 2;
      if (sp.snapX) { g.push({ o: "v", p: sp.x - hw }); g.push({ o: "v", p: sp.x + hw }); }
      if (sp.snapZ) { g.push({ o: "h", p: sp.z - hd }); g.push({ o: "h", p: sp.z + hd }); }
      return g;
    }

    function addBox(x, z) {
      let rot = 0, w = opts.Lext, d = opts.Aext;
      if (!(opts.Lext <= opts.PL && opts.Aext <= opts.PA)) {
        if (opts.Aext <= opts.PL && opts.Lext <= opts.PA) { rot = 90; w = opts.Aext; d = opts.Lext; }
        else if (!freeMode) return;   // no entra en el pallet (salvo modo libre)
      }
      // colocar pegado a los vecinos, sin permitir superposición
      const sp = snapPosition(-1, x, z, w, d);
      let px = sp.x, pz = sp.z;
      if (overlapsAny(-1, px, pz, w, d)) {
        px = clampF(snap(x), w / 2, opts.PL);
        pz = clampF(snap(z), d / 2, opts.PA);
        if (overlapsAny(-1, px, pz, w, d)) return;   // no encimar
      }
      cells.push({ x: px, z: pz, rot });
    }

    /* ---- pointer ---- */
    svg.addEventListener("pointerdown", (e) => {
      if (!opts || !opts.editable) return;
      try { svg.setPointerCapture(e.pointerId); } catch (_) {}
      const { x, z } = ptOf(e);
      const i = hit(x, z);
      if (tool === "borrar") { if (i >= 0) { cells.splice(i, 1); commit(); } return; }
      if (tool === "agregar") { addBox(x, z); commit(); return; }
      // mover/girar
      if (i >= 0) drag = {
        i, startX: x, startZ: z, ox: cells[i].x, oz: cells[i].z,
        goodX: cells[i].x, goodZ: cells[i].z, moved: false
      };
    });
    svg.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const { x, z } = ptOf(e);
      if (Math.abs(x - drag.startX) > 6 || Math.abs(z - drag.startZ) > 6) drag.moved = true;
      if (drag.moved) {
        const c = cells[drag.i];
        const [w, d] = dims(c.rot);
        const rawX = drag.ox + (x - drag.startX);
        const rawZ = drag.oz + (z - drag.startZ);
        const sp = snapPosition(drag.i, rawX, rawZ, w, d);
        // imán + sin superposición: probamos el destino, luego deslizar por un eje
        if (!overlapsAny(drag.i, sp.x, sp.z, w, d)) {
          c.x = sp.x; c.z = sp.z; drag.goodX = sp.x; drag.goodZ = sp.z;
          snapGuides = buildGuides(sp, w, d);
        } else if (!overlapsAny(drag.i, sp.x, drag.goodZ, w, d)) {
          c.x = sp.x; c.z = drag.goodZ; drag.goodX = sp.x;
          snapGuides = sp.snapX ? buildGuides({ ...sp, snapZ: false }, w, d) : [];
        } else if (!overlapsAny(drag.i, drag.goodX, sp.z, w, d)) {
          c.x = drag.goodX; c.z = sp.z; drag.goodZ = sp.z;
          snapGuides = sp.snapZ ? buildGuides({ ...sp, x: drag.goodX, snapX: false }, w, d) : [];
        } else {
          c.x = drag.goodX; c.z = drag.goodZ; snapGuides = [];   // bloqueado: no encimar
        }
        draw();   // visual en vivo, sin reconstruir el 3D
      }
    });
    svg.addEventListener("pointerup", (e) => {
      if (!drag) return;
      const c = cells[drag.i];
      if (!drag.moved) {
        // tap → girar 90° (sólo si no provoca superposición)
        const nrot = c.rot === 0 ? 90 : 0;
        const [w, d] = dims(nrot);
        const nx = clampF(c.x, w / 2, opts.PL);
        const nz = clampF(c.z, d / 2, opts.PA);
        if (!overlapsAny(drag.i, nx, nz, w, d)) { c.rot = nrot; c.x = nx; c.z = nz; }
      }
      drag = null;
      snapGuides = [];
      commit();
    });
    svg.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (!opts || !opts.editable) return;
      const { x, z } = ptOf(e);
      const i = hit(x, z);
      if (i >= 0) { cells.splice(i, 1); commit(); }
    });

    function commit() {
      if (opts && opts.onChange) opts.onChange(cells.map((c) => ({ x: c.x, z: c.z, rot: c.rot })));
      draw();
    }

    /* ---- render ---- */
    function render(o) {
      opts = o;
      if (!drag) cells = (o.cells || []).map((c) => ({ x: c.x, z: c.z, rot: c.rot }));
      host.querySelector("#ed-mirror").checked = o.alternate !== false;
      host.classList.toggle("readonly", !o.editable);
      draw();
    }

    function draw() {
      if (!opts) return;
      const { PL, PA } = opts;
      const pad = 90;
      const vbW = PL + pad * 2, vbH = PA + pad * 2;
      svg.setAttribute("viewBox", `${-vbW / 2} ${-vbH / 2} ${vbW} ${vbH}`);

      // métricas (locales para feedback inmediato)
      const layerCells = window.Patterns.fromManual(cells, opts.Lext, opts.Aext);
      const m = window.Patterns.metrics(layerCells, PL, PA);

      let s = "";
      // sombra pallet
      s += `<rect x="${-PL / 2 - 14}" y="${-PA / 2 - 14}" width="${PL + 28}" height="${PA + 28}" rx="18" fill="#00000010"/>`;
      // pallet
      s += `<rect x="${-PL / 2}" y="${-PA / 2}" width="${PL}" height="${PA}" rx="10"
              fill="#EBDFC6" stroke="#4E1742" stroke-width="6"/>`;
      // tablas (líneas decorativas)
      for (let k = 1; k < 7; k++) {
        const x = -PL / 2 + (PL / 7) * k;
        s += `<line x1="${x}" y1="${-PA / 2}" x2="${x}" y2="${PA / 2}" stroke="#4E1742" stroke-opacity="0.08" stroke-width="3"/>`;
      }
      // cajas
      cells.forEach((c, i) => {
        const [w, d] = dims(c.rot);
        const x = c.x - w / 2, y = c.z - d / 2;
        // overlap?
        let bad = false;
        if (!freeMode) for (let j = 0; j < cells.length; j++) {
          if (j === i) continue;
          const [w2, d2] = dims(cells[j].rot);
          if (Math.abs(c.x - cells[j].x) * 2 < (w + w2) - 1 &&
              Math.abs(c.z - cells[j].z) * 2 < (d + d2) - 1) { bad = true; break; }
        }
        const fill = bad ? "#F4C9CE" : (i % 2 ? "#D7B57E" : "#CDA86E");
        const stroke = bad ? "#D81840" : "#4E1742";
        s += `<g data-i="${i}">
          <rect x="${x}" y="${y}" width="${w}" height="${d}" rx="6"
            fill="${fill}" stroke="${stroke}" stroke-width="4"/>`;
        // marca de orientación (lado "frente")
        if (c.rot === 0)
          s += `<line x1="${c.x - w * 0.32}" y1="${c.z}" x2="${c.x + w * 0.32}" y2="${c.z}" stroke="#4E1742" stroke-opacity="0.45" stroke-width="5" stroke-linecap="round"/>`;
        else
          s += `<line x1="${c.x}" y1="${c.z - d * 0.32}" x2="${c.x}" y2="${c.z + d * 0.32}" stroke="#4E1742" stroke-opacity="0.45" stroke-width="5" stroke-linecap="round"/>`;
        s += `</g>`;
      });
      // guías de alineación (mientras se arrastra y hay imán activo)
      snapGuides.forEach((g) => {
        if (g.o === "v")
          s += `<line x1="${g.p}" y1="${-PA / 2 - 34}" x2="${g.p}" y2="${PA / 2 + 34}" stroke="#D81840" stroke-width="2.5" stroke-dasharray="7 9" stroke-opacity="0.8"/>`;
        else
          s += `<line x1="${-PL / 2 - 34}" y1="${g.p}" x2="${PL / 2 + 34}" y2="${g.p}" stroke="#D81840" stroke-width="2.5" stroke-dasharray="7 9" stroke-opacity="0.8"/>`;
      });
      // cotas
      s += `<text x="0" y="${PA / 2 + 64}" text-anchor="middle" font-size="42" font-weight="700" fill="#5A4456" font-family="Montserrat">P_L = ${Math.round(PL)} mm</text>`;
      s += `<text x="${-PL / 2 - 30}" y="0" text-anchor="middle" font-size="42" font-weight="700" fill="#5A4456" font-family="Montserrat" transform="rotate(-90 ${-PL / 2 - 30} 0)">P_A = ${Math.round(PA)} mm</text>`;
      svg.innerHTML = s;

      // readout
      const etaCol = m.eta >= 90 ? "#5c6219" : m.eta >= 75 ? "#8a4e06" : "#D81840";
      readout.innerHTML =
        `<b>${m.count}</b> cajas/capa · η <b style="color:${etaCol}">${m.eta.toFixed(0)}%</b>` +
        (freeMode ? ` · <b style="color:#8a4e06">modo libre</b>`
          : m.overlap ? ` · <b style="color:#D81840">cajas superpuestas</b>` : "");
    }

    return { render };
  }

  window.ManualEditor = { create };
})();
