/**
 * reportes.js - Lógica para visualización de reportes
 */

let currentReportData = null;

// Cargar reporte al iniciar
document.addEventListener('DOMContentLoaded', loadReport);

async function loadReport() {
  try {
    const res = await getLatestReport();
    
    if (!res.success) {
      document.getElementById('reportCard').style.display = 'none';
      document.getElementById('noReportCard').style.display = 'block';
      return;
    }

    currentReportData = res.data;
    document.getElementById('reportCard').style.display = 'block';
    document.getElementById('noReportCard').style.display = 'none';

    const report = res.data.data;
    document.getElementById('reportTitle').textContent = 
      `Reporte del día: ${res.data.filename.replace('.json', '')}`;

    // Renderizar secciones
    if (report.top_procedimientos) {
      renderTopProcedimientos(report.top_procedimientos);
    }
    
    if (report.video_vs_documento) {
      renderVideoVsDoc(report.video_vs_documento);
    }
    
    if (report.ia_usage_by_procedure) {
      renderIAUsage(report.ia_usage_by_procedure);
    }
    
    if (report.frequent_questions) {
      renderFrequentQuestions(report.frequent_questions);
    }
    
    if (report.top_collaborators) {
      renderTopCollaborators(report.top_collaborators);
    }

  } catch(err) {
    console.error('Error loading report:', err);
    document.getElementById('alertContainer').innerHTML = 
      `<div class="alert alert-danger">Error: ${err.message}</div>`;
  }
}

function renderTopProcedimientos(data) {
  const container = document.getElementById('topProcedimientos');
  container.innerHTML = '';

  if (!data || data.length === 0) {
    container.innerHTML = '<p class="text-muted">Sin datos</p>';
    return;
  }

  let html = '<table class="table"><thead><tr><th>Procedimiento</th><th>Solicitudes</th></tr></thead><tbody>';
  data.forEach(item => {
    html += `<tr><td>${item.procedimiento_nombre}</td><td>${item.count}</td></tr>`;
  });
  html += '</tbody></table>';
  
  container.innerHTML = html;
}

function renderVideoVsDoc(data) {
  const container = document.getElementById('videoDocRatio');
  container.innerHTML = '';

  if (!data || data.length === 0) {
    container.innerHTML = '<p class="text-muted">Sin datos</p>';
    return;
  }

  let html = '<table class="table"><thead><tr><th>Tipo</th><th>Solicitudes</th><th>%</th></tr></thead><tbody>';
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  data.forEach(item => {
    const pct = ((item.count / total) * 100).toFixed(1);
    const icon = item.tipo === 'video' ? '🎥' : '📄';
    html += `<tr><td>${icon} ${item.tipo}</td><td>${item.count}</td><td>${pct}%</td></tr>`;
  });
  html += '</tbody></table>';
  
  container.innerHTML = html;
}

function renderIAUsage(data) {
  const container = document.getElementById('iaUsage');
  container.innerHTML = '';

  if (!data || data.length === 0) {
    container.innerHTML = '<p class="text-muted">Sin datos</p>';
    return;
  }

  let html = '<table class="table"><thead><tr><th>Procedimiento/Modo</th><th>Modo</th><th>Consultas</th></tr></thead><tbody>';
  
  data.forEach(item => {
    const modeIcon = item.mode === 'chat' ? '💬' : '❓';
    html += `<tr><td>${item.procedimiento_nombre}</td><td>${modeIcon} ${item.mode}</td><td>${item.count}</td></tr>`;
  });
  html += '</tbody></table>';
  
  container.innerHTML = html;
}

function renderFrequentQuestions(data) {
  const container = document.getElementById('frequentQuestions');
  container.innerHTML = '';

  if (!data || data.length === 0) {
    container.innerHTML = '<p class="text-muted">Sin preguntas frecuentes</p>';
    return;
  }

  let html = '<div style="line-height: 1.8;">';
  data.forEach((item, idx) => {
    html += `
      <div style="padding: 1rem; background: var(--light); margin-bottom: 0.5rem; border-radius: 0.375rem;">
        <strong>${idx + 1}. (${item.count}x)</strong><br>
        <p style="color: #6b7280; font-size: 0.9rem; margin-top: 0.25rem;">${escapeHtml(item.user_query)}</p>
      </div>
    `;
  });
  html += '</div>';
  
  container.innerHTML = html;
}

