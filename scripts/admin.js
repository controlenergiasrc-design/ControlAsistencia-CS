
document.addEventListener("DOMContentLoaded", () => {

  const API_URL = "https://proxy-asistencia.control-energiasrc.workers.dev";
  
  const tablaBody = document.getElementById("tablaRegistros");
  const metricFotos = document.getElementById("metricFotos");
  const metricUsuarios = document.getElementById("metricUsuarios");

  tablaBody.innerHTML = `
    <tr><td colspan="8" class="text-center text-muted py-3">
      <div class="spinner-border text-primary spinner-border-sm"></div> Cargando registros de hoy...
    </td></tr>
  `;

  fetch(`${API_URL}?accion=registrosHoy`)
    .then((res) => res.json())
    .then((data) => {
      tablaBody.innerHTML = "";

      if (!data || !data.registros || data.registros.length === 0) {
        tablaBody.innerHTML = `
          <tr><td colspan="8" class="text-center text-muted py-3">
            No hay registros del día de hoy 💤
          </td></tr>
        `;
        return;
      }

      // Calcular métricas
      const usuariosUnicos = new Set(data.registros.map((r) => r.numero_cs));
      metricUsuarios.textContent = usuariosUnicos.size;
      metricFotos.textContent = data.registros.filter((r) => r.enlace_foto).length;

      // Agrupar registros por usuario
      const agrupado = {};
      data.registros.forEach((r) => {
        if (!agrupado[r.numero_cs]) agrupado[r.numero_cs] = { entrada: null, salida: null };
        if (r.tipo === "Entrada") agrupado[r.numero_cs].entrada = r;
        else if (r.tipo === "Salida") agrupado[r.numero_cs].salida = r;
      });

      // Generar dos filas por usuario
      Object.values(agrupado).forEach(({ entrada, salida }) => {
        const e = entrada || {};
        const s = salida || {};

        const filaEntrada = `
          <tr>
            <td>${e.numero_cs || "—"}</td>
            <td>${e.nombre_usuario || "—"}</td>
            <td>${e.sector || "—"}</td>
            <td>Entrada</td>
            <td>${e.fecha || "—"}</td>
            <td>${e.hora || "—"}</td>
            <td class="text-nowrap">
              ${
                e.enlace_foto
                  ? `<a href="${e.enlace_foto}" target="_blank" class="btn btn-sm btn-gray">
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
            <td>${s.sector || e.sector || "—"}</td>
            <td>Salida</td>
            <td>${s.fecha || "—"}</td>
            <td>${s.hora || "—"}</td>
            <td class="text-nowrap">
              ${
                s.enlace_foto
                  ? `<a href="${s.enlace_foto}" target="_blank" class="btn btn-sm btn-gray">
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
      console.error("Error cargando registros:", err);
      tablaBody.innerHTML = `
        <tr><td colspan="8" class="text-center text-danger py-3">
          ❌ Error al cargar registros
        </td></tr>
      `;
    });
});
