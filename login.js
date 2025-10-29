// ==========================================
// LOGIN.JS — Conexión real con Cloudflare Worker + Apps Script
// ==========================================

const form = document.getElementById("loginForm");
const msg = document.getElementById("msg");

// URL de tu Worker (intermediario)
const WORKER_URL = "https://asistencia-proxy.kencyf01.workers.dev/";

if (form) {
  form.addEventListener("submit", async (e) => {
    // Si hay campos vacíos, el navegador muestra su mensaje nativo
    if (!form.checkValidity()) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Evita recargar la página mientras hacemos la solicitud
    e.preventDefault();

    // Limpiamos mensajes anteriores
    msg.classList.add("d-none");
    msg.classList.remove("alert-success", "alert-danger");

    // Capturamos los valores del formulario
    const admin_usuario = document.getElementById("username").value.trim();
    const clave = document.getElementById("password").value.trim();

    try {
      // Construimos la URL completa para el login
      const url = `${WORKER_URL}?accion=loginAdmin&admin_usuario=${encodeURIComponent(
        admin_usuario
      )}&clave=${encodeURIComponent(clave)}`;

      // Enviamos solicitud al Worker (que contacta a login.gs)
      const response = await fetch(url);
      console.log("✅ Se envió solicitud al Worker:", url);
      const data = await response.json();

      if (data.success) {
        // ✅ Login correcto
        const { nombre, rol } = data.admin;
        msg.textContent = `Bienvenido ${nombre} (${rol}) 🎉`;
        msg.classList.remove("d-none");
        msg.classList.add("alert-success");

        // Guardamos sesión local (para controlar acceso al panel)
        localStorage.setItem("admin_nombre", nombre);
        localStorage.setItem("admin_rol", rol);

        // Redirige al panel después de 1.5 segundos
        setTimeout(() => {
          window.location.href = "admin.html";
        }, 1500);
      } else {
        // ❌ Login incorrecto
        msg.textContent = data.mensaje || "Usuario o clave incorrectos ❌";
        msg.classList.remove("d-none");
        msg.classList.add("alert-danger");
      }
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
      msg.textContent =
        "Error al conectar con el servidor ❌. Revisa tu conexión o API.";
      msg.classList.remove("d-none");
      msg.classList.add("alert-danger");
    }
  });
}
