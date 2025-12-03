// =======================================
// CONFIGURACIÓN BASE
// =======================================
const API_URL = "https://proxy-asistencia.control-energiasrc.workers.dev";

// =======================================
// VARIABLES GLOBALES
// =======================================
let registrosHoyGlobal = []; // aquí guardaremos los registros válidos de hoy
let fotoTemporalEntrada = null; // guardar foto temporal entrda (foto editada desde auditoria)
let fotoTemporalSalida = null; // guardar foto temporal entrda (foto editada desde auditoria)

// === Colores de botones de auditoría ===
const estilosBtnAudit = `


  .btn-audit-yellow {
    background-color: #ffcc00 !important;
    color: #333 !important;
    border: 1px solid #bfa100 !important;
  }

  .btn-audit-green {
    background-color: #28a745 !important;
    color: white !important;
  }
`;

const tagStyle = document.createElement("style");
tagStyle.textContent = estilosBtnAudit;
document.head.appendChild(tagStyle);

function resetearModalAuditoria() {
  // Ocultar/mostrar botones por defecto
  document.getElementById("btnGuardarCambios").classList.remove("d-none");
  document.getElementById("btnConfirmarAuditoria").classList.remove("d-none");
  document.getElementById("btnEnviarAuditoria").classList.add("d-none");

  // Quitar disabled
  document.getElementById("btnGuardarCambios").disabled = false;
  document.getElementById("btnConfirmarAuditoria").disabled = false;
  document.getElementById("btnEnviarAuditoria").disabled = false;

  // Limpiar listas
  document.getElementById("listaActividades").innerHTML = "";
  document.getElementById("listaNovedades").innerHTML = "";

  // Limpiar observaciones
  document.getElementById("inputObservaciones").value = "";

  // Limpiar fotos temporales
  fotoTemporalEntrada = null;
  fotoTemporalSalida = null;
}

// Imagen vacía (base64 válida)
const EMPTY_IMG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AArEBxY8oJFoAAAAASUVORK5CYII=";

// =======================================
// AL CARGAR LA PÁGINA
// =======================================
document.addEventListener("DOMContentLoaded", () => {
  mostrarNombreUsuario();
  mostrarTituloHoy();
  obtenerRegistrosHoy();
});

// =======================================
// MOSTRAR NOMBRE DEL USUARIO ACTUAL
// =======================================
function mostrarNombreUsuario() {
  const nombre = localStorage.getItem("admin_nombre");
  const rol = localStorage.getItem("admin_rol");

  const saludo = document.getElementById("saludoAdmin");

  if (saludo && nombre && rol) {
    saludo.textContent = `Bienvenido ${nombre}, ${rol}`;
  } else if (saludo && nombre) {
    saludo.textContent = `Bienvenido ${nombre}`;
  } else if (saludo) {
    saludo.textContent = "Bienvenido Administrador";
  }
}
// =======================================
// Mostrar título con la fecha de hoy (formato bonito)
// =======================================
function mostrarTituloHoy() {
  const titulo = document.getElementById("tituloRegistros");
  if (!titulo) return;
  const hoy = new Date();
  const opciones = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  // Crear formato bonito en español
  const fechaFormateada = hoy.toLocaleDateString("es-ES", opciones);
  // Capitalizar primera letra del día (lunes → Lunes)
  const fechaBonita =
    fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
  titulo.textContent = `Registros de hoy — ${fechaBonita}`;
}
// =======================================
// OBTENER REGISTROS DEL DÍA
// =======================================
async function obtenerRegistrosHoy() {
  try {
    const rol = localStorage.getItem("admin_rol") || "";
    const sectorUsuario = localStorage.getItem("sectorUsuario") || "";

    const url = `${API_URL}?accion=registrosHoy&rol=${encodeURIComponent(
      rol
    )}&sector=${encodeURIComponent(sectorUsuario)}`;

    const res = await fetch(url);
    const data = await res.json();

    console.log("Datos recibidos:", data);

    if (data && data.registros) {
      registrosHoyGlobal = data.registros;

      const entradas = data.registros.filter(
        (r) => r.tipo?.toLowerCase() === "entrada" && r.enlace?.trim() !== ""
      ).length;

      const salidas = data.registros.filter(
        (r) => r.tipo?.toLowerCase() === "salida" && r.enlace?.trim() !== ""
      ).length;

      document.getElementById("metricEntradas").textContent = entradas;
      document.getElementById("metricSalidas").textContent = salidas;

      renderizarTabla(data.registros);
      llenarFiltroSectores(data.registros);
    } else {
      renderizarTabla([]);
    }
  } catch (err) {
    console.error("❌ Error al obtener registros:", err);
  }
}

