# syntax=docker/dockerfile:1

# --- Build : export statique de Next + calcul de la CSP ---
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# PRODUCTION=1 refuse l'export s'il reste des valeurs manquantes ([EMAIL], [PRIX]…).
ARG PRODUCTION=0
RUN npm run build && PRODUCTION=$PRODUCTION npm run check:placeholders

# --- Service : nginx sert out/ ---
FROM nginx:1.30-alpine
COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY deploy/nginx/headers.inc.template /etc/nginx/templates/headers.inc.template
COPY --from=build /app/build/csp/csp.inc /etc/nginx/conf.d/csp.inc
COPY --from=build /app/out /usr/share/nginx/html
ENV ROBOTS_TAG="noindex, nofollow"
EXPOSE 80
