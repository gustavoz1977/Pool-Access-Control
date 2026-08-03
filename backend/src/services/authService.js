import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import blobStorageService from './blobStorageService.js';

class AuthService {
  async loginUser(email, password) {
    const data = await blobStorageService.readFile('users.json');
    const users = data.users || [];

    const user = users.find(u => u.email === email);
    if (!user) {
      throw new Error('Email o contraseña incorrectos');
    }

    // En mock mode: comparar texto plano (contraseña_hash es la contraseña real)
    // En producción: usar bcryptjs.compare
    const isMockMode = !user.password_hash.startsWith('$2b$');
    const isValidPassword = isMockMode 
      ? password === user.password_hash
      : await bcryptjs.compare(password, user.password_hash);

    if (!isValidPassword) {
      throw new Error('Email o contraseña incorrectos');
    }

    if (user.status !== 'active') {
      throw new Error('Tu cuenta está suspendida o inactiva');
    }

    user.last_login_at = new Date().toISOString();
    await blobStorageService.writeFile('users.json', { users });

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    const { password_hash, ...userPublic } = user;
    return {
      user: userPublic,
      token,
    };
  }

  async registerUser(email, password, fullName, phone = null) {
    if (!email || !password || !fullName) {
      throw new Error('Email, contraseña y nombre son requeridos');
    }
    if (password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    const data = await blobStorageService.readFile('users.json');
    const users = data.users || [];

    if (users.find(u => u.email === email)) {
      throw new Error('El email ya está registrado');
    }

    const passwordHash = await bcryptjs.hash(password, 10);
    const newUser = {
      id: Math.max(...users.map(u => u.id), 0) + 1,
      email,
      password_hash: passwordHash,
      full_name: fullName,
      phone: phone || null,
      role: 'user',
      status: 'active',
      created_at: new Date().toISOString(),
      last_login_at: null,
    };

    users.push(newUser);
    await blobStorageService.writeFile('users.json', { users });

    const { password_hash, ...userPublic } = newUser;
    return userPublic;
  }

  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (err) {
      throw new Error('Token inválido o expirado');
    }
  }

  async getUserById(userId) {
    const data = await blobStorageService.readFile('users.json');
    const users = data.users || [];
    const user = users.find(u => u.id === userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    const { password_hash, ...userPublic } = user;
    return userPublic;
  }

  async getAllUsers() {
    const data = await blobStorageService.readFile('users.json');
    const users = data.users || [];
    return users.map(u => {
      const { password_hash, ...userPublic } = u;
      return userPublic;
    });
  }

  async updateUser(userId, updates) {
    const data = await blobStorageService.readFile('users.json');
    const users = data.users || [];
    const user = users.find(u => u.id === userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    const allowedFields = ['full_name', 'phone', 'status'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    });
    user.updated_at = new Date().toISOString();
    await blobStorageService.writeFile('users.json', { users });
    const { password_hash, ...userPublic } = user;
    return userPublic;
  }

  async deleteUser(userId) {
    const data = await blobStorageService.readFile('users.json');
    let users = data.users || [];
    const user = users.find(u => u.id === userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    users = users.filter(u => u.id !== userId);
    await blobStorageService.writeFile('users.json', { users });
    return true;
  }

  async logAccess(userId, type = 'login', notes = null) {
    const data = await blobStorageService.readFile('access-logs.json');
    const logs = data.logs || [];
    const logEntry = {
      id: Math.max(...logs.map(l => l.id || 0), 0) + 1,
      user_id: userId,
      access_type: type,
      timestamp: new Date().toISOString(),
      notes: notes || null,
    };
    logs.push(logEntry);
    await blobStorageService.writeFile('access-logs.json', { logs });
    return logEntry;
  }

  async getUserAccessLogs(userId, limit = 50) {
    const data = await blobStorageService.readFile('access-logs.json');
    const logs = data.logs || [];
    return logs
      .filter(l => l.user_id === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  async getAllAccessLogs(skip = 0, limit = 100) {
    const data = await blobStorageService.readFile('access-logs.json');
    const logs = data.logs || [];
    const total = logs.length;
    const paged = logs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(skip, skip + limit);
    return {
      logs: paged,
      total,
      skip,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async changePassword(userId, currentPassword, newPassword) {
    if (newPassword.length < 8) {
      throw new Error('La nueva contraseña debe tener al menos 8 caracteres');
    }
    const data = await blobStorageService.readFile('users.json');
    const users = data.users || [];
    const user = users.find(u => u.id === userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const isMockMode = !user.password_hash.startsWith('$2b$');
    const isValid = isMockMode
      ? currentPassword === user.password_hash
      : await bcryptjs.compare(currentPassword, user.password_hash);

    if (!isValid) {
      throw new Error('Contraseña actual incorrecta');
    }
    user.password_hash = await bcryptjs.hash(newPassword, 10);
    user.updated_at = new Date().toISOString();
    await blobStorageService.writeFile('users.json', { users });
    return { message: 'Contraseña actualizada' };
  }
}

export default new AuthService();
