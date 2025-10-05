FROM node:24.9.0-alpine AS base

RUN apk update && apk add --no-cache libc6-compat

WORKDIR /app

FROM base AS pruner

COPY package*.json turbo.json tsconfig.json ./
COPY apps/ ./apps

RUN npx turbo@2.5.8 prune --scope="@apps/frontend" --docker

FROM base AS installer

# Accept build arguments for environment variables
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_GOOGLE_MAPS_MAP_ID
ARG VITE_BACKEND_URL

# Make them available to the build
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GOOGLE_MAPS_MAP_ID=$VITE_GOOGLE_MAPS_MAP_ID
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
COPY tsconfig.json ./

RUN npm ci

COPY --from=pruner /app/out/full/ .

RUN npm run build --filter="@apps/frontend"

FROM nginx as static

COPY --from=installer /app/apps/frontend/nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=installer /app/apps/frontend/dist /usr/share/nginx/html
