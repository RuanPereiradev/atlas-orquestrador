FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci # 'npm ci' é mais seguro e rápido para ambientes de CI/CD e Docker do que o 'npm install'

COPY . .
RUN npm run build

RUN npm prune --production

FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000

USER node

CMD ["node", "dist/main"]