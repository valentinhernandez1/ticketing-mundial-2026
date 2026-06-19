"use strict";

/* ===================================================================
   Estado y utilidades
=================================================================== */
const state = { token: null, rol: null, uid: null, email: null };
const $ = (sel, root = document) => root.querySelector(sel);
const app = $("#app");

function parseJwt(t) {
  try {
    const p = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(escape(atob(p))));
  } catch { return {}; }
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function money(n) { return "$ " + Number(n ?? 0).toLocaleString("es-UY"); }

function toast(msg, ok = true) {
  const t = $("#toast");
  t.textContent = msg;
  t.className = "toast " + (ok ? "ok" : "err");
  setTimeout(() => t.classList.add("hidden"), 3200);
}

async function api(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  if (state.token) headers["Authorization"] = "Bearer " + state.token;
  const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    if (res.status === 401) { logout(); }
    const msg = (data && data.detalle) || (data && data.message) ||
                (typeof data === "string" && data) || ("Error " + res.status);
    throw new Error(msg);
  }
  return data;
}

/* ===================================================================
   Sesion
=================================================================== */
function saveSession(token) {
  const p = parseJwt(token);
  state.token = token;
  state.rol = p.rol;
  state.uid = Number(p.uid);
  state.email = p.sub;
  localStorage.setItem("tk", token);
  renderShell();
}
function logout() {
  state.token = state.rol = state.uid = state.email = null;
  localStorage.removeItem("tk");
  $("#topbar").classList.add("hidden");
  renderAuth();
}
function restore() {
  const tk = localStorage.getItem("tk");
  if (!tk) return false;
  const p = parseJwt(tk);
  if (!p.exp || p.exp * 1000 < Date.now()) { localStorage.removeItem("tk"); return false; }
  saveSession(tk);
  return true;
}

/* ===================================================================
   Navegacion por rol
=================================================================== */
const MENUS = {
  USUARIO_GENERAL: [
    ["comprar", "Comprar entradas", viewComprar],
    ["entradas", "Mis entradas", viewEntradas],
    ["compras", "Mis compras", viewCompras],
    ["transf", "Transferencias", viewTransferencias],
  ],
  ADMINISTRADOR_PAIS: [
    ["estadios", "Estadios", viewEstadios],
    ["eventos", "Eventos", viewEventos],
    ["reportes", "Reportes", viewReportes],
  ],
  FUNCIONARIO_VALIDACION: [
    ["validar", "Validar acceso", viewValidar],
  ],
};

function renderShell() {
  $("#topbar").classList.remove("hidden");
  $("#userInfo").textContent = `${state.email} · ${state.rol}`;
  const av = $("#userAvatar"); if (av) av.textContent = (state.email || "?")[0].toUpperCase();
  const nav = $("#nav");
  const menu = MENUS[state.rol] || [];
  nav.innerHTML = "";
  menu.forEach(([key, label, fn]) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.dataset.key = key;
    b.onclick = () => { setActive(key); fn(); };
    nav.appendChild(b);
  });
  if (menu.length) { setActive(menu[0][0]); menu[0][2](); }
}
function setActive(key) {
  document.querySelectorAll("#nav button").forEach(b =>
    b.classList.toggle("active", b.dataset.key === key));
}
$("#logoutBtn").onclick = logout;

