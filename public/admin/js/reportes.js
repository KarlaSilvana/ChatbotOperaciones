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

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}
