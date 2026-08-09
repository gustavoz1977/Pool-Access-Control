import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import dbService from '../services/dbService.js';

const router = express.Router();

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
  }
  next();
};

router.get('/users', authMiddleware, adminOnly, (req, res) => {
  try {
    const users = dbService.getUsers();
    res.json({ data: users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

router.post('/users', authMiddleware, adminOnly, (req, res) => {
  try {
    const { email, password, full_name, phone } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, contraseña y nombre son requeridos' });
    }

    const users = dbService.getUsers();
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'El email ya existe' });
    }

    const result = dbService.createUser(email, password, full_name, phone);
    res.status(201).json({ 
      data: { 
        id: result.lastInsertRowid, 
        email, 
        full_name, 
        phone,
        role: 'user',
        status: 'active',
        created_at: new Date().toISOString()
      } 
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

router.put('/users/:id', authMiddleware, adminOnly, (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { full_name, phone, status } = req.body;

    const users = dbService.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const updates = {};
    if (full_name) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone;
    if (status) updates.status = status;

    dbService.updateUser(userId, updates);
    res.json({ data: { ...user, ...updates } });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

router.delete('/users/:id', authMiddleware, adminOnly, (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const users = dbService.getUsers();
    
    if (!users.find(u => u.id === userId)) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    dbService.deleteUser(userId);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

router.get('/access-logs', authMiddleware, adminOnly, (req, res) => {
  try {
    const logs = dbService.getLogs();
    res.json({ data: { logs } });
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ error: 'Error al obtener logs' });
  }
});

export default router;
