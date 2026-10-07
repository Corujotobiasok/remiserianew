const token = localStorage.getItem("token");
if (!token) location.href = "login.html";

document.getElementById("fecha").innerText =
  "FECHA: " +
  new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

let choferesCache = [];

async function cargar() {
  const res = await fetch("/api/choferes", {
    headers: { Authorization: "Bearer " + token },
  });
  choferesCache = await res.json();
  render(choferesCache);
}

function render(lista) {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  let caja = 0;
  lista.forEach((c) => {
    const esLibre = c.estado !== "DESCANSO";
    if (esLibre) caja += 4000;
    const dot =
      c.estado === "LIBRE"
        ? "green"
        : c.estado === "EN VIAJE"
          ? "orange"
          : "gray";
    const st = c.estado || "LIBRE";
    grid.innerHTML += `
      <div class="card">
        <div class="card-head"><b>${c.nombre}</b><div class="st"><span class="dot ${dot}"></span>${st}</div></div>
        <div class="sub">${c.telefono} • ${c.viajes_hoy || 0} viajes hoy • ${c.en_linea ? "EN LINEA" : "OFF"}</div>
        <div class="actions">
          <button class="${st === "LIBRE" ? "active" : ""}" onclick="cambiar(${c.id},'LIBRE')">LIBRE</button>
          <button class="${st === "EN VIAJE" ? "active" : ""}" onclick="cambiar(${c.id},'EN VIAJE')">EN VIAJE</button>
          <button class="${st === "DESCANSO" ? "active" : ""}" onclick="cambiar(${c.id},'DESCANSO')">DESCANSO</button>
        </div>
      </div>`;
  });
  document.getElementById("caja").innerText =
    `CAJA DEL DÍA: $${caja.toLocaleString("es-AR")}`;
  document.getElementById("count-choferes").innerText = lista.length;
  document.getElementById("count-caja").innerText =
    "$" + (caja / 1000).toFixed(0) + "k";
  document.getElementById("detalle-caja").innerText =
    `${lista.filter((x) => x.estado !== "DESCANSO").length} choferes habilitados x $4000 = $${caja}`;
}

async function cambiar(id, estado) {
  await fetch(`/api/choferes/${id}/estado`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ estado }),
  });
  cargar();
}

function filtrar() {
  const q = document.getElementById("search").value.toLowerCase();
  render(
    choferesCache.filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.telefono.includes(q),
    ),
  );
}

function switchTab(t) {
  document
    .querySelectorAll(".tab")
    .forEach((x) => x.classList.remove("active"));
  if (event) event.target.classList.add("active");
  document.getElementById("view-choferes").style.display =
    t === "choferes" ? "block" : "none";
  document.getElementById("view-pedidos").style.display =
    t === "pedidos" ? "block" : "none";
  document.getElementById("view-caja").style.display =
    t === "caja" ? "block" : "none";
  if (t === "pedidos") cargarPedidos();
}

async function crearChoferPrompt() {
  const nombre = prompt("Nombre:");
  const telefono = prompt("Telefono:");
  const patente = prompt("Patente:");
  const auto_modelo = prompt("Auto modelo:");
  const email = prompt("Email login:");
  const password = prompt("Pass:");
  if (!nombre || !email || !password) return;
  await fetch("/api/choferes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({
      nombre,
      telefono,
      patente,
      auto_modelo,
      email,
      password,
    }),
  });
  cargar();
}

function logout() {
  localStorage.removeItem("token");
  location.href = "/";
}

// ===================== PEDIDOS TAXIMETRO - SOLO ORIGEN =====================
async function cargarPedidos() {
  const res = await fetch("/api/pedidos", {
    headers: { Authorization: "Bearer " + token },
  });
  const pedidos = await res.json();
  const tbody = document.getElementById("tabla-pedidos");
  const countPedidos = document.getElementById("count-pedidos");
  if (!tbody) return;
  if (countPedidos) countPedidos.innerText = pedidos.length;
  tbody.innerHTML = "";
  pedidos.forEach((p) => {
    const hora = p.created_at
      ? new Date(p.created_at).toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";
    const km = p.distancia_km ? Number(p.distancia_km).toFixed(2) + " km" : "-";
    const precio = p.precio_final || p.precio || "-";
    const precioTxt = precio !== "-" ? "$" + precio : "-";
    const choferTxt =
      p.chofer_nombre || (p.chofer_id ? "#" + p.chofer_id : "-");
    tbody.innerHTML += `<tr><td>${hora}</td><td>${p.cliente_nombre || ""}<br><small>${p.cliente_telefono || ""}</small></td><td>${p.origen || ""}</td><td>${km}<br><b>${precioTxt}</b></td><td>${choferTxt}</td><td><span style="border:1px solid #111;padding:2px 6px;font-size:10px">${p.estado}</span></td></tr>`;
  });
}

async function crearPedido() {
  const body = {
    cliente_nombre: document.getElementById("p_cliente_nombre").value.trim(),
    cliente_telefono: document
      .getElementById("p_cliente_telefono")
      .value.trim(),
    origen: document.getElementById("p_origen").value.trim(),
    origen_lat:
      parseFloat(document.getElementById("p_origen_lat").value) || null,
    origen_lng:
      parseFloat(document.getElementById("p_origen_lng").value) || null,
  };
  if (!body.origen) return alert("Falta origen - Ej: Urquiza 1200");
  const res = await fetch("/api/pedidos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(body),
  });
  if (res.ok) {
    const data = await res.json();
    alert("Pedido #" + data.id + " creado! Se envió a choferes en linea");
    document.getElementById("p_origen").value = "";
    document.getElementById("p_cliente_nombre").value = "";
    document.getElementById("p_cliente_telefono").value = "";
    document.getElementById("p_origen_lat").value = "";
    document.getElementById("p_origen_lng").value = "";
    cargarPedidos();
  } else {
    const err = await res.json();
    alert("Error: " + err.msg);
  }
}

// Carga inicial choferes + pedidos
const originalCargar = cargar;
cargar = async function () {
  await originalCargar();
  await cargarPedidos();
};
cargar();
