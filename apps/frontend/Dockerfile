# Stage 1: Build Frontend
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/frontend/package.json ./apps/frontend/

RUN npm install

COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend

# Build shared package so frontend TypeScript compiler can find types
RUN npm run build --workspace=@rfm/shared

WORKDIR /app/apps/frontend
RUN npm run build

# Stage 2: Serve via Nginx
FROM nginx:alpine AS runner

COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
