const token = localStorage.getItem("chofer_token");
if (!token) location.href = "login_user.html";

let viajeActual = null,
  timerInt = null,
  timeLeft = 20;
let map = null,
  marker = null,
  watchId = null,
  startTime = null,
  kmTotal = 0,
  abordoPos = null;
let taximetroInt = null;
let lastKnownPos = null;
let gpsPermission = "prompt";

document.getElementById("fecha").innerText = new Date().toLocaleDateString(
  "es-AR",
  { day: "2-digit", month: "2-digit" },
);

// ===== GPS PERMISO ANTICIPADO =====
async function checkGpsPermission() {
  if (!navigator.geolocation) {
    mostrarGpsError("Este celular no tiene GPS");
    return false;
  }
  try {
    if (navigator.permissions) {
      const p = await navigator.permissions.query({ name: "geolocation" });
      gpsPermission = p.state;
      p.onchange = () => {
        gpsPermission = p.state;
        actualizarBannerGps();
      };
    }
  } catch {}
  actualizarBannerGps();
  return true;
}

function actualizarBannerGps() {
  let banner = document.getElementById("gpsBanner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "gpsBanner";
    banner.style.cssText =
      "border:2px solid #111;padding:10px;margin-bottom:12px;background:#fff3cd;font-size:11px;display:none";
    const main = document.querySelector("main");
    main.insertBefore(banner, main.firstChild.nextSibling);
  }
  if (gpsPermission === "denied") {
    banner.style.display = "block";
    banner.style.background = "#ffcdd2";
    banner.innerHTML =
      "<b>⚠️ GPS BLOQUEADO</b><br>1. Tocá el candadito 🔒 arriba en la barra<br>2. Permisos -> Ubicación -> Permitir<br>3. Recargá la página<br><small>Sin GPS no podés iniciar taxímetro</small><br><button onclick='solicitarGpsForzado()' style='margin-top:8px;border:1px solid #111;padding:8px;font-weight:bold;width:100%'>[ INTENTAR DE NUEVO ]</button>";
  } else if (!lastKnownPos) {
    banner.style.display = "block";
    banner.style.background = "#fff3cd";
    banner.innerHTML =
      "<b>📍 GPS: buscando señal...</b><br><small>Salí afuera o cerca de ventana para mejor señal</small>";
  } else {
    banner.style.display = "none";
  }
}

function mostrarGpsError(msg) {
  let banner = document.getElementById("gpsBanner");
  if (!banner) return;
  banner.style.display = "block";
  banner.style.background = "#ffcdd2";
  banner.innerHTML = `<b>⚠️ ${msg}</b><br><small>${gpsPermission === "denied" ? "Activa ubicación en ajustes del celu" : ""}</small><br><button onclick='solicitarGpsForzado()' style='margin-top:8px;border:1px solid #111;padding:8px;font-weight:bold;width:100%'>[ REINTENTAR GPS ]</button>`;
}

async function solicitarGpsForzado() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      mostrarGpsError("Sin GPS");
      resolve(null);
      return;
    }
    const opts = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };
    navigator.geolocation.getCurrentPosition(
      (p) => {
        lastKnownPos = {
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          acc: p.coords.accuracy,
        };
        gpsPermission = "granted";
        actualizarBannerGps();
        if (map) map.setView([lastKnownPos.lat, lastKnownPos.lng], 16);
        resolve(lastKnownPos);
      },
      (err) => {
        console.log("GPS error", err);
        if (err.code === 1) {
          gpsPermission = "denied";
          mostrarGpsError("GPS DENEGADO - Activa permiso");
        } else if (err.code === 2) {
          mostrarGpsError("Sin señal GPS - Salí afuera");
        } else {
          mostrarGpsError("GPS tardó mucho - Reintentá");
        }
        resolve(null);
      },
      opts,
    );
  });
}

function getPos() {
  return new Promise(async (res, rej) => {
    if (lastKnownPos && Date.now() - (lastKnownPos.ts || 0) < 10000) {
      // usa última si es de hace menos de 10s
      res(lastKnownPos);
      return;
    }
    const pos = await solicitarGpsForzado();
    if (pos) res(pos);
    else rej(new Error("GPS no disponible"));
  });
}

