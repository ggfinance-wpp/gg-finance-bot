# --- STAGE 1: Build ---
FROM node:18-alpine AS builder

WORKDIR /app

# Instala dependências do sistema necessárias para Prisma
RUN apk add --no-cache openssl

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

COPY package*.json ./
RUN npm install

COPY . .

# Gera o Prisma Client
RUN npx prisma generate

# Compila o TypeScript
RUN npm run build

# --- STAGE 2: Runtime ---
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
