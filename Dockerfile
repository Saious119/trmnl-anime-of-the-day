FROM node:22-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
EXPOSE 3000
CMD ["node", "index.js"]
