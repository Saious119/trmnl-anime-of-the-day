# syntax=docker/dockerfile:1

FROM node:22-alpine

WORKDIR /app

COPY server/package*.json ./

RUN npm ci --omit=dev

COPY server/ ./

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000
CMD ["node", "index.js"]
