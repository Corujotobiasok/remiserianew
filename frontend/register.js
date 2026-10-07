async function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("pass").value;
  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    console.log(data);
    if (data.ok) {
      alert("Admin creado! Ahora anda a Login");
      window.location.href = "login.html";
    } else {
      alert("Error: " + JSON.stringify(data));
    }
  } catch (e) {
    alert("Error creando cuenta");
  }
}
