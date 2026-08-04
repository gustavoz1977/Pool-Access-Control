FROM node:18-slim

WORKDIR /app

COPY package*.json ./

# Install with legacy peer deps flag to ignore conflicts
RUN npm install --legacy-peer-deps || true

COPY src ./src

EXPOSE 3001
CMD ["node", "src/server.js"]