/* ===================================================================
   Login / Registro
=================================================================== */
function renderAuth() {
  $("#topbar").classList.add("hidden");
  app.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-hero">
        <span class="logo">⚽</span>
        <h1 class="auth-title">Ticketing Mundial 2026</h1>
        <p class="auth-sub">USA 🇺🇸 · Canadá 🇨🇦 · México 🇲🇽</p>
      </div>
      <div class="card">
        <div class="tabs">
          <button class="primary" id="tabLogin">Ingresar</button>
          <button class="ghost" id="tabReg">Crear cuenta</button>
        </div>
        <div id="authForm"></div>
      </div>
      <p class="sub" style="text-align:center;font-size:12px;margin-top:24px">Universidad Católica del Uruguay · Bases de Datos II</p>
    </div>`;
  $("#tabLogin").onclick = () => { swapTab("tabLogin"); formLogin(); };
  $("#tabReg").onclick = () => { swapTab("tabReg"); formRegister(); };
  formLogin();
}
function swapTab(active) {
  $("#tabLogin").className = active === "tabLogin" ? "primary" : "ghost";
  $("#tabReg").className = active === "tabReg" ? "primary" : "ghost";
}
const LOADER = `<div class="loader"><span class="spinner"></span> Cargando…</div>`;

function formLogin() {
  $("#authForm").innerHTML = `
    <h2>Ingresar</h2>
    <label>Email</label><input id="lEmail" value="valentin@ucu.edu.uy" />
    <label>Contraseña</label><input id="lPass" type="password" value="test1234" />
    <button class="primary" id="lBtn">Ingresar</button>`;
  $("#lBtn").onclick = async () => {
    try {
      const t = await api("POST", "/api/auth/login",
        { email: $("#lEmail").value.trim(), password: $("#lPass").value });
      saveSession(t.token);
      toast("Bienvenido");
    } catch (e) { toast(e.message, false); }
  };
}

function formRegister() {
  $("#authForm").innerHTML = `
    <h2>Crear cuenta (usuario general)</h2>
    <div class="grid cols2">
      <div><label>Nombre</label><input id="rNombre" /></div>
      <div><label>Apellido</label><input id="rApellido" /></div>
    </div>
    <label>Email</label><input id="rEmail" />
    <label>Contraseña</label><input id="rPass" type="password" />
    <div class="grid cols2">
      <div><label>País (id)</label><input id="rDirPais" type="number" value="4" /></div>
      <div><label>Localidad</label><input id="rLoc" value="Montevideo" /></div>
    </div>
    <div class="grid cols2">
      <div><label>Calle</label><input id="rCalle" /></div>
      <div><label>Número</label><input id="rNum" /></div>
    </div>
    <div class="grid cols2">
      <div><label>Código postal</label><input id="rCp" value="11200" /></div>
      <div><label>Tipo doc.</label>
        <select id="rTipo"><option>CI</option><option>PASAPORTE</option><option>DNI</option></select></div>
    </div>
    <div class="grid cols2">
      <div><label>País doc. (id)</label><input id="rDocPais" type="number" value="4" /></div>
      <div><label>Número doc.</label><input id="rDoc" /></div>
    </div>
    <button class="primary" id="rBtn">Registrarme</button>`;
  $("#rBtn").onclick = async () => {
    try {
      const t = await api("POST", "/api/auth/register", {
        email: $("#rEmail").value.trim(), password: $("#rPass").value,
        nombre: $("#rNombre").value.trim(), apellido: $("#rApellido").value.trim(),
        dirIdPais: Number($("#rDirPais").value), localidad: $("#rLoc").value.trim(),
        calle: $("#rCalle").value.trim(), numero: $("#rNum").value.trim(),
        codigoPostal: $("#rCp").value.trim(), docIdPais: Number($("#rDocPais").value),
        tipoDocumento: $("#rTipo").value, docNumero: $("#rDoc").value.trim(),
      });
      saveSession(t.token);
      toast("Cuenta creada");
    } catch (e) { toast(e.message, false); }
  };
}

/* ===================================================================
   USUARIO GENERAL — Comprar (carrito, máx 5)
=================================================================== */
let cart = [];

async function viewComprar() {
  app.innerHTML = `
    <div class="page-header">
      <h1>Comprar entradas</h1>
      <p class="sub">Elegí tus sectores — hasta 5 por compra. El precio incluye 5% de comisión.</p>
    </div>
    <div id="evs">${LOADER}</div>`;
  try {
    const eventos = await api("GET", "/api/consulta/eventos");
    if (!eventos.length) {
      $("#evs").innerHTML = `<div class="empty-state"><span class="empty-icon">🏟️</span>No hay eventos disponibles en este momento.</div>`;
      return;
    }
    $("#evs").innerHTML = eventos.map(ev => `
      <div class="match-card">
        <div class="match-header">
          <div class="match-teams">
            <span class="team-name">${esc(ev.local)}</span>
            <span class="vs-badge">VS</span>
            <span class="team-name">${esc(ev.visitante)}</span>
          </div>
          <div class="match-meta">
            <span class="match-stadium">🏟️ ${esc(ev.estadio)}</span>
            <span class="match-dot">·</span>
            <span class="match-date">📅 ${esc(ev.fecha)}</span>
          </div>
        </div>
        ${ev.sectores.length ? `
        <div class="sectors-grid">
          ${ev.sectores.map(s => `
            <div class="sector-card">
              <div class="sector-name">Sector ${esc(s.sector)}</div>
              <div class="sector-price">${money(s.precio)}</div>
              <div class="sector-avail${s.disponibles <= 0 ? " sold-out" : ""}">${s.disponibles > 0 ? s.disponibles + " disponibles" : "Agotado"}</div>
              <button class="btn-add addBtn"
                data-id="${s.idEventoSector}"
                data-label="${esc(ev.local)} vs ${esc(ev.visitante)} · Sector ${esc(s.sector)}"
                data-precio="${s.precio}"
                ${s.disponibles <= 0 ? "disabled" : ""}>+ Agregar</button>
            </div>`).join("")}
        </div>` : `<p class="no-sectors">Sin sectores habilitados para este evento.</p>`}
      </div>`).join("");
    document.querySelectorAll(".addBtn").forEach(b => b.onclick = () => addToCart(b.dataset));
    renderCart();
  } catch (e) { $("#evs").innerHTML = `<div class="card">${esc(e.message)}</div>`; }
}

function addToCart(d) {
  if (cart.length >= 5) { toast("Máximo 5 entradas por compra", false); return; }
  cart.push({ id: Number(d.id), label: d.label, precio: Number(d.precio) });
  renderCart();
}
function renderCart() {
  let bar = $("#cartBar");
  if (!bar) { bar = document.createElement("div"); bar.id = "cartBar"; app.appendChild(bar); }
  if (!cart.length) { bar.innerHTML = ""; return; }
  const sub = cart.reduce((a, c) => a + c.precio, 0);
  bar.innerHTML = `
    <div class="cart">
      <div class="cart-info">
        🛒 <b>${cart.length}</b>/5 entradas · subtotal ${money(sub)}
        <span class="cart-commission">&nbsp;(+5% comisión = ${money(sub * 1.05)})</span>
        <div class="cart-items-preview">${cart.map(c => esc(c.label)).join(" &nbsp;·&nbsp; ")}</div>
      </div>
      <div class="cart-actions">
        <button class="ghost mini" id="clearCart">Vaciar</button>
        <button class="primary" id="buyBtn" style="margin:0">Confirmar compra</button>
      </div>
    </div>`;
  $("#clearCart").onclick = () => { cart = []; renderCart(); };
  $("#buyBtn").onclick = async () => {
    try {
      const r = await api("POST", "/api/compras", { eventoSectores: cart.map(c => c.id) });
      toast(`Compra #${r.idVenta} confirmada`);
      cart = [];
      viewComprar();
    } catch (e) { toast(e.message, false); }
  };
}

