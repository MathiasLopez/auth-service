FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json .

ARG NODE_ENV

RUN echo "Build running with NODE_ENV=$NODE_ENV"

RUN if [ "$NODE_ENV" = "production" ]; then npm ci --only=production; else npm ci; fi

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]