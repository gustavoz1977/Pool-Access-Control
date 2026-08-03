import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import blobStorageService from '../services/blobStorageService.js';

const router = express.Router();

// Middleware: Solo admin
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
  }
  next();
};

// GET /api/admin/users
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await blobStorageService.readFile('users.json');
    res.json({ data: users.users || [] });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// POST /api/admin/users
router.post('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { email, password, full_name, phone } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, contraseña y nombre son requeridos' });
    }

    // Leer usuarios existentes
    const data = await blobStorageService.readFile('users.json');
    const users = data.users || [];

    // Verificar que el email no exista
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'El email ya existe' });
    }

    // Crear nuevo usuario
    const newUser = {
      id: Math.max(...users.map(u => u.id), 0) + 1,
      email,
      password_hash: password, // En producción, hashear con bcrypt
      full_name,
      phone: phone || null,
      role: 'user',
      status: 'active',
      created_at: new Date().toISOString(),
      last_login_at: null,
    };

    users.push(newUser);

    // ✅ GUARDAR EN BLOB STORAGE
    await blobStorageService.writeFile('users.json', { users });

    res.status(201).json({ data: newUser });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { full_name, phone, status } = req.body;

    const data = await blobStorageService.readFile('users.json');
    const users = data.users || [];

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (full_name) user.full_name = full_name;
    if (phone !== undefined) user.phone = phone;
    if (status) user.status = status;

    // ✅ GUARDAR EN BLOB STORAGE
    await blobStorageService.writeFile('users.json', { users });

    res.json({ data: user });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const data = await blobStorageService.readFile('users.json');
    let users = data.users || [];

    const initialLength = users.length;
    users = users.filter(u => u.id !== userId);

    if (users.length === initialLength) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // ✅ GUARDAR EN BLOB STORAGE
    await blobStorageService.writeFile('users.json', { users });

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// GET /api/admin/access-logs
router.get('/access-logs', authMiddleware, adminOnly, async (req, res) => {
  try {
    const data = await blobStorageService.readFile('access-logs.json');
    res.json({ data });
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ error: 'Error al obtener logs' });
  }
});

export default router;
