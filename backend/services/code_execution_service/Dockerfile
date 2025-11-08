FROM node:22.19-bullseye-slim

WORKDIR /app

COPY package*.json ./
RUN npm install -g pnpm && pnpm install

COPY . .

CMD [ "node", "index.js" ]