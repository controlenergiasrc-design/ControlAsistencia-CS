document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const msg = document.getElementById("msg");

  // URL del Worker (proxy)
  const loginScriptUrl = "https://proxy-asistencia.control-energiasrc.workers.dev";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Obtener los valores del formulario
    const usuario = document.getElementById("username").value.trim();
    const clave = document.getElementById("password").value.trim();

    // Ocultar el mensaje si estaba visible
    msg.classList.add("d-none");

    try {
      // Construir la URL con los parámetros
      const url = `${loginScriptUrl}?accion=loginAdmin&admin_usuario=${encodeURIComponent(usuario)}&clave=${encodeURIComponent(clave)}`;

      // Enviar la solicitud al Worker
      const response = await fetch(url);
      const data = await response.json();
      console.log("Respuesta del servidor:", data);

      if (data.success) {
        // ✅ Guardar los datos del usuario en localStorage
        localStorage.setItem("adminData", JSON.stringify(data.admin));

        // Redirigir al panel principal
        window.location.href = "panel.html"; // puedes cambiarlo por tu vista real
      } else {
        // ❌ Credenciales incorrectas
        msg.textContent = "Usuario o clave incorrectos ❌";
        msg.classList.remove("d-none");
      }
    } catch (error) {
      console.error("Error en la conexión:", error);
      msg.textContent = "Error al conectar con el servidor 🚫";
      msg.classList.remove("d-none");
    }
  });
});
