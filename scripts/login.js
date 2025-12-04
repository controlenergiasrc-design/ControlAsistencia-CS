// ==========================================
// LOGIN.JS — Conexión real con Cloudflare Worker + Apps Script
// ==========================================

const form = document.getElementById("loginForm");
const msg = document.getElementById("msg");

// URL del Worker (intermediario)
const loginScriptUrl =
  "https://proxy-asistencia.control-energiasrc.workers.dev";

if (form) {
  form.addEventListener("submit", async (e) => {
    // Validación nativa del navegador (campos vacíos)
    if (!form.checkValidity()) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Evitar recarga de página
    e.preventDefault();

    // Limpiar mensajes previos
    msg.classList.add("d-none");
    msg.classList.remove("alert-success", "alert-danger");

    // Capturar valores del formulario
    const admin_usuario = document.getElementById("username").value.trim();
    const clave = document.getElementById("password").value.trim();

    try {
      const url = `${loginScriptUrl}?accion=loginAdmin&admin_usuario=${encodeURIComponent(
        admin_usuario
      )}&clave=${encodeURIComponent(clave)}`;

      console.log("Enviando solicitud de login:", url);

      // Llamada al Worker → a login.gs
      const response = await fetch(url);
      const data = await response.json();

      console.log("Respuesta del servidor:", data);

      if (data.success) {
        // Destructurar lo que viene del loginAdmin
        const { nombre, rol, sector_admin } = data.admin;

        msg.textContent = `Bienvenido ${nombre} (${rol}) 🎉`;
        msg.classList.remove("d-none");
        msg.classList.add("alert-success");

        // GUARDAR DATOS DE LA SESIÓN
        localStorage.setItem("admin_nombre", nombre);
        localStorage.setItem("admin_rol", rol);
        localStorage.setItem("sectorUsuario", sector_admin); // IMPORTANTE
        localStorage.setItem("admin_id", data.admin.admin_usuario);

        // Redirigir al panel
        setTimeout(() => {
          window.location.href = "admin.html";
        }, 1500);

      } else {
        // ❌ Credenciales incorrectas
        msg.textContent = data.mensaje || "Usuario o clave incorrectos ❌";
        msg.classList.remove("d-none");
        msg.classList.add("alert-danger");
      }

    } catch (error) {
      console.error("Error en conexión:", error);
      msg.textContent =
        "Error al conectar con el servidor. Intenta nuevamente.";
      msg.classList.remove("d-none");
      msg.classList.add("alert-danger");
    }
  });
}
