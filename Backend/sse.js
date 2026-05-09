const jwt = require('jsonwebtoken');

// Conexiones SSE activas
const clients = new Set();

function getUserFromRequest(req) {
  try {
    let token;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }
    if (!token) return null;
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    return payload.user ? payload.user : payload;
  } catch (e) {
    return null;
  }
}

function register(req, res) {
  // Autenticación básica usando token en header o query
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).end();
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // Enviar comentario inicial para abrir el stream
  res.write(': connected\n\n');

  clients.add(res);

  const keepAlive = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch (e) {
      // Si falla, se cerrará en el close
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    clients.delete(res);
  });
}

function sendEvent(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try {
      client.write(payload);
    } catch (e) {
      // Conexión rota; será removida en el close
    }
  }
}

module.exports = { register, sendEvent };