/* mapa idEventoSector -> info de partido/sector (para enriquecer "mis entradas") */
async function sectorMap() {
  const m = {};
  try {
    (await api("GET", "/api/consulta/eventos")).forEach(ev =>
      ev.sectores.forEach(s => m[s.idEventoSector] = `${ev.local} vs ${ev.visitante} · Sector ${s.sector} · ${ev.fecha}`));
  } catch { /* ignore */ }
  return m;
}

/* ===================================================================
   USUARIO GENERAL — Mis entradas + QR dinámico
=================================================================== */
async function viewEntradas() {
  app.innerHTML = `
    <div class="page-header">
      <h1>Mis entradas</h1>
      <p class="sub">Tus entradas digitales. El QR se renueva cada 30 segundos para mayor seguridad.</p>
    </div>
    <div id="ents">${LOADER}</div>`;
  try {
    const [ents, map] = [await api("GET", `/api/usuarios/${state.uid}/entradas`), await sectorMap()];
    if (!ents.length) {
      $("#ents").innerHTML = `<div class="empty-state"><span class="empty-icon">🎫</span>Todavía no tenés entradas. ¡Comprá las tuyas!</div>`;
      return;
    }
    const info = e => {
      const full = map[e.idEventoSector] || "";
      // full format: "Local vs Visitante · Sector X · fecha"
      const parts = full.split(" · ");
      return { partido: parts[0] || ("Evento sector " + e.idEventoSector), sector: parts[1] || "", fecha: parts[2] || "" };
    };
    $("#ents").innerHTML = `<div class="tickets-list">
      ${ents.map(e => {
        const i = info(e);
        const consumed = e.estado === "CONSUMIDA";
        return `<div class="ticket-card">
          <div class="ticket-info">
            <div class="ticket-id">Entrada #${e.id}</div>
            <div class="ticket-match">${esc(i.partido)}</div>
            <div class="ticket-meta">
              ${i.sector ? `<span class="badge gray">${esc(i.sector)}</span>` : ""}
              ${i.fecha ? `<span class="muted">📅 ${esc(i.fecha)}</span>` : ""}
              <span class="badge ${consumed ? "gray" : "green"}">${esc(e.estado)}</span>
              <span class="ticket-transfers">🔄 ${e.cantidadTransferencias}/3 transf.</span>
            </div>
          </div>
          <div class="ticket-price">${money(e.precio)}</div>
          <div class="ticket-actions">
            ${!consumed ? `<button class="qrBtn" data-id="${e.id}">🔐 Ver QR</button>` : `<span class="badge gray">Usada</span>`}
          </div>
        </div>`;
      }).join("")}
    </div>`;
    document.querySelectorAll(".qrBtn").forEach(b => b.onclick = () => openQr(Number(b.dataset.id)));
  } catch (e) { $("#ents").innerHTML = `<div class="card">${esc(e.message)}</div>`; }
}

