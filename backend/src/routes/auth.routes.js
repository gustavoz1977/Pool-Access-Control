import express from 'express';
import authService from '../services/authService.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, phone } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Email, contraseña y nombre son requeridos',
      });
    }
    const user = await authService.registerUser(email, password, full_name, phone);
    await authService.logAccess(user.id, 'registration', 'Nuevo usuario registrado');
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: user,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: 'REGISTRATION_ERROR',
      message: err.message,
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_CREDENTIALS',
        message: 'Email y contraseña son requeridos',
      });
    }
    const { user, token } = await authService.loginUser(email, password);
    await authService.logAccess(user.id, 'login', 'Login exitoso');
    res.json({
      success: true,
      message: 'Login exitoso',
      data: { user, token },
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'LOGIN_ERROR',
      message: err.message,
    });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.sub);
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(404).json({
      success: false,
      error: 'USER_NOT_FOUND',
      message: err.message,
    });
  }
});

router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { current_password, new_password, new_password_confirm } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Contraseña actual y nueva son requeridas',
      });
    }
    if (new_password !== new_password_confirm) {
      return res.status(400).json({
        success: false,
        error: 'PASSWORD_MISMATCH',
        message: 'Las nuevas contraseñas no coinciden',
      });
    }
    await authService.changePassword(req.user.sub, current_password, new_password);
    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: 'PASSWORD_CHANGE_ERROR',
      message: err.message,
    });
  }
});

export default router;