// =======================================
// RENDERIZAR TABLA COMPLETA (ENTRADA/SALIDA)
// =======================================
function renderizarTabla(registros) {
  //input para saber donde mostrar un solo boton
  document.getElementById("hiddenOrigenAuditoria").value = "hoy";
  const tbody = document.getElementById("tablaRegistros");
  tbody.innerHTML = "";
  if (!registros.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No hay registros del día de hoy 🕒</td></tr>`;
    return;
  }
  // Agrupar registros por numero_cs
  const agrupados = {};
  registros.forEach((r) => {
    if (!agrupados[r.numero_cs]) agrupados[r.numero_cs] = [];
    agrupados[r.numero_cs].push(r);
  });
  Object.values(agrupados).forEach((registrosUsuario) => {
    const entrada =
      registrosUsuario.find((r) => r.tipo?.toLowerCase() === "entrada") || {};
    const salida =
      registrosUsuario.find((r) => r.tipo?.toLowerCase() === "salida") || {};
    // OBJETO COMPLETO PARA EL MODAL
    const registroCompleto = {
      tipo_usuario: entrada.tipo_usuario || salida.tipo_usuario,
      numero_cs: entrada.numero_cs || salida.numero_cs,
      nombre: entrada.nombre || salida.nombre,
      sector: entrada.sector || salida.sector,
      fecha: entrada.fecha || salida.fecha || "",
      entrada: {
        hora: entrada.hora || "",
        enlace: entrada.enlace || "",
        lat: entrada.lat || "",
        lng: entrada.lng || "",
      },
      salida: {
        hora: salida.hora || "",
        enlace: salida.enlace || "",
        lat: salida.lat || "",
        lng: salida.lng || "",
      },
      actividades: entrada.actividades || "",
      novedades: entrada.novedades || "",
      observaciones: entrada.observaciones || "",
      estado_auditoria: entrada.estado_auditoria || "",
    };
    // Convertir a JSON seguro
    const registroJSON = JSON.stringify(registroCompleto).replace(
      /"/g,
      "&quot;"
    );
    // HTML de la fila
    const filaHTML = `
      <tr>
        <td rowspan="2">${registroCompleto.numero_cs}</td>
        <td rowspan="2">${registroCompleto.nombre}</td>
        <td rowspan="2">${registroCompleto.sector}</td>
        <!-- Entrada -->
        <td>Entrada</td>
        <td>${entrada.hora || "-"}</td>
        <td>
            ${
              entrada.enlace
                ? `
                  <button class="btn-mini" onclick="window.open('${entrada.enlace}', '_blank')">
                    <i class='fa-solid fa-camera'></i>
                  </button>
                  <button class="btn-mini" onclick="window.open('https://www.google.com/maps?q=${entrada.lat},${entrada.lng}', '_blank')">
                    <i class='fa-solid fa-location-dot'></i>
                  </button>
                `
                : `Sin foto`
            }
        </td>
            <td rowspan="2" class="text-center align-middle">
              ${(() => {
                let claseColor = "btn-audit-red"; // por defecto ROJO

                // 1) Si está AUDITADO → verde
                if (
                  registroCompleto.estado_auditoria?.toUpperCase() ===
                  "AUDITADO"
                ) {
                  claseColor = "btn-audit-green";
                }

                // 2) Si ya guardó cambios → amarillo
                else if (
                  localStorage.getItem(
                    `auditoria_${registroCompleto.numero_cs}`
                  )
                ) {
                  claseColor = "btn-audit-yellow";
                }

                return `
                    <button class="btn btn-sm btn-audit ${claseColor}"
                      onclick='abrirModalAuditoria(${registroJSON})'>
                      <i class="fa-solid fa-file-shield"></i> Auditar
                    </button>
                  `;
              })()}
          </td>
      </tr>
      <tr>
        <!-- Salida -->
        <td>Salida</td>
        <td>${salida.hora || "-"}</td>
        <td>
            ${
              salida.enlace
                ? `
                  <button class="btn-mini" onclick="window.open('${salida.enlace}', '_blank')">
                    <i class='fa-solid fa-camera'></i>
                  </button>
                  <button class="btn-mini" onclick="window.open('https://www.google.com/maps?q=${salida.lat},${salida.lng}', '_blank')">
                    <i class='fa-solid fa-location-dot'></i>
                  </button>
                `
                : `Sin foto`
            }
        </td>
      </tr>
    `;
    tbody.insertAdjacentHTML("beforeend", filaHTML);
  });
}

// =======================================
// FILTRAR TABLA POR SECTOR — VERSIÓN FINAL
// =======================================
function filtrarPorSector(sectorSeleccionado) {
  const rol = localStorage.getItem("admin_rol") || "";
  const sectorUsuario = localStorage.getItem("sectorUsuario") || "";

  // Traer registros según rol
  fetch(
    `${API_URL}?accion=registrosHoy&rol=${encodeURIComponent(
      rol
    )}&sector=${encodeURIComponent(sectorUsuario)}`
  )
    .then((res) => res.json())
    .then((data) => {
      if (!data || !data.registros) {
        renderizarTabla([]);
        document.getElementById("metricEntradas").textContent = 0;
        document.getElementById("metricSalidas").textContent = 0;
        return;
      }

      // Lista original
      let registros = data.registros;

      // Aplicar filtro si selecciona un sector
      if (sectorSeleccionado) {
        registros = registros.filter((r) => r.sector === sectorSeleccionado);
      }
      // ACTUALIZAR TARJETAS DE MÉTRICAS
      const entradas = registros.filter(
        (r) =>
          r.tipo?.toLowerCase() === "entrada" &&
          r.enlace &&
          r.enlace.trim() !== ""
      ).length;

      const salidas = registros.filter(
        (r) =>
          r.tipo?.toLowerCase() === "salida" &&
          r.enlace &&
          r.enlace.trim() !== ""
      ).length;

      document.getElementById("metricEntradas").textContent = entradas;
      document.getElementById("metricSalidas").textContent = salidas;

      // Renderizar tabla filtrada
      renderizarTabla(registros);
    })
    .catch((err) => {
      console.error("❌ Error filtrando por sector:", err);
    });
}

//========================================
//Mostrar secciones según menú lateral
//========================================
// Alternar módulos al hacer clic en el menú lateral
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    // para el modal de "Cerrar sesión"
    if (link.innerText.includes("Cerrar")) {
      abrirModalCerrarSesion();
      return;
    }
    // Quitar activo del resto
    document
      .querySelectorAll(".nav-link")
      .forEach((l) => l.classList.remove("active"));
    link.classList.add("active");
    // Ocultar todas las páginas
    document
      .querySelectorAll(".page")
      .forEach((p) => p.classList.add("d-none"));
    // Mostrar la correspondiente
    if (link.innerText.includes("Asistencia"))
      document.getElementById("mod-asistencia").classList.remove("d-none");
    if (link.innerText.includes("Usuarios"))
      document.getElementById("mod-usuarios").classList.remove("d-none");
    cargarUsuarios(); // cargamos los usuarios del sheets
    if (link.innerText.includes("Pendientes"))
      document.getElementById("mod-historial").classList.remove("d-none");
    configurarRangoFechaHistorial(); // para el input date
    cargarHistorial(); // ← AQUÍ SE CARGA AUTOMÁTICAMENTE EL HISTORIAL
    if (link.innerText.includes("Contraseña"))
      document.getElementById("mod-config").classList.remove("d-none");
  });
});

//=====================================
//Acciones del modal cerra sesion
//=====================================
// ABRIR modal cerrar sesion
function abrirModalCerrarSesion() {
  document.getElementById("modalCerrarSesion").classList.remove("d-none");
}
// CERRAR modal
function cerrarModalCerrarSesion() {
  document.getElementById("modalCerrarSesion").classList.add("d-none");
}
// Asignar acciones a botones
document.addEventListener("DOMContentLoaded", () => {
  const btnCancelar = document.getElementById("btnCancelarLogout");
  const btnConfirmar = document.getElementById("btnConfirmarLogout");

  if (btnCancelar) {
    btnCancelar.addEventListener("click", () => {
      cerrarModalCerrarSesion();
    });
  }

  if (btnConfirmar) {
    btnConfirmar.addEventListener("click", () => {
      // SOLO borrar datos de sesión
      localStorage.removeItem("admin_nombre");
      localStorage.removeItem("admin_rol");
      localStorage.removeItem("sectorUsuario");
      window.location.href = "index.html";
    });
  }
});

// =======================================
// MODAL DE AUDITORÍA
// =======================================
const actividades = [
  "Revision - Normalizacion",
  "Laboro medio tiempo",
  "Gestion logistica de materiales",
  "Gestion de entrega de materiales en el sector",
  "Inspecciones de sumistros nuevos y existentes",
  "Revisiones con Equipo Patron",
  "Supervision de campo a cuadrillas",
  "Apoyo Capacitando en Campo a Cuadrilla",
  "Apoyo Capacitando a Personal Nuevo en Campo Junto a Cuadrilla",
  "Inspecciones de Nuevos Suministros",
  "Cuadrilla NO disponible",
  "Capacitandose para su Ingreso",
  "Laboro tiempo Incompleto",
  "Capacitacion y reforzamiento por Parte de UTCD",
  "Apoyo Revision de actas o Correcciones de NC",
  "Otra actividad",
];
const novedades = [
  "Afectados por lluvia",
  "Daño vehiculo en mantenimiento",
  "Falla en circuitos de distribución",
  "Vehiculo pinchado",
  "Entrada tardia sin justificación",
  "Perdida de tiempo operativo NO justificado",
  "Entrega de materiales en almacen UTCD",
  "Tiempo de capacitacion previa",
  "Otro incidente",
];
//===================================================
// Normalizar hora para <input type="time"> → "HH:MM"
//===================================================
function normalizarHora(hora) {
  if (!hora) return "";
  // Convertir a string y eliminar espacios
  hora = String(hora).trim();
  // Separar por :
  const partes = hora.split(":");
  if (partes.length < 2) return "";
  // Hora y minuto con cero a la izquierda
  let h = partes[0].padStart(2, "0");
  let m = partes[1].padStart(2, "0");
  return `${h}:${m}`;
}
//====================================================
//Convertir FOTO a drive con formato thumbnail (miniaatura)
//====================================================
function convertirDriveDirecto(url) {
  if (!url) return "";
  // 1. Extraer ID desde "/file/d/ID/"
  let match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    const id = match[1];
    return `https://drive.google.com/thumbnail?id=${id}`;
  }
  // 2. Extraer ID desde "?id=ID"
  let match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2 && match2[1]) {
    const id = match2[1];
    return `https://drive.google.com/thumbnail?id=${id}`;
  }
  return url;
}

