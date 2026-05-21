const pool = require('../../config/db');

const create = async ({ title, description, priority, categoryId, createdBy }) => {
  const { rows } = await pool.query(
    `INSERT INTO tickets (title, description, priority, category_id, created_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [title, description, priority || 'medium', categoryId || null, createdBy]
  );
  return rows[0];
};

const findAll = async (filters = {}) => {
  const conditions = [];
  const params = [];

  if (filters.createdBy) {
    params.push(filters.createdBy);
    conditions.push(`t.created_by = $${params.length}`);
  }
  if (filters.status) {
    params.push(filters.status);
    conditions.push(`t.status = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT t.*,
       u.name AS creator_name, u.email AS creator_email,
       a.name AS assignee_name,
       c.name AS category_name
     FROM tickets t
     LEFT JOIN users u ON t.created_by = u.id
     LEFT JOIN users a ON t.assigned_to = a.id
     LEFT JOIN categories c ON t.category_id = c.id
     ${where}
     ORDER BY t.created_at DESC`,
    params
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    `SELECT t.*,
       u.name AS creator_name, u.email AS creator_email,
       a.name AS assignee_name,
       c.name AS category_name
     FROM tickets t
     LEFT JOIN users u ON t.created_by = u.id
     LEFT JOIN users a ON t.assigned_to = a.id
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.id = $1`,
    [id]
  );
  return rows[0] || null;
};

const update = async (id, fields) => {
  const allowed = ['title', 'description', 'status', 'priority', 'category_id', 'assigned_to', 'closed_at'];
  const updates = [];
  const params = [];

  for (const [key, value] of Object.entries(fields)) {
    if (allowed.includes(key)) {
      params.push(value);
      updates.push(`${key} = $${params.length}`);
    }
  }
  if (!updates.length) return null;

  updates.push('updated_at = NOW()');
  params.push(id);

  const { rows } = await pool.query(
    `UPDATE tickets SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING id`,
    params
  );
  if (!rows[0]) return null;
  return findById(rows[0].id);
};

const remove = async (id) => {
  await pool.query('DELETE FROM tickets WHERE id = $1', [id]);
};

module.exports = { create, findAll, findById, update, remove };
