const bcrypt = require('bcryptjs');
const { query } = require('../lib/db');
const { requireAdmin } = require('../lib/auth');

function toPublic(row) {
  return { id: row.id, username: row.username, role: row.role, views: row.views || [] };
}

module.exports = async function handler(req, res) {
  const auth = requireAdmin(req, res);
  if (!auth) return;

  try {
    if (req.method === 'GET') {
      const r = await query('SELECT id, username, role, views FROM users ORDER BY id');
      return res.status(200).json({ users: r.rows.map(toPublic) });
    }

    if (req.method === 'POST') {
      const { id, username, password, role, views } = req.body || {};
      if (!username || !String(username).trim()) {
        return res.status(400).json({ error: 'Informe o nome de usuário.' });
      }
      if (!['admin', 'usuario'].includes(role)) {
        return res.status(400).json({ error: 'Papel inválido.' });
      }
      const cleanViews = role === 'usuario' ? (Array.isArray(views) ? views : []) : [];
      const uname = String(username).trim();

      const dupe = await query('SELECT id FROM users WHERE username = $1 AND id IS DISTINCT FROM $2', [uname, id || null]);
      if (dupe.rows.length) {
        return res.status(409).json({ error: 'Já existe um usuário com esse nome.' });
      }

      if (id) {
        const cur = await query('SELECT * FROM users WHERE id = $1', [id]);
        if (!cur.rows[0]) return res.status(404).json({ error: 'Usuário não encontrado.' });
        if (cur.rows[0].role === 'admin' && role === 'usuario') {
          const admins = await query("SELECT COUNT(*)::int AS n FROM users WHERE role = 'admin'");
          if (admins.rows[0].n <= 1) {
            return res.status(400).json({ error: 'Não é possível rebaixar o único administrador.' });
          }
        }
        if (password && String(password).trim()) {
          const hash = await bcrypt.hash(String(password), 10);
          await query('UPDATE users SET username=$1, password_hash=$2, role=$3, views=$4 WHERE id=$5',
            [uname, hash, role, JSON.stringify(cleanViews), id]);
        } else {
          await query('UPDATE users SET username=$1, role=$2, views=$3 WHERE id=$4',
            [uname, role, JSON.stringify(cleanViews), id]);
        }
        const updated = await query('SELECT id, username, role, views FROM users WHERE id=$1', [id]);
        return res.status(200).json({ user: toPublic(updated.rows[0]) });
      } else {
        if (!password || !String(password).trim()) {
          return res.status(400).json({ error: 'Informe uma senha.' });
        }
        const hash = await bcrypt.hash(String(password), 10);
        const created = await query(
          'INSERT INTO users (username, password_hash, role, views) VALUES ($1,$2,$3,$4) RETURNING id, username, role, views',
          [uname, hash, role, JSON.stringify(cleanViews)]
        );
        return res.status(201).json({ user: toPublic(created.rows[0]) });
      }
    }

    if (req.method === 'DELETE') {
      const id = req.query && req.query.id;
      if (!id) return res.status(400).json({ error: 'Informe o id do usuário.' });
      const cur = await query('SELECT * FROM users WHERE id = $1', [id]);
      if (!cur.rows[0]) return res.status(404).json({ error: 'Usuário não encontrado.' });
      if (cur.rows[0].role === 'admin') {
        const admins = await query("SELECT COUNT(*)::int AS n FROM users WHERE role = 'admin'");
        if (admins.rows[0].n <= 1) {
          return res.status(400).json({ error: 'Não é possível excluir o único administrador.' });
        }
      }
      await query('DELETE FROM users WHERE id = $1', [id]);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Método não permitido.' });
  } catch (e) {
    res.status(500).json({ error: 'Erro: ' + e.message });
  }
};
