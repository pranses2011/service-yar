FROM node:22-alpine AS base

WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npm run start"]
