# Stage 1: Build and test
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build tools for native modules (if needed)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for tests)
RUN npm ci --ignore-scripts && npm cache clean --force

# Copy application code
COPY . .

# Set test environment to skip cron jobs
ENV NODE_ENV=test

# Run tests (allow failure for debugging in pipeline)


# Stage 2: Production image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --production --ignore-scripts && npm cache clean --force

# Copy application code from builder
COPY --from=builder /app ./

# Expose default Express port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start application
CMD ["node", "app.js"]
