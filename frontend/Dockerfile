FROM node:18-alpine AS development

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev", "--", "--host"]

# Production build stage
FROM development AS builder
RUN npm run build

# Production serve stage
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy custom Nginx configuration if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
