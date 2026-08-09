import express from 'express';
import jwt from 'jsonwebtoken';
import authMiddleware from '../middleware/auth.middleware.js';
import dbService from '../services/dbService.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const users = dbService.getUsers();
    const user = users.find(u => u.email === email);

    if (!user || user.password_hash !== password) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
      { expiresIn: '24h' }
    );

    dbService.updateUser(user.id, { last_login_at: new Date().toISOString() });

    res.json({ data: { token, user } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, contraseña y nombre requeridos' });
    }

    const users = dbService.getUsers();
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'El email ya existe' });
    }

    const result = dbService.createUser(email, password, full_name, null);

    const token = jwt.sign(
      { id: result.lastInsertRowid, email, role: 'user' },
      process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
      { expiresIn: '24h' }
    );

    res.status(201).json({ 
      data: { 
        token, 
        user: { 
          id: result.lastInsertRowid, 
          email, 
          full_name, 
          role: 'user',
          status: 'active',
          created_at: new Date().toISOString()
        } 
      } 
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Error al registrarse' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  try {
    const users = dbService.getUsers();
    const user = users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ data: user });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Contraseña antigua y nueva requeridas' });
    }

    const users = dbService.getUsers();
    const user = users.find(u => u.id === req.user.id);

    if (!user || user.password_hash !== oldPassword) {
      return res.status(401).json({ error: 'Contraseña antigua incorrecta' });
    }

    dbService.updateUser(user.id, { password_hash: newPassword });
    res.json({ success: true });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, (req, res) => {
  res.json({ success: true });
});

export default router;
