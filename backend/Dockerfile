FROM node:20-bookworm-slim AS deps

WORKDIR /app

COPY package*.json ./
RUN npm install

FROM deps AS build

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM deps AS prod-deps

RUN npm prune --omit=dev

FROM node:20-bookworm-slim AS runner

ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./

USER node

EXPOSE 8080

CMD ["npm", "start"]
