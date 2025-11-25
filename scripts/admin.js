// =======================================
// CONFIGURACIÓN BASE
// =======================================
const API_URL = "https://proxy-asistencia.control-energiasrc.workers.dev";

// =======================================
// VARIABLES GLOBALES
// =======================================
let registrosHoyGlobal = []; // aquí guardaremos los registros válidos de hoy
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
  const nombre = localStorage.getItem("nombreUsuario");
  const rol = localStorage.getItem("rolUsuario");
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
    const res = await fetch(`${API_URL}?accion=registrosHoy`);
    const data = await res.json();
    console.log("Datos recibidos:", data);
    if (data && data.registros) {
      //  GUARDAMOS TODOS LOS REGISTROS EN UNA VARIABLE GLOBAL
      registrosHoyGlobal = data.registros;
      // Filtrar solo registros con foto (enlace existente)
      const entradas = data.registros.filter(
        (r) =>
          r.tipo?.toLowerCase() === "entrada" &&
          r.enlace &&
          r.enlace.trim() !== ""
      ).length;
      const salidas = data.registros.filter(
        (r) =>
          r.tipo?.toLowerCase() === "salida" &&
          r.enlace &&
          r.enlace.trim() !== ""
      ).length;
      // Mostrar los valores en las tarjetas
      document.getElementById("metricEntradas").textContent = entradas;
      document.getElementById("metricSalidas").textContent = salidas;
      // Renderizar tabla normalmente
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
          <button class="btn btn-sm btn-audit"
            onclick='abrirModalAuditoria(${registroJSON})'>
            <i class="fa-solid fa-file-shield"></i> Auditar
          </button>
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
// FILTRAR TABLA POR SECTOR (CORREGIDO)
// =======================================
function filtrarPorSector(sectorSeleccionado) {
  // 1. Volvemos a pedir los registros del día
  fetch(`${API_URL}?accion=registrosHoy`)
    .then((res) => res.json())
    .then((data) => {
      // 2. Verificamos que existan registros válidos
      if (!data || !data.registros) {
        renderizarTabla([]);
        return;
      }
      let registros = data.registros;
      // 3. Aplicamos filtro REAL por sector
      //    Aquí filtramos los datos ANTES de enviarlos a la tabla,
      //    evitando ocultar <tr> por separado y romper rowspan.
      if (sectorSeleccionado) {
        registros = registros.filter((r) => r.sector === sectorSeleccionado);
      }
      // 4. Renderizamos SOLO los registros filtrados
      //    Esto mantiene Entrada + Salida juntas.
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
    // Evitar conflicto con "Cerrar sesión"
    if (link.innerText.includes("Cerrar")) {
      const confirmar = confirm("¿Seguro que deseas cerrar sesión?");
      if (!confirmar) return;
      localStorage.clear();
      window.location.href = "index.html"; // tu login
      return; // detiene el resto del código
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
    if (link.innerText.includes("Pendientes"))
      document.getElementById("mod-historial").classList.remove("d-none");
    configurarRangoFechaHistorial(); // para el input date
    cargarHistorial(); // ← AQUÍ SE CARGA AUTOMÁTICAMENTE EL HISTORIAL
    if (link.innerText.includes("Contraseña"))
      document.getElementById("mod-config").classList.remove("d-none");
  });
});
// =======================================
// MODAL DE AUDITORÍA
// =======================================
const actividades = [
  "Revision - Normalizacion",
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
// Normalizar hora para <input type="time"> → "HH:MM"
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
//Convertir a drive con formato thumbnail (miniaatura)
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
  // Mostrar modal
  document.getElementById("modalAuditoria").classList.remove("d-none");
  document.getElementById("overlay").classList.remove("d-none");
  console.log("Abriendo auditoría para:", registro);
  // -----------------------------
  // 1. GUARDAR EN INPUTS OCULTOS
  // -----------------------------
  document.getElementById("hiddenNumeroCS").value = registro.numero_cs;
  document.getElementById("hiddenFechaRegistro").value = registro.fecha;
  document.getElementById("hiddenSector").value = registro.sector;

  const entrada = registro.entrada || {};
  const salida = registro.salida || {};
  // -----------------------------
  // 2. TITULO DEL MODAL
  // -----------------------------
  const titulo = document.getElementById("tituloModalAuditoria");
  titulo.textContent = `AUDITORÍA – ${registro.tipo_usuario} ${registro.numero_cs}`;
  // FECHA DEL REGISTRO (entrada o salida)
  const fechaLabel = document.getElementById("fechaAuditoria");
  fechaLabel.textContent = registro.fecha ? registro.fecha : "Sin fecha";

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
  imgEntrada.src = urlConvertidaEntrada
    ? urlConvertidaEntrada
    : "https://placehold.co/120x120?text=Sin+foto";

  imgSalida.src = urlConvertidaSalida
    ? urlConvertidaSalida
    : "https://placehold.co/120x120?text=Sin+foto";

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
  const rol = localStorage.getItem("rolUsuario");
  const sectorUsuario = localStorage.getItem("sectorUsuario");

  if (rol?.toLowerCase() === "admin") {
    filtro.value = sectorUsuario || "";
    filtro.disabled = true;
  }

  // -------------------------------
  // ACTIVAR FILTRADO
  // -------------------------------
  filtro.addEventListener("change", () => {
    filtrarPorSector(filtro.value);
  });
}
// =======================================
// GUARDAR CAMBIOS DE AUDITORÍA
// =======================================
async function guardarCambiosAuditoria() {
  const numero_cs = document
    .getElementById("tituloModalAuditoria")
    .textContent.match(/\d+/)[0];

  // AGREGADO: obtener sector
  const sector = document.getElementById("hiddenSector").value.trim();

  // -------------------------
  // 1. OBTENER HORAS y fecha EDITADAS
  // -------------------------
  const horaEntrada = document.getElementById("inputHoraEntrada").value.trim();
  const horaSalida = document.getElementById("inputHoraSalida").value.trim();
  const fechaRegistro = document
    .getElementById("hiddenFechaRegistro")
    .value.trim();

  // -------------------------
  // 2. OBTENER ACTIVIDADES
  // -------------------------
  const actividadesTags = Array.from(
    document.querySelectorAll("#listaActividades .tag")
  ).map((t) => t.dataset.texto);

  const actividades = actividadesTags.join(", ");

  // -------------------------
  // 3. OBTENER NOVEDADES
  // -------------------------
  const novedadesTags = Array.from(
    document.querySelectorAll("#listaNovedades .tag")
  ).map((t) => t.dataset.texto);

  const novedades = novedadesTags.join(", ");

  // -------------------------
  // 4. OBTENER OBSERVACIONES
  // -------------------------
  const observaciones = document
    .getElementById("inputObservaciones")
    .value.trim();

  // -------------------------
  // 5. URL COMPLETA (con sector)
  // -------------------------
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

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      alert("✔ Cambios guardados correctamente");

      const clave = `auditoria_${numero_cs}`;
      const objetoLocal = {
        horaEntrada,
        horaSalida,
        actividades,
        novedades,
        observaciones,
      };

      localStorage.setItem(clave, JSON.stringify(objetoLocal));
      obtenerRegistrosHoy(); // refresca el panel del día
      cargarHistorial(); // refresca historial automáticamente
      cerrarModalAuditoria(); // cierra modal
    } else {
      alert("⚠ No se pudieron guardar los cambios");
    }
  } catch (error) {
    console.error("❌ Error guardando auditoría:", error);
    alert("Error al guardar los cambios.");
  }
}

