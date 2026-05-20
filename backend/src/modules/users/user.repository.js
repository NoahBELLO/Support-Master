const pool = require('../../config/db');

const findAll = async () => {
  const { rows } = await pool.query(
    'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC'
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

const update = async (id, { name, role }) => {
  const { rows } = await pool.query(
    `UPDATE users
     SET name = COALESCE($1, name), role = COALESCE($2, role), updated_at = NOW()
     WHERE id = $3
     RETURNING id, email, name, role`,
    [name, role, id]
  );
  return rows[0] || null;
};

const remove = async (id) => {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
};

module.exports = { findAll, findById, update, remove };
