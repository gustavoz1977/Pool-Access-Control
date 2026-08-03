import app from './app.js';
import blobStorageService from './services/blobStorageService.js';
import 'dotenv/config';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║   Pool Access Control - API        ║
╚════════════════════════════════════╝

✨ Server running on port ${PORT}
📍 URL: http://localhost:${PORT}
  `);
});

process.on('SIGTERM', () => {
  process.exit(0);
});
