# Use LTS Node (stable)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency files first (cache-friendly)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy rest of backend source
COPY . .

# Expose backend port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
