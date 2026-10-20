# soma_be — NestJS + Prisma (port 4000). Dùng image slim (Debian) vì Prisma
# cần OpenSSL mà Alpine không có sẵn.
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY scripts/patch-dependencies.cjs ./scripts/patch-dependencies.cjs
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci && npx prisma generate

FROM node:24-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-slim AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/resources ./resources
COPY package.json ./
EXPOSE 4000
# Áp migration rồi mới mở cổng — container DB phải healthy trước (xem compose).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
