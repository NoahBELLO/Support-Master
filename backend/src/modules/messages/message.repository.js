const pool = require('../../config/db');

const create = async ({ ticketId, userId, content, isInternal = false }) => {
  const { rows } = await pool.query(
    `INSERT INTO messages (ticket_id, user_id, content, is_internal)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [ticketId, userId, content, isInternal]
  );
  const { rows: full } = await pool.query(
    `SELECT m.*, u.name AS user_name, u.role AS user_role
     FROM messages m
     JOIN users u ON m.user_id = u.id
     WHERE m.id = $1`,
    [rows[0].id]
  );
  return full[0];
};

const findByTicket = async (ticketId, includeInternal = true) => {
  const internalClause = includeInternal ? '' : 'AND m.is_internal = FALSE';
  const { rows } = await pool.query(
    `SELECT m.*, u.name AS user_name, u.role AS user_role
     FROM messages m
     JOIN users u ON m.user_id = u.id
     WHERE m.ticket_id = $1 ${internalClause}
     ORDER BY m.created_at ASC`,
    [ticketId]
  );
  return rows;
};

module.exports = { create, findByTicket };
