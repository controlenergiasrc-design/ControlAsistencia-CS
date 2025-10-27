document.addEventListener("DOMContentLoaded", () => {
  console.log("Script cargado correctamente");

  // ===========================================
  // CONFIGURACIÓN API
  // ===========================================
  const API_URL = "https://asistencia-proxy.kencyf01.workers.dev";

  // ===========================================
  // ELEMENTOS PRINCIPALES
  // ===========================================
  const input = document.getElementById("numero_cs");
  const errorMsg = document.getElementById("errorMsg");
  const infoUsuario = document.getElementById("infoUsuario");
  const fotoSection = document.getElementById("fotoSection");
  const fotoTitulo = document.getElementById("fotoTitulo");
  const fotoInput = document.getElementById("fotoInput");
  const guardarFotoBtn = document.getElementById("guardarFotoBtn");
  const confirmModalEl = document.getElementById("confirmModal");
  const fotoModalEl = document.getElementById("fotoModal");
  const modal = new bootstrap.Modal(confirmModalEl);
  const fotoModal = new bootstrap.Modal(fotoModalEl);

  let usuarioData = null;

  // ===========================================
  // TEXTO INICIAL
  // ===========================================
  fotoTitulo.innerHTML = `<em style="color:#6c757d;">Subir foto de asistencia…</em>`;

  // ===========================================
  // UBICACIÓN
  // ===========================================

  function obtenerUbicacion() {
    const latInput = document.getElementById("lat");
    const lngInput = document.getElementById("lng");

    // AHORAAA Siempre pedir la ubicación cada vez que el usuario suba foto
    localStorage.removeItem("lat");
    localStorage.removeItem("lng");

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        localStorage.setItem("lat", lat);
        localStorage.setItem("lng", lng);
        latInput.value = lat;
        lngInput.value = lng;
      },
      (err) => console.warn("Error ubicación:", err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  obtenerUbicacion();

  // ===========================================
  // FUNCIONES DE INTERFAZ
  // ===========================================
  function pintaInfoUsuario(numero, nombre, tipo) {
    infoUsuario.style.display = "block";
    infoUsuario.innerHTML = `
      <strong>Número:</strong> ${numero} <br>
      <strong>Nombre:</strong> ${nombre} <br>
      <strong>Tipo:</strong> ${tipo}
    `;
  }

  function muestraVistaFinal(detalle) {
    document.querySelector(".container-fluid").innerHTML = `
      <div class="text-center mt-5">
        <h4 class="text-success fw-bold mb-4">Asistencia registrada por hoy✅</h4>
        <div>
          <hr>
          <p class="mb-1"><strong>Entrada📥:</strong> ${detalle.entrada_fecha} a las ${detalle.entrada_hora}</p>
          <a href="https://www.google.com/maps?q=${detalle.entrada_lat},${detalle.entrada_lng}" target="_blank">
            Ver ubicación de entrada
          </a>
          <p class="mb-1"><strong>Salida📤:</strong> ${detalle.salida_fecha} a las ${detalle.salida_hora}</p>
          <a href="https://www.google.com/maps?q=${detalle.salida_lat},${detalle.salida_lng}" target="_blank">
            Ver ubicación de salida
          </a>
        </div>
        <hr>
        <p class="text-muted">Gracias por registrar tu asistencia correctamente.</p>
      </div>
    `;
  }

  // ===========================================
  // SESIÓN LOCAL
  // ===========================================
  const numeroGuardado = localStorage.getItem("numero_cs");
  const estado = localStorage.getItem("estado");

  if (numeroGuardado && estado === "espera") {
    localStorage.clear();
  } else if (numeroGuardado) {
    pintaInfoUsuario(
      localStorage.getItem("numero_cs"),
      localStorage.getItem("nombre"),
      localStorage.getItem("tipo_usuario")
    );
    input.value = localStorage.getItem("numero_cs");

    if (estado === "entrada") {
      input.disabled = true;
      fotoTitulo.textContent = "Subir foto de SALIDA📤";
      fotoInput.disabled = false;
      guardarFotoBtn.disabled = false;
    } else if (estado === "completado") {
      muestraVistaFinal({
        entrada_fecha: localStorage.getItem("entrada_fecha"),
        entrada_hora: localStorage.getItem("entrada_hora"),
        entrada_lat: localStorage.getItem("lat"),
        entrada_lng: localStorage.getItem("lng"),
        salida_fecha: localStorage.getItem("salida_fecha"),
        salida_hora: localStorage.getItem("salida_hora"),
        salida_lat: localStorage.getItem("lat"),
        salida_lng: localStorage.getItem("lng"),
      });
    }
  }

  // ===========================================
  // VALIDAR NÚMERO
  // ===========================================
  input.addEventListener("input", function () {
    const numero = input.value.trim();

    if (numero.length === 4) {
      let validarMsg = document.getElementById("validarMsg");
      if (!validarMsg) {
        validarMsg = document.createElement("span");
        validarMsg.id = "validarMsg";
        validarMsg.style.marginLeft = "8px";
        validarMsg.style.fontSize = "12px";
        validarMsg.style.color = "#6c757d";
        input.insertAdjacentElement("afterend", validarMsg);
      }
      validarMsg.innerHTML = `<span class="spinner-border spinner-border-sm text-primary" role="status"></span> Validando usuario...`;

      fetch(`${API_URL}?accion=validarUsuario&numero_cs=${numero}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            validarMsg.textContent = "❌ Número inválido";
            input.value = "";
            infoUsuario.style.display = "none";
            fotoInput.disabled = true;
            guardarFotoBtn.disabled = true;
            return;
          }

          usuarioData = data;
          validarMsg.textContent = "✔️ Usuario válido";
          errorMsg.textContent = "";

          if (
            data &&
            (data.completed === true ||
              /completaste tu asistencia/i.test(data.message || ""))
          ) {
            alert("✅Ya completaste tu asistencia por hoy.🕐");
            fotoTitulo.innerHTML = `<em style='color:#198754;'>Asistencia completada ✅</em>`;

            // limpiar y desactivar solo el input file y botón
            fotoInput.value = "";
            fotoInput.disabled = false;
            guardarFotoBtn.disabled = false;

            // limpiar título para permitir otra lectura al validar otro usuario
            input.value = "";
            input.disabled = false;

            // limpiar el estado local (por si cambian de usuario)
            localStorage.clear();

            return; // detener flujo
          }

          document.getElementById("modalBody").innerHTML = `
            ¿Estás seguro de continuar como
            <strong>${data.nombre}</strong> (${data.tipo_usuario}),
            número <strong>${data.numero_cs}</strong>?
          `;
          modal.show();

          document.getElementById("confirmBtn").onclick = function () {
            modal.hide();
            localStorage.setItem("numero_cs", data.numero_cs);
            localStorage.setItem("nombre", data.nombre);
            localStorage.setItem("tipo_usuario", data.tipo_usuario);
            localStorage.setItem("sector", data.sector); // NUEVAA ACCION
            localStorage.setItem("estado", "espera");

            pintaInfoUsuario(data.numero_cs, data.nombre, data.tipo_usuario);
            fotoInput.disabled = false;
            guardarFotoBtn.disabled = false;
            fotoTitulo.textContent = "Subir foto de ENTRADA📥";
          };

          confirmModalEl.querySelector(".btn-secondary").onclick = function () {
            modal.hide();
            input.value = "";
            validarMsg.textContent = "";
            fotoTitulo.innerHTML = `<em style="color:#6c757d;">Subir foto de asistencia…</em>`;
          };
        })
        .catch((err) => {
          console.error("Error validando usuario:", err);
          validarMsg.textContent = "⚠️ Error al validar usuario";
        });
    }
  });

  // ===========================================
  // CONFIRMAR FOTO
  // ===========================================
  guardarFotoBtn.addEventListener("click", function () {
    if (!fotoInput.files.length) {
      alert("Debes seleccionar una foto primero 📸");
      return;
    }

    const archivo = fotoInput.files[0];
    const vistaPrevia = URL.createObjectURL(archivo);

    document.getElementById("fotoModalBody").innerHTML = `
      <p class="text-center fw-semibold mb-2">¿Estás seguro de guardar esta foto?</p>
      <div class="d-flex justify-content-center">
        <img src="${vistaPrevia}" alt="Vista previa" class="rounded shadow-sm"
             style="max-height: 150px; max-width: 80%; object-fit: cover;">
      </div>
    `;
    fotoModal.show();
  });

// ===========================================
// GUARDAR FOTO EN API
// ===========================================
document.getElementById("confirmFotoBtn").onclick = function () {
  fotoModal.hide();

  const tipoFoto = fotoTitulo.textContent.includes("SALIDA")
    ? "SALIDA"
    : "ENTRADA";
  const fecha = new Date().toLocaleDateString();
  const hora = new Date().toLocaleTimeString();
  const lat = localStorage.getItem("lat");
  const lng = localStorage.getItem("lng");
  const numero_cs = localStorage.getItem("numero_cs");

  if (!lat || !lng) {
    alert("No se detectó tu ubicación 📍, por favor actívala antes de continuar.");
    return;
  }

  fotoTitulo.innerHTML = `
    <span class="spinner-border spinner-border-sm text-primary" role="status"></span>
    <em style="color:#6c757d; margin-left:6px;">Guardando foto...</em>
  `;

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      numero_cs: numero_cs,
      tipo_usuario: localStorage.getItem("tipo_usuario"),
      nombre_usuario: localStorage.getItem("nombre"),
      sector: localStorage.getItem("sector"),
      tipo_foto: tipoFoto,
      lat: lat,
      lng: lng,
    }),
  })
    .then((res) => {
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      console.log("✅ Respuesta del servidor:", data);

      // Caso: Día COMPLETADO (Entrada + Salida)
      if (data && (data.completed === true || /completaste tu asistencia/i.test(data.message || ""))) {
        alert("✅ Ya completaste tu asistencia por hoy.🕐");

        // Limpia interfaz
        input.value = "";
        input.disabled = false;
        fotoInput.value = "";
        fotoInput.disabled = true;
        guardarFotoBtn.disabled = true;
        fotoTitulo.innerHTML = `<em style="color:#6c757d;">Subir foto de asistencia…</em>`;
        infoUsuario.style.display = "none";

        // Limpia datos locales
        localStorage.clear();

        // Refresca la app (para mostrar vista inicial limpia)
        setTimeout(() => {
          window.location.reload();
        }, 1500);

        return; // cortar flujo
      }

      // Flujo normal (guardó ENTRADA o SALIDA)
      const successModal = new bootstrap.Modal(document.getElementById("successModal"));
      successModal.show();
      setTimeout(() => successModal.hide(), 2500);

      fotoInput.value = "";

      fotoTitulo.textContent =
        tipoFoto === "ENTRADA"
          ? "Subir foto de SALIDA📤"
          : "Asistencia registrada por hoy✅";

      const infoFoto = document.createElement("div");
      infoFoto.classList.add("mt-2", "text-center");
      infoFoto.innerHTML = `
        <small>Foto de <strong>${tipoFoto}</strong> registrada el 
        <strong>${fecha}</strong> a las <strong>${hora}</strong> ⏰</small><br>
        <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank">
          Ver ubicación en Google Maps
        </a>
      `;
      fotoSection.appendChild(infoFoto);

      if (tipoFoto === "ENTRADA") {
        localStorage.setItem("entrada_fecha", fecha);
        localStorage.setItem("entrada_hora", hora);
        localStorage.setItem("estado", "entrada");
        input.disabled = true;
      } else {
        localStorage.setItem("salida_fecha", fecha);
        localStorage.setItem("salida_hora", hora);
        localStorage.setItem("estado", "completado");
        muestraVistaFinal({
          entrada_fecha: localStorage.getItem("entrada_fecha"),
          entrada_hora: localStorage.getItem("entrada_hora"),
          entrada_lat: lat,
          entrada_lng: lng,
          salida_fecha: fecha,
          salida_hora: hora,
          salida_lat: lat,
          salida_lng: lng,
        });
      }
    })
    .catch((err) => {
      console.error("❌ Error guardando foto:", err);
      fotoTitulo.innerHTML = `<em style="color:#dc3545;">Error al guardar foto ❌</em>`;
    });
};
});