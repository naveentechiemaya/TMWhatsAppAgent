# Base image with Node.js
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Expose port (if needed, e.g. if you serve something)
EXPOSE 3000

# Start the app
CMD ["node", "index.js"]
