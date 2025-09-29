FROM node:20 as builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
RUN npm prune --production
FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/.output ./
EXPOSE 3000
CMD ["node", "/app/server/index.mjs"]