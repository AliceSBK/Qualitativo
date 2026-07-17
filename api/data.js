const fs = require('fs');
const path = require('path');
const { query } = require('../lib/db');
const { requireAuth, requireAdmin } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const auth = requireAuth(req, res);
    if (!auth) return;
    try {
      let r = await query('SELECT data, updated_at FROM app_data WHERE id = 1');
      if (!r.rows[0]) {
        const seedPath = path.join(__dirname, '..', 'db', 'seed-data.json');
        const seed = fs.readFileSync(seedPath, 'utf8');
        await query(
          'INSERT INTO app_data (id, data, updated_by) VALUES (1, $1::jsonb, $2) ON CONFLICT (id) DO NOTHING',
          [seed, 'seed']
        );
        r = await query('SELECT data, updated_at FROM app_data WHERE id = 1');
      }
      return res.status(200).json({ data: r.rows[0].data, updatedAt: r.rows[0].updated_at });
    } catch (e) {
      return res.status(500).json({ error: 'Erro ao carregar dados: ' + e.message });
    }
  }

  if (req.method === 'POST') {
    const auth = requireAdmin(req, res);
    if (!auth) return;
    const { data } = req.body || {};
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Dataset inválido.' });
    }
    try {
      await query(
        `INSERT INTO app_data (id, data, updated_by) VALUES (1, $1::jsonb, $2)
         ON CONFLICT (id) DO UPDATE SET data = $1::jsonb, updated_at = now(), updated_by = $2`,
        [JSON.stringify(data), auth.username]
      );
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'Erro ao salvar dados: ' + e.message });
    }
  }

  res.status(405).json({ error: 'Método não permitido.' });
};