function renderTopCollaborators(data) {
  const container = document.getElementById('topCollaborators');
  container.innerHTML = '';

  if (!data || data.length === 0) {
    container.innerHTML = '<p class="text-muted">Sin datos</p>';
    return;
  }

  let html = '<table class="table"><thead><tr><th>Teléfono</th><th>Acciones</th></tr></thead><tbody>';
  
  data.forEach(item => {
    html += `<tr><td>${item.phone_number}</td><td>${item.action_count}</td></tr>`;
  });
  html += '</tbody></table>';
  
  container.innerHTML = html;
}

function downloadReport() {
  if (!currentReportData) return;

  const dataStr = JSON.stringify(currentReportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte-${currentReportData.filename}`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * ==================== NUEVO: EXPORTAR DATOS PERSONALIZADOS ====================
 */

// Inicializar fechas por defecto al cargar página
document.addEventListener('DOMContentLoaded', function() {
  // Establecer fecha de hoy
  const today = new Date();
  document.getElementById('dateTo').valueAsDate = today;
  
  // Establecer fecha de hace 7 días
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  document.getElementById('dateFrom').valueAsDate = sevenDaysAgo;
  
  // Actualizar preview inicial
  updateReportPreview();
  
  // Escuchadores de cambio de fechas
  document.getElementById('dateFrom').addEventListener('change', updateReportPreview);
  document.getElementById('dateTo').addEventListener('change', updateReportPreview);
});

/**
 * Establecer rango de fechas con presets
 */
function setDateRange(preset) {
  const today = new Date();
  const fromInput = document.getElementById('dateFrom');
  const toInput = document.getElementById('dateTo');
  
  toInput.valueAsDate = today;
  
  if (preset === 'week') {
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    fromInput.valueAsDate = sevenDaysAgo;
  } else if (preset === 'month') {
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    fromInput.valueAsDate = thirtyDaysAgo;
  } else if (preset === 'all') {
    // Fecha muy antigua para "todo"
    const farPast = new Date('2020-01-01');
    fromInput.valueAsDate = farPast;
  }
  
  updateReportPreview();
}

/**
 * Obtener preview de cuántos registros habrá
 */
async function updateReportPreview() {
  const from = document.getElementById('dateFrom').value;
  const to = document.getElementById('dateTo').value;
  
  if (!from || !to) {
    return; // Fechas sin completar
  }
  
  try {
    const response = await fetch(
      `/admin/api/queries/count?fromDate=${from}&toDate=${to}`
    );
    const result = await response.json();
    
    if (result.success) {
      const data = result.data;
      document.getElementById('consultCount').textContent = data.consultations;
      document.getElementById('eventCount').textContent = data.events;
      document.getElementById('totalSize').textContent = data.estimatedSizeKB + ' KB';
    } else {
      console.error('Error:', result.error);
    }
  } catch (err) {
    console.error('Error fetching preview:', err);
  }
}

/**
 * Descargar ZIP con ambos CSVs
 */
async function downloadReportsZip() {
  const from = document.getElementById('dateFrom').value;
  const to = document.getElementById('dateTo').value;
  
  if (!from || !to) {
    alert('❌ Por favor selecciona rango de fechas');
    return;
  }
  
  // Mostrar loading
  const btn = document.getElementById('downloadBtn');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Descargando...';
  
  try {
    const response = await fetch(
      `/admin/api/queries/export-all?fromDate=${from}&toDate=${to}`
    );
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    // Descargar ZIP
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_completo_${from}_${to}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showAlert('✅ Reporte descargado correctamente', 'success');
    
  } catch (err) {
    console.error('Error al descargar:', err);
    showAlert('❌ Error al descargar: ' + err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

/**
 * Mostrar alerta en la UI
 */
function showAlert(message, type = 'info') {
  const container = document.getElementById('alertContainer');
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.style.cssText = `
    padding: 1rem;
    margin-bottom: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: ${type === 'success' ? '#d4edda' : type === 'danger' ? '#f8d7da' : '#d1ecf1'};
    color: ${type === 'success' ? '#155724' : type === 'danger' ? '#721c24' : '#0c5460'};
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  
  alert.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.style.display='none'" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">×</button>
  `;
  
  container.appendChild(alert);
  
  // Auto-remover después de 5 segundos
  setTimeout(() => {
    if (alert.parentElement) {
      alert.style.display = 'none';
    }
  }, 5000);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}
