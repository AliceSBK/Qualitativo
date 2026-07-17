const { query } = require('../lib/db');
const { requireAuth, requireAdmin } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const auth = requireAuth(req, res);
    if (!auth) return;
    try {
      const [tasksR, metaR, stateR] = await Promise.all([
        query('SELECT pasta, processo, prazo FROM tasks'),
        query('SELECT file_name, count, imported_at FROM task_meta WHERE id = 1'),
        query('SELECT incomplete_pastas FROM task_state WHERE id = 1'),
      ]);
      return res.status(200).json({
        tasks: tasksR.rows,
        meta: metaR.rows[0] || null,
        incomplete: (stateR.rows[0] && stateR.rows[0].incomplete_pastas) || [],
      });
    } catch (e) {
      return res.status(500).json({ error: 'Erro: ' + e.message });
    }
  }

  if (req.method === 'POST') {
    const auth = requireAdmin(req, res);
    if (!auth) return;
    const { entries, fileName, count } = req.body || {};
    if (!Array.isArray(entries)) return res.status(400).json({ error: 'Lista de tarefas inválida.' });
    try {
      const stateR = await query('SELECT open_pastas FROM task_state WHERE id = 1');
      const prevOpen = new Set((stateR.rows[0] && stateR.rows[0].open_pastas) || []);
      const newOpen = new Set(entries.map((e) => e.pasta).filter(Boolean));
      const incomplete = [...prevOpen].filter((p) => !newOpen.has(p));

      const valid = entries.filter((e) => e.pasta);
      await query('DELETE FROM tasks');
      if (valid.length) {
        await query(
          `INSERT INTO tasks (pasta, processo, prazo)
           SELECT * FROM UNNEST($1::text[], $2::text[], $3::timestamptz[])`,
          [valid.map((e) => e.pasta), valid.map((e) => e.processo || null), valid.map((e) => e.prazo || null)]
        );
      }
      await query(
        `INSERT INTO task_meta (id, file_name, count, imported_at) VALUES (1,$1,$2,now())
         ON CONFLICT (id) DO UPDATE SET file_name=$1, count=$2, imported_at=now()`,
        [fileName || '', count || entries.length]
      );
      await query(
        `INSERT INTO task_state (id, open_pastas, incomplete_pastas) VALUES (1, $1::jsonb, $2::jsonb)
         ON CONFLICT (id) DO UPDATE SET open_pastas=$1::jsonb, incomplete_pastas=$2::jsonb`,
        [JSON.stringify([...newOpen]), JSON.stringify(incomplete)]
      );
      return res.status(200).json({ ok: true, incomplete });
    } catch (e) {
      return res.status(500).json({ error: 'Erro: ' + e.message });
    }
  }

  res.status(405).json({ error: 'Método não permitido.' });
};
