const jwt = require('jsonwebtoken');

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET não configurada.');
  return secret;
}

function signToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: '30d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, getSecret());
  } catch (e) {
    return null;
  }
}

// Extrai e valida o token Bearer do request. Retorna o payload {username, role, views} ou null.
function getAuth(req) {
  const header = req.headers['authorization'] || req.headers['Authorization'];
  if (!header || !header.startsWith('Bearer ')) return null;
  return verifyToken(header.slice(7));
}

// Responde 401 e retorna null se não autenticado; senão retorna o payload.
function requireAuth(req, res) {
  const auth = getAuth(req);
  if (!auth) {
    res.status(401).json({ error: 'Não autenticado.' });
    return null;
  }
  return auth;
}

// Responde 401/403 e retorna null se não for admin; senão retorna o payload.
function requireAdmin(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return null;
  if (auth.role !== 'admin') {
    res.status(403).json({ error: 'Acesso restrito a administradores.' });
    return null;
  }
  return auth;
}

module.exports = { signToken, verifyToken, getAuth, requireAuth, requireAdmin };
