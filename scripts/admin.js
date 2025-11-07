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
    tbody.innerHTML = `<tr><td colspan="12" class="text-center text-muted">No hay registros del día de hoy 🕒</td></tr>`;
    return;
  }

  registros.forEach((r) => {
    const tipo = r.tipo?.toUpperCase() || "—";

    const fila = `
      <tr>
        <td>${r.numero_cs || "-"}</td>
        <td>${r.nombre || "-"}</td>
        <td>${r.sector || "-"}</td>
        <td>${tipo}</td>
        <td>${r.fecha || "-"}</td>
        <td>${r.hora || "-"}</td>
        <td>${r.lat || "-"}</td>
        <td>${r.lng || "-"}</td>
        <td>
          ${
            r.enlace
              ? `<a href="${r.enlace}" target="_blank" class="btn btn-sm btn-gray">
                  <i class="fa-solid fa-camera"></i> Ver foto
                </a>`
              : `<button class="btn btn-sm btn-gray" disabled>
                  <i class="fa-solid fa-camera"></i> Sin foto
                </button>`
          }
          <button class="btn btn-sm btn-gray" onclick="limpiarRegistro('${r.numero_cs}', '${tipo}')">
            <i class="fa-solid fa-broom"></i> Limpiar
          </button>
        </td>
        <td>
          <button class="btn btn-sm btn-audit">
            <i class="fa-solid fa-file-shield"></i> Auditar
          </button>
        </td>
      </tr>
    `;

    tbody.insertAdjacentHTML("beforeend", fila);
  });
}
