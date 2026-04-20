FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and SDK file for dependencies
COPY package.json ./
COPY exacaster-analytics.tgz ./
RUN npm install --production

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "server.js"]