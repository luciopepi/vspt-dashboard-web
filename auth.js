/* =====================================================================
   VSPT Dashboard — Control de acceso (solo correos @vspt.com.ar)
   ---------------------------------------------------------------------
   Qué hace:
     • Muestra un login de Google a pantalla completa antes de usar el panel.
     • Solo deja pasar cuentas del dominio vspt.com.ar.
     • Adjunta el id_token de Google a CADA pedido a la API (script.google.com)
       y RETIENE esos pedidos hasta que haya sesión iniciada.
     • Renueva el token solo (sin molestar) en pantallas que quedan prendidas.

   IMPORTANTE: esto es la PUERTA + la experiencia de usuario. La verificación
   REAL la hace el Apps Script (01_API.gs): sin un id_token válido de un correo
   @vspt.com.ar, la API no devuelve datos. Por eso este archivo no es "salteable".

   >>> CONFIGURACIÓN: pegá tu Client ID de Google abajo (CLIENT_ID). <<<
   (el MISMO valor tiene que ir en 01_API.gs → OAUTH_CLIENT_ID)
   ===================================================================== */
(function () {
  "use strict";

  // ----------------------- CONFIG (editar) -----------------------
  var CLIENT_ID      = "335838512985-jr2lfrqmajubg7r9721gl3cqokjiksd9.apps.googleusercontent.com";
  var ALLOWED_DOMAIN = "vspt.com.ar";
  var API_MATCH      = "script.google.com";   // a qué pedidos se les adjunta el token
  // ---------------------------------------------------------------

  // estado del token
  var idToken  = null;
  var tokenExp = 0;            // vencimiento en ms (epoch)
  var releaseApi;             // libera los fetch a la API una vez logueado
  var apiReady = new Promise(function (res) { releaseApi = res; });
  var refreshIv = null;

  // -------- persistencia de sesión (para no re-loguear al cambiar de página) --------
  var LS_TOK = "vspt_idtoken", LS_EXP = "vspt_idtoken_exp";
  function saveToken() {
    try { localStorage.setItem(LS_TOK, idToken || ""); localStorage.setItem(LS_EXP, String(tokenExp || 0)); } catch (e) {}
  }
  function clearToken() {
    try { localStorage.removeItem(LS_TOK); localStorage.removeItem(LS_EXP); } catch (e) {}
  }
  function restoreToken() {
    try {
      var t = localStorage.getItem(LS_TOK), e = Number(localStorage.getItem(LS_EXP)) || 0;
      if (t && (e - Date.now()) > 2 * 60 * 1000) {   // queda >2 min de vida
        idToken = t; tokenExp = e; return true;
      }
    } catch (e) {}
    clearToken();
    return false;
  }

  // ---------------------------------------------------------- utils
  function decodeJwt(t) {
    try {
      var p = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      var pad = p.length % 4; if (pad) p += "====".slice(pad);
      return JSON.parse(decodeURIComponent(escape(atob(p))));
    } catch (e) { return null; }
  }
  function domainOf(claims) {
    var email = String(claims.email || "").toLowerCase();
    return claims.hd ? String(claims.hd).toLowerCase() : (email.split("@")[1] || "");
  }

  // ------------------------------------------------------ overlay UI
  var ov, errBox;
  function buildOverlay() {
    if (ov) return;
    ov = document.createElement("div");
    ov.id = "vspt-auth-overlay";
    ov.setAttribute("style", [
      "position:fixed", "inset:0", "z-index:2147483647",
      "display:flex", "align-items:center", "justify-content:center",
      "background:linear-gradient(135deg,#301030 0%,#4E1742 55%,#701F52 100%)",
      "font-family:'Montserrat',system-ui,sans-serif", "color:#F3F1EB"
    ].join(";"));
    ov.innerHTML =
      '<div style="text-align:center;max-width:380px;padding:34px 30px;background:rgba(0,0,0,.28);' +
        'border:1px solid rgba(224,208,184,.18);border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.45);">' +
        '<div style="font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#E0D0B8;font-weight:700;">VSPT &middot; Operaciones</div>' +
        '<div style="font-size:22px;font-weight:800;margin:10px 0 6px;letter-spacing:-.3px;">OPINONA Dashboard</div>' +
        '<div style="font-size:13px;color:#c9b8c4;margin-bottom:22px;line-height:1.55;">Acceso restringido al personal de VSPT.<br>' +
          'Inici&aacute; sesi&oacute;n con tu correo <b style="color:#F8C040;">@' + ALLOWED_DOMAIN + '</b>.</div>' +
        '<div id="vspt-gsi-btn" style="display:flex;justify-content:center;min-height:44px;"></div>' +
        '<div id="vspt-auth-err" style="display:none;margin-top:18px;font-size:12px;color:#ff9db0;line-height:1.55;"></div>' +
      '</div>';
    document.body.appendChild(ov);
    errBox = document.getElementById("vspt-auth-err");
  }
  function showError(html) { if (errBox) { errBox.innerHTML = html; errBox.style.display = "block"; } }
  function clearError()    { if (errBox) errBox.style.display = "none"; }
  function removeOverlay() { if (ov && ov.parentNode) ov.parentNode.removeChild(ov); ov = null; errBox = null; }

  // ------------------------------------------------- callback de Google
  function onCredential(resp) {
    var jwt = resp && resp.credential;
    if (!jwt) return;
    var claims = decodeJwt(jwt);
    if (!claims) { showError("No se pudo leer la credencial. Reintent&aacute;."); return; }

    if (domainOf(claims) !== ALLOWED_DOMAIN) {
      try { google.accounts.id.disableAutoSelect(); } catch (e) {}
      showError("La cuenta <b>" + (claims.email || "") + "</b> no pertenece a @" + ALLOWED_DOMAIN +
                ".<br><a href=\"#\" id=\"vspt-switch\" style=\"color:#F8C040;\">Usar otra cuenta</a>");
      var sw = document.getElementById("vspt-switch");
      if (sw) sw.onclick = function (ev) {
        ev.preventDefault(); clearError();
        try { google.accounts.id.prompt(); } catch (e) {}
      };
      return;
    }

    // cuenta válida del dominio
    idToken  = jwt;
    tokenExp = Number(claims.exp) * 1000;
    saveToken();            // recordar la sesión para no re-loguear al cambiar de página
    clearError();
    removeOverlay();
    releaseApi();           // deja correr los pedidos a la API que estaban en espera
    startRefreshLoop();     // mantiene el token fresco en pantallas siempre prendidas
  }

  // renovación silenciosa para "modo planta / TV" (token de Google dura ~1 h)
  function startRefreshLoop() {
    if (refreshIv) return;
    refreshIv = setInterval(function () {
      if (!tokenExp) return;
      if (tokenExp - Date.now() < 6 * 60 * 1000) {   // faltan <6 min para vencer
        try { google.accounts.id.prompt(); } catch (e) {}   // re-emite el token sin interacción
      }
    }, 4 * 60 * 1000);
  }

  // --------------------------------------------------------- init GIS
  function initGis(silent) {
    if (!(window.google && google.accounts && google.accounts.id)) {
      return setTimeout(function () { initGis(silent); }, 120);   // todavía no cargó el gsi/client
    }
    if (CLIENT_ID.indexOf("PEGAR_AQUI") === 0) {
      showError("Configuraci&oacute;n pendiente: falta el CLIENT_ID en <b>auth.js</b>.");
      return;
    }
    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: onCredential,
      auto_select: true,
      cancel_on_tap_outside: false,
      context: "signin",
      itp_support: true,
      hd: ALLOWED_DOMAIN            // pista para limitar el selector de cuentas al dominio
    });
    if (silent) return;            // ya hay sesión guardada: GIS queda listo para refrescar, sin pedir nada

    var btnEl = document.getElementById("vspt-gsi-btn");
    if (btnEl) google.accounts.id.renderButton(btnEl, {
      theme: "filled_black", size: "large", text: "signin_with",
      shape: "pill", logo_alignment: "center", width: 280
    });
    google.accounts.id.prompt();   // One Tap si está disponible (el botón siempre funciona)
  }

  // ------------------------------------- gate de la API + token en cada fetch
  var _fetch = window.fetch ? window.fetch.bind(window) : null;
  if (_fetch) {
    window.fetch = function (input, init) {
      var url = (typeof input === "string") ? input
              : (input && input.url) ? input.url : "";
      if (url.indexOf(API_MATCH) === -1) return _fetch(input, init);   // pedidos no-API: sin tocar
      return apiReady.then(function () {                                // los de la API esperan al login
        var sep = url.indexOf("?") === -1 ? "?" : "&";
        var newUrl = url + sep + "id_token=" + encodeURIComponent(idToken || "");
        if (typeof input === "string") return _fetch(newUrl, init);
        return _fetch(new Request(newUrl, input), init);
      });
    };
  }

  // ------------------------------------------------------------ arranque
  function boot() {
    if (restoreToken()) {        // ya hay sesión válida guardada → entra directo, sin login
      releaseApi();
      startRefreshLoop();
      initGis(true);             // GIS en segundo plano (para refrescar el token cuando venza)
    } else {
      buildOverlay();
      initGis(false);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
