'use strict';

const { randomUUID } = require('node:crypto');
const express = require('express');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'equiptrack',
  password: process.env.DB_PASSWORD,
  database: 'equiptrack',
  timezone: 'Z',
  connectionLimit: 4,
});
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '8kb', strict: true }));

const conditions = new Set(['Good', 'Damaged', 'Maintenance']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const invalid = (res, message) => res.status(400).json({ message });
const missing = (res) => res.status(404).json({ message: 'Equipment not found.' });

function validate(body) {
  const { name, category, quantity, condition } = body || {};
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 120) {
    return 'name must contain 1 to 120 characters.';
  }
  if (typeof category !== 'string' || !category.trim() || category.trim().length > 80) {
    return 'category must contain 1 to 80 characters.';
  }
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    return 'quantity must be a non-negative safe integer.';
  }
  if (!conditions.has(condition)) {
    return 'condition must be Good, Damaged, or Maintenance.';
  }
  return [name.trim(), category.trim(), quantity, condition];
}

app.param('id', (req, res, next, id) => {
  if (!uuid.test(id)) return invalid(res, 'equipment id must be a UUID.');
  req.equipmentId = id.toLowerCase();
  next();
});

app.get('/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ database: 'reachable' });
});

app.post('/equipment', async (req, res) => {
  const fields = validate(req.body);
  if (typeof fields === 'string') return invalid(res, fields);
  const id = randomUUID();
  const now = new Date();
  await pool.execute(
    'INSERT INTO equipment (equipment_id, name, category, quantity, `condition`, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, ...fields, now, now],
  );
  const [name, category, quantity, condition] = fields;
  res.status(201).json({ equipment_id: id, name, category, quantity, condition, created_at: now, updated_at: now });
});

app.get('/equipment/:id', async (req, res) => {
  const [[item]] = await pool.execute('SELECT * FROM equipment WHERE equipment_id = ?', [req.equipmentId]);
  if (!item) return missing(res);
  res.json(item);
});

app.put('/equipment/:id', async (req, res) => {
  const fields = validate(req.body);
  if (typeof fields === 'string') return invalid(res, fields);
  const connection = await pool.getConnection();
  let item;
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      'UPDATE equipment SET name = ?, category = ?, quantity = ?, `condition` = ?, updated_at = ? WHERE equipment_id = ?',
      [...fields, new Date(), req.equipmentId],
    );
    if (result.affectedRows) {
      [[item]] = await connection.execute('SELECT * FROM equipment WHERE equipment_id = ?', [req.equipmentId]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  if (!item) return missing(res);
  res.json(item);
});

app.delete('/equipment/:id', async (req, res) => {
  const [result] = await pool.execute('DELETE FROM equipment WHERE equipment_id = ?', [req.equipmentId]);
  if (!result.affectedRows) return missing(res);
  res.status(204).end();
});

app.use((_req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((error, _req, res, _next) => {
  if (['entity.parse.failed', 'entity.too.large', 'charset.unsupported', 'encoding.unsupported'].includes(error.type)) {
    return invalid(res, 'Send a valid JSON object within 8 KB.');
  }
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Equipment identifier already exists.' });
  console.error('EquipTrack request failed', { code: error.code || error.name });
  res.status(500).json({ message: 'An internal error occurred.' });
});

app.listen(3000, '0.0.0.0', () => console.log('EquipTrack API listening on port 3000'));
