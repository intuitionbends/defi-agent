# syntax=docker/dockerfile:1.4

# Build stage
FROM node:22 AS build

WORKDIR /app

# Copy only necessary files first (cache friendly)
COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --no-progress

# Now copy the rest of the app
COPY . .

# Build your TypeScript
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --no-progress --only=production

# Bring only compiled dist/ folder
COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
