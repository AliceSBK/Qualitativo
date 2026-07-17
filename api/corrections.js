const { query } = require('../lib/db');
const { requireAuth, requireAdmin } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const auth = requireAuth(req, res);
    if (!auth) return;
    try {
      const r = await query('SELECT pasta, category FROM corrections');
      return res.status(200).json({ keys: r.rows.map((row) => `${row.pasta}|${row.category}`) });
    } catch (e) {
      return res.status(500).json({ error: 'Erro: ' + e.message });
    }
  }

  if (req.method === 'POST') {
    const auth = requireAdmin(req, res);
    if (!auth) return;
    const { keys } = req.body || {};
    if (!Array.isArray(keys) || !keys.length) return res.status(200).json({ ok: true, added: 0 });
    try {
      const pastas = [], categories = [];
      keys.forEach((k) => {
        const idx = k.lastIndexOf('|');
        if (idx < 0) return;
        pastas.push(k.slice(0, idx));
        categories.push(k.slice(idx + 1));
      });
      if (!pastas.length) return res.status(200).json({ ok: true, added: 0 });
      const r = await query(
        `INSERT INTO corrections (pasta, category, corrected_by)
         SELECT pasta, category, $3 FROM UNNEST($1::text[], $2::text[]) AS t(pasta, category)
         ON CONFLICT (pasta, category) DO NOTHING`,
        [pastas, categories, auth.username]
      );
      return res.status(200).json({ ok: true, added: r.rowCount });
    } catch (e) {
      return res.status(500).json({ error: 'Erro: ' + e.message });
    }
  }

  if (req.method === 'DELETE') {
    const auth = requireAdmin(req, res);
    if (!auth) return;
    const k = req.query && req.query.key;
    if (!k) return res.status(400).json({ error: 'Informe a chave (pasta|categoria).' });
    const idx = k.lastIndexOf('|');
    if (idx < 0) return res.status(400).json({ error: 'Chave inválida.' });
    try {
      await query('DELETE FROM corrections WHERE pasta=$1 AND category=$2', [k.slice(0, idx), k.slice(idx + 1)]);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'Erro: ' + e.message });
    }
  }

  res.status(405).json({ error: 'Método não permitido.' });
};
