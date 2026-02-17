/**
 * api.js - Funciones reutilizables para hacer fetch a los endpoints admin
 */

const API_BASE = '/admin/api';

// ==================== PROCEDIMIENTOS ====================

async function getProcedimientos() {
  const res = await fetch(`${API_BASE}/procedimientos`);
  if (!res.ok) throw new Error('Error al obtener procedimientos');
  return res.json();
}

async function getProcedimientoById(id) {
  const res = await fetch(`${API_BASE}/procedimientos/${id}`);
  if (!res.ok) throw new Error('Procedimiento no encontrado');
  return res.json();
}

async function createProcedimiento(data) {
  const res = await fetch(`${API_BASE}/procedimientos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al crear procedimiento');
  return res.json();
}

async function updateProcedimiento(id, data) {
  const res = await fetch(`${API_BASE}/procedimientos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al actualizar procedimiento');
  return res.json();
}

async function deleteProcedimiento(id) {
  const res = await fetch(`${API_BASE}/procedimientos/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Error al borrar procedimiento');
  return res.json();
}

// ==================== DIRECTORIO ====================

async function getDirectorio(page = 1, search = '', region = '', perPage = 50) {
  const params = new URLSearchParams({ page, search, region, perPage });
  const res = await fetch(`${API_BASE}/directorio?${params}`);
  if (!res.ok) throw new Error('Error al obtener directorio');
  return res.json();
}

async function getContactoById(id) {
  const res = await fetch(`${API_BASE}/directorio/${id}`);
  if (!res.ok) throw new Error('Contacto no encontrado');
  return res.json();
}

async function createContacto(data) {
  const res = await fetch(`${API_BASE}/directorio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al crear contacto');
  return res.json();
}

async function updateContacto(id, data) {
  const res = await fetch(`${API_BASE}/directorio/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al actualizar contacto');
  return res.json();
}

async function deleteContacto(id) {
  const res = await fetch(`${API_BASE}/directorio/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Error al borrar contacto');
  return res.json();
}

// ==================== S3 ====================

async function getPresignedUrl(bucket, key) {
  const params = new URLSearchParams({ bucket, key });
  const res = await fetch(`${API_BASE}/presigned-url?${params}`);
  if (!res.ok) throw new Error('Error al obtener URL pre-firmada');
  const data = await res.json();
  return data.url;
}

async function uploadFileToS3(file, bucket, key, mimetype) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', bucket);
  formData.append('key', key);
  formData.append('mimetype', mimetype || file.type);

  const res = await fetch(`${API_BASE}/upload-s3`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Error al upload a S3');
  return res.json();
}

async function deleteFileFromS3(bucket, key) {
  const res = await fetch(`${API_BASE}/delete-s3`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucket, key })
  });
  if (!res.ok) throw new Error('Error al borrar de S3');
  return res.json();
}

// ==================== REPORTES ====================

async function getLatestReport() {
  const res = await fetch(`${API_BASE}/latest-report`);
  if (!res.ok) throw new Error('Error al obtener reporte');
  return res.json();
}
