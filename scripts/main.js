document.addEventListener("DOMContentLoaded", () => {
  console.log("Script cargado correctamente ✅");

  // ===========================================
  // CONFIGURACIÓN API
  // ===========================================
  const API_URL = "https://asistencia-proxy.kencyf01.workers.dev";

  // ===========================================
  // ELEMENTOS PRINCIPALES
  // ===========================================
  const panelAdminBtn = document.getElementById("panelAdminLink");
  const input = document.getElementById("numero_cs");
  const errorMsg = document.getElementById("errorMsg");
  const infoUsuario = document.getElementById("infoUsuario");
  const fotoSection = document.getElementById("fotoSection");
  const fotoTitulo = document.getElementById("fotoTitulo");
  const fotoInput = document.getElementById("fotoInput");
  const guardarFotoBtn = document.getElementById("guardarFotoBtn");
  const usuarioIdHidden = document.getElementById("usuario_id");
  const confirmModalEl = document.getElementById("confirmModal");
  const fotoModalEl = document.getElementById("fotoModal");

  const modal = new bootstrap.Modal(confirmModalEl);
  const fotoModal = new bootstrap.Modal(fotoModalEl);

  let usuarioData = null;

  // ===========================================
  // UBICACIÓN (solo una vez)
  // ===========================================
  function obtenerUbicacion() {
    const latInput = document.getElementById("lat");
    const lngInput = document.getElementById("lng");

    if (localStorage.getItem("lat") && localStorage.getItem("lng")) {
      latInput.value = localStorage.getItem("lat");
      lngInput.value = localStorage.getItem("lng");
      console.log(
        `Ubicación guardada encontrada: ${latInput.value}, ${lngInput.value} ✅`
      );
      return;
    }

    if (!navigator.geolocation) {
      console.warn("El navegador no soporta geolocalización.");
      return;
    }

    console.log("Solicitando ubicación al navegador...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        localStorage.setItem("lat", lat);
        localStorage.setItem("lng", lng);
        latInput.value = lat;
        lngInput.value = lng;
        console.log(`Ubicación capturada: ${lat}, ${lng} ✅`);
      },
      (err) => {
        console.warn("No se pudo obtener la ubicación:", err.message);
      },
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

  function preparaVistaParaSalida() {
    fotoTitulo.textContent = "Subir foto de SALIDA📤";
    fotoInput.disabled = false;
    guardarFotoBtn.disabled = false;
  }

  function muestraVistaFinal(detalle) {
    document.getElementById("panelAdminLink").style.display = "none";
    document.querySelector(".container-fluid").innerHTML = `
      <div class="text-center mt-5">
        <h4 class="text-success fw-bold mb-4">Asistencia registrada por hoy✅</h4>
        <div>
          <hr>
          <p class="mb-1"><strong>Entrada📥:</strong> Hoy ${detalle.entrada_fecha} a las ${detalle.entrada_hora}</p>
          <a href="https://www.google.com/maps?q=${detalle.entrada_lat},${detalle.entrada_lng}" target="_blank">
            Ver ubicación de entrada
          </a>
          <p class="mb-1"><strong>Salida📤:</strong> Hoy ${detalle.salida_fecha} a las ${detalle.salida_hora}</p>
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
  const usuarioGuardado = localStorage.getItem("usuario_id");
  const estado = localStorage.getItem("estado");

  if (usuarioGuardado && estado === "espera") {
    localStorage.clear();
    input.value = "";
    infoUsuario.style.display = "none";
    fotoInput.disabled = true;
    guardarFotoBtn.disabled = true;
    console.log("Sesión limpiada (usuario sin foto de entrada)");
  } else if (usuarioGuardado) {
    pintaInfoUsuario(
      localStorage.getItem("numero_cs"),
      localStorage.getItem("nombre"),
      localStorage.getItem("tipo_usuario")
    );
    input.value = localStorage.getItem("numero_cs");
    usuarioIdHidden.value = localStorage.getItem("usuario_id");
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
  // VALIDAR NÚMERO (API)
  // ===========================================
  input.addEventListener("input", function () {
    const numero = input.value.trim();
    if (numero.length === 4) {
      fetch(`${API_URL}?accion=validarUsuario&numero_cs=${numero}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            errorMsg.textContent = data.error;
            input.value = "";
            input.focus();
            infoUsuario.style.display = "none";
            fotoInput.disabled = true;
            guardarFotoBtn.disabled = true;
            return;
          }

          errorMsg.textContent = "";
          usuarioData = data;

          document.getElementById("modalBody").innerHTML = `
            ¿Estás seguro de continuar como
            <strong>${data.nombre}</strong>,
            <strong>${data.tipo_usuario}</strong>,
            número <strong>${data.numero_cs}</strong>?
          `;
          modal.show();

          document.getElementById("confirmBtn").onclick = function () {
            modal.hide();
            localStorage.setItem("usuario_id", data.id);
            localStorage.setItem("numero_cs", data.numero_cs);
            localStorage.setItem("nombre", data.nombre);
            localStorage.setItem("tipo_usuario", data.tipo_usuario);
            localStorage.setItem("estado", "espera");

            pintaInfoUsuario(data.numero_cs, data.nombre, data.tipo_usuario);
            usuarioIdHidden.value = data.id;
            fotoInput.disabled = false;
            guardarFotoBtn.disabled = false;
            fotoTitulo.textContent = "Subir foto de ENTRADA📥";
          };

          confirmModalEl.querySelector(".btn-secondary").onclick = function () {
            modal.hide();
            input.value = "";
            input.focus();
            infoUsuario.style.display = "none";
            fotoInput.disabled = true;
            guardarFotoBtn.disabled = true;
            usuarioIdHidden.value = "";
          };
        })
        .catch((err) => console.error("Error validando usuario:", err));
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

    // Enviar a la API de Google Sheets
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // ✅ encabezados primero
      body: JSON.stringify({
        usuario_id: usuarioIdHidden.value,
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
        console.log("Respuesta correcta del servidor:", data);

        // Mostrar modal de éxito
        const successModal = new bootstrap.Modal(
          document.getElementById("successModal")
        );
        successModal.show();
        setTimeout(() => successModal.hide(), 2500);

        // Mostrar detalles de la foto subida
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

        // Guardar estado según tipo de foto
        if (tipoFoto === "ENTRADA") {
          localStorage.setItem("entrada_fecha", fecha);
          localStorage.setItem("entrada_hora", hora);
          localStorage.setItem("estado", "entrada");

          input.disabled = true;
          fotoTitulo.textContent = "Subir foto de SALIDA📤";
          fotoInput.value = "";
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

        // Mostrar modal de error (más bonito que un alert)
        const errorModal = new bootstrap.Modal(
          document.getElementById("errorModal")
        );
        errorModal.show();
        setTimeout(() => errorModal.hide(), 2500);
      });
  };

  // ===========================================
  // CANCELAR FOTO
  // ===========================================
  fotoModalEl.querySelector(".btn-secondary").onclick = function () {
    fotoModal.hide();
    fotoInput.value = "";
    const msg = document.createElement("div");
    msg.className = "alert alert-warning text-center mt-3";
    msg.textContent = "Carga cancelada ❌";
    fotoSection.appendChild(msg);
    setTimeout(() => msg.remove(), 2000);
  };
});
