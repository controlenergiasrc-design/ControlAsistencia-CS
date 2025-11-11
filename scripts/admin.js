// =======================================
// CONFIGURACIÓN BASE
// =======================================
const API_URL = "https://proxy-asistencia.control-energiasrc.workers.dev";

// =======================================
// AL CARGAR LA PÁGINA
// =======================================
document.addEventListener("DOMContentLoaded", () => {
  obtenerRegistrosHoy();
});

// =======================================
// OBTENER REGISTROS DEL DÍA
// =======================================
async function obtenerRegistrosHoy() {
  try {
    const res = await fetch(`${API_URL}?accion=registrosHoy`);
    const data = await res.json();
    console.log("Datos recibidos:", data);

    if (data && data.registros) {
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
    const entrada = registrosUsuario.find((r) => r.tipo?.toLowerCase() === "entrada") || {};
    const salida = registrosUsuario.find((r) => r.tipo?.toLowerCase() === "salida") || {};

    const filaHTML = `
      <tr>
        <td rowspan="2">${entrada.numero_cs || salida.numero_cs || "-"}</td>
        <td rowspan="2">${entrada.nombre || salida.nombre || "-"}</td>
        <td rowspan="2">${entrada.sector || salida.sector || "-"}</td>

        <!-- Entrada -->
        <td>${entrada.tipo || "Entrada"}</td>
        <td>${entrada.fecha || "-"}</td>
        <td>${entrada.hora || "-"}</td>
        <td>
          ${
            entrada.enlace
              ? `<a href="${entrada.enlace}" target="_blank" class="btn btn-sm btn-gray"><i class="fa-solid fa-camera"></i> Ver foto</a>`
              : `<button class="btn btn-sm btn-gray" disabled><i class="fa-solid fa-camera"></i> Sin foto</button>`
          }
          <button class="btn btn-sm btn-gray" onclick="limpiarRegistro('${entrada.numero_cs || salida.numero_cs}', 'Entrada')">
            <i class="fa-solid fa-broom"></i> Limpiar
          </button>
        </td>

        <!-- Botón Auditar combinado -->
        <td rowspan="2" class="text-center align-middle">
          <button class="btn btn-sm btn-audit">
            <i class="fa-solid fa-file-shield"></i> Auditar
          </button>
        </td>
      </tr>

      <tr>
        <!-- Salida -->
        <td>${salida.tipo || "Salida"}</td>
        <td>${salida.fecha || "-"}</td>
        <td>${salida.hora || "-"}</td>
        <td>
          ${
            salida.enlace
              ? `<a href="${salida.enlace}" target="_blank" class="btn btn-sm btn-gray"><i class="fa-solid fa-camera"></i> Ver foto</a>`
              : `<button class="btn btn-sm btn-gray" disabled><i class="fa-solid fa-camera"></i> Sin foto</button>`
          }
          <button class="btn btn-sm btn-gray" onclick="limpiarRegistro('${entrada.numero_cs || salida.numero_cs}', 'Salida')">
            <i class="fa-solid fa-broom"></i> Limpiar
          </button>
        </td>
      </tr>
    `;

    tbody.insertAdjacentHTML("beforeend", filaHTML);
  });
}