let qrTimer = null, qrCountdown = null;
function openQr(idEntrada) {
  const bg = document.createElement("div");
  bg.className = "modal-bg";
  bg.innerHTML = `<div class="qr-box">
      <div class="qr-header">
        <span class="qr-title">Tu entrada digital</span>
        <span class="qr-subtitle">Entrada #${idEntrada}</span>
      </div>
      <div class="qr-canvas-wrap">
        <div id="qrcanvas"></div>
      </div>
      <div class="qr-timer">
        <div class="qr-countdown" id="qrCount">30</div>
        <div class="qr-timer-label">segundos hasta que se renueve</div>
        <div class="qr-progress-bar"><div class="qr-progress-fill" id="qrFill" style="width:100%"></div></div>
      </div>
      <div class="qr-token" id="qrText"></div>
      <button class="primary" id="qrClose" style="width:100%;margin-top:0;justify-content:center">Cerrar</button>
    </div>`;
  document.body.appendChild(bg);
  const close = () => { clearInterval(qrTimer); clearInterval(qrCountdown); bg.remove(); };
  $("#qrClose").onclick = close;
  bg.onclick = (ev) => { if (ev.target === bg) close(); };

  let secs = 30;
  const refresh = async () => {
    try {
      const r = await api("POST", `/api/entradas/${idEntrada}/token`);
      const canvas = $("#qrcanvas"); canvas.innerHTML = "";
      if (typeof QRCode !== "undefined") {
        new QRCode(canvas, { text: r.codigo, width: 196, height: 196 });
      } else {
        canvas.innerHTML = `<div style="font-size:12px;color:#111;padding:8px">Sin librería QR</div>`;
      }
      $("#qrText").textContent = r.codigo;
      secs = 30;
      const fill = $("#qrFill");
      if (fill) { fill.style.transition = "none"; fill.style.width = "100%"; setTimeout(() => { fill.style.transition = "width 30s linear"; fill.style.width = "0%"; }, 30); }
    } catch (e) { toast(e.message, false); close(); }
  };
  qrCountdown = setInterval(() => {
    secs--;
    if ($("#qrCount")) $("#qrCount").textContent = secs;
  }, 1000);
  qrTimer = setInterval(refresh, 30000);
  refresh();
}

