FROM node:20-slim

WORKDIR /app

# Устанавливаем зависимости (используем npm install вместо npm ci,
# чтобы избежать падения сборки из‑за несовпадений package-lock)
COPY package.json package-lock.json ./
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "index.js"]
