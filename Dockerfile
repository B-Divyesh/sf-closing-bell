FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server ./server
ARG BUILD_SHA=dev
ENV BUILD_SHA=$BUILD_SHA

FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/server ./server
RUN chown node:node /app
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
USER node
CMD ["node", "server/server.mjs"]
