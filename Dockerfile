# Build stage
FROM node:22.23.4-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@9
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Run stage
FROM node:22.23.4-alpine
WORKDIR /app
RUN npm install -g pnpm@9
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY server/ ./server/
COPY --from=builder /app/dist ./dist/
EXPOSE 3000
CMD ["node", "server/index.js"]
