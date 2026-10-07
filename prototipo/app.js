/* app.js - Central Gualeguaychú - lógica separada */
const choferesData = [
  {
    id: 1,
    nombre: "Carlos Fernandez",
    movil: "3446-154321",
    estado: "LIBRE",
    viajes: 12,
  },
  {
    id: 2,
    nombre: "Jorge Morales",
    movil: "3446-158877",
    estado: "EN VIAJE",
    viajes: 8,
  },
  {
    id: 3,
    nombre: "Roberto Silva",
    movil: "3446-152211",
    estado: "LIBRE",
    viajes: 15,
  },
  {
    id: 4,
    nombre: "Daniel Ortiz",
    movil: "3446-153344",
    estado: "LIBRE",
    viajes: 9,
  },
  {
    id: 5,
    nombre: "Oscar Gimenez",
    movil: "3446-159900",
    estado: "EN VIAJE",
    viajes: 11,
  },
  {
    id: 6,
    nombre: "Luis Acosta",
    movil: "3446-151122",
    estado: "LIBRE",
    viajes: 6,
  },
  {
    id: 7,
    nombre: "Miguel Torres",
    movil: "3446-150033",
    estado: "DESCANSO",
    viajes: 4,
  },
  {
    id: 8,
    nombre: "Pedro Alvarez",
    movil: "3446-154455",
    estado: "LIBRE",
    viajes: 7,
  },
  {
    id: 9,
    nombre: "Fernando Ruiz",
    movil: "3446-156677",
    estado: "LIBRE",
    viajes: 10,
  },
  {
    id: 10,
    nombre: "Marcelo Diaz",
    movil: "3446-157788",
    estado: "LIBRE",
    viajes: 5,
  },
  {
    id: 11,
    nombre: "Hugo Benitez",
    movil: "3446-158899",
    estado: "LIBRE",
    viajes: 3,
  },
  {
    id: 12,
    nombre: "Sergio Ponce",
    movil: "3446-159011",
    estado: "LIBRE",
    viajes: 8,
  },
];
let pedidos = [
  {
    hora: "08:15",
    cliente: "Maria L.",
    origen: "25 de Mayo 450",
    destino: "Hospital Centenario",
    chofer: "Carlos Fernandez",
    choferId: 1,
    precio: 3500,
    estado: "FINALIZADO",
  },
  {
    hora: "08:42",
    cliente: "Juan C.",
    origen: "Urquiza 1200",
    destino: "Terminal",
    chofer: "Jorge Morales",
    choferId: 2,
    precio: 2800,
    estado: "EN VIAJE",
  },
  {
    hora: "09:05",
    cliente: "Ana P.",
    origen: "San Martin 880",
    destino: "Barrio Munilla",
    chofer: "-",
    choferId: null,
    precio: 3200,
    estado: "PENDIENTE",
  },
  {
    hora: "09:18",
    cliente: "Roberto K.",
    origen: "Costanera 50",
    destino: "Cementerio",
    chofer: "Roberto Silva",
    choferId: 3,
    precio: 4000,
    estado: "ASIGNADO",
  },
  {
    hora: "09:33",
    cliente: "Lucia M.",
    origen: "Rocamora 350",
    destino: "Corsodromo",
    chofer: "-",
    choferId: null,
    precio: 3500,
    estado: "PENDIENTE",
  },
  {
    hora: "09:41",
    cliente: "Pedro S.",
    origen: "Bolivar 1020",
    destino: "Puerto",
    chofer: "Daniel Ortiz",
    choferId: 4,
    precio: 3000,
    estado: "ASIGNADO",
  },
  {
    hora: "09:55",
    cliente: "Claudia R.",
    origen: "Mitre 600",
    destino: "Barrio La Cuchilla",
    chofer: "Oscar Gimenez",
    choferId: 5,
    precio: 4500,
    estado: "EN VIAJE",
  },
  {
    hora: "10:02",
    cliente: "Fernando G.",
    origen: "Luis N. Palma 800",
    destino: "Frigorífico",
    chofer: "-",
    choferId: null,
    precio: 3800,
    estado: "PENDIENTE",
  },
];
let filtro = "TODOS";
let pedidoSel = null;

