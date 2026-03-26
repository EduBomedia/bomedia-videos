FROM node:18-bookworm-slim

WORKDIR /app

COPY package.json ./
RUN npm install

COPY server.js ./
COPY public_audio/ ./public_audio/ 2>/dev/null || mkdir -p public_audio

EXPOSE 3001

CMD ["node", "server.js"]
