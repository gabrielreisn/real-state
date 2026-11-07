# Build from the repository root: docker build -f apps/web/Dockerfile .
FROM node:26-alpine AS build
# The build prerenders pages from Sanity, so it needs the (public) project and dataset.
ARG SANITY_PROJECT_ID
ARG SANITY_DATASET
ENV NEXT_TELEMETRY_DISABLED=1 SANITY_PROJECT_ID=$SANITY_PROJECT_ID SANITY_DATASET=$SANITY_DATASET
RUN npm install -g pnpm@12.6.0
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter web
COPY apps/web apps/web
RUN pnpm --filter web exec next build

FROM node:26-alpine
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
USER 1000
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
