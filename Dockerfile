# Use full Puppeteer image with all dependencies pre-installed
FROM ghcr.io/puppeteer/puppeteer:latest

# Set working directory
WORKDIR /app

# Install your dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your app
COPY . .

# Expose app port
EXPOSE 3000

# Run your app
CMD ["node", "index.js"]