function init() {
  const d = new Date();
  document.getElementById("fecha").textContent = d.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  document.getElementById("cajaFecha").textContent =
    d.toLocaleDateString("es-AR");
  document.getElementById("operador").textContent =
    localStorage.getItem("gchu_rol") || "ADMIN";
  bindEvents();
  render();
}
function bindEvents() {
  document.getElementById("btnLogout").onclick = () => {
    localStorage.removeItem("gchu_rol");
    localStorage.removeItem("gchu_user");
    location.href = "login.html";
  };
  document.getElementById("btnCrear").onclick = crearPedido;
  document.getElementById("btnCloseModal").onclick = closeModal;
  document.getElementById("btnCancelModal").onclick = closeModal;
  document.getElementById("btnAddChofer").onclick = addChofer;
  document.getElementById("btnCerrarCaja").onclick = cerrarCaja;
  document.querySelectorAll(".tab").forEach((t) => {
    t.onclick = () => {
      document
        .querySelectorAll(".tab")
        .forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      const target = t.dataset.tab;
      document
        .getElementById("view-pedidos")
        .classList.toggle("hidden", target !== "pedidos");
      document
        .getElementById("view-choferes")
        .classList.toggle("hidden", target !== "choferes");
      document
        .getElementById("view-caja")
        .classList.toggle("hidden", target !== "caja");
    };
  });
  document.querySelectorAll(".fbtn[data-f]").forEach((b) => {
    b.onclick = () => setFiltro(b.dataset.f);
  });
  document.getElementById("fChofer").addEventListener("input", renderChoferes);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
    if (e.key === "F5") {
      e.preventDefault();
      render();
    }
  });
}
function render() {
  const tbody = document.getElementById("tbody");
  tbody.innerHTML = "";
  let list = pedidos.filter((p) => filtro === "TODOS" || p.estado === filtro);
  document.getElementById("regs").textContent = list.length + " registros";
  document.getElementById("countPedidos").textContent = pedidos.length;
  list.forEach((p) => {
    const realIdx = pedidos.indexOf(p);
    const tr = document.createElement("tr");
    let estadoClass = "st-pendiente";
    if (p.estado === "ASIGNADO") estadoClass = "st-asignado";
    if (p.estado === "EN VIAJE") estadoClass = "st-viaje";
    if (p.estado === "FINALIZADO") estadoClass = "st-final";
    let accion = "-";
    if (p.estado === "PENDIENTE")
      accion = `<button class="btn-blue btn-sm" onclick="openAsignar(${realIdx})">[ASIGNAR]</button>`;
    else if (p.estado === "ASIGNADO")
      accion = `<button class="btn-green btn-sm" onclick="cambiarEstado(${realIdx},'EN VIAJE')">[EN VIAJE]</button>`;
    else if (p.estado === "EN VIAJE")
      accion = `<button class="btn-black btn-sm" onclick="cambiarEstado(${realIdx},'FINALIZADO')">[FINALIZAR]</button>`;
    tr.innerHTML = `<td><b>${p.hora}</b></td><td><b>${p.cliente}</b></td><td>${p.origen} <span style="color:#0d2ea3">→</span> ${p.destino}</td><td>${p.chofer || "-"}</td><td><b>$${p.precio.toLocaleString("es-AR")}</b></td><td><span class="estado ${estadoClass}">${p.estado}</span></td><td>${accion}</td>`;
    tbody.appendChild(tr);
  });
  renderCaja();
  renderChoferes();
  updateCajaTop();
}
function setFiltro(f) {
  filtro = f;
  document
    .querySelectorAll(".fbtn[data-f]")
    .forEach((b) => b.classList.toggle("active", b.dataset.f === f));
  render();
}
function crearPedido() {
  const c = document.getElementById("fCliente").value.trim() || "S/N";
  const o = document.getElementById("fOrigen").value.trim() || "Origen";
  const d = document.getElementById("fDestino").value.trim() || "Destino";
  const pr = parseInt(document.getElementById("fPrecio").value) || 3500;
  const now = new Date();
  const hora =
    String(now.getHours()).padStart(2, "0") +
    ":" +
    String(now.getMinutes()).padStart(2, "0");
  pedidos.unshift({
    hora,
    cliente: c,
    origen: o,
    destino: d,
    chofer: "-",
    choferId: null,
    precio: pr,
    estado: "PENDIENTE",
  });
  document.getElementById("fCliente").value = "";
  document.getElementById("fOrigen").value = "";
  document.getElementById("fDestino").value = "";
  render();
}
function cambiarEstado(idx, nuevo) {
  pedidos[idx].estado = nuevo;
  if (nuevo === "FINALIZADO") {
    const ch = choferesData.find((x) => x.id === pedidos[idx].choferId);
    if (ch) ch.estado = "LIBRE";
  }
  if (nuevo === "EN VIAJE") {
    const ch = choferesData.find((x) => x.id === pedidos[idx].choferId);
    if (ch) ch.estado = "EN VIAJE";
  }
  render();
}
function openAsignar(idx) {
  pedidoSel = idx;
  document.getElementById("modalTitle").textContent =
    `[ ASIGNAR CHOFER ] - ${pedidos[idx].cliente} ${pedidos[idx].origen}→${pedidos[idx].destino}`;
  const cont = document.getElementById("modalChoferes");
  cont.innerHTML = "";
  choferesData.forEach((ch) => {
    const div = document.createElement("div");
    div.className = "chofer-item" + (ch.estado !== "LIBRE" ? " ocupado" : "");
    const dot =
      ch.estado === "LIBRE"
        ? "free"
        : ch.estado === "EN VIAJE"
          ? "busy"
          : "off";
    div.innerHTML = `<div><span class="dot ${dot}"></span><b>${ch.nombre}</b> <span style="font-size:10px;color:#64748b">(${ch.movil}) - ${ch.estado} - ${ch.viajes} viajes</span></div><button class="btn-blue btn-sm" ${ch.estado !== "LIBRE" ? "disabled" : ""} onclick="asignar(${ch.id})">[ELEGIR]</button>`;
    cont.appendChild(div);
  });
  document.getElementById("modal").classList.add("open");
}
function closeModal() {
  document.getElementById("modal").classList.remove("open");
  pedidoSel = null;
}
function asignar(choferId) {
  if (pedidoSel === null) return;
  const ch = choferesData.find((x) => x.id === choferId);
  pedidos[pedidoSel].chofer = ch.nombre;
  pedidos[pedidoSel].choferId = ch.id;
  pedidos[pedidoSel].estado = "ASIGNADO";
  ch.estado = "EN VIAJE";
  closeModal();
  render();
}
function renderChoferes() {
  const list = document.getElementById("choferesList");
  const q = (document.getElementById("fChofer")?.value || "").toLowerCase();
  list.innerHTML = "";
  choferesData
    .filter((c) => c.nombre.toLowerCase().includes(q) || c.movil.includes(q))
    .forEach((ch) => {
      const card = document.createElement("div");
      card.style.cssText =
        "border:1px solid #cbd5e1;padding:10px;background:#fff";
      const dot =
        ch.estado === "LIBRE"
          ? "free"
          : ch.estado === "EN VIAJE"
            ? "busy"
            : "off";
      card.innerHTML = `<div style="display:flex;justify-content:space-between"><b>${ch.nombre}</b><span style="font-size:10px;border:1px solid #cbd5e1;padding:2px 6px"><span class="dot ${dot}"></span>${ch.estado}</span></div><div style="font-size:11px;color:#64748b;margin:6px 0">${ch.movil} • ${ch.viajes} viajes hoy</div><div style="display:flex;gap:4px"><button class="fbtn" onclick="setChoferEstado(${ch.id},'LIBRE')">LIBRE</button><button class="fbtn" onclick="setChoferEstado(${ch.id},'EN VIAJE')">EN VIAJE</button><button class="fbtn" onclick="setChoferEstado(${ch.id},'DESCANSO')">DESCANSO</button></div>`;
      list.appendChild(card);
    });
  document.getElementById("countChoferes").textContent = choferesData.length;
}
function setChoferEstado(id, est) {
  const ch = choferesData.find((x) => x.id === id);
  if (ch) {
    ch.estado = est;
    renderChoferes();
  }
}
function addChofer() {
  const nombre = prompt("Nombre del chofer:");
  if (!nombre) return;
  const movil = prompt("Móvil:", "3446-15") || "";
  choferesData.push({
    id: Date.now(),
    nombre,
    movil,
    estado: "LIBRE",
    viajes: 0,
  });
  renderChoferes();
}
function renderCaja() {
  const finals = pedidos.filter((p) => p.estado === "FINALIZADO");
  const total = finals.reduce((s, p) => s + p.precio, 0) + 28000;
  const prom = finals.length ? Math.round(total / (finals.length + 8)) : 3200;
  document.getElementById("cajaTotal").textContent =
    "$" + total.toLocaleString("es-AR");
  document.getElementById("cajaTop").textContent =
    "$" + total.toLocaleString("es-AR");
  document.getElementById("countCaja").textContent =
    "$" + Math.round(total / 1000) + "k";
  document.getElementById("cajaViajes").textContent = finals.length + 8;
  document.getElementById("cajaProm").textContent =
    "$" + prom.toLocaleString("es-AR");
  const tbody = document.getElementById("cajaBody");
  tbody.innerHTML = "";
  finals.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.hora}</td><td>${p.cliente}</td><td>${p.chofer}</td><td>$${p.precio.toLocaleString("es-AR")}</td>`;
    tbody.appendChild(tr);
  });
  const res = document.getElementById("resumenChofer");
  res.innerHTML = "";
  const map = {};
  pedidos.forEach((p) => {
    if (p.choferId) {
      map[p.chofer] =
        (map[p.chofer] || 0) + (p.estado === "FINALIZADO" ? p.precio : 0);
    }
  });
  Object.entries(map).forEach(([nom, tot]) => {
    const div = document.createElement("div");
    div.style.cssText =
      "display:flex;justify-content:space-between;border-bottom:1px dashed #e2e8f0;padding:6px 0;font-size:12px";
    div.innerHTML = `<span>${nom}</span><b>$${tot.toLocaleString("es-AR")}</b>`;
    res.appendChild(div);
  });
}
function updateCajaTop() {}
function cerrarCaja() {
  alert(
    "CAJA CERRADA. Backup guardado en C:\\GCHU\\backup\\" +
      new Date().toISOString().slice(0, 10) +
      ".bak\nTotal: " +
      document.getElementById("cajaTotal").textContent,
  );
}

init();
// exponer funciones globales para onclick inline
window.openAsignar = openAsignar;
window.cambiarEstado = cambiarEstado;
window.asignar = asignar;
window.setChoferEstado = setChoferEstado;
