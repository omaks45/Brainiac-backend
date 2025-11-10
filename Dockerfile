# Use Node.js 18 (matches your .nvmrc)
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .npmrc ./

# Install dependencies (respects your .npmrc legacy-peer-deps)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files and .npmrc
COPY package*.json ./
COPY .npmrc ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create uploads directory (from your MAX_FILE_SIZE config)
RUN mkdir -p ./uploads

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "dist/main"]