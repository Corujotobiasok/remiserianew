const token = localStorage.getItem("chofer_token");
if (!token) location.href = "login_user.html";
document.getElementById("fecha").innerText = new Date().toLocaleDateString(
  "es-AR",
  { weekday: "long", day: "numeric", month: "long" },
);

async function cargar() {
  const res = await fetch("/api/chofer/me", {
    headers: { Authorization: "Bearer " + token },
  });
  if (!res.ok) {
    location.href = "login_user.html";
    return;
  }
  const data = await res.json();
  document.getElementById("nombre").innerText = data.nombre.toUpperCase();
  document.getElementById("hoyViajes").innerText = data.viajes_hoy;
  document.getElementById("hoyBruto").innerText = "$" + data.bruto;
  document.getElementById("hoyNeto").innerText = "$" + data.neto;
  document.getElementById("estado").innerText =
    (data.habilitado_hoy ? "✅ HABILITADO" : "❌ NO HABILITADO") +
    " | " +
    (data.en_linea ? "EN LINEA" : "DESCONECTADO");
  const tbody = document.getElementById("hist");
  tbody.innerHTML = "";
  if (data.historial.length === 0) {
    tbody.innerHTML =
      "<tr><td colspan='5' style='text-align:center;color:#888'>Sin viajes hoy - cuando aceptes uno aparece acá</td></tr>";
    return;
  }
  data.historial.forEach((h) => {
    const hora = new Date(h.created_at).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    tbody.innerHTML += `<tr><td>${hora}</td><td>${h.cliente_nombre}<br><small>${h.cliente_telefono}</small></td><td>${h.origen} -> ${h.destino}</td><td>$${h.precio}</td><td>${h.estado}</td></tr>`;
  });
}
function logout() {
  localStorage.removeItem("chofer_token");
  location.href = "login_user.html";
}
cargar();