// =======================================
// SE PUEDE AUDITAR ESTE REGISTRO?
// - Si es de un día anterior... SIEMPRE se puede
// - Si es de HOY... solo después de las 5 PM
// =======================================
function puedeAuditarRegistro(registro) {
  const hoy = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const fechaRegistro = registro.fecha || ""; // viene de registroCompleto / construirObjetoHistorial

  // 1. Si NO es hoy → es un día anterior → SIEMPRE puede auditar
  if (fechaRegistro !== hoy) {
    return true;
  }

  // 2. Si es HOY → solo después de las 5 PM (17 horas)
  const horaActual = new Date().getHours();
  return horaActual >= 17;
}

// =======================================
// ABRIR MODAL DE AUDITORÍA (NUEVA LÓGICA)
// =======================================
function abrirModalAuditoria(registro) {
  resetearModalAuditoria();
  // Mostrar modal
  document.getElementById("modalAuditoria").classList.remove("d-none");
  document.getElementById("overlay").classList.remove("d-none");
  console.log("Abriendo auditoría para:", registro);
  // -----------------------------
  // 0. GUARDAR EN INPUTS OCULTOS
  // -----------------------------
  document.getElementById("hiddenNumeroCS").value = registro.numero_cs;
  document.getElementById("hiddenFechaRegistro").value = registro.fecha;
  document.getElementById("hiddenSector").value = registro.sector;

  const entrada = registro.entrada || {};
  const salida = registro.salida || {};
  // -----------------------------
  // 1. TITULO DEL MODAL
  // -----------------------------
  const titulo = document.getElementById("tituloModalAuditoria");
  titulo.textContent = `AUDITORÍA – ${registro.tipo_usuario} ${registro.numero_cs}`;
  // FECHA DEL REGISTRO (entrada o salida)
  const fechaLabel = document.getElementById("fechaAuditoria");
  fechaLabel.textContent = registro.fecha ? registro.fecha : "Sin fecha";

  // --------------------------------------
  // 2. BOTONES SEGÚN ORIGEN (HOY / PENDIENTES)
  // --------------------------------------

  const origen = document.getElementById("hiddenOrigenAuditoria").value;

  // DETECTAR HOY O PENDIENTE
  const hoy = new Date().toISOString().slice(0, 10);
  // Botones
  const btnGuardar = document.getElementById("btnGuardarCambios");
  const btnFinalizar = document.getElementById("btnConfirmarAuditoria");
  const btnEnviar = document.getElementById("btnEnviarAuditoria");

  if (registro.fecha === hoy) {
    // ES HOY → 2 BOTONES
    btnGuardar.classList.remove("d-none");
    btnFinalizar.classList.remove("d-none");
    btnEnviar.classList.add("d-none");
  } else {
    // ES PENDIENTE → 1 BOTÓN
    btnGuardar.classList.add("d-none");
    btnFinalizar.classList.add("d-none");
    btnEnviar.classList.remove("d-none");
  }

  // -----------------------------
  // 3. HORAS
  // -----------------------------
  const inputHoraEntrada = document.getElementById("inputHoraEntrada");
  const inputHoraSalida = document.getElementById("inputHoraSalida");

  inputHoraEntrada.value = normalizarHora(entrada.hora);
  inputHoraSalida.value = normalizarHora(salida.hora);

  inputHoraEntrada.dataset.original = inputHoraEntrada.value;
  inputHoraSalida.dataset.original = inputHoraSalida.value;

  inputHoraEntrada.addEventListener("blur", () => {
    if (!inputHoraEntrada.value.trim()) {
      inputHoraEntrada.value = inputHoraEntrada.dataset.original;
    }
  });
  inputHoraSalida.addEventListener("blur", () => {
    if (!inputHoraSalida.value.trim()) {
      inputHoraSalida.value = inputHoraSalida.dataset.original;
    }
  });
  // -----------------------------
  // 4. UBICACIONES GOOGLE MAPSSSSS
  // -----------------------------
  const linkEntrada = document.getElementById("linkEntrada");
  const linkSalida = document.getElementById("linkSalida");

  if (entrada.lat && entrada.lng) {
    linkEntrada.href = `https://www.google.com/maps?q=${entrada.lat},${entrada.lng}`;
    linkEntrada.target = "_blank";
  } else {
    linkEntrada.removeAttribute("href");
  }

  if (salida.lat && salida.lng) {
    linkSalida.href = `https://www.google.com/maps?q=${salida.lat},${salida.lng}`;
    linkSalida.target = "_blank";
  } else {
    linkSalida.removeAttribute("href");
  }
  // -----------------------------
  // 5. LLENAR ACTIVIDADES
  // -----------------------------
  const listaAct = document.getElementById("listaActividades");
  listaAct.innerHTML = "";

  if (registro.actividades) {
    registro.actividades.split(",").forEach((act) => {
      act = act.trim();
      if (!act) return;
      const tag = document.createElement("div");
      tag.classList.add("tag");
      tag.dataset.texto = act;
      tag.innerHTML = `${act} <button class="close-btn">×</button>`;
      tag
        .querySelector(".close-btn")
        .addEventListener("click", () => tag.remove());
      listaAct.appendChild(tag);
    });
  }
  // -----------------------------
  // 6. LLENAR NOVEDADES
  // -----------------------------
  const listaNov = document.getElementById("listaNovedades");
  listaNov.innerHTML = "";
  if (registro.novedades) {
    registro.novedades.split(",").forEach((nov) => {
      nov = nov.trim();
      if (!nov) return;
      const tag = document.createElement("div");
      tag.classList.add("tag");
      tag.dataset.texto = nov;
      tag.innerHTML = `${nov} <button class="close-btn">×</button>`;
      tag
        .querySelector(".close-btn")
        .addEventListener("click", () => tag.remove());
      listaNov.appendChild(tag);
    });
  }
  // -----------------------------
  // 7. OBSERVACIONES
  // -----------------------------
  const inputObs = document.getElementById("inputObservaciones");
  inputObs.value = registro.observaciones || "";
  // -----------------------------
  // 8. ESTADO AUDITORÍA (LÓGICA NUEVA DEL INGE)
  // -----------------------------
  const botonAuditar = document.getElementById("btnConfirmarAuditoria");
  const estado = (registro.estado_auditoria || "").trim().toUpperCase();

  // Si ya fue auditado...  nunca permitir volver a auditar
  if (estado === "AUDITADO") {
    botonAuditar.disabled = true;
    botonAuditar.classList.add("btn-disabled");
  } else {
    // Si está pendiente... regla:
    // - Día anterior... SIEMPRE puede
    // - HOY... solo después de las 5 PM
    if (puedeAuditarRegistro(registro)) {
      botonAuditar.disabled = false;
      botonAuditar.classList.remove("btn-disabled");
    } else {
      botonAuditar.disabled = true;
      botonAuditar.classList.add("btn-disabled");
    }
  }

  // -----------------------------
  // 9. FOTOS (debug de ruta final)
  // -----------------------------
  const imgEntrada = document.querySelector(".foto-box.entrada .foto-img");
  const imgSalida = document.querySelector(".foto-box.salida .foto-img");

  // URL original como viene de la hoja
  const urlOriginalEntrada = entrada.enlace;
  const urlOriginalSalida = salida.enlace;

  // URL convertida para mostrar en <img>
  const urlConvertidaEntrada = entrada.enlace
    ? convertirDriveDirecto(entrada.enlace)
    : "";
  const urlConvertidaSalida = salida.enlace
    ? convertirDriveDirecto(salida.enlace)
    : "";

  // Asignar al <img>
  imgEntrada.src = urlConvertidaEntrada ? urlConvertidaEntrada : EMPTY_IMG;
  imgSalida.src = urlConvertidaSalida ? urlConvertidaSalida : EMPTY_IMG;

  // -----------------------------
  // 10. BOTONES EDITAR FOTO
  // -----------------------------
  const btnEditarEntrada = document.getElementById("btnEditarEntrada");
  const btnEditarSalida = document.getElementById("btnEditarSalida");

  // Entrada
  if (!entrada.enlace) {
    btnEditarEntrada.disabled = true;
    btnEditarEntrada.classList.add("disabled");
  } else {
    btnEditarEntrada.disabled = false;
    btnEditarEntrada.classList.remove("disabled");
  }

  // Salida
  if (!salida.enlace) {
    btnEditarSalida.disabled = true;
    btnEditarSalida.classList.add("disabled");
  } else {
    btnEditarSalida.disabled = false;
    btnEditarSalida.classList.remove("disabled");
  }
}
//---------------------------------------------------
//Enviar auditoria desde pendientes con un solo boton
//---------------------------------------------------
async function enviarAuditoriaPendiente() {
  try {
    await guardarCambiosAuditoria();
    await confirmarAuditoriaFrontend();

    alert("✔ Auditoría enviada correctamente");

    cerrarModalAuditoria();
    obtenerRegistrosHoy();
    cargarHistorial();
  } catch (err) {
    console.error("❌ Error en Enviar Auditoría:", err);
    alert("Error enviando la auditoría");
  }
}

