# Stage 1: Build the application
FROM node:20.19-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

ARG MSA_PROJECT
ARG MSA_VERSION
ARG MSA_PORT
ARG OPS_BACKEND_URL=http://185.76.212.27

RUN echo "Building ${MSA_PROJECT}-${MSA_VERSION} exposing at ${MSA_PORT}"

COPY --from=builder /app/dist/web-urbanoa/browser /usr/share/nginx/html
COPY --from=builder /app/src/assets /usr/share/nginx/html/web-urbanoa/browser/assets
COPY --from=builder /app/deploy/nginx.conf.template /tmp/nginx.conf.template
RUN sed "s|__OPS_BACKEND_URL__|${OPS_BACKEND_URL}|g" \
    /tmp/nginx.conf.template \
    > /etc/nginx/conf.d/default.conf

EXPOSE 10213

CMD ["nginx", "-g", "daemon off;"]
