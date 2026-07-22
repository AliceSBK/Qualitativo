const { query } = require('../lib/db');
const { requireAuth, requireAdmin } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const auth = requireAuth(req, res);
    if (!auth) return;
    try {
      const [alertsR, verifiedR] = await Promise.all([
        query('SELECT pasta, processo, causa_anterior, causa_atual, detectado_em FROM causa_alerts'),
        query('SELECT pasta, causa FROM causa_verified'),
      ]);
      return res.status(200).json({
        alerts: alertsR.rows,
        verified: verifiedR.rows.map((r) => `${r.pasta}|${r.causa}`),
      });
    } catch (e) {
      return res.status(500).json({ error: 'Erro: ' + e.message });
    }
  }

  if (req.method === 'POST') {
    const auth = requireAdmin(req, res);
    if (!auth) return;
    const { action } = req.body || {};

    if (action === 'verify') {
      const { pasta, causa } = req.body;
      if (!pasta || !causa) return res.status(400).json({ error: 'Informe pasta e causa.' });
      try {
        await query(
          'INSERT INTO causa_verified (pasta, causa, verified_by) VALUES ($1,$2,$3) ON CONFLICT (pasta, causa) DO NOTHING',
          [pasta, causa, auth.username]
        );
        return res.status(200).json({ ok: true });
      } catch (e) {
        return res.status(500).json({ error: 'Erro: ' + e.message });
      }
    }

    if (action === 'detect') {
      const { rows } = req.body;
      if (!Array.isArray(rows)) return res.status(400).json({ error: 'Lista inválida.' });
      try {
        // Carrega histórico e verificados de uma vez (evita 1 consulta por
        // pasta, já que a base tem dezenas de milhares de linhas).
        const [histR, verifiedR] = await Promise.all([
          query('SELECT pasta, causa FROM causa_hist'),
          query('SELECT pasta, causa FROM causa_verified'),
        ]);
        const hist = new Map(histR.rows.map((r) => [r.pasta, r.causa]));
        const verified = new Set(verifiedR.rows.map((r) => `${r.pasta}|${r.causa}`));
        const hoje = new Date().toLocaleDateString('pt-BR');

        const alerts = [];
        const pastasOut = [];
        const causasOut = [];
        for (const row of rows) {
          const pasta = row.pasta;
          const causa = String(row.causa || '').trim();
          if (!pasta || !causa || causa === 'A classificar') continue;
          const prev = hist.get(pasta);
          if (prev && prev !== 'A classificar' && prev !== causa && !verified.has(`${pasta}|${causa}`)) {
            alerts.push({ pasta, processo: row.processo || null, causa_anterior: prev, causa_atual: causa, detectado_em: hoje });
          }
          pastasOut.push(pasta);
          causasOut.push(causa);
        }

        // Upsert em lote do histórico (1 round-trip para todas as pastas).
        if (pastasOut.length) {
          await query(
            `INSERT INTO causa_hist (pasta, causa, updated_at)
             SELECT pasta, causa, now() FROM UNNEST($1::text[], $2::text[]) AS t(pasta, causa)
             ON CONFLICT (pasta) DO UPDATE SET causa = EXCLUDED.causa, updated_at = now()`,
            [pastasOut, causasOut]
          );
        }
        // Alertas: normalmente poucos por importação, upsert um a um é ok.
        for (const a of alerts) {
          await query(
            `INSERT INTO causa_alerts (pasta, processo, causa_anterior, causa_atual, detectado_em)
             VALUES ($1,$2,$3,$4,$5)
             ON CONFLICT (pasta) DO UPDATE SET causa_atual=$4, processo=$2, detectado_em=$5`,
            [a.pasta, a.processo, a.causa_anterior, a.causa_atual, a.detectado_em]
          );
        }
        return res.status(200).json({ ok: true, detected: alerts.length });
      } catch (e) {
        return res.status(500).json({ error: 'Erro: ' + e.message });
      }
    }

    return res.status(400).json({ error: 'Ação inválida.' });
  }

  res.status(405).json({ error: 'Método não permitido.' });
};
