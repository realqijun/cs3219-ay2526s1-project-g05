FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install -g pnpm && pnpm install

COPY . .

# hard coded code execution service port
EXPOSE 4005

CMD [ "node", "index.js" ]
# CMD ["sh", "-c", "echo \"Runtime variable value: $CODEEXECUTIONPORT\""]