FROM node:20-slim AS builder

# Install build tools for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and data
COPY . .

# Rebuild better-sqlite3 for Linux
RUN npm rebuild better-sqlite3

# Build Next.js standalone
RUN npm run build

# Copy static assets into standalone dir
RUN cp -r .next/static .next/standalone/.next/static
RUN cp -r public .next/standalone/public
RUN cp -r data .next/standalone/data

# Production image
FROM node:20-slim

WORKDIR /app

# Copy the fully assembled standalone build
COPY --from=builder /app/.next/standalone ./

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
