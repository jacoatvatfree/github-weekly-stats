# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN yarn build

WORKDIR /app

# Install a simple static file server
RUN npm install -g serve

# Expose port 80 (Caprover expects this)
EXPOSE 80

# Serve the built application
CMD ["serve", "-s", "dist", "-l", "80"]