// =======================================
// CONFIRMAR AUDITORÍA (BOTÓN ROJO)
// =======================================
async function confirmarAuditoriaFrontend() {
  // Sacar el número CS del título del modal
  const numero_cs = document
    .getElementById("tituloModalAuditoria")
    .textContent.match(/\d+/)[0];

  const url = `${API_URL}?accion=confirmarAuditoria&numero_cs=${numero_cs}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      alert("✔ Registro marcado como AUDITADO");

      // Recargar tabla de HOY
      obtenerRegistrosHoy();

      // Recargar tabla de PENDIENTES (para que desaparezca de ahí)
      cargarHistorial();

      // Cerrar modal
      cerrarModalAuditoria();
    } else {
      alert(data.mensaje || "⚠ No se pudo auditar");
    }
  } catch (err) {
    console.error("❌ Error al auditar:", err);
    alert("Error al auditar el registro.");
  }
}

//========================================
// SUBIR FOTO EDITADA (VERSIÓN PRO)
//========================================
async function subirFotoEditada(event, tipo) {
  const archivo = event.target.files[0];
  if (!archivo) return;

  // Convertir archivo a Base64
  const base64 = await new Promise((resolve) => {
    const lector = new FileReader();
    lector.onloadend = () => resolve(lector.result);
    lector.readAsDataURL(archivo);
  });

  // Número CS desde el título del modal
  const numero_cs = document
    .getElementById("tituloModalAuditoria")
    .textContent.match(/\d+/)[0];

  // Sector REAL del registro
  const sector = document.getElementById("hiddenSector").value.trim();

  // FECHA REAL del registro (entrada o salida)
  const fecha = document.getElementById("hiddenFechaRegistro").value.trim();

  // Enviar al API
  const body = {
    accion: "actualizarFoto",
    numero_cs,
    tipo,
    sector,
    fecha,
    fotoBase64: base64,
  };

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (data.ok) {
    alert("✔ Foto actualizada correctamente");

    // Actualizar imagen en pantalla
    if (tipo === "entrada") {
      document.querySelector(".foto-box.entrada .foto-img").src = data.link;
    } else {
      document.querySelector(".foto-box.salida .foto-img").src = data.link;
    }

    // Recargar tabla del dashboard
    obtenerRegistrosHoy();
  } else {
    alert("❌ Error al actualizar la foto");
  }
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

  // 8 días en total (ayer + 7 hacia atrás)
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
  const url = `${API_URL}?accion=historial`;

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
  } catch (error) {
    console.error("❌ Error al cargar pendientes:", error);
    alert("Error cargando pendientes");
  }
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

//HOLAAAAAAAAAAAAAAAAAAAAAAA
