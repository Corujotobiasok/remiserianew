async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("msg");
  if (!email || !password) {
    msg.innerText = "Falta email/pass";
    return;
  }
  msg.innerText = "Verificando...";
  try {
    const res = await fetch("/api/choferes/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("chofer_token", data.token);
      location.href = "dashboard_user.html";
    } else {
      msg.innerText = data.msg || "Error";
    }
  } catch (e) {
    msg.innerText = "Error conexion";
  }
}
