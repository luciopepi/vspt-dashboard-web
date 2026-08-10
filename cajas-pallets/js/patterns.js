/* ============================================================
   VSPT · Motor de patrones de paletizado
   Cada patrón devuelve, para una capa, un array de celdas:
     { x, z, w, d, rot }   (mm, centro de la caja; origen = centro del pallet)
   x corre a lo largo de P_L ; z a lo largo de P_A
   rot = 0  → caja con su LARGO (Lext) sobre el eje X
   rot = 90 → caja rotada (Aext sobre X)
   ============================================================ */
(function () {
  "use strict";

  function grid(PL, PA, Lext, Aext, rot) {
    const bw = rot === 0 ? Lext : Aext;
    const bd = rot === 0 ? Aext : Lext;
    const n1 = Math.floor(PL / bw), n2 = Math.floor(PA / bd);
    const cells = [];
    const ox = -n1 * bw / 2 + bw / 2;
    const oz = -n2 * bd / 2 + bd / 2;
    for (let i = 0; i < n1; i++)
      for (let j = 0; j < n2; j++)
        cells.push({ x: ox + i * bw, z: oz + j * bd, w: bw, d: bd, rot });
    return cells;
  }

  function best(PL, PA, Lext, Aext) {
    const a = grid(PL, PA, Lext, Aext, 0);
    const b = grid(PL, PA, Lext, Aext, 90);
    return b.length > a.length ? { cells: b, rot: 90 } : { cells: a, rot: 0 };
  }

  /* --- Ladrillo: filas alternadas, desfase de media caja --- */
  function ladrillo(PL, PA, Lext, Aext) {
    const B = best(PL, PA, Lext, Aext);
    const rot = B.rot;
    const bw = rot === 0 ? Lext : Aext;
    const bd = rot === 0 ? Aext : Lext;
    const n2 = Math.floor(PA / bd);
    const cells = [];
    const oz = -n2 * bd / 2 + bd / 2;
    for (let j = 0; j < n2; j++) {
      const shift = (j % 2 === 1) ? bw / 2 : 0;
      // primer centro posible y cuántas caben sin sobrepasar el borde
      let x = -PL / 2 + bw / 2 + shift;
      const row = [];
      while (x + bw / 2 <= PL / 2 + 0.01) { row.push(x); x += bw; }
      // re-centrar la fila en el espacio que ocupa
      if (row.length) {
        const span = row[row.length - 1] - row[0];
        const center = (row[0] + row[row.length - 1]) / 2;
        const corr = -center; // centrar fila en 0 si quedó corrida (solo filas con shift)
        const useCorr = shift > 0 ? corr * 0.0 : 0; // mantener desfase visible
        row.forEach((cx) => cells.push({
          x: cx + useCorr, z: oz + j * bd, w: bw, d: bd, rot,
        }));
      }
    }
    return cells;
  }

  /* --- map de celdas manuales a celdas de capa --- */
  function fromManual(manualCells, Lext, Aext) {
    return (manualCells || []).map((c) => ({
      x: c.x, z: c.z,
      w: c.rot === 0 ? Lext : Aext,
      d: c.rot === 0 ? Aext : Lext,
      rot: c.rot,
    }));
  }
  function rotate180(cells) {
    return cells.map((c) => ({ x: -c.x, z: -c.z, w: c.w, d: c.d, rot: c.rot }));
  }

  /* --- API principal: celdas de una capa --- */
  function layer(id, layerIndex, ctx) {
    const { PL, PA, Lext, Aext } = ctx;
    if (id === "columnas") return best(PL, PA, Lext, Aext).cells;
    if (id === "trabado") {
      const B = best(PL, PA, Lext, Aext);
      const other = B.rot === 0 ? 90 : 0;
      return layerIndex % 2 === 0 ? B.cells : grid(PL, PA, Lext, Aext, other);
    }
    if (id === "ladrillo") return ladrillo(PL, PA, Lext, Aext);
    if (id === "manual") {
      const base = fromManual(ctx.manualCells, Lext, Aext);
      if (ctx.alternate && layerIndex % 2 === 1) return rotate180(base);
      return base;
    }
    return best(PL, PA, Lext, Aext).cells;
  }

  /* --- seed para modo manual: arrancar desde columnas --- */
  function seedManual(ctx) {
    return best(ctx.PL, ctx.PA, ctx.Lext, ctx.Aext).cells.map((c) => ({
      x: Math.round(c.x), z: Math.round(c.z), rot: c.rot,
    }));
  }

  /* --- métricas de una capa --- */
  function metrics(cells, PL, PA) {
    if (!cells.length) return { count: 0, eta: 0, overhang: 0, sL: PL, sA: PA, overlap: false };
    let r = -1e9, l = 1e9, t = -1e9, b = 1e9, area = 0;
    for (const c of cells) {
      r = Math.max(r, c.x + c.w / 2); l = Math.min(l, c.x - c.w / 2);
      t = Math.max(t, c.z + c.d / 2); b = Math.min(b, c.z - c.d / 2);
      area += c.w * c.d;
    }
    const overhang =
      Math.max(0, r - PL / 2) + Math.max(0, -PL / 2 - l) +
      Math.max(0, t - PA / 2) + Math.max(0, -PA / 2 - b);
    // solapamiento (AABB) — solo relevante en manual
    let overlap = false;
    for (let i = 0; i < cells.length && !overlap; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        const a = cells[i], c = cells[j];
        if (Math.abs(a.x - c.x) * 2 < (a.w + c.w) - 0.5 &&
            Math.abs(a.z - c.z) * 2 < (a.d + c.d) - 0.5) { overlap = true; break; }
      }
    }
    return {
      count: cells.length,
      eta: (area / (PL * PA)) * 100,
      overhang,
      sL: PL - (r - l), sA: PA - (t - b),
      overlap,
    };
  }

  window.Patterns = {
    list: [
      { id: "columnas", label: "Columnas", sub: "alineadas" },
      { id: "trabado", label: "Trabado", sub: "capas" },
      { id: "ladrillo", label: "Ladrillo", sub: "filas" },
      { id: "manual", label: "Manual", sub: "caja a caja" },
    ],
    grid, best, layer, seedManual, metrics, fromManual, rotate180,
  };
})();
