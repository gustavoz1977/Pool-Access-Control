import { BlobServiceClient } from '@azure/storage-blob';
import 'dotenv/config';

class BlobStorageService {
  constructor() {
    this.blobServiceClient = null;
    this.containerName = process.env.AZURE_STORAGE_CONTAINER || 'pool-access-control';
    this.containerClient = null;
    this.useMockMode = false;
  }

  async initializeContainer() {
    try {
      const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
      
      if (!connectionString) {
        console.warn('⚠️  AZURE_STORAGE_CONNECTION_STRING not set');
        this.useMockMode = true;
        return;
      }

      this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);

      await this.containerClient.getProperties();
      console.log(`✅ Conectado a Azure Blob Storage: ${this.containerName}`);

      await this.ensureFilesExist();
      this.useMockMode = false;
    } catch (err) {
      console.error('❌ Azure error:', err.message);
      this.useMockMode = true;
    }
  }

  async ensureFilesExist() {
    if (!this.containerClient) return;

    const files = [
      { name: 'users.json', data: { users: [] } },
      { name: 'access-logs.json', data: { logs: [] } },
      { name: 'user-sessions.json', data: { sessions: [] } },
    ];

    for (const file of files) {
      try {
        const blobClient = this.containerClient.getBlobClient(file.name);
        
        try {
          await blobClient.getProperties();
          console.log(`✅ ${file.name} ya existe`);
          continue;
        } catch (e) {
          // Doesn't exist, create it
        }

        console.log(`📝 Creando ${file.name}...`);
        const jsonString = JSON.stringify(file.data, null, 2);
        
        await this.containerClient.uploadBlockBlob(file.name, jsonString, jsonString.length);
        console.log(`✅ ${file.name} creado`);
      } catch (err) {
        console.error(`❌ Error ${file.name}:`, err.message);
      }
    }
  }

  async readFile(fileName) {
    if (this.useMockMode || !this.containerClient) return this.getMockData(fileName);

    try {
      const blobClient = this.containerClient.getBlobClient(fileName);
      const download = await blobClient.download();
      const chunks = [];

      for await (const chunk of download.readableStreamBody) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);
      return JSON.parse(buffer.toString('utf-8'));
    } catch (err) {
      console.error(`Error reading ${fileName}:`, err.message);
      return this.getMockData(fileName);
    }
  }

  async writeFile(fileName, data) {
    // ¡¡¡CAMBIO CRÍTICO: SIEMPRE INTENTA GUARDAR, INCLUSO EN MOCK MODE!!!
    if (!this.containerClient) {
      console.warn(`⚠️ No Azure connection for ${fileName}, using mock`);
      return;
    }

    try {
      const jsonString = JSON.stringify(data, null, 2);
      await this.containerClient.uploadBlockBlob(fileName, jsonString, jsonString.length);
      console.log(`✅ ${fileName} guardado en Azure`);
    } catch (err) {
      console.error(`Error escribiendo ${fileName}:`, err.message);
    }
  }

  getMockData(fileName) {
    if (fileName === 'users.json') {
      return {
        users: [
          {
            id: 1,
            email: 'admin@pool.local',
            password_hash: 'Admin@123!',
            full_name: 'Administrador',
            phone: null,
            role: 'admin',
            status: 'active',
            created_at: new Date().toISOString(),
            last_login_at: null,
          },
        ],
      };
    }
    if (fileName === 'access-logs.json') return { logs: [] };
    return { sessions: [] };
  }
}

export default new BlobStorageService();