async function cargarPerfil() {
  try {
    const res = await fetch("/api/chofer/me", {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) {
      localStorage.removeItem("chofer_token");
      location.href = "login_user.html";
      return;
    }
    const d = await res.json();
    document.getElementById("nombre").innerText = d.nombre.toUpperCase();
    const habTxt = document.getElementById("habilTxt");
    const habDetalle = document.getElementById("habilitadoTxt");
    if (d.habilitado_hoy) {
      habTxt.innerText = "✅ HABILITADO HOY";
      habDetalle.innerHTML =
        "✅ HABILITADO HOY HASTA 23:59<br><small style='font-weight:normal'>Base $4000 paga</small>";
      habDetalle.style.color = "#00a000";
    } else {
      habTxt.innerText = "❌ NO HABILITADO";
      habDetalle.innerHTML =
        "❌ NO HABILITADO HOY<br><small style='font-weight:normal'>Contactá a central</small>";
      habDetalle.style.color = "red";
    }
    const btnLinea = document.getElementById("btnLinea");
    const dot = document.getElementById("dot");
    const estadoTxt = document.getElementById("estadoTxt");
    if (d.en_linea) {
      btnLinea.innerText = "[ DESCONECTARME ]";
      btnLinea.className = "toggle on";
      estadoTxt.innerText = "EN LINEA";
      dot.className = "dot g";
      // Si se pone en linea, pedimos GPS ya
      solicitarGpsForzado().then(() => {
        if (!watchId) iniciarTracking();
      });
    } else {
      btnLinea.innerText = "[ PONERME EN LINEA ]";
      btnLinea.className = "toggle off";
      estadoTxt.innerText = "DESCONECTADO";
      dot.className = "dot r";
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
    }
    document.getElementById("viajesHoy").innerText = d.viajes_hoy;
    document.getElementById("brutoHoy").innerText = "$" + d.bruto;
    document.getElementById("netoHoy").innerText = "$" + d.neto;
    const mini = document.getElementById("miniHist");
    mini.innerHTML = "";
    if (d.historial.length === 0)
      mini.innerHTML =
        "<div class='small' style='text-align:center;padding:10px;color:#888'>Sin viajes hoy</div>";
    else
      d.historial.slice(0, 5).forEach((h) => {
        const hora = new Date(
          h.finalizado_at || h.created_at,
        ).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
        const km = h.distancia_km
          ? Number(h.distancia_km).toFixed(2) + "km"
          : "";
        const precio = h.precio_final || h.precio || 0;
        mini.innerHTML += `<div style="border-top:1px solid #ddd;padding:8px 0;display:flex;justify-content:space-between"><div><b style="font-size:11px">${hora} - $${precio} ${km}</b><br><span class='small'>${h.origen}</span></div><span class='small'>${h.estado}</span></div>`;
      });
  } catch (e) {
    console.log(e);
  }
}

async function toggleLinea() {
  // Antes de ponerse en linea, pedimos GPS obligatorio
  const btn = document.getElementById("btnLinea");
  const enLineaActual = btn.innerText.includes("DESCONECTARME");
  if (!enLineaActual) {
    btn.innerText = "[ ACTIVANDO GPS... ]";
    const pos = await solicitarGpsForzado();
    if (!pos && gpsPermission === "denied") {
      alert(
        "⚠️ Tenés que activar el GPS del celular para ponerte en linea.\n\n1. Tocá el candado arriba\n2. Ubicación -> Permitir\n3. Recargá",
      );
      btn.innerText = "[ PONERME EN LINEA ]";
      return;
    }
  }
  await fetch("/api/chofer/toggle-linea", {
    method: "POST",
    headers: { Authorization: "Bearer " + token },
  });
  cargarPerfil();
}

function initMap(lat, lng) {
  if (!map) {
    map = L.map("map").setView([lat, lng], 16);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);
    map.on("click", () => {
      if (viajeActual) {
        const q = encodeURIComponent(viajeActual.origen);
        const la = viajeActual.origen_lat || lat,
          ln = viajeActual.origen_lng || lng;
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${la},${ln}&destination_place=${q}`,
          "_blank",
        );
      }
    });
  } else {
    map.setView([lat, lng], 16);
    setTimeout(() => map.invalidateSize(), 200);
  }
}

async function checkPendientes() {
  try {
    if (
      viajeActual &&
      ["aceptado", "llego", "a_bordo"].includes(viajeActual.estado)
    )
      return;
    const res = await fetch("/api/chofer/pedidos-pendientes", {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) return;
    const pedidos = await res.json();
    if (pedidos.length > 0 && !viajeActual)
      mostrarViaje(pedidos[0], "pendiente");
    if (!viajeActual) {
      const r2 = await fetch("/api/chofer/viaje-actual", {
        headers: { Authorization: "Bearer " + token },
      });
      if (r2.ok) {
        const v = await r2.json();
        if (v) mostrarViaje(v, v.estado);
      }
    }
  } catch {}
}

function mostrarViaje(p, estadoForzado) {
  viajeActual = p;
  const estado = estadoForzado || p.estado || "pendiente";
  viajeActual.estado = estado;
  document.getElementById("viajeCard").style.display = "block";
  document.getElementById("noViaje").style.display = "none";
  document.getElementById("v_cliente").innerText =
    (p.cliente_nombre || "") + " • " + (p.cliente_telefono || "");
  document.getElementById("v_origen").innerText = p.origen;
  const lat = p.origen_lat || lastKnownPos?.lat || -32.987,
    lng = p.origen_lng || lastKnownPos?.lng || -58.393;
  setTimeout(() => {
    initMap(lat, lng);
    if (marker) map.removeLayer(marker);
    marker = L.marker([lat, lng]).addTo(map);
  }, 100);
  mostrarAccion(estado);
  if (estado === "pendiente") {
    timeLeft = 20;
    clearInterval(timerInt);
    document.getElementById("timer").innerText = timeLeft + "s";
    timerInt = setInterval(() => {
      timeLeft--;
      document.getElementById("timer").innerText = timeLeft + "s";
      if (timeLeft <= 0) rechazar();
    }, 1000);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }
}

function mostrarAccion(estado) {
  document.getElementById("accion_pendiente").style.display =
    estado === "pendiente" ? "block" : "none";
  document.getElementById("accion_aceptado").style.display =
    estado === "aceptado" ? "block" : "none";
  document.getElementById("accion_llego").style.display =
    estado === "llego" ? "block" : "none";
  document.getElementById("accion_abordo").style.display =
    estado === "a_bordo" ? "block" : "none";
  document.getElementById("accion_finalizado").style.display =
    estado === "finalizado" ? "block" : "none";
  const timer = document.getElementById("timer");
  if (timer)
    timer.style.display = estado === "pendiente" ? "inline-block" : "none";
}

function rechazar() {
  viajeActual = null;
  clearInterval(timerInt);
  document.getElementById("viajeCard").style.display = "none";
  document.getElementById("noViaje").style.display = "block";
}
function resetViaje() {
  viajeActual = null;
  clearInterval(timerInt);
  clearInterval(taximetroInt);
  if (watchId) navigator.geolocation.clearWatch(watchId);
  watchId = null;
  document.getElementById("viajeCard").style.display = "none";
  document.getElementById("noViaje").style.display = "block";
  cargarPerfil();
}

async function aceptar() {
  if (!viajeActual) return;
  const pos = await solicitarGpsForzado(); // pedimos gps tambien al aceptar
  const res = await fetch("/api/chofer/aceptar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ pedido_id: viajeActual.id }),
  });
  if (res.ok) {
    const data = await res.json();
    viajeActual = data.pedido || viajeActual;
    viajeActual.estado = "aceptado";
    mostrarAccion("aceptado");
    clearInterval(timerInt);
    iniciarTracking();
  } else {
    const d = await res.json();
    alert(d.msg || "Ya lo tomó otro");
    rechazar();
  }
}
async function llego() {
  if (!viajeActual) return;
  await fetch("/api/chofer/llego", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ pedido_id: viajeActual.id }),
  });
  viajeActual.estado = "llego";
  mostrarAccion("llego");
}
async function abordo() {
  if (!viajeActual) return;
  // Intento fuerte de GPS, con 2 reintentos
  let pos = lastKnownPos;
  if (!pos || Date.now() - (pos.ts || 0) > 15000) {
    pos = await solicitarGpsForzado();
  }
  if (!pos) {
    // fallback: permite iniciar igual con 0,0 y avisa
    const ok = confirm(
      "⚠️ GPS sin señal exacta.\n\n¿Querés iniciar el taxímetro igual?\n\nSe va a calcular desde tu última posición conocida.\n\nSi estás bajo techo, salí afuera para mejor señal.",
    );
    if (!ok) return;
    pos = lastKnownPos || { lat: -32.987, lng: -58.393 };
  }
  abordoPos = pos;
  abordoPos.ts = Date.now();
  try {
    await fetch("/api/chofer/abordo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        pedido_id: viajeActual.id,
        lat: pos.lat,
        lng: pos.lng,
      }),
    });
    viajeActual.estado = "a_bordo";
    mostrarAccion("a_bordo");
    startTime = Date.now();
    kmTotal = 0;
    taximetroInt = setInterval(() => {
      const diff = Math.floor((Date.now() - startTime) / 1000);
      const m = String(Math.floor(diff / 60)).padStart(2, "0"),
        s = String(diff % 60).padStart(2, "0");
      const el = document.getElementById("tiempoTxt");
      if (el) el.innerText = `${m}:${s}`;
    }, 1000);
  } catch (e) {
    alert("Error al marcar a bordo: " + e.message);
  }
}
async function finalizar() {
  if (!viajeActual) return;
  let pos = await solicitarGpsForzado();
  if (!pos) pos = lastKnownPos || { lat: -32.987, lng: -58.393 };
  try {
    const res = await fetch("/api/chofer/finalizar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        pedido_id: viajeActual.id,
        lat: pos.lat,
        lng: pos.lng,
      }),
    });
    const data = await res.json();
    clearInterval(taximetroInt);
    if (watchId) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    document.getElementById("precioFinal").innerText = "$" + data.precio;
    document.getElementById("kmFinal").innerText =
      data.km + " km recorridos - $500 base + $1800 x km";
    viajeActual.estado = "finalizado";
    mostrarAccion("finalizado");
    cargarPerfil();
  } catch (e) {
    alert("Error al finalizar: " + e.message);
  }
}

function iniciarTracking() {
  if (!navigator.geolocation) return;
  if (watchId) navigator.geolocation.clearWatch(watchId);
  watchId = navigator.geolocation.watchPosition(
    (p) => {
      lastKnownPos = {
        lat: p.coords.latitude,
        lng: p.coords.longitude,
        acc: p.coords.accuracy,
        ts: Date.now(),
      };
      const lat = p.coords.latitude,
        lng = p.coords.longitude;
      if (map) map.setView([lat, lng]);
      if (viajeActual && viajeActual.estado === "a_bordo" && abordoPos) {
        const R = 6371,
          dLat = ((lat - abordoPos.lat) * Math.PI) / 180,
          dLon = ((lng - abordoPos.lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((abordoPos.lat * Math.PI) / 180) *
            Math.cos((lat * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
        const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        kmTotal = km;
        const elKm = document.getElementById("kmTxt");
        if (elKm) elKm.innerText = km.toFixed(2);
        const elPrecio = document.getElementById("precioTxt");
        if (elPrecio) elPrecio.innerText = "$" + (500 + Math.round(km * 1800));
        fetch("/api/chofer/pos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({ pedido_id: viajeActual.id, lat, lng }),
        });
      }
      actualizarBannerGps();
    },
    (err) => {
      console.log("watch error", err);
      if (err.code === 1) {
        gpsPermission = "denied";
        actualizarBannerGps();
      }
    },
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 },
  );
}

document.getElementById("btnLinea").addEventListener("click", toggleLinea);
document.getElementById("btnAceptar").addEventListener("click", aceptar);
document.getElementById("btnRechazar").addEventListener("click", rechazar);
document.getElementById("btnLlego").addEventListener("click", llego);
document.getElementById("btnAbordo").addEventListener("click", abordo);
document.getElementById("btnFinalizar").addEventListener("click", finalizar);

function logout() {
  localStorage.removeItem("chofer_token");
  location.href = "login_user.html";
}

// INIT
checkGpsPermission();
solicitarGpsForzado();
cargarPerfil();
setInterval(checkPendientes, 2500);
setInterval(cargarPerfil, 10000);
checkPendientes();

// Fix para HTTP local - avisa
if (
  location.protocol !== "https:" &&
  location.hostname !== "localhost" &&
  location.hostname !== "127.0.0.1"
) {
  console.warn("GPS en HTTP puede fallar. Usa HTTPS o localhost");
  const banner = document.createElement("div");
  banner.style.cssText =
    "background:#ff1744;color:white;padding:8px;font-size:11px;text-align:center";
  banner.innerHTML =
    "⚠️ Estás en HTTP - El GPS puede no funcionar en algunos celus. Usá HTTPS o Chrome -> Permitir ubicación";
  document.body.prepend(banner);
}