function cerrarModalAuditoria() {
  document.getElementById("modalAuditoria").classList.add("d-none");
  document.getElementById("overlay").classList.add("d-none");
}

function toggleDropdown(id) {
  document.querySelectorAll(".dropdown-menu").forEach((menu) => {
    if (menu.id !== id) menu.classList.remove("active");
  });
  const menu = document.getElementById(id);
  menu.classList.toggle("active");
}

function crearOpciones(lista, menuId, listaSeleccionId, limite) {
  const menu = document.getElementById(menuId);
  lista.forEach((item) => {
    const option = document.createElement("div");
    option.classList.add("dropdown-option");
    option.textContent = item;
    option.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSeleccion(item, listaSeleccionId, limite);
    });
    menu.appendChild(option);
  });
}

function toggleSeleccion(texto, listaId, limite) {
  const lista = document.getElementById(listaId);
  const tags = Array.from(lista.querySelectorAll(".tag"));
  const existe = tags.find((t) => t.dataset.texto === texto);

  if (existe) {
    existe.remove();
  } else {
    if (tags.length >= limite) {
      alert(`Solo puedes elegir hasta ${limite} opciones`);
      return;
    }
    const tag = document.createElement("div");
    tag.classList.add("tag");
    tag.dataset.texto = texto;
    tag.innerHTML = `${texto} <button class='close-btn'>×</button>`;
    tag
      .querySelector(".close-btn")
      .addEventListener("click", () => tag.remove());
    lista.appendChild(tag);
  }
}

