# Use Node.js 18 Alpine
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Install a simple HTTP server
RUN npm install -g serve

# Expose port (Railway will set PORT env var)
EXPOSE $PORT

# Start the application
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3001}"]