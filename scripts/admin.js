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

  // Agrupar registros por número de cuadrilla o supervisor (numero_cs)
  const agrupados = {};
  registros.forEach((r) => {
    if (!agrupados[r.numero_cs]) agrupados[r.numero_cs] = [];
    agrupados[r.numero_cs].push(r);
  });

  // Renderizar por usuario
  Object.values(agrupados).forEach((registrosUsuario) => {
    const entrada =
      registrosUsuario.find((r) => r.tipo?.toLowerCase() === "entrada") || {};
    const salida =
      registrosUsuario.find((r) => r.tipo?.toLowerCase() === "salida") || {};

    const filaHTML = `
      <tr>
        <td rowspan="2">${entrada.numero_cs || salida.numero_cs || "-"}</td>
        <td rowspan="2">${entrada.nombre || salida.nombre || "-"}</td>
        <td rowspan="2">${entrada.sector || salida.sector || "-"}</td>

        <!-- Entrada -->
        <td>${entrada.tipo || "Entrada"}</td>
        <td>${entrada.hora || "-"}</td>
        <td>
          ${
            entrada.enlace
              ? `<a href="${entrada.enlace}" target="_blank" class="btn btn-sm btn-gray"><i class="fa-solid fa-camera"></i> Ver foto</a>`
              : `<button class="btn btn-sm btn-gray" disabled><i class="fa-solid fa-camera"></i> Sin foto</button>`
          }
          <button class="btn btn-sm btn-gray"
            onclick="limpiarRegistro('${
              entrada.numero_cs || salida.numero_cs
            }', 'Entrada', '${entrada.sector || salida.sector}')">
            <i class="fa-solid fa-broom"></i> Limpiar
          </button>
        </td>

        <!-- Botón Auditar combinado -->
        <td rowspan="2" class="text-center align-middle">
          <button class="btn btn-sm btn-audit"
          onclick="abrirModalAuditoria('${
            entrada.numero_cs || salida.numero_cs
          }')">
            <i class="fa-solid fa-file-shield"></i> Auditar
          </button>
        </td>
      </tr>

      <tr>
        <!-- Salida -->
        <td>${salida.tipo || "Salida"}</td>
        <td>${salida.hora || "-"}</td>
        <td>
          ${
            salida.enlace
              ? `<a href="${salida.enlace}" target="_blank" class="btn btn-sm btn-gray"><i class="fa-solid fa-camera"></i> Ver foto</a>`
              : `<button class="btn btn-sm btn-gray" disabled><i class="fa-solid fa-camera"></i> Sin foto</button>`
          }
          <button class="btn btn-sm btn-gray"
            onclick="limpiarRegistro('${
              entrada.numero_cs || salida.numero_cs
            }', 'Salida', '${entrada.sector || salida.sector}')">
            <i class="fa-solid fa-broom"></i> Limpiar
          </button>
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

// =======================================
// LIMPIAR REGISTRO (Frontend)
// =======================================
async function limpiarRegistro(numero_cs, tipo, sector) {
  const confirmar = confirm(
    `¿Seguro que deseas limpiar el registro de ${tipo} del usuario ${numero_cs}?`
  );
  if (!confirmar) return;

  try {
    const hoy = new Date().toISOString().split("T")[0]; // yyyy-MM-dd
    const res = await fetch(
      `${API_URL}?accion=limpiarRegistro&numero_cs=${numero_cs}&tipo=${tipo}&sector=${sector}&fecha=${hoy}`
    );
    const data = await res.json();

    if (data.success) {
      alert(`✅ ${data.mensaje}`);
      obtenerRegistrosHoy(); // recarga la tabla para ver cambios
    } else {
      alert(`⚠️ ${data.mensaje}`);
    }
  } catch (err) {
    console.error("❌ Error al limpiar registro:", err);
    alert(
      "Error al intentar limpiar el registro. Verifica la conexión o la API."
    );
  }
}
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
    if (link.innerText.includes("Historial"))
      document.getElementById("mod-historial").classList.remove("d-none");
    if (link.innerText.includes("Configuración"))
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

// =========================================================================
// Convertir enlace de Drive a un enlace directo que el <img> pueda mostrar
// =========================================================================
function convertirDriveDirecto(url) {
  if (!url) return "";

  if (!url.includes("drive.google.com")) return url;

  // Extraer ID
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return url;

  const id = match[1];

  // Enlace directo que SÍ carga en <img>
  return `https://drive.google.com/uc?export=view&id=${id}`;
}

// =======================================
// ABRIR MODAL DE AUDITORÍA (VERSIÓN COMPLETA)
// =======================================

function abrirModalAuditoria(numero_cs) {
  // Mostrar modal
  document.getElementById("modalAuditoria").classList.remove("d-none");
  document.getElementById("overlay").classList.remove("d-none");

  console.log("🟢 Abriendo auditoría para:", numero_cs);

  // Buscar registros de ese usuario
  const registrosUsuario = registrosHoyGlobal.filter(
    (r) => String(r.numero_cs) === String(numero_cs)
  );

  if (!registrosUsuario.length) {
    alert("No se encontró información del usuario en registrosHoyGlobal.");
    return;
  }

  // Separar entrada y salida
  const entrada =
    registrosUsuario.find((r) => r.tipo?.toLowerCase() === "entrada") || {};
  const salida =
    registrosUsuario.find((r) => r.tipo?.toLowerCase() === "salida") || {};

  // ---------------------------------------------
  // LLENAR ENCABEZADO
  // ---------------------------------------------
  const titulo = document.getElementById("tituloModalAuditoria");
  const hoy = new Date();
  const fecha = hoy.toLocaleDateString("es-ES");

  titulo.textContent = `AUDITORÍA – CUADRILLA ${numero_cs}      ${fecha}`;

  // ---------------------------------------------
  // HORAS (24H)
  // ---------------------------------------------
  const inputHoraEntrada = document.getElementById("inputHoraEntrada");
  const inputHoraSalida = document.getElementById("inputHoraSalida");

  // Normalizar horas para input type="time"
  inputHoraEntrada.value = normalizarHora(entrada.hora);
  inputHoraSalida.value = normalizarHora(salida.hora);

  // Guardar la hora original (ya normalizada) por si borran
  inputHoraEntrada.dataset.original = inputHoraEntrada.value;
  inputHoraSalida.dataset.original = inputHoraSalida.value;

  // Si borran todo → restaurar
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

  // SOLO NÚMEROS Y :
  inputHoraEntrada.addEventListener("input", () => {
    inputHoraEntrada.value = inputHoraEntrada.value.replace(/[^0-9:]/g, "");
  });

  inputHoraSalida.addEventListener("input", () => {
    inputHoraSalida.value = inputHoraSalida.value.replace(/[^0-9:]/g, "");
  });

  // ---------------------------------------------
  // GOOGLE MAPS LINKS
  // ---------------------------------------------
  const linkEntrada = document.getElementById("linkEntrada");
  const linkSalida = document.getElementById("linkSalida");

  if (entrada.lat && entrada.lng) {
    linkEntrada.href = `https://www.google.com/maps?q=${entrada.lat},${entrada.lng}`;
  } else {
    linkEntrada.removeAttribute("href");
  }

  if (salida.lat && salida.lng) {
    linkSalida.href = `https://www.google.com/maps?q=${salida.lat},${salida.lng}`;
  } else {
    linkSalida.removeAttribute("href");
  }

  // ---------------------------------------------
  // ACTIVIDADES (2) — desde BD
  // ---------------------------------------------
  const listaAct = document.getElementById("listaActividades");
  listaAct.innerHTML = "";

  if (entrada.actividades) {
    entrada.actividades.split(",").forEach((act) => {
      act = act.trim();
      if (!act) return;

      const tag = document.createElement("div");
      tag.classList.add("tag");
      tag.dataset.texto = act;
      tag.innerHTML = `${act} <button class='close-btn'>×</button>`;
      tag
        .querySelector(".close-btn")
        .addEventListener("click", () => tag.remove());
      listaAct.appendChild(tag);
    });
  }

  // ---------------------------------------------
  // NOVEDADES (3) — desde BD
  // ---------------------------------------------
  const listaNov = document.getElementById("listaNovedades");
  listaNov.innerHTML = "";

  if (entrada.novedades) {
    entrada.novedades.split(",").forEach((nov) => {
      nov = nov.trim();
      if (!nov) return;

      const tag = document.createElement("div");
      tag.classList.add("tag");
      tag.dataset.texto = nov;
      tag.innerHTML = `${nov} <button class='close-btn'>×</button>`;
      tag
        .querySelector(".close-btn")
        .addEventListener("click", () => tag.remove());
      listaNov.appendChild(tag);
    });
  }

  // ---------------------------------------------
  // OBSERVACIONES
  // ---------------------------------------------
  const inputObs = document.getElementById("inputObservaciones");
  inputObs.value = entrada.observaciones || "";

  // ---------------------------------------------
  // CONTROL DE AUDITORÍA
  // ---------------------------------------------
  const botonAuditar = document.getElementById("btnConfirmarAuditoria");

  const estado = entrada.estado_auditoria?.trim().toUpperCase();

  const horaActual = new Date().getHours();

  if (estado === "AUDITADO") {
    // Ya auditado → ver solamente
    botonAuditar.disabled = true;
    botonAuditar.classList.add("btn-disabled");
  } else {
    // No auditado
    if (horaActual < 17) {
      botonAuditar.disabled = true;
      botonAuditar.classList.add("btn-disabled");
    } else {
      botonAuditar.disabled = false;
      botonAuditar.classList.remove("btn-disabled");
    }
  }

  // ---------------------------------------------
  // MOSTRAR FOTOS EN EL MODAL
  // ---------------------------------------------
  const imgEntrada = document.querySelector(".foto-box.entrada .foto-img");
  const imgSalida = document.querySelector(".foto-box.salida  .foto-img");

  // FOTO DE ENTRADA
  if (entrada.enlace) {
    imgEntrada.src = convertirDriveDirecto(entrada.enlace);
  } else {
    imgEntrada.src = "https://via.placeholder.com/120x120?text=Sin+foto";
  }

  // FOTO DE SALIDA
  if (salida.enlace) {
    imgSalida.src = convertirDriveDirecto(salida.enlace);
  } else {
    imgSalida.src = "https://via.placeholder.com/120x120?text=Sin+foto";
  }
}

//=======================================
//normalizar hora para <input type="time"> → "HH:MM"
//=======================================
function normalizarHora(hora) {
  if (!hora) return "";

  // Convertir a string y eliminar espacios
  hora = String(hora).trim();

  // Separar por :
  const partes = hora.split(":");

  // Asegurar formato HH:MM (ignoramos los segundos)
  const h = partes[0].padStart(2, "0");
  const m = partes[1].padStart(2, "0");

  return `${h}:${m}`;
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

// =======================================
// LLENAR SELECT DE SECTORES AUTOMÁTICAMENTE
// =======================================
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
    .textContent.split(" ")[2]; // Extrae la cuadrilla

  // -------------------------
  // 1. OBTENER HORAS EDITADAS
  // -------------------------
  const horaEntrada = document.getElementById("inputHoraEntrada").value.trim();
  const horaSalida = document.getElementById("inputHoraSalida").value.trim();

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
  // 5. CONSTRUIR URL PARA GUARDAR
  // -------------------------
  const url = `${API_URL}?accion=guardarAuditoria&numero_cs=${numero_cs}&hora_entrada=${encodeURIComponent(
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

      // -------------------------
      // 6. GUARDAR TAMBIÉN EN LOCALSTORAGE
      // -------------------------
      const clave = `auditoria_${numero_cs}`;
      const objetoLocal = {
        horaEntrada,
        horaSalida,
        actividades,
        novedades,
        observaciones,
      };

      localStorage.setItem(clave, JSON.stringify(objetoLocal));

      // Recargar tabla
      obtenerRegistrosHoy();

      // cerrar modal
      cerrarModalAuditoria();
    } else {
      alert("⚠ No se pudieron guardar los cambios");
    }
  } catch (error) {
    console.error("❌ Error guardando auditoría:", error);
    alert("Error al guardar los cambios.");
  }
}
