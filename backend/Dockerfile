FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy app code
COPY src ./src

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "src/server.js"]