/* ===================================================================
   USUARIO GENERAL — Mis compras
=================================================================== */
async function viewCompras() {
  app.innerHTML = `<h1>Mis compras</h1><p class="sub">Ventas que ingresaste. Podés pagar las confirmadas.</p><div id="cmp">${LOADER}</div>`;
  try {
    const rows = await api("GET", `/api/usuarios/${state.uid}/compras`);
    if (!rows.length) { $("#cmp").innerHTML = `<div class="card muted">Sin compras.</div>`; return; }
    // fila: [idVenta, fecha, estado, cantEntradas, subtotal, comision, total]
    $("#cmp").innerHTML = `<div class="card"><table>
      <tr><th>#</th><th>Fecha</th><th>Estado</th><th>Entradas</th><th>Subtotal</th><th>Comisión</th><th>Total</th><th></th></tr>
      ${rows.map(r => `<tr>
        <td>${r[0]}</td><td>${esc(String(r[1]).slice(0, 16))}</td>
        <td><span class="badge ${r[2] === "PAGA" ? "green" : r[2] === "CONFIRMADA" ? "amber" : "gray"}">${esc(r[2])}</span></td>
        <td>${r[3]}</td><td>${money(r[4])}</td><td>${money(r[5])}</td><td><b>${money(r[6])}</b></td>
        <td>${r[2] === "CONFIRMADA" ? `<button class="ghost mini ok payBtn" data-id="${r[0]}">Pagar</button>` : ""}</td>
      </tr>`).join("")}
    </table></div>`;
    document.querySelectorAll(".payBtn").forEach(b => b.onclick = async () => {
      try { await api("POST", `/api/compras/${b.dataset.id}/pagar`); toast("Venta pagada"); viewCompras(); }
      catch (e) { toast(e.message, false); }
    });
  } catch (e) { $("#cmp").innerHTML = `<div class="card">${esc(e.message)}</div>`; }
}

/* ===================================================================
   USUARIO GENERAL — Transferencias
=================================================================== */
async function viewTransferencias() {
  app.innerHTML = `<h1>Transferencias</h1>
    <div class="card">
      <h2>Transferir una entrada</h2>
      <div class="grid cols2">
        <div><label>Entrada</label><select id="tEnt"></select></div>
        <div><label>Usuario destino (id)</label><input id="tDest" type="number" /></div>
      </div>
      <button class="primary" id="tBtn">Enviar transferencia</button>
    </div>
    <div class="card"><h2>Mis transferencias</h2><div id="tList">Cargando…</div></div>`;
  try {
    const [ents, map] = [await api("GET", `/api/usuarios/${state.uid}/entradas`), await sectorMap()];
    $("#tEnt").innerHTML = ents.filter(e => e.estado !== "CONSUMIDA")
      .map(e => `<option value="${e.id}">#${e.id} — ${esc(map[e.idEventoSector] || e.idEventoSector)}</option>`).join("")
      || `<option value="">(sin entradas transferibles)</option>`;
  } catch (e) { toast(e.message, false); }

  $("#tBtn").onclick = async () => {
    try {
      const r = await api("POST", "/api/transferencias",
        { idEntrada: Number($("#tEnt").value), idDestino: Number($("#tDest").value) });
      toast(`Transferencia #${r.idTransferencia} enviada`);
      viewTransferencias();
    } catch (e) { toast(e.message, false); }
  };

  try {
    const tr = await api("GET", `/api/usuarios/${state.uid}/transferencias`);
    if (!tr.length) { $("#tList").innerHTML = `<p class="muted">Sin transferencias.</p>`; return; }
    $("#tList").innerHTML = `<table>
      <tr><th>#</th><th>Entrada</th><th>Rol</th><th>Estado</th><th>Fecha</th><th></th></tr>
      ${tr.map(t => {
        const recibida = t.idUsuarioDestino === state.uid;
        const puedeAceptar = recibida && t.estado === "PENDIENTE";
        return `<tr>
          <td>${t.id}</td><td>#${t.idEntrada}</td>
          <td><span class="badge gray">${recibida ? "Recibida" : "Enviada"}</span></td>
          <td><span class="badge ${t.estado === "ACEPTADA" ? "green" : t.estado === "PENDIENTE" ? "amber" : "gray"}">${esc(t.estado)}</span></td>
          <td>${esc(String(t.fechaTransferencia || "").slice(0, 16))}</td>
          <td>${puedeAceptar ? `<button class="ghost mini ok accBtn" data-id="${t.id}">Aceptar</button>` : ""}</td>
        </tr>`;
      }).join("")}
    </table>`;
    document.querySelectorAll(".accBtn").forEach(b => b.onclick = async () => {
      try { await api("POST", `/api/transferencias/${b.dataset.id}/aceptar`); toast("Transferencia aceptada"); viewTransferencias(); }
      catch (e) { toast(e.message, false); }
    });
  } catch (e) { $("#tList").innerHTML = `<p>${esc(e.message)}</p>`; }
}

