# Build stage
FROM node:20-alpine as builder

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

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files for production dependencies
COPY package*.json ./
COPY yarn.lock ./

# Install only production dependencies
RUN yarn install --frozen-lockfile --production

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy server code
COPY server ./server

# Install additional dependencies for the server
RUN yarn add fastify @fastify/cors @fastify/static

# Expose port 80 (Caprover expects this)
EXPOSE 80

# Start the server
CMD ["node", "server/index.js"]