// Actividades → solo 2
crearOpciones(actividades, "actividadesMenu", "listaActividades", 2);

// Novedades → hasta 3
crearOpciones(novedades, "novedadesMenu", "listaNovedades", 3);

window.addEventListener("click", (e) => {
  if (!e.target.classList.contains("dropdown")) {
    document
      .querySelectorAll(".dropdown-menu")
      .forEach((menu) => menu.classList.remove("active"));
  }
});

// ====================================================
// LLENAR SELECT DE SECTORES AUTOMÁTICAMENTE (SECTORES)
// ====================================================
function llenarFiltroSectores(registros) {
  let filtro = document.getElementById("filtroSector");
  if (!filtro) return;

  // Obtener sectores únicos del arreglo
  const sectores = [...new Set(registros.map((r) => r.sector).filter(Boolean))];

  // Limpiar opciones previas
  filtro.innerHTML = `<option value="">Todos</option>`;

  // Agregar los sectores encontrados
  sectores.forEach((sector) => {
    const opt = document.createElement("option");
    opt.value = sector;
    opt.textContent = sector;
    filtro.appendChild(opt);
  });

  // ELIMINAR EVENTOS DUPLICADOS
  const nuevoFiltro = filtro.cloneNode(true);
  filtro.parentNode.replaceChild(nuevoFiltro, filtro);
  filtro = nuevoFiltro; // reasignar referencia

  // -------------------------------
  // FILTRO POR ROL
  // -------------------------------
  const rol = localStorage.getItem("admin_rol");
  const sectorUsuario = localStorage.getItem("sectorUsuario");

  if (rol?.toLowerCase() === "admin") {
    // Ocultar el input <select>
    filtro.value = sectorUsuario || "";
    filtro.style.display = "none";

    // Crear un label bonito con el sector del admin
    let labelSector = document.getElementById("labelSectorFijo");
    if (!labelSector) {
      labelSector = document.createElement("div");
      labelSector.id = "labelSectorFijo";

      labelSector.style.fontWeight = "600";
      labelSector.style.marginLeft = "10px";
      labelSector.style.color = "#777777ff";
      labelSector.style.fontSize = "14px";

      // Insertarlo justo después del select oculto
      filtro.insertAdjacentElement("afterend", labelSector);
    }

    labelSector.textContent = `${sectorUsuario}`;
  }

  // -------------------------------
  // ACTIVAR FILTRADO
  // -------------------------------
  filtro.addEventListener("change", () => {
    filtrarPorSector(filtro.value);
  });
}
// =======================================
// GUARDAR CAMBIOS DE AUDITORÍA (ORDEN CORRECTO)
// =======================================
async function guardarCambiosAuditoria() {
  const rol = localStorage.getItem("admin_rol");
  const sectorUsuario = localStorage.getItem("sectorUsuario");

  const numero_cs = document
    .getElementById("tituloModalAuditoria")
    .textContent.match(/\d+/)[0];

  const sector = document.getElementById("hiddenSector").value.trim();
  const fechaRegistro = document
    .getElementById("hiddenFechaRegistro")
    .value.trim();

  const horaEntrada = document.getElementById("inputHoraEntrada").value.trim();
  const horaSalida = document.getElementById("inputHoraSalida").value.trim();

  const actividades = Array.from(
    document.querySelectorAll("#listaActividades .tag")
  )
    .map((t) => t.dataset.texto)
    .join(", ");

  const novedades = Array.from(
    document.querySelectorAll("#listaNovedades .tag")
  )
    .map((t) => t.dataset.texto)
    .join(", ");

  const observaciones = document
    .getElementById("inputObservaciones")
    .value.trim();

  // ==========================================================
  // 1. PRIMERO GUARDAR TEXTO (GET)
  // ==========================================================
  const url = `${API_URL}?accion=guardarAuditoria&numero_cs=${numero_cs}&sector=${encodeURIComponent(
    sector
  )}&fecha_registro=${encodeURIComponent(
    fechaRegistro
  )}&hora_entrada=${encodeURIComponent(
    horaEntrada
  )}&hora_salida=${encodeURIComponent(
    horaSalida
  )}&actividades=${encodeURIComponent(
    actividades
  )}&novedades=${encodeURIComponent(
    novedades
  )}&observaciones=${encodeURIComponent(observaciones)}`;

  let textoGuardadoOK = false;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.success) {
      alert("No se pudieron guardar los cambios");
      return;
    }

    textoGuardadoOK = true;
    console.log("✔ Texto guardado correctamente");
  } catch (error) {
    console.error("❌ Error guardando texto:", error);
    alert("Error al guardar los datos.");
    return;
  }

  // ==========================================================
  // 2. SI EL TEXTO SE GUARDÓ → AHORA SUBIR FOTOS
  // ==========================================================
  if (textoGuardadoOK) {
    // FOTO DE ENTRADA
    if (fotoTemporalEntrada) {
      console.log("Subiendo foto de ENTRADA...");
      const respEntrada = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          accion: "actualizarFoto",
          numero_cs,
          tipo: "entrada",
          sector,
          fecha: fechaRegistro,
          fotoBase64: fotoTemporalEntrada,
          rol: rol,
          sectorUsuario: sectorUsuario,
        }),
      });
      console.log("Respuesta ENTRADA:", await respEntrada.text());
      fotoTemporalEntrada = null;
    }

    // FOTO DE SALIDA
    if (fotoTemporalSalida) {
      console.log("Subiendo foto de SALIDA...");
      const respSalida = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          accion: "actualizarFoto",
          numero_cs,
          tipo: "salida",
          sector,
          fecha: fechaRegistro,
          fotoBase64: fotoTemporalSalida,
          rol: rol,
          sectorUsuario: sectorUsuario,
        }),
      });
      console.log("Respuesta SALIDA:", await respSalida.text());
      fotoTemporalSalida = null;
    }
  }

  // ==========================================================
  // 3. REFRESCAR Y CERRAR MODAL
  // ==========================================================
  alert("Cambios guardados correctamente");

  // Guardar temporal
  localStorage.setItem(
    `auditoria_${numero_cs}`,
    JSON.stringify({
      horaEntrada,
      horaSalida,
      actividades,
      novedades,
      observaciones,
    })
  );

  // Cerrar modal justo después del alert
  cerrarModalAuditoria();
  // Refrescar tablas ANTES de cerrar
  await obtenerRegistrosHoy();
  await cargarHistorial();
}

