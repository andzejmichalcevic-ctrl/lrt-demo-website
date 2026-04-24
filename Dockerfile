FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and SDK
COPY package*.json ./
COPY exacaster-analytics.tgz ./

# Install dependencies with proper npm flags
RUN npm ci --omit=dev || npm install --omit=dev

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "server.js"]