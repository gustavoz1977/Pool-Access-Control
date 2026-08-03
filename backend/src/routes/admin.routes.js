import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';
import authService from '../services/authService.js';

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users', async (req, res) => {
  try {
    const users = await authService.getAllUsers();
    res.json({ success: true, data: users, count: users.length });
  } catch (err) {
    res.status(500).json({ success: false, error: 'FETCH_ERROR', message: err.message });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await authService.getUserById(userId);
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(404).json({ success: false, error: 'USER_NOT_FOUND', message: err.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { full_name, phone, status } = req.body;
    const updates = {};
    if (full_name) updates.full_name = full_name;
    if (phone) updates.phone = phone;
    if (status) updates.status = status;
    const user = await authService.updateUser(userId, updates);
    res.json({ success: true, message: 'Usuario actualizado', data: user });
  } catch (err) {
    res.status(400).json({ success: false, error: 'UPDATE_ERROR', message: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (userId === req.user.sub) {
      return res.status(400).json({
        success: false,
        error: 'CANNOT_DELETE_SELF',
        message: 'No puedes eliminarte a ti mismo',
      });
    }
    await authService.deleteUser(userId);
    res.json({ success: true, message: 'Usuario eliminado' });
  } catch (err) {
    res.status(400).json({ success: false, error: 'DELETE_ERROR', message: err.message });
  }
});

router.post('/users/:id/status', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { status } = req.body;
    const validStatuses = ['active', 'suspended', 'inactive'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: `Status debe ser uno de: ${validStatuses.join(', ')}`,
      });
    }
    const user = await authService.updateUser(userId, { status });
    res.json({
      success: true,
      message: `Usuario ${status === 'active' ? 'activado' : 'desactivado'}`,
      data: user,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: 'STATUS_ERROR', message: err.message });
  }
});

router.get('/access-logs', async (req, res) => {
  try {
    const skip = parseInt(req.query.skip) || 0;
    const limit = parseInt(req.query.limit) || 100;
    const logs = await authService.getAllAccessLogs(skip, limit);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: 'FETCH_ERROR', message: err.message });
  }
});

router.get('/users/:id/access-logs', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit) || 50;
    const logs = await authService.getUserAccessLogs(userId, limit);
    res.json({ success: true, data: logs, count: logs.length });
  } catch (err) {
    res.status(500).json({ success: false, error: 'FETCH_ERROR', message: err.message });
  }
});

export default router;
