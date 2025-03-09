# Stage 1: Build the frontend assets
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your code and build the production assets
COPY . .
RUN npm run build-web

# Stage 2: Serve the assets using Nginx
FROM nginx:stable-alpine

# Copy built assets from the previous stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 to serve the app
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
