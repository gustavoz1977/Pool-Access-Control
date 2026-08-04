FROM node:18-alpine

WORKDIR /app

# Update npm
RUN npm install -g npm@latest

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm install

# Copy app code
COPY src ./src

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "src/server.js"]
