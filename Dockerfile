# --- builder stage ---
FROM node:20-alpine AS build
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY ./src ./src
# If you need tests/.htpasswd in the image for Basic Auth:
COPY tests/.htpasswd /etc/httpd/.htpasswd



# --- runtime stage ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY --from=build /app /app
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:8080/ || exit 1
CMD ["npm","start"]
