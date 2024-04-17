FROM node:latest AS base

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install


COPY src ./src
COPY prisma ./prisma
RUN npx prisma generate && \
    npm run build && \
    npm prune --production

# Setup for runtime
COPY data /app/data

CMD ["node", "dist/index.js"]
