/**
 * procedimientos.js - Lógica para gestión de procedimientos
 */

let currentEditId = null;
let filesToUpload = {};

// Cargar procedimientos al iniciar
document.addEventListener('DOMContentLoaded', loadProcedimientos);

async function loadProcedimientos() {
  try {
    const res = await getProcedimientos();
    if (!res.success) throw new Error('Error cargando procedimientos');

    const tbody = document.getElementById('procedimientosTableBody');
    tbody.innerHTML = '';

    res.data.forEach(proc => {
      const recursos = proc.recursos_json ? JSON.parse(proc.recursos_json) : {};
      const videoUrl = recursos.video || '-';
      const docUrl = recursos.documento || '-';

      tbody.innerHTML += `
        <tr>
          <td>${proc.numero}</td>
          <td>${proc.emoji} ${proc.nombre}</td>
          <td>${proc.emoji}</td>
          <td>
            <small>
              ${videoUrl !== '-' ? '🎥 Video' : ''}
              ${docUrl !== '-' ? ' | 📄 PDF' : ''}
            </small>
          </td>
          <td class="actions">
            <button class="btn btn-sm btn-primary" onclick="editProcedimiento('${proc.id}')">✏️ Editar</button>
            <button class="btn btn-sm btn-danger" onclick="deleteProcedimiento('${proc.id}')">🗑️ Borrar</button>
          </td>
        </tr>
      `;
    });
  } catch(err) {
    showAlert('Error: ' + err.message, 'danger');
  }
}

function showCreateModal() {
  currentEditId = null;
  document.getElementById('modalTitle').textContent = 'Nuevo Procedimiento';
  document.getElementById('procId').disabled = false;
  document.getElementById('procId').value = '';
  document.getElementById('procNumber').value = '';
  document.getElementById('procName').value = '';
  document.getElementById('procEmoji').value = '';
  document.getElementById('videoFileName').textContent = 'Sin archivo';
  document.getElementById('pdfFileName').textContent = 'Sin archivo';
  filesToUpload = {};
  document.getElementById('procModal').classList.add('show');
}

async function editProcedimiento(id) {
  try {
    const res = await getProcedimientoById(id);
    if (!res.success) throw new Error('Error cargando procedimiento');

    const proc = res.data;
    currentEditId = proc.id;
    
    document.getElementById('modalTitle').textContent = 'Editar Procedimiento';
    document.getElementById('procId').disabled = true;
    document.getElementById('procId').value = proc.id;
    document.getElementById('procNumber').value = proc.numero;
    document.getElementById('procName').value = proc.nombre;
    document.getElementById('procEmoji').value = proc.emoji || '';
    
    filesToUpload = {};
    document.getElementById('videoFileName').textContent = 'Sin cambios';
    document.getElementById('pdfFileName').textContent = 'Sin cambios';
    
    document.getElementById('procModal').classList.add('show');
  } catch(err) {
    showAlert('Error: ' + err.message, 'danger');
  }
}

function closeModal() {
  document.getElementById('procModal').classList.remove('show');
}

async function saveProcedimiento() {
  const id = document.getElementById('procId').value.trim();
  const numero = parseInt(document.getElementById('procNumber').value);
  const nombre = document.getElementById('procName').value.trim();
  const emoji = document.getElementById('procEmoji').value.trim();

  if (!id || !numero || !nombre) {
    showAlert('Por favor complete los campos requeridos', 'warning');
    return;
  }

  try {
    // Usar recursos previos si no se cambian
    let recursos = { video: '', documento: '' };
    
    if (currentEditId) {
      const res = await getProcedimientoById(currentEditId);
      if (res.data.recursos_json) {
        recursos = JSON.parse(res.data.recursos_json);
      }
    }

    // Reemplazar si hay nuevos archivos
    if (filesToUpload.video) {
      if (recursos.video) {
        // Borrar archivo antiguo de S3
        await deleteFileFromS3('tu-bucket', recursos.video);
      }
      // Subir nuevo
      const s3Res = await uploadFileToS3(filesToUpload.video, 'tu-bucket', `procedimientos/${id}/video.mp4`, 'video/mp4');
      recursos.video = `procedimientos/${id}/video.mp4`;
    }

    if (filesToUpload.pdf) {
      if (recursos.documento) {
        await deleteFileFromS3('tu-bucket', recursos.documento);
      }
      const s3Res = await uploadFileToS3(filesToUpload.pdf, 'tu-bucket', `procedimientos/${id}/documento.pdf`, 'application/pdf');
      recursos.documento = `procedimientos/${id}/documento.pdf`;
    }

    const procData = {
      numero,
      nombre,
      emoji,
      recursos_json: JSON.stringify(recursos)
    };

    if (currentEditId) {
      await updateProcedimiento(currentEditId, procData);
      showAlert('Procedimiento actualizado', 'success');
    } else {
      await createProcedimiento({ id, ...procData });
      showAlert('Procedimiento creado', 'success');
    }

    closeModal();
    loadProcedimientos();
  } catch(err) {
    showAlert('Error: ' + err.message, 'danger');
  }
}

async function deleteProcedimiento(id) {
  if (!confirm('¿Está seguro de que desea eliminar este procedimiento?')) return;

  try {
    await deleteApi(id);
    showAlert('Procedimiento eliminado', 'success');
    loadProcedimientos();
  } catch(err) {
    showAlert('Error: ' + err.message, 'danger');
  }
}

async function deleteApi(id) {
  const res = await fetch(`/admin/api/procedimientos/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error borrando procedimiento');
  return res.json();
}

// Drag & Drop y selección de archivos
function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('active');
}

function handleDrop(e, type) {
  e.preventDefault();
  e.currentTarget.classList.remove('active');
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    filesToUpload[type] = file;
    document.getElementById(type === 'video' ? 'videoFileName' : 'pdfFileName').textContent = file.name;
  }
}

function handleFileSelect(e, type) {
  const file = e.target.files[0];
  if (file) {
    filesToUpload[type] = file;
    document.getElementById(type === 'video' ? 'videoFileName' : 'pdfFileName').textContent = file.name;
  }
}

// Utilidades
function showAlert(msg, type = 'info') {
  const container = document.getElementById('alertContainer');
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = msg;
  container.innerHTML = '';
  container.appendChild(alert);
  
  setTimeout(() => alert.remove(), 5000);
}
