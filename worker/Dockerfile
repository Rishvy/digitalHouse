FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  ghostscript \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
COPY config ./config

RUN npm run build

EXPOSE 4010
CMD ["npm", "run", "start"]
