FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy all files first to ensure SDK is available
COPY . .

# Install dependencies
RUN npm install --omit=dev

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "server.js"]