# build
FROM node:22 AS build

WORKDIR /app
COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci \
    --prefer-offline \
    --no-audit \
    --cache /tmp/npm-cache \
    --no-progress \
    --max-parallel 4

COPY . .

RUN npm run build

# prod
FROM node:22-alpine

WORKDIR /app
COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci \
    --prefer-offline \
    --no-audit \
    --cache /tmp/npm-cache \
    --no-progress \
    --max-parallel 4 \
    --only=production

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
