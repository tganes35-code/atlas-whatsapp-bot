# Atlas WhatsApp Chatbot - Dockerfile

# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Instalar dependencias
RUN cd backend && npm ci --omit=dev
RUN cd frontend && npm ci --omit=dev

# Copiar código fuente
COPY backend ./backend
COPY frontend ./frontend
COPY prisma ./prisma

# Compilar backend
RUN cd backend && npm run build

# Compilar frontend
RUN cd frontend && npm run build

# Stage 2: Runtime
FROM node:24-alpine

WORKDIR /app

# Instalar dumb-init para mejor manejo de señales
RUN apk add --no-cache dumb-init

# Copiar desde builder
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/frontend/dist ./frontend/dist

# Variables de entorno default
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/auth/login', (r) => {if (r.statusCode !== 200) throw new Error('Service unavailable')})"

# User no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Usar dumb-init para iniciar la aplicación
ENTRYPOINT ["/sbin/dumb-init", "--"]

# Start backend
CMD ["node", "backend/dist/main.js"]

EXPOSE 3000
