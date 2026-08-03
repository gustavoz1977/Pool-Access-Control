import authService from '../services/authService.js';

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'MISSING_TOKEN',
        message: 'Token no proporcionado',
      });
    }
    const token = authHeader.slice(7);
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Token inválido o expirado',
    });
  }
};

export const adminMiddleware = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Se requieren permisos de administrador',
      });
    }
    next();
  } catch (err) {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: err.message,
    });
  }
};
