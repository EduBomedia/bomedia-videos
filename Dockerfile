FROM node:18-bookworm-slim

# Instalar librerías del sistema necesarias para Chromium + Remotion
RUN apt-get update && apt-get install -y \
  chromium \
  libnspr4 \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libasound2 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libxshmfence1 \
  fonts-liberation \
  fonts-noto \
  ffmpeg \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Decirle a Remotion dónde está Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV REMOTION_CHROME_HEADLESS_SHELL=/usr/bin/chromium

WORKDIR /app

# Instalar dependencias Node
COPY package.json ./
RUN npm install --omit=dev

# Copiar código fuente
COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
