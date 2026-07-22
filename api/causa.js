const { query } = require('../lib/db');
const { requireAuth, requireAdmin } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const auth = requireAuth(req, res);
    if (!auth) return;
    try {
      const [alertsR, verifiedR] = await Promise.all([
        query('SELECT pasta, processo, causa_anterior, causa_atual, produto_anterior, produto_atual, detectado_em FROM causa_alerts'),
        query('SELECT pasta, causa, produto FROM causa_verified'),
      ]);
      return res.status(200).json({
        alerts: alertsR.rows,
        verified: verifiedR.rows.map((r) => `${r.pasta}|${r.causa}|${r.produto}`),
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
      const { pasta, causa, produto } = req.body;
      if (!pasta || (!causa && !produto)) return res.status(400).json({ error: 'Informe pasta e causa ou produto.' });
      try {
        await query(
          'INSERT INTO causa_verified (pasta, causa, produto, verified_by) VALUES ($1,$2,$3,$4) ON CONFLICT (pasta, causa, produto) DO NOTHING',
          [pasta, causa || '', produto || '', auth.username]
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
          query('SELECT pasta, causa, produto FROM causa_hist'),
          query('SELECT pasta, causa, produto FROM causa_verified'),
        ]);
        const hist = new Map(histR.rows.map((r) => [r.pasta, { causa: r.causa, produto: r.produto }]));
        const verified = new Set(verifiedR.rows.map((r) => `${r.pasta}|${r.causa}|${r.produto}`));
        const hoje = new Date().toLocaleDateString('pt-BR');

        const alerts = [];
        const pastasOut = [];
        const causasOut = [];
        const produtosOut = [];
        for (const row of rows) {
          const pasta = row.pasta;
          if (!pasta) continue;
          const causa = String(row.causa || '').trim();
          const produto = String(row.produto || '').trim();
          const prev = hist.get(pasta) || {};
          const causaValida = !!causa && causa !== 'A classificar';
          const produtoValido = !!produto && produto !== 'A classificar';

          const causaMudou = causaValida && !!prev.causa && prev.causa !== 'A classificar' && prev.causa !== causa;
          const produtoMudou = produtoValido && !!prev.produto && prev.produto !== 'A classificar' && prev.produto !== produto;

          if ((causaMudou || produtoMudou) && !verified.has(`${pasta}|${causaMudou ? causa : ''}|${produtoMudou ? produto : ''}`)) {
            alerts.push({
              pasta,
              processo: row.processo || null,
              causa_anterior: causaMudou ? prev.causa : null,
              causa_atual: causaMudou ? causa : null,
              produto_anterior: produtoMudou ? prev.produto : null,
              produto_atual: produtoMudou ? produto : null,
              detectado_em: hoje,
            });
          }

          // Só atualiza o histórico de cada campo quando o valor atual for
          // válido; um valor em branco/"A classificar" não sobrescreve o
          // último valor real conhecido.
          pastasOut.push(pasta);
          causasOut.push(causaValida ? causa : (prev.causa || ''));
          produtosOut.push(produtoValido ? produto : (prev.produto || ''));
        }

        // Upsert em lote do histórico (1 round-trip para todas as pastas).
        if (pastasOut.length) {
          await query(
            `INSERT INTO causa_hist (pasta, causa, produto, updated_at)
             SELECT pasta, causa, produto, now() FROM UNNEST($1::text[], $2::text[], $3::text[]) AS t(pasta, causa, produto)
             ON CONFLICT (pasta) DO UPDATE SET causa = EXCLUDED.causa, produto = EXCLUDED.produto, updated_at = now()`,
            [pastasOut, causasOut, produtosOut]
          );
        }
        // Alertas: normalmente poucos por importação, upsert um a um é ok.
        for (const a of alerts) {
          await query(
            `INSERT INTO causa_alerts (pasta, processo, causa_anterior, causa_atual, produto_anterior, produto_atual, detectado_em)
             VALUES ($1,$2,$3,$4,$5,$6,$7)
             ON CONFLICT (pasta) DO UPDATE SET causa_anterior=$3, causa_atual=$4, produto_anterior=$5, produto_atual=$6, processo=$2, detectado_em=$7`,
            [a.pasta, a.processo, a.causa_anterior, a.causa_atual, a.produto_anterior, a.produto_atual, a.detectado_em]
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
