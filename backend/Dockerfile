FROM node:18

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy remaining backend code
COPY . .

# Expose backend port
EXPOSE 5000

# Start backend server
CMD ["node", "server.js"]
