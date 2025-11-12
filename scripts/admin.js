// =======================================
// CONFIGURACIÓN BASE
// =======================================
const API_URL = "https://proxy-asistencia.control-energiasrc.workers.dev";

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

function abrirModalAuditoria(numero_cs) {
  document.getElementById("modalAuditoria").classList.remove("d-none");
  document.getElementById("overlay").classList.remove("d-none");
  console.log("🟢 Abriendo auditoría para:", numero_cs);
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
