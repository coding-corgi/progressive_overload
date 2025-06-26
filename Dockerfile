FROM node:20

WORKDIR /app

COPY . .

RUN corepack enable
RUN corepack prepare pnpm@latest --activate
RUN pnpm install

RUN pnpm run build

EXPOSE 3000