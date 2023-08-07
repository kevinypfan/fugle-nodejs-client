FROM node:16-alpine as builder

ENV NODE_ENV build

WORKDIR /app
COPY . .

RUN npm install -g pnpm \
    && pnpm install \
    && pnpm run build ws-client \
    && pnpm prune --prod

# ---

FROM node:16-alpine

ENV NODE_ENV production

WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules/ ./node_modules/
COPY --from=builder /app/dist/ ./dist/

CMD ["node", "dist/apps/ws-client/main.js"]