// =======================================
// confirmar AUDITORÍA FINALIZADA (BOTÓN ROJO)
// =======================================
async function confirmarAuditoriaFrontend() {
  const numero_cs = document.getElementById("hiddenNumeroCS").value;
  const fecha = document.getElementById("hiddenFechaRegistro").value;
  const sector = document.getElementById("hiddenSector").value;

  const rol = localStorage.getItem("admin_rol");
  const sectorUsuario = localStorage.getItem("sectorUsuario");

  const url =
    `${API_URL}?accion=confirmarAuditoria` +
    `&numero_cs=${encodeURIComponent(numero_cs)}` +
    `&fecha=${encodeURIComponent(fecha)}` +
    `&sector=${encodeURIComponent(sector)}` +
    `&rol=${encodeURIComponent(rol)}` +
    `&sectorUsuario=${encodeURIComponent(sectorUsuario)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      alert("✔ Auditoría finalizada");
      obtenerRegistrosHoy();
      cargarHistorial();
      cerrarModalAuditoria();
    } else {
      alert(data.mensaje || "⚠ No se pudo auditar");
    }
  } catch (err) {
    console.error("❌ Error auditando:", err);
    alert("Error al auditar");
  }
}
//===========================
//ENVIAR AUDITORIA PENDIENTE
//===========================
async function enviarAuditoriaPendiente() {
  const numero_cs = document.getElementById("hiddenNumeroCS").value;
  const fecha = document.getElementById("hiddenFechaRegistro").value;
  const sector = document.getElementById("hiddenSector").value;

  const rol = localStorage.getItem("admin_rol");
  const sectorUsuario = localStorage.getItem("sectorUsuario");

  // HACER TODO IGUAL QUE GUARDAR CAMBIOS
  await guardarCambiosAuditoria();

  // LUEGO MARCAR AUDITADO
  const url =
    `${API_URL}?accion=confirmarAuditoria` +
    `&numero_cs=${encodeURIComponent(numero_cs)}` +
    `&fecha=${encodeURIComponent(fecha)}` +
    `&sector=${encodeURIComponent(sector)}` +
    `&rol=${encodeURIComponent(rol)}` +
    `&sectorUsuario=${encodeURIComponent(sectorUsuario)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.success) {
      alert("⚠ No se pudo finalizar la auditoría");
      return;
    }

    alert("✔ Auditoría enviada y finalizada");
    await cargarHistorial();
    cerrarModalAuditoria();
  } catch (err) {
    console.error("Error auditoría pendiente:", err);
    alert("Error enviando auditoría");
  }
}

//========================================
// SUBIR FOTO EDITADA (VERSIÓN PRO)
//========================================
async function subirFotoEditada(event, tipo) {
  const archivo = event.target.files[0];
  if (!archivo) return;

  const lector = new FileReader();
  lector.onload = () => {
    const base64 = lector.result;

    if (tipo === "entrada") {
      fotoTemporalEntrada = base64;
      document.querySelector(".foto-box.entrada .foto-img").src = base64;
    }

    if (tipo === "salida") {
      fotoTemporalSalida = base64;
      document.querySelector(".foto-box.salida .foto-img").src = base64;
    }
  };

  lector.readAsDataURL(archivo);
}

//==========================================
//funcion configurar rango de fecha
//=========================================
function configurarRangoFechaHistorial() {
  const input = document.getElementById("filtroFechaHistorial");
  if (!input) return;

  const hoy = new Date();

  // Ayer (igual que en backend)
  const fechaFin = new Date(hoy);
  fechaFin.setDate(fechaFin.getDate() - 1);

  // 7 días en total (ayer + 6 hacia atrás)
  const fechaInicio = new Date(fechaFin);
  fechaInicio.setDate(fechaFin.getDate() - 7);

  const toISO = (d) => d.toISOString().split("T")[0];

  // Limitar
  input.min = toISO(fechaInicio);
  input.max = toISO(fechaFin);

  // Si la fecha estaba fuera de rango → limpiar
  if (input.value) {
    if (input.value < input.min || input.value > input.max) {
      input.value = "";
    }
  }
}

// ==============================
// CAMBIO DE FECHA → RECARGAR HISTORIAL
// ==============================
document.addEventListener("change", (e) => {
  if (e.target.id === "filtroFechaHistorial") {
    cargarHistorial();
  }
});

// ======================================================
// CARGAR HISTORIAL — Últimos 7 días (sin incluir HOY)
// Módulo: Auditoría Pendiente
// ======================================================
async function cargarHistorial() {
  //Leer rol y sector desde locastorage
  const rol = localStorage.getItem("admin_rol");
  const sectorUsuario = localStorage.getItem("sectorUsuario");
  //nuevo fetch que trae el rol y secotr
  const url = `${API_URL}?accion=historial&rol=${encodeURIComponent(
    rol
  )}&sector=${encodeURIComponent(sectorUsuario)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Historial-Pendientes data:", data);
    const hoy = new Date().toISOString().slice(0, 10);
    let registros = data.registros || [];

    // 1. Quitar registros de HOY (pendientes = días anteriores)
    registros = registros.filter(
      (r) => (r.fecha_entrada || "").split("T")[0] !== hoy
    );
    // 2. Quitar registros AUDITADOS (solo queremos pendientes)
    registros = registros.filter(
      (r) => (r.estado || "").toUpperCase() !== "AUDITADO"
    );

    // =============================================
    // ACTUALIZAR CONTADOR DE PENDIENTES EN EL TÍTULO
    // =============================================
    const contador = document.getElementById("conteoPendientes");
    if (contador) {
      contador.textContent = registros.length;
    }
    renderizarHistorial(registros);
    llenarFiltroSectoresHistorial(registros);

    document
      .getElementById("filtroSectorHistorial")
      .addEventListener("change", function () {
        filtrarHistorialPorSector(this.value);
      });
  } catch (error) {
    console.error("❌ Error al cargar pendientes:", error);
    alert("Error cargando pendientes");
  }
}
//filtro por sector tambien para historial
function llenarFiltroSectoresHistorial(registros) {
  let filtro = document.getElementById("filtroSectorHistorial");
  if (!filtro) return;

  // Obtener sectores únicos
  const sectores = [...new Set(registros.map((r) => r.sector).filter(Boolean))];

  // Limpiar
  filtro.innerHTML = `<option value="">Todos</option">`;

  sectores.forEach((sector) => {
    const opt = document.createElement("option");
    opt.value = sector;
    opt.textContent = sector;
    filtro.appendChild(opt);
  });

  // Evitar eventos duplicados
  const nuevo = filtro.cloneNode(true);
  filtro.parentNode.replaceChild(nuevo, filtro);
  filtro = nuevo;

  const rol = localStorage.getItem("admin_rol");
  const sectorUsuario = localStorage.getItem("sectorUsuario");

  // SI ES ADMIN → esconder filtro + mostrar texto fijo
  if (rol?.toLowerCase() === "admin") {
    filtro.style.display = "none";

    const textoFiltro = document.querySelector(".texto-filtro-historial");
    if (textoFiltro) textoFiltro.style.display = "none";

    let label = document.getElementById("labelSectorHistorial");
    if (!label) {
      label = document.createElement("div");
      label.id = "labelSectorHistorial";
      label.style.fontWeight = "600";
      label.style.color = "#7d7d7d";
      label.style.fontSize = "14px";
      label.style.marginLeft = "10px";
      filtro.insertAdjacentElement("afterend", label);
    }

    label.textContent = `Sector: ${sectorUsuario}`;
  }

  // SI ES SUPER ADMIN → activar filtrado
  filtro.addEventListener("change", () => {
    filtrarHistorialPorSector(filtro.value);
  });
}