/* ===================================================================
   ADMIN — Estadios y sectores
=================================================================== */
async function viewEstadios() {
  app.innerHTML = `<h1>Estadios</h1><div id="est">${LOADER}</div>`;
  let cat;
  try { cat = await api("GET", "/api/consulta/catalogos"); }
  catch (e) { $("#est").innerHTML = `<div class="card">${esc(e.message)}</div>`; return; }

  $("#est").innerHTML = `
    <div class="grid cols2">
      <div class="card">
        <h2>Crear estadio</h2>
        <label>Nombre</label><input id="eNom" />
        <label>País sede</label>
        <select id="ePais">${cat.paisesSede.map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join("")}</select>
        <label>Ciudad</label><input id="eCiu" />
        <label>Dirección</label><input id="eDir" />
        <button class="primary" id="eBtn">Crear</button>
      </div>
      <div class="card">
        <h2>Agregar sector</h2>
        <label>Estadio</label>
        <select id="sEst">${cat.estadios.map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join("")}</select>
        <label>Sector</label>
        <select id="sNom"><option>A</option><option>B</option><option>C</option><option>D</option></select>
        <label>Capacidad máxima</label><input id="sCap" type="number" value="100" />
        <label>Precio base</label><input id="sPre" type="number" value="200" />
        <button class="primary" id="sBtn">Agregar</button>
      </div>
    </div>`;
  $("#eBtn").onclick = async () => {
    try {
      const r = await api("POST", "/api/estadios", {
        nombre: $("#eNom").value.trim(), idPais: Number($("#ePais").value),
        ciudad: $("#eCiu").value.trim(), direccion: $("#eDir").value.trim(),
      });
      toast(`Estadio #${r.idEstadio} creado`); viewEstadios();
    } catch (e) { toast(e.message, false); }
  };
  $("#sBtn").onclick = async () => {
    try {
      const r = await api("POST", `/api/estadios/${$("#sEst").value}/sectores`, {
        nombreSector: $("#sNom").value, capacidadMaxima: Number($("#sCap").value),
        precioBase: Number($("#sPre").value),
      });
      toast(`Sector #${r.idSector} agregado`);
    } catch (e) { toast(e.message, false); }
  };
}

