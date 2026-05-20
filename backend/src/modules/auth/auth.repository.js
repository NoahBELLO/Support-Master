const pool = require('../../config/db');

const findByEmail = async (email) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
};

const create = async ({ email, password, name, role = 'client' }) => {
  const { rows } = await pool.query(
    'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
    [email, password, name, role]
  );
  return rows[0];
};

const findById = async (id) => {
  const { rows } = await pool.query(
    'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

module.exports = { findByEmail, create, findById };
