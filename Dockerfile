# soma_be — NestJS + Prisma (port 4000). Dùng image slim (Debian) vì Prisma
# cần OpenSSL mà Alpine không có sẵn.
FROM node:24-slim AS deps
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY scripts/patch-dependencies.cjs ./scripts/patch-dependencies.cjs
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 \
    && npx prisma generate

FROM node:24-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-slim AS run
WORKDIR /app
ENV NODE_ENV=production
# Isolate the PDF reader from Debian's managed Python installation.
COPY scripts/pdf_quiz/requirements.txt /tmp/pdf-requirements.txt
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv \
    && python3 -m venv /opt/pdf-reader \
    && /opt/pdf-reader/bin/pip install --no-cache-dir -r /tmp/pdf-requirements.txt \
    && rm -rf /var/lib/apt/lists/* /tmp/pdf-requirements.txt
ENV PDF_PYTHON_BIN=/opt/pdf-reader/bin/python
COPY scripts/pdf_quiz/extract.py ./scripts/pdf_quiz/extract.py
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/resources ./resources
COPY package.json ./
EXPOSE 4000
# Áp migration rồi mới mở cổng — container DB phải healthy trước (xem compose).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