/* ===================================================================
   ADMIN — Eventos (crear, habilitar sector, cancelar)
=================================================================== */
async function viewEventos() {
  app.innerHTML = `<h1>Eventos</h1><div id="evAdmin">${LOADER}</div>`;
  let cat, eventos;
  try {
    cat = await api("GET", "/api/consulta/catalogos");
    eventos = await api("GET", "/api/consulta/eventos");
  } catch (e) { $("#evAdmin").innerHTML = `<div class="card">${esc(e.message)}</div>`; return; }

  const selSel = id => `<select id="${id}">${cat.selecciones.map(s => `<option value="${s.id}">${esc(s.nombre)}</option>`).join("")}</select>`;
  $("#evAdmin").innerHTML = `
    <div class="card">
      <h2>Programar evento</h2>
      <label>Estadio</label>
      <select id="evEst">${cat.estadios.map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join("")}</select>
      <div class="grid cols2">
        <div><label>Local</label>${selSel("evLoc")}</div>
        <div><label>Visitante</label>${selSel("evVis")}</div>
      </div>
      <div class="grid cols2">
        <div><label>Fecha y hora</label><input id="evFecha" type="datetime-local" /></div>
        <div><label>Duración (min)</label><input id="evDur" type="number" value="120" /></div>
      </div>
      <button class="primary" id="evBtn">Crear evento</button>
    </div>
    <h2 style="margin-top:8px">Eventos programados</h2>
    <div id="evList"></div>`;

  $("#evBtn").onclick = async () => {
    try {
      const local = $("#evFecha").value;
      if (!local) { toast("Elegí fecha y hora", false); return; }
      const r = await api("POST", "/api/eventos", {
        idEstadio: Number($("#evEst").value),
        idSeleccionLocal: Number($("#evLoc").value),
        idSeleccionVisitante: Number($("#evVis").value),
        fechaHoraInicio: new Date(local).toISOString(),
        duracionMinutos: Number($("#evDur").value),
      });
      toast(`Evento #${r.idEvento} creado`); viewEventos();
    } catch (e) { toast(e.message, false); }
  };

  $("#evList").innerHTML = eventos.length ? eventos.map(ev => `
    <div class="card">
      <h2>${esc(ev.local)} vs ${esc(ev.visitante)}</h2>
      <p class="sub">🏟️ ${esc(ev.estadio)} · 📅 ${esc(ev.fecha)} ·
        sectores habilitados: ${ev.sectores.map(s => esc(s.sector)).join(", ") || "—"}</p>
      <div class="grid cols2">
        <div>
          <label>Habilitar sector del estadio</label>
          <select class="hbSec" data-ev="${ev.idEvento}" data-est="${ev.idEstadio}"><option>Cargando…</option></select>
        </div>
        <div class="grid cols2">
          <div><label>Cupo</label><input class="hbCupo" type="number" value="50" /></div>
          <div><label>Precio</label><input class="hbPre" type="number" value="200" /></div>
        </div>
      </div>
      <button class="ghost mini hbBtn" data-ev="${ev.idEvento}">Habilitar</button>
      <button class="ghost mini cancBtn" data-ev="${ev.idEvento}" style="color:var(--danger)">Cancelar evento</button>
    </div>`).join("") : `<div class="card muted">No hay eventos programados.</div>`;

  // cargar sectores por estadio en cada select
  for (const sel of document.querySelectorAll(".hbSec")) {
    try {
      const secs = await api("GET", `/api/consulta/estadios/${sel.dataset.est}/sectores`);
      sel.innerHTML = secs.map(s => `<option value="${s.id}">Sector ${esc(s.nombre)}</option>`).join("")
        || `<option value="">(sin sectores)</option>`;
    } catch { sel.innerHTML = `<option value="">(error)</option>`; }
  }
  document.querySelectorAll(".hbBtn").forEach(b => b.onclick = async () => {
    const card = b.closest(".card");
    try {
      await api("POST", `/api/eventos/${b.dataset.ev}/sectores`, {
        idSector: Number($(".hbSec", card).value),
        cupo: Number($(".hbCupo", card).value),
        precio: Number($(".hbPre", card).value),
      });
      toast("Sector habilitado"); viewEventos();
    } catch (e) { toast(e.message, false); }
  });
  document.querySelectorAll(".cancBtn").forEach(b => b.onclick = async () => {
    try { await api("POST", `/api/eventos/${b.dataset.ev}/cancelar`); toast("Evento cancelado"); viewEventos(); }
    catch (e) { toast(e.message, false); }
  });
}

