const bcrypt = require('bcryptjs');
const { query } = require('../lib/db');
const { signToken } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }
  try {
    const r = await query('SELECT * FROM users WHERE username = $1', [String(username).trim()]);
    const user = r.rows[0];
    if (!user) return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    const views = user.views || [];
    const token = signToken({ username: user.username, role: user.role, views });
    res.status(200).json({ token, username: user.username, role: user.role, views });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao autenticar: ' + e.message });
  }
};
