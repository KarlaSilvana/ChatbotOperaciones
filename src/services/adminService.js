/**
 * adminService.js - Lógica CRUD para administración
 * Gestiona procedimientos, directorio y operaciones con S3
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const AWS = require('aws-sdk');

const dbPath = path.join(__dirname, '../../data/chatbot_metrics.db');

let db = null;

/**
 * Conectar a BD si no está conectada
 */
function getDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
}

// ==================== PROCEDIMIENTOS ====================

/**
 * Obtener todos los procedimientos
 */
async function getProcedimientos() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    db.all('SELECT id, numero, nombre, emoji, recursos_json FROM procedimientos ORDER BY numero', (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

/**
 * Obtener un procedimiento por ID
 */
async function getProcedimientoById(id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM procedimientos WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

/**
 * Crear procedimiento
 */
async function createProcedimiento(data) {
  const db = await getDB();
  const { id, numero, nombre, emoji, recursos_json } = data;

  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO procedimientos (id, numero, nombre, emoji, recursos_json) VALUES (?, ?, ?, ?, ?)',
      [id, numero, nombre, emoji, recursos_json || '{}'],
      function(err) {
        if (err) reject(err);
        else resolve({ id, numero, nombre, emoji });
      }
    );
  });
}

/**
 * Actualizar procedimiento
 */
async function updateProcedimiento(id, data) {
  const db = await getDB();
  const { numero, nombre, emoji, recursos_json } = data;

  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE procedimientos SET numero = ?, nombre = ?, emoji = ?, recursos_json = ? WHERE id = ?',
      [numero, nombre, emoji, recursos_json || '{}', id],
      function(err) {
        if (err) reject(err);
        else resolve({ id, numero, nombre, emoji });
      }
    );
  });
}

/**
 * Borrar procedimiento
 */
async function deleteProcedimiento(id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM procedimientos WHERE id = ?', [id], function(err) {
      if (err) reject(err);
      else resolve({ deleted: true });
    });
  });
}

// ==================== DIRECTORIO ====================

/**
 * Obtener directorio paginado con búsqueda
 * page: número de página (1-indexed)
 * search: buscar en nombreCompleto
 * region: filtrar por región
 * perPage: registros por página (default 50)
 */
async function getDirectorio(page = 1, search = '', region = '', perPage = 50) {
  const db = await getDB();

  let query = 'SELECT * FROM directorio WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND nombreCompleto LIKE ?';
    params.push(`%${search}%`);
  }

  if (region) {
    query += ' AND region = ?';
    params.push(region);
  }

  // Contar total
  return new Promise((resolve, reject) => {
    const countQuery = `SELECT COUNT(*) as total FROM directorio WHERE 1=1`;
    const countParams = [];

    if (search) {
      countQuery += ' AND nombreCompleto LIKE ?';
      countParams.push(`%${search}%`);
    }

    if (region) {
      countQuery += ' AND region = ?';
      countParams.push(region);
    }

    db.get(
      countQuery.replace('WHERE 1=1', search || region ? 'WHERE 1=1' : 'WHERE 1=1') +
        (search ? ' AND nombreCompleto LIKE ?' : '') +
        (region ? ' AND region = ?' : ''),
      [...(search ? [`%${search}%`] : []), ...(region ? [region] : [])],
      (err, countRow) => {
        if (err) {
          reject(err);
          return;
        }

        const total = countRow?.total || 0;
        const offset = (page - 1) * perPage;

        query += ` ORDER BY nombreCompleto LIMIT ? OFFSET ?`;
        params.push(perPage, offset);

        db.all(query, params, (err, rows) => {
          if (err) reject(err);
          else {
            resolve({
              data: rows || [],
              pagination: {
                page,
                perPage,
                total,
                totalPages: Math.ceil(total / perPage)
              }
            });
          }
        });
      }
    );
  });
}

/**
 * Obtener un contacto por ID
 */
async function getContactoById(id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM directorio WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

/**
 * Crear contacto
 */
async function createContacto(data) {
  const db = await getDB();
  const { nombreCompleto, telefono, cargo, region, oficina, establecimiento } = data;

  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO directorio (nombreCompleto, telefono, cargo, region, oficina, establecimiento) VALUES (?, ?, ?, ?, ?, ?)',
      [nombreCompleto, telefono, cargo, region, oficina, establecimiento],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, nombreCompleto, telefono, cargo });
      }
    );
  });
}

/**
 * Actualizar contacto
 */
async function updateContacto(id, data) {
  const db = await getDB();
  const { nombreCompleto, telefono, cargo, region, oficina, establecimiento } = data;

  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE directorio SET nombreCompleto = ?, telefono = ?, cargo = ?, region = ?, oficina = ?, establecimiento = ? WHERE id = ?',
      [nombreCompleto, telefono, cargo, region, oficina, establecimiento, id],
      function(err) {
        if (err) reject(err);
        else resolve({ id, nombreCompleto, telefono, cargo });
      }
    );
  });
}

/**
 * Borrar contacto
 */
async function deleteContacto(id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM directorio WHERE id = ?', [id], function(err) {
      if (err) reject(err);
      else resolve({ deleted: true });
    });
  });
}

// ==================== S3 OPERATIONS ====================

/**
 * Obtener URL pre-firmada para descargar archivo desde S3
 */
async function getPresignedUrl(bucket, key, expiresIn = 3600) {
  try {
    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    const url = s3.getSignedUrl('getObject', {
      Bucket: bucket,
      Key: key,
      Expires: expiresIn
    });

    return url;
  } catch (err) {
    throw new Error(`Error generando URL pre-firmada: ${err.message}`);
  }
}

/**
 * Upload archivo a S3
 */
async function uploadToS3(buffer, bucket, key, mimetype) {
  try {
    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    const params = {
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      ACL: 'private'
    };

    return new Promise((resolve, reject) => {
      s3.upload(params, (err, data) => {
        if (err) reject(err);
        else resolve({ bucket, key, url: data.Location });
      });
    });
  } catch (err) {
    throw new Error(`Error uploadando a S3: ${err.message}`);
  }
}

/**
 * Borrar archivo de S3
 */
async function deleteFromS3(bucket, key) {
  try {
    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    return new Promise((resolve, reject) => {
      s3.deleteObject(
        { Bucket: bucket, Key: key },
        (err, data) => {
          if (err) reject(err);
          else resolve({ deleted: true });
        }
      );
    });
  } catch (err) {
    throw new Error(`Error borrando de S3: ${err.message}`);
  }
}

// ==================== REPORTES ====================

/**
 * Obtener último reporte generado
 */
async function getLatestReport() {
  const fs = require('fs').promises;
  const reportsDir = path.join(__dirname, '../../reports');

  try {
    const files = await fs.readdir(reportsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json')).sort().reverse();

    if (jsonFiles.length === 0) {
      return null;
    }

    const latestFile = jsonFiles[0];
    const content = await fs.readFile(path.join(reportsDir, latestFile), 'utf-8');
    return { filename: latestFile, data: JSON.parse(content) };
  } catch (err) {
    return null;
  }
}

module.exports = {
  // Procedimientos
  getProcedimientos,
  getProcedimientoById,
  createProcedimiento,
  updateProcedimiento,
  deleteProcedimiento,

  // Directorio
  getDirectorio,
  getContactoById,
  createContacto,
  updateContacto,
  deleteContacto,

  // S3
  getPresignedUrl,
  uploadToS3,
  deleteFromS3,

  // Reportes
  getLatestReport
};