/* ===================================================================
   ADMIN — Reportes
=================================================================== */
async function viewReportes() {
  app.innerHTML = `
    <div class="page-header">
      <h1>Reportes</h1>
      <p class="sub">Estadísticas y métricas del sistema de ticketing.</p>
    </div>
    <div id="rep">${LOADER}</div>`;
  try {
    const [rank, top, est] = await Promise.all([
      api("GET", "/api/reportes/ranking-compradores"),
      api("GET", "/api/reportes/eventos-top"),
      api("GET", "/api/reportes/estadisticas-estadio"),
    ]);

    const rankingCard = (icon, title, rows, nameFn, valueFn, labelFn, goldFn) => {
      if (!rows.length) return `<div class="report-card" style="margin-bottom:20px">
        <div class="report-card-header"><span class="report-icon">${icon}</span><h2>${title}</h2></div>
        <div class="empty-state" style="padding:24px"><span class="empty-icon" style="font-size:28px">📭</span>Sin datos.</div>
      </div>`;
      const maxVal = Math.max(...rows.map(r => Number(valueFn(r)) || 0)) || 1;
      const medals = ["🥇","🥈","🥉"];
      return `<div class="report-card" style="margin-bottom:20px">
        <div class="report-card-header"><span class="report-icon">${icon}</span><h2>${title}</h2></div>
        <div class="ranking-table">
          ${rows.map((r, i) => {
            const val = Number(valueFn(r)) || 0;
            const pct = Math.round((val / maxVal) * 100);
            return `<div class="ranking-row">
              <span class="rank-num">${medals[i] || (i + 1)}</span>
              <div>
                <div class="rank-name">${esc(nameFn(r))}</div>
                ${labelFn ? `<div class="rank-extra">${esc(labelFn(r))}</div>` : ""}
              </div>
              <div class="rank-bar-wrap"><div class="rank-bar" style="width:${pct}%"></div></div>
              <span class="rank-count">${goldFn ? goldFn(r) : val}</span>
            </div>`;
          }).join("")}
        </div>
      </div>`;
    };

    const tabla = (icon, titulo, heads, rows, fmt) => `
      <div class="report-card" style="margin-bottom:20px">
        <div class="report-card-header"><span class="report-icon">${icon}</span><h2>${titulo}</h2></div>
        <div class="table-wrap"><table>
          <tr>${heads.map(h => `<th>${h}</th>`).join("")}</tr>
          ${rows.length ? rows.map(r => `<tr>${fmt(r).map(c => `<td>${c}</td>`).join("")}</tr>`).join("")
            : `<tr><td colspan="${heads.length}" class="muted" style="padding:20px">Sin datos.</td></tr>`}
        </table></div>
      </div>`;

    $("#rep").innerHTML =
      rankingCard("🏆", "Ranking de compradores", rank,
        r => r[1] + " " + r[2],
        r => r[3],
        r => r[2],
        r => r[3] + " entradas · " + money(r[4])) +
      rankingCard("🔥", "Eventos con más ventas", top,
        r => r[1],
        r => r[4],
        r => r[2] + " · " + String(r[3]).slice(0,16),
        r => r[4] + " vendidas · " + money(r[5])) +
      tabla("📊", "Estadísticas por estadio",
        ["#", "Estadio", "Eventos", "Cupo", "Vendidas", "Recaudación", "Ocupación"],
        est, r => [r[0], esc(r[1]), r[2], r[3], r[4], money(r[5]),
          `<div style="display:flex;align-items:center;gap:8px">
            <div style="width:80px;height:5px;background:var(--surface3);border-radius:999px;overflow:hidden">
              <div style="width:${Math.min(r[6]??0,100)}%;height:100%;background:var(--green-bright);border-radius:999px"></div>
            </div>
            <span>${(r[6] ?? 0)}%</span>
          </div>`
        ]);
  } catch (e) { $("#rep").innerHTML = `<div class="card">${esc(e.message)}</div>`; }
}

/* ===================================================================
   FUNCIONARIO — Validar acceso
=================================================================== */
function viewValidar() {
  app.innerHTML = `<h1>Validar acceso</h1>
    <p class="sub">Registrá el ingreso de una entrada con su token QR activo y tu dispositivo asignado.</p>
    <div class="card">
      <div class="grid cols2">
        <div><label>ID Entrada</label><input id="vEnt" type="number" /></div>
        <div><label>ID Token QR</label><input id="vTok" type="number" /></div>
      </div>
      <label>ID Dispositivo</label><input id="vDisp" type="number" />
      <button class="primary" id="vBtn">Validar ingreso</button>
      <div id="vRes" style="margin-top:16px"></div>
    </div>`;
  $("#vBtn").onclick = async () => {
    try {
      const r = await api("POST", "/api/validaciones", {
        idEntrada: Number($("#vEnt").value), idToken: Number($("#vTok").value),
        idDispositivo: Number($("#vDisp").value),
      });
      const ok = r.resultado === "ACEPTADO";
      $("#vRes").innerHTML = `<div class="badge ${ok ? "green" : "red"}" style="font-size:14px">${esc(r.resultado)}</div>`;
      toast(ok ? "Ingreso aceptado" : "Ingreso rechazado", ok);
    } catch (e) { toast(e.message, false); }
  };
}

/* ===================================================================
   Arranque
=================================================================== */
if (!restore()) renderAuth();
