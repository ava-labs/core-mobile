# mobile-qai — Slack Socket Mode bot (long-running; use ECS Fargate)
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.docker.json ./tsconfig.json
COPY src ./src
RUN npx tsc -p tsconfig.json

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# Socket Mode: no inbound HTTP port required
USER node
CMD ["node", "dist/index.js"]
