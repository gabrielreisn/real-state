# Build from the repository root: docker build -f apps/api/Dockerfile .
FROM node:26-alpine AS build
RUN npm install -g pnpm@12.6.0
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter api
COPY apps/api apps/api
RUN pnpm --filter api build
RUN pnpm --filter api deploy --legacy --prod /app && cp -r apps/api/dist /app/dist

FROM node:26-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app .
USER 1000
EXPOSE 4000
CMD ["node", "dist/main.js"]
