# Production Dockerfile for Famora Backend on Azure
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Create default upload directories (fallback)
RUN mkdir -p uploads/produce uploads/avatars uploads/documents

EXPOSE 5001

CMD ["node", "dist/server.js"]
