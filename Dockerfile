FROM node:22 AS builder
WORKDIR /app
COPY . .
RUN npm install -g pnpm
RUN pnpm install
RUN pnpm run --filter=@stackify/platform build
FROM node:22-slim
WORKDIR /app
COPY --from=builder /app/packages/stackify-platform/.output ./
EXPOSE 3000
CMD ["node", "/app/server/index.mjs"]