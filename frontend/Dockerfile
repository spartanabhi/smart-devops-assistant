# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm ci || npm install

# Copy source code and build
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine

# Install curl for healthchecks
RUN apk add --no-cache curl

# Copy built assets to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
