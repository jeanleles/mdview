FROM node:24-alpine AS builder

# Next.js evaluates server modules during the build. The application receives
# the real secret from env_file at container runtime, not from this build value.
ENV JWT_SECRET=build-only-placeholder-secret-at-least-32-characters

RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:24-alpine AS runner

RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/drizzle ./drizzle

EXPOSE 3000

CMD ["node", "server.js"]
