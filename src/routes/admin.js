/**
 * admin.js - Rutas para el panel administrativo
 * GET, POST, PUT, DELETE para procedimientos, directorio y archivos
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { stringify } = require('csv-stringify/sync');
const JSZip = require('jszip');
const adminService = require('../services/adminService');
const metricsService = require('../services/metricsService');

// Configurar multer para upload de archivos
const upload = multer({ storage: multer.memoryStorage() });

// ==================== PROCEDIMIENTOS ====================

/**
 * GET /admin/api/procedimientos
 * Obtener lista de procedimientos
 */
router.get('/procedimientos', async (req, res) => {
  try {
    const procedimientos = await adminService.getProcedimientos();
    res.json({ success: true, data: procedimientos });
  } catch (err) {
    console.error('Error getting procedimientos:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /admin/api/procedimientos/:id
 * Obtener un procedimiento
 */
router.get('/procedimientos/:id', async (req, res) => {
  try {
    const proc = await adminService.getProcedimientoById(req.params.id);
    if (!proc) {
      return res.status(404).json({ success: false, error: 'Procedimiento no encontrado' });
    }
    res.json({ success: true, data: proc });
  } catch (err) {
    console.error('Error getting procedimiento:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /admin/api/procedimientos
 * Crear procedimiento
 */
router.post('/procedimientos', async (req, res) => {
  try {
    const { id, numero, nombre, emoji, recursos_json } = req.body;

    if (!id || !numero || !nombre) {
      return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
    }

    const result = await adminService.createProcedimiento({
      id,
      numero,
      nombre,
      emoji,
      recursos_json: typeof recursos_json === 'string' ? recursos_json : JSON.stringify(recursos_json || {})
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error('Error creating procedimiento:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /admin/api/procedimientos/:id
 * Actualizar procedimiento
 */
router.put('/procedimientos/:id', async (req, res) => {
  try {
    const { numero, nombre, emoji, recursos_json } = req.body;

    const result = await adminService.updateProcedimiento(req.params.id, {
      numero,
      nombre,
      emoji,
      recursos_json: typeof recursos_json === 'string' ? recursos_json : JSON.stringify(recursos_json || {})
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Error updating procedimiento:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /admin/api/procedimientos/:id
 * Borrar procedimiento
 */
router.delete('/procedimientos/:id', async (req, res) => {
  try {
    await adminService.deleteProcedimiento(req.params.id);
    res.json({ success: true, message: 'Procedimiento eliminado' });
  } catch (err) {
    console.error('Error deleting procedimiento:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== DIRECTORIO ====================

/**
 * GET /admin/api/directorio?page=1&search=juan&region=CUSCO
 * Obtener directorio paginado con búsqueda
 */
router.get('/directorio', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const region = req.query.region || '';
    const perPage = parseInt(req.query.perPage) || 50;

    const result = await adminService.getDirectorio(page, search, region, perPage);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error getting directorio:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /admin/api/directorio/:id
 * Obtener un contacto
 */
router.get('/directorio/:id', async (req, res) => {
  try {
    const contacto = await adminService.getContactoById(req.params.id);
    if (!contacto) {
      return res.status(404).json({ success: false, error: 'Contacto no encontrado' });
    }
    res.json({ success: true, data: contacto });
  } catch (err) {
    console.error('Error getting contacto:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /admin/api/directorio
 * Crear contacto
 */
router.post('/directorio', async (req, res) => {
  try {
    const { nombreCompleto, telefono, cargo, region, oficina, establecimiento } = req.body;

    if (!nombreCompleto || !telefono) {
      return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
    }

    const result = await adminService.createContacto({
      nombreCompleto,
      telefono,
      cargo,
      region,
      oficina,
      establecimiento
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error('Error creating contacto:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /admin/api/directorio/:id
 * Actualizar contacto
 */
router.put('/directorio/:id', async (req, res) => {
  try {
    const { nombreCompleto, telefono, cargo, region, oficina, establecimiento } = req.body;

    const result = await adminService.updateContacto(req.params.id, {
      nombreCompleto,
      telefono,
      cargo,
      region,
      oficina,
      establecimiento
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Error updating contacto:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /admin/api/directorio/:id
 * Borrar contacto
 */
router.delete('/directorio/:id', async (req, res) => {
  try {
    await adminService.deleteContacto(req.params.id);
    res.json({ success: true, message: 'Contacto eliminado' });
  } catch (err) {
    console.error('Error deleting contacto:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== ARCHIVOS S3 ====================

/**
 * GET /admin/api/presigned-url?bucket=BUCKET&key=procedimientos/id/video.mp4
 * Obtener URL pre-firmada para descargar
 */
router.get('/presigned-url', async (req, res) => {
  try {
    const { bucket, key } = req.query;

    if (!bucket || !key) {
      return res.status(400).json({ success: false, error: 'Faltan bucket o key' });
    }

    const url = await adminService.getPresignedUrl(bucket, key, 3600); // 1 hora
    res.json({ success: true, url });
  } catch (err) {
    console.error('Error getting presigned URL:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /admin/api/upload-s3
 * Upload archivo a S3
 * Body: { bucket, key, mimetype }
 * File: multipart/form-data con campo 'file'
 */
router.post('/upload-s3', upload.single('file'), async (req, res) => {
  try {
    const { bucket, key, mimetype } = req.body;

    if (!bucket || !key || !req.file) {
      return res.status(400).json({ success: false, error: 'Faltan parámetros' });
    }

    const result = await adminService.uploadToS3(
      req.file.buffer,
      bucket,
      key,
      mimetype || req.file.mimetype
    );

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Error uploading to S3:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /admin/api/delete-s3
 * Borrar archivo de S3
 */
router.delete('/delete-s3', async (req, res) => {
  try {
    const { bucket, key } = req.body;

    if (!bucket || !key) {
      return res.status(400).json({ success: false, error: 'Faltan bucket o key' });
    }

    const result = await adminService.deleteFromS3(bucket, key);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error deleting from S3:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== REPORTES ====================

/**
 * GET /admin/api/latest-report
 * Obtener último reporte
 */
router.get('/latest-report', async (req, res) => {
  try {
    const report = await adminService.getLatestReport();
    if (!report) {
      return res.status(404).json({ success: false, error: 'No hay reportes disponibles' });
    }
    res.json({ success: true, data: report });
  } catch (err) {
    console.error('Error getting report:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== EXPORT REPORTES ====================

/**
 * GET /admin/api/queries/count
 * Contar consultas e interacciones para preview
 */
router.get('/queries/count', async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'fromDate y toDate requeridas (YYYY-MM-DD)' 
      });
    }

    const counts = await metricsService.getRecordCounts(fromDate, toDate);
    res.json({ success: true, data: counts });
  } catch (err) {
    console.error('Error counting records:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /admin/api/queries/export-all
 * Exportar ambos CSVs en ZIP
 */
router.get('/queries/export-all', async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'fromDate y toDate requeridas (YYYY-MM-DD)' 
      });
    }

    // 1. Obtener datos de ambas tablas
    const consultations = await metricsService.getIAConsultationsForExport(fromDate, toDate);
    const events = await metricsService.getEventsForExport(fromDate, toDate);

    // 2. Convertir a CSV
    const csvConsultations = stringify(consultations, {
      header: true,
      columns: ['timestamp', 'phone_number', 'query_type', 'procedure_name', 'user_query', 'rag_response', 'ia_mode']
    });

    const csvEvents = stringify(events, {
      header: true,
      columns: ['timestamp', 'phone_number', 'event_type', 'procedure_name']
    });

    // 3. Crear ZIP con ambos CSVs
    const zip = new JSZip();
    zip.file(`consultas_ia_${fromDate}_${toDate}.csv`, csvConsultations);
    zip.file(`eventos_generales_${fromDate}_${toDate}.csv`, csvEvents);

    // 4. Generar buffer del ZIP
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });

    // 5. Enviar ZIP
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_${fromDate}_${toDate}.zip"`);
    res.send(buffer);

  } catch (err) {
    console.error('Error exporting data:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
