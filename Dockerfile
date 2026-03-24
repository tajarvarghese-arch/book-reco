FROM node:20-slim

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

# Build Next.js
RUN npm run build

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", ".next/standalone/server.js"]