function filtrarHistorialPorSector(sector) {
  const rol = localStorage.getItem("admin_rol") || "";
  const sectorUsuario = localStorage.getItem("sectorUsuario") || "";

  fetch(
    `${API_URL}?accion=historial&rol=${encodeURIComponent(
      rol
    )}&sector=${encodeURIComponent(sectorUsuario)}`
  )
    .then((res) => res.json())
    .then((data) => {
      let registros = data.registros || [];

      const hoy = new Date().toISOString().slice(0, 10);

      // Solo días anteriores
      registros = registros.filter(
        (r) => (r.fecha_entrada || "").split("T")[0] !== hoy
      );

      // Solo los NO auditados
      registros = registros.filter(
        (r) => (r.estado || "").toUpperCase() !== "AUDITADO"
      );

      // FILTRAR POR SECTOR
      if (sector) {
        registros = registros.filter((r) => r.sector === sector);
      }

      // ACTUALIZAR CONTADOR
      const contador = document.getElementById("conteoPendientes");
      if (contador) {
        contador.textContent = registros.length;
      }

      // Renderizar tabla final
      renderizarHistorial(registros);
    })
    .catch((err) => console.error("❌ Error filtrando historial:", err));
}

// ======================================================
// RENDERIZAR TABLA DEL HISTORIAL PENDIENTESSS
// ======================================================
function renderizarHistorial(registros) {
  const tbody = document.getElementById("historialBodyFront");
  tbody.innerHTML = "";

  if (!registros || registros.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="21" class="text-center text-muted">
          No hay registros en el historial 📭
        </td>
      </tr>`;
    return;
  }

  registros.forEach((fila) => {
    const obj = construirObjetoHistorial(fila);
    const objJSON = JSON.stringify(obj).replace(/"/g, "&quot;");
    const estado = (fila.estado || "").toUpperCase();

    document.getElementById("hiddenOrigenAuditoria").value = "pendientes";

    const html = `
      <tr>
        <td>${fila.id}</td>
        <td>${fila.numero_cs}</td>
        <td>${fila.nombre_usuario}</td>
        <td>${fila.tipo_usuario}</td>
        <td>${fila.sector}</td>

        <td>${fila.tipo_fotoentrada || "-"}</td> 
        <td>${fila.fecha_entrada || "-"}</td>
        <td>${fila.hora_entrada || "-"}</td>
        <td>${fila.lat_entrada || "-"}</td>
        <td>${fila.lng_entrada || "-"}</td>
        <td>
          ${
            fila.enlace_fotoentrada
              ? `<a href="${fila.enlace_fotoentrada}" target="_blank">Ver</a>`
              : "-"
          }
        </td>

        <td>${fila.tipo_fotosalida || "-"}</td>
        <td>${fila.fecha_salida || "-"}</td>
        <td>${fila.hora_salida || "-"}</td>
        <td>${fila.lat_salida || "-"}</td>
        <td>${fila.lng_salida || "-"}</td>
        <td>
          ${
            fila.enlace_fotosalida
              ? `<a href="${fila.enlace_fotosalida}" target="_blank">Ver</a>`
              : "-"
          }
        </td>

        <td>${fila.actividades || "-"}</td>
        <td>${fila.novedades || "-"}</td>
        <td>${fila.observaciones || "-"}</td>

        <td>
          ${
            estado === "AUDITADO"
              ? `<span class="badge bg-success">Auditado ✔</span>`
              : `<button class="btn btn-sm btn-audit"
                    onclick='abrirModalAuditoria(${objJSON})'>
                    <i class="fa-solid fa-file-shield"></i> Auditar
                </button>`
          }
        </td>
      </tr>`;

    tbody.insertAdjacentHTML("beforeend", html);
  });
}

//==========================================================================================
//constructr de objeto para auditar historial PENDIENTES *(reutiliza el mismo modal de auditoria iaria)
//==========================================================================================
function construirObjetoHistorial(fila) {
  // =============================
  // LIMPIAR FECHA (Cualquiera → YYYY-MM-DD)
  // =============================
  function limpiarFecha(v) {
    if (!v) return "";

    // Si es objeto Date
    if (v instanceof Date && !isNaN(v)) {
      return v.toISOString().split("T")[0]; // YYYY-MM-DD
    }

    let s = String(v).trim();
    if (s === "") return "";

    // Serial de Google Sheets
    if (!isNaN(s) && !s.includes("-") && !s.includes("/")) {
      const ms = (Number(s) - 25569) * 86400 * 1000;
      return new Date(ms).toISOString().split("T")[0];
    }

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    // MM/DD/YYYY → YYYY-MM-DD
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
      const [mm, dd, yyyy] = s.split("/");
      return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }

    // Último intento → Date()
    const f = new Date(s);
    return isNaN(f) ? "" : f.toISOString().split("T")[0];
  }

  // =============================
  // LIMPIAR HORA (Cualquiera → HH:mm:ss)
  // =============================
  function limpiarHora(v) {
    if (!v) return "";

    // Si es Date con hora
    if (v instanceof Date && !isNaN(v)) {
      const h = v.getHours(); // 0 - 23
      const m = v.getMinutes(); // 0 - 59
      const s = v.getSeconds(); // 0 - 59
      return `${h}:${m.toString().padStart(2, "0")}:${s
        .toString()
        .padStart(2, "0")}`;
    }

    let s = String(v).trim();
    if (s === "") return "";

    // FORMATO HH:mm (acepta 1 o 2 dígitos en la hora)
    if (/^\d{1,2}:\d{2}$/.test(s)) {
      let [h, m] = s.split(":");
      // Quitar ceros adelante SOLO en la hora
      h = h.replace(/^0+/, "") || "0";
      return `${h}:${m}:00`;
    }

    // FORMATO HH:mm:ss (acepta 1 o 2 dígitos en la hora)
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(s)) {
      let [h, m, sec] = s.split(":");
      h = h.replace(/^0+/, "") || "0";
      return `${h}:${m}:${sec}`;
    }

    // Si viene tipo 1899-12-30T23:38:52Z
    if (s.includes("T")) {
      let hhmmss = s.split("T")[1].split(".")[0];
      let [h, m, sec] = hhmmss.split(":");
      h = h.replace(/^0+/, "") || "0";
      return `${h}:${m}:${sec}`;
    }

    return "";
  }

  // =============================
  // CONSTRUCCIÓN FINAL DEL OBJETO
  // =============================
  return {
    tipo_usuario: fila.tipo_usuario,
    numero_cs: fila.numero_cs,
    nombre: fila.nombre_usuario,
    sector: fila.sector,
    fecha:
      limpiarFecha(fila.fecha_entrada) || limpiarFecha(fila.fecha_salida) || "",

    entrada: {
      hora: limpiarHora(fila.hora_entrada),
      fecha: limpiarFecha(fila.fecha_entrada),
      enlace: fila.enlace_fotoentrada,
      lat: fila.lat_entrada,
      lng: fila.lng_entrada,
    },

    salida: {
      hora: limpiarHora(fila.hora_salida),
      fecha: limpiarFecha(fila.fecha_salida),
      enlace: fila.enlace_fotosalida,
      lat: fila.lat_salida,
      lng: fila.lng_salida,
    },

    actividades: fila.actividades || "",
    novedades: fila.novedades || "",
    observaciones: fila.observaciones || "",
    estado_auditoria: fila.estado || "",
  };
}
//====================================================================================================================================================================================
//MODULO USUASRIOS
async function cargarUsuarios() {
  try {
    const res = await fetch(`${API_URL}?accion=listarUsuarios`);
    const data = await res.json();

    if (data.ok) {
      renderizarUsuarios(data.usuarios);
    } else {
      alert("Error cargando usuarios");
    }
  } catch (err) {
    console.error("Error:", err);
    alert("Error conectando con el servidor");
  }
}

//====================MODULO USUARIOSSSSSSSSSSSSSSSSSSSSS===================================
function renderizarUsuarios(registros) {
  const tbody = document.getElementById("tablaUsuarios");
  tbody.innerHTML = "";

  const rol = localStorage.getItem("admin_rol");
  const esSuperAdmin = rol === "SuperAdmin";

  registros.forEach((u) => {
    const disabled = esSuperAdmin ? "" : "disabled";

    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${u.numero_cs}</td>
      <td>${u.nombre}</td>
      <td>${u.tipo}</td>
      <td>${u.sector}</td>

      <td>
        <label>
          <input type="checkbox" class="chk-estado"
                 data-cs="${u.numero_cs}"
                 data-estado="ACTIVO"
                 ${u.estado === "ACTIVO" ? "checked" : ""}
                 ${disabled}>
          ACTIVO
        </label>
      </td>

      <td>
        ${
          esSuperAdmin
            ? `<button class="btn btn-warning btn-sm" onclick="editarUsuario('${u.numero_cs}')">
                 <i class="fa-solid fa-pen"></i>
               </button>`
            : `<span class="text-muted">—</span>`
        }
      </td>
    `;

    tbody.appendChild(fila);
  });
}

