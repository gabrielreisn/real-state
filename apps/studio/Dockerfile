# Build from the repository root: docker build -f apps/studio/Dockerfile .
# The Sanity project is compiled into the static bundle, so it is a build argument.
FROM node:26-alpine AS build
ARG SANITY_STUDIO_PROJECT_ID=1ai1aq1e
ARG SANITY_STUDIO_DATASET=development
ENV SANITY_STUDIO_PROJECT_ID=$SANITY_STUDIO_PROJECT_ID SANITY_STUDIO_DATASET=$SANITY_STUDIO_DATASET
RUN npm install -g pnpm@12.6.0
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/studio/package.json apps/studio/
RUN pnpm install --frozen-lockfile --filter studio
COPY apps/studio apps/studio
RUN pnpm --filter studio build

FROM nginxinc/nginx-unprivileged:1.29-alpine
COPY apps/studio/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/studio/dist /usr/share/nginx/html
EXPOSE 8080
