/**
 * directorio.js - Lógica para gestión del directorio
 */

let currentPage = 1;
let currentSearch = '';
let currentRegion = '';
let currentEditId = null;
let deleteConfirmId = null;

// Cargar al iniciar
document.addEventListener('DOMContentLoaded', () => {
  loadRegiones();
  loadDirectorio(1);
});

async function loadDirectorio(page) {
  try {
    currentPage = page;
    const res = await getDirectorio(page, currentSearch, currentRegion, 50);
    
    if (!res.success) throw new Error('Error cargando directorio');

    const tbody = document.getElementById('directorioTableBody');
    tbody.innerHTML = '';

    if (res.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay resultados</td></tr>';
    } else {
      res.data.forEach(contact => {
        tbody.innerHTML += `
          <tr>
            <td>${contact.nombreCompleto}</td>
            <td>${contact.telefono}</td>
            <td>${contact.cargo}</td>
            <td>${contact.region}</td>
            <td>${contact.oficina}</td>
            <td class="actions">
              <button class="btn btn-sm btn-primary" onclick="editContacto(${contact.id})">✏️</button>
              <button class="btn btn-sm btn-danger" onclick="showDeleteConfirm(${contact.id}, '${contact.nombreCompleto}')">🗑️</button>
            </td>
          </tr>
        `;
      });
    }

    // Paginación
    const pagination = res.pagination;
    renderPagination(pagination);

    // Info
    const infoEl = document.getElementById('paginationInfo');
    if (pagination.total > 0) {
      const start = (page - 1) * 50 + 1;
      const end = Math.min(page * 50, pagination.total);
      infoEl.textContent = `Mostrando ${start}-${end} de ${pagination.total} contactos`;
    }

  } catch(err) {
    showAlert('Error: ' + err.message, 'danger');
  }
}

function renderPagination(pagination) {
  const container = document.getElementById('paginationContainer');
  container.innerHTML = '';

  if (pagination.totalPages <= 1) return;

  // Anterior
  if (pagination.page > 1) {
    let link = document.createElement('a');
    link.href = '#';
    link.textContent = '< Anterior';
    link.onclick = (e) => { e.preventDefault(); loadDirectorio(pagination.page - 1); };
    container.appendChild(link);
  }

  // Números
  for (let i = 1; i <= pagination.totalPages; i++) {
    let link = document.createElement(i === pagination.page ? 'span' : 'a');
    link.textContent = i;
    if (i === pagination.page) {
      link.className = 'active';
    } else {
      link.href = '#';
      link.onclick = (e) => { e.preventDefault(); loadDirectorio(i); };
    }
    container.appendChild(link);
  }

  // Siguiente
  if (pagination.page < pagination.totalPages) {
    let link = document.createElement('a');
    link.href = '#';
    link.textContent = 'Siguiente >';
    link.onclick = (e) => { e.preventDefault(); loadDirectorio(pagination.page + 1); };
    container.appendChild(link);
  }
}

async function loadRegiones() {
  try {
    const res = await fetch('/admin/api/regions');
    const data = await res.json();
    
    if (!data.success) throw new Error('Error cargando regiones');
    
    const regionSelect = document.getElementById('contactRegion');
    const currentValue = regionSelect.value;
    
    // Limpiar opciones excepto la primera
    const firstOption = regionSelect.options[0];
    regionSelect.innerHTML = '';
    regionSelect.appendChild(firstOption);
    
    // Agregar regiones dinámicamente
    data.data.forEach(region => {
      const option = document.createElement('option');
      option.value = region;
      option.textContent = region;
      regionSelect.appendChild(option);
    });
    
    // Restaurar valor si existía
    regionSelect.value = currentValue;
  } catch(err) {
    console.error('Error loading regions:', err);
  }
}

function handleSearch() {
  currentSearch = document.getElementById('searchInput').value.trim();
  currentPage = 1;
  loadDirectorio(1);
}

function handleFilter() {
  currentRegion = document.getElementById('regionFilter').value;
  currentPage = 1;
  loadDirectorio(1);
}

function resetFilters() {
  document.getElementById('searchInput').value = '';
  currentSearch = '';
  currentRegion = '';
  currentPage = 1;
  loadDirectorio(1);
}

function showCreateModal() {
  currentEditId = null;
  document.getElementById('modalTitle').textContent = 'Nuevo Contacto';
  document.getElementById('contactName').value = '';
  document.getElementById('contactPhone').value = '';
  document.getElementById('contactCargo').value = '';
  document.getElementById('contactRegion').value = '';
  document.getElementById('contactOficina').value = '';
  document.getElementById('contactEstablecimiento').value = '';
  document.getElementById('contactModal').classList.add('show');
}

async function editContacto(id) {
  try {
    const res = await getContactoById(id);
    if (!res.success) throw new Error('Error cargando contacto');

    const contact = res.data;
    currentEditId = contact.id;

    document.getElementById('modalTitle').textContent = 'Editar Contacto';
    document.getElementById('contactName').value = contact.nombreCompleto;
    document.getElementById('contactPhone').value = contact.telefono;
    document.getElementById('contactCargo').value = contact.cargo || '';
    document.getElementById('contactRegion').value = contact.region || '';
    document.getElementById('contactOficina').value = contact.oficina || '';
    document.getElementById('contactEstablecimiento').value = contact.establecimiento || '';

    document.getElementById('contactModal').classList.add('show');
  } catch(err) {
    showAlert('Error: ' + err.message, 'danger');
  }
}

function closeModal() {
  document.getElementById('contactModal').classList.remove('show');
}

function showDeleteConfirm(id, name) {
  deleteConfirmId = id;
  document.getElementById('confirmMessage').textContent = 
    `¿Está seguro de que desea eliminar a ${name}?`;
  document.getElementById('confirmModal').classList.add('show');
}

function closeConfirm() {
  document.getElementById('confirmModal').classList.remove('show');
  deleteConfirmId = null;
}

async function confirmDelete() {
  if (!deleteConfirmId) return;

  try {
    await deleteContacto(deleteConfirmId);
    showAlert('Contacto eliminado', 'success');
    closeConfirm();
    loadDirectorio(currentPage);
  } catch(err) {
    showAlert('Error: ' + err.message, 'danger');
  }
}

async function saveContacto() {
  const name = document.getElementById('contactName').value.trim();
  const phone = document.getElementById('contactPhone').value.trim();
  const cargo = document.getElementById('contactCargo').value.trim();
  const region = document.getElementById('contactRegion').value;
  const oficina = document.getElementById('contactOficina').value.trim();
  const establecimiento = document.getElementById('contactEstablecimiento').value.trim();

  if (!name || !phone) {
    showAlert('Por favor complete los campos requeridos', 'warning');
    return;
  }

  try {
    const data = { nombreCompleto: name, telefono: phone, cargo, region, oficina, establecimiento };

    if (currentEditId) {
      await updateContacto(currentEditId, data);
      showAlert('Contacto actualizado', 'success');
    } else {
      await createContacto(data);
      showAlert('Contacto creado', 'success');
    }

    closeModal();
    loadDirectorio(currentPage);
  } catch(err) {
    showAlert('Error: ' + err.message, 'danger');
  }
}

function showAlert(msg, type = 'info') {
  const container = document.getElementById('alertContainer');
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = msg;
  container.innerHTML = '';
  container.appendChild(alert);
  
  setTimeout(() => alert.remove(), 5000);
}
