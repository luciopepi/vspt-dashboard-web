/* ============================================================
   VSPT · WebApp Cajas & Pallets — app / wiring
   ============================================================ */
(function () {
  "use strict";
  const E = window.Engine;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const fmt = (n) => Number(n).toLocaleString("es-AR");

  /* ---------------- estado ---------------- */
  const state = {
    box: {
      preset: "bordelesa", D: 75, H: 320, glass: "#3a2616", bottleKg: null,
      count: 6, nl: 3, na: 2, e: 3, flute: "B", t: 2, hTop: 5, g: 3.5,
    },
    pallet: {
      overridden: false,
      Lext: 244, Aext: 164, Hext: 312,
      key: "americano", PL: 1200, PA: 1000, hPallet: 145,
      Hestiba: 1450, pattern: "trabado", container: "none", viewMode: "pallet",
      manualCells: [], alternate: true,
    },
  };
  let lastBox = null;

  /* ---------------- builders de segmentos ---------------- */
  function seg(host, items, getActive, onPick) {
    host.innerHTML = "";
    items.forEach((it) => {
      const b = document.createElement("button");
      b.innerHTML = it.sub ? `${it.label}<small>${it.sub}</small>` : it.label;
      if (getActive() === it.value) b.classList.add("active");
      b.addEventListener("click", () => { onPick(it.value); });
      host.appendChild(b);
    });
  }
  function setActive(host, value) {
    $$("button", host).forEach((b, i) => {
      b.classList.toggle("active", host._vals && host._vals[i] === value);
    });
  }

  /* =========================================================
     PESTAÑA CAJA
     ========================================================= */
  function buildBoxControls() {
    // catálogo de botellas (dropdown)
    buildBottleSelect();

    // cantidad
    seg($("#count-seg"), [3, 6, 12, 24].map((n) => ({ value: n, label: n })),
      () => state.box.count, (v) => {
        state.box.count = v;
        const d = E.defaultLayout(v);
        state.box.nl = d[0]; state.box.na = d[1];
        buildDispSeg();
        refreshBox();
      });

    buildDispSeg();

    // onda separador
    const flutes = [
      { value: "E", label: "E", sub: "1,5 mm" },
      { value: "B", label: "B", sub: "3 mm" },
      { value: "C", label: "C", sub: "4 mm" },
    ];
    seg($("#flute-seg"), flutes, () => state.box.flute, (v) => {
      state.box.flute = v; state.box.e = E.FLUTE[v];
      $("#n-e").value = String(E.FLUTE[v]).replace(".", ",");
      refreshBox();
    });
    // espesor del separador a mano (incluido 0 = sin separador)
    $("#n-e").addEventListener("input", () => {
      let val = parseFloat(String($("#n-e").value).replace(",", "."));
      if (isNaN(val)) return;
      if (val < 0) val = 0;
      state.box.e = val;
      state.box.flute = "custom";
      refreshBox();
    });
    $("#n-e").addEventListener("blur", () => {
      $("#n-e").value = String(state.box.e).replace(".", ",");
    });
    updateFluteLabel();

    // sliders
    bindSlider("#r-D", "#v-D", (v) => { state.box.D = v; markCustomBottle(); refreshBox(); });
    bindSlider("#r-H", "#v-H", (v) => { state.box.H = v; markCustomBottle(); refreshBox(); });
    bindSlider("#r-t", "#v-t", (v) => { state.box.t = v; refreshBox(); }, true);
    bindSlider("#r-top", "#v-top", (v) => { state.box.hTop = v; refreshBox(); });
    bindSlider("#r-g", "#v-g", (v) => { state.box.g = v; refreshBox(); }, true);

    $("#to-pallet").addEventListener("click", () => {
      pushBoxToPallet(true);
      switchTab("pallet");
    });
  }

  /* ---- catálogo de botellas (dropdown) ---- */
  function fmtmm(v) { return String(Math.round(v * 10) / 10).replace(".", ","); }
  function capLabel(c) { return c >= 1000 ? String(c / 1000).replace(".", ",") + " L" : c + " ml"; }
  function bottleFullKg(b) {
    // peso lleno ≈ vidrio + líquido (≈1 g/ml) + cápsula/cierre (~12 g)
    return ((b.glassG || 0) + (b.cap || 750) + 12) / 1000;
  }
  function markCustomBottle() { state.box.preset = "custom"; state.box.bottleKg = null; }

  function buildBottleSelect() {
    const sel = $("#bottle-presets");
    sel.innerHTML = "";
    const groups = {};
    Object.entries(E.BOTTLES).forEach(([k, v]) => {
      const cap = v.cap || 750;
      (groups[cap] = groups[cap] || []).push([k, v]);
    });
    Object.keys(groups).map(Number).sort((a, b) => a - b).forEach((cap) => {
      const og = document.createElement("optgroup");
      og.label = `${capLabel(cap)} · ${groups[cap].length} ${groups[cap].length === 1 ? "botella" : "botellas"}`;
      groups[cap].sort((a, b) => a[1].label.localeCompare(b[1].label));
      groups[cap].forEach(([k, v]) => {
        const o = document.createElement("option");
        o.value = k;
        o.textContent = `${v.label}  ·  Ø${fmtmm(v.D)}×${v.H}`;
        og.appendChild(o);
      });
      sel.appendChild(og);
    });
    const ogc = document.createElement("optgroup");
    ogc.label = "Personalizada";
    const oc = document.createElement("option");
    oc.value = "custom"; oc.textContent = "Medidas a mano (sliders)";
    ogc.appendChild(oc); sel.appendChild(ogc);

    const valid = (state.box.preset in E.BOTTLES) ? state.box.preset : Object.keys(E.BOTTLES)[0];
    setBottleState(valid, false);
    sel.value = valid;
    sel.addEventListener("change", () => setBottleState(sel.value, true));
  }

  function setBottleState(v, refresh) {
    if (v === "custom") {
      markCustomBottle(); updateBottleMeta();
      if (refresh) refreshBox();
      return;
    }
    const b = E.BOTTLES[v];
    state.box.preset = v; state.box.D = b.D; state.box.H = b.H; state.box.glass = b.glass;
    state.box.bottleKg = bottleFullKg(b);
    $("#r-D").value = b.D; $("#r-H").value = b.H;
    $("#v-D").textContent = fmtmm(b.D); $("#v-H").textContent = b.H;
    paintRange("#r-D"); paintRange("#r-H");
    updateBottleMeta();
    if (refresh) refreshBox();
  }

  function updateBottleMeta() {
    const v = state.box.preset, meta = $("#bottle-meta"), code = $("#bottle-code");
    if (v === "custom" || !(v in E.BOTTLES)) {
      code.textContent = ""; meta.textContent = "Medidas ingresadas a mano.";
      return;
    }
    const b = E.BOTTLES[v];
    code.textContent = v;
    meta.innerHTML = `<b>${capLabel(b.cap)}</b> · vidrio ${b.glassG} g · ` +
      `llena ≈ ${bottleFullKg(b).toFixed(2).replace(".", ",")} kg`;
  }

  function buildDispSeg() {
    const host = $("#disp-seg");
    const opts = (E.LAYOUTS[state.box.count] || [[state.box.count, 1]]).map((d) => ({
      value: d.join("x"), label: `${d[0]} × ${d[1]}`,
    }));
    seg(host, opts, () => `${state.box.nl}x${state.box.na}`, (v) => {
      const [a, b] = v.split("x").map(Number);
      state.box.nl = a; state.box.na = b;
      refreshBox();
    });
    host.classList.toggle("wrap", opts.length > 3);
  }

  function clearActive(sel) { $$("button", $(sel)).forEach((b) => b.classList.remove("active")); }

  function updateFluteLabel() {
    const emm = String(Math.round(state.box.e * 10) / 10).replace(".", ",");
    $("#flute-label").textContent = state.box.flute === "custom"
      ? `a medida · ${emm} mm`
      : `${state.box.flute} · ${emm} mm`;
    if (document.activeElement !== $("#n-e")) $("#n-e").value = emm;
  }

  function bindSlider(rsel, vsel, fn, comma) {
    const r = $(rsel), v = $(vsel);
    const isInput = v.tagName === "INPUT";
    const show = (val) => comma ? String(val).replace(".", ",") : String(val);
    const paintBar = (val) => {
      const min = +r.min, max = +r.max;
      const cl = Math.max(min, Math.min(max, val));
      r.style.backgroundSize = ((cl - min) / (max - min)) * 100 + "% 100%";
    };
    const paint = () => {
      const val = +r.value;
      paintBar(val);
      if (isInput) { if (document.activeElement !== v) v.value = show(val); }
      else v.textContent = show(val);
    };
    r.addEventListener("input", () => { paint(); fn(parseFloat(r.value)); });
    if (isInput) {
      // edición a mano: acepta cualquier valor (incl. 0); expande el rango del slider si hace falta
      v.addEventListener("input", () => {
        let val = parseFloat(String(v.value).replace(",", "."));
        if (isNaN(val)) return;          // mientras siguen tipeando
        if (val < 0) val = 0;
        if (val > +r.max) r.max = val;
        if (val < +r.min) r.min = val;
        r.value = val;
        paintBar(val);
        fn(val);
      });
      v.addEventListener("blur", () => {
        let val = parseFloat(String(v.value).replace(",", "."));
        if (isNaN(val)) val = +r.value;
        if (val < 0) val = 0;
        v.value = show(val);
      });
    }
    paint();
  }

  /* ---- recompute caja ---- */
  function refreshBox() {
    // mantener seg activos
    $("#bottle-presets").value = (state.box.preset in E.BOTTLES) ? state.box.preset : "custom";
    updateBottleMeta();
    syncSeg("#count-seg", state.box.count, [3, 6, 12, 24]);
    refreshDispActive();
    syncSeg("#flute-seg", state.box.flute, ["E", "B", "C"]);
    updateFluteLabel();
    $("#disp-label").textContent = `${state.box.nl} × ${state.box.na}`;

    const b = E.computeBox(Object.assign({}, state.box));
    b.glass = state.box.glass;
    lastBox = b;
    drawBoxResults(b);
    boxViz.update(b, { e: state.box.e });
    if (!state.pallet.overridden) pushBoxToPallet(false);
  }

  function syncSeg(sel, value, values) {
    $$("button", $(sel)).forEach((btn, i) => btn.classList.toggle("active", values[i] === value));
  }
  function refreshDispActive() {
    const cur = `${state.box.nl} × ${state.box.na}`;
    $$("button", $("#disp-seg")).forEach((b) => b.classList.toggle("active", b.textContent === cur));
  }

  function drawBoxResults(b) {
    $("#box-stage-title").textContent = `${b.count} botellas · ${b.nl}×${b.na}`;
    $("#box-title").textContent = `${b.count} botellas · disposición ${b.nl}×${b.na}`;
    $("#box-int-dims").innerHTML =
      `${r0(b.Lint)} × ${r0(b.Aint)} × ${r0(b.Hint)} mm <span>interna útil</span>`;
    $("#box-ext-v").textContent = `${r0(b.Lext)} × ${r0(b.Aext)} × ${r0(b.Hext)}`;
    $("#s-count").textContent = b.count;
    $("#s-weight").innerHTML = `${b.weight.toFixed(1).replace(".", ",")}<u>kg</u>`;
    const volL = (b.Lint * b.Aint * b.Hint) / 1e6;
    $("#s-vol").innerHTML = `${volL.toFixed(1).replace(".", ",")}<u>L</u>`;
    const footCm = (b.Lext * b.Aext) / 100;
    $("#s-foot").innerHTML = `${fmt(Math.round(footCm))}<u>cm²</u>`;
    const cellL = Math.round(b.Lint / b.nl), cellA = Math.round(b.Aint / b.na);
    $("#f-flute").textContent = state.box.flute === "custom" ? "a medida" : state.box.flute;
    $("#f-cell").textContent = `${cellL}×${cellA} mm`;
  }

  /* =========================================================
     PESTAÑA PALLET
     ========================================================= */
  function buildPalletControls() {
    // pallet presets
    const opts = [
      { value: "americano", label: "Americano", sub: "1200×1000" },
      { value: "euro", label: "Euro", sub: "1200×800" },
      { value: "custom", label: "Personalizado", sub: "a medida" },
    ];
    seg($("#pallet-seg"), opts, () => state.pallet.key, (v) => {
      state.pallet.key = v;
      if (v !== "custom") {
        const p = E.PALLETS[v];
        state.pallet.PL = p.L; state.pallet.PA = p.A; state.pallet.hPallet = p.h;
        $("#n-PL").value = p.L; $("#n-PA").value = p.A;
        $("#r-hp").value = p.h; $("#v-hp").textContent = p.h;
        paintRange("#r-hp");
      }
      refreshPallet();
    });
    $("#pallet-seg").classList.add("wrap");

    seg($("#pattern-seg"), window.Patterns.list.map((p) => ({
      value: p.id, label: p.label, sub: p.sub,
    })), () => state.pallet.pattern, (v) => {
      state.pallet.pattern = v;
      if (v === "manual") {
        if (!state.pallet.manualCells.length) seedManual();
        setViewMode("planta");
      } else if (state.pallet.viewMode === "planta") {
        setViewMode("pallet");
      }
      buildViewmodes();
      refreshPallet();
    });
    $("#pattern-seg").classList.add("wrap");

    seg($("#cont-seg"), [
      { value: "none", label: "Ninguno" },
      { value: "c20", label: "20'", sub: "Standard" },
      { value: "c40", label: "40'", sub: "Standard" },
      { value: "c40hc", label: "40'", sub: "High Cube" },
    ], () => state.pallet.container, (v) => {
      state.pallet.container = v;
      buildViewmodes();
      if (v !== "none") setViewMode("contenedor");
      else if (state.pallet.viewMode === "contenedor") setViewMode("pallet");
      refreshPallet();
    });

    // inputs numéricos caja
    ["Lext", "Aext", "Hext"].forEach((k) => {
      const el = $("#n-" + k);
      el.addEventListener("input", () => {
        state.pallet[k] = parseFloat(el.value) || 0;
        state.pallet.overridden = true;
        $("#sync-note").innerHTML = `<b>Medidas manuales.</b> Editadas a mano (ya no siguen a la pestaña 1).`;
        refreshPallet();
      });
    });
    // inputs pallet
    $("#n-PL").addEventListener("input", () => {
      state.pallet.PL = parseFloat($("#n-PL").value) || 0; state.pallet.key = "custom";
      syncSeg("#pallet-seg", "custom", ["americano", "euro", "custom"]); refreshPallet();
    });
    $("#n-PA").addEventListener("input", () => {
      state.pallet.PA = parseFloat($("#n-PA").value) || 0; state.pallet.key = "custom";
      syncSeg("#pallet-seg", "custom", ["americano", "euro", "custom"]); refreshPallet();
    });

    bindSlider("#r-hp", "#v-hp", (v) => { state.pallet.hPallet = v; refreshPallet(); });
    bindSlider("#r-est", "#v-est", (v) => { state.pallet.Hestiba = v;
      $("#v-est").textContent = fmt(v); refreshPallet(); });
    $("#v-est").textContent = fmt(1450);

    // editor de planta 2D + viewmodes dinámicos
    editor = window.ManualEditor.create($("#layer-editor"));
    buildViewmodes();

    // configuraciones guardadas
    $("#cfg-save").addEventListener("click", saveCurrentCfg);
    $("#cfg-name").addEventListener("keydown", (e) => { if (e.key === "Enter") saveCurrentCfg(); });
    renderCfgList();
  }

  /* ---------- guardar / cargar configuraciones de paletizado ---------- */
  const CFG_KEY = "vspt_pallet_cfgs";
  function loadCfgs() { try { return JSON.parse(localStorage.getItem(CFG_KEY)) || []; } catch (_) { return []; } }
  function storeCfgs(list) { try { localStorage.setItem(CFG_KEY, JSON.stringify(list)); } catch (_) {} }
  function patLabel(id) { const x = window.Patterns.list.find((p) => p.id === id); return x ? x.label : id; }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  }

  function saveCurrentCfg() {
    const p = state.pallet;
    const nameEl = $("#cfg-name");
    let name = (nameEl.value || "").trim();
    if (!name) name = `${patLabel(p.pattern)} ${r0(p.PL)}×${r0(p.PA)}`;
    const snap = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      name, pattern: p.pattern, key: p.key, PL: p.PL, PA: p.PA, hPallet: p.hPallet,
      Hestiba: p.Hestiba, Lext: p.Lext, Aext: p.Aext, Hext: p.Hext,
      overridden: p.overridden, alternate: p.alternate, container: p.container,
      manualCells: p.manualCells.map((c) => ({ x: c.x, z: c.z, rot: c.rot })),
    };
    const list = loadCfgs();
    list.unshift(snap);
    storeCfgs(list);
    nameEl.value = "";
    renderCfgList();
  }

  function renderCfgList() {
    const host = $("#cfg-list");
    const list = loadCfgs();
    host.innerHTML = "";
    if (!list.length) {
      host.innerHTML = `<div class="cfg-empty">Todavía no guardaste ninguna configuración.</div>`;
      return;
    }
    list.forEach((c) => {
      const el = document.createElement("div");
      el.className = "cfg-item";
      const trabaTxt = (c.manualCells && c.manualCells.length)
        ? `${c.manualCells.length} cajas` : patLabel(c.pattern);
      const contTxt = (c.container && c.container !== "none") ? " · contenedor" : "";
      el.innerHTML =
        `<div class="info">
           <div class="nm">${escapeHtml(c.name)}</div>
           <div class="meta">${patLabel(c.pattern)} · ${r0(c.PL)}×${r0(c.PA)} · ${trabaTxt}${contTxt}</div>
         </div>
         <button class="load">Cargar</button>
         <button class="del" title="Borrar">×</button>`;
      el.querySelector(".info").addEventListener("click", () => applyCfg(c));
      el.querySelector(".load").addEventListener("click", () => applyCfg(c));
      el.querySelector(".del").addEventListener("click", () => {
        storeCfgs(loadCfgs().filter((x) => x.id !== c.id));
        renderCfgList();
      });
      host.appendChild(el);
    });
  }

  function applyCfg(c) {
    const p = state.pallet;
    p.pattern = c.pattern; p.key = c.key; p.PL = c.PL; p.PA = c.PA; p.hPallet = c.hPallet;
    p.Hestiba = c.Hestiba; p.Lext = c.Lext; p.Aext = c.Aext; p.Hext = c.Hext;
    p.overridden = c.overridden; p.alternate = c.alternate !== false;
    p.container = c.container || "none";
    p.manualCells = (c.manualCells || []).map((x) => ({ x: x.x, z: x.z, rot: x.rot }));

    // reflejar en los controles
    $("#n-PL").value = r0(c.PL); $("#n-PA").value = r0(c.PA);
    $("#n-Lext").value = r0(c.Lext); $("#n-Aext").value = r0(c.Aext); $("#n-Hext").value = r0(c.Hext);
    $("#r-hp").value = c.hPallet; $("#v-hp").textContent = c.hPallet; paintRange("#r-hp");
    $("#r-est").value = c.Hestiba; $("#v-est").textContent = fmt(c.Hestiba); paintRange("#r-est");
    if (p.overridden) {
      $("#sync-note").innerHTML = `<b>Medidas manuales.</b> Cargadas desde una configuración guardada.`;
    }
    syncSeg("#pallet-seg", c.key, ["americano", "euro", "custom"]);
    syncSeg("#pattern-seg", c.pattern, window.Patterns.list.map((x) => x.id));
    syncSeg("#cont-seg", p.container, ["none", "c20", "c40", "c40hc"]);
    buildViewmodes();
    setViewMode(c.pattern === "manual" ? "planta" : "pallet");
    palletViz.reframe();
    refreshPallet();
  }

  function buildViewmodes() {
    const host = $("#viewmodes");
    const items = [{ vm: "pallet", label: "3D" }];
    if (state.pallet.container !== "none") items.push({ vm: "contenedor", label: "Contenedor" });
    items.push({ vm: "planta", label: "Planta 2D" });
    host.style.display = "flex";
    host.innerHTML = "";
    items.forEach((it) => {
      const b = document.createElement("button");
      b.textContent = it.label; b.dataset.vm = it.vm;
      if (state.pallet.viewMode === it.vm) b.classList.add("active");
      b.addEventListener("click", () => setViewMode(it.vm));
      host.appendChild(b);
    });
  }

  function setViewMode(vm) {
    state.pallet.viewMode = vm;
    $$("#viewmodes button").forEach((b) => b.classList.toggle("active", b.dataset.vm === vm));
    const planta = vm === "planta";
    $("#layer-editor").classList.toggle("active", planta);
    $("#ro-banner").style.display =
      (planta && state.pallet.pattern !== "manual") ? "block" : "none";
    refreshPallet();
  }

  function seedManual() {
    const p = state.pallet;
    state.pallet.manualCells = window.Patterns.seedManual({
      PL: p.PL, PA: p.PA, Lext: p.Lext, Aext: p.Aext,
    });
  }

  function paintRange(sel) {
    const r = $(sel); const min = +r.min, max = +r.max, val = +r.value;
    r.style.backgroundSize = ((val - min) / (max - min)) * 100 + "% 100%";
  }

  function pushBoxToPallet(force) {
    if (!lastBox) return;
    if (force) state.pallet.overridden = false;
    if (state.pallet.overridden) return;
    state.pallet.Lext = lastBox.Lext;
    state.pallet.Aext = lastBox.Aext;
    state.pallet.Hext = lastBox.Hext;
    $("#n-Lext").value = r0(lastBox.Lext);
    $("#n-Aext").value = r0(lastBox.Aext);
    $("#n-Hext").value = r0(lastBox.Hext);
    $("#sync-note").innerHTML =
      `<b>Sincronizada</b> con la caja de ${lastBox.count} botellas (${lastBox.nl}×${lastBox.na}). ` +
      `Podés sobrescribir las medidas a mano.`;
    if (activeTab === "pallet") refreshPallet();
  }

  function refreshPallet(skipReframe) {
    const p = state.pallet;
    const bottlesPerBox = lastBox ? lastBox.count : 6;
    const boxWeight = lastBox ? lastBox.weight : 8;

    const res = E.computePallet({
      PL: p.PL, PA: p.PA, hPallet: p.hPallet,
      Lext: p.Lext, Aext: p.Aext, Hext: p.Hext,
      Hestiba: p.Hestiba, pattern: p.pattern,
      manualCells: p.manualCells, alternate: p.alternate,
      bottlesPerBox, boxWeight,
    });

    const contDef = E.CONTAINERS[p.container];
    const contRes = E.computeContainer(contDef, res, p);

    drawPalletResults(res, contRes, p);

    if (activeTab === "pallet") {
      if (p.viewMode === "planta") {
        const ctx = { PL: p.PL, PA: p.PA, Lext: p.Lext, Aext: p.Aext,
          manualCells: p.manualCells, alternate: p.alternate };
        const editorCells = p.pattern === "manual"
          ? p.manualCells
          : window.Patterns.layer(p.pattern, 0, ctx).map((c) => ({ x: c.x, z: c.z, rot: c.rot }));
        editor.render({
          PL: p.PL, PA: p.PA, Lext: p.Lext, Aext: p.Aext,
          cells: editorCells, alternate: p.alternate,
          editable: p.pattern === "manual",
          onChange: (cells) => {
            p.manualCells = cells;
            refreshPallet(true);
          },
          onAlternate: (v) => { p.alternate = v; refreshPallet(true); },
        });
      } else {
        palletViz.update(res, {
          Lext: p.Lext, Aext: p.Aext, Hext: p.Hext,
          pattern: p.pattern, viewMode: p.viewMode,
          manualCells: p.manualCells, alternate: p.alternate,
          container: contRes, reframe: !skipReframe,
        });
      }
    }
  }

  function drawPalletResults(res, contRes, p) {
    const pname = p.key === "euro" ? "Euro" : p.key === "americano" ? "Americano" : "Personalizado";
    $("#pallet-stage-t").textContent = `Pallet ${pname}`;
    $("#pallet-title").textContent = `Pallet ${pname} ${r0(p.PL)} × ${r0(p.PA)}`;
    const patLabel = window.Patterns.list.find((x) => x.id === p.pattern);
    $("#pallet-arr").innerHTML =
      `${res.arrLabel} <span>· ${patLabel ? patLabel.label.toLowerCase() : p.pattern}</span>`;

    $("#pallet-stage-title").textContent = `${fmt(res.total)} cajas · ${res.Nalto} capas`;
    $("#p-total").textContent = fmt(res.total);
    if (p.pattern === "trabado" && res.perLayerA !== res.perLayerB) {
      $("#p-total-sub").textContent =
        `Trabado: ${res.perLayerA}/capa impar · ${res.perLayerB}/capa par × ${res.Nalto} capas`;
    } else {
      $("#p-total-sub").textContent = `= ${res.Ncapa} cajas/capa × ${res.Nalto} capas en altura`;
    }
    $("#p-percapa").textContent = res.Ncapa;
    $("#p-layers").textContent = res.Nalto;
    $("#p-bottles").textContent = fmt(res.totalBottles);
    $("#p-height").innerHTML = `${(res.stackHeight / 1000).toFixed(2).replace(".", ",")}<u>m</u>`;
    $("#p-weight").innerHTML = `${fmt(Math.round(res.palletWeight))}<u>kg</u>`;
    const over = Math.min(res.sL, res.sA);
    $("#p-over").innerHTML = `${r0(Math.max(0, over))}<u>mm</u>`;

    // eficiencia
    const eta = Math.max(0, Math.min(100, res.eta));
    $("#p-eff").textContent = `${eta.toFixed(0)}%`;
    const bar = $("#p-eff-bar");
    bar.style.width = eta + "%";
    const col = eta >= 90 ? "var(--olive)" : eta >= 75 ? "var(--orange)" : "var(--crimson)";
    bar.style.background = col;
    $("#p-eff").style.color = col;

    // flag validez
    const flag = $("#pallet-flag");
    const txt = $("#pallet-flag-txt");
    flag.className = "flag";
    if (!res.valid || res.Nalto === 0) {
      flag.classList.add("bad");
      flag.querySelector("span").textContent = "✕";
      if (res.Nalto === 0) txt.innerHTML = `La caja (alto ${r0(p.Hext)} mm) no entra ni una capa bajo la estiba de ${fmt(p.Hestiba)} mm. Subí la altura de estiba.`;
      else txt.innerHTML = `Voladizo: alguna caja sobresale del borde. Probá rotar el patrón o achicar la caja.`;
    } else if (eta < 90) {
      flag.classList.add("warn");
      flag.querySelector("span").textContent = "!";
      txt.innerHTML = `Eficiencia ${eta.toFixed(0)}% (&lt; 90%). Sobran ${r0(res.sL)}×${r0(res.sA)} mm de borde. Probá otra disposición o el patrón trabado.`;
    } else {
      flag.classList.add("ok");
      flag.querySelector("span").textContent = "✓";
      txt.innerHTML = `Encaje válido (η=${eta.toFixed(0)}%). Ninguna caja sobresale del borde del pallet.`;
    }

    // contenedor
    const cb = $("#cont-block");
    if (contRes) {
      cb.style.display = "block";
      $("#cont-title").textContent = `Contenedor ${contRes.label}`;
      $("#c-pallets").textContent = contRes.totalPallets;
      $("#c-tiers").textContent = contRes.tiers;
      $("#c-boxes").textContent = fmt(contRes.totalBoxes);
      $("#c-bottles").textContent = fmt(contRes.totalBottles);
      const cf = $("#cont-flag"); const cft = $("#cont-flag-txt");
      cf.className = "flag";
      if (!contRes.fits) {
        cf.classList.add("bad"); cf.querySelector("span").textContent = "✕";
        cft.innerHTML = `El pallet armado (${(res.stackHeight / 1000).toFixed(2)} m) supera la altura interna del contenedor.`;
      } else {
        cf.classList.add(contRes.tiers > 1 ? "ok" : "warn");
        cf.querySelector("span").textContent = contRes.tiers > 1 ? "✓" : "!";
        cft.innerHTML = contRes.tiers > 1
          ? `Doble estiba: entran ${contRes.tiers} niveles de pallet en altura.`
          : `Un solo nivel en altura (no se pueden apilar dos pallets). Queda espacio libre arriba.`;
      }
    } else {
      cb.style.display = "none";
    }
  }

  /* =========================================================
     TABS + 3D init
     ========================================================= */
  let activeTab = "pallet", boxStage, palletStage, boxViz, palletViz, editor, palletInit = false;

  function switchTab(tab) {
    activeTab = tab;
    $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
    $("#view-box").classList.toggle("active", tab === "box");
    $("#view-pallet").classList.toggle("active", tab === "pallet");
    if (tab === "box") {
      palletStage.stop(); boxStage.start();
      requestAnimationFrame(() => { boxStage.resize(); boxViz.reframe(); refreshBox(); });
    } else {
      boxStage.stop(); palletStage.start();
      requestAnimationFrame(() => {
        palletStage.resize(); palletViz.reframe();
        if (!state.pallet.overridden) pushBoxToPallet(false);
        refreshPallet();
      });
    }
  }

  function init() {
    boxStage = window.SceneKit.createStage($("#box-canvas"), {});
    palletStage = window.SceneKit.createStage($("#pallet-canvas"), {});
    boxViz = window.BoxViz.create(boxStage);
    palletViz = window.PalletViz.create(palletStage);

    buildBoxControls();
    buildPalletControls();

    $$(".tab").forEach((t) => t.addEventListener("click", () => switchTab(t.dataset.tab)));

    // primer render caja
    const b0 = E.computeBox(Object.assign({}, state.box));
    b0.glass = state.box.glass;
    lastBox = b0;
    boxViz.update(b0, { e: state.box.e, snap: true });
    paintRange("#r-hp"); paintRange("#r-est");
    refreshBox();
    if (activeTab === "pallet") { switchTab("pallet"); } else { boxStage.start(); }
  }

  function r0(n) { return Math.round(n); }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
