// 1. Si ya estoy logeado, no me quedo en login
if (localStorage.getItem("token")) {
  window.location.href = "dashboard.html";
}

// 2. Función de login
async function login() {
  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("pass").value.trim();

  if (!email || !pass) return alert("Completa email y pass");

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    });

    const data = await res.json();

    if (data.token) {
      localStorage.setItem("token", data.token);
      window.location.href = "dashboard.html";
    } else {
      alert(data.msg || "Email o pass mal");
    }
  } catch (e) {
    console.error(e);
    alert("El backend no responde. ¿Corriste node server.js?");
  }
}
