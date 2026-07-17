const { query } = require('../lib/db');
const { requireAuth, requireAdmin } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const auth = requireAuth(req, res);
    if (!auth) return;
    try {
      const r = await query('SELECT ts, sig, total_processos, tot, summary FROM snapshots ORDER BY ts ASC');
      return res.status(200).json({ snapshots: r.rows });
    } catch (e) {
      return res.status(500).json({ error: 'Erro: ' + e.message });
    }
  }

  if (req.method === 'POST') {
    const auth = requireAdmin(req, res);
    if (!auth) return;
    const { snapshot } = req.body || {};
    if (!snapshot || !snapshot.sig) return res.status(400).json({ error: 'Retrato inválido.' });
    try {
      const last = await query('SELECT sig FROM snapshots ORDER BY ts DESC LIMIT 1');
      if (last.rows[0] && last.rows[0].sig === snapshot.sig) {
        return res.status(200).json({ ok: true, added: false });
      }
      await query(
        'INSERT INTO snapshots (ts, sig, total_processos, tot, summary) VALUES ($1,$2,$3,$4,$5::jsonb)',
        [snapshot.ts, snapshot.sig, snapshot.total_processos, snapshot.tot, JSON.stringify(snapshot.summary || {})]
      );
      return res.status(200).json({ ok: true, added: true });
    } catch (e) {
      return res.status(500).json({ error: 'Erro: ' + e.message });
    }
  }

  if (req.method === 'DELETE') {
    const auth = requireAdmin(req, res);
    if (!auth) return;
    try {
      await query('DELETE FROM snapshots');
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'Erro: ' + e.message });
    }
  }

  res.status(405).json({ error: 'Método não permitido.' });
};
