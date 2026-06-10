FROM node:24-alpine AS backend

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

RUN mkdir -p data logs

FROM node:24-alpine AS frontend

WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci && npm cache clean --force

COPY frontend ./frontend
RUN cd frontend && npm run build

FROM node:24-alpine

WORKDIR /app

COPY --from=backend /app /app
COPY --from=frontend /app/frontend/dist ./frontend/dist

RUN echo '#!/bin/sh\nset -e\nif [ ! -f /app/data/si-api.db ]; then\n  node src/config/migrate.js\n  node src/config/seed.js\nfi\nexec node src/index.js' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 3000

ENV NODE_ENV=production
ENV HOST=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

CMD ["/app/start.sh"]
