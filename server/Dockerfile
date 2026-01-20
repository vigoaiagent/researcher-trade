# Force rebuild v3
FROM node:20-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev

WORKDIR /app

# Copy package files from server folder
COPY server/package*.json ./
COPY server/prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code from server folder
COPY server/src ./src
COPY server/tsconfig.json ./
COPY server/src/prisma/seed.ts ./prisma/seed.ts

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY server/package*.json ./
COPY server/prisma ./prisma/

# Install production dependencies and tsx for seeding
RUN npm ci --omit=dev && npm install tsx

# Generate Prisma client for production
RUN npx prisma generate

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma/seed.ts ./prisma/seed.ts

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Start the application with database migration and seed
CMD ["sh", "-c", "echo 'Starting server...' && echo \"DATABASE_URL set: ${DATABASE_URL:+yes}\" && npx prisma db push --skip-generate && echo 'Database ready!' && npx tsx prisma/seed.ts && echo 'Data seeded!' && npm run start"]
