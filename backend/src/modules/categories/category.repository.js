const pool = require('../../config/db');

const findAll = async () => {
  const { rows } = await pool.query('SELECT * FROM categories ORDER BY name');
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
  return rows[0] || null;
};

const create = async ({ name, description }) => {
  const { rows } = await pool.query(
    'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
    [name, description || null]
  );
  return rows[0];
};

const update = async (id, { name, description }) => {
  const { rows } = await pool.query(
    `UPDATE categories
     SET name = COALESCE($1, name), description = COALESCE($2, description)
     WHERE id = $3 RETURNING *`,
    [name, description, id]
  );
  return rows[0] || null;
};

const remove = async (id) => {
  await pool.query('DELETE FROM categories WHERE id = $1', [id]);
};

module.exports = { findAll, findById, create, update, remove };