//evento solo selecionar un chech
document.addEventListener("change", (e) => {
  if (!e.target.classList.contains("chk-estado")) return;

  const rol = localStorage.getItem("admin_rol");
  const esSuperAdmin = rol === "SuperAdmin";

  if (!esSuperAdmin) {
    e.preventDefault();
    e.target.checked = !e.target.checked;
    return;
  }

  const cs = e.target.dataset.cs;
  const nuevoEstado = e.target.checked ? "ACTIVO" : "INACTIVO";

  const otros = document.querySelectorAll(
    `.chk-estado[data-cs="${cs}"]:not([data-estado="${nuevoEstado}"])`
  );
  otros.forEach((chk) => (chk.checked = false));

  actualizarEstadoUsuario(cs, nuevoEstado);
});

//abrr modal en modod agregr
document.getElementById("btnAgregarUsuario").addEventListener("click", () => {
  document.getElementById("tituloModalUsuario").textContent = "Nuevo usuario";
  document.getElementById("formUsuario").reset();
  document.getElementById("id_editar").value = "";
  mostrarModalUsuario();
});

//abrir moal el modo editar
function editarUsuario(numeroCS) {
  const usuario = listaUsuariosGlobal.find((u) => u.numero_cs == numeroCS);

  document.getElementById("tituloModalUsuario").textContent = "Editar usuario";

  document.getElementById("id_editar").value = numeroCS;
  document.getElementById("numero_cs").value = usuario.numero_cs;
  document.getElementById("nombre_usuario").value = usuario.nombre;
  document.getElementById("tipo_usuario").value = usuario.tipo;
  document.getElementById("sector_usuario").value = usuario.sector;
  document.getElementById("estado_usuario").value = usuario.estado;

  mostrarModalUsuario();
}
//mostrar modal bootstrap
function mostrarModalUsuario() {
  const modal = new bootstrap.Modal(document.getElementById("modalUsuario"));
  modal.show();
}

async function actualizarEstadoUsuario(cs, estado) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accion: "actualizarEstadoUsuario",
        numero_cs: cs,
        estado: estado,
      }),
    });

    const data = await res.json();
    console.log("RESPUESTA BACKEND:", data);

    if (data.ok) {
      // Recargar usuarios automáticamente
      cargarUsuarios();
    } else {
      alert(data.msg || "Error al actualizar estado");
    }
  } catch (err) {
    console.error(err);
    alert("Error de conexión");
  }
}
