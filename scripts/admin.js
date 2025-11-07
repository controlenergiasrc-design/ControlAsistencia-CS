document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://proxy-asistencia.control-energiasrc.workers.dev";
  const tablaBody = document.getElementById("tablaRegistros");
  const metricFotos = document.getElementById("metricFotos");
  const metricUsuarios = document.getElementById("metricUsuarios");

  // Mostrar spinner inicial
  tablaBody.innerHTML = `
    <tr><td colspan="8" class="text-center text-muted py-3">
      <div class="spinner-border text-primary spinner-border-sm"></div>
      Cargando registros de hoy...
    </td></tr>
  `;

  fetch(`${API_URL}?accion=registrosHoy`)
    .then((res) => res.json())
    .then((data) => {
      console.log("📦 Datos recibidos:", data);

      tablaBody.innerHTML = "";

      if (!data || !data.registros || data.registros.length === 0) {
        tablaBody.innerHTML = `
          <tr><td colspan="8" class="text-center text-muted py-3">
            No hay registros del día de hoy 💤
          </td></tr>`;
        return;
      }

      // Métricas
      const usuariosUnicos = new Set(data.registros.map((r) => r.numero_cs));
      metricUsuarios.textContent = usuariosUnicos.size;
      metricFotos.textContent = data.registros.length * 2; // entrada + salida posibles

      // Generar dos filas por usuario
      data.registros.forEach((r) => {
        const e = r.entrada || {};
        const s = r.salida || {};

        const filaEntrada = `
          <tr>
            <td>${r.numero_cs || "—"}</td>
            <td>${r.nombre || "—"}</td>
            <td>${r.sector || "—"}</td>
            <td>${e.tipo || "Entrada"}</td>
            <td>${e.fecha || "—"}</td>
            <td>${e.hora || "—"}</td>
            <td class="text-nowrap">
              ${
                e.enlace
                  ? `<a href="${e.enlace}" target="_blank" class="btn btn-sm btn-gray">
                      <i class="fa-solid fa-camera"></i> Ver foto
                    </a>`
                  : `<button class="btn btn-sm btn-secondary" disabled>
                      <i class="fa-solid fa-ban"></i> Sin foto
                    </button>`
              }
              <button class="btn btn-sm btn-gray">
                <i class="fa-solid fa-broom"></i> Limpiar
              </button>
            </td>
            <td rowspan="2">
              <button class="btn btn-sm btn-audit">
                <i class="fa-solid fa-file-shield"></i> Auditar
              </button>
            </td>
          </tr>
        `;

        const filaSalida = `
          <tr>
            <td></td>
            <td></td>
            <td>${r.sector || "—"}</td>
            <td>${s.tipo || "Salida"}</td>
            <td>${s.fecha || "—"}</td>
            <td>${s.hora || "—"}</td>
            <td class="text-nowrap">
              ${
                s.enlace
                  ? `<a href="${s.enlace}" target="_blank" class="btn btn-sm btn-gray">
                      <i class="fa-solid fa-camera"></i> Ver foto
                    </a>`
                  : `<button class="btn btn-sm btn-secondary" disabled>
                      <i class="fa-solid fa-ban"></i> Sin foto
                    </button>`
              }
              <button class="btn btn-sm btn-gray">
                <i class="fa-solid fa-broom"></i> Limpiar
              </button>
            </td>
          </tr>
        `;

        tablaBody.insertAdjacentHTML("beforeend", filaEntrada + filaSalida);
      });
    })
    .catch((err) => {
      console.error("❌ Error cargando registros:", err);
      tablaBody.innerHTML = `
        <tr><td colspan="8" class="text-center text-danger py-3">
          Error al cargar registros 😭
        </td></tr>`;
    });
});
