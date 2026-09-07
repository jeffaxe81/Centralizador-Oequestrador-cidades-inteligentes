FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate
COPY package.json ./
RUN pnpm install --no-frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate
COPY package.json ./
RUN pnpm install --prod --no-frozen-lockfile
COPY --from=build /app/dist ./dist
EXPOSE 8080
CMD ["pnpm", "start"]
