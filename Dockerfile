FROM node:24-alpine AS builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend ./
RUN npx prisma generate && npm run build

FROM node:24-alpine

WORKDIR /app/backend

RUN apk add --no-cache dumb-init \
  && addgroup -g 1001 -S nodejs \
  && adduser -S nodejs -u 1001

COPY --from=builder --chown=nodejs:nodejs /app/backend/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/backend/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/backend/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/backend/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=3000

USER nodejs
EXPOSE 3000

ENTRYPOINT ["/sbin/dumb-init", "--"]
CMD ["sh", "-c", "npm run prisma:migrate:deploy && node dist/init-production.js && npm run start:prod"]
