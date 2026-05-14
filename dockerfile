# ESTÁGIO 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Instala dependências primeiro (aproveita o cache de camadas do Docker)
COPY package*.json ./
RUN npm ci # 'npm ci' é mais seguro e rápido para ambientes de CI/CD e Docker do que o 'npm install'

# Copia o restante do código e gera o build de produção
COPY . .
RUN npm run build

# Remove dependências de desenvolvimento para limpar o ambiente antes de copiar
RUN npm prune --production

# ==========================================
# ESTÁGIO 2: Execução (Imagem Final Leve)
FROM node:20-slim

WORKDIR /app

# Define variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Copia apenas o estritamente necessário do estágio de build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Segurança: Altera o usuário para não rodar a aplicação como Root
USER node

# Comando para rodar a aplicação utilizando o build gerado
CMD ["node", "dist/main"]