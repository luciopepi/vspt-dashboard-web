/* ============================================================
   VSPT · Motor de cálculo Cajas & Pallets
   Implementa las fórmulas del "Manual de Diseño de Cajas v1.1"
   (Operaciones San Juan / Graffigna)
   Todas las medidas en milímetros salvo que se indique.
   ============================================================ */
(function () {
  "use strict";

  /* ---- Catálogo de botellas (desde js/bottles.js · Excel FLC-ESP-CAL-010) ----
     Fallback a presets básicos si el catálogo no cargó. */
  const BOTTLES = window.BOTTLE_CATALOG || {
    bordelesa: { label: "Bordelesa", cap: 750, D: 75, H: 320, glassG: 420, glass: "#3a2616" },
    borgona:   { label: "Borgoña",   cap: 750, D: 81, H: 295, glassG: 480, glass: "#2f3a1c" },
    espumante: { label: "Espumante", cap: 750, D: 87, H: 305, glassG: 900, glass: "#23311f" },
    premium:   { label: "Premium",   cap: 750, D: 84, H: 340, glassG: 600, glass: "#241018" },
  };

  /* ---- Onda del cartón → espesor (mm) ---- */
  const FLUTE = { E: 1.5, B: 3, C: 4, BC: 6 };

  /* ---- Disposiciones válidas por cantidad de botellas ----
     cada una es [largo (n_l), ancho (n_a)] de botellas paradas */
  const LAYOUTS = {
    3:  [[3, 1]],
    6:  [[3, 2], [2, 3], [6, 1]],
    12: [[4, 3], [3, 4], [6, 2], [2, 6]],
    24: [[6, 4], [4, 6], [8, 3], [3, 8]],
  };

  /* ---- Pallets (huella P_L × P_A en mm, altura base h) ---- */
  const PALLETS = {
    americano: { label: "Americano",      L: 1200, A: 1000, h: 145 },
    euro:      { label: "Euro (EUR-EPAL)", L: 1200, A: 800,  h: 144 },
  };

  /* ---- Contenedores marítimos (medidas internas útiles, mm) ---- */
  const CONTAINERS = {
    none: { label: "Sin contenedor", L: 0, A: 0, H: 0 },
    c20:  { label: "20' Standard", L: 5898, A: 2352, H: 2393, door: 2280 },
    c40:  { label: "40' Standard", L: 12032, A: 2352, H: 2393, door: 2280 },
    c40hc:{ label: "40' High Cube", L: 12032, A: 2352, H: 2698, door: 2585 },
  };

  /* Peso lleno de una botella de vino 750 ml (vidrio + vino + corcho + etiqueta) */
  const BOTTLE_KG = 1.25;
  const BOX_TARE_KG = 0.35;   // cartón de la caja + separador
  const PALLET_KG = 22;       // pallet de madera

  const floor = Math.floor;

  /* ============================================================
     1) DISEÑO DE LA CAJA  (separador → interna → externa)
     ============================================================ */
  function computeBox(p) {
    const D = p.D;                     // diámetro botella
    const H = p.H;                     // altura botella
    const nl = p.nl, na = p.na;        // botellas a lo largo / ancho
    const e = p.e;                     // espesor separador
    const t = p.t;                     // holgura por celda
    const hTop = p.hTop;               // holgura superior
    const g = p.g;                     // espesor pared caja

    // Medida interna útil (fórmulas §02 del manual)
    const Lint = (nl * D) + ((nl - 1) * e) + (nl * t);
    const Aint = (na * D) + ((na - 1) * e) + (na * t);
    const Hint = H + hTop;

    // Medida externa (suma 2 paredes, §04)
    const Lext = Lint + 2 * g;
    const Aext = Aint + 2 * g;
    const Hext = Hint + 2 * g;

    const count = nl * na;
    // peso lleno: usa el peso por botella si viene dado (vidrio + líquido + cierre),
    // si no, cae al valor genérico de 750 ml.
    const bw = p.bottleKg || BOTTLE_KG;
    const weight = count * bw + BOX_TARE_KG;

    return {
      D, H, nl, na, count,
      Lint: round1(Lint), Aint: round1(Aint), Hint: round1(Hint),
      Lext: round1(Lext), Aext: round1(Aext), Hext: round1(Hext),
      weight: round2(weight),
    };
  }

  /* ============================================================
     2) PALLETIZADO  (verificación §04-A + capas en altura)
     ============================================================ */
  function fitLayer(PL, PA, bx, by) {
    // cuántas cajas de huella bx×by entran en PL×PA (caja sin rotar)
    const n1 = floor(PL / bx);
    const n2 = floor(PA / by);
    return { n1, n2, count: n1 * n2 };
  }

  function computePallet(p) {
    const PL = p.PL, PA = p.PA, hPallet = p.hPallet;
    const Lext = p.Lext, Aext = p.Aext, Hext = p.Hext;
    const Hestiba = p.Hestiba;
    const pattern = p.pattern;
    const P = window.Patterns;
    const ctx = { PL, PA, Lext, Aext, manualCells: p.manualCells, alternate: p.alternate !== false };

    // capa primaria + métricas
    const layer0 = P.layer(pattern, 0, ctx);
    const m0 = P.metrics(layer0, PL, PA);
    const Ncapa = m0.count;

    // capas en altura
    const usableH = Math.max(0, Hestiba - hPallet);
    const Nalto = floor(usableH / Hext);

    // total sumando cada capa (trabado/manual pueden variar)
    let total = 0, perLayerA = Ncapa, perLayerB = Ncapa;
    for (let i = 0; i < Nalto; i++) total += P.layer(pattern, i, ctx).length;
    if (Nalto >= 2) perLayerB = P.layer(pattern, 1, ctx).length;

    // etiqueta de disposición (grilla limpia para columnas/trabado)
    const B = P.best(PL, PA, Lext, Aext);
    const gw = B.rot === 0 ? Lext : Aext, gd = B.rot === 0 ? Aext : Lext;
    const gn1 = floor(PL / gw), gn2 = floor(PA / gd);
    let arrLabel;
    if (pattern === "columnas" || pattern === "trabado") arrLabel = gn1 + " × " + gn2 + " cajas/capa";
    else arrLabel = Ncapa + " cajas/capa";

    const totalBottles = total * p.bottlesPerBox;
    const stackHeight = hPallet + Nalto * Hext;
    const palletWeight = round1(total * p.boxWeight + PALLET_KG);

    return {
      PL, PA, hPallet, pattern,
      Ncapa, perLayerA, perLayerB,
      Nalto, total, arrLabel,
      totalBottles,
      eta: round1(m0.eta),
      sL: round1(m0.sL), sA: round1(m0.sA),
      overhang: round1(m0.overhang), overlap: m0.overlap,
      stackHeight: round0(stackHeight),
      palletWeight,
      valid: m0.overhang <= 0.5 && !m0.overlap && Ncapa > 0 && Nalto > 0,
    };
  }

  /* ============================================================
     3) CONTENEDOR  (cuántos pallets entran)
     ============================================================ */
  function computeContainer(c, palletRes, p) {
    if (!c || c.L === 0) return null;
    const PL = palletRes.PL, PA = palletRes.PA;
    const footprint = round0(palletRes.stackHeight);

    // dos orientaciones de la huella del pallet en el piso del contenedor
    const a = floor(c.L / PL) * floor(c.A / PA);
    const b = floor(c.L / PA) * floor(c.A / PL);
    const perFloor = Math.max(a, b);
    const orient = a >= b ? 0 : 90;

    // ¿se pueden apilar dos pallets en altura?
    const stackable = footprint > 0 && footprint * 2 <= c.H;
    const tiers = stackable ? 2 : 1;
    const totalPallets = perFloor * tiers;
    const totalBoxes = totalPallets * palletRes.total;
    const totalBottles = totalPallets * palletRes.totalBottles;

    return {
      label: c.label, L: c.L, A: c.A, H: c.H,
      perFloor, tiers, totalPallets, totalBoxes, totalBottles,
      orient, fits: footprint <= c.H,
      heightUsed: footprint * tiers,
    };
  }

  /* ---- helpers ---- */
  function round0(n) { return Math.round(n); }
  function round1(n) { return Math.round(n * 10) / 10; }
  function round2(n) { return Math.round(n * 100) / 100; }

  function defaultLayout(count) {
    return LAYOUTS[count] ? LAYOUTS[count][0] : [count, 1];
  }

  window.Engine = {
    BOTTLES, FLUTE, LAYOUTS, PALLETS, CONTAINERS,
    BOTTLE_KG, BOX_TARE_KG, PALLET_KG,
    computeBox, computePallet, computeContainer,
    defaultLayout, round0, round1, round2,
  };
})();
